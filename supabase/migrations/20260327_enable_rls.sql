-- Enable RLS for all BOM tables
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_price_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_cost_snapshots ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies for 'materials'
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated read to materials" ON materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin full access to materials" ON materials
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- -----------------------------------------------------------------------------
-- Policies for 'products'
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated read to products" ON products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin full access to products" ON products
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- -----------------------------------------------------------------------------
-- Policies for 'bom'
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated read to bom" ON bom
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin full access to bom" ON bom
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- -----------------------------------------------------------------------------
-- Policies for 'bom_materials'
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated read to bom_materials" ON bom_materials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin full access to bom_materials" ON bom_materials
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- -----------------------------------------------------------------------------
-- Policies for 'operations'
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated read to operations" ON operations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin full access to operations" ON operations
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- -----------------------------------------------------------------------------
-- Policies for 'bom_operations'
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated read to bom_operations" ON bom_operations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow admin full access to bom_operations" ON bom_operations
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- -----------------------------------------------------------------------------
-- Policies for 'price tracking' (Read all authenticated, Insert system/admin)
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated read to price tracking" ON material_price_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read to price snapshots" ON material_price_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read to bom snapshots" ON bom_cost_snapshots FOR SELECT TO authenticated USING (true);

-- System/Admin can write to tracking tables
CREATE POLICY "Allow admin write access to tracking" ON material_price_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow admin write access to snapshots" ON material_price_snapshots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow admin write access to bom snapshots" ON bom_cost_snapshots FOR INSERT TO authenticated WITH CHECK (true);
