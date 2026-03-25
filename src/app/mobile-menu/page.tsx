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
  Pin,
  ShieldAlert
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
    color: 'bg-retro-earth',
    rotation: '-rotate-3',
    description: 'Bán hàng & Đối tác'
  },
  {
    name: 'Sản xuất',
    href: '/mobile-menu/production',
    icon: ClipboardCheck,
    color: 'bg-retro-moss',
    rotation: 'rotate-2',
    description: 'Xưởng & Sản lượng'
  },
  {
    name: 'Kho vận',
    href: '/mobile-menu/logistics',
    icon: Archive,
    color: 'bg-retro-mustard',
    rotation: '-rotate-1',
    description: 'Xuất nhập & Tồn'
  },
  {
    name: 'Nhân sự',
    href: '/mobile-menu/hr',
    icon: UserCircle,
    color: 'bg-retro-brick',
    rotation: 'rotate-3',
    description: 'Hồ sơ & Tài khoản'
  }
];

export default function MobileMenuPage() {
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen pb-32 px-4 pt-12 animate-in fade-in duration-700 relative overflow-hidden">
      {/* Admin Quick Access */}
      {isAdmin && (
        <Link 
          href="/admin/users"
          className="fixed top-6 right-6 z-[100] w-14 h-16 bg-retro-brick border-2 border-retro-sepia flex items-center justify-center text-white shadow-2xl rotate-3 hover:rotate-0 transition-all active:scale-90"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-white/30" />
          <ShieldAlert size={24} />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-retro-mustard border border-retro-sepia rotate-45" />
        </Link>
      )}

      {/* Decorative String */}
      <div className="absolute top-24 left-0 right-0 h-px bg-retro-sepia/20 z-0 pointer-events-none" />
      
      <header className="mb-12 px-2 text-center relative z-10">
        <div className="flex justify-center mb-6">
           <div className="wwas-tape-top washi-tape-top">
              <div className="w-20 h-20 bg-retro-paper rounded-full border-4 border-dashed border-retro-sepia/20 flex items-center justify-center text-retro-sepia shadow-inner">
                <Box size={36} strokeWidth={1.5} />
              </div>
           </div>
        </div>
        <h1 className="text-3xl font-typewriter font-black text-retro-sepia tracking-tighter uppercase mb-2">
          Bản Tin <span className="text-retro-brick italic">ERP</span>
        </h1>
        <div className="inline-block px-4 py-1 bg-retro-mustard/20 border border-retro-mustard/40 rounded-full">
           <p className="text-[9px] font-handwriting text-retro-sepia font-bold uppercase tracking-[0.1em]">
             Lưu hành nội bộ - Paper Art Việt
           </p>
        </div>
      </header>

      {/* Grid for Polaroid Buttons */}
      <div className="grid grid-cols-2 gap-y-12 gap-x-6 max-w-lg mx-auto relative z-10">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
               "group relative bg-white p-2 pb-8 polaroid-shimmer border border-gray-200 shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all active:scale-95 duration-500",
               item.rotation,
               "hover:rotate-0 hover:-translate-y-2"
            )}
          >
            {/* Clothespin / Pin */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-8 bg-[#D2B48C] border border-sepia-200 z-20 shadow-sm opacity-90">
               <div className="w-full h-1/2 border-b border-gray-300/50" />
            </div>

            <div className={cn(
              "aspect-square w-full flex flex-col items-center justify-center text-white relative overflow-hidden",
              item.color
            )}>
              <item.icon size={44} strokeWidth={1.2} className="relative z-10" />
              {/* Scratch / Sketch pattern overlay */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/scratched-metal.png')] opacity-20" />
            </div>
            
            <div className="mt-4 px-2">
              <h3 className="text-sm font-typewriter font-black text-retro-sepia uppercase tracking-tighter">
                {item.name}
              </h3>
              <p className="text-[10px] font-handwriting text-gray-500 leading-tight mt-1">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Handwritten Footer Note */}
      <div className="mt-20 text-center px-8 relative">
        <div className="relative inline-block rotate-1">
           <Pin className="absolute -top-4 -left-4 text-retro-earth rotate-45" size={20} />
           <div className="bg-yellow-50/80 p-6 border border-yellow-200/50 shadow-lg transform -rotate-1">
              <p className="font-handwriting text-retro-sepia text-sm">
                "Cần hỗ trợ? Hãy nhấn vào mục 
                <span className="text-retro-brick underline decoration-double mx-1">Wiki</span> 
                để xem hướng dẫn vận hành!"
              </p>
           </div>
           {/* Decorative hand-drawn arrow */}
           <div className="absolute -bottom-8 right-0 text-retro-earth text-3xl font-handwriting select-none">
             ↘
           </div>
        </div>
      </div>
    </div>
  );
}
