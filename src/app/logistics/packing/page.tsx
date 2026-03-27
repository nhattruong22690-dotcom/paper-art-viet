"use client";

import React from 'react';
import PackingStation from '@/components/warehouse/PackingStation';
import { Scan, Box } from 'lucide-react';

export default function PackingPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
             <Box size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight uppercase italic">Trạm Đóng gói</h1>
            <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">Outbound Fulfillment & Quality Control Station</p>
          </div>
        </div>
        <button className="btn-secondary h-12 px-6 text-[10px] uppercase tracking-widest">
           <Scan size={18} strokeWidth={3} /> Quét mã vạch (SKU)
        </button>
      </header>

      {/* Tái sử dụng component PackingStation đã tách ra */}
      <PackingStation />
    </div>
  );
}
