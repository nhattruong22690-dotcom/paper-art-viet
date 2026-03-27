-- UPDATE PRODUCTS TABLE SCHEMA
-- Run this in your Supabase SQL Editor to add missing columns for the new Product system.

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS wholesale_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS export_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS production_time_std INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cogs_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS active_bom_id UUID;

-- Optional: Add a foreign key if you want strict referential integrity
-- ALTER TABLE products ADD CONSTRAINT fk_active_bom FOREIGN KEY (active_bom_id) REFERENCES bom(id);
