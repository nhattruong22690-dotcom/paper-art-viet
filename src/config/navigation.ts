import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Archive,
  HelpCircle,
  Settings,
  UserCircle
} from 'lucide-react';

export type Role = 'Admin' | 'Supervisor' | 'User' | 'Production' | 'Warehouse' | 'Sales';

export interface NavItem {
  name: string;
  href?: string;
  icon: any;
  roles?: Role[];
  children?: { name: string; href: string; roles?: Role[] }[];
}

export const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  {
    name: 'Kinh doanh', href: '/orders', icon: Users, roles: ['Admin', 'Sales'], children: [
      { name: 'Khách hàng', href: '/customers' },
      { name: 'Đơn hàng', href: '/orders' },
    ]
  },
  {
    name: 'Sản xuất', href: '/production', icon: ClipboardCheck, roles: ['Admin', 'Production'], children: [
      { name: 'Sản phẩm', href: '/production/products' },
      { name: 'Lệnh sản xuất', href: '/production' },
      { name: 'Quản lý cơ sở', href: '/production/facilities' },
      { name: 'Báo cáo tổ', href: '/production/team-log' },
      { name: 'Nhật ký XS', href: '/production/work-log' },
    ]
  },
  {
    name: 'Kho vận', href: '/logistics/inventory', icon: Archive, roles: ['Admin', 'Warehouse'], children: [
      { name: 'Vật tư NVL', href: '/logistics/materials' },
      { name: 'Mua hàng', href: '/logistics/purchase' },
      { name: 'Tồn kho', href: '/logistics/inventory' },
      { name: 'Nhập kho', href: '/logistics/inward' },
      { name: 'Đóng gói', href: '/logistics/packing' },
    ]
  },
  {
    name: 'Nhân sự', href: '/hr/employees', icon: UserCircle, roles: ['Admin', 'Supervisor', 'User'], children: [
      { name: 'Nhân viên', href: '/hr/employees' },
      { name: 'KPI', href: '/production/performance' },
      { name: 'Tài khoản', href: '/hr/users' },
    ]
  },
  {
    name: 'Cài đặt', href: '/settings', icon: Settings, roles: ['Admin'], children: [
      { name: 'Cấu hình', href: '/settings' },
    ]
  },
  { name: 'Hướng dẫn', href: '/guide', icon: HelpCircle },
];
