export interface GuideStep {
  title: string;
  description: string;
  image?: string;
  proTip?: string;
  chartData?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface GuideSection {
  id: string;
  title: string;
  role: 'Kinh doanh' | 'Kho' | 'Sản xuất' | 'Admin' | 'Chung';
  description: string;
  steps: GuideStep[];
  faqs: FAQ[];
  lastUpdated: string;
  routeHints?: string[];
}

export const GUIDE_DATA: GuideSection[] = [
  {
    id: 'orders-guide',
    title: 'Kinh doanh: Quản lý Đơn hàng',
    role: 'Kinh doanh',
    description: 'Quy trình từ lúc nhận yêu cầu đến khi chốt đơn và khởi tạo sản xuất.',
    lastUpdated: '2026-03-23',
    routeHints: ['/orders', '/orders/create'],
    steps: [
      {
        title: 'B1: Tạo đơn hàng & Chọn khách hàng',
        description: 'Sử dụng ô tìm kiếm để chọn khách hàng. Hệ thống sẽ tự động điền SĐT và địa chỉ giao hàng.',
        image: '/guide/orders/step1.png'
      },
      {
        title: 'B2: Thêm sản phẩm & Kiểm tra giá vốn (COGS)',
        description: 'Khi chọn sản phẩm, hệ thống tự hiển thị giá vốn dựa trên cấu trúc BOM hiện tại để bạn cân đối Deal Price.',
        proTip: 'Dùng gợi ý "Giá sỉ" hoặc "Giá XK" để điền nhanh mức giá an toàn.'
      },
      {
        title: 'B3: Sao chép đơn cũ (Duplicate)',
        description: 'Nhấn icon Copy tại danh sách đơn hàng để tái sử dụng toàn bộ danh mục sản phẩm của đơn cũ.',
        image: '/guide/orders/duplicate.png'
      }
    ],
    faqs: [
      {
        question: 'Làm sao để biết đơn hàng này có lãi hay không?',
        answer: 'Hãy nhìn vào cột "Lãi đơn vị" và dòng tổng kết "Lợi nhuận gộp" ở cuối trang. Nếu màu đỏ, bạn đang bán dưới giá vốn.'
      }
    ]
  },
  {
    id: 'warehouse-guide',
    title: 'Kho: Nhập kho & Mã QR',
    role: 'Kho',
    description: 'Quy trình ghi nhận vật tư mới, quản lý lô hàng và in nhãn QR Batch Tracking.',
    lastUpdated: '2026-03-25',
    routeHints: ['/logistics/inventory', '/logistics/materials', '/logistics/inward'],
    steps: [
      {
        title: 'B1: Truy cập Menu Nhập kho',
        description: 'Vào Menu Tổng -> Kho vận -> Nhập kho. Đây là trang chuyên dụng để ghi nhận vật tư mới về xưởng.',
        image: '/guide/warehouse/menu.png'
      },
      {
        title: 'B2: Nhập theo PO (Đơn mua hàng)',
        description: 'Chọn mã PO tương ứng để hệ thống tự động đổ danh sách vật tư và số lượng đặt hàng. Tránh gõ tay thủ công gây sai sót.',
        proTip: 'Nếu giá thực tế cao hơn PO, hệ thống sẽ hiện cảnh báo màu xanh dương để bạn so sánh.'
      },
      {
        title: 'B3: Kiểm đếm & Quy cách Đóng gói',
        description: 'Nhập số thùng (Packing Qty) và số cái/thùng (Items/Packing). Hệ thống tự tính tổng lượng khớp với vận đơn.',
        image: '/guide/warehouse/packing.png'
      },
      {
        title: 'B4: Khai báo Vị trí & In mã QR',
        description: 'Nhập vị trí kệ (VD: A1-2) và nhấn "In mã QR" để dán nhãn Batch lên kiện hàng phục vụ quét mã xuất kho sau này.',
        proTip: 'Luôn in mã QR ngay khi nhập để đảm bảo 100% vật tư trong kho đều có định danh.'
      }
    ],
    faqs: [
      {
        question: 'Tại sao phải chọn Lô/Batch khi nhập kho?',
        answer: 'Việc này giúp theo dõi hạn sử dụng, nhà cung cấp và vị trí chính xác của từng thùng hàng, phục vụ việc truy xuất nguồn gốc (Traceability).'
      }
    ]
  },
  {
    id: 'production-guide',
    title: 'Sản xuất: Báo cáo Tổ đội',
    role: 'Sản xuất',
    description: 'Quy trình báo cáo sản lượng đạt/lỗi và quét QR lệnh sản xuất.',
    lastUpdated: '2026-03-23',
    routeHints: ['/production/team-log', '/production'],
    steps: [
      {
        title: 'B1: Quét QR Lệnh sản xuất',
        description: 'Nhấn icon QR để mở camera và quét mã trên phiếu giấy để chọn nhanh lệnh cần báo cáo.',
        image: '/guide/production/qr-scan.png'
      },
      {
        title: 'B2: Nhập sản lượng theo từng công nhân',
        description: 'Chọn tên công nhân và nhập số lượng đạt/lỗi thực tế.',
        proTip: 'Hệ thống sẽ tự động trừ kho vật tư theo định mức BOM ngay khi bạn lưu báo cáo.'
      }
    ],
    faqs: [
      {
        question: 'Nếu nhập nhầm sản lượng thì sửa ở đâu?',
        answer: 'Vào mục "Nhật ký sản xuất" (Logs), tìm dòng vừa nhập và nhấn biểu tượng Sửa/Xóa. Lưu ý: Chỉ Admin mới có quyền sửa sau 24h.'
      }
    ]
  },
  {
    id: 'admin-guide',
    title: 'Quản trị: Cấu hình BOM & Tài chính',
    role: 'Admin',
    description: 'Thiết lập định mức vật tư, quản lý nhân sự và xem báo cáo tổng hợp.',
    lastUpdated: '2026-03-23',
    routeHints: ['/production/products', '/hr/employees', '/finance'],
    steps: [
      {
        title: 'B1: Thiết lập cấu trúc BOM',
        description: 'Vào danh mục Sản phẩm -> Chọn sản phẩm -> Thêm nguyên liệu và định mức tiêu hao.',
        proTip: 'Luôn cập nhật giá vật tư mới nhất để giá vốn (COGS) được tính toán chính xác.'
      },
      {
        title: 'B2: Quản lý Nhân sự & Phân quyền',
        description: 'Khai báo danh sách nhân viên và gán vào tổ đội tương ứng.',
        image: '/guide/admin/hr.png'
      },
      {
        title: 'B3: Xem báo cáo Hiệu suất (KPI)',
        description: 'Hệ thống tổng hợp dữ liệu từ báo cáo sản lượng để tính KPI tự động cho từng cá nhân.',
        image: '/guide/admin/reports.png'
      }
    ],
    faqs: [
      {
        question: 'Làm sao để thay đổi mã phê duyệt (Manager Pass)?',
        answer: 'Vào Cài đặt hệ thống -> Bảo mật. Mã này dùng để phê duyệt các đơn hàng có lợi nhuận âm.'
      }
    ]
  },
  {
    id: 'system-process-guide',
    title: 'Hệ thống: Quy trình Tổng thể',
    role: 'Chung',
    description: 'Cái nhìn tổng quát về luồng dữ liệu từ lúc thiết kế BOM đến khi ra lệnh sản xuất thực tế.',
    lastUpdated: '2026-03-27',
    routeHints: ['/process-guide'],
    steps: [
      {
        title: 'Sơ đồ Quy trình Hệ thống',
        description: 'Sơ đồ tổng quát thể hiện sự liên kết giữa các module cốt lõi của ERP.',
        chartData: `graph LR
          A[Định mức vật tư - BOM] --> B[Danh mục Sản phẩm]
          B --> C[Tạo Đơn hàng]
          C --> D[Lệnh sản xuất]
          
          style A fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
          style B fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#166534
          style C fill:#fef9c3,stroke:#eab308,stroke-width:2px,color:#854d0e
          style D fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px,color:#0369a1`
      },
      {
        title: '1. Định mức vật tư (BOM)',
        description: 'Mọi thứ bắt đầu từ việc định nghĩa cấu trúc sản phẩm. BOM quyết định giá vốn và kế hoạch nguyên liệu.'
      },
      {
        title: '2. Danh mục Sản phẩm',
        description: 'Sản phẩm được gán BOM và sẵn sàng để kinh doanh báo giá.'
      },
      {
        title: '3. Tạo Đơn hàng',
        description: 'Khi có đơn hàng, hệ thống kiểm tra BOM để dự báo lợi nhuận và chuẩn bị sản xuất.'
      },
      {
        title: '4. Lệnh sản xuất',
        description: 'Đơn hàng được duyệt sẽ chuyển thành lệnh sản xuất để xưởng bắt đầu thực hiện.'
      }
    ],
    faqs: [
      {
        question: 'Tại sao BOM lại là điểm bắt đầu?',
        answer: 'Vì BOM là "linh hồn" của sản phẩm, giúp hệ thống tính toán chính xác giá vốn và vật tư cần thiết ngay từ khâu báo giá.'
      }
    ]
  }
];

export const NEWS_UPDATES = [
  {
    date: '2026-03-25',
    title: 'Đại tu hệ thống Điều hướng Mobile (Hub & Spoke)',
    description: 'Giao diện Mobile được thiết kế lại hoàn toàn với Menu 2 cấp, loại bỏ Sidebar và Tabs bar để tối ưu tốc độ thao tác cho thợ xưởng.',
    link: '/mobile-menu',
    category: 'MỚI'
  },
  {
    date: '2026-03-25',
    title: 'Tối ưu hóa Database & Singleton Client',
    description: 'Nâng cấp hệ thống kết nối Supabase, sửa lỗi kết nối trùng lập giúp ứng dụng chạy mượt mà và Realtime ổn định hơn.',
    link: '/guide',
    category: 'CẬP NHẬT'
  },
  {
    date: '2026-03-23',
    title: 'Hoàn thiện hệ thống Wiki & Hướng dẫn sử dụng',
    description: 'Tài liệu hướng dẫn đã được cập nhật đầy đủ cho tất cả các bộ phận: Kinh doanh, Kho, Sản xuất, Nhân sự và Admin.',
    link: '/guide',
    category: 'CẬP NHẬT'
  }
];
