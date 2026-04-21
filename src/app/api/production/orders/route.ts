import { NextResponse } from 'next/server';
import { getProductionOrders, updateProductionOrder } from '@/services/production.service';

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
    const { id, ...updates } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    
    // Nếu có status trong updates, mapping nó sang camelCase để dùng với updateProductionOrder nếu cần
    // Hiện tại updateProductionOrder trong service.ts dùng data trực tiếp
    const result = await updateProductionOrder(id, updates);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Update Production Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const { deleteProductionOrder } = await import('@/services/production.service');
    const result = await deleteProductionOrder(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Delete Production Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
