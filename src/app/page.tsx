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
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Invalid response format: expected JSON");
        }
        return res.json();
      })
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
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-muted-foreground animate-in fade-in">
      <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">Đang đồng bộ dữ liệu...</p>
    </div>
  );

  const stats = [
    { label: 'Đơn hàng mới', value: data?.stats?.newOrders || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50', trend: '+12%' },
    { label: 'Doanh thu hôm nay', value: `${(data?.stats?.grossProfit || 0).toLocaleString()}đ`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', trend: '+5.4%' },
    { label: 'Hoàn thành SX', value: data?.stats?.completedTasks || 0, icon: PackageCheck, color: 'text-amber-500', bg: 'bg-amber-50', trend: '-2.1%' },
    { label: 'Cảnh báo vận hành', value: data?.stats?.overdueAlerts || 0, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', trend: 'Ổn định' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-neo-yellow/30 p-8 rounded-xl border-neo border-black shadow-neo">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-[0.2em] mb-3">
             <Activity size={14} strokeWidth={3} />
             <span>Hệ thống điều hành</span>
             <ChevronRight size={12} strokeWidth={3} />
             <span className="text-purple-600 bg-neo-purple/20 px-2 py-0.5 rounded-lg border border-black/10">Dashboard</span>
          </nav>
          <h1 className="text-4xl font-bold text-foreground tracking-tight uppercase font-space">
            Tổng quan <span className="text-purple-500 bg-white border-neo border-black px-3 py-1 -rotate-2 inline-block shadow-neo-active">Vận hành</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-4 font-bold uppercase tracking-wider">
             Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="badge-success gap-2 py-3 px-6 shadow-neo-active hover:shadow-neo transition-all cursor-pointer">
              <span className="w-3 h-3 bg-black rounded-full animate-pulse" />
              <span className="font-black text-[11px] uppercase tracking-widest">Real-time Active</span>
           </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
        
        {/* Stats Cards - Now integrated into the Bento Grid */}
        {stats.map((stat, i) => (
          <div key={i} className="lg:col-span-3 neo-card !p-6 flex flex-col justify-between group relative overflow-hidden">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${stat.bg}`} />
            <div className="flex justify-between items-start relative z-10">
               <div className={`w-14 h-14 rounded-xl border-neo border-black flex items-center justify-center ${stat.bg} ${stat.color} shadow-neo-active group-hover:translate-x-[2px] group-hover:translate-y-[2px] group-hover:shadow-none transition-all`}>
                 <stat.icon size={28} strokeWidth={2.5} />
               </div>
               <span className={cn(
                  "text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-black shadow-neo-active",
                  stat.trend.startsWith('+') ? 'bg-neo-mint text-black' : 
                  stat.trend.startsWith('-') ? 'bg-neo-red text-black' : 'bg-white text-black'
               )}>
                  {stat.trend}
               </span>
            </div>
            <div className="mt-6 relative z-10">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">{stat.label}</p>
               <p className="text-3xl font-bold text-foreground tabular-nums tracking-tighter font-space">{stat.value}</p>
            </div>
          </div>
        ))}

        {/* Production Monitor - Large Bento Box */}
        <div className="lg:col-span-8 lg:row-span-2 neo-card !p-0 overflow-hidden">
          <div className="px-8 py-6 border-b-neo border-black flex justify-between items-center bg-neo-purple/10">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white border-neo border-black text-black flex items-center justify-center shadow-neo-active">
                  <Activity size={20} strokeWidth={3} />
               </div>
               <h3 className="font-bold text-foreground uppercase text-sm tracking-widest font-space">Giám sát Sản xuất</h3>
            </div>
            <div className="flex items-center gap-4">
               <span className="flex items-center gap-2 text-[10px] font-black text-black bg-neo-mint px-4 py-2 rounded-lg border-2 border-black shadow-neo-active tracking-widest">
                  <span className="w-2 h-2 bg-black rounded-full animate-ping" />
                  LIVE FEED
               </span>
            </div>
          </div>
          <div className="p-8 space-y-10">
            {(data?.progress || []).map((item: any, i: number) => (
              <div key={i} className="group">
                <div className="flex justify-between items-end mb-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Batch #{item.sku}</span>
                    <span className="text-xl font-bold text-foreground tracking-tight group-hover:text-purple-600 transition-colors font-space uppercase">{item.title}</span>
                  </div>
                  <div className="text-right">
                     <span className="text-3xl font-bold text-foreground tabular-nums tracking-tighter font-space">{item.progress}%</span>
                  </div>
                </div>
                <div className="h-6 bg-white border-neo border-black rounded-lg overflow-hidden p-1 shadow-neo-active">
                  <div 
                    className="h-full bg-primary border-r-2 border-black transition-all duration-1000" 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-4">
                   <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-black uppercase tracking-widest border-2 border-black bg-neo-yellow px-3 py-1 rounded-lg">
                        {item.status}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Vừa cập nhật xong</span>
                   </div>
                </div>
              </div>
            ))}
            {(!data?.progress || data.progress.length === 0) && (
              <div className="py-24 text-center">
                <div className="w-20 h-20 bg-white border-neo border-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-neo rotate-3">
                  <FileText size={40} strokeWidth={2} className="text-black/20" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-black/30">Không có lệnh sản xuất đang chạy</p>
              </div>
            )}
          </div>
        </div>

        {/* Logistics Manifest - Vertical Bento Box */}
        <div className="lg:col-span-4 lg:row-span-2 neo-card !p-0 overflow-hidden flex flex-col">
          <div className="px-8 py-6 border-b-neo border-black flex justify-between items-center bg-neo-mint/20">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 rounded-xl bg-white border-neo border-black text-black flex items-center justify-center shadow-neo-active">
                  <Truck size={20} strokeWidth={3} />
               </div>
               <h3 className="font-bold text-foreground uppercase text-sm tracking-widest font-space">Lịch Xuất kho</h3>
            </div>
          </div>
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {(data?.deliveries || []).map((order: any, i: number) => (
              <div key={i} className="p-6 bg-white border-neo border-black rounded-xl hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-active bg-card shadow-neo transition-all group cursor-pointer relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">#{order.id}</span>
                  <span className="text-[10px] font-black px-2 py-1 bg-neo-mint border-2 border-black rounded-lg">{order.date}</span>
                </div>
                <h4 className="font-bold text-foreground text-base group-hover:text-purple-600 transition-colors tracking-tight line-clamp-1 uppercase font-space">{order.customer}</h4>
                <div className="flex items-center gap-2 mt-4">
                   <PackageCheck size={16} strokeWidth={2.5} className="text-black/40" />
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{order.items} SKU thành phẩm</span>
                </div>
              </div>
            ))}
            {(!data?.deliveries || data.deliveries.length === 0) && (
              <div className="py-28 text-center">
                <div className="w-20 h-20 bg-white border-neo border-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-neo -rotate-3">
                  <Truck size={40} strokeWidth={2} className="text-black/20" />
                </div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-black/30">Kho vận trống</p>
              </div>
            )}
          </div>
          <div className="p-8 bg-neo-purple/5 border-t-neo border-black">
            <Link 
              href="/logistics/inventory" 
              className="w-full neo-card !p-4 group flex items-center justify-center gap-3 text-[11px] font-black text-black uppercase tracking-[0.2em] bg-white hover:bg-neo-purple transition-all"
            >
              Xem tất cả vận đơn
              <ChevronRight size={16} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Small Utility Bento Boxes */}
        <div className="lg:col-span-6 neo-card !bg-neo-yellow/20 flex items-center justify-between group">
           <div>
              <h4 className="text-xl font-bold font-space uppercase mb-1">Cảnh báo hệ thống</h4>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Kiểm tra các lỗi thợ định kỳ</p>
           </div>
           <div className="w-16 h-16 bg-white border-neo border-black rounded-2xl flex items-center justify-center shadow-neo group-hover:rotate-12 transition-transform">
              <AlertCircle size={32} strokeWidth={2.5} className="text-neo-red fill-current" />
           </div>
        </div>

        <div className="lg:col-span-6 neo-card !bg-neo-mint/20 flex items-center justify-between group">
           <div>
              <h4 className="text-xl font-bold font-space uppercase mb-1">Báo cáo nhân sự</h4>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Xem KPI và năng suất tổ</p>
           </div>
           <Link href="/hr/employees" className="w-16 h-16 bg-white border-neo border-black rounded-2xl flex items-center justify-center shadow-neo group-hover:-rotate-12 transition-transform">
              <Users size={32} strokeWidth={2.5} className="text-neo-purple" />
           </Link>
        </div>

      </div>

      <div className="flex flex-col md:flex-row justify-between items-center py-10 px-8 bg-black text-white rounded-xl border-neo border-black shadow-neo gap-6 mt-12">
         <div className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em]">
            <Activity size={20} className="text-neo-mint" />
            PAPER ART VIỆT CLOUD ENGINE
         </div>
         <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em]">
            <span className="text-neo-yellow">V2.4.0 REFINE</span>
            <span className="opacity-40">SECURE NODE • {new Date().getFullYear()}</span>
         </div>
      </div>
    </div>
  );
}
