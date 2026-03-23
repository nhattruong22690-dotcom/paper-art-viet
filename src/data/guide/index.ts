"use client";

export interface GuideStep {
  title: string;
  description: string;
  image?: string;
  proTip?: string;
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
    description: 'Hướng dẫn nhập vật tư, quản lý lô và in nhãn QR định danh.',
    lastUpdated: '2026-03-23',
    routeHints: ['/logistics/inventory', '/logistics/materials', '/logistics/inward'],
    steps: [
      {
        title: 'B1: Tiếp nhận & Kiểm đếm vật tư',
        description: 'Kiểm tra khớp số lượng với vận đơn và thông tin nhà cung cấp.',
        image: '/guide/warehouse/check.png'
      },
      {
        title: 'B2: Nhập kho & Khai báo Lô hàng (Lot)',
        description: 'Mỗi lần nhập phải điền số Lô để phục vụ truy xuất nguồn gốc (Traceability).',
        proTip: 'Sử dụng ngày nhập theo định dạng YYYYMMDD-NCC để đặt tên Lô dễ nhớ.'
      },
      {
        title: 'B3: In mã QR vật tư',
        description: 'Sau khi nhập kho, nhấn "In mã QR" để dán vào kiện hàng. Mã này chứa thông tin Loại vật tư, Lô và Ngày nhập.',
        image: '/guide/warehouse/qr-print.png'
      }
    ],
    faqs: [
      {
        question: 'Tại sao phải chọn Lô khi Báo cáo sản xuất?',
        answer: 'Việc chọn Lô giúp hệ thống biết chính xác vật tư nào đã được dùng, phục vụ việc kiểm kê kho chính xác và xử lý khiếu nại chất lượng.'
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
  }
];

export const NEWS_UPDATES = [
  {
    date: '2026-03-23',
    title: 'Hoàn thiện hệ thống Wiki & Hướng dẫn sử dụng',
    description: 'Tài liệu hướng dẫn đã được cập nhật đầy đủ cho tất cả các bộ phận: Kinh doanh, Kho, Sản xuất, Nhân sự và Admin.',
    link: '/guide',
    category: 'MỚI'
  },
  {
    date: '2026-03-23',
    title: 'Tính năng Trợ giúp tại chỗ (Help Drawer)',
    description: 'Nhấn vào icon dấu hỏi (?) tại các trang tính năng để xem hướng dẫn nhanh mà không cần rời trang.',
    link: '/guide',
    category: 'CẬP NHẬT'
  },
  {
    date: '2026-03-23',
    title: 'Máy quét QR & Sao chép Đơn hàng',
    description: 'Tích hợp máy quét QR cho Tổ đội sản xuất và tính năng Duplicate đơn hàng cho Kinh doanh.',
    link: '/guide?id=orders-guide#duplicate',
    category: 'NEW'
  }
];
