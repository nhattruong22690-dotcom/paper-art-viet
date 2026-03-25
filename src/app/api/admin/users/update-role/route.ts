import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, role, isActive, permissions } = await req.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
       return NextResponse.json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // CALL THE POSTGRES RPC FUNCTION
    // handle_user_permissions(target_user_id, new_role, new_permissions)
    const { error: rpcError } = await supabaseAdmin.rpc('manage_user_permissions', {
      target_user_id: userId,
      new_role: role,
      new_permissions: permissions || ['read']
    });

    if (rpcError) {
      console.error('RPC manage_user_permissions Error:', rpcError);
      throw rpcError;
    }

    // Still update is_active in the profile table directly
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .update({ 
        is_active: isActive !== undefined ? isActive : true
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile Status Update Error:', profileError);
      throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error /api/admin/users/update-role:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
