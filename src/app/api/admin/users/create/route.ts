import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Administrative API to create a user in both Auth and Public schema.
 * Only accessible if SUPABASE_SERVICE_ROLE_KEY is configured.
 */
export async function POST(req: Request) {
  try {
    const { email, password, role, employeeId, name } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 });
    }

    // Check if the provided login string is a valid email format
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    
    // 1. CREATE USER IN AUTH (Bypass email confirmation)
    // If it's not a real email, we use a internal domain placeholder for Supabase Auth's validation
    const authEmail = isEmail ? email : `${email.replace(/[^a-zA-Z0-9]/g, '_')}@pav-system.internal`;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password,
      email_confirm: true,
      user_metadata: { name, role, original_login: email }
    });

    if (authError) {
      console.error('Auth Creation Failed:', authError);
      return NextResponse.json({ error: `Lỗi Hệ thống (Auth): ${authError.message}` }, { status: 400 });
    }

    const userId = authData.user?.id;

    // 2. CREATE USER IN PUBLIC SCHEMA (Link to auth.id + store password for traditional login)
    // We use upsert because some databases have triggers that auto-create a user row in public.users
    const { error: publicError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        employee_id: employeeId || null,
        email,
        password, // Store for traditional login
        role,
        is_active: true
      });

    if (publicError) {
      console.error('Public Record Creation Failed:', publicError);
      // Optional: Cleanup Auth user if public insert fails
      // await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: `Lỗi DB: ${publicError.message}` }, { status: 400 });
    }

    return NextResponse.json({ 
       success: true, 
       userId,
       message: `Đã tạo tài khoản ${email} thành công`
    });

  } catch (error: any) {
    console.error('Admin API Exception:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống khi tạo user' }, { status: 500 });
  }
}
