import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await req.json();
    const code = data.customerCode || data.customer_code || '';

    // Check unique if code changes
    if (code) {
      const existing = await prisma.customer.findFirst({
        where: { 
          customerCode: code,
          id: { not: id }
        }
      });
      if (existing) {
        return NextResponse.json({ error: 'Mã khách hàng này đã tồn tại, vui lòng kiểm tra lại' }, { status: 409 });
      }
    }
    
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        customerCode: code.trim().toUpperCase(),
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        notes: data.notes || '',
      }
    });
    
    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Update Customer API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.customer.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete Customer API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
