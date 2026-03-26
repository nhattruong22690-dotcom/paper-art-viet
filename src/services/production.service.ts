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
      employee:Employees(*)
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
    employee: log.employee
  }));
}

export async function getWorkerPerformance() {
  const { data: employees, error } = await supabase
    .from('Employees')
    .select(`
      *,
      workLogs:WorkLog(
        *,
        productionOrder:ProductionOrder(*)
      )
    `)
    .eq('status', 'active');

  if (error) throw error;

  return (employees || []).map(emp => {
    const logs = emp.workLogs || [];
    const totalQty = logs.reduce((sum: number, log: any) => sum + (log.quantity_produced || 0), 0);
    const techErrors = logs.reduce((sum: number, log: any) => sum + (log.technical_error_count || 0), 0);
    const matErrors = logs.reduce((sum: number, log: any) => sum + (log.material_error_count || 0), 0);
    
    const kpi = totalQty > 0 ? Math.round(((totalQty - techErrors) / totalQty) * 100) : 0;

    // Tính trend 7 ngày gần nhất
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const trend = last7Days.map(day => {
      const dayLogs = logs.filter((l: any) => {
        const logDate = new Date(l.created_at);
        return logDate.toDateString() === day.toDateString();
      });
      const dayQty = dayLogs.reduce((sum: number, log: any) => sum + (log.quantity_produced || 0), 0);
      const dayTech = dayLogs.reduce((sum: number, log: any) => sum + (log.technical_error_count || 0), 0);
      return dayQty > 0 ? Math.round(((dayQty - dayTech) / dayQty) * 100) : 0;
    });

    return {
      id: emp.employee_code,
      name: emp.full_name,
      group: emp.department || 'Tổ Sản Xuất',
      totalQty,
      kpi,
      techErrors,
      matErrors,
      trend
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

export async function getProductionOrders() {
  const { data, error } = await supabase
    .from('ProductionOrder')
    .select(`
      *,
      product:Product(sku, name),
      order:Order(
        contract_code,
        customer:Customer(name)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(po => ({
    id: po.id,
    sku: po.product?.sku || 'N/A',
    title: po.product?.name || 'Sản phẩm không tên',
    customer: po.order?.customer?.name || 'Khách lẻ',
    quantity: po.quantity_target,
    status: (po.current_status === 'pending' ? 'Pending' : 
            po.current_status === 'processing' ? 'Processing' : 
            po.current_status === 'qc' ? 'QualityControl' : 'Completed') as any,
    dueDate: po.deadline_production ? new Date(po.deadline_production).toLocaleDateString('vi-VN') : 'N/A',
    assignedTo: po.assigned_to,
    priority: (po.priority === 'High' ? 'High' : po.priority === 'Low' ? 'Low' : 'Medium') as any
  }));
}

export async function updateProductionStatus(id: string, status: string) {
  const dbStatus = status === 'Pending' ? 'pending' : 
                   status === 'Processing' ? 'processing' : 
                   status === 'QualityControl' ? 'qc' : 'completed';
                   
  const { error } = await supabase
    .from('ProductionOrder')
    .update({ current_status: dbStatus })
    .eq('id', id);

  if (error) throw error;
}
