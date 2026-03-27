-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  unit text NOT NULL,
  cost numeric DEFAULT 0,
  type text CHECK (type IN ('paper', 'ink', 'glue')),
  created_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  unit text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create bom table
CREATE TABLE IF NOT EXISTS bom (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  version integer DEFAULT 1,
  is_active boolean DEFAULT false,
  note text,
  created_at timestamptz DEFAULT now()
);

-- Create bom_materials table
CREATE TABLE IF NOT EXISTS bom_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid REFERENCES bom(id) ON DELETE CASCADE,
  material_id uuid REFERENCES materials(id),
  qty numeric NOT NULL,
  scrap_rate numeric DEFAULT 0
);

-- Create operations table
CREATE TABLE IF NOT EXISTS operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cost_per_unit numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create bom_operations table
CREATE TABLE IF NOT EXISTS bom_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid REFERENCES bom(id) ON DELETE CASCADE,
  operation_id uuid REFERENCES operations(id),
  sequence integer NOT NULL
);

-- Create material_price_history table
CREATE TABLE IF NOT EXISTS material_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  old_price numeric,
  new_price numeric NOT NULL,
  changed_by uuid,
  changed_at timestamptz DEFAULT now()
);

-- Create material_price_snapshots table
CREATE TABLE IF NOT EXISTS material_price_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES materials(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create bom_cost_snapshots table
CREATE TABLE IF NOT EXISTS bom_cost_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bom_id uuid REFERENCES bom(id) ON DELETE CASCADE,
  material_cost numeric NOT NULL,
  operation_cost numeric NOT NULL,
  total_cost numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Trigger to record material price history and snapshots on cost update
CREATE OR REPLACE FUNCTION handle_material_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.cost <> NEW.cost) THEN
    -- Insert into history
    INSERT INTO material_price_history (material_id, old_price, new_price)
    VALUES (NEW.id, OLD.cost, NEW.cost);
    
    -- Insert into snapshots for charting
    INSERT INTO material_price_snapshots (material_id, price)
    VALUES (NEW.id, NEW.cost);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_material_price_change
AFTER UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION handle_material_price_change();
