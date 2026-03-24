import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập đầy đủ email và mật khẩu' }, { status: 400 });
    }

    // Query our public.users table directly for the password match
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 });
    }

    if (!user.is_active) {
      return NextResponse.json({ error: 'Tài khoản của bạn đã bị khóa' }, { status: 403 });
    }

    // Create a simple session cookie
    const sessionData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name || user.email.split('@')[0]
    };

    // Store session as a base64 encoded string for simplicity in the middleware
    const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    const response = NextResponse.json({
      success: true,
      user: sessionData
    });

    // Set a secure HTTP-only cookie
    response.cookies.set('pap-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;
  } catch (err: any) {
    console.error('Login API Error:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống khi đăng nhập' }, { status: 500 });
  }
}
