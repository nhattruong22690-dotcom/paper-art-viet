"use client";

import React from 'react';
import { Box, UserCircle } from 'lucide-react';
import Link from 'next/link';

export default function MobileHeader() {
  return (
    <header className="lg:hidden sticky top-0 z-40 w-full bg-retro-paper/95 backdrop-blur-md border-b border-retro-sepia/10 px-5 py-6 flex items-center justify-between shadow-md torn-paper-bottom">
      <Link href="/" className="flex items-center gap-3 active:scale-95 transition-all">
        <div className="w-12 h-12 bg-retro-sepia rounded-full flex items-center justify-center text-retro-mustard shadow-xl ring-2 ring-retro-mustard/20">
          <Box size={24} strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-typewriter font-black text-sm tracking-tighter text-retro-sepia uppercase leading-none">
            PAPER ART <span className="text-retro-brick underline decoration-double underline-offset-4">ERP</span>
          </span>
          <span className="font-handwriting text-[9px] font-bold text-retro-earth uppercase tracking-widest mt-1">Manufacturing System</span>
        </div>
      </Link>
      
      <Link 
        href="/profile"
        className="w-12 h-12 rounded-full bg-retro-beige border-2 border-retro-sepia/20 flex items-center justify-center text-retro-earth active:bg-retro-sepia active:text-white transition-all shadow-inner"
        aria-label="User Profile"
      >
        <UserCircle size={28} strokeWidth={1} />
      </Link>
    </header>
  );
}
