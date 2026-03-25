"use client";

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  MapPin, 
  Building2,
  Loader2,
  ChevronRight,
  Package,
  ArrowUpRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function OutsourcingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/outsourcing')
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load outsourcing orders:', err);
        setLoading(false);
      });
  }, []);

  const filteredOrders = orders.filter(o => 
    (o.order?.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inProduction = filteredOrders.filter(o => o.currentStatus === 'in_progress').length;
  const waitingPickup = filteredOrders.filter(o => o.currentStatus === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24 px-6 md:px-12 font-typewriter">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 bg-retro-paper p-10 border-b-2 border-retro-sepia/10 relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(62,39,35,0.1)]">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <ClipboardList size={240} strokeWidth={0.5} className="text-retro-sepia" />
        </div>
        
        <div className="relative z-10">
          <nav className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-6 opacity-60">
            <Package size={14} strokeWidth={1.5} />
            <span>Sản xuất</span>
            <ChevronRight size={12} strokeWidth={1.5} />
            <span className="text-retro-sepia">Gia công ngoài (Outsourcing)</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black text-retro-sepia uppercase tracking-tighter italic">
            Lệnh <span className="text-retro-brick underline decoration-double decoration-retro-brick/30 underline-offset-8">Gia công</span>
          </h1>
          <div className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] italic mt-4 opacity-60 flex items-center gap-2">
            <div className="w-2 h-2 bg-retro-mustard rotate-45" />
            Điều phối & Ủy thác chế tác Ngoại viện — MCMLXXXIV
          </div>
        </div>

        <button 
          className="relative z-10 flex items-center gap-4 px-10 py-5 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all active:scale-95 italic"
        >
          <Plus size={20} strokeWidth={2.5} />
          Khởi tạo Lệnh gia công
        </button>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="bg-retro-sepia p-10 shadow-xl border-t-4 border-retro-brick relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform">
             <Clock size={120} strokeWidth={1} className="text-white" />
          </div>
          <div className="relative z-10 space-y-6">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">Đang chế tác</span>
            <p className="text-5xl font-black text-white italic tracking-tighter">
              {loading ? '...' : String(inProduction).padStart(2, '0')} 
              <span className="text-xs font-bold text-white/40 not-italic uppercase ml-4 tracking-[0.2em]">Cơ sở</span>
            </p>
          </div>
        </div>

        <div className="bg-white p-10 border-2 border-retro-sepia/10 shadow-sm relative group hover:border-retro-sepia/20 transition-all rotate-1 hover:rotate-0">
          <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.07] transition-all">
             <Building2 size={120} strokeWidth={1} className="text-retro-sepia" />
          </div>
          <div className="relative z-10 space-y-6">
            <span className="text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60">Đợi điều phối</span>
            <p className="text-5xl font-black text-retro-sepia italic tracking-tighter">
              {loading ? '...' : String(waitingPickup).padStart(2, '0')} 
              <span className="text-xs font-bold text-retro-earth/40 not-italic uppercase ml-4 tracking-[0.2em]">Đơn vị</span>
            </p>
          </div>
        </div>

        <div className="bg-retro-paper p-10 border-2 border-retro-sepia/10 shadow-sm relative group hover:shadow-xl transition-all -rotate-1 hover:rotate-0">
           <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.07] transition-all">
             <MapPin size={120} strokeWidth={1} className="text-retro-sepia" />
          </div>
          <div className="relative z-10 space-y-6">
            <span className="text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60">Tổng thụ lục</span>
            <p className="text-5xl font-black text-retro-sepia italic tracking-tighter">
              {loading ? '...' : String(filteredOrders.length).padStart(2, '0')} 
              <span className="text-xs font-bold text-retro-earth/40 not-italic uppercase ml-4 tracking-[0.2em]">Lệnh GC</span>
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH/FILTER BAR */}
      <div className="bg-white/60 p-8 border-2 border-retro-sepia/10 shadow-inner flex flex-col md:flex-row gap-8">
        <div className="relative flex-1 group">
          <input 
            type="text" 
            placeholder="Tra cứu danh tánh khách hàng, mã số lệnh, hoặc họa phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia transition-all shadow-inner placeholder:italic placeholder:font-normal placeholder:lowercase tracking-tight"
          />
          <Search size={22} strokeWidth={1.5} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20 group-focus-within:text-retro-brick transition-all" />
        </div>
        
        <button className="px-10 py-5 bg-white border-2 border-retro-sepia/10 font-black text-[11px] uppercase tracking-[0.2em] text-retro-sepia flex items-center gap-4 hover:bg-retro-paper transition-all shadow-sm rotate-1 hover:rotate-0 italic">
          <Filter size={20} strokeWidth={1.5} /> Phân loại lệnh
        </button>
      </div>

      {/* OUTSOURCING LIST */}
      <div className="bg-white border-2 border-retro-sepia/10 shadow-[0_20px_50px_-12px_rgba(62,39,35,0.15)] overflow-hidden min-h-[500px]">
        <div className="p-8 bg-retro-paper/20 border-b-2 border-retro-sepia/10 flex justify-between items-center">
            <h3 className="text-[11px] font-black uppercase text-retro-earth tracking-[0.2em] flex items-center gap-4 italic opacity-60">
               <ClipboardList size={20} className="text-retro-brick" strokeWidth={1.5} /> Sổ cái Ủy nhiệm Gia công
            </h3>
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-8 text-retro-earth/40 italic">
            <Loader2 size={48} className="animate-spin text-retro-brick" strokeWidth={1.5} />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Đang rà soát lệnh gia công...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-retro-paper text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] border-b-2 border-retro-sepia/20 italic opacity-60">
                  <th className="px-10 py-6">Mã lệnh / Khách hàng</th>
                  <th className="px-10 py-6">Vật phẩm Chế tác</th>
                  <th className="px-10 py-6 text-center">Số lượng</th>
                  <th className="px-10 py-6">Hạn kỳ Giao nộp</th>
                  <th className="px-10 py-6 text-right">Trạng thái Niêm yết</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-retro-sepia/5 relative z-0">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="group hover:bg-retro-paper/50 transition-all cursor-pointer">
                    <td className="px-10 py-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white border border-retro-sepia/10 flex items-center justify-center text-retro-sepia group-hover:bg-retro-sepia group-hover:text-retro-paper transition-all rotate-3 group-hover:rotate-0">
                           <Building2 size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-retro-sepia uppercase tracking-tight italic group-hover:text-retro-brick transition-all">{o.order?.customer?.name || 'N/A'}</h4>
                          <p className="text-[9px] text-retro-earth/40 font-black tracking-[0.2em] mt-2 italic group-hover:text-retro-earth transition-all">SỐ HIỆU: #{o.id?.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col space-y-2">
                        <span className="text-xs font-black text-retro-sepia uppercase tracking-tight">{o.product?.name}</span>
                        <div className="inline-block self-start px-2 py-0.5 bg-retro-paper border border-retro-sepia/10 text-[9px] font-black text-retro-earth/60 uppercase italic tracking-widest">
                          {o.product?.sku || 'CHƯA-GÁN-MÃ'}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className="text-lg font-black text-retro-brick italic tabular-nums bg-retro-brick/5 px-4 py-1 border border-retro-brick/10 shadow-inner">
                        {o.quantityTarget}
                      </span>
                      <span className="text-[9px] font-black text-retro-earth/40 uppercase ml-2 italic tracking-widest">pcs</span>
                    </td>
                    <td className="px-10 py-6">
                       <div className="flex items-center gap-3">
                          <Clock size={16} strokeWidth={1.5} className="text-retro-earth/20" />
                          <span className="text-sm font-black text-retro-sepia italic tracking-tighter">
                            {o.deadlineProduction ? new Date(o.deadlineProduction).toLocaleDateString('vi-VN') : 'Vô định'}
                          </span>
                       </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-5 py-2 border-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm italic rotate-2 transition-all",
                        o.currentStatus === 'in_progress' ? 'border-retro-mustard text-retro-mustard bg-retro-mustard/5' : 
                        o.currentStatus === 'completed' ? 'border-retro-moss text-retro-moss bg-retro-moss/5' : 'border-retro-earth/30 text-retro-earth/40'
                      )}>
                        {o.currentStatus === 'in_progress' ? 'Đang Chế tác' : 
                         o.currentStatus === 'completed' ? 'Đã Giao nộp' : 'Đang Chờ đợi'}
                        <ArrowUpRight size={14} strokeWidth={2.5} />
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-40 text-center">
                       <div className="w-16 h-16 bg-retro-paper border-2 border-retro-sepia/5 flex items-center justify-center text-retro-earth/10 mx-auto mb-8 border-dashed rotate-3">
                          <ClipboardList size={32} strokeWidth={0.5} />
                       </div>
                       <p className="text-[10px] font-black uppercase text-retro-earth/30 tracking-[0.4em] italic leading-relaxed">Niệm thư trống rỗng<br/>Chưa ghi nhận lệnh gia công nào</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
