"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck,
  ArrowRight,
  Package,
  Building2,
  DollarSign
} from 'lucide-react';
import { getPurchaseOrders, updatePOStatus } from '@/services/purchase.service';
import SupplierManagementModal from './SupplierManagementModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface POListItem {
  id: string;
  poNumber: string;
  supplier: { name: string };
  orderDate: string;
  status: string;
  totalAmount: number;
  _count: { items: number };
}

export default function PurchaseOrderList({ onAddNew }: { onAddNew: () => void }) {
  const [pos, setPos] = useState<POListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  const loadPOs = async () => {
    setLoading(true);
    try {
      const data = await getPurchaseOrders({ 
        search, 
        status: statusFilter === 'all' ? undefined : statusFilter 
      });
      setPos(data as any);
    } catch (error) {
      console.error("Failed to load POs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOs();
  }, [search, statusFilter]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'draft': return 'border-retro-earth/40 text-retro-earth/40 bg-retro-paper/10';
      case 'pending_approval': return 'border-retro-mustard text-retro-mustard bg-retro-mustard/5';
      case 'ordered': return 'border-retro-sepia text-retro-sepia bg-retro-paper';
      case 'partially_received': return 'border-retro-moss text-retro-moss bg-retro-moss/5 animate-pulse';
      case 'completed': return 'border-retro-moss text-retro-moss bg-retro-moss/10 shadow-inner';
      case 'cancelled': return 'border-retro-brick text-retro-brick bg-retro-brick/5';
      default: return 'border-retro-earth/20 text-retro-earth/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={14} strokeWidth={2} />;
      case 'pending_approval': return <Clock size={14} strokeWidth={2} />;
      case 'ordered': return <Truck size={14} strokeWidth={2} />;
      case 'partially_received': return <Truck size={14} strokeWidth={2} />;
      case 'completed': return <CheckCircle2 size={14} strokeWidth={2} />;
      case 'cancelled': return <AlertCircle size={14} strokeWidth={2} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 font-typewriter">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 bg-retro-paper p-10 border-b-2 border-retro-sepia/10 relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(62,39,35,0.1)]">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Truck size={240} strokeWidth={0.5} className="text-retro-sepia" />
        </div>
        
        <div className="relative z-10">
          <nav className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-4 opacity-60">
            <Package size={14} strokeWidth={1.5} />
            <span>Thu mua & Tiếp vận</span>
            <ChevronRight size={12} strokeWidth={1.5} />
            <span className="text-retro-sepia">Quản lý Đơn mua hàng (PO)</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black text-retro-sepia uppercase tracking-tighter italic font-typewriter underline decoration-double decoration-retro-mustard/30 underline-offset-8">
            Thụ ký <span className="text-retro-brick">Mua bán</span>
          </h1>
          <div className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] italic mt-4 opacity-60 flex items-center gap-2">
            <div className="w-2 h-2 bg-retro-mustard rotate-45" />
            Hồ sơ chiêu hoán vật phẩm & Tiếp ứng Logistics — 1984
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 relative z-10">
          <button 
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-4 px-8 py-5 bg-white border-2 border-retro-sepia text-retro-sepia text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-paper transition-all active:scale-95 italic"
          >
            <Building2 size={20} strokeWidth={1.5} />
            Nhà cung ứng
          </button>
          
          <button 
            onClick={onAddNew}
            className="flex items-center gap-4 px-10 py-5 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all active:scale-95 italic"
          >
            <Plus size={20} strokeWidth={2.5} />
            Lập Đơn mới
          </button>
        </div>
      </div>

      {showSupplierModal && (
        <SupplierManagementModal onClose={() => { setShowSupplierModal(false); loadPOs(); }} />
      )}

      {/* SEARCH/FILTER BAR */}
      <div className="bg-white/60 p-8 border-2 border-retro-sepia/10 shadow-inner flex flex-col md:flex-row gap-8">
        <div className="relative flex-1 group">
          <input 
            type="text"
            placeholder="Tra cứu theo mã PO hoặc định danh nhân hiệu..."
            className="w-full pl-16 pr-8 py-5 bg-white border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia transition-all shadow-inner placeholder:italic placeholder:font-normal placeholder:lowercase tracking-tight"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search size={22} strokeWidth={1.5} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20 group-focus-within:text-retro-brick transition-all" />
        </div>
        
        <div className="relative group min-w-[280px]">
          <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20 pointer-events-none" size={20} />
          <select 
            className="w-full pl-16 pr-10 py-5 bg-white border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia appearance-none transition-all shadow-inner cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trang thái</option>
            <option value="draft">Bản phác thảo</option>
            <option value="pending_approval">Chờ phê duyệt</option>
            <option value="ordered">Đã phát lệnh</option>
            <option value="partially_received">Đang nhập cảng</option>
            <option value="completed">Đã tất toán</option>
            <option value="cancelled">Đã hủy bỏ</option>
          </select>
        </div>
      </div>


      {/* PO LIST TABLE */}
      <div className="bg-white border-2 border-retro-sepia/10 shadow-[0_20px_50px_-12px_rgba(62,39,35,0.15)] overflow-hidden min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-retro-paper text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] border-b-2 border-retro-sepia/20 italic opacity-60">
                <th className="px-10 py-6">Mã đơn PO</th>
                <th className="px-10 py-6">Nhà Cung Ứng</th>
                <th className="px-10 py-6">Hạn kỳ Niêm yết</th>
                <th className="px-10 py-6 text-right">Tổng Thụ giá</th>
                <th className="px-10 py-6 text-center">Trạng Thái</th>
                <th className="px-10 py-6 text-center">Hồ sơ</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-retro-sepia/5 relative z-0">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center">
                    <div className="flex flex-col items-center gap-8 text-retro-earth/40 italic">
                      <div className="w-12 h-12 border-4 border-retro-sepia/10 border-t-retro-brick animate-spin rounded-full"></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Đang đồng bộ Sổ cái Thu mua...</p>
                    </div>
                  </td>
                </tr>
              ) : pos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-32 text-center text-retro-earth/20 italic">
                    <div className="flex flex-col items-center gap-6">
                      <FileText size={64} strokeWidth={0.5} className="rotate-3" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em]">Không tìm thấy bản ghi trùng khớp</p>
                    </div>
                  </td>
                </tr>
              ) : pos.map((po) => (
                <tr key={po.id} className="hover:bg-retro-paper/50 transition-all group cursor-pointer border-b border-retro-sepia/5">
                  <td className="px-10 py-6">
                     <span className="text-[11px] font-black text-retro-sepia uppercase tracking-widest bg-retro-paper border-2 border-retro-sepia/10 px-4 py-2 italic group-hover:bg-retro-sepia group-hover:text-retro-paper transition-all shadow-sm">
                        {po.poNumber}
                     </span>
                  </td>
                  <td className="px-10 py-6">
                     <p className="text-xs font-black text-retro-sepia uppercase italic tracking-tight group-hover:text-retro-brick transition-all">{po.supplier.name}</p>
                     <p className="text-[9px] text-retro-earth/40 font-black uppercase tracking-[0.2em] mt-2 italic">{po._count.items} Chủng loại vật chất</p>
                  </td>
                  <td className="px-10 py-6">
                     <div className="flex items-center gap-3 text-retro-earth/60 italic">
                        <Clock size={16} strokeWidth={1.5} className="text-retro-earth/20" />
                        <span className="text-[12px] font-black tracking-tighter">{new Date(po.orderDate).toLocaleDateString('vi-VN')}</span>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-right">
                     <div className="flex items-center justify-end gap-2">
                        <span className="text-lg font-black text-retro-brick tabular-nums italic">
                          {Number(po.totalAmount).toLocaleString()}
                        </span>
                        <span className="text-[10px] font-black text-retro-brick/40 uppercase">VNĐ</span>
                     </div>
                  </td>
                  <td className="px-10 py-6">
                     <div className="flex justify-center">
                        <div className={cn(
                          "px-6 py-2 border-2 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm rotate-1 group-hover:rotate-0 transition-all",
                          getStatusStyle(po.status)
                        )}>
                           {getStatusIcon(po.status)}
                           <span>{
                             po.status === 'draft' ? 'Draft' :
                             po.status === 'pending_approval' ? 'Waiting' :
                             po.status === 'ordered' ? 'Ordered' :
                             po.status === 'partially_received' ? 'Partial' :
                             po.status === 'completed' ? 'Final' :
                             'Canceled'
                           }</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                     <button className="w-12 h-12 bg-white border-2 border-retro-sepia/10 text-retro-sepia flex items-center justify-center hover:bg-retro-sepia hover:text-retro-paper hover:border-retro-sepia transition-all shadow-sm group-hover:rotate-12">
                        <ArrowRight size={18} strokeWidth={2} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
