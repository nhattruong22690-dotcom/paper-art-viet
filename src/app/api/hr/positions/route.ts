import { NextResponse } from 'next/server';
import { getHRPositions, createHRPosition } from '@/services/employee.service';

export async function GET() {
  try {
    const data = await getHRPositions();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    const data = await createHRPosition(name);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
