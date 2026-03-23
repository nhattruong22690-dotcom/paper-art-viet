import { supabaseAdmin as supabase } from '@/lib/supabase';

/**
 * Tính toán giá vốn (COGS) dự kiến cho một sản phẩm dựa trên BOM hiện tại.
 */
export async function calculateProductCOGS(productId: string) {
  const { data: product, error } = await supabase
    .from('Product')
    .select(`
      *,
      bomItems:BOMItem(
        *,
        material:Material(*)
      )
    `)
    .eq('id', productId)
    .single();

  if (error || !product) return 0;

  // Sử dụng referencePrice hoặc purchasePrice từ Material
  const totalCOGS = (product.bomItems || []).reduce((acc: number, item: any) => {
    const rawPrice = item.material?.unit_price || item.material?.reference_price || 0;
    let price = Number(rawPrice);
    
    if (price === 0 && item.material?.purchase_price && item.material?.purchase_quantity) {
      const pPrice = Number(item.material.purchase_price);
      const pQty = Number(item.material.purchase_quantity);
      if (pQty > 0) price = pPrice / pQty;
    }

    const quantity = Number(item.quantity || 0);
    return acc + (price * quantity);
  }, 0);

  return totalCOGS;
}

/**
 * Tạo Đơn hàng mới và Tự động tách thành các Lệnh sản xuất (Tasks).
 */
export async function createSalesOrder(data: {
  customerId?: string;
  deadlineDelivery: Date | string;
  items: {
    productId: string;
    quantity: number;
    dealPrice: number;
    cogsAtOrder: number;
    bomSnapshot?: any;
    note?: string;
  }[]
}) {
  // 0. Tính toán Mã Hợp đồng mới (Theo chuẩn: CUSTOMERCODE-HD-XXXX-MMDDYYYY)
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

  const nextCode = `${customerCode}-HD${formattedNumber}-${dateStr}`;

  // 1. Tạo Đơn hàng (Order)
  const { data: order, error: orderError } = await supabase
    .from('Order')
    .insert({
      customer_id: data.customerId,
      contract_code: nextCode,
      deadline_delivery: data.deadlineDelivery,
      status: 'new'
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Tạo Order Items
  if (data.items.length > 0) {
    const { error: itemsError } = await supabase
      .from('OrderItem')
      .insert(data.items.map(item => ({
        order_id: order.id,
        product_id: item.productId && item.productId.trim() ? item.productId : null,
        quantity: item.quantity,
        price: item.dealPrice,
        cogs_at_order: item.cogsAtOrder,
        bom_snapshot: item.bomSnapshot,
        note: item.note
      })));
    
    if (itemsError) throw itemsError;
  }

  return { order: { ...order, customerId: order.customer_id, contractCode: order.contract_code, deadlineDelivery: order.deadline_delivery } };
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
        product:Product(*)
      ),
      productionOrders:ProductionOrder(*),
      packages:Package(*)
    `)
    .order('order_date', { ascending: false });

  if (error) throw error;
  
  // Calculate aggregate progress for each order and transform to camelCase
  const enhanced = (data || []).map(order => {
    const totalTarget = (order.productionOrders || []).reduce((acc: number, po: any) => acc + (po.quantity_target || 0), 0);
    const totalCompleted = (order.productionOrders || []).reduce((acc: number, po: any) => acc + (po.quantity_completed || 0), 0);
    const progress = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
    
    return {
      id: order.id,
      customerId: order.customer_id,
      contractCode: order.contract_code,
      orderDate: order.order_date,
      deadlineDelivery: order.deadline_delivery,
      status: order.status,
      customer: order.customer ? {
        id: order.customer.id,
        name: order.customer.name,
        customerCode: order.customer.customer_code
      } : null,
      orderItems: (order.orderItems || []).map((oi: any) => ({
        id: oi.id,
        productId: oi.product_id,
        quantity: oi.quantity,
        price: oi.price,
        product: oi.product ? {
          id: oi.product.id,
          name: oi.product.name,
          sku: oi.product.sku
        } : null
      })),
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
      product:Product(*),
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
      sku: po.product.sku
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
        product:Product(*)
      ),
      productionOrders:ProductionOrder(
        *,
        product:Product(*)
      ),
      packages:Package(
        *,
        packingListDetails:PackingListDetail(
          *,
          product:Product(*)
        )
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
    customer: order.customer,
    orderItems: (order.orderItems || []).map((oi: any) => ({
      ...oi,
      productId: oi.product_id,
      cogsAtOrder: oi.cogs_at_order,
      bomSnapshot: oi.bom_snapshot
    })),
    productionOrders: (order.productionOrders || []).map((po: any) => ({
      ...po,
      orderId: po.order_id,
      productId: po.product_id,
      quantityTarget: po.quantity_target,
      quantityCompleted: po.quantity_completed,
      deadlineProduction: po.deadline_production,
      currentStatus: po.current_status,
      allocationType: po.allocation_type
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
  const { orderItems, customerId, contractCode, deadlineDelivery, orderDate, ...updateData } = data;
  
  // Transform to snake_case
  const dbData = { ...updateData };
  if (customerId) dbData.customer_id = customerId;
  if (contractCode) dbData.contract_code = contractCode;
  if (deadlineDelivery) dbData.deadline_delivery = deadlineDelivery;
  if (orderDate) dbData.order_date = orderDate;

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

  return {
    ...updated,
    customerId: updated.customer_id,
    contractCode: updated.contract_code,
    deadlineDelivery: updated.deadline_delivery,
    orderDate: updated.order_date
  };
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
