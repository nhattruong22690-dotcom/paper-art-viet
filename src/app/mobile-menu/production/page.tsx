"use client";

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  ClipboardCheck,
  Package,
  Layers,
  Truck,
  Users,
  FileSearch,
  AlertTriangle,
  MoveLeft
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const items = [
  {
    name: 'Lệnh sản xuất',
    href: '/production',
    icon: ClipboardCheck,
    color: 'bg-retro-moss',
    description: 'Điều phối xưởng'
  },
  {
    name: 'Sản phẩm',
    href: '/production/products',
    icon: Package,
    color: 'bg-retro-earth',
    weight: 'rotate-2',
    description: 'Danh mục SKU'
  },
  {
    name: 'Gia công',
    href: '/outsourcing',
    icon: Truck,
    color: 'bg-retro-mustard',
    description: 'Đối tác bên ngoài'
  },
  {
    name: 'Báo cáo Tổ',
    href: '/production/team-log',
    icon: Users,
    color: 'bg-retro-brick',
    description: 'Dữ liệu tổ đội'
  },
  {
    name: 'Nhật ký SX',
    href: '/production/work-log',
    icon: FileSearch,
    color: 'bg-retro-sepia',
    description: 'Logs sản xuất'
  }
];

export default function ProductionMenuPage() {
  return (
    <div className="min-h-screen bg-retro-paper pb-32 px-4 pt-8 animate-in slide-in-from-right duration-500">
      <header className="mb-10 px-2 flex items-center gap-6">
        <Link 
          href="/mobile-menu"
          className="w-12 h-14 bg-white border-2 border-retro-sepia flex items-center justify-center text-retro-sepia shadow-md active:scale-95 transition-all relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-retro-brick/20" />
          <MoveLeft size={24} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-2xl font-typewriter font-black text-retro-sepia tracking-tighter uppercase mb-1">
            Xưởng <span className="text-retro-moss italic">Sản xuất</span>
          </h1>
          <div className="font-handwriting text-[10px] text-retro-earth uppercase tracking-widest flex items-center gap-2">
             <span className="w-8 h-px bg-retro-earth/30" />
             Manufacturing Ops
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-x-6 gap-y-10 max-w-lg mx-auto">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
               "group relative bg-white p-4 pt-10 border border-retro-sepia/10 shadow-lg transition-all active:scale-95",
               "washi-tape-top"
            )}
          >
            <div className={cn(
              "w-full aspect-square flex items-center justify-center text-white transition-all duration-500 group-hover:scale-110",
              item.color
            )}>
              <item.icon size={36} strokeWidth={1} />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-xs font-typewriter font-black text-retro-sepia uppercase tracking-tighter">
                {item.name}
              </h3>
              <p className="text-[9px] font-handwriting text-gray-400 mt-1 italic">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
