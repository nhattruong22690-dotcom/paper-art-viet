-- COMPREHENSIVE PRODUCT SNAPSHOT SYSTEM
-- This migration creates the snapshot table and backfills historical order data.

-- 1. Create the Snapshot Table
CREATE TABLE IF NOT EXISTS "OrderItemSnapshot" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES "OrderItem"(id) ON DELETE CASCADE,
    order_id UUID REFERENCES "Order"(id) ON DELETE CASCADE,
    product_id UUID, -- No active FK to allow deletion of master record
    name TEXT,
    sku TEXT,
    unit TEXT,
    prices JSONB, -- stores {base, cost, wholesale, export}
    production_time_std INTEGER,
    bom_data JSONB DEFAULT '[]'::jsonb,
    operations_data JSONB DEFAULT '[]'::jsonb,
    cogs_config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure unique snapshot per order item
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_item_snapshot_unique ON "OrderItemSnapshot" (order_item_id);

-- 2. Relax constraints and Add order_item_id to ProductionOrder
ALTER TABLE "OrderItem" ALTER COLUMN product_id DROP NOT NULL;
ALTER TABLE "ProductionOrder" ALTER COLUMN product_id DROP NOT NULL;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ProductionOrder' AND column_name = 'order_item_id') THEN
        ALTER TABLE "ProductionOrder" ADD COLUMN order_item_id UUID REFERENCES "OrderItem"(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. Backfill existing OrderItems with current product data (COMPREHENSIVE)
-- We use a CTE to pre-calculate the JSON snapshots for BOM and Operations
WITH ProductSnapshots AS (
    SELECT 
        p.id as product_id,
        p.name,
        p.code as sku,
        p.unit,
        jsonb_build_object(
            'base', p.base_price,
            'cost', p.cost_price,
            'wholesale', p.wholesale_price,
            'export', p.export_price
        ) as prices,
        p.production_time_std,
        p.cogs_config,
        -- Get Active BOM Materials
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'material_id', bm.material_id,
                        'qty', bm.qty,
                        'material_name', COALESCE(m.specification, m.name),
                        'material_sku', COALESCE(m.type, m.code),
                        'unit', m.unit,
                        'price', m.price
                    )
                )
                FROM bom b
                JOIN bom_materials bm ON b.id = bm.bom_id
                JOIN materials m ON bm.material_id = m.id
                WHERE b.product_id = p.id AND b.is_active = true
            ),
            '[]'::jsonb
        ) as bom_data,
        -- Get Active BOM Operations
        COALESCE(
            (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'operation_id', bo.operation_id,
                        'sequence', bo.sequence,
                        'name', COALESCE(ops.specification, ops.name),
                        'price', ops.price
                    )
                )
                FROM bom b
                JOIN bom_operations bo ON b.id = bo.bom_id
                JOIN operations ops ON bo.operation_id = ops.id
                WHERE b.product_id = p.id AND b.is_active = true
            ),
            '[]'::jsonb
        ) as operations_data
    FROM products p
)
INSERT INTO "OrderItemSnapshot" (
    order_item_id, 
    order_id, 
    product_id, 
    name, 
    sku, 
    unit, 
    prices,
    production_time_std, 
    bom_data, 
    operations_data, 
    cogs_config
)
SELECT 
    oi.id, 
    oi.order_id, 
    oi.product_id, 
    ps.name, 
    ps.sku, 
    ps.unit, 
    ps.prices,
    ps.production_time_std, 
    ps.bom_data, 
    ps.operations_data, 
    COALESCE(ps.cogs_config, '{}'::jsonb)
FROM "OrderItem" oi
JOIN ProductSnapshots ps ON oi.product_id = ps.product_id
ON CONFLICT (order_item_id) DO UPDATE SET
    bom_data = EXCLUDED.bom_data,
    operations_data = EXCLUDED.operations_data,
    prices = EXCLUDED.prices,
    name = EXCLUDED.name,
    sku = EXCLUDED.sku;

-- Backfill order_item_id in ProductionOrder (best effort join)
UPDATE "ProductionOrder" po
SET order_item_id = oi.id
FROM "OrderItem" oi
WHERE po.order_id = oi.order_id AND po.product_id = oi.product_id
AND po.order_item_id IS NULL;

-- 4. Re-config foreign keys to SET NULL on delete
DO $$ 
BEGIN
    ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_product_id_fkey";
    ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
    
    ALTER TABLE "ProductionOrder" DROP CONSTRAINT IF EXISTS "ProductionOrder_product_id_fkey";
    ALTER TABLE "ProductionOrder" ADD CONSTRAINT "ProductionOrder_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;
    
    ALTER TABLE "bom" DROP CONSTRAINT IF EXISTS "bom_product_id_fkey";
    ALTER TABLE "bom" ADD CONSTRAINT "bom_product_id_fkey" FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
END $$;

-- 5. Enable RLS
ALTER TABLE "OrderItemSnapshot" ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all authenticated access to OrderItemSnapshot') THEN
        CREATE POLICY "Allow all authenticated access to OrderItemSnapshot" ON "OrderItemSnapshot" 
          FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
