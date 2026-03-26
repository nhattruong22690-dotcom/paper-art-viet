"use client";

import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import { usePathname } from 'next/navigation';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return (
      <div className="flex min-h-screen bg-background font-sans">
        <main className="flex-1 relative z-0">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background relative overflow-x-hidden font-sans">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 relative z-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
