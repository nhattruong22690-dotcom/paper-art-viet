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
  HelpCircle
} from 'lucide-react';
import HelpIcon from '@/components/common/HelpIcon';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Role = 'Admin' | 'Supervisor' | 'User';

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
    name: 'Kinh doanh', icon: Users, children: [
      { name: 'Khách hàng', href: '/customers' },
      { name: 'Đơn hàng', href: '/orders' },
    ]
  },
  {
    name: 'Sản xuất', icon: ClipboardCheck, children: [
      { name: 'Danh mục Sản phẩm', href: '/production/products' },
      { name: 'Lệnh sản xuất', href: '/production' },
      { name: 'Gia công ngoài', href: '/outsourcing' },
      { name: 'Báo cáo Tổ đội', href: '/production/team-log' },
      { name: 'Logs XS', href: '/production/work-log' },
    ]
  },
  {
    name: 'Điều phối Kho vận', icon: Archive, children: [
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
    ]
  },
  { name: 'Hướng dẫn sử dụng', href: '/guide', icon: HelpCircle },
];

const currentRole: Role = 'Admin';

export default function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

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
    <aside className="hidden lg:flex w-72 bg-white border-r border-gray-100 flex-col sticky top-0 h-screen overflow-y-auto">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-200">
            <Box size={24} />
          </div>
          <span className="font-black text-xl tracking-tight text-gray-800 uppercase italic">
            PAPER ART <span className="text-primary-500 underline decoration-2 underline-offset-4">ERP</span>
          </span>
        </div>

        <nav className="space-y-1.5">
          {navigation.filter(item => !item.roles || item.roles.includes(currentRole)).map((item) => {
            const hasChildren = !!item.children;
            const isOpen = openMenus.includes(item.name);
            const isParentActive = item.href === pathname ||
              item.children?.some(child => pathname.startsWith(child.href));

            return (
              <div key={item.name} className="space-y-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-black transition-all group",
                      isParentActive
                        ? "text-gray-900 bg-gray-50/50"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        size={20}
                        className={cn(
                          "transition-colors",
                          isParentActive ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                        )}
                      />
                      <span className="uppercase tracking-widest text-[11px]">{item.name}</span>
                    </div>
                    {isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-300" />}
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black transition-all group",
                      pathname === item.href
                        ? "bg-primary-50 text-primary-700 shadow-sm shadow-primary-100/50"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      size={20}
                      className={cn(
                        "transition-colors",
                        pathname === item.href ? "text-primary-600" : "text-gray-400 group-hover:text-gray-600"
                      )}
                    />
                    <span className="uppercase tracking-widest text-[11px]">{item.name}</span>
                  </Link>
                )}

                {hasChildren && isOpen && (
                  <div className="pl-12 space-y-1 py-1 animate-in fade-in slide-in-from-top-2 duration-300">
                    {item.children!.filter(child => !child.roles || child.roles.includes(currentRole)).map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all",
                            isChildActive
                              ? "text-primary-600"
                              : "text-gray-400 hover:text-gray-900"
                          )}
                        >
                          <Circle
                            size={6}
                            className={cn(
                              "fill-current transition-all",
                              isChildActive ? "text-primary-600 scale-125 shadow-lg shadow-primary-500" : "text-gray-200"
                            )}
                          />
                          {child.name}
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

      <div className="mt-auto p-8 border-t border-gray-50">
        <div className="flex items-center gap-3 p-4 bg-gray-50/50 rounded-[28px] border border-gray-100/50">
          <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary-100">
            PA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-gray-900 truncate uppercase tracking-tight">Admin User</p>
            <p className="text-[10px] text-gray-400 truncate uppercase font-bold tracking-widest">Paper Art Việt</p>
          </div>
          <HelpIcon size={18} />
        </div>
      </div>
    </aside>
  );
}
