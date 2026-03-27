"use client";

import React, { useState } from 'react';
import { 
  ShoppingBag, 
  ArrowUpRight, 
  AlertCircle, 
  CheckCircle2,
  ChevronRight,
  Filter,
  Plus,
  X,
  History,
  Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const materials = [
  { 
    name: 'Giấy Mỹ Thuật 250gsm (Đỏ)', 
    required: 500, 
    current: 450, 
    unit: 'tờ',
    status: 'low',
    lastImport: '2026-03-20',
    supplier: 'Paper Art Supplies Ltd'
  },
  { 
    name: 'Keo sữa chuyên dụng (3M)', 
    required: 10, 
    current: 15, 
    unit: 'lít',
    status: 'ok',
    lastImport: '2026-03-21',
    supplier: '3M Vietnam'
  },
  { 
    name: 'Mực in Offset (Gold)', 
    required: 5, 
    current: 2, 
    unit: 'kg',
    status: 'critical',
    lastImport: '2026-03-15',
    supplier: 'InkTec Global'
  },
];

export default function InventoryDashboard() {
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight uppercase">Số dư tồn kho</h2>
          <p className="text-black/60 text-xs font-bold uppercase tracking-widest mt-1 italic">Cập nhật vật tư thực tế trong kho</p>
        </div>
        <div className="flex gap-4">
          <button className="btn-secondary h-14 px-10 text-[11px] uppercase tracking-[0.2em] font-black">
            <Filter size={18} /> Bộ lọc
          </button>
          <button className="btn-primary btn-confirm-flash h-14 px-10 text-[11px] uppercase tracking-[0.2em] font-black">
            <Plus size={18} /> Nhập vật tư
          </button>
        </div>
      </header>

      {/* CỘT CHÍNH - CARD GRID VIEW (3-4 CỘT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {materials.map((m, i) => {
          const isShort = m.current < m.required;
          const progress = Math.min(100, (m.current / m.required) * 100);
          const statusColor = progress < 50 ? 'neo-red' : progress < 90 ? 'neo-yellow' : 'neo-mint';
          
          return (
            <div 
              key={i} 
              onClick={() => setSelectedMaterial(m)}
              className="neo-card flex flex-col justify-between min-h-[280px] group transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={cn(
                    "w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
                    statusColor === 'neo-red' ? 'bg-neo-red' : statusColor === 'neo-yellow' ? 'bg-neo-yellow' : 'bg-neo-mint'
                  )}>
                    {isShort ? <AlertCircle size={22} className="text-black" /> : <CheckCircle2 size={22} className="text-black" />}
                  </div>
                  <button className="p-2 text-black/20 group-hover:text-black transition-all">
                    <ChevronRight size={24} />
                  </button>
                </div>

                <h4 className="text-lg font-black text-black leading-none uppercase tracking-tight mb-6">
                  {m.name}
                </h4>

                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Hiện có</p>
                      <p className={cn(
                        "text-2xl font-black italic tracking-tighter",
                        isShort ? 'text-black underline decoration-neo-red decoration-4' : 'text-black'
                      )}>
                        {m.current} <span className="text-[10px] font-black text-black/40 uppercase ml-1 not-italic tracking-widest">{m.unit}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Định mức</p>
                      <p className="text-sm font-black text-black">
                        {m.required} <span className="text-[10px] text-black/40 uppercase ml-1 tracking-widest">{m.unit}</span>
                      </p>
                    </div>
                  </div>

                  <div className="h-3 bg-black/5 rounded border-2 border-black overflow-hidden shadow-inner">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 border-r-2 border-black",
                        statusColor === 'neo-red' ? 'bg-neo-red' : 
                        statusColor === 'neo-yellow' ? 'bg-neo-yellow' : 'bg-neo-mint'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {isShort && (
                <div className="mt-8 p-3 bg-neo-red/10 border-2 border-dashed border-black rounded-lg">
                  <p className="text-[10px] font-black text-black uppercase tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-neo-red border-2 border-black animate-pulse" />
                    Thiếu: {m.required - m.current} {m.unit}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* THẺ THÊM MỚI */}
        <div className="neo-card !bg-black/5 border-dashed border-black flex flex-col items-center justify-center p-8 group cursor-pointer hover:bg-white transition-all min-h-[280px]">
          <div className="w-14 h-14 bg-white rounded-xl border-neo border-black flex items-center justify-center text-black/20 group-hover:text-black shadow-neo transition-all mb-4">
            <Plus size={28} />
          </div>
          <p className="text-[11px] font-black text-black uppercase tracking-[0.2em]">Thêm vật tư</p>
        </div>
      </div>

      {/* FIXED MODAL */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="bg-white max-w-lg w-full rounded-xl border-neo border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* MODAL HEADER */}
            <div className="p-8 border-b-neo border-black flex justify-between items-center bg-neo-purple/5">
              <h2 className="text-xl font-black text-black uppercase tracking-tight">
                Chi tiết <span className="text-neo-purple italic">vật tư</span>
              </h2>
              <button 
                onClick={() => setSelectedMaterial(null)}
                className="w-10 h-10 border-2 border-black rounded-lg flex items-center justify-center text-black hover:bg-neo-red transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-10 space-y-10">
              <div>
                <h3 className="text-3xl font-black text-black uppercase tracking-tighter leading-none mb-4">
                  {selectedMaterial.name}
                </h3>
                <div className="flex flex-wrap gap-3">
                  <span className="text-[10px] font-black px-4 py-1.5 bg-neo-purple text-black rounded border-2 border-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{selectedMaterial.status}</span>
                  <span className="text-[10px] font-black px-4 py-1.5 bg-neo-yellow text-black rounded border-2 border-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">{selectedMaterial.supplier}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-[10px] font-black text-black/40 uppercase mb-2 tracking-widest">Định mức</p>
                  <p className="text-2xl font-black text-black">{selectedMaterial.required} <span className="text-xs text-black/40 uppercase not-italic ml-1">{selectedMaterial.unit}</span></p>
                </div>
                <div className="p-6 bg-neo-purple/10 border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-[10px] font-black text-neo-purple uppercase mb-2 tracking-widest">Hiện có</p>
                  <p className="text-2xl font-black text-black italic">{selectedMaterial.current} <span className="text-xs text-black/40 uppercase not-italic ml-1">{selectedMaterial.unit}</span></p>
                </div>
              </div>

              <div className="space-y-6">
                <h5 className="text-[11px] font-black text-black/40 uppercase tracking-[0.3em] flex items-center gap-3">
                  <History size={16} className="text-black" /> Nhật ký nhập kho
                </h5>
                <div className="space-y-3">
                  {[
                    { date: '21/03', qty: '+50', from: 'Supplier A', status: 'Xong' },
                    { date: '15/03', qty: '+100', from: 'Kho trung tâm', status: 'Xong' },
                  ].map((log, i) => (
                    <div key={i} className="flex justify-between items-center p-4 border-2 border-black rounded-xl group hover:bg-neo-mint/5 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-black uppercase tracking-widest">{log.date}</span>
                        <div>
                          <p className="text-sm font-black text-black italic">{log.qty} <span className="text-[9px] not-italic text-black/40 uppercase ml-1">PCS</span></p>
                          <p className="text-[10px] text-black/40 font-bold uppercase tracking-tight">{log.from}</p>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-black/20 group-hover:text-black transition-all" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-8 bg-black/5 border-t-neo border-black">
               <button className="btn-primary w-full h-16 text-sm uppercase tracking-[0.3em] font-black gap-4">
                 <ShoppingBag size={24} /> Đặt hàng nhanh
               </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
