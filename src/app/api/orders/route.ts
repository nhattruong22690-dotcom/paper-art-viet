import { NextResponse } from 'next/server';
import { getOrders } from '@/services/order.service';

export async function GET() {
  try {
    const orders = await getOrders();
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch Orders API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
