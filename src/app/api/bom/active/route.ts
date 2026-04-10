import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { productIds } = await req.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: 'Missing productIds array' }, { status: 400 });
    }

    const { data: bomData, error: bomError } = await supabase
      .from('bom')
      .select(`
        product_id,
        is_active,
        bom_materials (
          qty,
          materials (id, code, name, unit, specification)
        )
      `)
      .in('product_id', productIds)
      .eq('is_active', true);

    if (bomError) throw bomError;

    return NextResponse.json(bomData || []);
  } catch (error: any) {
    console.error('API Active BOMs Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
