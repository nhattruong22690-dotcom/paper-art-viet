import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    const code = (data.customerCode || data.customer_code || '').trim().toUpperCase();

    // Check unique if code changes
    if (code) {
      const { data: existing, error: checkError } = await supabase
        .from('Customer')
        .select('id')
        .eq('customer_code', code)
        .neq('id', id)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        return NextResponse.json({ error: 'Mã khách hàng này đã tồn tại, vui lòng kiểm tra lại' }, { status: 409 });
      }
    }
    
    const { data: customer, error } = await supabase
      .from('Customer')
      .update({
        customer_code: code,
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        notes: data.notes || '',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Update Customer API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { error } = await supabase
      .from('Customer')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Customer API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
