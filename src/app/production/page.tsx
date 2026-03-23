"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  Search,
  LayoutGrid,
  List
} from 'lucide-react';
import ProductionPipeline from '@/components/production/ProductionPipeline';

export default function ProductionPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Điều phối Sản xuất</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest italic">Paper Art Việt - Manufacturing Execution System</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
             <button 
                onClick={() => setViewMode('kanban')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'kanban' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                <LayoutGrid size={20} />
             </button>
             <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                <List size={20} />
             </button>
          </div>
          <button className="px-6 py-4 bg-primary-600 text-white rounded-[24px] font-black shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all flex items-center gap-3 text-xs uppercase tracking-widest">
            <Plus size={18} /> Tạo lệnh sản xuất mới
          </button>
        </div>
      </header>

      {/* FILTER & SEARCH */}
      <div className="flex gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm lệnh sản xuất, SKU, sản phẩm..."
            className="w-full bg-white border border-gray-100 rounded-[28px] py-5 pl-16 pr-8 text-sm outline-none shadow-sm focus:shadow-md focus:border-primary-100 transition-all font-medium"
          />
        </div>
        <button className="px-8 py-5 bg-white border border-gray-100 rounded-[28px] font-black text-[11px] uppercase tracking-widest text-gray-500 flex items-center gap-3 hover:bg-gray-50 transition-all">
          <Filter size={18} /> Lọc theo tính trạng
        </button>
      </div>

      {/* KANBAN PIPEINE */}
      {viewMode === 'kanban' ? (
        <ProductionPipeline />
      ) : (
        <div className="p-20 text-center bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-200 text-gray-400 italic font-black uppercase tracking-widest text-xs">
          Chế độ danh sách đang được phát triển...
        </div>
      )}
    </div>
  );
}
