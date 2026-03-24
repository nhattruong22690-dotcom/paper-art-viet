"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  PackageCheck, 
  AlertTriangle 
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
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const stats = [
    { label: 'Đơn hàng mới', value: data?.stats?.newOrders || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Lợi nhuận dự tính', value: `${(data?.stats?.grossProfit || 0).toLocaleString()}đ`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Đã hoàn thành', value: data?.stats?.completedTasks || 0, icon: PackageCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Cảnh báo chậm', value: data?.stats?.overdueAlerts || 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tổng quan hệ thống</h1>
        <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest italic">Paper Art Việt - Production Hub</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="card-refined flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card-refined min-h-[300px]">
          <h3 className="font-black text-gray-900 mb-6 uppercase text-sm tracking-widest border-b border-gray-50 pb-4 flex justify-between items-center">
            🔥 Tiến độ sản xuất gần đây
            <span className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded-lg">LIVE</span>
          </h3>
          <div className="space-y-6">
            {(data?.progress || []).map((item: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full uppercase border border-primary-100">{item.sku}</span>
                    <h4 className="text-sm font-bold text-gray-800 mt-1">{item.title}</h4>
                  </div>
                  <span className="text-xs font-black text-gray-900">{item.progress}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 transition-all duration-1000" 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 italic font-medium">Trạng thái: <span className="text-gray-700 uppercase">{item.status}</span></p>
              </div>
            ))}
            {(!data?.progress || data.progress.length === 0) && (
              <p className="text-center text-gray-300 py-10 italic text-sm font-medium">Chưa có hoạt động sản xuất gần đây</p>
            )}
          </div>
        </div>

        <div className="card-refined">
          <h3 className="font-black text-gray-900 mb-6 uppercase text-sm tracking-widest border-b border-gray-50 pb-4">
            🚚 Đơn hàng sắp xuất kho
          </h3>
          <div className="divide-y divide-gray-50">
            {(data?.deliveries || []).map((order: any, i: number) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0 group cursor-pointer hover:bg-gray-50 transition-colors px-2 -mx-2 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-primary-600">#{order.id}</span>
                  <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md">ETD: {order.date}</span>
                </div>
                <h4 className="font-bold text-gray-800 truncate uppercase">{order.customer}</h4>
                <p className="text-xs text-gray-500">{order.items} • Đơn hàng chốt</p>
              </div>
            ))}
            {(!data?.deliveries || data.deliveries.length === 0) && (
              <p className="text-center text-gray-300 py-10 italic text-sm font-medium">Không có đơn hàng nào sắp tới</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
