import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function getDashboardStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const nowStr = new Date().toISOString().split('T')[0];

  const [
    { count: orderCount },
    { data: revenueData },
    { count: completedPO },
    { count: overduePO },
    { data: lateMilestoneOrders }
  ] = await Promise.all([
    // 1. Đơn hàng mới (trong 30 ngày qua)
    supabase
      .from('Order')
      .select('*', { count: 'exact', head: true })
      .gte('order_date', thirtyDaysAgo),
    
    // 2. Lợi nhuận gộp dự tính
    supabase
      .from('OrderItem')
      .select('price, cogs_at_order'),
    
    // 3. Lệnh sản xuất đã hoàn thành
    supabase
      .from('ProductionOrder')
      .select('*', { count: 'exact', head: true })
      .eq('current_status', 'completed'),
    
    // 4. Cảnh báo chậm (Lệnh sản xuất quá hạn)
    supabase
      .from('ProductionOrder')
      .select('*', { count: 'exact', head: true })
      .neq('current_status', 'completed')
      .lt('deadline_production', now),

    // 5. Đơn hàng trễ khâu (estimated_stages)
    supabase
      .from('Order')
      .select('estimated_stages')
      .neq('status', 'completed')
      .not('estimated_stages', 'is', null)
  ]);

  const totalRevenue = (revenueData || []).reduce((acc, i) => acc + Number(i.price || 0), 0);
  const totalCOGS = (revenueData || []).reduce((acc, i) => acc + Number(i.cogs_at_order || 0), 0);

  const lateMilestoneCount = (lateMilestoneOrders || []).filter(order => {
    const milestones = order.estimated_stages || [];
    return milestones.some((m: any) => {
      return !m.isCompleted && m.deadline && m.deadline < nowStr;
    });
  }).length;

  return {
    newOrders: orderCount || 0,
    grossProfit: totalRevenue - totalCOGS,
    completedTasks: completedPO || 0,
    overdueAlerts: (overduePO || 0) + lateMilestoneCount,
    lateMilestoneCount
  };
}

export async function getOrderProgress() {
  const { data: orders, error } = await supabase
    .from('Order')
    .select(`
      id,
      contract_code,
      deadline_delivery,
      estimated_stages,
      status,
      customer:Customer(name),
      orderItems:OrderItem(quantity),
      productionOrders:ProductionOrder(quantity_completed, quantity_target)
    `)
    .neq('status', 'completed')
    .not('deadline_delivery', 'is', null)
    .order('deadline_delivery', { ascending: true })
    .limit(8);

  if (error) throw error;

  return (orders || []).map(order => {
    const totalQty = (order.orderItems || []).reduce((acc: number, i: any) => acc + (i.quantity || 0), 0);
    const completedQty = (order.productionOrders || []).reduce((acc: number, po: any) => acc + (po.quantity_completed || 0), 0);
    
    const milestones = order.estimated_stages || [];
    const completedMilestones = milestones.filter((m: any) => m.isCompleted).length;
    
    const progress = totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0;

    return {
      id: order.id,
      contractCode: order.contract_code,
      customer: (Array.isArray(order.customer) ? order.customer[0]?.name : (order.customer as any)?.name) || 'Khách lẻ',
      deadline: order.deadline_delivery,
      progress,
      productRatio: `${completedQty}/${totalQty}`,
      milestoneRatio: `${completedMilestones}/${milestones.length}`,
      status: order.status
    };
  });
}

export async function getUpcomingDeliveries() {
  const { data: upcomingOrders, error } = await supabase
    .from('Order')
    .select(`
      *,
      customer:Customer(*),
      orderItems:OrderItem(*)
    `)
    .neq('status', 'completed')
    .limit(5)
    .order('deadline_delivery', { ascending: true });

  if (error) throw error;

  return (upcomingOrders || []).map(order => ({
    id: order.id.slice(-8).toUpperCase(),
    customer: (Array.isArray(order.customer) ? order.customer[0]?.name : (order.customer as any)?.name) || 'Khách lẻ',
    items: `${(order.orderItems || []).reduce((acc: number, i: any) => acc + (i.quantity || 0), 0)} pcs`,
    date: order.deadline_delivery ? new Date(order.deadline_delivery).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'N/A'
  }));
}

export async function getLateMilestoneOrders() {
  const { data: orders, error } = await supabase
    .from('Order')
    .select(`
      *,
      customer:Customer(*)
    `)
    .neq('status', 'completed')
    .not('estimated_stages', 'is', null)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const todayStr = new Date().toISOString().split('T')[0];

  const lateOrders = (orders || []).filter(order => {
    const milestones = order.estimated_stages || [];
    return milestones.some((m: any) => {
      return !m.isCompleted && m.deadline && m.deadline < todayStr;
    });
  }).map(order => {
    const milestones = order.estimated_stages || [];
    const lateMilestones = milestones.filter((m: any) => {
       return !m.isCompleted && m.deadline && m.deadline < todayStr;
    });

    return {
      id: order.id,
      displayId: order.id.slice(-8).toUpperCase(),
      contractCode: order.contract_code,
      customer: (Array.isArray(order.customer) ? order.customer[0]?.name : (order.customer as any)?.name) || 'Khách lẻ',
      lateCount: lateMilestones.length,
      lateMilestonesList: lateMilestones.map((m: any) => m.label || m.name || m.stage || 'Khâu không tên').join(', '),
      deadline: lateMilestones[0]?.deadline
    };
  });

  return lateOrders.slice(0, 10); // Lấy tối đa 10 đơn
}
