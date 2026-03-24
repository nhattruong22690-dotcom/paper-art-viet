"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Users, 
  Download,
  Filter,
  ArrowRight,
  X
} from 'lucide-react';
import PerformanceTable from '@/components/production/PerformanceTable';
import PerformanceChart from '@/components/production/PerformanceChart';

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
      { label: 'Hiệu suất TB', value: '0%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Sản lượng tổng', value: '0', icon: BarChart3, color: 'text-primary-600', bg: 'bg-primary-50' },
      { label: 'Tổng nhân sự', value: '0', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const avgKPI = employees.reduce((acc, emp) => acc + emp.kpi, 0) / employees.length;
    const totalQty = employees.reduce((acc, emp) => acc + emp.totalQty, 0);

    return [
      { label: 'Hiệu suất TB', value: `${avgKPI.toFixed(1)}%`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { label: 'Sản lượng tổng', value: totalQty.toLocaleString(), icon: BarChart3, color: 'text-primary-600', bg: 'bg-primary-50' },
      { label: 'Tổng nhân sự', value: employees.length.toString(), icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];
  }, [employees]);

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 animate-in fade-in duration-1000">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Báo cáo Hiệu suất</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest italic">Năng suất & Chất lượng nhân sự thực tế</p>
        </div>
        <div className="flex gap-4">
           <button className="px-8 py-4 bg-white border border-gray-100 rounded-2xl font-black text-[11px] uppercase tracking-widest text-gray-500 hover:text-gray-900 shadow-sm transition-all flex items-center gap-3">
             <Filter size={18} /> Lọc theo tổ/đội
           </button>
           <button className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all flex items-center gap-3">
             Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()} <ArrowRight size={18} />
           </button>
        </div>
      </header>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-md flex items-center gap-6 hover:shadow-xl transition-all group">
             <div className={`${stat.bg} ${stat.color} p-5 rounded-[24px] shadow-sm group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} strokeWidth={3} />
             </div>
             <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* PERFORMANCE TABLE */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
               Bảng xếp hạng năng suất
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider italic">Dữ liệu cập nhật: Thời gian thực</p>
         </div>
         <PerformanceTable initialData={employees} loading={loading} onSelect={setSelectedEmployee} />
      </div>

      {/* DETAIL MODAL WITH CHART */}
      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 transition-all duration-500 animate-in fade-in">
           <div 
             className="absolute inset-0 bg-gray-900/40 backdrop-blur-md"
             onClick={() => setSelectedEmployee(null)}
           />
           <div className="relative bg-white w-full max-w-xl rounded-[48px] shadow-2xl border border-gray-100 flex flex-col animate-in zoom-in-95 duration-500 p-10 overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                 <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">Chi tiết hiệu suất</h2>
                 <button 
                   onClick={() => setSelectedEmployee(null)}
                   className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all"
                 >
                   <X size={24} strokeWidth={3} />
                 </button>
              </div>
              
              <PerformanceChart employee={selectedEmployee} />
              
              <div className="mt-12 flex gap-4">
                 <button className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all">
                   Xem nhật ký chi tiết
                 </button>
                 <button 
                  onClick={() => setSelectedEmployee(null)}
                  className="px-10 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:text-gray-900 transition-all"
                 >
                   Đóng
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

