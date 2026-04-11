-- RELAX RLS POLICIES FOR TESTING (INCLUDING ANON)
-- Run this if you are testing without a proper auth session.

DROP POLICY IF EXISTS "Allow all access to products" ON products;
CREATE POLICY "Allow all access to products" ON products
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to bom" ON bom;
CREATE POLICY "Allow all access to bom" ON bom
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to bom_materials" ON bom_materials;
CREATE POLICY "Allow all access to bom_materials" ON bom_materials
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to bom_operations" ON bom_operations;
CREATE POLICY "Allow all access to bom_operations" ON bom_operations
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to materials" ON materials;
CREATE POLICY "Allow all access to materials" ON materials
  FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to operations" ON operations;
CREATE POLICY "Allow all access to operations" ON operations
  FOR ALL TO public USING (true) WITH CHECK (true);
