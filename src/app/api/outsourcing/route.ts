import { NextResponse } from 'next/server';
import { getProductionOrders } from '@/services/order.service';

export async function GET() {
  try {
    const orders = await getProductionOrders();
    // Lọc các lệnh sản xuất có hình thức gia công ngoài
    const outsourced = (orders || []).filter(o => o.allocationType === 'outsourced');
    return NextResponse.json(outsourced);
  } catch (error: any) {
    console.error('API Error /api/outsourcing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
