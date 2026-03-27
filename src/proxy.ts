import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize a lightweight Supabase client for Middleware
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export async function proxy(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // 1. Skip middleware for static assets, public files, and /login
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') || 
    pathname === '/login' ||
    pathname === '/favicon.ico'
  ) {
    return res;
  }

  // 2. CHECK CUSTOM SESSION
  const sessionToken = req.cookies.get('pap-session')?.value;
  let user: any = null;

  try {
    if (sessionToken) {
      user = JSON.parse(Buffer.from(sessionToken, 'base64').toString('utf8'));
    }
  } catch (err) {
    console.error('Middleware: Session Parse Error');
  }

  // Redirect to login if NO AUTH (except for maintenance)
  if (!user && pathname !== '/maintenance') {
     return NextResponse.redirect(new URL('/login', req.url));
  }

  // 3. IF AUTHENTICATED: Get Role and System Config
  if (user) {
    // a. Fetch Maintenance State
    const { data: config } = await supabase
      .from('SystemConfig')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();

    const isMaintenance = !!config?.value?.is_maintenance;

    // b. Fetch User Role & Active Status (Live update check)
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    const role = profile?.role || user.role || 'User';
    const isActive = profile?.is_active ?? true;

    // c. STATUS CHECK: If Locked
    if (!isActive) {
       const redirectRes = NextResponse.redirect(new URL('/login?error=account_locked', req.url));
       redirectRes.cookies.delete('pap-session');
       return redirectRes;
    }

    // d. MAINTENANCE CHECK: Only Admin bypasses
    if (isMaintenance && role.toLowerCase() !== 'admin' && pathname !== '/maintenance') {
       return NextResponse.redirect(new URL('/maintenance', req.url));
    }

    // e. RBAC: PROTECT ADMIN ROUTES
    if (role.toLowerCase() !== 'admin') {
       const adminRoutes = ['/settings', '/hr/users', '/logs', '/admin'];
       if (adminRoutes.some(route => pathname.startsWith(route))) {
          return NextResponse.redirect(new URL('/', req.url));
       }
    }
  }

  return res;
}

// Ensure middleware runs for all page routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
