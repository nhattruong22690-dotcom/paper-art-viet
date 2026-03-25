"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  History, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Package, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  FileText,
  Filter,
  FileSpreadsheet
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces
interface WorkLog {
  id: string;
  userId: string;
  staffName?: string;
  quantityProduced: number;
  technicalErrorCount: number;
  materialErrorCount: number;
  status: string;
  startTime: string;
  endTime?: string;
  productionOrder: {
    sku: string;
    product: {
      name: string;
    };
  };
}

export default function ProductionLogs() {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const observer = useRef<IntersectionObserver | null>(null);

  const lastLogElementRef = useCallback((node: HTMLTableRowElement | null) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  const fetchLogs = useCallback(async (isNewDate: boolean = false) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/production/logs?date=${date}&skip=${isNewDate ? 0 : page * 20}&take=20`);
      const newLogsData = await res.json();
      
      const mappedLogs: WorkLog[] = (Array.isArray(newLogsData) ? newLogsData : []).map((l: any) => ({
        id: l.id,
        userId: l.employee?.employee_code || l.userId?.slice(-6).toUpperCase() || 'N/A',
        staffName: l.staffName || l.employee?.full_name || 'Vô danh',
        quantityProduced: l.quantityProduced,
        technicalErrorCount: l.technicalErrorCount,
        materialErrorCount: l.materialErrorCount,
        status: l.status,
        startTime: l.startTime,
        endTime: l.endTime,
        productionOrder: {
          sku: l.productionOrder?.product?.sku || 'N/A',
          product: { name: l.productionOrder?.product?.name || 'Sản phẩm cũ' }
        }
      }));

      if (isNewDate) {
        setLogs(mappedLogs);
        setHasMore(mappedLogs.length === 20);
      } else {
        setLogs(prev => [...prev, ...mappedLogs]);
        setHasMore(mappedLogs.length === 20);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [date, page]);

  useEffect(() => {
    fetchLogs(page === 0);
  }, [page, fetchLogs]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    setLogs([]);
    setPage(0);
    setHasMore(true);
  };

  const changeDay = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    handleDateChange(d.toISOString().split('T')[0]);
  };

  const filteredLogs = logs.filter(log => 
    log.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.productionOrder.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 font-typewriter">
      {/* FILTER BAR */}
      <div className="bg-retro-paper border-2 border-retro-sepia/10 shadow-[0_15px_40px_-10px_rgba(62,39,35,0.1)] p-10 flex flex-wrap justify-between items-center gap-10 relative overflow-hidden">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
           <FileSpreadsheet size={160} strokeWidth={0.5} className="text-retro-sepia" />
        </div>

        <div className="flex items-center gap-8 relative z-10">
           <div className="w-16 h-16 bg-retro-sepia text-retro-paper flex items-center justify-center shadow-lg rotate-3">
              <History size={28} strokeWidth={1.5} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-retro-sepia uppercase tracking-tighter italic">Nhật trình <span className="text-retro-brick underline decoration-double decoration-retro-brick/30">Vận hành</span></h1>
              <div className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] italic mt-4 opacity-60 flex items-center gap-3">
                <div className="w-2 h-2 bg-retro-mustard rotate-45" />
                Duyệt trình Công nhật & Thụ ký Sản lượng — MCMLXXXIV
             </div>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 relative z-10">
           {/* Search */}
           <div className="relative group">
              <input 
                type="text"
                placeholder="Truy vấn Thợ, mã vật phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-14 pr-6 py-4 bg-white border-2 border-retro-sepia/10 text-xs font-black text-retro-sepia outline-none focus:border-retro-sepia shadow-inner transition-all w-80 uppercase tracking-tight italic placeholder:opacity-30"
              />
              <Search size={18} strokeWidth={1.5} className="absolute left-5 top-1/2 -translate-y-1/2 text-retro-sepia/30 group-focus-within:text-retro-sepia" />
           </div>

           {/* Date Nav */}
           <div className="flex items-center gap-4 bg-white p-2 border-2 border-retro-sepia/10 shadow-sm">
              <button 
                onClick={() => changeDay(-1)} 
                className="p-3 bg-retro-paper border border-retro-sepia/10 hover:bg-retro-sepia hover:text-white text-retro-sepia transition-all active:scale-95 shadow-sm"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <div className="px-6 flex flex-col items-center min-w-[160px]">
                 <p className="text-[9px] font-black text-retro-earth/40 uppercase tracking-[0.2em] mb-1 italic">Kỳ báo cáo</p>
                 <input 
                   type="date"
                   value={date}
                   onChange={(e) => handleDateChange(e.target.value)}
                   className="bg-transparent text-sm font-black text-retro-sepia outline-none cursor-pointer uppercase tracking-widest text-center italic"
                 />
              </div>
              <button 
                onClick={() => changeDay(1)} 
                className="p-3 bg-retro-paper border border-retro-sepia/10 hover:bg-retro-sepia hover:text-white text-retro-sepia transition-all active:scale-95 shadow-sm"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
           </div>
        </div>
      </div>

      {/* LIST VIEW TABLE */}
      <div className="bg-white border-2 border-retro-sepia/10 shadow-[0_20px_50px_-12px_rgba(62,39,35,0.15)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-retro-paper border-b-2 border-retro-sepia/20">
                <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60">Thời điểm</th>
                <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60">Thợ vận hành</th>
                <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60">Vật phẩm / Bản thiết kế</th>
                <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60 text-center">Sản lượng</th>
                <th className="px-10 py-6 text-[10px] font-black text-retro-brick uppercase tracking-[0.2em] italic opacity-60 text-center">Khuyết tật ⚙️</th>
                <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-retro-sepia/5 relative z-0">
              {filteredLogs.map((log, index) => (
                <tr 
                  key={log.id} 
                  ref={index === filteredLogs.length - 1 ? lastLogElementRef : null}
                  className="hover:bg-retro-paper/50 transition-all group"
                >
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <Clock size={16} strokeWidth={1.5} className="text-retro-earth/40 group-hover:text-retro-sepia" />
                       <span className="text-sm font-black text-retro-sepia italic">
                          {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-retro-paper border border-retro-sepia/10 flex items-center justify-center text-retro-sepia text-sm font-black uppercase rotate-3 group-hover:rotate-0 transition-transform">
                          {log.staffName?.charAt(0)}
                       </div>
                       <div>
                          <p className="text-xs font-black text-retro-sepia uppercase tracking-tight italic">{log.staffName}</p>
                          <p className="text-[9px] text-retro-earth/40 font-black tracking-[0.2em] mt-1 italic">MÃ THỢ: #{log.userId}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-2">
                       <p className="text-xs font-black text-retro-sepia uppercase tracking-tight">{log.productionOrder.product.name}</p>
                       <div className="inline-block px-3 py-1 bg-retro-paper border border-retro-sepia/10 text-retro-sepia text-[10px] font-black tracking-widest uppercase italic">
                          {log.productionOrder.sku}
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <span className="text-lg font-black text-retro-brick bg-retro-brick/5 px-5 py-2 border border-retro-brick/10 shadow-inner italic">
                      {log.quantityProduced}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className="flex justify-center gap-6">
                       <div className="text-center">
                          <span className="block text-[8px] uppercase tracking-[0.2em] text-retro-earth/40 mb-1 italic">Kỹ nghệ</span>
                          <span className="text-sm font-black text-retro-brick tabular-nums italic">{log.technicalErrorCount}</span>
                       </div>
                       <div className="text-center">
                          <span className="block text-[8px] uppercase tracking-[0.2em] text-retro-earth/40 mb-1 italic">Vật liệu</span>
                          <span className="text-sm font-black text-retro-earth/60 tabular-nums italic">{log.materialErrorCount}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 border-2 border-retro-moss text-retro-moss text-[10px] font-black uppercase tracking-[0.2em] shadow-sm italic rotate-1">
                       <CheckCircle2 size={14} strokeWidth={2.5} />
                       Đã Niêm yết
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOADING & EMPTY */}
        {isLoading && (
          <div className="flex justify-center py-20 bg-retro-paper/10">
            <Loader2 className="animate-spin text-retro-brick" size={32} strokeWidth={1.5} />
          </div>
        )}

        {!isLoading && filteredLogs.length === 0 && (
          <div className="py-32 flex flex-col items-center text-center">
             <div className="w-24 h-24 bg-retro-paper border-2 border-retro-sepia/5 flex items-center justify-center text-retro-earth/10 mb-8 border-dashed rotate-3">
                <FileText size={48} strokeWidth={0.5} />
             </div>
             <h3 className="text-base font-black text-retro-sepia uppercase tracking-widest italic opacity-60">Sổ cái trống rỗng</h3>
             <p className="text-[10px] text-retro-earth/40 font-black uppercase tracking-[0.3em] mt-4 italic">Không tìm thấy bản ghi nào khớp với điều kiện tra cứu.</p>
          </div>
        )}
      </div>
    </div>
  );
}
