"use client";

import React, { useState } from 'react';
import { 
  Plus, 
  Filter, 
  Search,
  LayoutGrid,
  List,
  ArrowLeft,
  ChevronRight,
  Factory
} from 'lucide-react';
import ProductionPipeline from '@/components/production/ProductionPipeline';
import Link from 'next/link';

export default function ProductionPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="neo-card !p-8 !flex-col md:!flex-row justify-between items-start md:items-center gap-6 bg-neo-yellow/20">
        <div className="flex items-center gap-6">
          <Link 
            href="/mobile-menu/production"
            className="w-12 h-12 bg-white border-neo border-black rounded-xl flex items-center justify-center text-black hover:bg-neo-yellow shadow-neo-active hover:shadow-neo transition-all"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </Link>
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-2">
              <Factory size={14} strokeWidth={3} />
              <span>Sản xuất</span>
              <ChevronRight size={12} strokeWidth={3} />
              <span className="text-purple-600 bg-white px-2 py-0.5 rounded-lg border border-black/10">Điều phối xưởng</span>
            </nav>
            <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase font-space">
              Quản lý <span className="text-purple-500">Lệnh sản xuất</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="bg-black/5 p-1.5 rounded-xl border-2 border-black flex gap-2 shadow-neo-active">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2.5 rounded-lg transition-all border-2 ${viewMode === 'kanban' ? 'bg-black text-white border-black shadow-neo' : 'text-black/40 border-transparent hover:text-black'}`}
              title="DẠNG BẢNG (KANBAN)"
            >
              <LayoutGrid size={20} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all border-2 ${viewMode === 'list' ? 'bg-black text-white border-black shadow-neo' : 'text-black/40 border-transparent hover:text-black'}`}
              title="DẠNG DANH SÁCH"
            >
              <List size={20} strokeWidth={2.5} />
            </button>
          </div>
          <button className="btn-primary gap-3 shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            <Plus size={22} strokeWidth={3} />
            <span className="font-space uppercase tracking-widest text-xs">Tạo lệnh mới</span>
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="neo-card !p-5 flex flex-col md:flex-row gap-5 bg-white shadow-neo">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-black transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="TÌM KIẾM LỆNH SẢN XUẤT, SKU, MÃ ĐƠN..."
            className="form-input pl-12 h-12 w-full font-bold uppercase placeholder:font-normal placeholder:normal-case shadow-neo-active focus:shadow-neo"
          />
        </div>
        <button className="btn-secondary whitespace-nowrap gap-3 bg-neo-mint shadow-neo-active">
          <Filter size={18} strokeWidth={3} /> <span className="font-space uppercase tracking-widest text-xs">Bộ lọc nâng cao</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-700">
        {viewMode === 'kanban' ? (
          <ProductionPipeline />
        ) : (
          <div className="py-40 flex flex-col items-center text-center bg-white neo-card border-dashed bg-white/50">
            <div className="w-20 h-20 bg-neo-purple/10 border-neo border-black rounded-3xl flex items-center justify-center text-purple-600 mb-8 shadow-neo rotate-3">
              <List size={40} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-bold text-black uppercase font-space">Danh sách lệnh sản xuất</h3>
            <p className="text-xs font-black uppercase text-black/40 mt-4 max-w-xs tracking-widest">Chế độ hiển thị danh sách đang được hoàn thiện. Vui lòng sử dụng chế độ Kanban.</p>
          </div>
        )}
      </div>
    </div>
  );
}
