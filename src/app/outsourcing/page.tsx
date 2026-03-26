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
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 px-4 md:px-0">
      {/* Header Section */}
      <div className="card !flex-col md:!flex-row justify-between items-start md:items-center gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <Package size={12} />
            <span>Sản xuất</span>
            <ChevronRight size={10} />
            <span className="text-primary">Gia công ngoài</span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Quản lý Gia công Ngoài
          </h1>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <button 
             onClick={() => setIsAddModalOpen(true)}
             className="btn-primary gap-2 w-full md:w-auto justify-center"
           >
             <PlusCircle size={18} />
             Đặt gia công mới
           </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card !p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all border-l-4 border-l-blue-500">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Đang chế tác</p>
            <p className="text-3xl font-black text-blue-600">
              {loading ? '...' : String(inProduction).padStart(2, '0')}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Clock size={24} />
          </div>
        </div>

        <div className="card !p-6 flex items-center justify-between group hover:border-amber-500/30 transition-all border-l-4 border-l-amber-500">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Đợi điều phối</p>
            <p className="text-3xl font-black text-amber-600">
              {loading ? '...' : String(waitingPickup).padStart(2, '0')}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
            <Building2 size={24} />
          </div>
        </div>

        <div className="card !p-6 flex items-center justify-between group hover:border-gray-500/30 transition-all border-l-4 border-l-gray-500">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Tổng lệnh GC</p>
            <p className="text-3xl font-black text-gray-700">
              {loading ? '...' : String(filteredOrders.length).padStart(2, '0')}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 text-gray-600 group-hover:bg-gray-100 transition-colors">
            <ClipboardList size={24} />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card !p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên khách hàng, mã lệnh hoặc sản phẩm..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 h-10 bg-gray-50/20"
          />
        </div>
        <button className="btn-secondary gap-2 whitespace-nowrap justify-center">
          <Filter size={16} /> Bộ lọc
        </button>
      </div>

      {/* Table Section */}
      <div className="card !p-0 overflow-hidden">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 size={40} className="animate-spin text-primary" />
            <p className="text-sm font-medium">Đang tải danh sách lệnh gia công...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="!mt-0">
              <thead>
                <tr className="bg-gray-50/50">
                  <th>Mã lệnh / Khách hàng</th>
                  <th>Sản phẩm / SKU</th>
                  <th className="text-center">Số lượng</th>
                  <th>Hạn hoàn thành</th>
                  <th className="text-right">Trạng thái</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-sm shrink-0 border border-border group-hover:bg-primary group-hover:text-white transition-colors">
                           <Building2 size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-muted-text group-hover:text-primary transition-colors underline decoration-primary/10">{o.order?.customer?.name || 'N/A'}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">#{o.id?.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <p className="font-bold text-muted-text">{o.product?.name}</p>
                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 inline-block px-1.5 rounded">
                          {o.product?.sku || 'N/A'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-lg font-black text-muted-text tabular-nums">
                          {o.quantityTarget}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">pcs</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex items-center gap-2 font-bold text-muted-text">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm">
                            {o.deadlineProduction ? new Date(o.deadlineProduction).toLocaleDateString('vi-VN') : 'N/A'}
                          </span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={cn(
                        "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border shadow-sm",
                        o.currentStatus === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        o.currentStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        'bg-gray-50 text-gray-700 border-gray-200'
                      )}>
                        {o.currentStatus === 'in_progress' ? 'Đang thực hiện' : 
                         o.currentStatus === 'completed' ? 'Hoàn tất' : 'Đang chờ'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <ExternalLink size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                       <ClipboardList size={48} className="mx-auto mb-4 opacity-10" />
                       <p className="text-sm font-medium text-muted-foreground">Không tìm thấy lệnh gia công nào</p>
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
