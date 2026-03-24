import { NextResponse } from 'next/server';
import { getFinishedProductionItems, createPackage } from '@/services/warehouse.service';

export async function GET() {
  try {
    const items = await getFinishedProductionItems();
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const pkg = await createPackage(body);
    return NextResponse.json(pkg);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create package' }, { status: 500 });
  }
}
