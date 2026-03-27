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
  Loader2,
  ChevronRight,
  Package,
  ArrowUpRight,
  PlusCircle,
  Calendar,
  ExternalLink
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    <div className="space-y-10 animate-in fade-in duration-700 pb-24 px-4 md:px-0">
      {/* Header Section */}
      <div className="bg-neo-purple/10 p-8 rounded-xl border-neo border-black shadow-neo flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-3">
            <Package size={14} className="text-black" />
            <span>Sản xuất</span>
            <ChevronRight size={10} />
            <span className="text-black">Gia công ngoài</span>
          </nav>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase leading-none">
            Quản trị <span className="text-neo-purple italic">Gia công</span>
          </h1>
          <p className="text-black/60 text-sm mt-2 font-bold uppercase tracking-tight italic">
             Hệ thống điều phối lệnh sản xuất bên ngoài • 2026 Core
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="btn-primary btn-confirm-flash h-14 px-10 text-[11px] uppercase tracking-[0.2em] font-black"
           >
             <PlusCircle size={20} /> Đặt gia công mới
           </button>
        </div>
      </div>

      {/* Stats Section - BENTO STYLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="neo-card flex items-center justify-between group bg-white">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">Đang chế tác</p>
            <p className="text-4xl font-black text-black tracking-tighter italic">
              {loading ? '...' : String(inProduction).padStart(2, '0')}
            </p>
          </div>
          <div className="w-16 h-16 rounded-xl border-2 border-black bg-neo-purple flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-neo-purple/80 transition-all">
            <Clock size={32} className="text-black" />
          </div>
        </div>

        <div className="neo-card flex items-center justify-between group bg-white">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">Đợi điều phối</p>
            <p className="text-4xl font-black text-black tracking-tighter italic">
              {loading ? '...' : String(waitingPickup).padStart(2, '0')}
            </p>
          </div>
          <div className="w-16 h-16 rounded-xl border-2 border-black bg-neo-yellow flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-neo-yellow/80 transition-all">
            <Building2 size={32} className="text-black" />
          </div>
        </div>

        <div className="neo-card flex items-center justify-between group bg-white">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">Tổng lệnh GC</p>
            <p className="text-4xl font-black text-black tracking-tighter italic">
              {loading ? '...' : String(filteredOrders.length).padStart(2, '0')}
            </p>
          </div>
          <div className="w-16 h-16 rounded-xl border-2 border-black bg-neo-mint flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-neo-mint/80 transition-all">
            <ClipboardList size={32} className="text-black" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="neo-card bg-black/5 !p-6 flex flex-col md:flex-row gap-6 border-dashed">
        <div className="flex-1 relative group bg-white rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="Tìm mã lệnh, khách hàng hoặc sản phẩm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-transparent outline-none text-sm font-black text-black uppercase tracking-tight placeholder:text-black/20"
          />
        </div>
        <button className="btn-secondary h-full px-10 text-[11px] uppercase tracking-[0.2em] font-black min-h-[64px]">
          <Filter size={20} /> Bộ lọc nâng cao
        </button>
      </div>

      {/* Table Section */}
      <div className="neo-card !p-0 border-none shadow-none bg-transparent">
        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6 text-black/20">
            <Loader2 size={64} className="animate-spin text-black" />
            <p className="text-xs font-black uppercase tracking-[0.4em]">Đang đồng bộ dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-0">
              <thead>
                <tr>
                  <th className="px-8 py-6">Khách hàng / Mã lệnh</th>
                  <th className="px-8 py-6">Sản phẩm / SKU</th>
                  <th className="px-8 py-6 text-center">Số lượng</th>
                  <th className="px-8 py-6">Hạn định</th>
                  <th className="px-8 py-6 text-right">Trạng thái</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-neo-purple/5 transition-all group cursor-pointer bg-white">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-xl border-2 border-black bg-white flex items-center justify-center font-black group-hover:bg-black group-hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                           <Building2 size={24} />
                        </div>
                        <div>
                          <p className="font-black text-black uppercase tracking-tight italic text-base leading-none mb-2">{o.order?.customer?.name || 'N/A'}</p>
                          <p className="text-[10px] font-black text-black/40 uppercase tracking-widest flex items-center gap-2">
                             <span className="w-1.5 h-1.5 rounded-full bg-neo-purple" />
                             #{o.id?.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <p className="font-black text-black uppercase tracking-tight text-sm italic">{o.product?.name}</p>
                        <span className="text-[10px] font-black text-black bg-neo-purple/20 px-3 py-1 rounded border-2 border-black uppercase tracking-widest">
                          {o.product?.sku || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-2xl font-black text-black tabular-nums tracking-tighter italic">
                          {o.quantityTarget}
                        </span>
                        <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em]">PCS</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3 font-black text-black text-sm uppercase tracking-tight italic">
                          <Calendar size={18} className="text-black/20" />
                          <span>
                            {o.deadlineProduction ? new Date(o.deadlineProduction).toLocaleDateString('vi-VN') : 'N/A'}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className={cn(
                        o.currentStatus === 'in_progress' ? 'badge-warning' : 
                        o.currentStatus === 'completed' ? 'badge-success' : 
                        'badge-error bg-black/5 text-black/40'
                      )}>
                        {o.currentStatus === 'in_progress' ? 'Đang thực hiện' : 
                         o.currentStatus === 'completed' ? 'Hoàn tất' : 'Đang chờ'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <button className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-black/20 group-hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                        <ArrowUpRight size={22} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-40 text-center bg-white">
                       <ClipboardList size={64} className="mx-auto mb-6 text-black/5" />
                       <p className="text-xs font-black text-black/40 uppercase tracking-[0.4em]">Không tìm thấy dữ liệu phù hợp</p>
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
