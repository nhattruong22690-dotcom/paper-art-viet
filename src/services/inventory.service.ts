import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function getInventoryStatus() {
  const { data, error } = await supabase
    .from('InventoryLocation')
    .select(`
      *,
      partner:Partner(*)
    `)
    .order('last_updated', { ascending: false });

  if (error) throw error;

  // Map lại kết quả để UI hiển thị dễ dàng
  return (data || []).map((item) => {
    const isOutsourced = !!item.current_location_id;
    return {
      id: item.id,
      itemName: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      currentLocationId: item.current_location_id,
      isReadyForAssembly: item.is_ready_for_assembly,
      lastUpdated: item.last_updated,
      partner: item.partner,
      locationStatus: isOutsourced 
        ? `Gia công ngoài (Xưởng: ${item.partner?.name || 'Không xác định'})` 
        : 'Kho nội bộ',
    };
  });
}

/**
 * Gửi vật tư đi gia công ngoài
 */
export async function sendToOutsource(itemId: string, partnerId: string) {
  const { data, error } = await supabase
    .from('InventoryLocation')
    .update({
      current_location_id: partnerId,
      last_updated: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Hoàn thành gia công, chuyển hàng về kho nội bộ
 */
export async function completeOutsource(itemId: string) {
  const { data, error } = await supabase
    .from('InventoryLocation')
    .update({
      current_location_id: null,
      is_ready_for_assembly: true,
      last_updated: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
