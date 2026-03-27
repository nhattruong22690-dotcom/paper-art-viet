"use client";

import React from 'react';
import { Box, UserCircle, Bell } from 'lucide-react';
import Link from 'next/link';

export default function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-[100] w-full bg-background border-b-neo border-black px-6 py-4 flex items-center justify-between shadow-neo">
      <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
        <div className="w-10 h-10 bg-primary rounded-xl border-neo border-black flex items-center justify-center text-black shadow-neo-active group-hover:bg-purple-300 transition-colors">
          <Box size={22} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight text-foreground leading-none font-space uppercase">
                PAPER ART
              </span>
              <span className="text-[10px] font-bold text-black uppercase tracking-[0.2em] mt-1">
                ERP SYSTEM
              </span>
        </div>
      </Link>
      
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-xl bg-white border-neo border-black flex items-center justify-center text-black active:translate-x-[1px] active:translate-y-[1px] shadow-neo-active transition-all">
           <Bell size={20} strokeWidth={2.5} />
        </button>
        <Link 
          href="/mobile-menu/hr"
          className="w-10 h-10 rounded-xl bg-secondary border-neo border-black flex items-center justify-center text-black active:scale-95 transition-all shadow-neo-active"
          aria-label="User Profile"
        >
          <UserCircle size={24} strokeWidth={2.5} />
        </Link>
      </div>
    </header>
  );
}
