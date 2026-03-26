"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Archive, 
  UserCircle 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: LayoutDashboard, label: 'Trang chủ', href: '/' },
    { icon: Package, label: 'Sản xuất', href: '/mobile-menu/production' },
    { icon: Archive, label: 'Kho', href: '/mobile-menu/logistics' },
    { icon: UserCircle, label: 'Cá nhân', href: '/mobile-menu/hr' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-4 h-20 flex items-center justify-around shadow-[0_-8px_30px_rgba(15,23,42,0.08)] rounded-t-[32px]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300 px-5 py-2 rounded-2xl",
              isActive ? "text-primary bg-blue-50/50 shadow-sm" : "text-slate-400 active:text-primary active:bg-blue-50/30"
            )}
          >
            <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={cn("transition-transform", isActive && "scale-110")} />
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              isActive ? "text-primary opacity-100" : "text-slate-400 opacity-60"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
