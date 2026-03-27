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
