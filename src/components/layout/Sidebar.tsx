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
  X,
  Package,
  FileText
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
    name: 'Quản lý Kinh doanh', href: '/orders', icon: Users, roles: ['Admin', 'Sales'], children: [
      { name: 'Khách hàng', href: '/customers' },
      { name: 'Danh sách đơn hàng', href: '/orders' },
    ]
  },
  {
    name: 'Quản lý Sản xuất', href: '/production', icon: ClipboardCheck, roles: ['Admin', 'Production'], children: [
      { name: 'Danh mục Sản phẩm', href: '/production/products' },
      { name: 'Lệnh sản xuất', href: '/production' },
      { name: 'Gia công ngoài', href: '/outsourcing' },
      { name: 'Báo cáo Tổ đội', href: '/production/team-log' },
      { name: 'Logs XS', href: '/production/work-log' },
    ]
  },
  {
    name: 'Danh mục & Vật tư', href: '/production/products', icon: Package, roles: ['Admin', 'Warehouse', 'Production'], children: [
      { name: 'Danh mục SP', href: '/production/products' },
      { name: 'Vật tư NVL', href: '/logistics/materials' },
    ]
  },
  {
    name: 'Điều phối kho vận', href: '/logistics/inventory', icon: Archive, roles: ['Admin', 'Warehouse'], children: [
      { name: 'Đơn mua hàng', href: '/logistics/purchase' },
      { name: 'Tồn kho thực tế', href: '/logistics/inventory' },
      { name: 'Nhập kho', href: '/logistics/inward' },
      { name: 'Đóng gói', href: '/logistics/packing' },
    ]
  },
  {
    name: 'Quản trị Nhân sự', href: '/hr/employees', icon: Users, roles: ['Admin', 'Supervisor', 'User'], children: [
      { name: 'Chi tiết nhân viên', href: '/hr/employees' },
      { name: 'Hiệu suất (KPI)', href: '/production/performance' },
      { name: 'Quản trị tài khoản', href: '/hr/users' },
    ]
  },
  {
    name: 'Cài đặt hệ thống', href: '/settings', icon: Settings, roles: ['Admin'], children: [
      { name: 'Cấu hình chung', href: '/settings' },
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

  const toggleMenu = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenus(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  return (
    <aside className="hidden lg:flex fixed lg:sticky top-0 left-0 h-screen w-80 bg-retro-paper border-r border-retro-sepia/10 flex-col z-[101] overflow-y-auto shadow-2xl">
      <div className="p-8 pb-32 lg:pb-8">
        {/* Header (Simplified for Desktop Only) */}
        <div className="flex items-center justify-between gap-3 mb-10 px-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-retro-sepia rounded-full flex items-center justify-center text-retro-mustard shadow-xl ring-2 ring-retro-mustard/20 shrink-0">
              <Box size={24} strokeWidth={1.5} />
            </div>
            <span className="font-typewriter font-black text-xl tracking-tighter text-retro-sepia uppercase">
              Paper Art <span className="text-retro-brick underline decoration-double underline-offset-4">ERP</span>
            </span>
          </div>
        </div>

        <nav className="space-y-4">
          {navigation.map((item) => {
            const hasChildren = !!item.children;
            const isOpenMenu = openMenus.includes(item.name);
            const isActive = pathname === item.href || item.children?.some(c => pathname === c.href);
            
            return (
              <div key={item.name} className="space-y-2">
                {hasChildren ? (
                  <div className="relative group">
                    <button
                      onClick={(e) => toggleMenu(e, item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 border-b-2 transition-all min-h-[48px]",
                        isActive 
                          ? "text-retro-brick border-retro-brick bg-retro-paper" 
                          : "text-retro-sepia border-transparent hover:border-retro-sepia/20 hover:bg-white/30"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon
                          size={18}
                          strokeWidth={isActive ? 2 : 1.2}
                          className={cn(
                            "flex-shrink-0",
                            isActive ? "text-retro-brick" : "text-retro-sepia/60 group-hover:text-retro-sepia"
                          )}
                        />
                        <span className="font-typewriter uppercase tracking-tighter text-xs font-black">
                          {item.name}
                        </span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform duration-300",
                          isOpenMenu ? "rotate-180 text-retro-brick" : "text-retro-sepia/40"
                        )}
                      />
                    </button>
                    
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 transition-all min-h-[48px] border-b-2",
                      pathname === item.href
                        ? "bg-retro-sepia text-retro-mustard border-retro-mustard shadow-inner"
                        : "text-retro-sepia border-transparent hover:border-retro-sepia/20 hover:bg-white/30"
                    )}
                  >
                    <item.icon
                      size={18}
                      strokeWidth={pathname === item.href ? 2 : 1.2}
                      className={cn(
                        "flex-shrink-0",
                        pathname === item.href ? "text-retro-mustard" : "text-retro-sepia/60 group-hover:text-retro-sepia"
                      )}
                    />
                    <span className="font-typewriter uppercase tracking-tighter text-xs font-black">
                      {item.name}
                    </span>
                  </Link>
                )}

                {/* Sub-menu with handwritten style */}
                <div className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out pl-8 space-y-1",
                  hasChildren && isOpenMenu ? "max-h-[800px] py-2 opacity-100" : "max-h-0 py-0 opacity-0"
                )}>
                  {item.children?.map((child) => {
                    const isChildActive = pathname === child.href;
                    return (
                      <Link
                        key={child.name}
                        href={child.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 text-[11px] font-handwriting transition-all min-h-[36px]",
                          isChildActive
                            ? "text-retro-brick border-l-2 border-retro-brick translate-x-1"
                            : "text-retro-earth hover:text-retro-sepia hover:translate-x-1"
                        )}
                      >
                         <Circle
                          size={4}
                          className={cn(
                            "flex-shrink-0 fill-current",
                            isChildActive ? "text-retro-brick" : "text-retro-earth/30"
                          )}
                        />
                        <span>{child.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-retro-sepia/10 bg-retro-paper sticky bottom-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-retro-beige border-2 border-retro-sepia/20 flex items-center justify-center text-retro-sepia font-typewriter text-xs shadow-inner shrink-0 overflow-hidden">
               {profile?.name?.substring(0, 2).toUpperCase() || 'PA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-typewriter text-xs font-black text-retro-sepia truncate uppercase tracking-tighter leading-none">
                {profile?.name || 'User'}
              </p>
              <p className="font-handwriting text-xs text-retro-earth truncate mt-1">
                {currentRole}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => signOut()}
            className="retro-btn w-full bg-retro-sepia text-retro-mustard border-none shadow-md hover:bg-retro-brick hover:text-white"
          >
             <LogOut size={14} className="mr-2" />
             Rời trạm
          </button>
        </div>
        <div className="mt-6 text-center">
           <p className="font-handwriting text-[10px] text-retro-earth/60 italic">© 2026 Paper Art Việt</p>
        </div>
      </div>
    </aside>
  );
}
