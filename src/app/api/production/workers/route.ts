import { NextResponse } from 'next/server';
import { getProductionWorkers } from '@/services/employee.service';

export async function GET() {
  try {
    const workers = await getProductionWorkers();
    return NextResponse.json(workers);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
