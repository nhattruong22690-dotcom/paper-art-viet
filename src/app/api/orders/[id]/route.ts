import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, updateOrder, deleteOrder } from '@/services/order.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await getOrderById(id);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Get Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const order = await updateOrder(id, body);
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Update Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteOrder(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
