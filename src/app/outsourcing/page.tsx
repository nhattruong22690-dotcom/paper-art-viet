"use client";

import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Filter, 
  Search, 
  Clock, 
  MapPin, 
  Building2,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function OutsourcingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/outsourcing')
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load outsourcing orders:', err);
        setLoading(false);
      });
  }, []);

  const filteredOrders = orders.filter(o => 
    (o.order?.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inProduction = filteredOrders.filter(o => o.currentStatus === 'in_progress').length;
  const waitingPickup = filteredOrders.filter(o => o.currentStatus === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 animate-in fade-in duration-700">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gia công ngoài (Outsourcing)</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest italic">Paper Art Việt - External Processing</p>
        </div>
        <div className="flex gap-4">
          <button className="px-8 py-4 bg-primary-600 text-white rounded-[24px] font-black shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all flex items-center gap-3 text-[11px] uppercase tracking-widest">
            <Plus size={18} /> Tạo lệnh gia công
          </button>
        </div>
      </header>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card-refined p-8 bg-gray-900 border-none">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/10 rounded-2xl text-primary-400">
              <Clock size={24} />
            </div>
            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Đang thực hiện</span>
          </div>
          <p className="text-4xl font-black text-white italic tracking-tighter">
            {loading ? '...' : String(inProduction).padStart(2, '0')} 
            <span className="text-xs font-bold text-white/40 not-italic uppercase ml-2 tracking-widest">Lệnh</span>
          </p>
        </div>
        <div className="card-refined p-8 bg-white border-2 border-primary-50">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-primary-50 rounded-2xl text-primary-600">
              <Building2 size={24} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chờ sản xuất</span>
          </div>
          <p className="text-4xl font-black text-gray-900 italic tracking-tighter">
            {loading ? '...' : String(waitingPickup).padStart(2, '0')} 
            <span className="text-xs font-bold text-gray-400 not-italic uppercase ml-2 tracking-widest">Lệnh mới</span>
          </p>
        </div>
        <div className="card-refined p-8 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <MapPin size={24} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tất cả lệnh</span>
          </div>
          <p className="text-4xl font-black text-gray-900 italic tracking-tighter">
            {loading ? '...' : String(filteredOrders.length).padStart(2, '0')} 
            <span className="text-xs font-bold text-gray-400 not-italic uppercase ml-2 tracking-widest">Lệnh GC</span>
          </p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={20} />
        <input 
          type="text" 
          placeholder="Tìm tên khách hàng, mã lệnh, hoặc sản phẩm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-gray-100 rounded-[32px] py-5 pl-16 pr-8 text-sm outline-none shadow-sm focus:shadow-xl focus:border-primary-100 transition-all font-bold tracking-tight uppercase"
        />
      </div>

      {/* OUTSOURCING LIST */}
      <div className="card-refined p-0 overflow-hidden border-none shadow-xl bg-white min-h-[400px]">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-3">
               <ClipboardList size={20} className="text-primary-500" /> Danh sách Lệnh gia công
            </h3>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-gray-400 italic">
            <Loader2 size={32} className="animate-spin text-primary-600" />
            <p className="text-[10px] font-black uppercase tracking-widest">Đang tải lệnh gia công...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-10 py-5">Mã lệnh / Khách hàng</th>
                  <th className="px-10 py-5">Sản phẩm</th>
                  <th className="px-10 py-5 text-center">Số lượng</th>
                  <th className="px-10 py-5">Hạn giao hàng</th>
                  <th className="px-10 py-5 text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="group hover:bg-primary-50/30 transition-all cursor-pointer">
                    <td className="px-10 py-6">
                      <div>
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{o.order?.customer?.name || 'N/A'}</h4>
                        <p className="text-[10px] text-primary-500 font-black tracking-widest mt-1">ID: #{o.id?.slice(-8).toUpperCase()}</p>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700">{o.product?.name}</span>
                        <span className="text-[9px] font-black text-gray-300 uppercase italic tracking-widest">{o.product?.sku}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center text-sm font-black italic text-gray-900">
                      {o.quantityTarget} <span className="text-[10px] not-italic text-gray-400 uppercase ml-1">pcs</span>
                    </td>
                    <td className="px-10 py-6 text-sm font-bold text-gray-900">
                      {o.deadlineProduction ? new Date(o.deadlineProduction).toLocaleDateString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                        o.currentStatus === 'in_progress' ? 'bg-amber-100 text-amber-600' : 
                        o.currentStatus === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      )}>
                        {o.currentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-24 text-center">
                       <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest italic">Chưa có lệnh gia công ngoài nào được tạo</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

