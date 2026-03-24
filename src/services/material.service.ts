import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Lấy danh sách vật tư kèm tìm kiếm và lọc.
 */
export async function getMaterials(params: {
  search?: string;
  type?: string;
}) {
  const { search, type } = params;
  let query = supabase.from('Material').select('*').order('name', { ascending: true });

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Convert to numbers and apply smart price logic for all consumers
  const mapped = (data || []).map(m => {
    const minStock = Number(m.min_stock || 0);
    const stockQuantity = Number(m.stock_quantity || 0);
    let refPrice = Number(m.reference_price || 0);
    const purchasePrice = Number(m.purchase_price || 0);
    const purchaseQuantity = Number(m.purchase_quantity || 0);
    const unitPrice = Number(m.unit_price || 0);

    // Fallback: Nếu referencePrice = 0, thử tính từ purchasePrice/purchaseQuantity
    if (refPrice === 0 && purchasePrice > 0 && purchaseQuantity > 0) {
      refPrice = purchasePrice / purchaseQuantity;
    }

    return {
      id: m.id,
      name: m.name,
      sku: m.sku,
      unit: m.unit,
      type: m.type,
      minStock,
      stockQuantity,
      referencePrice: refPrice,
      purchasePrice: m.purchase_price ? purchasePrice : null,
      purchaseQuantity: m.purchase_quantity ? purchaseQuantity : null,
      unitPrice: m.unit_price ? unitPrice : null,
      notes: m.notes,
      createdAt: m.created_at,
      updatedAt: m.updated_at
    };
  });

  return mapped;
}

/**
 * Thêm hoặc cập nhật thông tin vật tư.
 */
export async function upsertMaterial(data: any) {
  const dbData: any = {};
  if ('name' in data) dbData.name = data.name;
  if ('sku' in data) dbData.sku = data.sku;
  if ('unit' in data) dbData.unit = data.unit;
  if ('type' in data) dbData.type = data.type;
  if ('minStock' in data) dbData.min_stock = data.minStock;
  if ('stockQuantity' in data) dbData.stock_quantity = data.stockQuantity;
  if ('referencePrice' in data) dbData.reference_price = data.referencePrice;
  if ('purchasePrice' in data) dbData.purchase_price = data.purchasePrice;
  if ('purchaseQuantity' in data) dbData.purchase_quantity = data.purchaseQuantity;
  if ('unitPrice' in data) dbData.unit_price = data.unitPrice;
  if ('notes' in data) dbData.notes = data.notes;

  let result;
  if (data.id) {
    const { data: updated, error } = await supabase
      .from('Material')
      .update(dbData)
      .eq('id', data.id)
      .select()
      .single();
    if (error) throw error;
    result = updated;
  } else {
    const { data: created, error } = await supabase
      .from('Material')
      .insert(dbData)
      .select()
      .single();
    if (error) throw error;
    result = created;
  }

  return {
    ...result,
    minStock: result.min_stock,
    stockQuantity: result.stock_quantity,
    referencePrice: result.reference_price
  };
}

/**
 * Lấy thống kê tồn kho (Cards).
 */
export async function getInventoryStats() {
  const { data: materials, error } = await supabase.from('Material').select('*');
  if (error) throw error;
  
  const totalTypes = materials.length;
  const lowStockCount = materials.filter(m => Number(m.stock_quantity) < Number(m.min_stock)).length;
  const totalValue = materials.reduce((acc, m) => acc + (Number(m.stock_quantity) * Number(m.reference_price)), 0);

  return {
    totalTypes,
    lowStockCount,
    totalValue,
  };
}

/**
 * Xử lý nhập kho vật tư hàng loạt theo Lô (Batch).
 */
export async function createMaterialBatchInward(data: {
  partnerId: string;
  items: {
    materialId: string;
    sku: string;
    quantity: number;
    price: number;
    location?: string;
    note?: string;
    poItemId?: string;
  }[];
}) {
  const todayStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const transactions = [];

  for (const item of data.items) {
    // 1. Tạo Mã Lô: [SKU]-[YYYYMMDD]-[STT]
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const { count, error: countError } = await supabase
      .from('MaterialBatch')
      .select('*', { count: 'exact', head: true })
      .eq('material_id', item.materialId)
      .gte('created_at', startOfDay.toISOString());

    if (countError) throw countError;

    const stt = ((count || 0) + 1).toString().padStart(3, '0');
    const batchCode = `${item.sku}-${todayStr}-${stt}`;

    // 2. Liên kết tới PO Item nếu có
    if (item.poItemId) {
      const { data: poItem, error: poItemError } = await supabase
        .from('PurchaseOrderItem')
        .select('*, purchaseOrder:PurchaseOrder(*, purchaseOrderItems:PurchaseOrderItem(*))')
        .eq('id', item.poItemId)
        .single();

      if (poItemError) throw poItemError;

      const newReceived = (poItem.quantity_received || 0) + item.quantity;
      await supabase
        .from('PurchaseOrderItem')
        .update({ quantity_received: newReceived })
        .eq('id', item.poItemId);

      // Refresh PO data for status check
      const { data: refreshedPO } = await supabase
        .from('PurchaseOrder')
        .select('*, purchaseOrderItems:PurchaseOrderItem(*)')
        .eq('id', poItem.purchase_order_id)
        .single();

      if (refreshedPO) {
        const totalOrdered = (refreshedPO.purchaseOrderItems || []).reduce((acc: number, i: any) => acc + Number(i.quantity_ordered), 0);
        const totalReceived = (refreshedPO.purchaseOrderItems || []).reduce((acc: number, i: any) => acc + Number(i.quantity_received), 0);

        let newStatus = 'partially_received';
        if (totalReceived >= totalOrdered) {
          newStatus = 'completed';
        }

        await supabase
          .from('PurchaseOrder')
          .update({ status: newStatus })
          .eq('id', refreshedPO.id);
      }
    }

    // 3. Tạo lô hàng (MaterialBatch)
    const { data: batch, error: batchError } = await supabase
      .from('MaterialBatch')
      .insert({
        batch_code: batchCode,
        material_id: item.materialId,
        purchase_price: item.price,
        initial_quantity: item.quantity,
        remain_quantity: item.quantity,
        location: item.location,
        source_po_item_id: item.poItemId,
      })
      .select()
      .single();

    if (batchError) throw batchError;

    // 4. Tạo bản ghi Transaction
    const { data: trans, error: transError } = await supabase
      .from('MaterialTransaction')
      .insert({
        material_id: item.materialId,
        partner_id: data.partnerId,
        batch_id: batch.id,
        type: 'inward',
        quantity: item.quantity,
        price: item.price,
        note: item.note || `Nhập lô mới: ${batchCode}`,
      })
      .select()
      .single();

    if (transError) throw transError;
    transactions.push(trans);

    // 5. Cập nhật tồn kho tổng của Material
    const { data: material } = await supabase.from('Material').select('stock_quantity').eq('id', item.materialId).single();
    if (material) {
      await supabase
        .from('Material')
        .update({
          stock_quantity: (material.stock_quantity || 0) + item.quantity,
          reference_price: item.price
        })
        .eq('id', item.materialId);
    }
  }

  return transactions;
}

/**
 * Lấy danh sách lô hàng còn tồn của 1 vật tư (FIFO).
 */
export async function getMaterialBatches(materialId: string) {
  const { data, error } = await supabase
    .from('MaterialBatch')
    .select('*')
    .eq('material_id', materialId)
    .gt('remain_quantity', 0)
    .order('created_at', { ascending: true }); // FIFO

  if (error) throw error;
  
  return (data || []).map(b => ({
    ...b,
    batchCode: b.batch_code,
    materialId: b.material_id,
    purchasePrice: b.purchase_price,
    initialQuantity: b.initial_quantity,
    remainQuantity: b.remain_quantity
  }));
}

/**
 * Lấy lịch sử giao dịch của 1 vật tư.
 */
export async function getMaterialHistory(materialId: string) {
  const { data, error } = await supabase
    .from('MaterialTransaction')
    .select(`
      *,
      partner:Partner(*)
    `)
    .eq('material_id', materialId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(t => ({
    ...t,
    materialId: t.material_id,
    partnerId: t.partner_id,
    batchId: t.batch_id,
    quantity: t.quantity,
    price: t.price
  }));
}
