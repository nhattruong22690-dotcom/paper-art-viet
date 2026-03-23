import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json({ error: 'Missing customer ID' }, { status: 400 });
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Lấy mã khách hàng (Ưu tiên customerCode, fallback lấy 3 chữ cái đầu hoa)
    const customerCode = (customer as any).customerCode || customer.name.substring(0, 3).toUpperCase();
    const nextNumber = (customer._count?.orders || 0) + 1;
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    
    // Ngày hiện tại định dạng MMDDYYYY
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${mm}${dd}${yyyy}`;

    const contractCode = `${customerCode}-HD${formattedNumber}-${dateStr}`;

    return NextResponse.json({ contractCode });
  } catch (error: any) {
    console.error('Next Contract Code API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
