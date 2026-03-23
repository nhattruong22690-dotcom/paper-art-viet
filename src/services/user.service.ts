import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Lấy danh sách nhân viên xưởng (workers).
 */
export async function getWorkers() {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('role', 'worker')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  
  return (data || []).map(user => ({
    ...user,
    id: user.id,
    name: user.name,
    role: user.role,
    active: user.active
  }));
}
