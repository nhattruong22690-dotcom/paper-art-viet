"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ClipboardCheck, 
  Archive, 
  Package,
  UserCircle,
  Users
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SubMenuOverlay, { SubMenuType } from './SubMenuOverlay';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { name: 'Kinh doanh', id: 'sales' as SubMenuType, icon: Users },
  { name: 'Sản xuất', id: 'production' as SubMenuType, icon: ClipboardCheck },
  { name: 'Kho vận', id: 'logistics' as SubMenuType, icon: Archive },
  { name: 'Cá nhân', id: 'hr' as SubMenuType, icon: UserCircle },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<SubMenuType>(null);

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] z-[50] pb-safe">
        <div className="flex justify-around items-center h-20 px-2">
          {navItems.map((item) => {
            const isActive = activeMenu === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 flex-1 py-1 transition-all active:scale-90 outline-none",
                  isActive ? "text-primary-600" : "text-gray-400"
                )}
              >
                <div className={cn(
                  "p-2.5 rounded-2xl transition-all duration-300",
                  isActive ? "bg-primary-50 scale-110 shadow-sm" : "bg-transparent"
                )}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  isActive ? "text-primary-600" : "text-gray-400"
                )}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <SubMenuOverlay 
        type={activeMenu} 
        onClose={() => setActiveMenu(null)} 
      />
    </>
  );
}
