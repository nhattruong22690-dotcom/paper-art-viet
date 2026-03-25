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
    <div className="bg-retro-paper min-h-screen font-typewriter overflow-hidden">
      {/* HEADER SECTION */}
      <header className="bg-white border-b-2 border-retro-sepia/10 shadow-sm relative overflow-hidden shrink-0">
         <div className="washi-tape-top" />
         <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
            <Factory size={200} strokeWidth={0.5} className="text-retro-sepia" />
         </div>
         
         <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
               <div className="flex items-center gap-8">
                  <Link 
                    href="/mobile-menu/production"
                    className="w-14 h-14 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia hover:bg-retro-brick/10 hover:text-retro-brick transition-all rotate-3 hover:rotate-0 shadow-sm"
                  >
                    <ArrowLeft size={24} strokeWidth={1.5} />
                  </Link>
                  <div>
                    <nav className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-4 opacity-60">
                      <Factory size={14} strokeWidth={1.5} />
                      <span>Quản hưu Sản xuất</span>
                      <ChevronRight size={12} strokeWidth={1.5} />
                      <span className="text-retro-sepia">Điều phối Công xưởng</span>
                    </nav>
                    <h1 className="text-3xl md:text-4xl font-black text-retro-sepia tracking-tighter uppercase italic underline decoration-double decoration-retro-mustard/30 underline-offset-8">
                      Lệnh <span className="text-retro-brick">Vận hành</span>
                    </h1>
                  </div>
               </div>

               <div className="flex flex-wrap items-center gap-6 w-full md:w-auto">
                  <div className="bg-retro-paper border-2 border-retro-sepia/10 p-1.5 shadow-inner flex gap-2">
                     <button 
                        onClick={() => setViewMode('kanban')}
                        className={`p-3 transition-all ${viewMode === 'kanban' ? 'bg-retro-sepia text-retro-paper shadow-lg rotate-3' : 'text-retro-earth/40 hover:text-retro-sepia'}`}
                     >
                        <LayoutGrid size={20} strokeWidth={2} />
                     </button>
                     <button 
                        onClick={() => setViewMode('list')}
                        className={`p-3 transition-all ${viewMode === 'list' ? 'bg-retro-sepia text-retro-paper shadow-lg -rotate-3' : 'text-retro-earth/40 hover:text-retro-sepia'}`}
                     >
                        <List size={20} strokeWidth={2} />
                     </button>
                  </div>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-4 px-10 py-5 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all active:scale-95 italic">
                    <Plus size={20} strokeWidth={2.5} />
                    Khởi tạo Lệnh mới
                  </button>
               </div>
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 relative z-10 space-y-12 pb-24">
        {/* FILTER & SEARCH */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20 group-focus-within:text-retro-brick transition-all" size={20} strokeWidth={2} />
            <input 
              type="text" 
              placeholder="Truy tìm Lệnh sản xuất, SKU hoặc mã vật phẩm..."
              className="w-full bg-white border-2 border-retro-sepia/10 py-5 pl-16 pr-8 text-xs font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia shadow-inner transition-all placeholder:italic placeholder:font-normal placeholder:lowercase tracking-tight"
            />
          </div>
          <button className="px-10 py-5 bg-white border-2 border-retro-sepia/10 font-black text-[11px] uppercase tracking-widest text-retro-sepia/40 flex items-center justify-center gap-4 hover:border-retro-sepia hover:text-retro-sepia transition-all shadow-sm italic">
            <Filter size={18} strokeWidth={2.5} /> Phân loại trạng thái
          </button>
        </div>

        {/* CONTENT AREA */}
        <div className="animate-in fade-in duration-700">
          {viewMode === 'kanban' ? (
            <ProductionPipeline />
          ) : (
            <div className="py-40 flex flex-col items-center text-center bg-white/40 border-4 border-dashed border-retro-sepia/10 shadow-inner">
               <div className="w-24 h-24 bg-retro-paper border-2 border-retro-sepia/5 flex items-center justify-center text-retro-earth/10 mb-8 rotate-12">
                  <List size={48} strokeWidth={0.5} />
               </div>
               <h3 className="text-xl font-black text-retro-sepia uppercase tracking-[0.2em] italic opacity-60">Sổ cái Danh sách</h3>
               <p className="text-[10px] text-retro-earth/40 font-black uppercase tracking-[0.4em] mt-4 italic">Chế độ hiển thị tuyến tính đang được thụ lý thi công...</p>
            </div>
          )}
        </div>
      </main>
      
      <div className="torn-paper-bottom" />
    </div>
  );
}
