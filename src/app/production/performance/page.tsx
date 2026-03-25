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
  ClipboardList
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
      { label: 'Hiệu suất TB', value: '0%', icon: TrendingUp, color: 'text-retro-moss', bg: 'bg-retro-moss/10' },
      { label: 'Sản lượng tổng', value: '0', icon: BarChart3, color: 'text-retro-sepia', bg: 'bg-retro-sepia/10' },
      { label: 'Tổng nhân sự', value: '0', icon: Users, color: 'text-retro-brick', bg: 'bg-retro-brick/10' },
    ];

    const avgKPI = employees.reduce((acc, emp) => acc + emp.kpi, 0) / employees.length;
    const totalQty = employees.reduce((acc, emp) => acc + emp.totalQty, 0);

    return [
      { label: 'Hiệu suất TB', value: `${avgKPI.toFixed(1)}%`, icon: TrendingUp, color: 'text-retro-moss', bg: 'bg-retro-moss/10' },
      { label: 'Sản lượng tổng', value: totalQty.toLocaleString(), icon: BarChart3, color: 'text-retro-sepia', bg: 'bg-retro-sepia/10' },
      { label: 'Tổng nhân sự', value: employees.length.toString(), icon: Users, color: 'text-retro-brick', bg: 'bg-retro-brick/10' },
    ];
  }, [employees]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 px-6 md:px-12 animate-in fade-in duration-1000 font-typewriter">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 bg-retro-paper p-10 border-b-2 border-retro-sepia/10 relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(62,39,35,0.1)]">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Target size={240} strokeWidth={0.5} className="text-retro-sepia" />
        </div>
        
        <div className="relative z-10">
          <nav className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-6 opacity-60">
            <ClipboardList size={14} strokeWidth={1.5} />
            <span>Quản trị Nhân sự</span>
            <ChevronRight size={12} strokeWidth={1.5} />
            <span className="text-retro-sepia">Sổ Hiệu suất</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black text-retro-sepia uppercase tracking-tighter italic">
            Báo cáo <span className="text-retro-brick underline decoration-double decoration-retro-brick/30 underline-offset-8">Hiệu suất</span>
          </h1>
          <div className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] italic mt-4 opacity-60 flex items-center gap-2">
            <div className="w-2 h-2 bg-retro-mustard rotate-45" />
            Năng suất & Chất lượng nhân sự thực địa — 1984
          </div>
        </div>

        <div className="flex flex-wrap gap-4 relative z-10 w-full md:w-auto">
           <button className="flex-1 md:flex-none px-8 py-4 bg-white border-2 border-retro-sepia/10 text-[11px] font-black uppercase tracking-[0.2em] text-retro-earth hover:text-retro-sepia hover:border-retro-sepia transition-all shadow-sm italic flex items-center justify-center gap-3">
             <Filter size={18} strokeWidth={1.5} /> Lọc theo Tổ Đội
           </button>
           <button className="flex-1 md:flex-none px-10 py-4 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all active:scale-95 italic flex items-center justify-center gap-4">
             Tháng {new Date().getMonth() + 1}/2024 <ArrowRight size={18} strokeWidth={2.5} />
           </button>
        </div>
      </div>

      {/* QUICK STATS Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-10 border-2 border-retro-sepia/5 hover:border-retro-sepia/20 shadow-sm hover:shadow-2xl transition-all group flex items-center gap-8 relative overflow-hidden rotate-1 hover:rotate-0">
             <div className={cn(
               "w-16 h-16 flex items-center justify-center shadow-xl rotate-6 group-hover:rotate-0 transition-all",
               stat.bg, stat.color
             )}>
                <stat.icon size={28} strokeWidth={2.5} />
             </div>
             <div className="relative z-10">
                <p className="text-[10px] font-black text-retro-earth/40 uppercase tracking-[0.2em] mb-2 italic">{stat.label}</p>
                <p className="text-3xl font-black text-retro-sepia tabular-nums italic underline decoration-retro-mustard/20 decoration-dashed underline-offset-4">{stat.value}</p>
             </div>
             
             {/* Layout décor */}
             <div className="absolute -bottom-8 -right-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all">
                <stat.icon size={120} strokeWidth={1} />
             </div>
          </div>
        ))}
      </div>

      {/* PERFORMANCE TABLE SECTION */}
      <div className="space-y-8">
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
            <h2 className="text-[12px] font-black text-retro-sepia uppercase tracking-[0.3em] flex items-center gap-4 italic opacity-80 underline decoration-retro-brick/20 decoration-double underline-offset-8">
              <div className="w-3 h-3 bg-retro-brick rotate-45 shadow-sm" />
              Bảng xếp hạng Năng suất Diễn võ
            </h2>
            <p className="text-[9px] font-black text-retro-earth/30 uppercase tracking-[0.2em] italic">Thời khắc truy báo: THỜI GIAN THỰC</p>
         </div>
         <div className="retro-card !p-0 border-2 overflow-hidden shadow-2xl">
            <PerformanceTable initialData={employees} loading={loading} onSelect={setSelectedEmployee} />
         </div>
      </div>

      {/* DETAIL MODAL WITH CHART */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 md:p-16 animate-in fade-in duration-500 overflow-hidden font-typewriter">
           <div 
             className="absolute inset-0 bg-retro-sepia/40 backdrop-blur-md"
             onClick={() => setSelectedEmployee(null)}
           />
           <div className="relative bg-retro-paper w-full max-w-2xl retro-card !p-0 shadow-[0_30px_60px_-15px_rgba(62,39,35,0.5)] flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden border-2">
              <div className="washi-tape-top" />
              
              <div className="p-10 md:p-14 flex justify-between items-start bg-retro-paper/40 border-b-2 border-retro-sepia/10 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                    <TrendingUp size={240} strokeWidth={0.5} className="text-retro-sepia" />
                 </div>
                 
                 <div className="relative z-10">
                    <h2 className="text-2xl font-black text-retro-sepia uppercase tracking-tighter italic">Chi lục <span className="text-retro-brick underline decoration-double decoration-retro-brick/30 underline-offset-4">Hiệu năng</span></h2>
                    <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] mt-3 italic opacity-60">Hồ sơ cá nhân & Thụy đồ biến thiên</p>
                 </div>
                 <button 
                   onClick={() => setSelectedEmployee(null)}
                   className="p-4 bg-retro-paper border-2 border-retro-sepia/10 hover:bg-retro-brick/10 hover:text-retro-brick transition-all rotate-3 hover:rotate-0 shadow-sm relative z-10"
                 >
                   <X size={24} strokeWidth={2} />
                 </button>
              </div>
              
              <div className="p-10 md:p-14 bg-white max-h-[70vh] overflow-y-auto scrollbar-hide">
                 <PerformanceChart employee={selectedEmployee} />
              </div>
              
              <div className="p-10 md:p-14 pt-0 bg-white flex flex-col sm:flex-row gap-6 relative z-10">
                 <button className="flex-1 py-5 bg-retro-sepia text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-brick transition-all active:scale-95 italic">
                   Truy xuất Nhật ký Chi tiết
                 </button>
                 <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="px-12 py-5 bg-retro-paper border-2 border-retro-sepia/10 text-retro-earth text-[11px] font-black uppercase tracking-[0.2em] hover:text-retro-sepia hover:border-retro-sepia transition-all italic"
                 >
                   Hoàn nguyên
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
