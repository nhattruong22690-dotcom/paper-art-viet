import { NextResponse } from 'next/server';
import { getAllProducts } from '@/services/product.service';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    console.error('API Products Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
