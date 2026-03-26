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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="card !flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/mobile-menu/production"
            className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              <Factory size={12} />
              <span>Sản xuất</span>
              <ChevronRight size={10} />
              <span className="text-primary">Điều phối xưởng</span>
            </nav>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Quản lý Lệnh sản xuất
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Dạng bảng (Kanban)"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Dạng danh sách"
            >
              <List size={18} />
            </button>
          </div>
          <button className="btn-primary gap-2">
            <Plus size={18} />
            Tạo lệnh mới
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="card !p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm lệnh sản xuất, SKU, mã đơn..."
            className="form-input pl-10 h-10"
          />
        </div>
        <button className="btn-secondary whitespace-nowrap gap-2">
          <Filter size={16} /> Bộ lọc nâng cao
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-700">
        {viewMode === 'kanban' ? (
          <ProductionPipeline />
        ) : (
          <div className="py-32 flex flex-col items-center text-center bg-white rounded-lg border border-slate-200 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
              <List size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Danh sách lệnh sản xuất</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-xs">Chế độ hiển thị danh sách đang được hoàn thiện. Vui lòng sử dụng chế độ Kanban.</p>
          </div>
        )}
      </div>
    </div>
  );
}
