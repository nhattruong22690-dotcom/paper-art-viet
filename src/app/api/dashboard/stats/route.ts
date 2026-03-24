import { NextResponse } from 'next/server';
import { getDashboardStats, getRecentProductionProgress, getUpcomingDeliveries } from '@/services/dashboard.service';

export async function GET() {
  try {
    const [stats, progress, deliveries] = await Promise.all([
      getDashboardStats(),
      getRecentProductionProgress(),
      getUpcomingDeliveries()
    ]);

    return NextResponse.json({
      stats,
      progress,
      deliveries
    });
  } catch (error) {
    console.error('API Error /dashboard/stats:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
