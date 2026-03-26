"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Users, 
  ClipboardCheck, 
  Archive, 
  UserCircle, 
  Settings,
  HelpCircle,
  LayoutDashboard,
  Box,
  Package,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Truck,
  FileText
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const menuItems = [
  {
    name: 'Kinh doanh',
    href: '/mobile-menu/orders',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Bán hàng & Đối tác'
  },
  {
    name: 'Sản xuất',
    href: '/mobile-menu/production',
    icon: ClipboardCheck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Xưởng & Sản lượng'
  },
  {
    name: 'Kho vận',
    href: '/mobile-menu/logistics',
    icon: Archive,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'Xuất nhập & Tồn'
  },
  {
    name: 'Nhân sự',
    href: '/mobile-menu/hr',
    icon: UserCircle,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    description: 'Hồ sơ & Tài khoản'
  }
];

export default function MobileMenuPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 pb-32 px-4 pt-8 animate-in fade-in duration-700">
      {/* Header */}
      <header className="mb-8 px-2 flex justify-between items-center">
        <div>
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Cổng điều hành Di động</p>
           <h1 className="text-3xl font-bold text-foreground tracking-tight">
             Paper Art <span className="text-primary italic">Việt</span>
           </h1>
        </div>
        
        {isAdmin && (
          <Link 
            href="/admin/users"
            className="w-12 h-12 bg-white border border-border rounded-2xl flex items-center justify-center text-rose-600 shadow-sm transition-all active:scale-95"
          >
            <ShieldAlert size={22} />
          </Link>
        )}
      </header>

      {/* Stats Quick Look */}
      <div className="grid grid-cols-2 gap-3 mb-8">
         <div className="card !p-4 !bg-white border-border shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
               <TrendingUp size={20} />
            </div>
            <div>
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Hiệu suất</p>
               <p className="text-sm font-black text-foreground tracking-tight">94.2%</p>
            </div>
         </div>
         <div className="card !p-4 !bg-white border-border shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
               <Truck size={20} />
            </div>
            <div>
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Đang giao</p>
               <p className="text-sm font-black text-foreground tracking-tight">12 ĐH</p>
            </div>
         </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative bg-white p-5 rounded-2xl border border-border shadow-sm transition-all active:scale-[0.98] active:bg-gray-50 flex items-center gap-5"
          >
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-sm",
              item.bgColor,
              item.color
            )}>
              <item.icon size={32} strokeWidth={1.5} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground tracking-tight">
                {item.name}
              </h3>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">
                {item.description}
              </p>
            </div>

            <div className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all">
               <ChevronRight size={20} />
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions Footer */}
      <div className="mt-12 grid grid-cols-2 gap-4 max-w-lg mx-auto">
         <Link href="/guide" className="p-4 bg-gray-100 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:bg-gray-200 transition-all">
            <HelpCircle size={16} /> Wiki ERP
         </Link>
         <Link href="/settings" className="p-4 bg-gray-100 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest hover:bg-gray-200 transition-all">
            <Settings size={16} /> Cài đặt
         </Link>
      </div>

      <div className="mt-12 text-center">
         <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-30">
           © 2025 Paper Art Việt • v2.4.0
         </p>
      </div>
    </div>
  );
}
