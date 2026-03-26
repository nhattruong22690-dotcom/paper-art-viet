import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use Service Role Key for Admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  try {
    const { userId, role, isActive, permissions } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Thiếu thông tin người dùng' }, { status: 400 });
    }

    // Call custom RPC function for secure role/permission update
    // This function must exist in public schema and have SECURITY DEFINER
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('manage_user_permissions', {
      target_user_id: userId,
      new_role: role.toLowerCase(),
      new_permissions: permissions // This is now a JSONB object
    });

    if (rpcError) {
      console.error('RPC Error details:', rpcError);
      throw rpcError;
    }

    // Also update is_active in auth.users
    try {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { 
          user_metadata: { is_active: isActive },
          // Update app_metadata as well just in case RPC didn't catch everything
          app_metadata: { role: role.toLowerCase(), permissions }
        }
      );
      if (authError && authError.message.includes('User not found')) {
        console.warn(`Auth user ${userId} not found, skipping auth update.`);
      } else if (authError) {
        throw authError;
      }
    } catch (e: any) {
      console.warn('Auth Update skipped:', e.message);
    }

    // Update public.users table for profile consistency
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({ 
        role: role.toLowerCase(), 
        is_active: isActive,
        permissions: permissions // Ensure public.users has this JSONB column
      })
      .eq('id', userId);

    if (profileError) throw profileError;

    return NextResponse.json({ success: true, message: 'Cập nhật ấn tín thành công' });
  } catch (error: any) {
    console.error('Admin Role Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
