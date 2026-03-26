-- ==========================================================
-- LỆNH FIX LỖI "CÓ TRÊN DB NHƯNG KHÔNG HIỆN TRÊN WEB"
-- ==========================================================

-- 1. CHÈN QUYỀN XEM (SELECT) CHO TẤT CẢ NGƯỜI DÙNG
-- Điều này sẽ giúp App có thể nhìn thấy dữ liệu ngay lập tức.
DROP POLICY IF EXISTS "Allow Select" ON "Material";
CREATE POLICY "Allow Select" ON "Material" FOR SELECT USING (true);

-- 2. CHÈN QUYỀN THÊM/SỬA/XÓA (ALL)
DROP POLICY IF EXISTS "Allow All" ON "Material";
CREATE POLICY "Allow All" ON "Material" FOR ALL USING (true);


-- LƯU Ý: Nếu bạn có các bảng khác như 'Product', 'Order', 'ProductionOrder'...
-- mà cũng gặp tình trạng tương tự (có trong DB nhưng không hiện trên Web), 
-- hãy chạy file 'full_database_setup.sql' mình đã gửi trước đó. 
-- File đó đã bao gồm lệnh fix cho TẤT CẢ các bảng.
