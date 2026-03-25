import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isBrowser = typeof window !== 'undefined';

// Ensure Singleton for general use client
if (!(globalThis as any).__supabase) {
  (globalThis as any).__supabase = createClient(supabaseUrl, supabaseAnonKey);
}
export const supabase = (globalThis as any).__supabase as SupabaseClient;

// Ensure Singleton for admin client - ONLY ON SERVER
// We check for both !isBrowser and existence of the service key
if (!isBrowser && supabaseServiceKey) {
  if (!(globalThis as any).__supabaseAdmin) {
    (globalThis as any).__supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });
  }
}

// Fallback to regular supabase client in browser to avoid null references 
// (but it will still be subject to RLS with the anon key)
export const supabaseAdmin = ((globalThis as any).__supabaseAdmin || (globalThis as any).__supabase) as SupabaseClient;
