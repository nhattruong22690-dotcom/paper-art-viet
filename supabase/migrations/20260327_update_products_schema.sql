-- Add missing columns to products table for UI compatibility and versioning
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesale_price numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS export_price numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS production_time_std numeric DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cogs_config jsonb DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS active_bom_id uuid;

-- Optional: Add foreign key if not exists (only if you want to strictly enforce it)
-- ALTER TABLE products ADD CONSTRAINT fk_active_bom FOREIGN KEY (active_bom_id) REFERENCES bom(id) ON DELETE SET NULL;
