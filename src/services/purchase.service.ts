import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Lấy danh sách Đơn mua hàng (PO).
 */
export async function getPurchaseOrders(params: {
  search?: string;
  status?: string;
  supplierId?: string;
}) {
  const { search, status, supplierId } = params;
  let query = supabase
    .from('PurchaseOrder')
    .select(`
      *,
      supplier:Supplier(*),
      purchaseOrderItems:PurchaseOrderItem(count)
    `)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.ilike('po_number', `%${search}%`);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(po => ({
    id: po.id,
    poNumber: po.po_number,
    supplierId: po.supplier_id,
    status: po.status,
    totalAmount: po.total_amount,
    expectedDeliveryDate: po.expected_delivery_date,
    notes: po.notes,
    createdAt: po.created_at,
    supplier: po.supplier,
    itemCount: po.purchaseOrderItems?.[0]?.count || 0
  }));
}

/**
 * Lấy chi tiết một PO kèm danh sách sản phẩm.
 */
export async function getPOWithItems(id: string) {
  const { data: po, error } = await supabase
    .from('PurchaseOrder')
    .select(`
      *,
      supplier:Supplier(*),
      purchaseOrderItems:PurchaseOrderItem(
        *,
        material:Material(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return {
    id: po.id,
    poNumber: po.po_number,
    supplierId: po.supplier_id,
    status: po.status,
    totalAmount: po.total_amount,
    expectedDeliveryDate: po.expected_delivery_date,
    notes: po.notes,
    createdAt: po.created_at,
    supplier: po.supplier,
    items: (po.purchaseOrderItems || []).map((item: any) => ({
      id: item.id,
      purchaseOrderId: item.purchase_order_id,
      materialId: item.material_id,
      quantityOrdered: item.quantity_ordered,
      quantityReceived: item.quantity_received,
      expectedPrice: item.expected_price,
      totalExpected: item.total_expected,
      material: item.material
    }))
  };
}

/**
 * Tạo mới Đơn mua hàng (Thường ở trạng thái 'draft').
 */
export async function createPurchaseOrder(data: {
  supplierId: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: {
    materialId: string;
    quantityOrdered: number;
    expectedPrice: number;
  }[];
}) {
  // Sinh số PO tự động: PO-YYYYMMDD-XXXX
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from('PurchaseOrder')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay.toISOString());

  if (countError) throw countError;

  const poNumber = `PO-${dateStr}-${((count || 0) + 1).toString().padStart(4, '0')}`;

  const totalAmount = data.items.reduce((acc, item) => 
    acc + (item.quantityOrdered * item.expectedPrice), 0);

  const { data: po, error: poError } = await supabase
    .from('PurchaseOrder')
    .insert({
      po_number: poNumber,
      supplier_id: data.supplierId,
      expected_delivery_date: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate).toISOString() : null,
      notes: data.notes,
      total_amount: totalAmount,
      status: 'draft',
    })
    .select()
    .single();

  if (poError) throw poError;

  if (data.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('PurchaseOrderItem')
      .insert(data.items.map(item => ({
        purchase_order_id: po.id,
        material_id: item.materialId,
        quantity_ordered: item.quantityOrdered,
        expected_price: item.expectedPrice,
        total_expected: item.quantityOrdered * item.expectedPrice
      })));
    
    if (itemsError) throw itemsError;
  }

  return {
    ...po,
    poNumber: po.po_number,
    supplierId: po.supplier_id,
    totalAmount: po.total_amount,
    status: po.status
  };
}

/**
 * Cập nhật trạng thái Đơn mua hàng.
 */
export async function updatePOStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('PurchaseOrder')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    status: data.status
  };
}

/**
 * Lấy danh sách Nhà cung cấp (từ bảng Supplier mới).
 */
export async function getSuppliersForDropdown() {
  const { data, error } = await supabase
    .from('Supplier')
    .select('id, name')
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Cập nhật một Partner thành Nhà cung cấp.
 */
export async function setAsSupplier(id: string, category?: string) {
  const { data, error } = await supabase
    .from('Partner')
    .update({ 
      is_supplier: true,
      partner_category: category 
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
