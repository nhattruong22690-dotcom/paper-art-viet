"use server";
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function getProductionOrdersWithDeadline() {
  const { data: productionOrders, error } = await supabase
    .from('ProductionOrder')
    .select(`
      *,
      product:products(*),
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
        sku: po.product.code
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

export async function getWorkLogs(params: { date?: string; productionOrderId?: string; skip?: number; take?: number }) {
  const { date, productionOrderId, skip = 0, take = 20 } = params;
  
  let query = supabase
    .from('WorkLog')
    .select(`
      *,
      productionOrder:ProductionOrder(
        *,
        product:products(*)
      ),
      employee:Employees(*)
    `)
    .range(skip, skip + take - 1)
    .order('start_time', { ascending: false });

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query = query
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());
  }

  if (productionOrderId) {
    query = query.eq('production_order_id', productionOrderId);
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
    quantityProduced: log.quantity,
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
        sku: log.productionOrder.product.code
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
    .eq('status', 'active')
    .eq('is_kpi', true);

  if (error) throw error;

  // JS-side safeguard filter
  const filteredEmployees = (employees || []).filter(emp => emp.is_kpi === true);

  return filteredEmployees.map(emp => {
    const logs = emp.workLogs || [];
    const totalQty = logs.reduce((sum: number, log: any) => sum + (log.quantity || 0), 0);
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
      const dayQty = dayLogs.reduce((sum: number, log: any) => sum + (log.quantity || 0), 0);
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
  if ('status' in data) {
    // Mapping client-side status strings back to database strings if necessary
    const s = data.status;
    dbData.current_status = s === 'Pending' ? 'pending' :
                            s === 'Processing' ? 'in_progress' :
                            s === 'QualityControl' ? 'qc' :
                            s === 'Archived' ? 'archived' : 'completed';
  }
  if ('allocationType' in data) {
    dbData.allocation_type = data.allocationType;
    if (data.allocationType === 'internal') {
      dbData.workshop_id = data.assignedTo || null;
      dbData.outsourcer_id = null;
      // Re-map status if it was outsourced
      if (currentPO.current_status === 'outsourced') {
        dbData.current_status = 'pending';
      }
    } else if (data.allocationType === 'outsourced') {
      dbData.outsourcer_id = data.assignedTo || null;
      dbData.workshop_id = null;
      dbData.current_status = 'outsourced';
    }
  }
  if ('assignedTo' in data) dbData.assigned_to = data.assignedTo;
  if ('priority' in data) dbData.priority = data.priority;
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
  allocations: { assignedTo: string; type: 'internal' | 'outsourced'; quantity: number; deadline?: string }[],
  orderItemId?: string
) {
  // 1. Kiểm tra xem có lệnh nào của sản phẩm/dòng này đã có Work Log chưa
  let query = supabase
    .from('ProductionOrder')
    .select('*, workLogs:WorkLog(id)')
    .eq('order_id', orderId);

  if (orderItemId) {
    query = query.eq('order_item_id', orderItemId);
  } else {
    query = query.eq('product_id', productId);
  }

  const { data: existingPOs, error: fetchError } = await query;

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

  let deleteQuery = supabase
    .from('ProductionOrder')
    .delete()
    .eq('order_id', orderId);

  if (orderItemId) {
    deleteQuery = deleteQuery.or(`order_item_id.eq.${orderItemId},and(order_item_id.is.null,product_id.eq.${productId})`);
  } else {
    deleteQuery = deleteQuery.eq('product_id', productId);
  }

  const { error: deleteError } = await deleteQuery;

  if (deleteError) throw deleteError;

  // 3. Chỉ insert khi có dữ liệu (nếu rỗng = xóa sạch toàn bộ phân bổ)
  if (allocations.length === 0) {
    return [];
  }

  const { data: created, error: insertError } = await supabase
    .from('ProductionOrder')
    .insert(allocations.map(alloc => ({
      order_id: orderId,
      product_id: productId,
      order_item_id: orderItemId,
      quantity_target: alloc.quantity,
      quantity_completed: 0,
      allocation_type: alloc.type,
      assigned_to: alloc.assignedTo,
      workshop_id: alloc.type === 'internal' ? alloc.assignedTo : null,
      outsourcer_id: alloc.type === 'outsourced' ? alloc.assignedTo : null,
      current_status: alloc.type === 'internal' ? 'pending' : 'outsourced',
      deadline_production: alloc.deadline || order?.deadline_delivery || new Date()
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
      product:products(code, name),
      order:Order(
        id,
        contract_code,
        deadline_delivery,
        customer:Customer(
          name,
          customer_code
        )
      ),
      workshop:Workshop(name),
      outsourcer:Outsourcer(name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(po => {
    const qtyTarget = po.quantity_target || 0;
    const qtyDone = po.quantity_completed || 0;
    const progress = qtyTarget > 0 ? Math.round((qtyDone / qtyTarget) * 100) : 0;

    return {
      id: po.id,
      sku: po.product?.code || 'N/A',
      title: po.product?.name || 'Sản phẩm không tên',
      customer: po.order?.customer?.name || 'Khách lẻ',
      customerCode: po.order?.customer?.customer_code || 'N/A',
      quantityTarget: qtyTarget,
      quantityCompleted: qtyDone,
      progress,
      status: (po.current_status === 'pending' ? 'Pending' : 
              (po.current_status === 'processing' || po.current_status === 'in_progress') ? 'Processing' : 
              po.current_status === 'qc' ? 'QualityControl' : 
              po.current_status === 'archived' ? 'Archived' : 'Completed') as any,
      deadlineProduction: po.deadline_production,
      dueDate: po.order?.deadline_delivery ? new Date(po.order.deadline_delivery).toLocaleDateString('vi-VN') : 'N/A',
      assignedTo: po.assigned_to,
      locationName: po.workshop?.name || po.outsourcer?.name || po.assigned_to || 'Chưa gán',
      allocationType: po.allocation_type,
      orderId: po.order?.id,
      contractCode: po.order?.contract_code,
      priority: (po.priority === 'Urgent' ? 'Urgent' : 
                 po.priority === 'High' ? 'High' : 
                 po.priority === 'Low' ? 'Low' : 'Medium') as any
    };
  });
}

export async function updateProductionStatus(id: string, status: string) {
  const dbStatus = status === 'Pending' ? 'pending' : 
                   status === 'Processing' ? 'in_progress' : 
                   status === 'QualityControl' ? 'qc' : 
                   status === 'Archived' ? 'archived' : 'completed';
                   
  const { error } = await supabase
    .from('ProductionOrder')
    .update({ current_status: dbStatus })
    .eq('id', id);

  if (error) throw error;
}

export async function createBatchWorkLogs(logs: any[]) {
  if (!logs || logs.length === 0) return;

  // 1. Chèn vào bảng WorkLog (snake_case)
  const dbLogs = logs.map(log => ({
    production_order_id: log.productionOrderId,
    employee_id: log.employeeId,
    staff_name: log.staffName,
    start_time: log.startTime,
    end_time: log.endTime,
    quantity: log.quantityProduced,
    technical_error_count: log.technicalErrorCount,
    material_error_count: log.materialErrorCount,
    note: log.note,
    type: 'production', // Bổ sung cột type còn thiếu
    status: 'completed'
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('WorkLog')
    .insert(dbLogs)
    .select();

  if (insertError) throw insertError;

  // 2. Cập nhật quantity_completed và current_status cho từng ProductionOrder liên quan
  const totalsByOrder = logs.reduce((acc: any, log: any) => {
    acc[log.productionOrderId] = (acc[log.productionOrderId] || 0) + (log.quantityProduced || 0);
    return acc;
  }, {});

  for (const [orderId, addedQty] of Object.entries(totalsByOrder)) {
    // Lấy thông tin hiện tại để tính toán trạng thái
    const { data: po, error: fetchError } = await supabase
      .from('ProductionOrder')
      .select('quantity_completed, quantity_target, current_status')
      .eq('id', orderId)
      .single();
    
    if (fetchError) continue;

    const newTotal = (po.quantity_completed || 0) + (addedQty as number);
    
    // Logic cập nhật trạng thái tự động
    let nextStatus = po.current_status;
    const target = po.quantity_target || 0;

    if (newTotal > 0 && target > 0) {
      if (newTotal >= target) {
        nextStatus = 'completed';
      } else {
        nextStatus = 'in_progress';
      }
    }

    await supabase
      .from('ProductionOrder')
      .update({ 
        quantity_completed: newTotal,
        current_status: nextStatus
      })
      .eq('id', orderId);
  }

  return inserted;
}

export async function deleteWorkLog(id: string) {
  // 1. Lấy thông tin log trước khi xóa
  const { data: log, error: logError } = await supabase
    .from('WorkLog')
    .select('production_order_id, quantity')
    .eq('id', id)
    .single();

  if (logError || !log) throw new Error("Work log not found");

  // 2. Xóa log
  const { error: deleteError } = await supabase
    .from('WorkLog')
    .delete()
    .eq('id', id);

  if (deleteError) throw deleteError;

  // 3. Cập nhật lại ProductionOrder
  const { data: po, error: poError } = await supabase
    .from('ProductionOrder')
    .select('quantity_completed, quantity_target, current_status')
    .eq('id', log.production_order_id)
    .single();

  if (poError || !po) return;

  const newTotal = Math.max(0, (po.quantity_completed || 0) - (log.quantity || 0));
  
  let nextStatus = po.current_status;
  if (newTotal === 0) {
    nextStatus = 'pending';
  } else if (newTotal < (po.quantity_target || 0)) {
    nextStatus = 'in_progress';
  }

  await supabase
    .from('ProductionOrder')
    .update({ 
      quantity_completed: newTotal,
      current_status: nextStatus
    })
    .eq('id', log.production_order_id);
}

export async function updateWorkLog(id: string, data: any) {
  // 1. Lấy log cũ để tính chênh lệch
  const { data: oldLog, error: logError } = await supabase
    .from('WorkLog')
    .select('production_order_id, quantity')
    .eq('id', id)
    .single();

  if (logError || !oldLog) throw new Error("Work log not found");

  // 2. Cập nhật log
  const dbData: any = {};
  if ('employeeId' in data) dbData.employee_id = data.employeeId;
  if ('staffName' in data) dbData.staff_name = data.staffName;
  if ('quantityProduced' in data) dbData.quantity = data.quantityProduced;
  if ('technicalErrorCount' in data) dbData.technical_error_count = data.technicalErrorCount;
  if ('materialErrorCount' in data) dbData.material_error_count = data.materialErrorCount;
  if ('note' in data) dbData.note = data.note;
  if ('date' in data) {
    dbData.start_time = new Date(data.date + "T08:00:00Z");
    dbData.end_time = new Date(data.date + "T17:00:00Z");
  }

  const { error: updateError } = await supabase
    .from('WorkLog')
    .update(dbData)
    .eq('id', id);

  if (updateError) throw updateError;

  // 3. Nếu có đổi sản lượng, cập nhật ProductionOrder
  if ('quantityProduced' in data) {
    const diff = Number(data.quantityProduced) - (oldLog.quantity || 0);
    
    const { data: po, error: poError } = await supabase
      .from('ProductionOrder')
      .select('quantity_completed, quantity_target, current_status')
      .eq('id', oldLog.production_order_id)
      .single();

    if (poError || !po) return;

    const newTotal = Math.max(0, (po.quantity_completed || 0) + diff);
    
    let nextStatus = po.current_status;
    if (newTotal === 0) {
      nextStatus = 'pending';
    } else if (newTotal >= (po.quantity_target || 0)) {
      nextStatus = 'completed';
    } else {
      nextStatus = 'in_progress';
    }

    await supabase
      .from('ProductionOrder')
      .update({ 
        quantity_completed: newTotal,
        current_status: nextStatus
      })
      .eq('id', oldLog.production_order_id);
  }
}

export async function deleteProductionOrder(id: string) {
  // 1. Lấy thông tin PO và Đơn hàng liên quan
  const { data: po, error: poError } = await supabase
    .from('ProductionOrder')
    .select('*, order:Order(id, created_at, status)')
    .eq('id', id)
    .single();

  if (poError || !po) throw new Error("Production Order not found");

  const orderId = po.order_id;
  const orderCreatedAt = po.order?.created_at;

  // 2. Xóa toàn bộ WorkLog liên quan (Reset dữ liệu về 0 như yêu cầu)
  const { error: logDeleteError } = await supabase
    .from('WorkLog')
    .delete()
    .eq('production_order_id', id);

  if (logDeleteError) throw logDeleteError;

  // 3. Xóa Production Order
  const { error: deleteError } = await supabase
    .from('ProductionOrder')
    .delete()
    .eq('id', id);

  if (deleteError) throw deleteError;

  // 4. Kiểm tra xem còn lệnh nào khác cho đơn hàng này không
  if (orderId) {
    const { count } = await supabase
      .from('ProductionOrder')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId);

    // 5. Nếu không còn lệnh nào, xử lý trạng thái đơn hàng
    if (count === 0) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const orderDate = new Date(orderCreatedAt);
      
      // Nếu đơn hàng mới (< 1 tuần), chuyển về 'new'
      // Nếu > 1 tuần, giữ nguyên trạng thái hoặc chuyển về 'confirmed'
      if (orderDate > oneWeekAgo) {
        await supabase
          .from('Order')
          .update({ status: 'new' })
          .eq('id', orderId);
      } else {
        // Hơn 1 tuần thì không cần để "Mới"
        // Có thể chuyển về 'confirmed' nếu hiện tại là 'processing'
        if (po.order?.status === 'processing' || po.order?.status === 'producing') {
          await supabase
            .from('Order')
            .update({ status: 'confirmed' })
            .eq('id', orderId);
        }
      }
    }
  }

  return { success: true };
}
