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
  Download,
  Target,
  ClipboardList
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
    if (kpi >= 90) return <span className="text-retro-moss bg-retro-moss/10 px-3 py-1 border border-retro-moss/20 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 italic"><CheckCircle2 size={12} strokeWidth={2.5} /> Thủ khoa</span>;
    if (kpi >= 70) return <span className="text-retro-mustard bg-retro-mustard/10 px-3 py-1 border border-retro-mustard/20 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 italic"><TrendingUp size={12} strokeWidth={2.5} /> Thụ phong</span>;
    return <span className="text-retro-brick bg-retro-brick/10 px-3 py-1 border border-retro-brick/20 font-black text-[9px] uppercase tracking-widest flex items-center gap-2 italic"><AlertTriangle size={12} strokeWidth={2.5} /> Cần tu bổ</span>;
  };

  const getKPIColor = (kpi: number) => {
    if (kpi >= 90) return "bg-retro-moss shadow-[0_0_8px_rgba(85,107,47,0.3)]";
    if (kpi >= 70) return "bg-retro-mustard shadow-[0_0_8px_rgba(218,165,32,0.3)]";
    return "bg-retro-brick shadow-[0_0_8px_rgba(178,34,34,0.3)]";
  };

  return (
    <div className="bg-white border-2 border-retro-sepia/10 shadow-[0_20px_50px_-12px_rgba(62,39,35,0.15)] overflow-hidden flex flex-col font-typewriter">
      {/* TOOLBAR */}
      <div className="p-8 pb-8 border-b-2 border-retro-sepia/10 flex flex-col md:flex-row justify-between items-center gap-8 bg-retro-paper/10">
         <div className="flex-1 w-full relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20 group-focus-within:text-retro-brick transition-all" size={20} strokeWidth={1.5} />
            <input 
              type="text" 
              placeholder="Tra cứu tôn danh nhân viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-retro-sepia/10 px-16 py-4 text-xs font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia transition-all shadow-inner placeholder:italic placeholder:font-normal placeholder:lowercase tracking-tight"
            />
         </div>
         <button className="w-full md:w-auto px-10 py-4 bg-retro-sepia text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-retro-brick transition-all active:scale-95 italic">
           <Download size={18} strokeWidth={2} /> Xuất Sổ cái Excel
         </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-retro-paper text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] border-b-2 border-retro-sepia/20 italic opacity-60">
              <th className="px-8 py-6">
                <button onClick={() => requestSort('name')} className="flex items-center gap-3 hover:text-retro-brick transition-colors">
                  Đối tượng Nhân sự <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-8 py-6">
                <button onClick={() => requestSort('totalQty')} className="flex items-center gap-3 hover:text-retro-brick transition-colors">
                  Sản lượng thụ lục <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-8 py-6">
                <button onClick={() => requestSort('kpi')} className="flex items-center gap-3 hover:text-retro-brick transition-colors">
                  KPI Hiệu năng <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-8 py-6">
                <button onClick={() => requestSort('techErrors')} className="flex items-center gap-3 hover:text-retro-brick transition-colors text-retro-brick">
                  Sơ suất Thủ từ 🛠️ <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-8 py-6">
                <button onClick={() => requestSort('matErrors')} className="flex items-center gap-3 hover:text-retro-brick transition-colors">
                  Hao hụt Vật bản 📄 <ArrowUpDown size={14} />
                </button>
              </th>
              <th className="px-8 py-6"></th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-retro-sepia/5 relative z-0">
            {sortedEmployees.map((emp) => (
              <tr 
                key={emp.id} 
                className="hover:bg-retro-paper/50 transition-all group cursor-pointer border-b border-retro-sepia/5"
                onClick={() => onSelect(emp)}
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 flex items-center justify-center font-black text-xs border-2 shadow-sm transition-all group-hover:rotate-6 group-hover:scale-110",
                      emp.kpi >= 90 ? "bg-retro-moss/10 text-retro-moss border-retro-moss/20" : 
                      emp.kpi >= 70 ? "bg-retro-mustard/10 text-retro-mustard border-retro-mustard/20" :
                      "bg-retro-brick/10 text-retro-brick border-retro-brick/20"
                    )}>
                      {emp.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-retro-sepia text-sm uppercase tracking-tighter italic group-hover:text-retro-brick transition-all underline decoration-retro-mustard/20 decoration-dashed underline-offset-4">{emp.name}</p>
                      <p className="text-[10px] text-retro-earth/40 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2 italic">
                        <Target size={12} strokeWidth={2} className="text-retro-mustard/40" />
                        {emp.group}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="font-black text-retro-sepia text-sm italic tabular-nums">{emp.totalQty.toLocaleString()}</span>
                  <span className="text-[9px] text-retro-earth/40 font-black uppercase ml-2 tracking-widest italic">PCS</span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-3 min-w-[160px]">
                    <div className="flex items-center justify-between">
                       {getKPIBadge(emp.kpi)}
                       <span className={cn("text-xs font-black italic tabular-nums", emp.kpi >= 90 ? "text-retro-moss" : emp.kpi >= 70 ? "text-retro-mustard" : "text-retro-brick")}>
                         {emp.kpi}%
                       </span>
                    </div>
                    <div className="h-1.5 bg-retro-paper border border-retro-sepia/5 shadow-inner">
                       <div 
                        className={cn("h-full transition-all duration-1000", getKPIColor(emp.kpi))} 
                        style={{ width: `${emp.kpi}%` }} 
                       />
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-black text-sm italic tabular-nums",
                      (emp.techErrors / emp.totalQty * 100) > 2 ? "text-retro-brick" : (emp.techErrors / emp.totalQty * 100) > 1 ? "text-retro-mustard" : "text-retro-sepia"
                    )}>
                      {emp.techErrors}
                    </span>
                    <span className="text-[9px] text-retro-earth/40 font-black uppercase tracking-tighter mt-1 italic">
                      ({(emp.techErrors / emp.totalQty * 100).toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="font-black text-sm text-retro-earth/40 italic tabular-nums">
                      {emp.matErrors}
                    </span>
                    <span className="text-[9px] text-retro-earth/20 font-black uppercase tracking-tighter mt-1 italic">
                      ({(emp.matErrors / emp.totalQty * 100).toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <button className="w-10 h-10 bg-white border-2 border-retro-sepia/5 text-retro-sepia/20 flex items-center justify-center transition-all group-hover:text-retro-brick group-hover:border-retro-brick/20 group-hover:rotate-12 group-hover:shadow-lg">
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {loading ? (
        <div className="py-40 text-center flex flex-col items-center justify-center italic">
           <div className="w-12 h-12 border-4 border-retro-sepia/20 border-t-retro-brick animate-spin mb-8" />
           <p className="text-[10px] font-black text-retro-earth/40 uppercase tracking-[0.4em] animate-pulse">Đang rà soát Sổ hiệu năng...</p>
        </div>
      ) : sortedEmployees.length === 0 && (
        <div className="py-40 text-center flex flex-col items-center justify-center italic opacity-20">
           <User size={64} strokeWidth={0.5} className="text-retro-earth mb-8 rotate-3" />
           <p className="text-[10px] font-black text-retro-earth uppercase tracking-[0.4em]">Niệm thư trống rỗng</p>
        </div>
      )}

      {/* FOOTER */}
      <div className="bg-retro-paper/20 p-8 border-t-2 border-retro-sepia/10 flex flex-col sm:flex-row justify-between items-center gap-6 text-[9px] font-black text-retro-earth/40 uppercase tracking-[0.2em] italic">
         <div className="flex items-center gap-4">
            <ClipboardList size={16} strokeWidth={2} />
            <span>Ký danh: {sortedEmployees.length} Nhân sự đương nhiệm</span>
         </div>
         <p>Paper Art Việt • Performance Tracking Ledger v2.5 • Retro Revolution</p>
      </div>
    </div>
  );
}
