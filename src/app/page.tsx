"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  PackageCheck, 
  AlertTriangle,
  Loader2,
  Activity,
  Truck,
  FileText
} from 'lucide-react';

export default function DashboardPage() {
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
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-retro-sepia italic opacity-50">
      <Loader2 className="w-12 h-12 animate-spin text-retro-brick" strokeWidth={1} />
      <p className="font-typewriter text-[12px] font-black uppercase tracking-[0.3em]">Đang đồng bộ trung tâm điều hành...</p>
    </div>
  );

  const stats = [
    { label: 'Đơn hàng mới', value: data?.stats?.newOrders || 0, icon: Users, color: 'text-retro-sepia', bg: 'bg-white' },
    { label: 'Lợi nhuận dự tính', value: `${(data?.stats?.grossProfit || 0).toLocaleString()}đ`, icon: TrendingUp, color: 'text-retro-moss', bg: 'bg-white' },
    { label: 'Đã hoàn thành', value: data?.stats?.completedTasks || 0, icon: PackageCheck, color: 'text-retro-mustard', bg: 'bg-white' },
    { label: 'Cảnh báo chậm', value: data?.stats?.overdueAlerts || 0, icon: AlertTriangle, color: 'text-retro-brick', bg: 'bg-white' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <header className="border-b-2 border-retro-sepia/10 pb-8">
        <h1 className="text-4xl font-typewriter font-black text-retro-sepia tracking-tighter uppercase italic mb-2">Trung tâm <span className="text-retro-brick underline decoration-double decoration-1 underline-offset-8">Điều hành</span></h1>
        <p className="font-handwriting text-xl text-retro-earth flex items-center gap-2">
           <Activity size={20} strokeWidth={1.5} /> Paper Art Việt - Nhật ký sản xuất thời đại mới
        </p>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="retro-card !p-8 flex items-center gap-6 group hover:rotate-1 transition-all">
            <div className={`w-14 h-14 border border-retro-sepia/10 flex items-center justify-center ${stat.color} bg-retro-paper shadow-inner group-hover:bg-retro-sepia group-hover:text-white transition-all`}>
              <stat.icon size={28} strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-typewriter text-[10px] font-black text-retro-earth uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
              <p className="text-2xl font-typewriter font-black text-retro-sepia tracking-tighter uppercase tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* PRODUCTION LOG */}
        <div className="retro-card !bg-white/80 p-10 relative">
          <div className="washi-tape-top" />
          <h3 className="font-typewriter font-black text-retro-sepia mb-10 uppercase text-lg tracking-tighter border-b-2 border-retro-sepia/5 pb-6 flex justify-between items-center italic">
            Nhật ký Sản xuất (Registry)
            <span className="text-[10px] text-retro-brick font-black bg-retro-brick/5 px-3 py-1 border border-retro-brick/20 italic animate-pulse">LIVE FEED</span>
          </h3>
          <div className="space-y-10">
            {(data?.progress || []).map((item: any, i: number) => (
              <div key={i} className="group">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <span className="font-typewriter text-[10px] font-black text-retro-brick uppercase tracking-tighter border border-retro-brick/20 px-2 py-0.5">{item.sku}</span>
                    <h4 className="font-serif text-[16px] text-retro-sepia font-bold mt-2 italic capitalize tracking-tight group-hover:text-retro-brick transition-colors">{item.title}</h4>
                  </div>
                  <span className="font-typewriter text-[14px] font-black text-retro-sepia">{item.progress}%</span>
                </div>
                <div className="h-4 bg-retro-paper border border-retro-sepia/10 p-0.5 overflow-hidden">
                  <div 
                    className="h-full bg-retro-sepia transition-all duration-1000 shadow-[inset_-2px_0_4px_rgba(255,255,255,0.2)]" 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="font-handwriting text-[13px] text-retro-earth mt-2 italic">Ghi chú: <span className="uppercase text-[11px] font-black tracking-widest">{item.status}</span></p>
              </div>
            ))}
            {(!data?.progress || data.progress.length === 0) && (
              <div className="py-20 text-center space-y-4 opacity-20 italic">
                <FileText size={48} strokeWidth={1} className="mx-auto" />
                <p className="font-typewriter text-sm font-black uppercase tracking-widest">Dữ liệu sản xuất trống</p>
              </div>
            )}
          </div>
        </div>

        {/* LOGISTICS MANIFEST */}
        <div className="retro-card !bg-retro-paper p-10 relative border-dashed">
          <h3 className="font-typewriter font-black text-retro-sepia mb-10 uppercase text-lg tracking-tighter border-b-2 border-retro-sepia/10 pb-6 flex justify-between items-center italic">
            Manifest Xuất kho
            <Truck size={24} strokeWidth={1.5} className="text-retro-earth opacity-30" />
          </h3>
          <div className="divide-y-2 divide-retro-sepia/5">
            {(data?.deliveries || []).map((order: any, i: number) => (
              <div key={i} className="py-6 first:pt-0 last:pb-0 group cursor-pointer hover:bg-white/40 transition-all px-4 -mx-4 rounded-none">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-typewriter text-[11px] font-black text-retro-earth grayscale group-hover:grayscale-0 group-hover:text-retro-brick transition-all">MANIFEST #{order.id}</span>
                  <span className="font-typewriter text-[10px] font-black text-retro-brick bg-retro-brick/5 px-3 py-1 border border-retro-brick/20 italic">DỰ KIẾN: {order.date}</span>
                </div>
                <h4 className="font-typewriter text-[18px] font-black text-retro-sepia truncate uppercase tracking-tighter mb-1">{order.customer}</h4>
                <p className="font-handwriting text-[15px] text-retro-earth italic opacity-80">{order.items} • Hồ sơ hàng hóa đã niêm phong</p>
              </div>
            ))}
            {(!data?.deliveries || data.deliveries.length === 0) && (
              <div className="py-20 text-center space-y-4 opacity-20 italic">
                <Truck size={48} strokeWidth={1} className="mx-auto" />
                <p className="font-typewriter text-sm font-black uppercase tracking-widest">Không có vận đơn mới</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
