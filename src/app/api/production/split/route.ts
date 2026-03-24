import { NextResponse } from 'next/server';
import { splitProductionOrders } from '@/services/production.service';

export async function POST(req: Request) {
  try {
    const { orderId, productId, allocations } = await req.json();

    if (!orderId || !productId || !allocations || !Array.isArray(allocations)) {
      return NextResponse.json({ error: 'Thiếu thông tin phân bổ (orderId, productId, allocations)' }, { status: 400 });
    }

    const result = await splitProductionOrders(orderId, productId, allocations);
    
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Split Production Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
