import { NextResponse } from 'next/server';
import { getWorkLogs } from '@/services/production.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '20');

    const logs = await getWorkLogs({ date, skip, take });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('API Error /production/logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
