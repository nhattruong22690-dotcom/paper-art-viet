"use client";

import React from 'react';
import { Box, UserCircle, Bell } from 'lucide-react';
import Link from 'next/link';

export default function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-xl border-b border-slate-100 px-6 py-4 flex items-center justify-between shadow-sm">
      <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:bg-blue-600 transition-colors">
          <Box size={22} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-black text-base tracking-tighter text-slate-900 leading-none">
            PAPER ART <span className="text-primary italic">ERP</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Mobile Access
          </span>
        </div>
      </Link>
      
      <div className="flex items-center gap-4">
        <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 active:bg-slate-100 transition-all border border-slate-100">
           <Bell size={20} strokeWidth={2} />
        </button>
        <Link 
          href="/mobile-menu/hr"
          className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-primary active:scale-95 transition-all shadow-inner"
          aria-label="User Profile"
        >
          <UserCircle size={24} strokeWidth={2} />
        </Link>
      </div>
    </header>
  );
}
