-- HR Audit Extension
-- Chạy thêm đoạn này để hỗ trợ trang Chi tiết Nhân sự

-- Bảng Lịch sử công việc (Salary/Dept/Status History)
CREATE TABLE IF NOT EXISTS "job_history" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES "Employees"(id) ON DELETE CASCADE,
    change_type TEXT, -- salary_change, dept_change, status_change
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for quick lookups
CREATE INDEX IF NOT EXISTS idx_job_history_employee ON job_history(employee_id);
