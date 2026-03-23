import { NextRequest, NextResponse } from 'next/server';
import { getProductionOrderProfit } from '@/services/workLog.service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing production order ID' }, { status: 400 });
  }

  try {
    const data = await getProductionOrderProfit(id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
