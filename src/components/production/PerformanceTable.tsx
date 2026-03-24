"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowUpDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2,
  ChevronRight,
  User,
  Search,
  Download
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
  techErrors: number; // Lỗi do thợ (🛠️)
  matErrors: number; // Lỗi do vật tư (📄)
  errorNote?: string;
  trend: number[]; // Last 7 days productivity
}

export default function PerformanceTable({ onSelect }: { onSelect: (emp: EmployeePerformance) => void }) {
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof EmployeePerformance, direction: 'asc' | 'desc' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/api/production/performance')
      .then(res => res.json())
      .then(data => {
        setEmployees(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load performance:', err);
        setLoading(false);
      });
  }, []);

  const sortedEmployees = useMemo(() => {
    let items = [...employees];
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
  }, [employees, sortConfig, searchQuery]);

  const requestSort = (key: keyof EmployeePerformance) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getKPIBadge = (kpi: number) => {
    if (kpi >= 90) return <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg font-black text-[10px] uppercase border border-emerald-100 shadow-sm flex items-center gap-1"><CheckCircle2 size={12} /> Xuất sắc</span>;
    if (kpi >= 70) return <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded-lg font-black text-[10px] uppercase border border-amber-100 shadow-sm flex items-center gap-1"><TrendingUp size={12} /> Đạt yêu cầu</span>;
    return <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-lg font-black text-[10px] uppercase border border-rose-100 shadow-sm flex items-center gap-1"><AlertTriangle size={12} /> Cần hỗ trợ</span>;
  };

  const getKPIColor = (kpi: number) => {
    if (kpi >= 90) return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
    if (kpi >= 70) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]";
    return "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]";
  };

  return (
    <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col">
      {/* TOOLBAR */}
      <div className="p-8 pb-4 border-b border-gray-50 flex justify-between items-center gap-6">
         <div className="flex-1 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Tìm kiếm nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50/50 border border-transparent rounded-2xl py-4 pl-16 pr-8 text-sm outline-none focus:bg-white focus:border-primary-100 transition-all font-medium"
            />
         </div>
         <button className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-primary-100 hover:bg-primary-500 transition-all active:scale-95">
           <Download size={18} /> Export Excel
         </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="p-6 text-left">
                <button onClick={() => requestSort('name')} className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                  Nhân viên <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-6 text-left">
                <button onClick={() => requestSort('totalQty')} className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                  Sản lượng <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-6 text-left">
                <button onClick={() => requestSort('kpi')} className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                  KPI Hiệu suất <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-6 text-left">
                <button onClick={() => requestSort('techErrors')} className="flex items-center gap-2 text-[10px] font-black text-rose-400 uppercase tracking-widest hover:text-rose-600 transition-colors">
                  Lỗi Thợ 🛠️ <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-6 text-left">
                <button onClick={() => requestSort('matErrors')} className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                  Lỗi Giấy 📄 <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="p-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedEmployees.map((emp) => (
              <tr 
                key={emp.id} 
                className="hover:bg-primary-50/10 transition-all group cursor-pointer"
                onClick={() => onSelect(emp)}
              >
                <td className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border-2 shadow-sm transition-transform group-hover:scale-110",
                      emp.kpi >= 90 ? "bg-emerald-50 text-emerald-600 border-emerald-100" : 
                      emp.kpi >= 70 ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {emp.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{emp.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{emp.group}</p>
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <span className="font-black text-gray-900">{emp.totalQty.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase ml-2 tracking-tighter">PCS</span>
                </td>
                <td className="p-6">
                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <div className="flex items-center justify-between">
                       {getKPIBadge(emp.kpi)}
                       <span className={cn("text-xs font-black italic", emp.kpi >= 90 ? "text-emerald-600" : emp.kpi >= 70 ? "text-amber-600" : "text-rose-600")}>
                         {emp.kpi}%
                       </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                       <div 
                        className={cn("h-full transition-all duration-1000", getKPIColor(emp.kpi))} 
                        style={{ width: `${emp.kpi}%` }} 
                       />
                    </div>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-black text-sm",
                      (emp.techErrors / emp.totalQty * 100) > 2 ? "text-rose-500" : (emp.techErrors / emp.totalQty * 100) > 1 ? "text-amber-500" : "text-gray-900"
                    )}>
                      {emp.techErrors}
                    </span>
                    <span className="text-[9px] text-rose-400 font-bold uppercase tracking-tighter">
                      ({(emp.techErrors / emp.totalQty * 100).toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-gray-400">
                      {emp.matErrors}
                    </span>
                    <span className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">
                      ({(emp.matErrors / emp.totalQty * 100).toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button className="p-2 text-gray-300 group-hover:text-primary-600 transition-all group-hover:translate-x-1">
                    <ChevronRight size={20} strokeWidth={3} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedEmployees.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center justify-center grayscale opacity-30">
           <User size={48} className="text-gray-300 mb-4" />
           <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Không tìm thấy nhân viên nào</p>
        </div>
      )}

      {/* FOOTER */}
      <div className="bg-gray-50/50 p-6 border-t border-gray-100 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
         <p>Đang hiển thị {sortedEmployees.length} nhân sự</p>
         <p className="italic">Paper Art Việt - Performance Monitoring System v1.0</p>
      </div>
    </div>
  );
}
