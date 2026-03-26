-- ==========================================================
-- FIX LỖI RLS CHO BẢNG PRODUCT & BOMITEM
-- ==========================================================

-- 1. BẢNG PRODUCT
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Product" ON "Product";
CREATE POLICY "Allow All Product" ON "Product" FOR ALL USING (true);

-- 2. BẢNG BOMITEM
ALTER TABLE "BOMItem" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All BOMItem" ON "BOMItem";
CREATE POLICY "Allow All BOMItem" ON "BOMItem" FOR ALL USING (true);
