import { NextResponse } from 'next/server';
import { getWorkerPerformance } from '@/services/production.service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const performance = await getWorkerPerformance();
    return NextResponse.json(performance);
  } catch (error) {
    console.error('API Error /production/performance:', error);
    return NextResponse.json({ error: 'Failed to fetch performance data' }, { status: 500 });
  }
}
