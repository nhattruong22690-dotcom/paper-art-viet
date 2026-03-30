-- ADD logs AND notes COLUMNS TO Order TABLE
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "logs" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- (Optional) If you want to index for performance (though likely small data)
-- CREATE INDEX IF NOT EXISTS idx_order_logs ON "Order" USING gin (logs);
