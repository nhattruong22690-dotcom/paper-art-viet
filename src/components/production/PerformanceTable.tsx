"use client";

import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  ChevronRight,
  Search,
  Download,
  Target,
  ClipboardList,
  Loader2,
  User
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EmployeePerformance {
  id: string;
  name: string;
  group: string;
  avatar?: string;
  totalQty: number;
  kpi: number; // 0-100%
  techErrors: number;
  matErrors: number;
  errorNote?: string;
  trend: number[];
}

export default function PerformanceTable({ 
  onSelect, 
  initialData = [], 
  loading = false 
}: { 
  onSelect: (emp: EmployeePerformance) => void,
  initialData?: EmployeePerformance[],
  loading?: boolean
}) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof EmployeePerformance, direction: 'asc' | 'desc' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const sortedEmployees = useMemo(() => {
    let items = [...initialData];
    if (searchQuery) {
      items = items.filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.id.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (sortConfig !== null) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    return items;
  }, [initialData, sortConfig, searchQuery]);


  const requestSort = (key: keyof EmployeePerformance) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getKPIBadge = (kpi: number) => {
    if (kpi >= 90) return <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-emerald-100"><CheckCircle2 size={12} /> Xuất sắc</span>;
    if (kpi >= 70) return <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-blue-100"><TrendingUp size={12} /> Đạt yêu cầu</span>;
    return <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border border-rose-100"><AlertTriangle size={12} /> Cần cải thiện</span>;
  };

  const getKPIColor = (kpi: number) => {
    if (kpi >= 90) return "bg-emerald-500";
    if (kpi >= 70) return "bg-blue-500";
    return "bg-rose-500";
  };

  return (
    <div className="card overflow-hidden flex flex-col animate-in fade-in duration-500">
      {/* TOOLBAR */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-50/50">
         <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm"
            />
         </div>
         <button className="w-full md:w-auto px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-sm">
           <Download size={16} /> Xuất báo cáo
         </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <th className="px-6 py-4">
                <button onClick={() => requestSort('name')} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  Đối tượng Nhân sự <ArrowUpDown size={14} className="text-slate-300" />
                </button>
              </th>
              <th className="px-6 py-4">
                <button onClick={() => requestSort('totalQty')} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  Tổng sản lượng <ArrowUpDown size={14} className="text-slate-300" />
                </button>
              </th>
              <th className="px-6 py-4">
                <button onClick={() => requestSort('kpi')} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  KPI Hiệu năng <ArrowUpDown size={14} className="text-slate-300" />
                </button>
              </th>
              <th className="px-6 py-4">
                <button onClick={() => requestSort('techErrors')} className="flex items-center gap-2 hover:text-rose-600 transition-colors text-slate-400">
                  Lỗi thợ <ArrowUpDown size={14} className="text-slate-300" />
                </button>
              </th>
              <th className="px-6 py-4">
                <button onClick={() => requestSort('matErrors')} className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                  Lỗi vật tư <ArrowUpDown size={14} className="text-slate-300" />
                </button>
              </th>
              <th className="px-6 py-4 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedEmployees.map((emp) => (
              <tr 
                key={emp.id} 
                className="hover:bg-slate-50/80 transition-all group cursor-pointer"
                onClick={() => onSelect(emp)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border shadow-sm transition-transform group-hover:scale-110",
                      emp.kpi >= 90 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                      emp.kpi >= 70 ? "bg-blue-50 text-blue-600 border-blue-100" :
                      "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {emp.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                        <Target size={10} className="text-blue-500/50" />
                        {emp.group}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-bold text-slate-700 tabular-nums">{emp.totalQty.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-bold ml-1.5 uppercase">PCS</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <div className="flex items-center justify-between">
                       {getKPIBadge(emp.kpi)}
                       <span className={cn("text-xs font-bold tabular-nums", emp.kpi >= 90 ? "text-emerald-600" : emp.kpi >= 70 ? "text-blue-600" : "text-rose-600")}>
                         {emp.kpi}%
                       </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                       <div 
                        className={cn("h-full transition-all duration-1000 rounded-full", getKPIColor(emp.kpi))} 
                        style={{ width: `${emp.kpi}%` }} 
                       />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-bold tabular-nums",
                      (emp.techErrors / emp.totalQty * 100) > 2 ? "text-rose-600" : (emp.techErrors / emp.totalQty * 100) > 1 ? "text-amber-600" : "text-slate-600"
                    )}>
                      {emp.techErrors}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                      ({(emp.techErrors / emp.totalQty * 100).toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-400 tabular-nums lowercase">
                      {emp.matErrors}
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold uppercase tracking-tight mt-0.5">
                      ({(emp.matErrors / emp.totalQty * 100).toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="p-1.5 text-slate-300 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-lg transition-all">
                    <ChevronRight size={18} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4 text-slate-400">
           <Loader2 size={32} className="animate-spin text-blue-500" />
           <p className="text-xs font-bold uppercase tracking-widest animate-pulse">Đang nạp dữ liệu hiệu năng...</p>
        </div>
      ) : sortedEmployees.length === 0 && (
        <div className="py-32 flex flex-col items-center justify-center gap-4 text-slate-300 opacity-50">
           <User size={64} strokeWidth={1} />
           <p className="text-xs font-bold uppercase tracking-widest">Không có dữ liệu hiển thị</p>
        </div>
      )}

      {/* FOOTER */}
      <div className="bg-slate-50 p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
         <div className="flex items-center gap-3">
            <ClipboardList size={14} className="text-blue-500/50" />
            <span>Kết quả: {sortedEmployees.length} Nhân sự</span>
         </div>
         <p>Paper Art Việt ERP • Performance Tracking Dashboard</p>
      </div>
    </div>
  );
}
