-- Run this SQL in your Supabase SQL Editor to add the currency column to the Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'VND';
