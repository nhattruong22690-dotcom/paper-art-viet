import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Lấy toàn bộ danh sách sản phẩm.
 */
export async function getAllProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      bom (
        id,
        version,
        is_active
      )
    `)
    .order('name', { ascending: true });

  if (error) throw error;

  // Transform to camelCase and include version count
  const mapped = (products || []).map(p => {
    const activeBom = (p.bom || []).find((b: any) => b.is_active) || p.bom?.[0];
    
    return {
      id: p.id,
      sku: p.code,
      name: p.name,
      unit: p.unit,
      basePrice: Number(p.base_price || 0),
      costPrice: Number(p.cost_price || 0),
      wholesalePrice: Number(p.wholesale_price || 0),
      exportPrice: Number(p.export_price || 0),
      productionTimeStd: p.production_time_std,
      cogsConfig: p.cogs_config,
      versionCount: (p.bom || []).length,
      activeBomId: activeBom?.id
    };
  });

  return mapped;
}

/**
 * Lấy chi tiết sản phẩm kèm các phiên bản BOM.
 */
export async function getProductDetail(id: string) {
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      bom (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Lấy thêm BOM detail cho version active (hoặc version mới nhất)
  const activeBom = (product.bom || []).find((b: any) => b.is_active) || product.bom?.[0];
  let bomDetails = null;
  let bomOperations = [];

  if (activeBom) {
    const { data: details } = await supabase
      .from('bom')
      .select(`
        *,
        bom_materials (*, materials (*)),
        bom_operations (*, operations (*))
      `)
      .eq('id', activeBom.id)
      .single();
    
    if (details) {
      bomOperations = details.bom_operations || [];
      // Ánh xạ về format cũ để không làm gãy UI ngay lập tức
      bomDetails = (details.bom_materials || []).map((bm: any) => ({
        id: bm.id,
        materialId: bm.material_id,
        quantity: Number(bm.qty),
        material: bm.materials ? {
          id: bm.materials.id,
          sku: bm.materials.type,
          name: bm.materials.specification,
          unit: bm.materials.unit,
          referencePrice: Number(bm.materials.price || 0),
          unitPrice: Number(bm.materials.price || 0)
        } : null
      }));
    }
  }

  return {
    id: product.id,
    sku: product.code,
    name: product.name,
    unit: product.unit,
    basePrice: Number(product.base_price || 0),
    costPrice: Number(product.cost_price || 0),
    wholesalePrice: Number(product.wholesale_price || 0),
    exportPrice: Number(product.export_price || 0),
    productionTimeStd: product.production_time_std,
    cogsConfig: product.cogs_config,
    bomVersions: product.bom || [],
    bomItems: bomDetails, // compatibility mapping
    bomOperations: bomOperations
  };
}

/**
 * Tính toán lại giá vốn từ BOM và cập nhật vào bảng products.
 */
export async function recalculateProductCostPrice(productId: string) {
  const { data: activeBom } = await supabase
    .from('bom')
    .select('id')
    .eq('product_id', productId)
    .eq('is_active', true)
    .single();
  
  if (!activeBom) return null;

  const { calculateBOMCost } = await import('./bom.service');
  const costData = await calculateBOMCost(activeBom.id);

  const { error: updateError } = await supabase
    .from('products')
    .update({ 
      cost_price: costData.totalCost,
      base_price: costData.totalCost,
      wholesale_price: costData.totalCost * 1.3,
      export_price: costData.totalCost * 2.4
    })
    .eq('id', productId);

  if (updateError) throw updateError;

  return await getProductDetail(productId);
}

/**
 * Cập nhật BOM cho sản phẩm (sẽ tạo một phiên bản BOM mới hoặc cập nhật bản hiện tại).
 */
export async function updateProductBOM(
  productId: string, 
  items: { materialId: string, quantity: number }[],
  operations: { operationId: string, sequence: number }[] = []
) {
  // Tìm BOM đang active
  let { data: activeBom } = await supabase
    .from('bom')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .single();

  if (!activeBom) {
    // Tạo mới nếu chưa có
    const { data: newBom, error: createError } = await supabase
      .from('bom')
      .insert({ product_id: productId, version: 1, is_active: true, note: 'Initial BOM' })
      .select()
      .single();
    if (createError) throw createError;
    activeBom = newBom;
  }

  // Sử dụng upsertBOM từ bom.service để xử lý đồng bộ
  const { upsertBOM } = await import('./bom.service');
  
  await upsertBOM(
    { id: activeBom.id, product_id: productId },
    items.map(m => ({ material_id: m.materialId, qty: m.quantity, scrap_rate: 0.05 })),
    operations.map(o => ({ operation_id: o.operationId, sequence: o.sequence }))
  );

  // Tự động tính lại giá
  await recalculateProductCostPrice(productId);

  return await getProductDetail(productId);
}

/**
 * Tạo một phiên bản BOM mới cho sản phẩm.
 */
export async function createNewBOMVersion(
  productId: string, 
  items: { materialId: string, quantity: number }[],
  operations: { operationId: string, sequence: number }[] = []
) {
  // 1. Lấy phiên bản lớn nhất hiện tại
  const { data: boms } = await supabase
    .from('bom')
    .select('version')
    .eq('product_id', productId)
    .order('version', { ascending: false })
    .limit(1);
    
  const nextVersion = (boms && boms.length > 0) ? (Number(boms[0].version) + 1) : 1;

  // 2. Set tất cả BOM cũ thành inactive
  await supabase
    .from('bom')
    .update({ is_active: false })
    .eq('product_id', productId);

  // 3. Tạo BOM mới
  const { data: newBom, error: createError } = await supabase
    .from('bom')
    .insert({ 
      product_id: productId, 
      version: nextVersion, 
      is_active: true, 
      note: `Version ${nextVersion} created on ${new Date().toLocaleDateString()}` 
    })
    .select()
    .single();

  if (createError) throw createError;

  // 4. Thêm vật tư và công đoạn vào BOM mới
  const { upsertBOM } = await import('./bom.service');
  await upsertBOM(
    { id: newBom.id, product_id: productId },
    items.map(m => ({ material_id: m.materialId, qty: m.quantity, scrap_rate: 0.05 })),
    operations.map(o => ({ operation_id: o.operationId, sequence: o.sequence }))
  );

  // 5. Tự động tính lại giá
  await recalculateProductCostPrice(productId);

  return await getProductDetail(productId);
}

/**
 * Thêm hoặc cập nhật sản phẩm.
 */
export async function upsertProduct(data: any) {
  const { id, ...updateData } = data;
  
  const dbData: any = {};
  if ('sku' in updateData) dbData.code = updateData.sku;
  if ('name' in updateData) dbData.name = updateData.name;
  if ('unit' in updateData) dbData.unit = updateData.unit;
  if ('basePrice' in updateData) dbData.base_price = updateData.basePrice;
  if ('wholesalePrice' in updateData) dbData.wholesale_price = updateData.wholesalePrice;
  if ('exportPrice' in updateData) dbData.export_price = updateData.exportPrice;
  if ('costPrice' in updateData) dbData.cost_price = updateData.costPrice;
  if ('productionTimeStd' in updateData) dbData.production_time_std = updateData.productionTimeStd;
  if ('cogsConfig' in updateData) dbData.cogs_config = updateData.cogsConfig;

  let result;
  if (id) {
    const { data: updated, error } = await supabase
      .from('products')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    result = updated;
  } else {
    const { data: created, error } = await supabase
      .from('products')
      .insert(dbData)
      .select()
      .single();
    if (error) throw error;
    result = created;
  }

  return {
    ...result,
    sku: result.code,
    basePrice: Number(result.base_price || 0),
    costPrice: Number(result.cost_price || 0),
    wholesalePrice: Number(result.wholesale_price || 0),
    exportPrice: Number(result.export_price || 0)
  };
}

/**
 * Thêm hoặc cập nhật hàng loạt sản phẩm (dành cho Import Excel).
 */
export async function batchUpsertProducts(productsData: any[]) {
  const dbData = productsData.map(p => ({
    code: p.sku,
    name: p.name,
    unit: p.unit || 'Sản phẩm',
    base_price: p.basePrice || 0,
    wholesale_price: p.wholesalePrice || 0,
    export_price: p.exportPrice || 0,
    cost_price: p.costPrice || 0,
    production_time_std: p.productionTimeStd || 0,
    cogs_config: p.cogsConfig || {}
  }));

  const { data, error } = await supabase
    .from('products')
    .upsert(dbData, { onConflict: 'code' })
    .select();

  if (error) throw error;
  return data;
}

/**
 * Xóa một sản phẩm khỏi danh mục.
 * Ràng buộc DB (BOM) được cấu hình CASCADE để xóa sạch dữ liệu liên quan.
 * Snapshot trong đơn hàng không bị ảnh hưởng nhờ logic snapshot.
 */
export async function deleteProduct(id: string) {
  const { data, error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
