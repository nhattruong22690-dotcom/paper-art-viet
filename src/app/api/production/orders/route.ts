import { NextResponse } from 'next/server';
import { getProductionOrders, updateProductionStatus } from '@/services/production.service';

export async function GET() {
  try {
    const orders = await getProductionOrders();
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch Production Orders API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }
    await updateProductionStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Production Status API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
