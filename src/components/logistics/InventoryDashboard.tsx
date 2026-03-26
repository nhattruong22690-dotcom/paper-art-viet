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
  Layers,
  Activity,
  Search
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
  const [searchTerm, setSearchTerm] = useState('');

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
        const mappedBatchData = batchData.map(b => ({
          ...b,
          purchasePrice: Number(b.purchasePrice),
          initialQuantity: Number(b.initialQuantity),
          remainQuantity: Number(b.remainQuantity),
          createdAt: b.createdAt.toISOString()
        }));
        setBatches(prev => ({ ...prev, [materialId]: mappedBatchData as MaterialBatch[] }));
      } catch (error) {
        console.error('Failed to load batches:', error);
      } finally {
        setLoadingBatches(null);
      }
    }
  };

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Kho Vật tư</h1>
          <p className="text-slate-500 text-sm mt-1">Giám sát tồn kho, định mức và luồng hàng lưu kho thời gian thực.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="btn-secondary gap-2">
              <History size={16} /> Lịch sử biến động
           </button>
        </div>
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card flex flex-col justify-center">
           <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại vật tư đang lưu</span>
              <div className="flex items-baseline gap-3">
                <h3 className="text-4xl font-black text-foreground">{stats.totalTypes}</h3>
                <span className="text-xs font-bold text-slate-500 uppercase">Chủng loại</span>
              </div>
           </div>
        </div>

        <div className="card border-rose-100 flex flex-col justify-center bg-rose-50/50">
           <div className="space-y-4">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} /> Cảnh báo tồn kho thấp
              </span>
              <div className="flex items-baseline gap-3">
                <h3 className="text-4xl font-black text-rose-700">{stats.lowStock}</h3>
                <span className="text-xs font-bold text-rose-400 uppercase">Cần nhập gấp</span>
              </div>
           </div>
        </div>

        <div className="card flex flex-col justify-center hover:border-primary/20 transition-all">
           <div className="space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tổng giá trị trữ kho</span>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-black text-foreground tracking-tight">
                  {stats.totalValue.toLocaleString()}
                </h3>
                <span className="text-xs font-bold text-slate-500 uppercase font-mono">VND</span>
              </div>
           </div>
        </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="card !p-0">
        <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/50">
           <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
                <Layers size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Sổ cái Tồn kho</h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Dữ liệu kiểm kê mới nhất</p>
              </div>
           </div>
           <div className="w-full md:w-72 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Tìm mã hoặc tên vật tư..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10 h-10"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Mã Vật Tư</th>
                <th className="px-8 py-5">Tên Vật Tư</th>
                <th className="px-8 py-5 text-center">Tồn Hiện Tại</th>
                <th className="px-8 py-5 text-center">Định Mức Min</th>
                <th className="px-8 py-5 text-center">Trạng Thái</th>
                <th className="px-8 py-5 text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMaterials.map((m) => {
                const isUnderStock = m.stockQuantity < m.minStock;
                const isNearStock = m.stockQuantity < m.minStock * 1.1 && !isUnderStock;
                const isExpanded = expandedMaterialId === m.id;
                
                return (
                  <React.Fragment key={m.id}>
                    <tr className={cn(
                      "hover:bg-slate-50/80 transition-all group cursor-pointer",
                      isExpanded && "bg-blue-50/30"
                    )} onClick={() => toggleExpand(m.id)}>
                      <td className="px-8 py-5">
                         <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded shadow-sm border border-slate-200">
                            {m.sku}
                         </span>
                      </td>
                      <td className="px-8 py-5">
                         <p className="text-sm font-bold text-slate-700 hover:text-blue-600 transition-colors">{m.name}</p>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className={cn(
                            "text-base font-black tabular-nums tracking-tight",
                            isUnderStock ? "text-rose-600" : isNearStock ? "text-amber-600" : "text-emerald-600"
                         )}>
                            {m.stockQuantity.toLocaleString()} <span className="text-[10px] font-bold text-slate-400 uppercase ml-0.5">{m.unit}</span>
                         </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <span className="text-xs font-bold text-slate-400 tracking-tight">
                            {m.minStock} {m.unit}
                         </span>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex justify-center">
                            {isUnderStock ? (
                              <div className="badge-error gap-1.5">
                                 <AlertTriangle size={12} strokeWidth={2.5} className="animate-pulse" />
                                 <span className="text-[9px] font-bold uppercase tracking-wider">Cần nhập</span>
                              </div>
                            ) : isNearStock ? (
                              <div className="badge-warning gap-1.5">
                                 <Info size={12} strokeWidth={2.5} />
                                 <span className="text-[9px] font-bold uppercase tracking-wider">Sắp hết</span>
                              </div>
                            ) : (
                              <div className="badge-success gap-1.5">
                                 <Package size={12} strokeWidth={2.5} />
                                 <span className="text-[9px] font-bold uppercase tracking-wider">Dồi dào</span>
                              </div>
                            )}
                         </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                         <button className={cn(
                           "p-2 rounded-lg transition-all border",
                           isExpanded 
                            ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200 rotate-90" 
                            : "bg-white text-slate-300 border-slate-200 hover:text-blue-600 hover:border-blue-600"
                         )}>
                            <ChevronRight size={16} strokeWidth={2.5} />
                         </button>
                      </td>
                    </tr>
                    
                    {/* BATCH DETAILS */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50 animate-in slide-in-from-top-1 duration-300">
                        <td colSpan={6} className="px-8 py-8 md:px-12">
                          <div className="space-y-6">
                            <div className="flex items-center gap-4">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={14} className="text-blue-500" /> 
                                Chi tiết các lô hàng lưu kho (FIFO)
                              </h4>
                              <div className="h-px flex-1 bg-slate-200" />
                            </div>

                            {loadingBatches === m.id ? (
                              <div className="flex flex-col items-center gap-4 text-slate-400 py-10">
                                <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
                                <p className="text-[9px] font-bold uppercase tracking-widest animate-pulse">Đang nạp dữ liệu...</p>
                              </div>
                            ) : batches[m.id]?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {batches[m.id].map((batch) => (
                                  <div key={batch.id} className="card !p-6 hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                      <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mã Lô</p>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">{batch.batchCode}</p>
                                      </div>
                                      <div className="badge-success">
                                        Batch Item
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Tồn lô</p>
                                        <p className="text-lg font-black text-emerald-600 tabular-nums">
                                          {Number(batch.remainQuantity).toLocaleString()} <span className="text-[9px] uppercase font-bold text-slate-300">{m.unit}</span>
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Vị trí</p>
                                        <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase">
                                          <MapPin size={10} className="text-blue-400" />
                                          {batch.location || 'Khu A'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-300">
                                      <div className="flex items-center gap-2">
                                        <Calendar size={12} />
                                        <span>{new Date(batch.createdAt).toLocaleDateString('vi-VN')}</span>
                                      </div>
                                      <div className="text-slate-600 font-mono tracking-tight">
                                        {Number(batch.purchasePrice).toLocaleString()}đ
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white p-12 rounded-2xl border border-dashed border-slate-200 text-center">
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Không có dữ liệu lô hàng</p>
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
