import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Bắt đầu một phiên làm việc mới cho công nhân.
 */
export async function startWorkSession(data: {
  productionOrderId: string;
  employeeId: string;
  staffName?: string;
}) {
  const { data: newLog, error } = await supabase
    .from('WorkLog')
    .insert({
      production_order_id: data.productionOrderId,
      employee_id: data.employeeId,
      staff_name: data.staffName,
      status: 'processing',
      start_time: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...newLog,
    productionOrderId: newLog.production_order_id,
    employeeId: newLog.employee_id,
    staffName: newLog.staff_name,
    startTime: newLog.start_time
  };
}

/**
 * Kết thúc phiên làm việc và cập nhật toàn bộ hệ thống (Log, Pipeline, Kho).
 */
export async function submitWorkSession(data: {
  workLogId: string;
  quantityProduced: number;
  technicalErrorCount: number;
  materialErrorCount: number;
  errorNote?: string;
  evidenceImageUrl?: string;
  note?: string;
}) {
  const totalProduced = data.quantityProduced;
  const totalWaste = data.technicalErrorCount + data.materialErrorCount;
  const totalConsumed = totalProduced + totalWaste;

  // 1. Cập nhật Nhật ký công việc (Work Log)
  const { data: workLog, error: logError } = await supabase
    .from('WorkLog')
    .update({
      end_time: new Date().toISOString(),
      quantity_produced: data.quantityProduced,
      technical_error_count: data.technicalErrorCount,
      material_error_count: data.materialErrorCount,
      error_note: data.errorNote,
      evidence_image_url: data.evidenceImageUrl,
      note: data.note,
      status: 'completed',
    })
    .eq('id', data.workLogId)
    .select(`
      *,
      productionOrder:ProductionOrder(
        *,
        product:products(*)
      )
    `)
    .single();

  if (logError) throw logError;

  // 2. Cập nhật tiến độ Lệnh sản xuất (Production Order)
  const { data: currentPO, error: poFetchError } = await supabase
    .from('ProductionOrder')
    .select('*')
    .eq('id', workLog.production_order_id)
    .single();
    
  if (poFetchError) throw poFetchError;

  const newCompleted = (currentPO.quantity_completed || 0) + data.quantityProduced;
  
  const { data: finalPO, error: finalPOError } = await supabase
    .from('ProductionOrder')
    .update({ quantity_completed: newCompleted })
    .eq('id', workLog.production_order_id)
    .select()
    .single();

  if (finalPOError) throw finalPOError;

  // Trigger 3 & 4: Tự động chuyển trạng thái Task dựa trên sản lượng
  let newTaskStatus = finalPO.current_status;
  const currentTarget = finalPO.quantity_target ?? 0;

  if (newCompleted > 0 && finalPO.current_status !== 'completed') {
    newTaskStatus = 'in_progress';
  }
  if (currentTarget > 0 && newCompleted >= currentTarget) {
    newTaskStatus = 'completed';
  }

  if (newTaskStatus !== finalPO.current_status) {
    await supabase
      .from('ProductionOrder')
      .update({ current_status: newTaskStatus || 'pending' })
      .eq('id', finalPO.id);

    // Trigger cascading: Nếu task hoàn thành, kiểm tra toàn bộ đơn hàng
    if (newTaskStatus === 'completed') {
      const { data: allTasks } = await supabase
        .from('ProductionOrder')
        .select('current_status')
        .eq('order_id', finalPO.order_id);
      
      const allDone = (allTasks || []).every(t => t.current_status === 'completed');
      if (allDone) {
        await supabase
          .from('Order')
          .update({ status: 'packing' })
          .eq('id', finalPO.order_id);
      }
    }
  }

  // 3. Cập nhật Kho vật tư (Inventory) - Manual lookup simplified
  if (workLog.productionOrder?.product?.name) {
    const { data: material } = await supabase
      .from('InventoryLocation')
      .select('*')
      .ilike('item_name', `%${workLog.productionOrder.product.name}%`)
      .limit(1)
      .single();

    if (material) {
      await supabase
        .from('InventoryLocation')
        .update({
          quantity: (material.quantity || 0) - totalConsumed,
          last_updated: new Date().toISOString()
        })
        .eq('id', material.id);
    }
  }

  return {
    ...workLog,
    productionOrderId: workLog.production_order_id,
    quantityProduced: workLog.quantity_produced,
    productionOrder: {
      ...workLog.productionOrder,
      productId: workLog.productionOrder.product_id,
      quantityTarget: workLog.productionOrder.quantity_target
    }
  };
}

/**
 * Lấy lịch sử 10 phiên làm việc gần nhất của một nhân viên.
 */
export async function getPersonalWorkHistory(employeeId: string) {
  const { data, error } = await supabase
    .from('WorkLog')
    .select(`
      *,
      productionOrder:ProductionOrder(
        *,
        product:products(*)
      )
    `)
    .eq('employee_id', employeeId)
    .limit(10)
    .order('start_time', { ascending: false });

  if (error) throw error;

  return (data || []).map(log => ({
    ...log,
    id: log.id,
    productionOrderId: log.production_order_id,
    employeeId: log.employee_id,
    staffName: log.staff_name,
    startTime: log.start_time,
    endTime: log.end_time,
    quantityProduced: log.quantity_produced,
    status: log.status,
    productionOrder: log.productionOrder ? {
      ...log.productionOrder,
      productId: log.productionOrder.product_id,
      quantityTarget: log.productionOrder.quantity_target,
      product: log.productionOrder.product ? {
        id: log.productionOrder.product.id,
        name: log.productionOrder.product.name,
        sku: log.productionOrder.product.code
      } : null
    } : null
  }));
}

/**
 * Tạo nhiều nhật ký công việc cùng lúc.
 */
export async function createBatchWorkLogs(
  logs: {
    productionOrderId: string;
    employeeId: string;
    staffName?: string;
    quantityProduced: number;
    technicalErrorCount: number;
    materialErrorCount: number;
    errorNote?: string;
    note?: string;
    startTime?: Date;
    endTime?: Date;
  }[],
  batchesUsed: {
    batchId: string;
    materialId: string;
    quantity: number;
  }[]
) {
  const results: any[] = [];

  // 1. Create logs
  for (const log of logs) {
    const { data: newLog, error: logError } = await supabase
      .from('WorkLog')
      .insert({
        production_order_id: log.productionOrderId,
        employee_id: log.employeeId,
        staff_name: log.staffName,
        quantity_produced: log.quantityProduced,
        technical_error_count: log.technicalErrorCount,
        material_error_count: log.materialErrorCount,
        error_note: log.errorNote,
        note: log.note,
        status: 'completed',
        start_time: (log.startTime || new Date()).toISOString(),
        end_time: (log.endTime || new Date()).toISOString(),
      })
      .select()
      .single();

    if (logError) throw logError;

    // 2. Update Production Order progress
    const { data: currentPO } = await supabase
      .from('ProductionOrder')
      .select('*')
      .eq('id', log.productionOrderId)
      .single();
    
    if (currentPO) {
      const newCompleted = (currentPO.quantity_completed || 0) + log.quantityProduced;
      const { data: updatedPO } = await supabase
        .from('ProductionOrder')
        .update({ quantity_completed: newCompleted })
        .eq('id', log.productionOrderId)
        .select()
        .single();

      if (updatedPO) {
        let newTaskStatus = updatedPO.current_status;
        const currentTarget = updatedPO.quantity_target ?? 0;

        if (newCompleted > 0 && updatedPO.current_status !== 'completed') {
          newTaskStatus = 'in_progress';
        }
        if (currentTarget > 0 && newCompleted >= currentTarget) {
          newTaskStatus = 'completed';
        }

        if (newTaskStatus !== updatedPO.current_status) {
          await supabase
            .from('ProductionOrder')
            .update({ current_status: newTaskStatus || 'pending' })
            .eq('id', updatedPO.id);

          if (newTaskStatus === 'completed') {
            const { data: allTasks } = await supabase
              .from('ProductionOrder')
              .select('current_status')
              .eq('order_id', updatedPO.order_id);
            
            const allDone = (allTasks || []).every(t => t.current_status === 'completed');
            if (allDone) {
              await supabase
                .from('Order')
                .update({ status: 'packing' })
                .eq('id', updatedPO.order_id);
            }
          }
        }
      }
    }

    results.push(newLog);
  }

  // 3. Process Batch Consumption
  if (results.length > 0) {
    const primaryWorkLogId = results[0].id;

    for (const consumption of batchesUsed) {
      // Deduct from Batch
      const { data: batch } = await supabase.from('MaterialBatch').select('remain_quantity').eq('id', consumption.batchId).single();
      if (batch) {
        await supabase.from('MaterialBatch').update({ remain_quantity: (batch.remain_quantity || 0) - consumption.quantity }).eq('id', consumption.batchId);
      }

      // Deduct from Material total
      const { data: material } = await supabase.from('materials').select('stock_quantity').eq('id', consumption.materialId).single();
      if (material) {
        await supabase.from('materials').update({ stock_quantity: (material.stock_quantity || 0) - consumption.quantity }).eq('id', consumption.materialId);
      }

      // Log Transaction
      await supabase.from('MaterialTransaction').insert({
        material_id: consumption.materialId,
        batch_id: consumption.batchId,
        quantity: consumption.quantity,
        type: 'production_usage',
        work_log_id: primaryWorkLogId,
        note: `Tiêu thụ sản xuất - PO: ${logs[0].productionOrderId}`
      });
    }
  }

  return results;
}

export async function getProductionOrderProfit(orderId: string) {
  const { data: order, error } = await supabase
    .from('ProductionOrder')
    .select(`
      *,
      workLogs:WorkLog(
        *,
        materialTransactions:MaterialTransaction(*)
      )
    `)
    .eq('id', orderId)
    .single();

  if (error || !order) throw new Error("Order not found");

  const contractPrice = Number(order.contract_price || 0);
  const totalQuantity = order.quantity_target || 0;
  const totalRevenue = contractPrice * totalQuantity;

  let totalActualCOGS = 0;
  (order.workLogs || []).forEach((log: any) => {
    (log.materialTransactions || []).forEach((tx: any) => {
      totalActualCOGS += Number(tx.quantity) * Number(tx.price || 0);
    });
  });

  const profit = totalRevenue - totalActualCOGS;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  return {
    contractPrice,
    totalRevenue,
    totalActualCOGS,
    profit,
    margin,
    isLowMargin: margin < 20
  };
}

/**
 * Lấy BOM cho một sản phẩm của PO.
 */
export async function getPOMaterialNeeds(productionOrderId: string) {
  const { data: po, error } = await supabase
    .from('ProductionOrder')
    .select(`
      product:products(
        bom(
          *,
          bom_materials(
            *,
            materials(*)
          )
        )
      )
    `)
    .eq('id', productionOrderId)
    .single();

  if (error || !po) return [];

  const product: any = Array.isArray(po.product) ? po.product[0] : po.product;
  const activeBom = (product?.bom || []).find((b: any) => b.is_active) || product?.bom?.[0];
  
  return (activeBom?.bom_materials || []).map((bi: any) => ({
    ...bi,
    materialId: bi.material_id,
    material: bi.materials ? {
      ...bi.materials,
      referencePrice: bi.materials.price,
      unitPrice: bi.materials.price
    } : null
  }));
}
