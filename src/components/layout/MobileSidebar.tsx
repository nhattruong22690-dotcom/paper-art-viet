"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  ChevronDown,
  LogOut,
  ChevronRight,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { navigation, type Role } from '@/config/navigation';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ isOpen, onClose }: MobileSidebarProps) {
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const toggleMenu = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenMenus(prev =>
      prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] lg:hidden animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Sidebar Panel */}
      <aside className="fixed top-0 left-0 h-[100dvh] w-[85vw] max-w-sm bg-background border-r-[3px] border-black flex flex-col z-[201] overflow-y-auto font-sans animate-in slide-in-from-left duration-300 shadow-[10px_0px_0px_0px_rgba(0,0,0,1)]">
        
        {/* Header & Close Button */}
        <div className="p-6 border-b-[3px] border-black flex justify-between items-center bg-neo-purple/20">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <div className="w-10 h-10 bg-primary rounded-xl border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-white transition-all">
              <Box size={20} strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-foreground leading-none font-space uppercase">
                PAPER ART
              </span>
              <span className="text-[9px] font-bold text-black uppercase tracking-[0.2em] mt-1">
                ERP SYSTEM
              </span>
            </div>
          </Link>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-3 mt-4">
          {navigation.map((item) => {
            const hasChildren = !!item.children;
            const isOpenMenu = openMenus.includes(item.name);
            const isActive = pathname === item.href || item.children?.some(c => pathname === c.href);

            return (
              <div key={item.name} className="space-y-1.5">
                {hasChildren ? (
                  <div>
                    <button
                      onClick={(e) => toggleMenu(e, item.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all border-2",
                        isActive ? "text-black bg-primary border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "text-black/60 border-black/5 hover:text-black hover:bg-black/5"
                      )}
                    >
                      <div className="flex items-center gap-4 text-xs font-black">
                        <item.icon
                          size={22}
                          className={cn(isActive ? "text-black" : "text-black/40")}
                          strokeWidth={isActive ? 2.5 : 2}
                        />
                        <span className="font-space uppercase tracking-wider">{item.name}</span>
                      </div>
                      <ChevronDown
                        size={16}
                        className={cn(
                          "transition-transform duration-300 opacity-60",
                          isOpenMenu ? "rotate-180" : ""
                        )}
                        strokeWidth={3}
                      />
                    </button>

                    {isOpenMenu && (
                      <div className="mt-3 ml-7 pl-4 border-l-2 border-dashed border-black/20 space-y-2">
                        {item.children?.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={onClose} // close menu on navigation
                            className={cn(
                              "flex items-center justify-between px-4 py-3 text-[10px] font-black rounded-xl transition-all border-2",
                              pathname === child.href ? "text-black bg-secondary border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "text-black/50 border-transparent hover:text-black hover:bg-black/5 hover:border-black/10"
                            )}
                          >
                            <span className="uppercase tracking-widest">{child.name}</span>
                            {pathname === child.href && <ChevronRight size={14} strokeWidth={3} />}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={onClose} // close menu on navigation
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-xl text-xs font-black transition-all border-2",
                      pathname === item.href ? "text-black bg-primary border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" : "text-black/60 border-black/5 hover:text-black hover:bg-black/5"
                    )}
                  >
                    <item.icon
                      size={22}
                      className={cn(pathname === item.href ? "text-black" : "text-black/40")}
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
        <div className="p-6 border-t-[3px] border-black mt-auto bg-neo-yellow/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white border-2 border-black flex items-center justify-center text-black font-black text-sm shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {profile?.name?.substring(0, 2).toUpperCase() || 'PA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-black truncate tracking-tight uppercase font-space">
                {profile?.name || 'User Account'}
              </p>
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">
                {currentRole}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              signOut();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            <LogOut size={16} strokeWidth={3} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}
