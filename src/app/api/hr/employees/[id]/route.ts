import { NextRequest, NextResponse } from 'next/server';
import { 
  getEmployeeById, 
  updateEmployee, 
  deleteEmployee, 
  getJobHistory 
} from '@/services/employee.service';

const isValidUuid = (id: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id === 'undefined' || !isValidUuid(id)) {
    return NextResponse.json({ error: 'Mã nhân viên (ID) không hợp lệ (UUID required)' }, { status: 400 });
  }

  try {
    const employee = await getEmployeeById(id);
    const history = await getJobHistory(id);
    return NextResponse.json({ ...employee, history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id === 'undefined' || !isValidUuid(id)) {
    return NextResponse.json({ error: 'Mã nhân viên (ID) không hợp lệ (UUID required)' }, { status: 400 });
  }

  try {
    const data = await req.json();
    const updated = await updateEmployee(id, data);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id === 'undefined' || !isValidUuid(id)) {
    return NextResponse.json({ error: 'Mã nhân viên (ID) không hợp lệ (UUID required)' }, { status: 400 });
  }

  try {
    await deleteEmployee(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
