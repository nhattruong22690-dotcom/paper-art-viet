"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Pin } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function BottomNav() {
  const pathname = usePathname();
  const isActive = pathname === '/mobile-menu';

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-retro-sepia h-20 shadow-[-20px_0_30px_rgba(0,0,0,0.4)] torn-paper-top">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center group pointer-events-auto">
        <Link
          href="/mobile-menu"
          className={cn(
            "w-20 h-24 bg-white p-2 pb-6 polaroid-shimmer border-2 border-white shadow-2xl transition-all duration-500 active:scale-90 flex flex-col items-center justify-between",
            isActive ? "rotate-0 scale-110 -translate-y-2" : "rotate-3 hover:rotate-0"
          )}
        >
          {/* Wooden Clip decoration */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-8 bg-retro-earth border border-retro-sepia/20 z-20 shadow-sm" />
          
          <div className={cn(
            "w-full h-full flex items-center justify-center text-white",
            isActive ? "bg-retro-brick" : "bg-retro-sepia"
          )}>
            <LayoutGrid size={32} strokeWidth={1.5} />
          </div>
          
          <span className="font-handwriting text-[8px] text-retro-sepia font-bold">MENU</span>
        </Link>
      </div>

      <div className="flex justify-around items-center h-full px-12 pt-4">
         <span className="font-typewriter text-[9px] text-white/40 uppercase tracking-widest italic">Paper Art Việt</span>
         <span className="font-typewriter text-[9px] text-white/40 uppercase tracking-widest italic">EST. 2012</span>
      </div>
    </nav>
  );
}
