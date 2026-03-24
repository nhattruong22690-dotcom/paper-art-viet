-- 1. Tạo bảng Employees để quản lý nhân sự chuyên nghiệp
CREATE TABLE IF NOT EXISTS "Employees" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code TEXT UNIQUE NOT NULL, -- Mã nhân viên (NV001, NV002...)
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    department TEXT DEFAULT 'SX', -- SX (Sản xuất), KHO (Kho vận), HC (Hành chính)
    position TEXT DEFAULT 'Công nhân', -- Công nhân, Tổ trưởng, Quản lý
    status TEXT DEFAULT 'active', -- active (đang làm), inactive (nghỉ việc)
    join_date DATE DEFAULT CURRENT_DATE,
    salary_type TEXT DEFAULT 'monthly', -- monthly (lương tháng), hourly (lương giờ)
    base_salary DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Cập nhật bảng User (Tài khoản đăng nhập) để liên kết với Nhân viên
-- User sẽ dùng để quản lý email/password và phân quyền hệ thống
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES "Employees"(id);
-- Cập nhật: đổi tên cột 'name' thành 'display_name' hoặc bỏ đi vì đã có full_name bên Employee
-- Ở đây ta cứ giữ nguyên User nếu ứng dụng đang chạy, chỉ thêm link.

-- 3. Cập nhật bảng WorkLog (Nhật ký sản xuất) để dùng Employee thay vì User
-- Điều này cho phép thống kê hiệu suất ngay cả khi nhân viên đó chưa có tài khoản đăng nhập
ALTER TABLE "WorkLog" ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES "Employees"(id);

-- GỢI Ý MIGRATION DỮ LIỆU (Nếu đã có công nhân trong bảng User):
-- INSERT INTO "Employees" (id, employee_code, full_name, position)
-- SELECT id, 'NV-' || id, name, role FROM "User" WHERE role = 'worker';

-- Cập nhật WorkLog sang employee_id mới
-- UPDATE "WorkLog" SET employee_id = user_id;
