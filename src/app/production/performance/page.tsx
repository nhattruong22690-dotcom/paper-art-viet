"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  Download,
  Filter,
  ArrowRight,
  X,
  Target,
  ChevronRight,
  ClipboardList,
  Calendar,
  Activity,
  Info
} from 'lucide-react';
import PerformanceTable from '@/components/production/PerformanceTable';
import PerformanceChart from '@/components/production/PerformanceChart';
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
  kpi: number;
  techErrors: number;
  matErrors: number;
  errorNote?: string;
  trend: number[];
}

export default function PerformancePage() {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformance | null>(null);
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/production/performance')
      .then(res => res.json())
      .then(data => {
        setEmployees(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load performance data:', err);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    if (employees.length === 0) return [
      { label: 'Avg Efficiency', value: '0%', icon: TrendingUp, color: 'text-neo-purple' },
      { label: 'Gross Output', value: '0', icon: BarChart3, color: 'text-neo-blue' },
      { label: 'Active Hands', value: '0', icon: Users, color: 'text-black' },
    ];

    const avgKPI = employees.reduce((acc, emp) => acc + emp.kpi, 0) / employees.length;
    const totalQty = employees.reduce((acc, emp) => acc + emp.totalQty, 0);

    return [
      { label: 'Avg Efficiency', value: `${avgKPI.toFixed(1)}%`, icon: TrendingUp, color: 'text-neo-purple' },
      { label: 'Gross Output', value: totalQty.toLocaleString(), icon: BarChart3, color: 'text-neo-blue' },
      { label: 'Active Hands', value: employees.length.toString(), icon: Users, color: 'text-black' },
    ];
  }, [employees]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-32">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Activity size={28} className="text-black" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-black tracking-tight uppercase italic">Hiệu suất Sản xuất</h1>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">Real-time KPI Analytics & Personnel Benchmarking</p>
           </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
           <button className="btn-secondary h-12 px-6 text-[10px] uppercase tracking-widest gap-3 font-black">
              <Filter size={18} strokeWidth={3} />
              Lọc Tổ Đội
           </button>
           <button className="btn-primary h-12 px-8 text-[10px] uppercase tracking-[0.2em] gap-4 font-black">
              Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
              <ArrowRight size={18} strokeWidth={3} />
           </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {stats.map((stat, i) => (
          <div key={i} className="p-8 bg-white border-neo border-black rounded-xl shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-between group relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-5 rotate-12 transition-transform duration-700 group-hover:scale-110">
               <stat.icon size={180} strokeWidth={1} className="text-black" />
            </div>
            <div className="relative z-10 space-y-2">
              <p className="text-[11px] font-black text-black/40 uppercase tracking-[0.3em]">{stat.label}</p>
              <p className="text-4xl font-black text-black tracking-tighter tabular-nums italic uppercase">{stat.value}</p>
            </div>
            <div className={cn("relative z-10 p-5 rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-all", stat.color)}>
              <stat.icon size={32} strokeWidth={3} />
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="space-y-6">
         <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-4 italic">
              <TrendingUp size={20} strokeWidth={3} className="text-neo-purple" />
              Personnel Benchmarking Matrix
            </h2>
            <div className="h-0.5 flex-1 bg-black/5 mx-10 shrink-0 border-t-2 border-black border-dashed opacity-10" />
         </div>
         <div className="neo-card !p-0 overflow-hidden">
            <PerformanceTable initialData={employees} loading={loading} onSelect={setSelectedEmployee} />
         </div>
      </div>

      {/* Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedEmployee(null)} />
           <div className="relative bg-white border-neo border-black rounded-xl w-full max-w-6xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] max-h-[90vh]">
              <header className="p-10 border-b-2 border-black flex justify-between items-center bg-neo-purple/10">
                 <div>
                    <h2 className="text-3xl font-black text-black tracking-tight uppercase italic underline underline-offset-8 decoration-neo-purple">Personnel Insight Card</h2>
                    <p className="text-[10px] text-black font-black uppercase tracking-[0.3em] mt-5 flex items-center gap-3">
                      <span className="bg-black text-white px-3 py-1 rounded-lg italic">{selectedEmployee.name}</span>
                      <span className="text-black/40">•</span> 
                      <span className="italic">Organization: {selectedEmployee.group}</span>
                    </p>
                 </div>
                 <button 
                   onClick={() => setSelectedEmployee(null)}
                   className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center text-black hover:bg-neo-red transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                 >
                   <X size={28} strokeWidth={3} />
                 </button>
              </header>
              
              <div className="p-12 overflow-y-auto bg-white scrollbar-hide">
                 <PerformanceChart employee={selectedEmployee} />
              </div>
              
              <div className="p-10 bg-black/5 flex flex-col md:flex-row gap-8 border-t-2 border-black border-dashed mt-auto">
                 <div className="flex-1 flex items-center gap-4 text-black/40">
                    <Info size={24} strokeWidth={3} />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] italic max-w-sm leading-relaxed">
                      KPI trends are calculated based on a 30-day rolling average of total output vs specific error margins.
                    </p>
                 </div>
                 <div className="flex items-center gap-6">
                    <button className="btn-secondary !h-14 px-10 text-[10px] uppercase tracking-[0.2em] gap-3 font-black">
                       <Download size={20} strokeWidth={3} />
                       Export Detailed Audit
                    </button>
                    <button 
                      onClick={() => setSelectedEmployee(null)}
                      className="px-12 h-14 bg-black text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black/90 active:translate-y-[2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all italic"
                    >
                       Acknowledge & Close
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="pt-20 flex flex-col items-center gap-6 opacity-20 italic">
         <div className="h-0.5 w-32 bg-black/40 border-t-2 border-black border-dashed" />
         <p className="text-[10px] font-black text-black uppercase tracking-[0.4em] text-center leading-relaxed italic">
           PAV-INFRA • Metrics Engine v4.0 • Enterprise Resource Platform
         </p>
      </div>
    </div>
  );
}
