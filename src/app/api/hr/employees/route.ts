import { NextResponse } from 'next/server';
import { getEmployees, createEmployee } from '@/services/employee.service';

export async function GET() {
  try {
    const employees = await getEmployees();
    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('API Error /api/hr/employees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newEmployee = await createEmployee(data);
    return NextResponse.json(newEmployee);
  } catch (error: any) {
    console.error('API Error POST /api/hr/employees:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
