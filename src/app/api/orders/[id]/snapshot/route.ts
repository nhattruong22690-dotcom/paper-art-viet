import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const { snapshots } = await req.json(); // Array of { orderItemId: string, snapshot: any }

    if (!snapshots || !Array.isArray(snapshots)) {
      return NextResponse.json({ error: 'Missing snapshots array' }, { status: 400 });
    }

    // Update each order item with its corresponding snapshot in OrderItemSnapshot
    for (const item of snapshots) {
      // We use upsert on OrderItemSnapshot because getOrderById prioritizes it
      const { error } = await supabase
        .from('OrderItemSnapshot')
        .upsert({ 
          order_item_id: item.orderItemId,
          bom_data: item.snapshot.bom_data,
          order_id: orderId 
        }, { onConflict: 'order_item_id' });

      if (error) {
        console.error(`Error updating OrderItemSnapshot ${item.orderItemId}:`, error);
        throw error;
      }
    }

    return NextResponse.json({ success: true, message: 'Snapshots updated successfully' });
  } catch (error: any) {
    console.error('API Order Snapshot Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
