"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  PackageCheck, 
  AlertCircle,
  Loader2,
  Activity,
  Truck,
  FileText,
  ChevronRight,
  TrendingDown,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-slate-400 animate-in fade-in">
      <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Đang đồng bộ dữ liệu...</p>
    </div>
  );

  const stats = [
    { label: 'Đơn hàng mới', value: data?.stats?.newOrders || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', trend: '+12%' },
    { label: 'Doanh thu hôm nay', value: `${(data?.stats?.grossProfit || 0).toLocaleString()}đ`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: '+5.4%' },
    { label: 'Hoàn thành SX', value: data?.stats?.completedTasks || 0, icon: PackageCheck, color: 'text-amber-500', bg: 'bg-amber-50', trend: '-2.1%' },
    { label: 'Cảnh báo vận hành', value: data?.stats?.overdueAlerts || 0, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', trend: 'Ổn định' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
             <Activity size={12} />
             <span>Hệ thống điều hành</span>
             <ChevronRight size={10} />
             <span className="text-primary">Dashboard</span>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
            Tổng quan <span className="text-primary italic">Vận hành</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
             Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="badge-success gap-2 py-2 px-4 shadow-sm shadow-emerald-500/10">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              Real-time Active
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card !p-6 flex flex-col gap-5 border border-slate-50 relative group">
            <div className="flex justify-between items-start">
               <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                 <stat.icon size={22} strokeWidth={2.5} />
               </div>
               <span className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded-lg",
                  stat.trend.startsWith('+') ? 'text-emerald-600 bg-emerald-50' : 
                  stat.trend.startsWith('-') ? 'text-rose-600 bg-rose-50' : 'text-slate-400 bg-slate-50'
               )}>
                  {stat.trend}
               </span>
            </div>
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">{stat.label}</p>
               <p className="text-2xl font-black text-slate-900 tabular-nums tracking-tighter">{stat.value}</p>
            </div>
            <ArrowUpRight className="absolute bottom-4 right-4 text-slate-200 group-hover:text-primary transition-colors" size={20} />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Production Monitor */}
        <div className="lg:col-span-8 card !p-0 overflow-hidden shadow-soft border border-slate-50">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                  <Activity size={18} strokeWidth={2.5} />
               </div>
               <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Giám sát Sản xuất</h3>
            </div>
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-1.5 text-[9px] font-black text-primary bg-blue-50 px-3 py-1.5 rounded-full tracking-widest">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                  LIVE FEED
               </span>
            </div>
          </div>
          <div className="p-8 space-y-8">
            {(data?.progress || []).map((item: any, i: number) => (
              <div key={i} className="group cursor-default">
                <div className="flex justify-between items-end mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Batch #{item.sku}</span>
                    <span className="font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors">{item.title}</span>
                  </div>
                  <div className="text-right">
                     <span className="text-lg font-black text-slate-900 tracking-tighter">{item.progress}%</span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.3)]" 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-3">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      Trạng thái: <span className="text-primary">{item.status}</span>
                   </span>
                   <span className="text-[10px] font-medium text-slate-300">Vừa cập nhật xong</span>
                </div>
              </div>
            ))}
            {(!data?.progress || data.progress.length === 0) && (
              <div className="py-20 text-center text-slate-300">
                <FileText size={48} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Không có lệnh sản xuất đang chạy</p>
              </div>
            )}
          </div>
        </div>

        {/* Logistics Manifest */}
        <div className="lg:col-span-4 card !p-0 overflow-hidden shadow-soft border border-slate-50">
          <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Truck size={18} strokeWidth={2.5} />
               </div>
               <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest">Lịch Xuất kho</h3>
            </div>
          </div>
          <div className="p-4 overflow-y-auto max-h-[500px] scrollbar-hide">
            {(data?.deliveries || []).map((order: any, i: number) => (
              <div key={i} className="m-2 p-5 bg-white border border-slate-50 rounded-2xl hover:border-primary/20 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-full bg-primary/10 group-hover:bg-primary transition-colors" />
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{order.id}</span>
                  <span className="text-[9px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">{order.date}</span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors tracking-tight line-clamp-1">{order.customer}</h4>
                <div className="flex items-center gap-2 mt-3">
                   <PackageCheck size={14} className="text-slate-300" />
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{order.items} SKU thành phẩm</span>
                </div>
              </div>
            ))}
            {(!data?.deliveries || data.deliveries.length === 0) && (
              <div className="py-24 text-center text-slate-200">
                <Truck size={48} strokeWidth={1} className="mx-auto mb-4 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest opacity-50">Kho vận trống</p>
              </div>
            )}
          </div>
          <div className="p-6 bg-slate-50/50 border-t border-slate-50">
            <Link 
              href="/logistics/inventory" 
              className="group flex items-center justify-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-blue-600 transition-colors"
            >
              Xem tất cả vận đơn
              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center py-6 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] opacity-50">
         <div className="flex items-center gap-2">
            PAPER ART VIỆT CLOUD ENGINE
         </div>
         <div>
            V2.4.0 • SECURE NODE
         </div>
      </div>
    </div>
  );
}
