# 📘 PAV ERP System Wiki

> Tài liệu hướng dẫn vận hành và kiến trúc hệ thống Paper Art Việt ERP.

---

## 📱 1. Hệ thống Điều hướng Mobile (Hub & Spoke v2)

Hệ thống điều hướng đã được tối ưu hóa cho môi trường sản xuất công nghiệp, tập trung vào tốc độ và sự rõ ràng.

### Cấu trúc Phân cấp (Architecture)
*   **Cấp 1 - Menu Tổng (`/mobile-menu`)**: Điểm chạm đầu tiên sau khi đăng nhập. Bao gồm 4 nhóm module lớn: SẢN XUẤT, KHO VẬN, NHÂN SỰ, KINH DOANH.
*   **Cấp 2 - Sub-Hubs**: Khi nhấn vào một nhóm, người dùng sẽ thấy lưới icon (Grid) của các tính năng chi tiết thuộc nhóm đó.
*   **Quy tắc "Một chạm"**: Nút Home VIP ở chính giữa Bottom Nav luôn đưa người dùng về thẳng Menu Tổng Cấp 1.

### UI/UX Rules
*   **Không dùng Sidebar trên Mobile**: Đã ẩn Sidebar để tránh rối mắt cho thợ xưởng.
*   **Không dùng Tabs**: Loại bỏ hoàn toàn Tab bar đầu trang, mỗi tính năng là một trang độc lập với nút "Back" rõ ràng.
*   **Icon lớn (44px+)**: Đảm bảo hit area dễ bấm cho công nhân đeo găng tay hoặc tay dính bụi.

---

## 📥 2. QUY TRÌNH NHẬP KHO VẬT TƯ (STANDARD OPERATING PROCEDURE)

Đây là quy trình bắt buộc dành cho thủ kho PAV khi tiếp nhận vật tư mới (nguyên liệu, bao bì, linh kiện...).

### 🚀 Các bước thực thi trên App:

| Bước | Hành động | Chi tiết thao tác |
| :--- | :--- | :--- |
| **1** | **Vào Menu** | Chọn biểu tượng **KHO VẬN** từ Menu Tổng → Chọn ô **NHẬP KHO**. |
| **2** | **Nguồn dữ liệu** | **Chọn mã PO** trong danh sách thả xuống. Hệ thống sẽ tự động đổ dữ liệu SKU và số lượng đã đặt hàng vào phiếu. |
| **3** | **Kiểm đếm** | Nhập **Số thùng (Packing Qty)** và **Quy cách (Items/Packing)** thực tế nhận được. |
| **4** | **Giá & Vị trí** | Nhập **Tổng tiền** trên hóa đơn của hạng mục và chọn **Vị trí kệ** sẽ xếp hàng. |
| **5** | **Batching** | Nhấn nút **IN MÃ QR** để tạo nhãn Batch dán lên các kiện hàng vừa nhập. |
| **6** | **Xác nhận** | Nhấn **XÁC NHẬN NHẬP KHO** để lưu trữ và cộng dồn tồn kho chính thức. |

### 💡 Lưu ý quan trọng:
*   **Nhập theo PO**: Ưu tiên nhập theo Đơn mua hàng (PO) để tránh sai sót tên vật tư và kiểm soát giá đầu vào.
*   **Quét mã**: Sử dụng điện thoại để quét mã QR vừa in khi cần xuất kho sau này, giúp giảm 90% thời gian nhập liệu thủ công.
*   **Lỗi PO**: Nếu giá thực tế cao hơn giá trong đơn hàng, hệ thống sẽ hiển thị cảnh báo màu (Xanh dương) để thủ kho lưu ý.

---

## ⚙️ 3. Tiêu chuẩn Kỹ thuật (Developer Notes)

### Supabase Singleton
Để tránh lỗi "Multiple GoTrueClient instances" trong Next.js (đặc biệt khi HMR), hệ thống sử dụng Singleton pattern trong `src/lib/supabase.ts`:
*   `supabase`: Biến client dùng chung (Anon key).
*   `supabaseAdmin`: Chỉ chạy trên Server (Service Role key). Tự động fallback về `supabase` trên browser để tránh lỗi.

### Route Cleanup (Trạng thái Trang)
Đã dọn dẹp các đường dẫn bị 404. Các trang hiện có sẵn và hoạt động:
*   **Production**: `/production`, `/production/products`, `/production/team-log`, `/production/work-log`, `/production/performance`.
*   **Logistics**: `/logistics/inventory`, `/logistics/purchase`, `/logistics/inward`, `/logistics/packing`, `/logistics/materials`.
*   **HR**: `/hr/employees`, `/hr/users`.
*   **Sales**: `/orders`, `/customers`.

---

## 🕰️ 4. Hệ thống Thiết kế Retro Revolution (Design System)

Hệ thống đã được đại tu toàn diện sang phong cách **Retro Revolution**, kết hợp giữa sự cổ điển (Antique) và tính hiện đại (Productivity).

### Bảng màu Chủ đạo (Palette)
*   **Retro Paper (`#F2EBD9`)**: Nền giấy cũ (Parched paper) cho toàn bộ ứng dụng.
*   **Dark Sepia (`#3E2723`)**: Màu chữ và viền chính (thay thế đen thuần).
*   **Mustard Yellow (`#DAA520`)**: Màu nhấn cho các yếu tố quan trọng (Warning/Notice).
*   **Earth Brown (`#8D6E63`)**: Màu bổ trợ cho các ghi chú.
*   **Brick Red (`#B22222`)**: Màu cho các hành động quan trọng (Danger/Delete).
*   **Moss Green (`#556B2F`)**: Màu cho các trạng thái thành công (Success).

### Typography (Phông chữ)
*   **Title/Header**: Sử dụng `font-typewriter` (Special Elite) - tạo cảm giác máy đánh máy.
*   **Note/Label**: Sử dụng `font-handwriting` (Architects Daughter) - tạo cảm giác ghi chú tay.
*   **Body**: Sử dụng `font-serif` (Libre Baskerville) - dễ đọc, trang trọng.

### Các hiệu ứng đặc trưng (Effects)
*   **Torn Paper**: Hiệu ứng xé giấy ở các mép Header/Footer.
*   **Retro Card**: Card có viền Sepia, hiệu ứng xoay nhẹ (Tilt) và bóng đổ tinh tế.
*   **Polaroid Gallery**: Menu tổng hiển thị dạng các bức ảnh Polaroid được ghim (pinned) lên bảng tin.
*   **Washi Tape**: Sử dụng các dải băng dính màu trang trí trên các tiêu đề Card.

---

## ⚖️ 5. Quy tắc Code (Global Mandatory)
*   **Purple Ban**: TUYỆT ĐỐI không sử dụng màu Tím (Violet/Purple).
*   **Texture Overlays**: Ưu tiên sử dụng class `.parched-paper` cho các container lớn.
*   **Component**: Sử dụng `retro-btn` cho các nút bấm chính.
*   **Icon**: Ưu tiên `lucide-react` với `strokeWidth={1.5}` để tạo nét vẽ thanh mảnh phù hợp phong cách cổ xưa.
