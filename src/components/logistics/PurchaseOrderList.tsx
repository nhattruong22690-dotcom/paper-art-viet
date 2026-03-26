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
  DollarSign,
  MoreVertical,
  ArrowUpRight
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

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': return { color: 'text-slate-500 bg-slate-100 border-slate-200', icon: FileText, label: 'Bản thảo' };
      case 'pending_approval': return { color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Clock, label: 'Chờ duyệt' };
      case 'ordered': return { color: 'text-blue-600 bg-blue-50 border-blue-100', icon: Truck, label: 'Đã đặt hàng' };
      case 'partially_received': return { color: 'text-blue-700 bg-blue-100 border-blue-200', icon: Package, label: 'Nhập một phần' };
      case 'completed': return { color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: CheckCircle2, label: 'Hoàn thành' };
      case 'cancelled': return { color: 'text-rose-600 bg-rose-50 border-rose-100', icon: AlertCircle, label: 'Đã hủy' };
      default: return { color: 'text-slate-400 bg-slate-50 border-slate-100', icon: FileText, label: status };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Đơn mua hàng (PO)</h1>
          <p className="text-muted-foreground text-xs mt-1 uppercase font-bold tracking-widest">Quy trình thu mua & Logistics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSupplierModal(true)}
            className="btn-secondary h-9 px-4 gap-2"
          >
            <Building2 size={16} /> <span className="text-[11px] uppercase tracking-wider">Nhà cung cấp</span>
          </button>
          
          <button 
            onClick={onAddNew}
            className="btn-primary h-9 px-4 gap-2"
          >
            <Plus size={16} /> <span className="text-[11px] uppercase tracking-wider">Lập đơn mới</span>
          </button>
        </div>
      </div>

      {showSupplierModal && (
        <SupplierManagementModal onClose={() => { setShowSupplierModal(false); loadPOs(); }} />
      )}

      {/* SEARCH/FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input 
            type="text"
            placeholder="Tìm theo mã PO hoặc nhà cung cấp..."
            className="form-input pl-11 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="relative min-w-[200px]">
          <select 
            className="form-input pl-4 pr-10 h-11 appearance-none cursor-pointer"
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
          <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={14} />
        </div>
      </div>

      {/* PO LIST TABLE */}
      <div className="card min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-4">Mã đơn PO</th>
                <th className="px-6 py-4">Nhà Cung Ứng</th>
                <th className="px-6 py-4">Ngày đặt</th>
                <th className="px-6 py-4 text-right">Tổng giá trị</th>
                <th className="px-6 py-4 text-center">Trạng Thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-xs font-bold uppercase tracking-widest">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : pos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-slate-300">
                    <div className="flex flex-col items-center gap-4">
                      <FileText size={48} strokeWidth={1} />
                      <p className="text-sm font-medium">Không tìm thấy đơn mua hàng nào</p>
                    </div>
                  </td>
                </tr>
              ) : pos.map((po) => {
                const config = getStatusConfig(po.status);
                const Icon = config.icon;
                
                return (
                  <tr key={po.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-6 py-4">
                       <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/10">
                          {po.poNumber}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <p className="text-sm font-bold text-foreground leading-tight">{po.supplier.name}</p>
                       <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">{po._count.items} mặt hàng</p>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs">
                          <Clock size={12} className="text-gray-300" />
                          <span>{new Date(po.orderDate).toLocaleDateString('vi-VN')}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-sm font-bold text-foreground tabular-nums tracking-tight">
                        {Number(po.totalAmount).toLocaleString()} <span className="text-[10px] text-muted-foreground">đ</span>
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex justify-center">
                          <div className={cn(
                            "px-2 py-0.5 rounded border flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider",
                            config.color
                          )}>
                             <Icon size={10} strokeWidth={2.5} />
                             <span>{config.label}</span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2 bg-white border border-border text-muted-foreground rounded hover:text-primary hover:border-primary transition-all shadow-sm">
                          <ArrowUpRight size={16} />
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
      <div className="flex justify-between items-center px-4">
         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
            Hiển thị {pos.length} đơn hàng gần nhất
         </p>
         <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <button key={i} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-[10px] font-bold hover:bg-slate-50 transition-all">
                {i}
              </button>
            ))}
         </div>
      </div>
    </div>
  );
}
