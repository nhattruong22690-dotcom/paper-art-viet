-- ==========================================================
-- FIX RLS POLICIES FOR MATERIAL TABLE
-- ==========================================================

-- Enable RLS on Material table (if not already enabled)
ALTER TABLE "Material" ENABLE ROW LEVEL SECURITY;

-- 1. Quyền xem (SELECT): Cho phép tất cả người dùng đã đăng nhập (hoặc cả anon nếu ứng dụng yêu cầu)
-- Ở đây ERP nên giới hạn cho authenticated users
CREATE POLICY "Enable read access for all authenticated users" 
ON "Material" FOR SELECT 
TO authenticated 
USING (true);

-- 2. Quyền thêm/sửa/xóa (INSERT/UPDATE/DELETE): Thường dành cho Admin hoặc Warehouse
CREATE POLICY "Enable insert for warehouse and admin" 
ON "Material" FOR INSERT 
TO authenticated 
WITH CHECK (auth.jwt() ->> 'role' IN ('warehouse', 'admin'));

CREATE POLICY "Enable update for warehouse and admin" 
ON "Material" FOR UPDATE 
TO authenticated 
USING (auth.jwt() ->> 'role' IN ('warehouse', 'admin'))
WITH CHECK (auth.jwt() ->> 'role' IN ('warehouse', 'admin'));

-- GHI CHÚ: Sau khi chạy lệnh này, bạn hãy reload lại trang Vật tư.
