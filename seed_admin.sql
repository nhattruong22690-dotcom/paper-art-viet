-- SQL SEED: ROOT ADMINISTRATOR
-- Chạy đoạn mã này trong Supabase SQL Editor để khởi tạo tài khoản quyền lực nhất

-- 1. Tạo hồ sơ nhân sự "Sếp Tổng" (Root Admin)
INSERT INTO "Employees" (
    id, 
    employee_code, 
    full_name, 
    department, 
    position, 
    status,
    salary_type,
    base_salary
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'PAV-ADMIN',
    'ADMINISTRATOR',
    'Hội đồng Quản trị',
    'Tổng Giám Đốc',
    'active',
    'monthly',
    0
) ON CONFLICT (id) DO NOTHING;

-- 2. Tạo tài khoản đăng nhập với quyền Admin cao nhất
INSERT INTO "users" (
    employee_id,
    email,
    password_hash,
    role,
    is_active
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'admin',
    'admin2206@', -- Lưu ý: Trong thực tế ta nên băm pass, nhưng hiện tại ta khớp chính xác chuỗi này
    'Admin',
    true
) ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, role = 'Admin';
