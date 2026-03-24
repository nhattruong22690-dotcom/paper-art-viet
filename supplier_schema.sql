-- SCRIPT TẠO BẢNG NHÀ CUNG CẤP (SUPPLIER)
-- Chạy script này trong Supabase SQL Editor

-- 1. Tạo bảng Supplier
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "tax_id" TEXT UNIQUE,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "main_material_type" TEXT,
    "active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cập nhật bảng PurchaseOrder để tham chiếu sang Supplier thay vì Partner
-- Lưu ý: Nếu có dữ liệu cũ, bạn cần xử lý migration. Ở đây ta giả định bắt đầu mới.

-- Xóa liên kết cũ (nếu có)
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT IF EXISTS "PurchaseOrder_supplier_id_fkey";

-- Thêm liên kết mới sang bảng Supplier
ALTER TABLE "PurchaseOrder" 
    ADD CONSTRAINT "PurchaseOrder_supplier_id_fkey" 
    FOREIGN KEY ("supplier_id") REFERENCES "Supplier"("id");

-- 3. Thêm một số NCC mẫu (Optional)
INSERT INTO "Supplier" ("name", "tax_id", "main_material_type") VALUES
('NCC Giấy Cao Cấp', '0123456789', 'Giấy Mỹ Thuật'),
('NCC Phụ Liệu May Mặc', '0987654321', 'Chỉ, Nút, Keo'),
('Xưởng In Offset', '0555666777', 'Dịch vụ In ấn')
ON CONFLICT DO NOTHING;
