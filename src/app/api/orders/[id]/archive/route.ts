import { NextRequest, NextResponse } from 'next/server';
import { archiveOrderById } from '@/services/order.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const result = await archiveOrderById(id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Archive Order API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
