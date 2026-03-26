-- ==========================================================
-- PAV ERP - COMPREHENSIVE DATABASE SETUP & RLS FIX
-- ==========================================================

-- 0. Core Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SYSTEM CONFIGURATION
CREATE TABLE IF NOT EXISTS "SystemConfig" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default maintenance mode
INSERT INTO "SystemConfig" (key, value)
VALUES ('maintenance_mode', '{"is_maintenance": false, "message": "Hệ thống đang bảo trì."}')
ON CONFLICT (key) DO NOTHING;

-- 2. USER PROFILES
CREATE TABLE IF NOT EXISTS "users" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'User',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. EMPLOYEES
CREATE TABLE IF NOT EXISTS "Employees" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    department TEXT DEFAULT 'SX',
    position TEXT DEFAULT 'Công nhân',
    status TEXT DEFAULT 'active',
    join_date DATE DEFAULT CURRENT_DATE,
    salary_type TEXT DEFAULT 'monthly',
    base_salary DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. MATERIALS (VẬT TƯ)
CREATE TABLE IF NOT EXISTS "Material" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    unit TEXT,
    type TEXT,
    min_stock DECIMAL(15,2) DEFAULT 0,
    stock_quantity DECIMAL(15,2) DEFAULT 0,
    reference_price DECIMAL(15,2) DEFAULT 0,
    purchase_price DECIMAL(15,2) DEFAULT 0,
    purchase_quantity DECIMAL(15,2) DEFAULT 0,
    unit_price DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. MATERIAL BATCHES & TRANSACTIONS
CREATE TABLE IF NOT EXISTS "MaterialBatch" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_code TEXT UNIQUE NOT NULL,
    material_id UUID REFERENCES "Material"(id) ON DELETE CASCADE,
    purchase_price DECIMAL(15,2) DEFAULT 0,
    initial_quantity DECIMAL(15,2) DEFAULT 0,
    remain_quantity DECIMAL(15,2) DEFAULT 0,
    location TEXT,
    source_po_item_id UUID, -- Will link to PurchaseOrderItem later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "MaterialTransaction" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID REFERENCES "Material"(id) ON DELETE CASCADE,
    partner_id UUID, -- Will link to Partner later
    batch_id UUID REFERENCES "MaterialBatch"(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'inward', 'outward'
    quantity DECIMAL(15,2) NOT NULL,
    price DECIMAL(15,2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. PARTNERS (Suppliers/Customers)
CREATE TABLE IF NOT EXISTS "Partner" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    is_supplier BOOLEAN DEFAULT false,
    partner_category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Supplier" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CUSTOMERS & ORDERS
CREATE TABLE IF NOT EXISTS "Customer" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code TEXT UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    customer_group TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "Order" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_code TEXT UNIQUE NOT NULL,
    customer_id UUID REFERENCES "Customer"(id) ON DELETE SET NULL,
    deadline_delivery TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PRODUCTS & BOM
CREATE TABLE IF NOT EXISTS "Product" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    base_price DECIMAL(15,2) DEFAULT 0,
    cost_price DECIMAL(15,2) DEFAULT 0,
    wholesale_price DECIMAL(15,2) DEFAULT 0,
    export_price DECIMAL(15,2) DEFAULT 0,
    production_time_std DECIMAL(15,2),
    cogs_config JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "BOMItem" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES "Product"(id) ON DELETE CASCADE,
    material_id UUID REFERENCES "Material"(id) ON DELETE CASCADE,
    quantity DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "CustomerDefaultProduct" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES "Customer"(id) ON DELETE CASCADE,
    product_id UUID REFERENCES "Product"(id) ON DELETE CASCADE,
    default_quantity DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES "Order"(id) ON DELETE CASCADE,
    product_id UUID REFERENCES "Product"(id) ON DELETE CASCADE,
    quantity DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. PRODUCTION
CREATE TABLE IF NOT EXISTS "ProductionOrder" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES "Order"(id) ON DELETE CASCADE,
    product_id UUID REFERENCES "Product"(id) ON DELETE CASCADE,
    quantity_target DECIMAL(15,2) NOT NULL,
    quantity_completed DECIMAL(15,2) DEFAULT 0,
    deadline_production TIMESTAMP WITH TIME ZONE,
    current_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'qc', 'completed'
    allocation_type TEXT DEFAULT 'internal', -- 'internal', 'outsourced'
    assigned_to TEXT,
    contract_price DECIMAL(15,2) DEFAULT 0,
    priority TEXT DEFAULT 'Medium',
    outsourced_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "WorkLog" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID REFERENCES "ProductionOrder"(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES "Employees"(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Keeping for compatibility
    staff_name TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    quantity_produced DECIMAL(15,2) DEFAULT 0,
    technical_error_count DECIMAL(15,2) DEFAULT 0,
    material_error_count DECIMAL(15,2) DEFAULT 0,
    error_note TEXT,
    status TEXT DEFAULT 'completed',
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. PACKING & WAREHOUSE
CREATE TABLE IF NOT EXISTS "Package" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES "Order"(id) ON DELETE SET NULL,
    package_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'packing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "PackingListDetail" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID REFERENCES "Package"(id) ON DELETE CASCADE,
    product_id UUID REFERENCES "Product"(id) ON DELETE CASCADE,
    quantity DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. PURCHASE
CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number TEXT UNIQUE NOT NULL,
    supplier_id UUID REFERENCES "Supplier"(id) ON DELETE SET NULL,
    expected_delivery_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    total_amount DECIMAL(15,2) DEFAULT 0,
    status TEXT DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "PurchaseOrderItem" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES "PurchaseOrder"(id) ON DELETE CASCADE,
    material_id UUID REFERENCES "Material"(id) ON DELETE CASCADE,
    quantity_ordered DECIMAL(15,2) NOT NULL,
    quantity_received DECIMAL(15,2) DEFAULT 0,
    expected_price DECIMAL(15,2) DEFAULT 0,
    total_expected DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================================
-- UNIVERSAL RLS POLICIES (AUTHENTICATED READ-ALL)
-- ==========================================================

DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Drop existing policies to avoid conflict
        EXECUTE format('DROP POLICY IF EXISTS "Enable read for authenticated" ON %I', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable write for admin/warehouse" ON %I', t);

        -- Policy: authenticated users can READ everything
        EXECUTE format('CREATE POLICY "Enable read for authenticated" ON %I FOR SELECT TO authenticated USING (true)', t);
        
        -- Policy: authenticated users can WRITE everything (Simplified for initial migration)
        -- In production, you'd restrict this by role
        EXECUTE format('CREATE POLICY "Enable write for authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
