"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  History,
  Info,
  ChevronRight,
  ChevronDown,
  DollarSign,
  MapPin,
  Calendar,
  Layers
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMaterials, getInventoryStats, getMaterialBatches } from '@/services/material.service';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MaterialInventory {
  id: string;
  sku: string;
  name: string;
  stockQuantity: number;
  minStock: number;
  referencePrice: number;
  unit: string;
}

interface MaterialBatch {
  id: string;
  batchCode: string;
  purchasePrice: number;
  initialQuantity: number;
  remainQuantity: number;
  location: string | null;
  createdAt: string;
}

export default function InventoryDashboard() {
  const [materials, setMaterials] = useState<MaterialInventory[]>([]);
  const [stats, setStats] = useState({
    totalTypes: 0,
    lowStock: 0,
    totalValue: 0
  });
  const [expandedMaterialId, setExpandedMaterialId] = useState<string | null>(null);
  const [batches, setBatches] = useState<Record<string, MaterialBatch[]>>({});
  const [loadingBatches, setLoadingBatches] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const mats = await getMaterials({});
      const inventoryStats = await getInventoryStats();
      
      setMaterials(mats.map((m: any) => ({
        id: m.id,
        sku: m.sku,
        name: m.name,
        stockQuantity: Number(m.stockQuantity),
        minStock: Number(m.minStock),
        referencePrice: Number(m.referencePrice),
        unit: m.unit
      })));
      
      setStats({
        totalTypes: inventoryStats.totalTypes,
        lowStock: inventoryStats.lowStockCount,
        totalValue: inventoryStats.totalValue
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = async (materialId: string) => {
    if (expandedMaterialId === materialId) {
      setExpandedMaterialId(null);
      return;
    }

    setExpandedMaterialId(materialId);
    
    if (!batches[materialId]) {
      setLoadingBatches(materialId);
      try {
        const batchData = await getMaterialBatches(materialId);
        // Map to ensure numbers instead of Decimal objects
        const mappedBatchData = batchData.map(b => ({
          ...b,
          purchasePrice: Number(b.purchasePrice),
          initialQuantity: Number(b.initialQuantity),
          remainQuantity: Number(b.remainQuantity),
          createdAt: b.createdAt.toISOString() // MaterialBatch interface expects string
        }));
        setBatches(prev => ({ ...prev, [materialId]: mappedBatchData as MaterialBatch[] }));
      } catch (error) {
        console.error('Failed to load batches:', error);
      } finally {
        setLoadingBatches(null);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Total Types */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/50 flex items-center justify-between group hover:border-indigo-200 transition-all cursor-default">
           <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Loại vật tư</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter italic">{stats.totalTypes}</h3>
           </div>
           <div className="w-16 h-16 bg-gray-50 rounded-[22px] flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-12 transition-all duration-500">
              <Box size={32} />
           </div>
        </div>

        {/* Low Stock Cảnh báo */}
        <div className="bg-white p-8 rounded-[40px] border border-rose-100 shadow-xl shadow-rose-100/20 flex items-center justify-between group hover:bg-rose-50 transition-all cursor-default relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">Cần nhập hàng</p>
              <h3 className="text-4xl font-black text-rose-600 tracking-tighter italic">{stats.lowStock}</h3>
           </div>
           <div className="w-16 h-16 bg-rose-50 rounded-[22px] flex items-center justify-center text-rose-300 group-hover:scale-110 transition-all duration-500 z-10">
              <AlertTriangle size={32} />
           </div>
           <div className="absolute -right-4 -bottom-4 opacity-5 text-rose-600 group-hover:scale-150 transition-all duration-1000">
              <AlertTriangle size={120} />
           </div>
        </div>

        {/* Total Value */}
        <div className="bg-white p-8 rounded-[40px] border border-emerald-100 shadow-xl shadow-emerald-100/20 flex items-center justify-between group hover:bg-emerald-50 transition-all cursor-default">
           <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Giá trị tồn kho</p>
              <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">
                {stats.totalValue.toLocaleString()}đ
              </h3>
           </div>
           <div className="w-16 h-16 bg-emerald-50 rounded-[22px] flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
              <DollarSign size={32} />
           </div>
        </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="bg-white rounded-[48px] border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden">
        <div className="p-10 border-b border-gray-50 flex justify-between items-center">
           <div>
              <h2 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Tồn kho <span className="text-indigo-600">Thực tế</span></h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Dữ liệu cập nhật thời gian thực</p>
           </div>
           <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">
              <History size={16} />
              Lịch sử chung
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-10 py-6">Mã Vật Tư</th>
                <th className="px-10 py-6">Tên Vật Tư</th>
                <th className="px-10 py-6 text-center">Tồn Hiện Tại</th>
                <th className="px-10 py-6 text-center">Định Mức Min</th>
                <th className="px-10 py-6 text-center">Trạng Thái</th>
                <th className="px-10 py-6 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {materials.map((m) => {
                const isUnderStock = m.stockQuantity < m.minStock;
                const isNearStock = m.stockQuantity < m.minStock * 1.1 && !isUnderStock;
                const isExpanded = expandedMaterialId === m.id;
                
                return (
                  <React.Fragment key={m.id}>
                    <tr className={cn(
                      "hover:bg-indigo-50/20 transition-all group cursor-pointer",
                      isExpanded && "bg-indigo-50/30 shadow-inner"
                    )} onClick={() => toggleExpand(m.id)}>
                      <td className="px-10 py-6">
                         <span className="text-[11px] font-black text-gray-400 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">
                            {m.sku}
                         </span>
                      </td>
                      <td className="px-10 py-6">
                         <p className="text-sm font-black text-gray-800 uppercase italic">{m.name}</p>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <span className={cn(
                            "text-base font-black italic",
                            isUnderStock ? "text-rose-600" : isNearStock ? "text-amber-500" : "text-emerald-600"
                         )}>
                            {m.stockQuantity.toLocaleString()} {m.unit}
                         </span>
                      </td>
                      <td className="px-10 py-6 text-center text-xs font-bold text-gray-400 italic">
                         {m.minStock} {m.unit}
                      </td>
                      <td className="px-10 py-6">
                         <div className="flex justify-center">
                            {isUnderStock ? (
                              <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-2 border border-rose-100 shadow-sm shadow-rose-100/50">
                                 <AlertTriangle size={14} className="animate-pulse" />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Cần nhập hàng</span>
                              </div>
                            ) : isNearStock ? (
                              <div className="px-4 py-2 bg-amber-50 text-amber-500 rounded-2xl flex items-center gap-2 border border-amber-100 shadow-sm shadow-amber-100/50">
                                 <Info size={14} />
                                 <span className="text-[10px] font-black uppercase tracking-widest">Sắp hết hàng</span>
                              </div>
                            ) : (
                              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center gap-2 border border-emerald-100 shadow-sm shadow-emerald-100/50">
                                 <Package size={14} />
                                 <span className="text-[10px] font-black uppercase tracking-widest">An toàn</span>
                              </div>
                            )}
                         </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <button className={cn(
                           "p-3 rounded-xl transition-all shadow-sm border",
                           isExpanded ? "bg-indigo-600 text-white border-indigo-600 rotate-90" : "bg-white text-gray-300 border-gray-50 hover:text-indigo-600 hover:border-indigo-100"
                         )}>
                            <ChevronRight size={18} />
                         </button>
                      </td>
                    </tr>
                    
                    {/* BATCH DETAILS (IF EXPANDED) */}
                    {isExpanded && (
                      <tr className="bg-indigo-50/10 border-l-4 border-indigo-500 animate-in slide-in-from-top-2 duration-300">
                        <td colSpan={6} className="px-10 py-8">
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-1 bg-indigo-500 rounded-full"></div>
                              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic flex items-center gap-2">
                                <Layers size={14} /> Danh sách các lô hàng tồn kho (FIFO - Nhập trước xuất trước)
                              </h4>
                            </div>

                            {loadingBatches === m.id ? (
                              <div className="flex items-center gap-3 text-gray-400 py-4 italic text-sm">
                                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                Đang tải dữ liệu lô hàng...
                              </div>
                            ) : batches[m.id]?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {batches[m.id].map((batch) => (
                                  <div key={batch.id} className="bg-white p-5 rounded-3xl border border-indigo-50 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                      <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Mã Lô Hàng</p>
                                        <p className="text-xs font-black text-gray-900 font-mono tracking-tight">{batch.batchCode}</p>
                                      </div>
                                      <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase">
                                        Lô mới
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 relative z-10">
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1">Số lượng tồn</p>
                                        <p className="text-sm font-black text-emerald-600 italic">{Number(batch.remainQuantity).toLocaleString()} {m.unit}</p>
                                      </div>
                                      <div>
                                        <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1">Vị trí kho</p>
                                        <p className="text-sm font-black text-gray-800 uppercase tracking-tighter flex items-center gap-1.5">
                                          <MapPin size={12} className="text-indigo-400" />
                                          {batch.location || 'Chưa định vị'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center relative z-10">
                                      <div className="flex items-center gap-1.5 text-gray-300">
                                        <Calendar size={12} />
                                        <span className="text-[9px] font-bold uppercase">{new Date(batch.createdAt).toLocaleDateString('vi-VN')}</span>
                                      </div>
                                      <div className="text-[10px] font-black text-indigo-500 italic">
                                        {Number(batch.purchasePrice).toLocaleString()}đ/đv
                                      </div>
                                    </div>

                                    {/* Decoration */}
                                    <div className="absolute -right-2 -bottom-2 text-indigo-50/20 group-hover:scale-110 transition-transform">
                                      <Layers size={60} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white/50 p-10 rounded-3xl border border-dashed border-gray-200 text-center">
                                <p className="text-xs font-bold text-gray-400 italic">Không tìm thấy lô hàng nào còn tồn cho vật tư này.</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
