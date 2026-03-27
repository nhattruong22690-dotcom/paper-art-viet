"use client";

import React, { useState } from 'react';
import { 
  ClipboardList, 
  Box,
  ChevronRight,
  LayoutDashboard,
  Archive,
  Layers
} from 'lucide-react';
import InventoryDashboard from '@/components/inventory/InventoryDashboardRefined';
import PackingStation from '@/components/warehouse/PackingStation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'packing'>('inventory');

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 bg-neo-purple/10 p-8 rounded-xl border-neo border-black shadow-neo">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-3">
            <Archive size={14} className="text-black" />
            <span>Kho vận</span>
            <ChevronRight size={10} />
            <span className="text-black">{activeTab === 'inventory' ? 'Inventory' : 'Packing'}</span>
          </nav>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase leading-none">
            Quản trị <span className="text-neo-purple italic">Kho bãi</span>
          </h1>
          <p className="text-black/60 text-sm mt-2 font-bold uppercase tracking-tight">
             Hệ thống quản lý vật tư và đóng gói • 2026 Edition
          </p>
        </div>
        
        <div className="flex bg-white p-2 rounded-xl border-neo border-black shadow-neo">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "px-8 py-4 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95",
              activeTab === 'inventory' 
                ? "bg-black text-white shadow-neo" 
                : "text-black/40 hover:text-black"
            )}
          >
            <Layers size={18} /> Kiểm soát vật tư
          </button>
          <button 
            onClick={() => setActiveTab('packing')}
            className={cn(
              "px-8 py-4 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95",
              activeTab === 'packing' 
                ? "bg-black text-white shadow-neo" 
                : "text-black/40 hover:text-black"
            )}
          >
            <Box size={18} /> Trạm đóng gói
          </button>
        </div>
      </div>

      {/* RENDER CONTENT BASED ON TAB */}
      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
        {activeTab === 'inventory' ? (
          <InventoryDashboard />
        ) : (
          <PackingStation />
        )}
      </div>

      {/* Footer Meta */}
      <div className="pt-10 border-t-neo border-black flex justify-between items-center text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">
         <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-black text-white rounded">V4.1</span>
            <span>LOGISTICS CORE</span>
         </div>
         <span className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-neo-mint border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
            OPERATIONAL
         </span>
      </div>
    </div>
  );
}
