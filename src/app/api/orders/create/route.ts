import { NextRequest, NextResponse } from 'next/server';
import { createSalesOrder } from '@/services/order.service';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!data.items || data.items.length === 0) {
      return NextResponse.json({ error: 'Order must have at least one item' }, { status: 400 });
    }

    const { order } = await createSalesOrder({
      customerId: data.customerId,
      contractCode: data.contractCode,
      deadlineDelivery: new Date(data.deadlineDelivery),
      estimated_stages: data.estimated_stages,
      items: data.items
    });

    return NextResponse.json({ 
      success: true, 
      orderId: order.id, 
      taskCount: 0 
    });
  } catch (error: any) {
    console.error('Order Creation API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
