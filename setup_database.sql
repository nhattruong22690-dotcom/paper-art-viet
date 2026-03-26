-- ==========================================================
-- PAV ERP - CORE DATABASE SETUP
-- ==========================================================

-- 1. System Configuration Table (Critical for App Boot)
CREATE TABLE IF NOT EXISTS "SystemConfig" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default maintenance mode to OFF
INSERT INTO "SystemConfig" (key, value)
VALUES ('maintenance_mode', '{"is_maintenance": false, "message": "Hệ thống đang bảo trì."}')
ON CONFLICT (key) DO NOTHING;

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS "users" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'User',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Employees Table
CREATE TABLE IF NOT EXISTS "Employees" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    department TEXT DEFAULT 'SX',
    position TEXT DEFAULT 'Công nhân',
    status TEXT DEFAULT 'active',
    join_date DATE DEFAULT CURRENT_DATE,
    salary_type TEXT DEFAULT 'monthly',
    base_salary DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Other ERP Tables (Placeholders - based on services)
-- For a full setup, you might need:
-- "Materials", "Products", "PurchaseOrder", "WorkLog", etc.

-- 5. RPC Helper for Permissions (from supabase-rpc-permissions.sql)
CREATE OR REPLACE FUNCTION manage_user_permissions(
  target_user_id UUID, 
  new_role TEXT, 
  new_permissions TEXT[]
)
RETURNS VOID AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || 
    jsonb_build_object('role', new_role, 'permissions', new_permissions)
  WHERE id = target_user_id;

  UPDATE public.users
  SET role = new_role
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
