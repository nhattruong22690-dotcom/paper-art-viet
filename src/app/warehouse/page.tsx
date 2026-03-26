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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            <Archive size={12} />
            <span>Kho vận</span>
            <ChevronRight size={10} />
            <span className="text-primary italic">{activeTab === 'inventory' ? 'Inventory Control' : 'Packing Station'}</span>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Quản trị <span className="text-primary">Kho bãi</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">
             Hệ thống quản lý vật tư và đóng gói thành phẩm 2025.
          </p>
        </div>
        
        <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 active:scale-95",
              activeTab === 'inventory' 
                ? "bg-white text-primary shadow-soft border border-slate-200/50" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Layers size={16} strokeWidth={2.5} /> Kiểm soát vật tư
          </button>
          <button 
            onClick={() => setActiveTab('packing')}
            className={cn(
              "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 active:scale-95",
              activeTab === 'packing' 
                ? "bg-white text-primary shadow-soft border border-slate-200/50" 
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Box size={16} strokeWidth={2.5} /> Trạm đóng gói
          </button>
        </div>
      </div>

      {/* RENDER CONTENT BASED ON TAB */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {activeTab === 'inventory' ? (
          <InventoryDashboard />
        ) : (
          <PackingStation />
        )}
      </div>

      {/* Footer Meta */}
      <div className="pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
         <span>Logistics Module v4.1</span>
         <span className="flex items-center gap-2 pl-4 border-l border-slate-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Vận hành ổn định
         </span>
      </div>
    </div>
  );
}
