import { NextResponse } from 'next/server';
import { getWorkLogs } from '@/services/production.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || undefined;
    const productionOrderId = searchParams.get('productionOrderId') || undefined;
    const skip = parseInt(searchParams.get('skip') || '0');
    const take = parseInt(searchParams.get('take') || '50');

    const logs = await getWorkLogs({ date, productionOrderId, skip, take });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('API Error /production/logs:', error);
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { updateWorkLog } = await import('@/services/production.service');
    await updateWorkLog(id, data);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error PATCH /production/logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    const { deleteWorkLog } = await import('@/services/production.service');
    await deleteWorkLog(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error DELETE /production/logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
