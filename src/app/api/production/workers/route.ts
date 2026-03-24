import { NextResponse } from 'next/server';
import { getWorkers } from '@/services/user.service';

export async function GET() {
  try {
    const workers = await getWorkers();
    return NextResponse.json(workers);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
