import { supabaseAdmin as supabase } from '@/lib/supabase';

export interface Supplier {
  id: string;
  name: string;
  tax_id?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  main_material_type?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Lấy danh sách Nhà cung cấp.
 */
export async function getSuppliers(params: { search?: string; onlyActive?: boolean } = {}) {
  let query = supabase
    .from('Supplier')
    .select('*')
    .order('name', { ascending: true });

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
  }

  if (params.onlyActive) {
    query = query.eq('active', true);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return (data || []).map(s => ({
    ...s,
    taxId: s.tax_id,
    contactPerson: s.contact_person,
    mainMaterialType: s.main_material_type
  }));
}

/**
 * Lấy chi tiết Nhà cung cấp kèm theo việc check xem có đơn mua hàng nào không.
 */
export async function getSupplierDetail(id: string) {
  const { data: supplier, error } = await supabase
    .from('Supplier')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // Kiểm tra xem có PO liên quan không
  const { count } = await supabase
    .from('PurchaseOrder')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', id);

  return {
    ...supplier,
    taxId: supplier.tax_id,
    contactPerson: supplier.contact_person,
    mainMaterialType: supplier.main_material_type,
    hasPurchaseOrders: (count || 0) > 0
  };
}

/**
 * Thêm hoặc Cập nhật NCC.
 */
export async function upsertSupplier(data: any) {
  const { id, ...updateData } = data;
  
  const dbData: any = {
    name: updateData.name,
    tax_id: updateData.taxId,
    contact_person: updateData.contactPerson,
    phone: updateData.phone,
    email: updateData.email,
    address: updateData.address,
    main_material_type: updateData.mainMaterialType,
    active: updateData.active ?? true,
    updated_at: new Date().toISOString()
  };

  if (id) {
    const { data: updated, error } = await supabase
      .from('Supplier')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updated;
  } else {
    const { data: created, error } = await supabase
      .from('Supplier')
      .insert(dbData)
      .select()
      .single();
    
    if (error) throw error;
    return created;
  }
}

/**
 * Xóa hoặc Ngừng hoạt động Nhà cung cấp.
 */
export async function deleteSupplier(id: string) {
  // Check PO constraint
  const { count } = await supabase
    .from('PurchaseOrder')
    .select('*', { count: 'exact', head: true })
    .eq('supplier_id', id);

  if ((count || 0) > 0) {
    // Chỉ deactivate
    const { error } = await supabase
      .from('Supplier')
      .update({ active: false })
      .eq('id', id);
    if (error) throw error;
    return { status: 'deactivated', message: 'NCC đã có Đơn hàng nên chỉ chuyển sang Ngừng hoạt động.' };
  } else {
    // Xóa vĩnh viễn
    const { error } = await supabase
      .from('Supplier')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { status: 'deleted', message: 'Đã xóa Nhà cung cấp thành công.' };
  }
}
