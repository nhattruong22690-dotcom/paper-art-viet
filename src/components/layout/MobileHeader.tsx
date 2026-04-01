"use client";

import React, { useState } from 'react';
import { Box, UserCircle, Bell, Menu } from 'lucide-react';
import Link from 'next/link';
import MobileSidebar from './MobileSidebar';

export default function MobileHeader() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-[100] w-full bg-background border-b-[3px] border-black px-4 py-3 flex items-center justify-between shadow-[0px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-10 h-10 bg-white rounded-xl border-2 border-black flex items-center justify-center text-black active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all"
          >
            <Menu size={22} strokeWidth={2.5} />
          </button>
          
          <Link href="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
            <div className="flex flex-col">
                  <span className="font-bold text-lg tracking-tight text-foreground leading-none font-space uppercase">
                    PAPER ART
                  </span>
                  <span className="text-[9px] font-bold text-black/60 uppercase tracking-[0.2em] mt-1">
                    ERP SYSTEM
                  </span>
            </div>
          </Link>
        </div>
        
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
      
      <MobileSidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
    </>
  );
}
