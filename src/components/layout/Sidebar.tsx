"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Archive,
  ChevronDown,
  Box,
  Circle,
  HelpCircle,
  Settings,
  LogOut,
  Package,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Role = 'Admin' | 'Supervisor' | 'User' | 'Production' | 'Warehouse' | 'Sales';

interface NavItem {
  name: string;
  href?: string;
  icon: any;
  roles?: Role[];
  children?: { name: string; href: string; roles?: Role[] }[];
}

const navigation: NavItem[] = [
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
      { name: 'Gia công', href: '/outsourcing' },
      { name: 'Báo cáo tổ', href: '/production/team-log' },
      { name: 'Nhật ký XS', href: '/production/work-log' },
    ]
  },
  {
    name: 'Vật tư', href: '/production/products', icon: Package, roles: ['Admin', 'Warehouse', 'Production'], children: [
      { name: 'Vật tư NVL', href: '/logistics/materials' },
    ]
  },
  {
    name: 'Kho vận', href: '/logistics/inventory', icon: Archive, roles: ['Admin', 'Warehouse'], children: [
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

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const currentRole = (profile?.role as Role) || 'User';

  useEffect(() => {
    navigation.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        setOpenMenus(prev => prev.includes(item.name) ? prev : [...prev, item.name]);
      }
    });
  }, [pathname]);

  const toggleMenu = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenus(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  return (
    <aside className="hidden lg:flex fixed lg:sticky top-0 left-0 h-screen w-72 bg-slate-50 border-r border-slate-200 flex-col z-[101] overflow-y-auto font-sans">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-primary/20">
              <Box size={24} strokeWidth={2} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tighter text-slate-900 leading-none">
                PAPER ART
              </span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mt-1">
                ERP SYSTEM
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navigation.map((item) => {
            const hasChildren = !!item.children;
            const isOpenMenu = openMenus.includes(item.name);
            const isActive = pathname === item.href || item.children?.some(c => pathname === c.href);

            return (
              <div key={item.name} className="space-y-1">
                {hasChildren ? (
                  <div>
                    <button
                      onClick={(e) => toggleMenu(e, item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all",
                        isActive ? "text-primary bg-white shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                      )}
                    >
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <item.icon
                          size={20}
                          className={cn(isActive ? "text-primary" : "text-slate-400 opacity-70")}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span>{item.name}</span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform duration-300 opacity-40",
                          isOpenMenu ? "rotate-180" : ""
                        )}
                      />
                    </button>

                    {isOpenMenu && (
                      <div className="mt-1 ml-6 pl-4 border-l-2 border-slate-200 space-y-1">
                        {item.children?.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all",
                              pathname === child.href ? "text-primary bg-blue-50" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                            )}
                          >
                            {child.name}
                            {pathname === child.href && <ChevronRight size={12} />}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                      pathname === item.href ? "text-primary bg-white shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                    )}
                  >
                    <item.icon
                      size={20}
                      className={cn(pathname === item.href ? "text-primary" : "text-slate-400 opacity-70")}
                      strokeWidth={pathname === item.href ? 2.5 : 2}
                    />
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Info */}
        <div className="p-6 border-t border-slate-200 mt-auto bg-white/50">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-primary font-black shrink-0 shadow-inner">
              {profile?.name?.substring(0, 2).toUpperCase() || 'PA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate tracking-tight">
                {profile?.name || 'User Account'}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {currentRole}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-900/10 active:scale-95"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
