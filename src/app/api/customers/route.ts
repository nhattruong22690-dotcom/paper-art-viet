import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });

    // Manually map to ensure 'customerCode' is always present from the DB field 'customer_code'
    const mappedCustomers = customers.map((c: any) => {
      const code = c.customerCode || c.customer_code || '';
      return {
        ...c,
        customerCode: code,
        customer_code: code // Ensure snake_case is also present for absolute safety
      };
    });

    return NextResponse.json(mappedCustomers);
  } catch (error: any) {
    console.error('Fetch Customers API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const code = (data.customerCode || data.customer_code || '').toUpperCase();

    if (code) {
      const existing = await prisma.customer.findUnique({
        where: { customerCode: code }
      });
      if (existing) {
        return NextResponse.json({ error: 'Mã khách hàng này đã tồn tại, vui lòng kiểm tra lại' }, { status: 409 });
      }
    }

    const customer = await prisma.customer.create({
      data: {
        customerCode: code.trim(),
        name: data.name,
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        notes: data.notes || '',
      }
    });
    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Create Customer API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
