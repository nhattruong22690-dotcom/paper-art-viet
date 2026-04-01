-- Thêm các cột KPI và Trạng thái nhân viên mới
ALTER TABLE public."Employees" ADD COLUMN IF NOT EXISTS is_kpi BOOLEAN DEFAULT false;
ALTER TABLE public."Employees" ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT true;

-- Đảm bảo các giá trị NULL cũ được đưa về FALSE
UPDATE public."Employees" SET is_kpi = false WHERE is_kpi IS NULL;
UPDATE public."Employees" SET is_new = false WHERE created_at < NOW() - INTERVAL '1 minute';

-- Thiết lập lại Default cho cột (đề phòng trường hợp đã tồn tại nhưng default khác)
ALTER TABLE public."Employees" ALTER COLUMN is_kpi SET DEFAULT false;
ALTER TABLE public."Employees" ALTER COLUMN is_new SET DEFAULT true;
