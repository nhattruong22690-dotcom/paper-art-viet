"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Archive,
  ShoppingCart,
  LogIn,
  Package,
  LayoutGrid,
  ChevronRight,
  Truck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const items = [
  {
    name: 'Đơn mua hàng',
    href: '/logistics/purchase',
    icon: ShoppingCart,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Quản lý NCC & PO'
  },
  {
    name: 'Nhập kho',
    href: '/logistics/inward',
    icon: LogIn,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    description: 'Điều phối vật tư mới'
  },
  {
    name: 'Tồn kho',
    href: '/logistics/inventory',
    icon: Archive,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    description: 'Số lượng & Thẻ kho'
  },
  {
    name: 'Đóng gói',
    href: '/logistics/packing',
    icon: Package,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    description: 'Trạm xử lý hàng hóa'
  },
  {
    name: 'Vật tư NVL',
    href: '/logistics/materials',
    icon: LayoutGrid,
    color: 'text-primary',
    bgColor: 'bg-primary/5',
    description: 'Danh mục nguyên liệu'
  }
];

export default function LogisticsMenuPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-32 px-4 pt-8 animate-in slide-in-from-right duration-500">
      <header className="mb-8 px-2 flex items-center gap-4">
        <Link 
          href="/mobile-menu"
          className="w-12 h-12 bg-white border border-border rounded-2xl flex items-center justify-center text-foreground shadow-sm active:scale-95 transition-all"
        >
          <ArrowLeft size={22} />
        </Link>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1">Cổng điều hành Di động</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Điều phối <span className="text-primary italic">Kho vận</span>
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative bg-white p-4 rounded-2xl border border-border shadow-sm transition-all active:scale-[0.98] active:bg-gray-50 flex items-center gap-4"
          >
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 shadow-sm",
              item.bgColor,
              item.color
            )}>
              <item.icon size={28} strokeWidth={1.5} />
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-bold text-foreground tracking-tight">
                {item.name}
              </h3>
              <p className="text-[11px] font-medium text-muted-foreground">
                {item.description}
              </p>
            </div>

            <div className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all">
               <ChevronRight size={18} />
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 flex justify-center opacity-20">
         <Truck size={40} className="text-muted-foreground" />
      </div>
    </div>
  );
}
