import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function getDashboardStats() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const [
    { count: orderCount },
    { data: revenueData },
    { count: completedPO },
    { count: overduePO }
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
      .lt('deadline_production', now)
  ]);

  const totalRevenue = (revenueData || []).reduce((acc, i) => acc + Number(i.price || 0), 0);
  const totalCOGS = (revenueData || []).reduce((acc, i) => acc + Number(i.cogs_at_order || 0), 0);

  return {
    newOrders: orderCount || 0,
    grossProfit: totalRevenue - totalCOGS,
    completedTasks: completedPO || 0,
    overdueAlerts: overduePO || 0
  };
}

export async function getRecentProductionProgress() {
  const { data: recentPOs, error } = await supabase
    .from('ProductionOrder')
    .select(`
      *,
      product:products(*)
    `)
    .limit(5)
    .order('deadline_production', { ascending: false });

  if (error) throw error;

  return (recentPOs || []).map(po => ({
    sku: po.product?.code || 'N/A',
    title: po.product?.name || 'Sản phẩm mới',
    progress: po.quantity_target > 0 ? Math.round(((po.quantity_completed || 0) / po.quantity_target) * 100) : 0,
    status: po.current_status || 'pending'
  }));
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
    customer: order.customer?.name || 'Khách lẻ',
    items: `${(order.orderItems || []).reduce((acc: number, i: any) => acc + (i.quantity || 0), 0)} pcs`,
    date: order.deadline_delivery ? new Date(order.deadline_delivery).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : 'N/A'
  }));
}
