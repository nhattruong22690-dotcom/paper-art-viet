import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function getProductionOrdersWithDeadline() {
  const { data: productionOrders, error } = await supabase
    .from('ProductionOrder')
    .select(`
      *,
      product:Product(*),
      order:Order(*)
    `)
    .order('deadline_production', { ascending: true });

  if (error) throw error;

  const now = new Date();

  // Map trả về kèm UI Computed Status để cảnh báo Deadline
  return (productionOrders || []).map((po) => {
    const deadline = po.deadline_production ? new Date(po.deadline_production) : null;
    const isOverdue = deadline ? now > deadline : false;
    
    return {
      id: po.id,
      orderId: po.order_id,
      productId: po.product_id,
      quantityTarget: po.quantity_target,
      quantityCompleted: po.quantity_completed,
      deadlineProduction: po.deadline_production,
      currentStatus: po.current_status,
      allocationType: po.allocation_type,
      assignedTo: po.assigned_to,
      contractPrice: po.contract_price,
      product: po.product ? {
        id: po.product.id,
        name: po.product.name,
        sku: po.product.sku
      } : null,
      order: po.order ? {
        id: po.order.id,
        contractCode: po.order.contract_code,
        deadlineDelivery: po.order.deadline_delivery
      } : null,
      isOverdue,
      deadlineStatus: isOverdue ? 'Quá hạn' : 'Đúng tiến độ',
    };
  });
}

export async function getWorkLogs(params: { date?: string; skip?: number; take?: number }) {
  const { date, skip = 0, take = 20 } = params;
  
  let query = supabase
    .from('WorkLog')
    .select(`
      *,
      productionOrder:ProductionOrder(
        *,
        product:Product(*)
      ),
      user:User(*)
    `)
    .range(skip, skip + take - 1)
    .order('created_at', { ascending: false });

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query = query
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(log => ({
    id: log.id,
    productionOrderId: log.production_order_id,
    userId: log.user_id,
    staffName: log.staff_name,
    startTime: log.start_time,
    endTime: log.end_time,
    quantityProduced: log.quantity_produced,
    technicalErrorCount: log.technical_error_count,
    materialErrorCount: log.material_error_count,
    errorNote: log.error_note,
    status: log.status,
    note: log.note,
    createdAt: log.created_at,
    productionOrder: log.productionOrder ? {
      id: log.productionOrder.id,
      productId: log.productionOrder.product_id,
      quantityTarget: log.productionOrder.quantity_target,
      product: log.productionOrder.product ? {
        id: log.productionOrder.product.id,
        name: log.productionOrder.product.name,
        sku: log.productionOrder.product.sku
      } : null
    } : null,
    user: log.user
  }));
}

export async function getWorkerPerformance() {
  const { data: users, error } = await supabase
    .from('User')
    .select(`
      *,
      workLogs:WorkLog(
        *,
        productionOrder:ProductionOrder(*)
      )
    `)
    .eq('role', 'worker')
    .eq('active', true);

  if (error) throw error;

  return (users || []).map(user => {
    const totalQty = (user.workLogs || []).reduce((sum: number, log: any) => sum + (log.quantity_produced || 0), 0);
    const techErrors = (user.workLogs || []).reduce((sum: number, log: any) => sum + (log.technical_error_count || 0), 0);
    const matErrors = (user.workLogs || []).reduce((sum: number, log: any) => sum + (log.material_error_count || 0), 0);
    
    const kpi = totalQty > 0 ? Math.round(((totalQty - techErrors) / totalQty) * 100) : 0;

    return {
      id: user.id.slice(-6).toUpperCase(),
      name: user.name,
      group: 'Tổ Sản Xuất',
      totalQty,
      kpi,
      techErrors,
      matErrors,
      trend: [80, 85, 82, 88, 90, 87, 89]
    };
  });
}

export async function updateProductionOrder(id: string, data: any) {
  const { data: currentPO, error: fetchError } = await supabase
    .from('ProductionOrder')
    .select('*, workLogs:WorkLog(id)')
    .eq('id', id)
    .single();

  if (fetchError || !currentPO) throw new Error("Production Order not found");

  // Ràng buộc: Không cho phép đổi orderId nếu đã có Work Log
  if (data.orderId && data.orderId !== currentPO.order_id) {
    if (currentPO.workLogs?.length > 0) {
      throw new Error("Không thể thay đổi Đơn hàng liên kết khi lệnh sản xuất đã bắt đầu có ghi chép sản lượng (Work Log).");
    }
  }

  // Transform data to snake_case
  const dbData: any = {};
  if ('orderId' in data) dbData.order_id = data.orderId;
  if ('productId' in data) dbData.product_id = data.productId;
  if ('quantityTarget' in data) dbData.quantity_target = data.quantityTarget;
  if ('quantityCompleted' in data) dbData.quantity_completed = data.quantityCompleted;
  if ('deadlineProduction' in data) dbData.deadline_production = data.deadlineProduction;
  if ('currentStatus' in data) dbData.current_status = data.currentStatus;
  if ('allocationType' in data) dbData.allocation_type = data.allocationType;
  if ('assignedTo' in data) dbData.assigned_to = data.assignedTo;
  if ('contractPrice' in data) dbData.contract_price = data.contractPrice;

  const { data: updated, error: updateError } = await supabase
    .from('ProductionOrder')
    .update(dbData)
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;
  return updated;
}

/**
 * Chia nhỏ Lệnh sản xuất cho một sản phẩm trong đơn hàng.
 */
export async function splitProductionOrders(
  orderId: string, 
  productId: string, 
  allocations: { assignedTo: string; type: 'internal' | 'outsourced'; quantity: number }[]
) {
  // 1. Kiểm tra xem có lệnh nào của sản phẩm này đã có Work Log chưa
  const { data: existingPOs, error: fetchError } = await supabase
    .from('ProductionOrder')
    .select('*, workLogs:WorkLog(id)')
    .eq('order_id', orderId)
    .eq('product_id', productId);

  if (fetchError) throw fetchError;

  const hasLogs = (existingPOs || []).some(po => po.workLogs?.length > 0);
  if (hasLogs) {
    throw new Error("Không thể chia lại lệnh sản xuất khi đã có ghi chép sản lượng (Work Log).");
  }

  // 2. Thực hiện xóa và tạo mới
  const { data: order, error: orderError } = await supabase
    .from('Order')
    .select('deadline_delivery')
    .eq('id', orderId)
    .single();

  const { error: deleteError } = await supabase
    .from('ProductionOrder')
    .delete()
    .eq('order_id', orderId)
    .eq('product_id', productId);

  if (deleteError) throw deleteError;

  const { data: created, error: insertError } = await supabase
    .from('ProductionOrder')
    .insert(allocations.map(alloc => ({
      order_id: orderId,
      product_id: productId,
      quantity_target: alloc.quantity,
      quantity_completed: 0,
      allocation_type: alloc.type,
      assigned_to: alloc.assignedTo,
      outsourced_name: alloc.type === 'outsourced' ? alloc.assignedTo : null,
      current_status: alloc.type === 'internal' ? 'pending' : 'outsourced',
      deadline_production: order?.deadline_delivery || new Date()
    })))
    .select();

  if (insertError) throw insertError;
  return created;
}
