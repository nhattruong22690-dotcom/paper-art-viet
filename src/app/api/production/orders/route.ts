import { NextResponse } from 'next/server';
import { getProductionOrders, addProductionOrderToOrder } from '@/services/order.service';

export async function GET() {
  try {
    const orders = await getProductionOrders();
    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Fetch Production Orders API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { orderId, productId, quantityTarget } = data;
    
    if (!orderId || !productId || !quantityTarget) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newPO = await addProductionOrderToOrder(orderId, productId, quantityTarget);
    
    return NextResponse.json(newPO);
  } catch (error: any) {
    console.error('Create Production Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
