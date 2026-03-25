"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TabItem {
  name: string;
  href: string;
}

interface ModuleTabsProps {
  items: TabItem[];
}

export default function ModuleTabs({ items }: ModuleTabsProps) {
  const pathname = usePathname();

  return (
    <div className="lg:hidden mb-10 overflow-x-auto no-scrollbar -mx-4 px-4 py-2">
      <div className="flex bg-retro-paper/50 p-1 border-2 border-retro-sepia/20 rounded-lg min-w-max shadow-sm relative">
        <div className="absolute inset-0 pointer-events-none border border-retro-sepia/5 rounded-lg" />
        {items.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 font-typewriter relative",
                isActive 
                  ? "bg-retro-sepia text-retro-mustard shadow-md z-10 -my-1 rounded-md transform scale-105" 
                  : "text-retro-sepia/40 hover:text-retro-sepia"
              )}
            >
              {item.name}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-retro-mustard rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </div>

  );
}
