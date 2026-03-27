import { supabase } from '@/lib/supabase';
import { Operation } from '@/types/bom';

/**
 * Lấy danh sách toàn bộ công đoạn.
 */
export async function getAllOperations() {
  const { data, error } = await supabase
    .from('operations')
    .select('*')
    .order('type', { ascending: true });

  if (error) throw error;
  return data as Operation[];
}

/**
 * Thêm mới hoặc cập nhật công đoạn.
 */
export async function upsertOperation(operation: Partial<Operation>) {
  const { data, error } = await supabase
    .from('operations')
    .upsert(operation)
    .select()
    .single();

  if (error) throw error;
  return data as Operation;
}

/**
 * Thêm hàng loạt công đoạn.
 */
export async function bulkUpsertOperations(operations: Partial<Operation>[]) {
  const { data, error } = await supabase
    .from('operations')
    .upsert(operations)
    .select();

  if (error) throw error;
  return data as Operation[];
}
