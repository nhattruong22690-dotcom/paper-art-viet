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
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 font-typewriter">
      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Total Types */}
        <div className="bg-retro-sepia p-10 shadow-2xl border-t-4 border-retro-mustard relative overflow-hidden group">
           <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform">
              <Box size={140} strokeWidth={1} className="text-white" />
           </div>
           <div className="relative z-10 space-y-6">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">Chủng loại Vật tư</span>
              <h3 className="text-5xl font-black text-white italic tracking-tighter">
                {stats.totalTypes} 
                <span className="text-xs font-bold text-white/40 not-italic uppercase ml-4 tracking-[0.2em]">Mục</span>
              </h3>
           </div>
        </div>

        {/* Low Stock Cảnh báo */}
        <div className="bg-white p-10 border-2 border-retro-brick shadow-xl relative overflow-hidden group rotate-1 hover:rotate-0 transition-transform">
           <div className="washi-tape-top opacity-20" />
           <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
              <AlertTriangle size={300} strokeWidth={0.5} className="text-retro-brick" />
           </div>
           <div className="relative z-10 space-y-6">
              <span className="text-[10px] font-black text-retro-brick uppercase tracking-[0.2em] italic flex items-center gap-3">
                <AlertTriangle size={16} className="animate-pulse" /> Nguy báo Cạn kiệt
              </span>
              <h3 className="text-5xl font-black text-retro-brick italic tracking-tighter">{stats.lowStock}</h3>
           </div>
        </div>

        {/* Total Value */}
        <div className="bg-white p-10 border-2 border-retro-sepia/10 shadow-sm relative group hover:border-retro-sepia/20 transition-all -rotate-1 hover:rotate-0">
           <div className="relative z-10 space-y-6">
              <span className="text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic">Tổng giá trị Trữ kho</span>
              <h3 className="text-3xl font-black text-retro-sepia italic tracking-tighter uppercase underline decoration-double decoration-retro-mustard/20 underline-offset-8">
                {stats.totalValue.toLocaleString()}đ
              </h3>
           </div>
        </div>
      </div>

      {/* INVENTORY LIST - THE LEDGER */}
      <div className="bg-white border-2 border-retro-sepia/10 shadow-[0_20px_50px_-12px_rgba(62,39,35,0.15)] overflow-hidden">
        <div className="p-10 border-b-2 border-retro-sepia/5 flex flex-col md:flex-row justify-between items-center gap-8 bg-retro-paper/20">
           <div>
              <h2 className="text-2xl font-black text-retro-sepia uppercase italic tracking-tight underline decoration-retro-mustard/30 underline-offset-4">Sổ cái <span className="text-retro-brick">Vật tư</span></h2>
              <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] mt-3 italic opacity-60">Kiểm kê thực tế & Điều phối Tiếp vận — MCMLXXXIV</p>
           </div>
           <button className="flex items-center gap-4 px-8 py-4 bg-white border-2 border-retro-sepia text-retro-sepia text-[10px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia hover:text-retro-paper transition-all active:scale-95 italic shadow-sm">
              <History size={18} strokeWidth={2} />
              Truy lục Biến động
           </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-retro-paper text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] border-b-2 border-retro-sepia/20 italic opacity-60">
                <th className="px-10 py-6">Mã Vật Tư</th>
                <th className="px-10 py-6">Tên Vật Tư</th>
                <th className="px-10 py-6 text-center">Tồn Hiện Tại</th>
                <th className="px-10 py-6 text-center">Định Mức Min</th>
                <th className="px-10 py-6 text-center">Trạng Thái</th>
                <th className="px-10 py-6 text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-retro-sepia/5 relative z-0">
              {materials.map((m) => {
                const isUnderStock = m.stockQuantity < m.minStock;
                const isNearStock = m.stockQuantity < m.minStock * 1.1 && !isUnderStock;
                const isExpanded = expandedMaterialId === m.id;
                
                return (
                  <React.Fragment key={m.id}>
                    <tr className={cn(
                      "hover:bg-retro-paper/40 transition-all group cursor-pointer",
                      isExpanded && "bg-retro-paper/60 shadow-inner"
                    )} onClick={() => toggleExpand(m.id)}>
                      <td className="px-10 py-6">
                         <span className="px-3 py-1 bg-retro-sepia text-retro-paper text-[10px] font-black uppercase tracking-widest italic group-hover:bg-retro-brick transition-colors">
                            {m.sku}
                         </span>
                      </td>
                      <td className="px-10 py-6">
                         <p className="text-sm font-black text-retro-sepia uppercase italic underline decoration-retro-mustard/10 underline-offset-4 group-hover:decoration-retro-mustard/30 transition-all font-typewriter">{m.name}</p>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <span className={cn(
                            "text-base font-black italic tabular-nums",
                            isUnderStock ? "text-retro-brick" : isNearStock ? "text-retro-mustard" : "text-retro-moss"
                         )}>
                            {m.stockQuantity.toLocaleString()} {m.unit}
                         </span>
                      </td>
                      <td className="px-10 py-6 text-center text-xs font-bold text-retro-earth/40 italic tabular-nums">
                         {m.minStock} {m.unit}
                      </td>
                      <td className="px-10 py-6">
                         <div className="flex justify-center">
                            {isUnderStock ? (
                              <div className="px-4 py-2 border-2 border-retro-brick text-retro-brick shadow-inner animate-pulse flex items-center gap-3">
                                 <AlertTriangle size={14} strokeWidth={2.5} />
                                 <span className="text-[10px] font-black uppercase tracking-widest italic">Cần nhập hàng</span>
                              </div>
                            ) : isNearStock ? (
                              <div className="px-4 py-2 border-2 border-retro-mustard text-retro-mustard flex items-center gap-3">
                                 <Info size={14} strokeWidth={2.5} />
                                 <span className="text-[10px] font-black uppercase tracking-widest italic">Sắp hết hàng</span>
                              </div>
                            ) : (
                              <div className="px-4 py-2 border-2 border-retro-moss text-retro-moss flex items-center gap-3 italic opacity-60">
                                 <Package size={14} strokeWidth={2.5} />
                                 <span className="text-[10px] font-black uppercase tracking-widest italic">An toàn</span>
                              </div>
                            )}
                         </div>
                      </td>
                      <td className="px-10 py-6 text-center">
                         <button className={cn(
                           "p-4 transition-all shadow-sm border-2 font-black",
                           isExpanded ? "bg-retro-sepia text-retro-paper border-retro-sepia rotate-90" : "bg-white text-retro-sepia/20 border-retro-sepia/10 hover:text-retro-sepia hover:border-retro-sepia"
                         )}>
                            <ChevronRight size={18} strokeWidth={2.5} />
                         </button>
                      </td>
                    </tr>
                    
                    {/* BATCH DETAILS - THE SUB-LEDGER */}
                    {isExpanded && (
                      <tr className="bg-retro-paper/20 border-l-8 border-retro-mustard/30 animate-in slide-in-from-top-2 duration-300">
                        <td colSpan={6} className="px-10 py-12">
                          <div className="space-y-10">
                            <div className="flex items-center gap-6">
                              <h4 className="text-[11px] font-black text-retro-sepia uppercase tracking-[0.3em] italic flex items-center gap-4">
                                <Layers size={18} strokeWidth={2.5} className="text-retro-mustard" /> 
                                Phân tích Lô hàng Trữ kho (Phương thức FIFO)
                              </h4>
                              <div className="h-[2px] flex-1 bg-retro-sepia/10 border-b border-dashed border-retro-sepia/20" />
                            </div>

                            {loadingBatches === m.id ? (
                              <div className="flex flex-col items-center gap-6 text-retro-earth/40 py-12 italic">
                                <div className="w-10 h-10 border-4 border-retro-sepia/10 border-t-retro-mustard animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Đang truy lục Hồ sơ Lô hàng...</p>
                              </div>
                            ) : batches[m.id]?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {batches[m.id].map((batch) => (
                                  <div key={batch.id} className="bg-white p-8 border-2 border-retro-sepia/10 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative rotate-1 even:-rotate-1">
                                    <div className="washi-tape-top opacity-10" />
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                      <div>
                                        <p className="text-[9px] font-black text-retro-earth/40 uppercase tracking-widest mb-1 italic">Mã Lô Hàng</p>
                                        <p className="text-sm font-black text-retro-sepia italic tracking-tight">{batch.batchCode}</p>
                                      </div>
                                      <div className="px-4 py-1.5 bg-retro-paper border-2 border-retro-mustard/20 text-retro-mustard text-[10px] font-black uppercase tracking-widest shadow-inner rotate-3">
                                        Vật phẩm
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8 relative z-10">
                                      <div className="space-y-2">
                                        <p className="text-[9px] font-black text-retro-earth/30 uppercase tracking-widest italic">Số lượng tồn</p>
                                        <p className="text-lg font-black text-retro-moss italic tabular-nums leading-none">
                                          {Number(batch.remainQuantity).toLocaleString()} <span className="text-[10px] uppercase font-bold not-italic">{m.unit}</span>
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <p className="text-[9px] font-black text-retro-earth/30 uppercase tracking-widest italic">Vị trí kho</p>
                                        <p className="text-xs font-black text-retro-earth uppercase tracking-tighter flex items-center gap-2 italic">
                                          <MapPin size={12} strokeWidth={2} className="text-retro-brick/40" />
                                          {batch.location || 'Ngoại vi'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-8 pt-6 border-t-2 border-dashed border-retro-sepia/5 flex justify-between items-center relative z-10">
                                      <div className="flex items-center gap-3 text-retro-earth/40">
                                        <Calendar size={14} strokeWidth={2} />
                                        <span className="text-[9px] font-black uppercase tracking-widest tabular-nums">{new Date(batch.createdAt).toLocaleDateString('vi-VN')}</span>
                                      </div>
                                      <div className="text-[11px] font-black text-retro-brick italic underline decoration-retro-brick/10 underline-offset-4">
                                        {Number(batch.purchasePrice).toLocaleString()}đ/đv
                                      </div>
                                    </div>

                                    {/* Decoration */}
                                    <div className="absolute -right-4 -bottom-4 text-retro-sepia opacity-[0.02] group-hover:opacity-[0.05] group-hover:scale-110 transition-all">
                                      <Layers size={80} strokeWidth={0.5} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-retro-paper/40 p-16 border-4 border-dashed border-retro-sepia/10 text-center">
                                <p className="text-xs font-black text-retro-earth/40 uppercase tracking-[0.3em] italic">Không tìm thấy bản ghi lô hàng hữu dụng cho vật tư này.</p>
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
