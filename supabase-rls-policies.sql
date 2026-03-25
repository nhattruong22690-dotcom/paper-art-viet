-- ==========================================================
-- SQL RLS POLICIES - PAPER ART VIET ERP (RETRO REVOLUTION)
-- ==========================================================

-- 1. Bảng PurchaseOrder (Đơn mua hàng)
ALTER TABLE "PurchaseOrder" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: Full access to PurchaseOrder" 
ON "PurchaseOrder" FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Warehouse/Admin: Can insert PurchaseOrder" 
ON "PurchaseOrder" FOR INSERT TO authenticated 
WITH CHECK (auth.jwt() ->> 'role' IN ('warehouse', 'admin') AND (auth.uid() = user_id OR user_id IS NULL));

-- 2. Bảng MaterialTransaction (Nhật ký kho / inventory_logs)
ALTER TABLE "MaterialTransaction" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: Full access to MaterialTransaction" 
ON "MaterialTransaction" FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Warehouse/Admin: Can insert MaterialTransaction" 
ON "MaterialTransaction" FOR INSERT TO authenticated 
WITH CHECK (auth.jwt() ->> 'role' IN ('warehouse', 'admin') AND auth.uid() = user_id);

-- 3. Bảng Employees (Hồ sơ nhân viên)
ALTER TABLE "Employees" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: Full access to Employees" 
ON "Employees" FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users: Update own profile" 
ON "Employees" FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 4. Bảng users (Tài khoản người dùng)
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin: Full access to users" 
ON "users" FOR ALL TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users: View own account" 
ON users FOR SELECT TO authenticated 
USING (auth.uid() = id);

-- ==========================================================
-- LƯU Ý: Phải đảm bảo app_metadata trong Auth mang theo field 'role'.
-- Truy vấn kiểm tra role trong JWT: auth.jwt() ->> 'role'
-- ==========================================================
