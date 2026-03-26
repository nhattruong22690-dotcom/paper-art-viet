"use client";

import React from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
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
