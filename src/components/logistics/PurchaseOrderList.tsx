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
  ArrowRight
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
      case 'draft': return 'bg-gray-100 text-gray-500 border-gray-200';
      case 'pending_approval': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'ordered': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'partially_received': return 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse';
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-rose-50 text-rose-400 border-rose-100';
      default: return 'bg-gray-100 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={14} />;
      case 'pending_approval': return <Clock size={14} />;
      case 'ordered': return <Truck size={14} />;
      case 'partially_received': return <Truck size={14} />;
      case 'completed': return <CheckCircle2 size={14} />;
      case 'cancelled': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/20">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
            Quản lý <span className="text-indigo-600">Đơn mua hàng</span>
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Theo dõi quy trình thu mua nguyên vật liệu</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowSupplierModal(true)}
            className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-gray-900 text-gray-900 rounded-[24px] text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all active:scale-95 group"
          >
            🏢 Quản lý Nhà cung cấp
          </button>
          
          <button 
            onClick={onAddNew}
            className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-gray-200 active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            Tạo Đơn Mới
          </button>
        </div>
      </div>

      {showSupplierModal && (
        <SupplierManagementModal onClose={() => { setShowSupplierModal(false); loadPOs(); }} />
      )}

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Tìm theo mã PO..."
            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[28px] text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="relative group">
          <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
          <select 
            className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[28px] text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none transition-all shadow-sm cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="draft">Bản nháp</option>
            <option value="pending_approval">Chờ duyệt</option>
            <option value="ordered">Đã đặt hàng</option>
            <option value="partially_received">Nhập kho một phần</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
        
        <div className="bg-indigo-50 rounded-[28px] flex items-center justify-center p-2">
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Sắp xếp theo Ngày tạo (Mới nhất)</p>
        </div>
      </div>

      {/* PO LIST */}
      <div className="bg-white rounded-[48px] border border-gray-100 shadow-2xl shadow-gray-100/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-10 py-6">Mã PO</th>
                <th className="px-10 py-6">Nhà Cung Cấp</th>
                <th className="px-10 py-6">Ngày Đặt</th>
                <th className="px-10 py-6 text-right">Tổng Tiền</th>
                <th className="px-10 py-6 text-center">Trạng Thái</th>
                <th className="px-10 py-6 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Đang tải dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : pos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-300">
                      <FileText size={48} className="opacity-20" />
                      <p className="text-sm font-bold italic">Không tìm thấy đơn hàng nào</p>
                    </div>
                  </td>
                </tr>
              ) : pos.map((po) => (
                <tr key={po.id} className="hover:bg-indigo-50/20 transition-all group cursor-default">
                  <td className="px-10 py-6">
                     <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                        {po.poNumber}
                     </span>
                  </td>
                  <td className="px-10 py-6">
                     <p className="text-sm font-black text-gray-800 uppercase italic tracking-tight">{po.supplier.name}</p>
                     <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">{po._count.items} mặt hàng</p>
                  </td>
                  <td className="px-10 py-6">
                     <div className="flex items-center gap-2 text-gray-400">
                        <Clock size={14} strokeWidth={2.5} />
                        <span className="text-[11px] font-bold">{new Date(po.orderDate).toLocaleDateString('vi-VN')}</span>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-right font-mono text-sm font-black text-gray-900 italic">
                     {Number(po.totalAmount).toLocaleString()}đ
                  </td>
                  <td className="px-10 py-6">
                     <div className="flex justify-center">
                        <div className={cn(
                          "px-4 py-2 rounded-2xl flex items-center gap-2 border text-[10px] font-black uppercase tracking-widest shadow-sm",
                          getStatusStyle(po.status)
                        )}>
                           {getStatusIcon(po.status)}
                           <span>{
                             po.status === 'draft' ? 'Bản nháp' :
                             po.status === 'pending_approval' ? 'Chờ duyệt' :
                             po.status === 'ordered' ? 'Đã đặt hàng' :
                             po.status === 'partially_received' ? 'Nhập kho một phần' :
                             po.status === 'completed' ? 'Đã hoàn thành' :
                             'Đã hủy'
                           }</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-10 py-6 text-center">
                     <button className="p-3 bg-white border border-gray-100 text-gray-300 rounded-2xl hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all active:scale-95 group">
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
