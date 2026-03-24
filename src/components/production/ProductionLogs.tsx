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
  Filter
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
      
      const mappedLogs: WorkLog[] = newLogsData.map((l: any) => ({
        id: l.id,
        userId: l.userId.slice(-6).toUpperCase(),
        staffName: l.staffName || l.user?.name || 'Vô danh',
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* FILTER BAR */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-wrap justify-between items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <History size={24} />
           </div>
           <div>
              <h1 className="text-xl font-black text-gray-900 uppercase italic">Logs XS</h1>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Lịch sử sản xuất vận hành</p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
           {/* Search */}
           <div className="relative">
              <input 
                type="text"
                placeholder="Tìm tên NV, mã SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all w-64 uppercase tracking-tighter"
              />
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
           </div>

           {/* Date Nav */}
           <div className="flex items-center gap-2 bg-indigo-50/50 p-1.5 rounded-2xl border border-indigo-100/50">
              <button onClick={() => changeDay(-1)} className="p-2 hover:bg-white rounded-xl text-indigo-500 transition-all active:scale-90">
                <ChevronLeft size={18} />
              </button>
              <div className="px-4 flex flex-col items-center min-w-[120px]">
                 <input 
                   type="date"
                   value={date}
                   onChange={(e) => handleDateChange(e.target.value)}
                   className="bg-transparent text-[11px] font-black text-indigo-900 outline-none cursor-pointer uppercase"
                 />
              </div>
              <button onClick={() => changeDay(1)} className="p-2 hover:bg-white rounded-xl text-indigo-500 transition-all active:scale-90">
                <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>

      {/* LIST VIEW TABLE */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời gian</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhân viên</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm / SKU</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Sản lượng</th>
                <th className="px-8 py-5 text-[10px] font-black text-rose-400 uppercase tracking-widest text-center">Lỗi 🛠️</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.map((log, index) => (
                <tr 
                  key={log.id} 
                  ref={index === filteredLogs.length - 1 ? lastLogElementRef : null}
                  className="hover:bg-indigo-50/20 transition-colors group"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <Clock size={14} className="text-gray-300 group-hover:text-indigo-400" />
                       <span className="text-xs font-black text-gray-700">
                          {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-[10px] font-bold uppercase group-hover:bg-indigo-100 group-hover:text-indigo-600">
                          {log.staffName?.charAt(0)}
                       </div>
                       <div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{log.staffName}</p>
                          <p className="text-[9px] text-gray-400 font-bold tracking-widest">#{log.userId}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                       <p className="text-xs font-bold text-gray-700">{log.productionOrder.product.name}</p>
                       <div className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black tracking-tighter uppercase">
                          {log.productionOrder.sku}
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                      {log.quantityProduced}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="flex justify-center gap-3">
                       <div className="text-[10px] font-black text-rose-500">
                          <span className="block text-[8px] uppercase tracking-widest text-gray-300">Thợ</span>
                          {log.technicalErrorCount}
                       </div>
                       <div className="text-[10px] font-black text-gray-400">
                          <span className="block text-[8px] uppercase tracking-widest text-gray-300">Giấy</span>
                          {log.materialErrorCount}
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">
                       <CheckCircle2 size={12} fill="currentColor" className="text-white" />
                       Hoàn tất
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOADING & EMPTY */}
        {isLoading && (
          <div className="flex justify-center py-12 bg-gray-50/30">
            <Loader2 className="animate-spin text-indigo-600" size={24} />
          </div>
        )}

        {!isLoading && filteredLogs.length === 0 && (
          <div className="py-24 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <FileText size={32} />
             </div>
             <h3 className="text-sm font-black text-gray-800 uppercase italic">Không có dữ liệu</h3>
             <p className="text-[11px] text-gray-400 font-medium">Chưa có nhật ký sản xuất cho các tiêu chí đã chọn.</p>
          </div>
        )}
      </div>
    </div>
  );
}
