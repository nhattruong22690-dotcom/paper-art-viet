-- REFACTOR MATERIALS AND OPERATIONS TABLES
-- Standardize both tables to have: id, type, specification, unit, price

-- 1. Materials table
ALTER TABLE materials 
RENAME COLUMN type TO category; -- temporary rename to avoid conflict if I want to use 'type'

-- Add missing columns or rename
ALTER TABLE materials 
RENAME COLUMN category TO type; -- ensure it's called 'type'
-- (already has 'id', 'type', 'unit')

-- Add specification and price if not present
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='specification') THEN
    ALTER TABLE materials ADD COLUMN specification TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materials' AND column_name='price') THEN
    ALTER TABLE materials ADD COLUMN price NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Update price from cost if price is new
UPDATE materials SET price = cost WHERE price = 0 AND cost > 0;

-- 2. Operations table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='type') THEN
    ALTER TABLE operations ADD COLUMN type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='specification') THEN
    ALTER TABLE operations ADD COLUMN specification TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='unit') THEN
    ALTER TABLE operations ADD COLUMN unit TEXT DEFAULT 'Lần';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='operations' AND column_name='price') THEN
    ALTER TABLE operations ADD COLUMN price NUMERIC DEFAULT 0;
  END IF;
END $$;

-- Update price from cost_per_unit
UPDATE operations SET price = cost_per_unit WHERE price = 0 AND cost_per_unit > 0;
UPDATE operations SET specification = name WHERE specification IS NULL;
