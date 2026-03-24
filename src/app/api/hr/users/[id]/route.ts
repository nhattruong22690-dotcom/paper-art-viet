import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserById, 
  updateUserStatus, 
  resetUserPassword, 
  updateUserRole 
} from '@/services/employee.service';

const isValidUuid = (id: string) => 
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id === 'undefined' || !isValidUuid(id)) {
    return NextResponse.json({ error: 'Mã tài khoản không hợp lệ (UUID required)' }, { status: 400 });
  }

  try {
    const user = await getUserById(id);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || id === 'undefined' || !isValidUuid(id)) {
    return NextResponse.json({ error: 'Mã tài khoản không hợp lệ (UUID required)' }, { status: 400 });
  }

  try {
    const data = await req.json();
    
    // Determine which action to perform
    if (typeof data.is_active === 'boolean') {
      const updated = await updateUserStatus(id, data.is_active);
      return NextResponse.json(updated);
    }
    
    if (data.newPassword) {
      await resetUserPassword(id, data.newPassword);
      return NextResponse.json({ success: true });
    }
    
    if (data.role) {
      const updated = await updateUserRole(id, data.role);
      return NextResponse.json(updated);
    }
    
    return NextResponse.json({ error: 'No valid action provided' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
