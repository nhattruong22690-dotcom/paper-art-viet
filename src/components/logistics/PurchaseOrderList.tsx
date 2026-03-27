"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  ChevronRight, 
  ChevronDown,
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Truck,
  ArrowRight,
  Package,
  ShoppingBag,
  Building2,
  DollarSign,
  MoreVertical,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { getPurchaseOrders, updatePOStatus } from '@/services/purchase.service';
import SupplierManagementModal from './SupplierManagementModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatNumber } from '@/utils/format';

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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': return { color: 'bg-white text-black/40 border-black/20', icon: FileText, label: 'Bản thảo' };
      case 'pending_approval': return { color: 'bg-neo-yellow/20 text-black border-black/40', icon: Clock, label: 'Chờ duyệt' };
      case 'ordered': return { color: 'bg-neo-purple/20 text-black border-black/40', icon: Truck, label: 'Đã đặt hàng' };
      case 'partially_received': return { color: 'bg-neo-blue/20 text-black border-black/40', icon: Package, label: 'Nhập một phần' };
      case 'completed': return { color: 'bg-neo-green/20 text-black border-black/40', icon: CheckCircle2, label: 'Hoàn thành' };
      case 'cancelled': return { color: 'bg-neo-red/20 text-black border-black/40', icon: AlertCircle, label: 'Đã hủy' };
      default: return { color: 'bg-white text-black/40 border-black/20', icon: FileText, label: status };
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
             <ShoppingBag size={28} className="text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight uppercase italic">Đơn mua hàng (PO)</h1>
            <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">Procurement Pipeline & Supplier Logistics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSupplierModal(true)}
            className="btn-secondary h-12 px-6 text-[10px] uppercase tracking-widest"
          >
            <Building2 size={16} strokeWidth={2.5} /> Đối tác cung ứng
          </button>
          
          <button 
            onClick={onAddNew}
            className="btn-primary h-12 px-8 text-[10px] uppercase tracking-widest"
          >
            <Plus size={18} strokeWidth={3} /> Lập đơn mới
          </button>
        </div>
      </div>

      {showSupplierModal && (
        <SupplierManagementModal onClose={() => { setShowSupplierModal(false); loadPOs(); }} />
      )}

      {/* SEARCH/FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group/field">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={24} />
          <input 
            type="text"
            placeholder="Tìm theo mã PO hoặc nhà cung cấp..."
            className="form-input pl-14 h-16"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="relative min-w-[240px] group/field">
          <select 
            className="form-input pl-4 pr-10 h-16 appearance-none cursor-pointer uppercase text-[10px] font-black tracking-widest"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản thảo</option>
            <option value="pending_approval">Chờ duyệt</option>
            <option value="ordered">Đã đặt hàng</option>
            <option value="partially_received">Nhập một phần</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
        </div>
      </div>

      {/* PO LIST TABLE */}
      <div className="neo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-[10px] font-black text-neo-purple uppercase tracking-widest">
                <th className="px-8 py-5 border-b-2 border-black">Mã đơn PO</th>
                <th className="px-8 py-5 border-b-2 border-black">Nhà Cung Ứng</th>
                <th className="px-8 py-5 border-b-2 border-black">Ngày đặt</th>
                <th className="px-8 py-5 text-right border-b-2 border-black">Tổng giá trị</th>
                <th className="px-8 py-5 text-center border-b-2 border-black">Trạng Thái</th>
                <th className="px-8 py-5 text-right border-b-2 border-black w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 size={40} className="animate-spin text-black opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-black/20">Syncing procurement data...</p>
                    </div>
                  </td>
                </tr>
              ) : pos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center opacity-10">
                    <div className="flex flex-col items-center gap-4">
                      <FileText size={64} strokeWidth={1} />
                      <p className="text-sm font-black uppercase tracking-[0.4em]">Empty Ledger</p>
                    </div>
                  </td>
                </tr>
              ) : pos.map((po) => {
                const config = getStatusConfig(po.status);
                const Icon = config.icon;
                
                return (
                  <tr key={po.id} className="hover:bg-neo-purple/5 transition-all group">
                    <td className="px-8 py-6">
                       <span className="text-[10px] font-black text-black bg-neo-purple/10 px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tracking-widest">
                          {po.poNumber}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <p className="font-black text-black leading-tight uppercase italic tracking-tight">{po.supplier.name}</p>
                       <p className="text-[9px] text-black/40 font-black uppercase tracking-widest mt-0.5">{po._count.items} mặt hàng kê khai</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-2 text-black/20 font-black text-[11px] uppercase tracking-tighter tabular-nums italic">
                          <Clock size={14} strokeWidth={3} />
                          <span>{new Date(po.orderDate).toLocaleDateString('vi-VN')}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className="font-black text-black tabular-nums tracking-tighter text-lg italic">
                        {formatNumber(po.totalAmount)} <span className="text-[10px] text-black/40">đ</span>
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center">
                          <div className={cn(
                            "px-4 py-1.5 rounded-lg border-2 border-black flex items-center gap-2 text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic",
                            config.color
                          )}>
                             <Icon size={12} strokeWidth={3} />
                             <span>{config.label}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black/20 hover:text-black hover:bg-black/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-white">
                          <ArrowUpRight size={20} strokeWidth={3} />
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* FOOTER INFO */}
      <div className="flex justify-between items-center px-8">
         <p className="text-[10px] text-black/20 font-black uppercase tracking-widest italic leading-none">
            Ledger Audit: Showing {pos.length} most recent records
         </p>
         <div className="flex gap-3">
            {[1, 2, 3].map(i => (
              <button key={i} className="w-10 h-10 flex items-center justify-center rounded-xl border-2 border-black text-[10px] font-black text-black/40 hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none">
                {i}
              </button>
            ))}
         </div>
      </div>
    </div>
  );
}
