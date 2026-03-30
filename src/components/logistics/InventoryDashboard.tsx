"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  AlertTriangle, 
  Package, 
  History,
  ChevronRight,
  ChevronDown,
  MapPin,
  Calendar,
  Layers,
  Activity,
  Search,
  Loader2,
  TrendingUp,
  ArrowUpRight
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
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Box size={28} className="text-black" />
           </div>
           <div>
             <h1 className="text-3xl font-black text-black tracking-tight uppercase italic">Quản lý Kho Vật tư</h1>
             <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">Real-time Stock Monitoring & FIFO Audit</p>
           </div>
         </div>
        <div className="flex items-center gap-4">
           <button className="btn-secondary h-12 px-6 text-[10px] uppercase tracking-widest">
              <History size={16} strokeWidth={2.5} /> Lịch sử biến động
           </button>
        </div>
      </div>

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-neo-purple/10 border-neo border-black rounded-xl shadow-neo flex flex-col justify-between">
           <span className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-4">Master Catalog</span>
           <div className="flex items-baseline gap-3">
             <h3 className="text-5xl font-black text-black italic tabular-nums">{stats.totalTypes}</h3>
             <span className="text-xs font-black text-black/60 uppercase italic">SKUs</span>
           </div>
        </div>

        <div className={cn(
          "p-8 border-neo border-black rounded-xl shadow-neo flex flex-col justify-between transition-all duration-500",
          stats.lowStock > 0 ? "bg-neo-red/20 animate-pulse" : "bg-neo-green/10"
        )}>
           <span className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2 mb-4">
             <AlertTriangle size={14} strokeWidth={3} /> Critical Stock Alert
           </span>
           <div className="flex items-baseline gap-3">
             <h3 className="text-5xl font-black text-black italic tabular-nums">{stats.lowStock}</h3>
             <span className="text-xs font-black text-black/60 uppercase italic">Reorder Required</span>
           </div>
        </div>

        <div className="p-8 bg-white border-neo border-black rounded-xl shadow-neo flex flex-col justify-between group">
           <span className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-4">Total Asset Valuation</span>
           <div className="flex items-baseline gap-2">
             <h3 className="text-4xl font-black text-black italic tracking-tighter tabular-nums">
               {stats.totalValue.toLocaleString()}
             </h3>
             <span className="text-[10px] font-black text-black/40 uppercase">VND</span>
           </div>
        </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="neo-card !p-0 overflow-hidden">
        <div className="p-6 md:p-8 border-b-2 border-black flex flex-col md:flex-row justify-between items-center gap-6 bg-neo-purple/5">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <Layers size={24} className="text-black" />
              </div>
              <div>
                <h2 className="text-xl font-black text-black uppercase italic tracking-tight">Sổ cái Tồn kho</h2>
                <p className="text-[10px] text-black/40 font-black uppercase tracking-widest mt-0.5">Live Inventory Ledger</p>
              </div>
           </div>
           <div className="w-full md:w-80 relative group/field">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Tìm mã hoặc tên vật tư..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-12 h-14"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-black text-[10px] font-black uppercase tracking-widest">
                          <th className="px-6 py-4 border-b-2 border-black !text-white">Vật tư / Kho</th>
                          <th className="px-6 py-4 border-b-2 border-black !text-white">Loại</th>
                          <th className="px-6 py-4 text-center border-b-2 border-black !text-white">Đơn vị</th>
                          <th className="px-6 py-4 text-center border-b-2 border-black !text-white">Số lượng</th>
                          <th className="px-6 py-4 text-center border-b-2 border-black !text-white">Trạng thái</th>
                          <th className="px-6 py-4 text-center border-b-2 border-black !text-white w-32">Quản lý</th>
                       </tr>
                    </thead>
            <tbody className="divide-y-2 divide-black/5">
              {filteredMaterials.map((m) => {
                const isUnderStock = m.stockQuantity < m.minStock;
                const isNearStock = m.stockQuantity < m.minStock * 1.1 && !isUnderStock;
                const isExpanded = expandedMaterialId === m.id;
                
                return (
                  <React.Fragment key={m.id}>
                    <tr className={cn(
                      "hover:bg-neo-purple/5 transition-all group cursor-pointer",
                      isExpanded && "bg-neo-purple/10"
                    )} onClick={() => toggleExpand(m.id)}>
                      <td className="px-8 py-6">
                         <span className="px-3 py-1 bg-black text-white text-[10px] font-black rounded-lg uppercase tracking-widest italic">
                            {m.sku}
                         </span>
                      </td>
                      <td className="px-8 py-6">
                         <p className="font-black text-black uppercase italic tracking-tight">{m.name}</p>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <span className={cn(
                            "text-xl font-black tabular-nums tracking-tighter italic",
                            isUnderStock ? "text-neo-red" : isNearStock ? "text-amber-600" : "text-neo-green-pure text-green-600"
                         )}>
                            {m.stockQuantity.toLocaleString()} <span className="text-[9px] font-black text-black/40 uppercase ml-0.5">{m.unit}</span>
                         </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <span className="text-[11px] font-black text-black/20 tracking-widest uppercase">
                            {m.minStock} {m.unit}
                         </span>
                      </td>
                      <td className="px-8 py-6">
                         <div className="flex justify-center">
                            {isUnderStock ? (
                               <div className="px-4 py-1.5 bg-neo-red text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 italic">
                                  <AlertTriangle size={12} strokeWidth={3} className="animate-pulse" />
                                  <span>Cần nhập gấp</span>
                               </div>
                            ) : isNearStock ? (
                               <div className="px-4 py-1.5 bg-neo-yellow text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 italic">
                                  <TrendingUp size={12} strokeWidth={3} />
                                  <span>Sắp hết</span>
                               </div>
                            ) : (
                               <div className="px-4 py-1.5 bg-neo-green text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 italic">
                                  <Package size={12} strokeWidth={3} />
                                  <span>Dồi dào</span>
                               </div>
                            )}
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <button className={cn(
                           "w-10 h-10 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                           isExpanded && "bg-black text-white rotate-180"
                         )}>
                            <ChevronDown size={20} strokeWidth={3} />
                         </button>
                      </td>
                    </tr>
                    
                    {/* BATCH DETAILS */}
                    {isExpanded && (
                      <tr className="bg-black/5 animate-in slide-in-from-top-1 duration-300">
                        <td colSpan={6} className="px-8 py-10">
                          <div className="space-y-8 max-w-6xl mx-auto">
                            <div className="flex items-center gap-4">
                              <h4 className="text-[11px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-3">
                                <Activity size={18} strokeWidth={3} className="text-black" /> 
                                FIFO BATCH ALLOCATION
                              </h4>
                              <div className="h-0.5 flex-1 bg-black/10 border-t-2 border-black border-dashed" />
                            </div>

                            {loadingBatches === m.id ? (
                              <div className="flex flex-col items-center gap-4 py-12">
                                <Loader2 size={40} className="animate-spin text-black opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-black/20">Accessing warehouse data...</p>
                              </div>
                            ) : batches[m.id]?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {batches[m.id].map((batch) => (
                                  <div key={batch.id} className="bg-white border-2 border-black rounded-xl p-6 shadow-neo-sm hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo transition-all group relative">
                                    <div className="flex justify-between items-start mb-6">
                                      <div>
                                        <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1.5 leading-none">Mã Lô</p>
                                        <p className="text-sm font-black text-black tracking-widest italic">{batch.batchCode}</p>
                                      </div>
                                      <div className="px-3 py-1 bg-black text-white rounded-lg text-[8px] font-black uppercase tracking-widest italic">
                                        FIFO Stack
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-8 mb-6">
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-black text-black/40 uppercase tracking-widest leading-none">Tồn lô</p>
                                        <p className="text-2xl font-black text-black tabular-nums italic">
                                          {Number(batch.remainQuantity).toLocaleString()} <span className="text-[9px] uppercase font-black text-black/40">{m.unit}</span>
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-[9px] font-black text-black/40 uppercase tracking-widest leading-none">Vị trí</p>
                                        <p className="text-[11px] font-black text-black flex items-center gap-2 uppercase italic">
                                          <MapPin size={12} strokeWidth={3} className="text-black" />
                                          {batch.location || 'KHU A'}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t-2 border-black border-dashed flex justify-between items-center bg-black/5 -mx-6 -mb-6 p-4 rounded-b-xl">
                                      <div className="flex items-center gap-2 opacity-50">
                                        <Calendar size={12} strokeWidth={3} />
                                        <span className="text-[10px] font-black uppercase tracking-tight">{new Date(batch.createdAt).toLocaleDateString('vi-VN')}</span>
                                      </div>
                                      <div className="text-black font-black tracking-tighter italic text-xs">
                                        {Number(batch.purchasePrice).toLocaleString()} đ
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-white p-16 rounded-xl border-2 border-black border-dashed text-center">
                                <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.4em] italic leading-loose">No active batches detected in FIFO stack</p>
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
