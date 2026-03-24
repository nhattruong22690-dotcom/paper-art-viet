import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { grantUserAccount } from '@/services/employee.service';

export async function GET() {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        employees:employee_id (full_name, employee_code)
      `)
      .order('email');

    if (error) throw error;

    // Transform to match frontend expectations
    const transformedUsers = users.map(u => ({
      ...u,
      employeeName: u.employees?.full_name,
      employeeCode: u.employees?.employee_code
    }));

    return NextResponse.json(transformedUsers);
  } catch (error: any) {
    console.error('API Error /api/hr/users (GET):', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { employeeId, email, role } = data;

    if (!employeeId || !email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newUser = await grantUserAccount(employeeId, email, role);
    return NextResponse.json(newUser);
  } catch (error: any) {
    console.error('API Error /api/hr/users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
