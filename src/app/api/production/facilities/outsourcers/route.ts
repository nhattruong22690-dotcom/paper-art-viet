import { NextRequest, NextResponse } from 'next/server';
import { getOutsourcers, upsertOutsourcer, deleteFacility } from '@/services/facility.service';

export async function GET() {
  try {
    const outsourcers = await getOutsourcers();
    return NextResponse.json(outsourcers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const outsourcer = await upsertOutsourcer(data);
    return NextResponse.json(outsourcer);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    
    await deleteFacility('outsourcer', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
