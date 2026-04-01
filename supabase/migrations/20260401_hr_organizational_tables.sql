-- Create HR Departments table
CREATE TABLE IF NOT EXISTS public.hr_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HR Positions table
CREATE TABLE IF NOT EXISTS public.hr_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hr_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_positions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_departments' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON public.hr_departments FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_departments' AND policyname = 'Enable all access for authenticated users') THEN
        CREATE POLICY "Enable all access for authenticated users" ON public.hr_departments USING (auth.role() = 'authenticated');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_positions' AND policyname = 'Enable read access for all users') THEN
        CREATE POLICY "Enable read access for all users" ON public.hr_positions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_positions' AND policyname = 'Enable all access for authenticated users') THEN
        CREATE POLICY "Enable all access for authenticated users" ON public.hr_positions USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- Initial Data
INSERT INTO public.hr_departments (name) VALUES 
('Sản xuất (SX)'), 
('Kho vận (KHO)'), 
('Hành chính (HC)'), 
('Kỹ thuật (KT)'), 
('Kinh doanh (SALE)') 
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.hr_positions (name) VALUES 
('Công nhân'), 
('Tổ trưởng'), 
('Quản lý'), 
('Kỹ thuật viên'), 
('Nhân viên') 
ON CONFLICT (name) DO NOTHING;

-- Cleanup existing data except admin
-- We keep rows where name contains 'Admin' or code is 'ADMIN' or 'NV000'
DELETE FROM public."Employees" 
WHERE full_name NOT ILIKE '%admin%' 
  AND employee_code NOT IN ('ADMIN', 'NV000');
