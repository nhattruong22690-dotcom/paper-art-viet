import { NextRequest, NextResponse } from 'next/server';
import { checkContractCodeDuplicate } from '@/services/order.service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing contract code' }, { status: 400 });
  }

  try {
    const isDuplicate = await checkContractCodeDuplicate(code);
    return NextResponse.json({ isDuplicate });
  } catch (error: any) {
    console.error('Check Duplicate API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
