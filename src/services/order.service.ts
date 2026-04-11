"use server";
import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Tính toán giá vốn (COGS) dự kiến cho một sản phẩm dựa trên BOM hiện tại.
 */
export async function calculateProductCOGS(productId: string) {
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      bom (
        *,
        bom_materials (
          *,
          material:materials (*)
        )
      )
    `)
    .eq('id', productId)
    .single();

  if (error || !product) return 0;

  if (product.cogs_config?.totalCOGS) {
    return Number(product.cogs_config.totalCOGS);
  }

  if (product.cost_price) {
    return Number(product.cost_price);
  }

  // Fallback to naive BOM material calculation if no config exists
  const activeBom = (product.bom || []).find((b: any) => b.is_active) || product.bom?.[0];
  const totalCOGS = (activeBom?.bom_materials || []).reduce((acc: number, item: any) => {
    const rawPrice = item.material?.price || 0;
    let price = Number(rawPrice);
    
    const quantity = Number(item.qty || 0);
    return acc + (price * quantity);
  }, 0);

  return totalCOGS;
}

/**
 * Kiểm tra xem mã hợp đồng đã tồn tại chưa.
 */
export async function checkContractCodeDuplicate(code: string) {
  const { data, error } = await supabase
    .from('Order')
    .select('id')
    .eq('contract_code', code)
    .maybeSingle();

  if (error) return false;
  return !!data;
}

/**
 * Tạo Đơn hàng mới và Tự động tách thành các Lệnh sản xuất (Tasks).
 */
export async function createSalesOrder(data: {
  customerId?: string;
  contractCode?: string;
  deadlineDelivery: Date | string;
  estimated_stages?: any[];
  items: {
    productId: string;
    quantity: number;
    dealPrice: number;
    cogsAtOrder: number;
    bomSnapshot?: any;
    note?: string;
  }[];
  currency?: string;
}) {
  let nextCode = data.contractCode;

  // Nếu không có mã truyền vào, mới sinh mã tự động (fallback)
  if (!nextCode) {
    const { data: customer, error: customerError } = await supabase
      .from('Customer')
      .select('*, orders:Order(id)')
      .eq('id', data.customerId)
      .single();

    if (customerError || !customer) throw new Error('Customer not found');
    
    const customerCode = customer.customer_code || customer.name.substring(0, 3).toUpperCase();
    const nextNumber = (customer.orders?.length || 0) + 1;
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${mm}${dd}${yyyy}`;

    nextCode = `${customerCode}-HD${formattedNumber}-${dateStr}`;
  } else {
    // Nếu có mã truyền vào, kiểm tra xem đã tồn tại chưa
    const isDuplicate = await checkContractCodeDuplicate(nextCode);
    if (isDuplicate) {
      throw new Error(`Số hợp đồng ${nextCode} đã tồn tại trong hệ thống.`);
    }
  }

  // 1. Tạo Đơn hàng (Order)
  const { data: order, error: orderError } = await supabase
    .from('Order')
    .insert({
      customer_id: data.customerId,
      contract_code: nextCode,
      deadline_delivery: data.deadlineDelivery,
      estimated_stages: data.estimated_stages,
      currency: data.currency || 'VND',
      status: 'new'
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Tạo Order Items
  if (data.items.length > 0) {
    const { data: insertedItems, error: itemsError } = await supabase
      .from('OrderItem')
      .insert(data.items.map(item => ({
        order_id: order.id,
        product_id: item.productId && item.productId.trim() ? item.productId : null,
        quantity: item.quantity,
        price: item.dealPrice,
        cogs_at_order: item.cogsAtOrder,
        bom_snapshot: item.bomSnapshot, // legacy field
        note: item.note
      })))
      .select();
    
    if (itemsError) throw itemsError;

    // 3. Tạo Snapshots chi tiết cho từng OrderItem
    if (insertedItems) {
      await createOrderItemSnapshots(order.id, insertedItems);
    }
  }

  return { order: { ...order, customerId: order.customer_id, contractCode: order.contract_code, deadlineDelivery: order.deadline_delivery, currency: order.currency } };
}

/**
 * Lấy danh sách toàn bộ đơn hàng.
 */
export async function getOrders() {
  const { data, error } = await supabase
    .from('Order')
    .select(`
      *,
      customer:Customer(*),
      orderItems:OrderItem(
        *,
        product:products(*),
        snapshot:OrderItemSnapshot(*)
      ),
      productionOrders:ProductionOrder(*),
      packages:Package(*)
    `)
    .order('order_date', { ascending: false });

  if (error) throw error;
  
  // Calculate aggregate progress for each order and transform to camelCase
  const enhanced = (data || []).map(order => {
    const pos = order.productionOrders || [];
    const items = order.orderItems || [];
    
    const totalTarget = pos.reduce((acc: number, po: any) => acc + (po.quantity_target || 0), 0);
    const totalCompleted = pos.reduce((acc: number, po: any) => acc + (po.quantity_completed || 0), 0);
    const progress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;

    // Check if every item is fully allocated for production
    const isAllocated = items.length > 0 && items.every((item: any) => {
      const itemAllocatedQty = pos
        .filter((po: any) => po.product_id === item.product_id)
        .reduce((sum: number, po: any) => sum + (po.quantity_target || 0), 0);
      return itemAllocatedQty >= (item.quantity || 0);
    });
    
    return {
      id: order.id,
      customerId: order.customer_id,
      contractCode: order.contract_code,
      orderDate: order.order_date,
      deadlineDelivery: order.deadline_delivery,
      status: order.status,
      currency: order.currency || 'VND',
      estimatedStages: order.estimated_stages || [],
      notes: order.notes,
      isAllocated,
      customer: order.customer ? {
        id: order.customer.id,
        name: order.customer.name,
        customerCode: order.customer.customer_code
      } : null,
      orderItems: (order.orderItems || []).map((oi: any) => {
        const snap = oi.snapshot?.[0];
        return {
          id: oi.id,
          productId: oi.product_id,
          quantity: oi.quantity,
          price: oi.price,
          cogsAtOrder: snap ? (snap.prices?.cost || 0) : (oi.cogs_at_order || 0),
          productionTimeStd: snap ? (snap.production_time_std || 0) : (oi.product?.production_time_std || 0),
          snapshot: snap,
          product: snap ? {
            id: oi.product_id,
            name: snap.name,
            sku: snap.sku,
            unit: snap.unit
          } : (oi.product ? {
            id: oi.product.id,
            name: oi.product.name,
            sku: oi.product.code,
            unit: oi.product.unit
          } : null)
        };
      }),
      productionOrders: (order.productionOrders || []).map((po: any) => ({
        id: po.id,
        quantityTarget: po.quantity_target,
        quantityCompleted: po.quantity_completed,
        currentStatus: po.current_status
      })),
      overallProgress: progress
    };
  });

  return enhanced;
}

/**
 * Lấy danh sách toàn bộ lệnh sản xuất (Production Orders).
 */
export async function getProductionOrders() {
  const { data, error } = await supabase
    .from('ProductionOrder')
    .select(`
      *,
      product:products(*),
      order:Order(
        *,
        customer:Customer(*)
      )
    `)
    .order('deadline_production', { ascending: true });

  if (error) throw error;

  return (data || []).map(po => ({
    id: po.id,
    orderId: po.order_id,
    productId: po.product_id,
    quantityTarget: po.quantity_target,
    quantityCompleted: po.quantity_completed,
    deadlineProduction: po.deadline_production,
    currentStatus: po.current_status,
    allocationType: po.allocation_type,
    product: po.product ? {
      id: po.product.id,
      name: po.product.name,
      sku: po.product.code
    } : null,
    order: po.order ? {
      id: po.order.id,
      contractCode: po.order.contract_code,
      customer: po.order.customer ? {
        name: po.order.customer.name
      } : null
    } : null
  }));
}

/**
 * Lấy chi tiết một đơn hàng theo ID.
 */
export async function getOrderById(id: string) {
  const { data: order, error } = await supabase
    .from('Order')
    .select(`
      *,
      customer:Customer(*),
      orderItems:OrderItem(
        *,
        product:products(*),
        snapshot:OrderItemSnapshot(*)
      ),
      productionOrders:ProductionOrder(
        *,
        product:products(*),
        workshop:Workshop(name),
        outsourcer:Outsourcer(name)
      ),
      packages:Package(
        *,
        packingListDetails:PackingListDetail(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Transform to camelCase
  return {
    id: order.id,
    customerId: order.customer_id,
    contractCode: order.contract_code,
    orderDate: order.order_date,
    deadlineDelivery: order.deadline_delivery,
    status: order.status,
    currency: order.currency || 'VND',
    estimatedStages: order.estimated_stages || [],
    notes: order.notes,
    logs: order.logs || [],
    customer: order.customer,
    orderItems: (order.orderItems || []).map((oi: any) => {
      const snap = oi.snapshot?.[0];
      return {
        ...oi,
        productId: oi.product_id,
        cogsAtOrder: oi.cogs_at_order,
        bomSnapshot: snap ? snap.bom_data : oi.bom_snapshot,
        snapshot: snap,
        product: snap ? {
          id: oi.product_id,
          name: snap.name,
          sku: snap.sku,
          unit: snap.unit,
          ...snap.prices
        } : (oi.product ? {
          ...oi.product,
          sku: oi.product.code
        } : null)
      };
    }),
    productionOrders: (order.productionOrders || []).map((po: any) => ({
      ...po,
      orderId: po.order_id,
      productId: po.product_id,
      quantityTarget: po.quantity_target,
      quantityCompleted: po.quantity_completed,
      deadlineProduction: po.deadline_production,
      currentStatus: po.current_status,
      allocationType: po.allocation_type,
      product: po.product ? {
        ...po.product,
        sku: po.product.code
      } : null
    })),
    packages: (order.packages || []).map((pk: any) => ({
      ...pk,
      orderId: pk.order_id,
      packageCode: pk.package_code,
      packingListDetails: (pk.packingListDetails || []).map((pd: any) => ({
        ...pd,
        packageId: pd.package_id,
        productId: pd.product_id
      }))
    }))
  };
}

/**
 * Cập nhật thông tin đơn hàng (Status, Deadline, Notes...)
 */
export async function updateOrder(id: string, data: any) {
  const { 
    orderItems,
    status, 
    notes, 
    logs, 
    newLog,
    customerId,
    contractCode,
    deadlineDelivery,
    orderDate,
    estimatedStages,
    estimated_stages
  } = data;
  
  const dbData: any = {};
  if (status) dbData.status = status;
  if (notes !== undefined) dbData.notes = notes;
  if (customerId) dbData.customer_id = customerId;
  if (contractCode) dbData.contract_code = contractCode;
  if (deadlineDelivery) dbData.deadline_delivery = deadlineDelivery;
  if (orderDate) dbData.order_date = orderDate;
  if (data.currency) dbData.currency = data.currency;
  
  // Ưu tiên estimated_stages nếu có, nếu không lấy estimatedStages
  const stagesToSave = estimated_stages || estimatedStages;
  if (stagesToSave !== undefined) {
    dbData.estimated_stages = stagesToSave;
  }

  // Handle Logs (Append new log if provided)
  if (newLog) {
    const { data: currentOrder } = await supabase.from('Order').select('logs').eq('id', id).single();
    const currentLogs = currentOrder?.logs || [];
    dbData.logs = [...currentLogs, newLog];
  } else if (logs) {
    // If logs are passed directly, overwrite (used if we want to sync the whole array)
    dbData.logs = logs;
  }

  const { data: updated, error } = await supabase
    .from('Order')
    .update(dbData)
    .eq('id', id)
    .select(`
      *,
      customer:Customer(*),
      orderItems:OrderItem(*)
    `)
    .single();

  if (error) throw error;

  // Sync Order Items if provided
  if (orderItems) {
    // 1. Delete items that are no longer in the list
    const currentItemIds = orderItems.filter((i: any) => !String(i.id).startsWith('new-')).map((i: any) => i.id);
    if (currentItemIds.length > 0) {
      await supabase.from('OrderItem').delete().eq('order_id', id).not('id', 'in', `(${currentItemIds.join(',')})`);
    } else {
      await supabase.from('OrderItem').delete().eq('order_id', id);
    }

    // 2. Upsert items
    const itemsToUpsert = orderItems.map((i: any) => ({
      ...(String(i.id).startsWith('new-') ? {} : { id: i.id }),
      order_id: id,
      product_id: i.productId || null,
      quantity: i.quantity,
      price: i.price,
      cogs_at_order: i.cogsAtOrder || 0,
      bom_snapshot: i.bomSnapshot || []
    }));

    if (itemsToUpsert.length > 0) {
      const { data: upsertedItems, error: upsertError } = await supabase
        .from('OrderItem')
        .upsert(itemsToUpsert)
        .select();
      
      if (upsertError) console.error('OrderItem Sync Error:', upsertError);

      if (upsertedItems) {
        await createOrderItemSnapshots(id, upsertedItems);
      }
    }
  }

  return {
    ...updated,
    customerId: updated.customer_id,
    contractCode: updated.contract_code,
    deadlineDelivery: updated.deadline_delivery,
    orderDate: updated.order_date,
    logs: updated.logs || []
  };
}

/**
 * Helper: Tạo Snapshot chi tiết cho các OrderItem.
 * Sẽ fetch dữ liệu sản phẩm hiện tại và lưu vào bảng OrderItemSnapshot.
 */
async function createOrderItemSnapshots(orderId: string, insertedItems: any[]) {
  if (!insertedItems || insertedItems.length === 0) return;
  
  const productIds = insertedItems.map(i => i.product_id).filter(Boolean);
  if (productIds.length === 0) return;

  const { data: fullProducts } = await supabase
    .from('products')
    .select(`
      *,
      bom (
        *,
        bom_materials (*, materials (*)),
        bom_operations (*, operations (*))
      )
    `)
    .in('id', productIds);

  const productMap = new Map((fullProducts || []).map(p => [p.id, p]));

  const snapshots = insertedItems.map(oi => {
    const p = productMap.get(oi.product_id);
    if (!p) return null;

    const activeBom = (p.bom || []).find((b: any) => b.is_active) || p.bom?.[0];
    
    return {
      order_item_id: oi.id,
      order_id: orderId,
      product_id: oi.product_id,
      name: p.name || 'Sản phẩm mới...',
      sku: p.code || 'N/A',
      unit: p.unit || 'Cái',
      prices: {
        base: p.base_price || 0,
        cost: p.cost_price || 0,
        wholesale: p.wholesale_price || 0,
        export: p.export_price || 0
      },
      production_time_std: p.production_time_std || 0,
      bom_data: activeBom?.bom_materials?.map((bm: any) => ({
        material_id: bm.material_id,
        qty: bm.qty,
        material_name: bm.materials?.specification || bm.materials?.name,
        material_sku: bm.materials?.type || bm.materials?.code,
        unit: bm.materials?.unit,
        price: bm.materials?.price
      })) || [],
      operations_data: activeBom?.bom_operations?.map((bo: any) => ({
        operation_id: bo.operation_id,
        sequence: bo.sequence,
        name: bo.operations?.specification || bo.operations?.name,
        price: bo.operations?.price
      })) || [],
      cogs_config: p.cogs_config || {}
    };
  }).filter(Boolean);

  if (snapshots.length === 0) return;

  // Sử dụng upsert để tránh trùng lặp snapshot nếy updateOrder gọi lại
  const { error: snapshotError } = await supabase
    .from('OrderItemSnapshot')
    .upsert(snapshots, { onConflict: 'order_item_id' });
    
  if (snapshotError) console.error('Snapshot Sync Error:', snapshotError);
}

/**
 * Xóa đơn hàng (Cần xóa các ràng buộc nếu cần)
 */
export async function deleteOrder(id: string) {
  // Cascading deletes handled by Postgres if configured
  const { count: poCount } = await supabase
    .from('ProductionOrder')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', id);

  await supabase.from('ProductionOrder').delete().eq('order_id', id);
  await supabase.from('OrderItem').delete().eq('order_id', id);
  const { data: order, error } = await supabase
    .from('Order')
    .delete()
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return { ...order, deletedPOCount: poCount || 0 };
}

/**
 * Thêm một Lệnh sản xuất thủ công cho một Đơn hàng hiện có.
 */
export async function addProductionOrderToOrder(orderId: string, productId: string, quantity: number) {
  const { data: order, error: orderError } = await supabase
    .from('Order')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) throw new Error("Order not found");

  const { data: newPO, error: poError } = await supabase
    .from('ProductionOrder')
    .insert({
      order_id: orderId,
      product_id: productId,
      quantity_target: quantity,
      current_status: 'pending',
      deadline_production: order.deadline_delivery || new Date()
    })
    .select()
    .single();

  if (poError) throw poError;

  return {
    ...newPO,
    orderId: newPO.order_id,
    productId: newPO.product_id,
    quantityTarget: newPO.quantity_target,
    currentStatus: newPO.current_status
  };
}
