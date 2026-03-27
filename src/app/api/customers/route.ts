import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: customers, error } = await supabase
      .from('Customer')
      .select('*, Order(status)')
      .order('name', { ascending: true });

    if (error) throw error;

    const mappedCustomers = (customers || []).map((c: any) => {
      const orders = c.Order || [];
      return {
        ...c,
        customerCode: c.customer_code || '',
        totalOrders: orders.length,
        inProductionCount: orders.filter((o: any) => o.status === 'in_production').length,
        completedCount: orders.filter((o: any) => o.status === 'completed').length,
      };
    });

    return NextResponse.json(mappedCustomers);
  } catch (error: any) {
    console.error('Fetch Customers API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const code = (data.customerCode || data.customer_code || '').trim().toUpperCase();

    if (code) {
      const { data: existing, error: checkError } = await supabase
        .from('Customer')
        .select('id')
        .eq('customer_code', code)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        return NextResponse.json({ error: 'Mã khách hàng này đã tồn tại, vui lòng kiểm tra lại' }, { status: 409 });
      }
    }

    const { data: customer, error } = await supabase
      .from('Customer')
      .insert({
        customer_code: code,
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        notes: data.notes || '',
      })
      .select()
      .single();

    if (error) throw error;
    
    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Create Customer API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
