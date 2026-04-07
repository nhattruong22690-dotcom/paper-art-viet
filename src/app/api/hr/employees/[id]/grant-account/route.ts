import { NextRequest, NextResponse } from 'next/server';
import { grantUserAccount } from '@/services/employee.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: employeeId } = await params;
  
  try {
    const { email, role } = await req.json();
    if (!email || !role) {
      return NextResponse.json({ error: 'Email and Role are required' }, { status: 400 });
    }

    const result = await grantUserAccount(employeeId, email, role);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Grant account error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
