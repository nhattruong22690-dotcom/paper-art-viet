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
  User as UserIcon,
  Activity,
  Award,
  User as LucideUser
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
    if (kpi >= 90) return <span className="text-black bg-neo-green/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic"><Award size={12} strokeWidth={3} className="text-black" /> EXCELLENT</span>;
    if (kpi >= 70) return <span className="text-black bg-neo-blue/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic"><TrendingUp size={12} strokeWidth={3} className="text-black" /> ON TARGET</span>;
    return <span className="text-black bg-neo-red/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic"><AlertTriangle size={12} strokeWidth={3} className="text-black" /> AT RISK</span>;
  };

  const getKPIColor = (kpi: number) => {
    if (kpi >= 90) return "bg-neo-green";
    if (kpi >= 70) return "bg-neo-blue";
    return "bg-neo-red";
  };

  return (
    <div className="bg-white flex flex-col animate-in fade-in duration-500">
      {/* TOOLBAR */}
      <div className="p-8 border-b-2 border-black flex flex-col md:flex-row justify-between items-center gap-8 bg-neo-purple/5">
         <div className="flex-1 w-full relative group/field">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Query personnel by name or identifier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-14 h-14 font-black italic"
            />
         </div>
         <button className="btn-secondary h-14 px-10 text-[10px] font-black uppercase tracking-[0.2em] gap-4">
           <Download size={20} strokeWidth={3} /> 
           Export Audit Log
         </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black text-[10px] font-black text-neo-purple uppercase tracking-widest">
              <th className="px-8 py-5 border-b-2 border-black">
                <button onClick={() => requestSort('name')} className="flex items-center gap-3 hover:text-white transition-opacity">
                   Personnel Principal <ArrowUpDown size={14} strokeWidth={3} />
                </button>
              </th>
              <th className="px-8 py-5 border-b-2 border-black">
                <button onClick={() => requestSort('totalQty')} className="flex items-center gap-3 hover:text-white transition-opacity">
                  Gross Output <ArrowUpDown size={14} strokeWidth={3} />
                </button>
              </th>
              <th className="px-8 py-5 border-b-2 border-black">
                <button onClick={() => requestSort('kpi')} className="flex items-center gap-3 hover:text-white transition-opacity">
                  KPI Efficiency <ArrowUpDown size={14} strokeWidth={3} />
                </button>
              </th>
              <th className="px-8 py-5 border-b-2 border-black">
                <button onClick={() => requestSort('techErrors')} className="flex items-center gap-3 text-neo-red hover:text-white transition-colors">
                  Technical Defect <ArrowUpDown size={14} strokeWidth={3} />
                </button>
              </th>
              <th className="px-8 py-5 border-b-2 border-black">
                <button onClick={() => requestSort('matErrors')} className="flex items-center gap-3 hover:text-white transition-opacity">
                  Material Loss <ArrowUpDown size={14} strokeWidth={3} />
                </button>
              </th>
              <th className="w-24 px-8 border-b-2 border-black"></th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black/5">
            {sortedEmployees.map((emp) => (
              <tr 
                key={emp.id} 
                className="hover:bg-neo-purple/5 transition-all group cursor-pointer"
                onClick={() => onSelect(emp)}
              >
                <td className="px-8 py-6">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs shrink-0 border-2 border-black transition-all group-hover:scale-110 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic bg-white",
                      emp.kpi >= 90 ? "text-neo-green" : 
                      emp.kpi >= 70 ? "text-neo-blue" :
                      "text-neo-red"
                    )}>
                      {emp.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-black group-hover:text-neo-purple transition-colors uppercase tracking-tight italic">{emp.name}</p>
                      <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] flex items-center gap-2 mt-1 italic">
                        <Target size={12} strokeWidth={3} className="text-black/20" />
                        ORG: {emp.group}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-black tabular-nums text-lg tracking-tighter italic">{emp.totalQty.toLocaleString()}</span>
                    <span className="text-[9px] text-black/20 font-black uppercase tracking-widest italic">Units</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <div className="flex items-center justify-between">
                       {getKPIBadge(emp.kpi)}
                       <span className="text-xs font-black tabular-nums tracking-tight italic">
                         {emp.kpi}%
                       </span>
                    </div>
                    <div className="h-4 bg-white border-2 border-black rounded-lg overflow-hidden p-0.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                       <div 
                        className={cn("h-full transition-all duration-1000 rounded-sm border border-black/10", getKPIColor(emp.kpi))} 
                        style={{ width: `${emp.kpi}%` }} 
                       />
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className={cn(
                      "font-black tabular-nums text-lg tracking-tighter italic",
                      (emp.techErrors / emp.totalQty * 100) > 2 ? "text-neo-red" : (emp.techErrors / emp.totalQty * 100) > 1 ? "text-black" : "text-black/40"
                    )}>
                      {emp.techErrors}
                    </span>
                    <span className="text-[9px] text-black/20 font-black uppercase tracking-widest mt-1">
                      REL: ({(emp.techErrors / emp.totalQty * 100).toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-col">
                    <span className="font-black text-black/20 tabular-nums text-lg tracking-tighter uppercase italic">
                      {emp.matErrors}
                    </span>
                    <span className="text-[9px] text-black/10 font-black uppercase tracking-widest mt-1">
                      REL: ({(emp.matErrors / emp.totalQty * 100).toFixed(1)}%)
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="w-10 h-10 bg-white border-2 border-black text-black/20 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white group-hover:rotate-45 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none">
                    <ChevronRight size={20} strokeWidth={3} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {loading ? (
        <div className="py-48 flex flex-col items-center justify-center gap-8">
           <Loader2 size={56} className="animate-spin text-black opacity-10" />
           <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.5em] animate-pulse italic">Aggregating Productivity telemetry...</p>
        </div>
      ) : sortedEmployees.length === 0 && (
        <div className="py-48 flex flex-col items-center justify-center gap-8 opacity-10">
           <LucideUser size={80} strokeWidth={1} />
           <p className="text-sm font-black uppercase tracking-[0.5em] italic">Telemetry Sink Empty</p>
        </div>
      )}

      {/* FOOTER */}
      <div className="p-10 border-t-2 border-black/10 flex flex-col sm:flex-row justify-between items-center gap-8 text-[10px] font-black text-black/20 uppercase tracking-[0.4em] mt-auto italic bg-black/5">
         <div className="flex items-center gap-4">
            <Award size={20} strokeWidth={3} className="text-black/40" />
            <span>Registry Size: {sortedEmployees.length} Principals</span>
         </div>
         <p className="flex items-center gap-3">
            <span className="w-2 h-2 bg-neo-green rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Registry Integrity Verified
         </p>
      </div>
    </div>
  );
}
