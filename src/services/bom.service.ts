import { supabaseAdmin as supabase } from '@/lib/supabase';
import { BOMWithDetails, BOMCostSnapshot } from '@/types/bom';

/**
 * Lấy danh sách toàn bộ BOM kèm thông tin sản phẩm.
 */
export async function getAllBOMs() {
  const { data, error } = await supabase
    .from('bom')
    .select(`
      *,
      product:products (*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Lấy chi tiết một BOM bao gồm vật tư và công đoạn.
 */
export async function getBOMDetail(bomId: string): Promise<BOMWithDetails> {
  const { data, error } = await supabase
    .from('bom')
    .select(`
      *,
      product:products (*),
      bom_materials (*, materials (*)),
      bom_operations (*, operations (*))
    `)
    .eq('id', bomId)
    .single();

  if (error) throw error;
  return data as BOMWithDetails;
}

/**
 * Tính toán giá thành hiện tại của BOM dựa trên giá vật tư và công đoạn mới nhất.
 * Công thức:
 * - Giá vật tư = SUM(qty * cost * (1 + scrap_rate))
 * - Giá gia công = SUM(cost_per_unit)
 */
export async function calculateBOMCost(bomId: string) {
  const bom = await getBOMDetail(bomId);
  
  const materialCost = bom.bom_materials.reduce((total, item) => {
    const customPrices = bom.product?.cogs_config?.customPrices || {};
    const cost = customPrices[item.material_id] ?? (item.material?.price || 0);
    return total + (item.qty * cost * (1 + item.scrap_rate));
  }, 0);

  const operationCost = bom.bom_operations.reduce((total, item) => {
    const customPrices = bom.product?.cogs_config?.customPrices || {};
    const cost = customPrices[item.operation_id] ?? (item.operation?.price || 0);
    return total + cost;
  }, 0);

  const totalCost = materialCost + operationCost;
  
  // Lấy snapshot gần nhất để so biến động
  const { data: lastSnapshot } = await supabase
    .from('bom_cost_snapshots')
    .select('*')
    .eq('bom_id', bomId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return {
    materialCost,
    operationCost,
    totalCost,
    suggestedPrice: totalCost * 1.3, // Gợi ý margin 30% mặc định
    lastSnapshot: lastSnapshot as BOMCostSnapshot | null
  };
}

/**
 * Lưu snapshot giá thành tại thời điểm hiện tại.
 */
export async function createBOMSnapshot(bomId: string) {
  const { materialCost, operationCost, totalCost } = await calculateBOMCost(bomId);
  
  const { data, error } = await supabase
    .from('bom_cost_snapshots')
    .insert({
      bom_id: bomId,
      material_cost: materialCost,
      operation_cost: operationCost,
      total_cost: totalCost
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Cập nhật hoặc tạo mới BOM.
 */
export async function upsertBOM(bomData: any, materials: any[], operations: any[]) {
  // 1. Upsert BOM main record
  const { data: bom, error: bomError } = await supabase
    .from('bom')
    .upsert(bomData)
    .select()
    .single();

  if (bomError) throw bomError;

  // 2. Sync materials (Delete and Re-insert for simplicity in this MVP)
  await supabase.from('bom_materials').delete().eq('bom_id', bom.id);
  if (materials.length > 0) {
    const { error: matError } = await supabase
      .from('bom_materials')
      .insert(materials.map(m => ({ ...m, bom_id: bom.id })));
    if (matError) throw matError;
  }

  // 3. Sync operations
  await supabase.from('bom_operations').delete().eq('bom_id', bom.id);
  if (operations.length > 0) {
    const { error: opError } = await supabase
      .from('bom_operations')
      .insert(operations.map(o => ({ ...o, bom_id: bom.id })));
    if (opError) throw opError;
  }

  return bom;
}
