import { supabaseAdmin as supabase } from '@/lib/supabase';

export interface Workshop {
  id: string;
  name: string;
  location?: string;
  managerId?: string;
  active: boolean;
  managerName?: string;
}

export interface Outsourcer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  specialization?: string;
  rating?: number;
  active: boolean;
}

/**
 * WORKSHOPS (Nội bộ)
 */
export async function getWorkshops() {
  const { data, error } = await supabase
    .from('Workshop')
    .select(`
      *,
      manager:Employees(full_name)
    `)
    .order('name', { ascending: true });

  if (error) throw error;
  
  return (data || []).map(w => ({
    ...w,
    managerId: w.manager_id,
    managerName: w.manager?.full_name
  })) as Workshop[];
}

export async function upsertWorkshop(data: any) {
  const { id, ...updateData } = data;
  const dbData = {
    name: updateData.name,
    location: updateData.location,
    manager_id: updateData.managerId,
    active: updateData.active ?? true,
    updated_at: new Date().toISOString()
  };

  if (id) {
    const { data: updated, error } = await supabase
      .from('Workshop')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  } else {
    const { data: created, error } = await supabase
      .from('Workshop')
      .insert(dbData)
      .select()
      .single();
    if (error) throw error;
    return created;
  }
}

/**
 * OUTSOURCERS (Gia công / Thợ ngoài)
 */
export async function getOutsourcers() {
  const { data, error } = await supabase
    .from('Outsourcer')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data as Outsourcer[];
}

export async function upsertOutsourcer(data: any) {
  const { id, ...updateData } = data;
  const dbData = {
    name: updateData.name,
    phone: updateData.phone,
    address: updateData.address,
    specialization: updateData.specialization,
    rating: updateData.rating || 5,
    active: updateData.active ?? true,
    updated_at: new Date().toISOString()
  };

  if (id) {
    const { data: updated, error } = await supabase
      .from('Outsourcer')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return updated;
  } else {
    const { data: created, error } = await supabase
      .from('Outsourcer')
      .insert(dbData)
      .select()
      .single();
    if (error) throw error;
    return created;
  }
}

export async function deleteFacility(type: 'workshop' | 'outsourcer', id: string) {
  const table = type === 'workshop' ? 'Workshop' : 'Outsourcer';
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}
