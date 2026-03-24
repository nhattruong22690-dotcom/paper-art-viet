import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Lấy toàn bộ danh sách sản phẩm.
 */
export async function getAllProducts() {
  const { data: products, error } = await supabase
    .from('Product')
    .select(`
      *,
      bomItems:BOMItem(
        *,
        material:Material(*)
      )
    `)
    .order('name', { ascending: true });

  if (error) throw error;

  // Normalize and transform to camelCase
  const mapped = (products || []).map(p => {
    const bomItems = (p.bomItems || []).map((bi: any) => {
      let refPrice = Number(bi.material?.reference_price || 0);
      if (refPrice === 0 && bi.material?.purchase_price && bi.material?.purchase_quantity && Number(bi.material?.purchase_quantity) > 0) {
        refPrice = Number(bi.material.purchase_price) / Number(bi.material.purchase_quantity);
      }
      return {
        id: bi.id,
        productId: bi.product_id,
        materialId: bi.material_id,
        quantity: Number(bi.quantity || 0),
        material: bi.material ? {
          id: bi.material.id,
          sku: bi.material.sku,
          name: bi.material.name,
          unit: bi.material.unit,
          referencePrice: refPrice,
          unitPrice: Number(bi.material.unit_price || 0),
          stockQuantity: Number(bi.material.stock_quantity || 0)
        } : null
      };
    });

    return {
      id: p.id,
      sku: p.sku,
      name: p.name,
      basePrice: Number(p.base_price || 0),
      costPrice: Number(p.cost_price || 0),
      wholesalePrice: Number(p.wholesale_price || 0),
      exportPrice: Number(p.export_price || 0),
      productionTimeStd: p.production_time_std,
      cogsConfig: p.cogs_config,
      bomItems
    };
  });

  return mapped;
}

/**
 * Lấy chi tiết sản phẩm kèm BOM.
 */
export async function getProductDetail(id: string) {
  const { data: product, error } = await supabase
    .from('Product')
    .select(`
      *,
      bomItems:BOMItem(
        *,
        material:Material(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  // Normalize materials in BOM and product prices
  const bomItems = (product.bomItems || []).map((bi: any) => {
    let refPrice = Number(bi.material?.reference_price || 0);
    if (refPrice === 0 && bi.material?.purchase_price && bi.material?.purchase_quantity && Number(bi.material?.purchase_quantity) > 0) {
      refPrice = Number(bi.material.purchase_price) / Number(bi.material.purchase_quantity);
    }
    return {
      id: bi.id,
      productId: bi.product_id,
      materialId: bi.material_id,
      quantity: Number(bi.quantity || 0),
      material: bi.material ? {
        id: bi.material.id,
        sku: bi.material.sku,
        name: bi.material.name,
        unit: bi.material.unit,
        referencePrice: refPrice,
        unitPrice: Number(bi.material.unit_price || 0)
      } : null
    };
  });

  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    basePrice: Number(product.base_price || 0),
    costPrice: Number(product.cost_price || 0),
    wholesalePrice: Number(product.wholesale_price || 0),
    exportPrice: Number(product.export_price || 0),
    productionTimeStd: product.production_time_std,
    cogsConfig: product.cogs_config,
    bomItems
  };
}

/**
 * Tính toán lại giá vốn từ BOM và cập nhật vào bảng Product.
 */
export async function recalculateProductCostPrice(productId: string) {
  const product = await getProductDetail(productId);
  if (!product) return null;

  let totalCost = 0;
  product.bomItems.forEach((item: any) => {
    const price = Number(item.material?.unitPrice || item.material?.referencePrice || 0);
    totalCost += price * Number(item.quantity);
  });

  const oldPrice = Number(product.costPrice || 0);
  
  const { error: updateError } = await supabase
    .from('Product')
    .update({ cost_price: totalCost })
    .eq('id', productId);

  if (updateError) throw updateError;

  const updatedProduct = await getProductDetail(productId);

  return {
    oldPrice,
    newPrice: totalCost,
    product: updatedProduct
  };
}

/**
 * Cập nhật BOM cho sản phẩm.
 */
export async function updateProductBOM(
  productId: string, 
  items: { materialId: string, quantity: number }[]
) {
  // 1. Xóa BOM cũ
  const { error: deleteError } = await supabase
    .from('BOMItem')
    .delete()
    .eq('product_id', productId);

  if (deleteError) throw deleteError;

  // 2. Thêm BOM mới
  if (items.length > 0) {
    const { error: insertError } = await supabase
      .from('BOMItem')
      .insert(items.map(item => ({
        product_id: productId,
        material_id: item.materialId,
        quantity: item.quantity
      })));
    
    if (insertError) throw insertError;
  }

  // 3. Tự động tính lại giá vốn
  await recalculateProductCostPrice(productId);

  return await getProductDetail(productId);
}

/**
 * Cập nhật cấu hình COGS của sản phẩm.
 */
export async function updateProductCOGS(
  productId: string, 
  cogsConfig: any
) {
  const { data, error } = await supabase
    .from('Product')
    .update({ cogs_config: cogsConfig })
    .eq('id', productId)
    .select()
    .single();

  if (error) throw error;
  
  return {
    ...data,
    id: data.id,
    cogsConfig: data.cogs_config
  };
}

/**
 * Thêm hoặc cập nhật sản phẩm.
 */
export async function upsertProduct(data: any) {
  const { id, ...updateData } = data;
  
  // Transform to snake_case for DB
  const dbData: any = {};
  if ('sku' in updateData) dbData.sku = updateData.sku;
  if ('name' in updateData) dbData.name = updateData.name;
  if ('basePrice' in updateData) dbData.base_price = updateData.basePrice;
  if ('wholesalePrice' in updateData) dbData.wholesale_price = updateData.wholesalePrice;
  if ('exportPrice' in updateData) dbData.export_price = updateData.exportPrice;
  if ('costPrice' in updateData) dbData.cost_price = updateData.costPrice;
  if ('productionTimeStd' in updateData) dbData.production_time_std = updateData.productionTimeStd;
  if ('cogsConfig' in updateData) dbData.cogs_config = updateData.cogsConfig;

  let result;
  if (id) {
    const { data: updated, error } = await supabase
      .from('Product')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    result = updated;
  } else {
    const { data: created, error } = await supabase
      .from('Product')
      .insert(dbData)
      .select()
      .single();
    
    if (error) throw error;
    result = created;
  }

  return {
    ...result,
    basePrice: Number(result.base_price || 0),
    costPrice: Number(result.cost_price || 0),
    wholesalePrice: Number(result.wholesale_price || 0),
    exportPrice: Number(result.export_price || 0)
  };
}
