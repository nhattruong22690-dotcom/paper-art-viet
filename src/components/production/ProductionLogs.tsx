"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  History, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  User as UserIcon, 
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
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      {/* FILTER BAR / HEADER */}
      <div className="bg-card p-8 rounded-[2.5rem] border border-border/10 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
           <FileSpreadsheet size={240} className="text-primary" />
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-foreground text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-black/10">
                <History size={28} />
             </div>
             <div>
                <nav className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 opacity-40">
                  <Package size={12} className="text-primary opacity-100" />
                  <span>Sản xuất</span>
                  <ChevronRight size={10} />
                  <span className="text-primary italic opacity-100 italic">Nhật trình vận hành</span>
                </nav>
                <h1 className="text-2xl font-semibold text-foreground tracking-tight uppercase">Nhật trình <span className="text-primary italic font-semibold">Vận hành</span></h1>
                <p className="text-xs text-muted-foreground font-normal mt-1 italic opacity-60">Duyệt trình Công nhật & Thụ ký Sản lượng hệ thống hàng ngày.</p>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
             {/* Search */}
             <div className="relative flex-1 min-w-[320px] group">
                <input 
                  type="text"
                  placeholder="Tìm theo thợ hoặc sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-background border-2 border-black/10 rounded-2xl text-sm font-semibold text-foreground outline-none focus:border-black transition-all"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
             </div>

             {/* Date Nav */}
             <div className="flex items-center gap-3 bg-background border-2 border-black/5 p-1.5 rounded-2xl shadow-inner">
                <button 
                  onClick={() => changeDay(-1)} 
                  className="w-10 h-10 flex items-center justify-center bg-card border border-border/10 hover:text-primary hover:border-primary/20 rounded-xl transition-all text-muted-foreground/30 active:scale-95"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-6 flex flex-col items-center min-w-[140px]">
                   <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-0.5 opacity-40">Kỳ báo cáo</p>
                   <input 
                     type="date"
                     value={date}
                     onChange={(e) => handleDateChange(e.target.value)}
                     className="bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer text-center uppercase tracking-tighter"
                   />
                </div>
                <button 
                  onClick={() => changeDay(1)} 
                  className="w-10 h-10 flex items-center justify-center bg-card border border-border/10 hover:text-primary hover:border-primary/20 rounded-xl transition-all text-muted-foreground/30 active:scale-95"
                >
                  <ChevronRight size={20} />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* LIST VIEW TABLE */}
      <div className="bg-card border border-border/10 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-foreground text-white">
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">Thời điểm</th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">Thợ vận hành</th>
                <th className="px-8 py-5 text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">Sản phẩm / SKU</th>
                <th className="px-6 py-5 w-32 text-center text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">Sản lượng</th>
                <th className="px-6 py-5 w-40 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-300">Khuyết tật</th>
                <th className="px-8 py-5 w-40 text-center text-[10px] font-semibold uppercase tracking-[0.2em] opacity-40">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              {filteredLogs.map((log, index) => (
                <tr 
                  key={log.id} 
                  ref={index === filteredLogs.length - 1 ? lastLogElementRef : null}
                  className="hover:bg-background transition-all group"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3 text-muted-foreground/40 group-hover:text-foreground transition-colors">
                       <Clock size={16} className="text-primary/30" />
                       <span className="font-semibold tabular-nums text-xs">
                          {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-background border border-border/10 rounded-2xl flex items-center justify-center text-muted-foreground/20 text-xs font-semibold uppercase shadow-inner group-hover:bg-primary group-hover:text-white transition-all">
                          {log.staffName?.charAt(0)}
                       </div>
                       <div>
                          <p className="font-semibold text-foreground uppercase tracking-tight">{log.staffName}</p>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mt-1 opacity-30">#{log.userId}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                       <p className="font-semibold text-foreground uppercase tracking-tight text-xs">{log.productionOrder.product.name}</p>
                       <span className="text-[9px] font-semibold text-primary bg-primary/5 px-2 py-1 rounded-xl border border-primary/10 uppercase tracking-widest">
                          {log.productionOrder.sku}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className="inline-block px-4 py-1.5 bg-background border border-border/10 rounded-2xl text-xs font-semibold text-foreground tabular-nums shadow-sm">
                      {log.quantityProduced}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex justify-center gap-6">
                       <div className="text-center group/err">
                          <span className="block text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 opacity-20 group-hover/err:opacity-100 transition-opacity">KT THỢ</span>
                          <span className="text-xs font-semibold text-destructive tabular-nums bg-destructive/5 px-2 py-0.5 rounded-lg border border-destructive/10">{log.technicalErrorCount}</span>
                       </div>
                       <div className="text-center group/mat">
                          <span className="block text-[8px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 opacity-20 group-hover/mat:opacity-100 transition-opacity">VT LỖI</span>
                          <span className="text-xs font-semibold text-muted-foreground tabular-nums bg-background border border-border/10 px-2 py-0.5 rounded-lg">{log.materialErrorCount}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 text-emerald-600 rounded-2xl border border-emerald-500/10 text-[10px] font-semibold uppercase tracking-widest shadow-sm">
                       <CheckCircle2 size={12} className="opacity-40" />
                       Đã chốt
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOADING & EMPTY */}
        {isLoading && (
          <div className="flex justify-center py-24 bg-background/50">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        )}

        {!isLoading && filteredLogs.length === 0 && (
          <div className="py-24 flex flex-col items-center text-center animate-in zoom-in duration-500">
             <div className="w-20 h-20 bg-background border-2 border-black/5 rounded-[2rem] flex items-center justify-center text-muted-foreground/10 mb-6 shadow-inner">
                <FileText size={40} />
             </div>
             <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest italic opacity-40">Sổ cái trống rỗng</h3>
             <p className="text-[10px] text-muted-foreground/30 font-semibold uppercase tracking-widest mt-2 px-8 max-w-sm">Không tìm thấy bản ghi nào khớp với điều kiện tra cứu tại kỳ báo cáo này.</p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-10 flex flex-col items-center gap-4 border-t border-border/5 mt-8">
         <div className="h-px w-24 bg-border/20" />
         <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-[0.4em] opacity-40 text-center leading-relaxed">
           Paper Art Việt ERP <span className="mx-2 text-primary opacity-100">•</span> Operational Logs System <span className="mx-2 text-primary opacity-100">•</span> View Mode
         </p>
      </div>
    </div>
  );
}
