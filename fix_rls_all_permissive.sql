-- ==========================================================
-- SIÊU FIX RLS: CHO PHÉP TRUY CẬP TOÀN BỘ BẢNG
-- ==========================================================
-- Lệnh này sẽ quét toàn bộ các bảng trong schema 'public'
-- và tạo policy cho phép SELECT/INSERT/UPDATE/DELETE thoải mái.
-- Dành cho môi trường Development/Testing để tránh lỗi quyền truy cập.

DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'schema_migrations' -- Tránh đụng vào bảng hệ thống của Supabase nếu có
    LOOP
        -- 1. Bật RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- 2. Xóa các policy cũ để tránh xung đột
        EXECUTE format('DROP POLICY IF EXISTS "Allow All Access" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable read for authenticated" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable write for authenticated" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow Select" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow All" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow All Product" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Allow All BOMItem" ON %I', t);

        -- 3. Tạo policy mới: Cho phép TẤT CẢ các thao tác (ALL) cho MỌI VAI TRÒ (PUBLIC/ANON)
        EXECUTE format('CREATE POLICY "Allow All Access" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
        
        RAISE NOTICE 'Đã fix RLS cho bảng: %', t;
    END LOOP;
END $$;
