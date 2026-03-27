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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t-neo border-black px-4 h-24 flex items-center justify-around shadow-neo rounded-t-[32px]">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1.5 transition-all duration-300 px-5 py-2.5 rounded-2xl border-neo",
              isActive ? "text-black bg-primary border-black shadow-neo-active" : "text-muted-foreground border-transparent active:bg-slate-100"
            )}
          >
            <item.icon size={22} strokeWidth={isActive ? 3 : 2} className={cn("transition-transform", isActive && "scale-110")} />
            <span className={cn(
              "text-[9px] font-black uppercase tracking-widest",
              isActive ? "text-black opacity-100" : "text-muted-foreground opacity-60"
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
