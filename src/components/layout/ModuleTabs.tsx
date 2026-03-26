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
    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 mb-8 overflow-x-auto scrollbar-hide shadow-inner max-w-fit">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "px-6 py-2.5 text-[10px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap rounded-xl flex items-center justify-center active:scale-95",
            pathname === item.href
              ? "bg-white text-primary shadow-soft border border-slate-200/50"
              : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
          )}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}
