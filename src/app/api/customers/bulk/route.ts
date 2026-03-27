import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { customers } = await req.json();

    if (!Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ hoặc rỗng' }, { status: 400 });
    }

    // Prepare data for upsert
    // We use customer_code as a natural unique key if present, 
    // but the table might not have it as a unique constraint.
    // If it's a bulk insert, we'll try to insert and ignore duplicates or just insert all.
    
    const dataToInsert = customers.map((c: any) => ({
      name: c.name,
      customer_code: (c.customerCode || c.customer_code || '').trim().toUpperCase() || null,
      phone: String(c.phone || ''),
      email: String(c.email || ''),
      address: String(c.address || ''),
      notes: String(c.notes || ''),
    }));

    const { data, error } = await supabase
      .from('Customer')
      .insert(dataToInsert)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, count: data?.length || 0 });
  } catch (error: any) {
    console.error('Bulk Import Customers API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
