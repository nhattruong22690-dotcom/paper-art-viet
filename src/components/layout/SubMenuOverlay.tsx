"use client";

import React from 'react';
import Link from 'next/link';
import { 
  X, 
  Package, 
  ClipboardCheck, 
  FileText, 
  AlertTriangle, 
  Archive, 
  Inbox, 
  MapPin, 
  QrCode,
  Users,
  TrendingUp,
  UserCircle,
  Plus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type SubMenuType = 'production' | 'logistics' | 'products' | 'hr' | null;

interface SubMenuItem {
  name: string;
  href: string;
  icon: any;
  color: string;
}

const subMenus: Record<string, SubMenuItem[]> = {
  production: [
    { name: 'Lệnh sản xuất', href: '/production', icon: ClipboardCheck, color: 'bg-blue-500' },
    { name: 'Nhật ký (Log)', href: '/production/work-log', icon: FileText, color: 'bg-emerald-500' },
    { name: 'Báo cáo Tổ đội', href: '/production/team-log', icon: Users, color: 'bg-purple-500' },
    { name: 'Báo cáo lỗi', href: '/production/errors', icon: AlertTriangle, color: 'bg-rose-500' },
  ],
  sales: [
    { name: 'Tạo đơn hàng', href: '/orders/create', icon: Plus, color: 'bg-primary-600' },
    { name: 'Khách hàng', href: '/customers', icon: Users, color: 'bg-blue-600' },
    { name: 'Đơn hàng', href: '/orders', icon: FileText, color: 'bg-amber-600' },
  ],
  logistics: [
    { name: 'Tồn kho', href: '/logistics/inventory', icon: Archive, color: 'bg-amber-500' },
    { name: 'Nhập kho', href: '/logistics/inward', icon: Inbox, color: 'bg-blue-500' },
    { name: 'Vị trí kho', href: '/logistics/locations', icon: MapPin, color: 'bg-indigo-500' },
    { name: 'Mã QR Scan', href: '/logistics/qr', icon: QrCode, color: 'bg-gray-800' },
  ],
  products: [
    { name: 'Danh mục SP', href: '/production/products', icon: Package, color: 'bg-orange-500' },
    { name: 'Vật tư NVL', href: '/logistics/materials', icon: FileText, color: 'bg-cyan-500' },
    { name: 'Định mức BOM', href: '/production/bom', icon: ClipboardCheck, color: 'bg-teal-500' },
  ],
  hr: [
    { name: 'Nhân viên', href: '/hr/employees', icon: Users, color: 'bg-indigo-600' },
    { name: 'Hiệu suất (KPI)', href: '/production/performance', icon: TrendingUp, color: 'bg-pink-500' },
    { name: 'Hồ sơ cá nhân', href: '/profile', icon: UserCircle, color: 'bg-primary-600' },
  ]
};

interface SubMenuOverlayProps {
  type: SubMenuType;
  onClose: () => void;
}

export default function SubMenuOverlay({ type, onClose }: SubMenuOverlayProps) {
  if (!type) return null;

  const items = subMenus[type] || [];
  const titles: Record<string, string> = {
    production: 'Quản lý Sản xuất',
    logistics: 'Điều phối Kho vận',
    products: 'Danh mục & Vật tư',
    hr: 'Nhân sự & Cá nhân',
    sales: 'Quản lý Kinh doanh'
  };

  return (
    <div className="lg:hidden fixed inset-0 z-[100] transition-all duration-300 animate-in fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Content Container (Bottom Sheet styled) */}
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-[40px] shadow-2xl p-8 pb-12 animate-in slide-in-from-bottom-full duration-500">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight italic">
              {titles[type]}
            </h3>
            <div className="h-1 w-12 bg-primary-500 rounded-full mt-1" />
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-gray-900 active:scale-95 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Grid of Icon Tiles */}
        <div className="grid grid-cols-3 gap-6">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex flex-col items-center gap-3 transition-all active:scale-90 group"
            >
              <div className={cn(
                "w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-lg shadow-gray-200 group-hover:shadow-xl transition-all",
                item.color
              )}>
                <item.icon size={28} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest text-center leading-tight">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
