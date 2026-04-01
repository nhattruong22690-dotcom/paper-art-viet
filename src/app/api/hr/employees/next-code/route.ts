import { NextResponse } from 'next/server';
import { getNextEmployeeCode } from '@/services/employee.service';

export async function GET() {
  try {
    const nextCode = await getNextEmployeeCode();
    return NextResponse.json({ nextCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
