import { supabase } from '@/lib/supabase';
import { Material } from '@/types/bom';

// --- NEW BOM SYSTEM (materials table) ---

/**
 * Láy danh sách toàn bộ vật tư từ hệ thống BOM mới.
 */
export async function getAllMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('type', { ascending: true });

  if (error) throw error;
  return data as Material[];
}

/**
 * Thêm mới hoặc cập nhật vật tư cho hệ thống BOM mới.
 */
export async function upsertMaterial(material: Partial<Material>) {
  const { data, error } = await supabase
    .from('materials')
    .upsert(material)
    .select()
    .single();

  if (error) throw error;
  return data as Material;
}

/**
 * Thêm hàng loạt vật tư.
 */
export async function bulkUpsertMaterials(materials: Partial<Material>[]) {
  const { data, error } = await supabase
    .from('materials')
    .upsert(materials)
    .select();

  if (error) throw error;
  return data as Material[];
}

/**
 * Xóa một vật tư khỏi hệ thống BOM mới.
 */
export async function deleteMaterial(id: string) {
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// --- LEGACY ERP SYSTEM (Material & MaterialBatch tables) ---

/**
 * Lấy danh sách vật tư từ hệ thống ERP cũ (Dùng cho InventoryDashboard).
 */
export async function getMaterials(params: any = {}) {
  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  return (data || []).map(m => ({
    id: m.id,
    sku: m.code,
    name: m.name,
    unit: m.unit,
    stockQuantity: m.stock_quantity || 0,
    minStock: m.min_stock || 0,
    referencePrice: m.price || 0,
    unitPrice: m.price || 0,
    type: m.type,
    category: m.category,
    active: m.active
  }));
}

/**
 * Tính toán thống kê kho từ bảng Material cũ.
 */
export async function getInventoryStats() {
  const { data: materials, error } = await supabase
    .from('materials')
    .select('stock_quantity, min_stock, price');

  if (error) throw error;

  const totalTypes = materials?.length || 0;
  const lowStockCount = (materials || []).filter(m => (Number(m.stock_quantity) || 0) < (Number(m.min_stock) || 0)).length;
  const totalValue = (materials || []).reduce((acc, m) => acc + ((Number(m.stock_quantity) || 0) * (Number(m.price) || 0)), 0);

  return {
    totalTypes,
    lowStockCount,
    totalValue
  };
}

/**
 * Lấy danh sách lô vật tư (Dùng cho TeamWorkLog & InventoryDashboard).
 */
export async function getMaterialBatches(materialId: string) {
  const { data, error } = await supabase
    .from('MaterialBatch')
    .select('*')
    .eq('material_id', materialId)
    .gt('remain_quantity', 0)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(b => ({
    id: b.id,
    batchCode: b.batch_code,
    purchasePrice: b.purchase_price,
    initialQuantity: b.initial_quantity,
    remainQuantity: b.remain_quantity,
    location: b.location,
    createdAt: b.created_at ? new Date(b.created_at) : new Date()
  }));
}

/**
 * Ghi nhận nhập kho vật tư theo lô (Legacy System).
 */
export async function createMaterialBatchInward(data: {
  partnerId: string;
  items: {
    materialId: string;
    sku: string;
    quantity: number;
    price: number;
    location: string;
    note: string;
    poItemId?: string;
  }[];
}) {
  const { partnerId, items } = data;

  // 1. Tạo các bản ghi lô vật tư (MaterialBatch)
  const batches = items.map(item => ({
    material_id: item.materialId,
    supplier_id: partnerId,
    batch_code: `IN-${new Date().getTime().toString().slice(-6)}-${item.sku}`,
    initial_quantity: Number(item.quantity),
    remain_quantity: Number(item.quantity),
    purchase_price: Number(item.price),
    location: item.location,
    note: item.note,
    status: 'received',
    created_at: new Date().toISOString()
  }));

  const { data: createdBatches, error: batchError } = await supabase
    .from('MaterialBatch')
    .insert(batches)
    .select();

  if (batchError) throw batchError;

  // 2. Cập nhật tổng tồn kho trong bảng materials
  for (const item of items) {
    const { data: mat, error: fetchError } = await supabase
      .from('materials')
      .select('stock_quantity')
      .eq('id', item.materialId)
      .single();

    if (fetchError) throw fetchError;

    const newQty = (Number(mat.stock_quantity) || 0) + Number(item.quantity);

    const { error: updateError } = await supabase
      .from('materials')
      .update({ 
        stock_quantity: newQty,
        price: Number(item.price) // Cập nhật đơn giá tham chiếu là giá nhập mới nhất
      })
      .eq('id', item.materialId);

    if (updateError) throw updateError;
    
    // 3. Nếu có liên kết với PO item, cập nhật số lượng thực nhận trong PurchaseOrderItem
    if (item.poItemId) {
      const { data: poItem } = await supabase
        .from('PurchaseOrderItem')
        .select('quantity_received')
        .eq('id', item.poItemId)
        .single();
        
      if (poItem) {
        await supabase
          .from('PurchaseOrderItem')
          .update({ 
            quantity_received: (Number(poItem.quantity_received) || 0) + Number(item.quantity) 
          })
          .eq('id', item.poItemId);
      }
    }
  }

  return createdBatches;
}
