import { NextResponse } from 'next/server';
import { getDashboardStats, getOrderProgress, getUpcomingDeliveries, getLateMilestoneOrders } from '@/services/dashboard.service';

export async function GET() {
  try {
    const [stats, progress, deliveries, lateMilestones] = await Promise.all([
      getDashboardStats(),
      getOrderProgress(),
      getUpcomingDeliveries(),
      getLateMilestoneOrders()
    ]);

    return NextResponse.json({
      stats,
      progress,
      deliveries,
      lateMilestones
    });
  } catch (error) {
    console.error('API Error /dashboard/stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
