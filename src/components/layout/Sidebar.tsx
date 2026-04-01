"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Archive,
  ChevronDown,
  Box,
  Circle,
  HelpCircle,
  Settings,
  LogOut,
  Package,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { navigation, type Role } from '@/config/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const currentRole = (profile?.role as Role) || 'User';

  useEffect(() => {
    navigation.forEach(item => {
      if (item.children?.some(child => pathname.startsWith(child.href))) {
        setOpenMenus(prev => prev.includes(item.name) ? prev : [...prev, item.name]);
      }
    });
  }, [pathname]);

  const toggleMenu = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenus(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  return (
    <aside className="hidden lg:flex fixed lg:sticky top-0 left-0 h-screen w-72 bg-background border-r-neo border-black flex-col z-[101] overflow-y-auto font-sans">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-primary rounded-xl border-neo border-black flex items-center justify-center text-black shrink-0 shadow-neo group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-neo-active transition-all">
              <Box size={24} strokeWidth={2.5} />
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
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navigation.map((item) => {
            const hasChildren = !!item.children;
            const isOpenMenu = openMenus.includes(item.name);
            const isActive = pathname === item.href || item.children?.some(c => pathname === c.href);

            return (
              <div key={item.name} className="space-y-1">
                {hasChildren ? (
                  <div>
                    <button
                      onClick={(e) => toggleMenu(e, item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border-neo",
                        isActive ? "text-black bg-primary border-black shadow-neo" : "text-muted-foreground border-transparent hover:text-foreground hover:bg-card/50"
                      )}
                    >
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <item.icon
                          size={20}
                          className={cn(isActive ? "text-black" : "text-muted-foreground/60")}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className="font-space uppercase tracking-wider">{item.name}</span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={cn(
                          "transition-transform duration-300 opacity-60",
                          isOpenMenu ? "rotate-180" : ""
                        )}
                      />
                    </button>

                    {isOpenMenu && (
                      <div className="mt-2 ml-6 pl-4 border-l-neo border-black space-y-2">
                        {item.children?.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              "flex items-center justify-between px-4 py-2.5 text-xs font-bold rounded-xl transition-all border-neo",
                              pathname === child.href ? "text-black bg-secondary border-black shadow-neo" : "text-muted-foreground border-transparent hover:text-foreground hover:bg-card"
                            )}
                          >
                            <span className="uppercase tracking-widest">{child.name}</span>
                            {pathname === child.href && <ChevronRight size={12} />}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border-neo",
                      pathname === item.href ? "text-black bg-primary border-black shadow-neo" : "text-muted-foreground border-transparent hover:text-foreground hover:bg-card/50"
                    )}
                  >
                    <item.icon
                      size={20}
                      className={cn(pathname === item.href ? "text-black" : "text-muted-foreground/60")}
                      strokeWidth={pathname === item.href ? 2.5 : 2}
                    />
                    <span className="font-space uppercase tracking-wider">{item.name}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile Info */}
        <div className="p-6 border-t-neo border-black mt-auto bg-background">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-secondary border-neo border-black flex items-center justify-center text-black font-bold shrink-0 shadow-neo">
              {profile?.name?.substring(0, 2).toUpperCase() || 'PA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate tracking-tight uppercase font-space">
                {profile?.name || 'User Account'}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                {currentRole}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-black hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all border-neo border-black shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-active active:scale-95"
          >
            <LogOut size={16} />
            Đăng xuất
          </button>
        </div>
      </div>
    </aside>
  );
}
