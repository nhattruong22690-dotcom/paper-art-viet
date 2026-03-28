import { NextRequest, NextResponse } from 'next/server';
import { getWorkshops, upsertWorkshop, deleteFacility } from '@/services/facility.service';

export async function GET() {
  try {
    const workshops = await getWorkshops();
    return NextResponse.json(workshops);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const workshop = await upsertWorkshop(data);
    return NextResponse.json(workshop);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    
    await deleteFacility('workshop', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
