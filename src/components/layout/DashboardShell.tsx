"use client";

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen relative overflow-x-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        
        <main className="flex-1 p-3 lg:p-8 pb-32 lg:pb-8 bg-retro-paper relative z-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
