"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  Factory,
  Database,
  User
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Factory, label: 'Sản xuất', href: '/production' },
  { icon: ShoppingCart, label: 'Đơn hàng', href: '/orders' },
  { icon: Users, label: 'Nhân sự', href: '/hr/employees' },
  { icon: Settings, label: 'Cài đặt', href: '/settings' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-border flex-col shrink-0 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Package className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-lg text-foreground tracking-tight">Paper Art Việt</h1>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                    isActive 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-muted-text hover:bg-gray-100'
                  }`}
                >
                  <Icon size={18} />
                  <span className="text-sm font-semibold">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-border">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
               <User size={16} />
            </div>
            <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-foreground truncate">Admin</p>
               <p className="text-[10px] text-muted-foreground truncate uppercase">Quản trị viên</p>
            </div>
            <button className="text-gray-400 hover:text-destructive">
               <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-white border-b border-border px-4 h-16 flex items-center justify-between sticky top-0 z-50">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
               <Package className="text-white" size={18} />
            </div>
            <h1 className="font-bold text-base text-foreground">PAV ERP</h1>
         </div>
         <button 
           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
           className="p-2 text-muted-text"
         >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
         </button>
      </header>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
           <div className="absolute inset-0 bg-black/20" onClick={() => setIsMobileMenuOpen(false)} />
           <aside className="absolute top-0 right-0 bottom-0 w-64 bg-white shadow-xl p-6 flex flex-col animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center mb-8">
                 <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Menu</h2>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-gray-400"><X size={20} /></button>
              </div>
              <nav className="space-y-1">
                 {navItems.map((item) => {
                   const isActive = pathname === item.href;
                   const Icon = item.icon;
                   return (
                     <Link 
                       key={item.href}
                       href={item.href}
                       onClick={() => setIsMobileMenuOpen(false)}
                       className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                         isActive 
                           ? 'bg-primary/10 text-primary' 
                           : 'text-muted-text hover:bg-gray-50'
                       }`}
                     >
                        <Icon size={20} />
                        <span className="font-semibold">{item.label}</span>
                     </Link>
                   );
                 })}
              </nav>
           </aside>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative bg-background pb-20 md:pb-0">
        {/* Desktop Header Top Bar */}
        <div className="hidden md:flex bg-white items-center justify-between px-8 py-4 border-b border-border sticky top-0 z-40">
           <div className="flex-1 max-w-lg relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="form-input pl-10 h-10"
              />
           </div>
           <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-all">
                 <Bell size={20} />
              </button>
              <div className="w-px h-6 bg-border"></div>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    AD
                 </div>
              </div>
           </div>
        </div>

        <div className="p-4 md:p-8 w-full max-w-7xl mx-auto">
          {children}
        </div>
        
        {/* FOOTER */}
        <footer className="p-8 mt-auto border-t border-border bg-white flex flex-col md:flex-row items-center justify-between gap-4">
           <p className="text-xs text-muted-foreground font-medium">
              Paper Art Việt © 2026 • ERP System
           </p>
           <div className="flex items-center gap-6 text-xs text-muted-foreground font-medium">
              <span className="hover:text-primary cursor-pointer">Support</span>
              <span className="hover:text-primary cursor-pointer">v2.4.0</span>
           </div>
        </footer>
      </main>

      {/* MOBILE BOTTOM NAVIGATION - Standard 4 Buttons */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border h-16 px-4 flex items-center justify-around">
        <Link href="/" className={`flex flex-col items-center gap-1 ${pathname === '/' ? 'text-primary' : 'text-gray-400'}`}>
           <Home size={20} />
           <span className="text-[10px] font-bold">Trang chủ</span>
        </Link>
        <Link href="/production" className={`flex flex-col items-center gap-1 ${pathname === '/production' ? 'text-primary' : 'text-gray-400'}`}>
           <Factory size={20} />
           <span className="text-[10px] font-bold">Sản xuất</span>
        </Link>
        <Link href="/warehouse" className={`flex flex-col items-center gap-1 ${pathname === '/warehouse' ? 'text-primary' : 'text-gray-400'}`}>
           <Database size={20} />
           <span className="text-[10px] font-bold">Kho</span>
        </Link>
        <Link href="/profile" className={`flex flex-col items-center gap-1 ${pathname === '/profile' ? 'text-primary' : 'text-gray-400'}`}>
           <User size={20} />
           <span className="text-[10px] font-bold">Cá nhân</span>
        </Link>
      </nav>
    </div>
  );
}
