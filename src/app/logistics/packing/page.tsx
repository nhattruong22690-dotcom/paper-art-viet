"use client";

import React from 'react';
import PackingStation from '@/components/warehouse/PackingStation';
import { Scan } from 'lucide-react';

export default function PackingPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Đóng gói</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest italic">Paper Art Việt - Logistics Outbound</p>
        </div>
        <button className="px-6 py-3 bg-white border border-gray-100 rounded-xl font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900">
          <Scan size={18} /> Quét mã vạch (SKU)
        </button>
      </header>

      {/* Tái sử dụng component PackingStation đã tách ra */}
      <PackingStation />
    </div>
  );
}
