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
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* FILTER BAR */}
      <div className="bg-white p-6 md:p-8 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
           <FileSpreadsheet size={120} />
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-slate-900 text-white rounded-lg flex items-center justify-center shadow-lg">
                <History size={28} />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Nhật trình Vận hành</h1>
                <p className="text-xs text-slate-500 font-medium mt-1">Duyệt trình Công nhật & Thụ ký Sản lượng hệ thống</p>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
             {/* Search */}
             <div className="relative flex-1 min-w-[280px]">
                <input 
                  type="text"
                  placeholder="Tìm theo thợ hoặc sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-sm"
                />
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             </div>

             {/* Date Nav */}
             <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <button 
                  onClick={() => changeDay(-1)} 
                  className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md transition-all text-slate-400"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="px-4 flex flex-col items-center min-w-[120px]">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Kỳ báo cáo</p>
                   <input 
                     type="date"
                     value={date}
                     onChange={(e) => handleDateChange(e.target.value)}
                     className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer text-center"
                   />
                </div>
                <button 
                  onClick={() => changeDay(1)} 
                  className="p-1.5 hover:bg-white hover:text-blue-600 rounded-md transition-all text-slate-400"
                >
                  <ChevronRight size={20} />
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* LIST VIEW TABLE */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="px-6 py-4">Thời điểm</th>
                <th className="px-6 py-4">Thợ vận hành</th>
                <th className="px-6 py-4">Sản phẩm / SKU</th>
                <th className="px-6 py-4 text-center">Sản lượng</th>
                <th className="px-6 py-4 text-center text-rose-500">Khuyết tật</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log, index) => (
                <tr 
                  key={log.id} 
                  ref={index === filteredLogs.length - 1 ? lastLogElementRef : null}
                  className="hover:bg-slate-50/80 transition-all group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500 group-hover:text-slate-900 transition-colors">
                       <Clock size={16} className="text-slate-300" />
                       <span className="font-bold tabular-nums">
                          {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-xs font-bold uppercase transition-transform group-hover:scale-110">
                          {log.staffName?.charAt(0)}
                       </div>
                       <div>
                          <p className="font-bold text-slate-900">{log.staffName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">#{log.userId}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                       <p className="font-bold text-slate-700">{log.productionOrder.product.name}</p>
                       <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {log.productionOrder.sku}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 bg-slate-100 rounded text-sm font-bold text-slate-700 tabular-nums">
                      {log.quantityProduced}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-4">
                       <div className="text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">KT</span>
                          <span className="text-xs font-bold text-rose-600 tabular-nums">{log.technicalErrorCount}</span>
                       </div>
                       <div className="text-center">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-tight mb-0.5">VT</span>
                          <span className="text-xs font-bold text-slate-500 tabular-nums">{log.materialErrorCount}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100 text-[10px] font-bold uppercase tracking-tight">
                       <CheckCircle2 size={12} />
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
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        )}

        {!isLoading && filteredLogs.length === 0 && (
          <div className="py-24 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4 border-2 border-dashed border-slate-200">
                <FileText size={32} />
             </div>
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest italic opacity-60">Sổ cái trống rỗng</h3>
             <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-2">Không tìm thấy bản ghi nào khớp với điều kiện tra cứu.</p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-6 text-center">
         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paper Art Việt ERP • Operational Logs System • View Mode</p>
      </div>
    </div>
  );
}
