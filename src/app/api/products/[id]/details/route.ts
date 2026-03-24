import { NextRequest, NextResponse } from 'next/server';
import { getProductDetail } from '@/services/product.service';
import { calculateProductCOGS } from '@/services/order.service';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 1. Lấy thông tin cơ bản và BOM
    const product = await getProductDetail(id);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Tính toán COGS dựa trên giá vật tư mới nhất
    const calculatedCogs = await calculateProductCOGS(id);

    return NextResponse.json({
      ...product,
      costPrice: Number(product.costPrice || calculatedCogs || 0),
      wholesalePrice: Number(product.wholesalePrice || 0),
      exportPrice: Number(product.exportPrice || 0),
      calculatedCogs // Keep for backward compatibility if needed
    });
  } catch (error: any) {
    console.error('API Product Detail Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
