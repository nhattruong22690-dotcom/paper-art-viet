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
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      {/* Header Section */}
      <div className="card !flex-col md:!flex-row justify-between items-start md:items-center gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <ClipboardList size={12} />
            <span>Sản xuất</span>
            <ChevronRight size={10} />
            <span className="text-primary">Báo cáo hiệu suất</span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Hiệu suất & Tổ đội
          </h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button className="btn-secondary gap-2 w-full md:w-auto justify-center">
             <Filter size={18} />
             Lọc Tổ Đội
           </button>
           <button className="btn-primary gap-2 w-full md:w-auto justify-center whitespace-nowrap">
             Tháng {new Date().getMonth() + 1}/2024
             <ArrowRight size={18} />
           </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card !p-6 flex items-center justify-between group hover:border-primary/30 transition-all">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-3xl font-black text-foreground">{stat.value}</p>
            </div>
            <div className={cn("p-4 rounded-xl bg-gray-50 transition-colors group-hover:bg-primary/5", stat.color)}>
              <stat.icon size={24} />
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="space-y-4">
         <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              Bảng xếp hạng Năng suất
            </h2>
         </div>
         <div className="card !p-0 overflow-hidden shadow-sm">
            <PerformanceTable initialData={employees} loading={loading} onSelect={setSelectedEmployee} />
         </div>
      </div>

      {/* Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 backdrop-blur-sm bg-black/40">
           <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-border">
              <div className="p-6 md:p-8 flex justify-between items-center bg-gray-50 border-b border-border">
                 <div>
                    <h2 className="text-xl font-bold text-foreground">Chi tiết Hiệu năng</h2>
                    <p className="text-xs text-muted-foreground font-medium mt-1">Hồ sơ cá nhân & Biến thiên sản lượng</p>
                 </div>
                 <button 
                   onClick={() => setSelectedEmployee(null)}
                   className="p-2 hover:bg-gray-200 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                 >
                   <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh] bg-white">
                 <PerformanceChart employee={selectedEmployee} />
              </div>
              
              <div className="p-6 md:p-8 pt-0 bg-white flex flex-col sm:flex-row gap-4 border-t border-border mt-auto">
                 <button className="btn-primary flex-1 py-3 justify-center">
                   Xuất báo cáo chi tiết
                 </button>
                 <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="btn-secondary px-8 py-3 justify-center"
                 >
                   Đóng cửa sổ
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
