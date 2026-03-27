-- RELAX RLS POLICIES FOR TESTING
-- Run this to allow all authenticated users to create products and BOMs during verification.
-- Note: Replace with strict admin checks in production.

DROP POLICY IF EXISTS "Allow authenticated read to products" ON products;
DROP POLICY IF EXISTS "Allow admin full access to products" ON products;

CREATE POLICY "Allow all authenticated access to products" ON products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read to bom" ON bom;
DROP POLICY IF EXISTS "Allow admin full access to bom" ON bom;

CREATE POLICY "Allow all authenticated access to bom" ON bom
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read to bom_materials" ON bom_materials;
DROP POLICY IF EXISTS "Allow admin full access to bom_materials" ON bom_materials;

CREATE POLICY "Allow all authenticated access to bom_materials" ON bom_materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read to bom_operations" ON bom_operations;
DROP POLICY IF EXISTS "Allow admin full access to bom_operations" ON bom_operations;

CREATE POLICY "Allow all authenticated access to bom_operations" ON bom_operations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- RELAX RLS FOR MATERIALS AND OPERATIONS
DROP POLICY IF EXISTS "Allow authenticated read to materials" ON materials;
CREATE POLICY "Allow all authenticated access to materials" ON materials
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read to operations" ON operations;
CREATE POLICY "Allow all authenticated access to operations" ON operations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
