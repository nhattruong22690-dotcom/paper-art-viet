-- CHANGE production_time_std TYPE TO NUMERIC TO SUPPORT DECIMALS
ALTER TABLE products 
ALTER COLUMN production_time_std TYPE numeric USING production_time_std::numeric;
