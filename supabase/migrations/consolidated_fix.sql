-- ==========================================================
-- CONSOLIDATED FIX: STANDARDIZATION & RLS RECURSION FIX
-- ==========================================================
-- This script:
-- 1. Standardizes materials/operations to 5 columns.
-- 2. Wipes ALL existing buggy/recursive policies.
-- 3. Implements clean, non-recursive RLS for all related tables.
-- ==========================================================

-- 1. Ensure columns exist for standardization
DO $$ 
BEGIN
    -- Materials
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'type') THEN
        ALTER TABLE materials ADD COLUMN type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'specification') THEN
        ALTER TABLE materials ADD COLUMN specification TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'price') THEN
        ALTER TABLE materials ADD COLUMN price DECIMAL(15,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'unit') THEN
        ALTER TABLE materials ADD COLUMN unit TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'supplier') THEN
        ALTER TABLE materials ADD COLUMN supplier TEXT;
    END IF;

    -- Operations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'type') THEN
        ALTER TABLE operations ADD COLUMN type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'specification') THEN
        ALTER TABLE operations ADD COLUMN specification TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'price') THEN
        ALTER TABLE operations ADD COLUMN price DECIMAL(15,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'supplier') THEN
        ALTER TABLE operations ADD COLUMN supplier TEXT;
    END IF;
END $$;

-- 2. Migrate data and rename safely
DO $$ 
BEGIN
    -- Materials rename migration
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'name') THEN
        UPDATE materials SET specification = name WHERE specification IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'code') THEN
        UPDATE materials SET type = code WHERE type IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'reference_price') THEN
        UPDATE materials SET price = reference_price WHERE price = 0 OR price IS NULL;
    END IF;
END $$;

-- 3. THE "NUCLEAR" RLS RESET (BREAKS RECURSION)
-- We drop EVERY policy that might touch the 'users' table or be recursive.

DO $$ 
DECLARE 
    tbl TEXT;
    pol TEXT;
BEGIN
    FOR tbl, pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('materials', 'operations', 'products', 'bom', 'bom_materials', 'bom_operations', 'users')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol, tbl);
    END LOOP;
END $$;

-- 4. IMPLEMENT CLEAN POLICIES (AUTHENTICATED ACCESS)
-- Note: We still use auth.jwt() logic for other things, but allow all authenticated for materials/ops for now.

-- USERS Table
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users: View own profile" ON "users" FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin: Full access to users" ON "users" FOR ALL TO authenticated 
  USING (true); -- Allow all authenticated for dev

-- MATERIALS Table
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated access to materials" ON materials 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- OPERATIONS Table
ALTER TABLE "operations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated access to operations" ON operations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PRODUCTS & BOM
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated access to products" ON products 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE "bom" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated access to bom" ON bom 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE "bom_materials" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated access to bom_materials" ON bom_materials 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. FIX LEGACY CONSTRAINTS (NOT NULL BLOCKED)
-- We make old columns nullable so they don't block new inserts that don't use them.

DO $$ 
BEGIN
    -- Materials legacy nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'code') THEN
        ALTER TABLE materials ALTER COLUMN code DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'name') THEN
        ALTER TABLE materials ALTER COLUMN name DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'cost') THEN
        ALTER TABLE materials ALTER COLUMN cost DROP NOT NULL;
    END IF;

    -- Operations legacy nullable
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'name') THEN
        ALTER TABLE operations ALTER COLUMN name DROP NOT NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'operations' AND column_name = 'cost_per_unit') THEN
        ALTER TABLE operations ALTER COLUMN cost_per_unit DROP NOT NULL;
    END IF;
END $$;

ALTER TABLE "bom_operations" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated access to bom_operations" ON bom_operations 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
