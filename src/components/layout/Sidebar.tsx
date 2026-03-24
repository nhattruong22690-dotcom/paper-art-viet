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
  ChevronRight,
  Box,
  Circle,
  HelpCircle,
  Settings,
  LogOut
} from 'lucide-react';
import HelpIcon from '@/components/common/HelpIcon';
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
    name: 'Kinh doanh', icon: Users, roles: ['Admin', 'Sales'], children: [
      { name: 'Khách hàng', href: '/customers' },
      { name: 'Đơn hàng', href: '/orders' },
    ]
  },
  {
    name: 'Sản xuất', icon: ClipboardCheck, roles: ['Admin', 'Production'], children: [
      { name: 'Danh mục Sản phẩm', href: '/production/products' },
      { name: 'Lệnh sản xuất', href: '/production' },
      { name: 'Gia công ngoài', href: '/outsourcing' },
      { name: 'Báo cáo Tổ đội', href: '/production/team-log' },
      { name: 'Logs XS', href: '/production/work-log' },
    ]
  },
  {
    name: 'Kho Vận', icon: Archive, roles: ['Admin', 'Warehouse'], children: [
      { name: 'Đơn mua hàng', href: '/logistics/purchase' },
      { name: 'Tồn kho thực tế', href: '/logistics/inventory' },
      { name: 'Nhập kho', href: '/logistics/inward' },
      { name: 'Danh mục vật tư', href: '/logistics/materials' },
      { name: 'Đóng gói', href: '/logistics/packing' },
    ]
  },
  {
    name: 'Quản trị Nhân sự', icon: Users, roles: ['Admin', 'Supervisor'], children: [
      { name: 'Hiệu suất (KPI)', href: '/production/performance' },
      { name: 'Danh sách nhân viên', href: '/hr/employees' },
      { name: 'Tài khoản hệ thống', href: '/hr/users' },
    ]
  },
  {
    name: 'Cài đặt hệ thống', icon: Settings, roles: ['Admin'], children: [
      { name: 'Cấu hình chung', href: '/settings' },
      { name: 'Nhật ký hệ thống', href: '/logs' },
    ]
  },
  { name: 'Hướng dẫn sử dụng', href: '/guide', icon: HelpCircle },
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

  const toggleMenu = (name: string) => {
    setOpenMenus(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  return (
    <aside className="hidden lg:flex w-80 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200 shrink-0">
            <Box size={24} />
          </div>
          <span className="font-black text-xl tracking-tight text-gray-800 uppercase italic">
            PAPER ART <span className="text-primary-500 underline decoration-2 underline-offset-4">ERP</span>
          </span>
        </div>

        <nav className="space-y-1">
          {navigation.filter(item => 
            !item.roles || 
            item.roles.some(r => r.toLowerCase() === currentRole.toLowerCase())
          ).map((item) => {
            const hasChildren = !!item.children;
            const isOpen = openMenus.includes(item.name);
            
            return (
              <div key={item.name} className="space-y-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm group transition-all",
                      isOpen
                        ? "text-primary-600 bg-sky-light/50"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={18}
                        className={cn(
                          "flex-shrink-0",
                          isOpen ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      <span className="uppercase tracking-widest text-[10px] font-black">
                        {item.name}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform",
                        isOpen ? "text-primary-600 rotate-180" : "text-gray-300"
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm group transition-all",
                      pathname === item.href
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-200"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      size={18}
                      className={cn(
                        "flex-shrink-0",
                        pathname === item.href ? "text-white" : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    <span className="uppercase tracking-widest text-[10px] font-black">
                      {item.name}
                    </span>
                  </Link>
                )}

                {hasChildren && isOpen && (
                  <div className="pl-10 space-y-1 py-1">
                    {item.children!.filter(child => 
                      !child.roles || 
                      child.roles.some(r => r.toLowerCase() === currentRole.toLowerCase())
                    ).map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            isChildActive
                              ? "text-primary-900 bg-white shadow-sm ring-1 ring-gray-100 border-l-4 border-yellow-cadmium"
                              : "text-gray-400 hover:text-yellow-cadmium hover:bg-gray-50/50"
                          )}
                        >
                          <Circle
                            size={6}
                            className={cn(
                              "flex-shrink-0 fill-current",
                              isChildActive ? "text-yellow-cadmium" : "text-gray-200"
                            )}
                          />
                          <span>{child.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-gray-50">
        <div className="p-4 bg-gray-50/50 rounded-[28px] border border-gray-100/50 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary-100 shrink-0">
               {profile?.name?.substring(0, 2).toUpperCase() || 'PA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">
                {profile?.name || 'User'}
              </p>
              <p className="text-[10px] text-gray-400 truncate uppercase font-bold tracking-widest italic leading-none">
                {currentRole}
              </p>
            </div>
          </div>
          
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white hover:bg-rose-50 border border-gray-100 hover:border-rose-100 rounded-2xl text-[9px] font-black text-gray-400 hover:text-rose-600 uppercase tracking-[0.2em] transition-all shadow-sm active:scale-95"
          >
             <LogOut size={14} />
             Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
