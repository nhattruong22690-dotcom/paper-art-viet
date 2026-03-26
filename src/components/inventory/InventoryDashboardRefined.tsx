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
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-foreground">Số dư tồn kho</h2>
          <p className="text-muted-text text-sm">Cập nhật vật tư thực tế trong kho</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary gap-2 text-xs">
            <Filter size={16} /> Bộ lọc
          </button>
          <button className="btn-primary gap-2 text-xs">
            <Plus size={16} /> Nhập vật tư
          </button>
        </div>
      </header>

      {/* CỘT CHÍNH - CARD GRID VIEW (3-4 CỘT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {materials.map((m, i) => {
          const isShort = m.current < m.required;
          const progress = Math.min(100, (m.current / m.required) * 100);
          const statusColor = progress < 50 ? 'red' : progress < 90 ? 'amber' : 'green';
          
          return (
            <div 
              key={i} 
              onClick={() => setSelectedMaterial(m)}
              className="bg-white p-6 rounded-lg border border-border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[220px]"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-2 rounded bg-${statusColor}-50 text-${statusColor}-600 border border-${statusColor}-100`}>
                    {isShort ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  <button className="p-1 text-gray-300 group-hover:text-primary transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-foreground leading-tight mb-4">
                  {m.name}
                </h4>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hiện có</p>
                      <p className={`text-xl font-bold ${isShort ? 'text-red-600' : 'text-green-600'}`}>
                        {m.current} <span className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{m.unit}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Định mức</p>
                      <p className="text-sm font-bold text-foreground">
                        {m.required} <span className="text-[10px] text-muted-foreground uppercase ml-1">{m.unit}</span>
                      </p>
                    </div>
                  </div>

                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${
                        statusColor === 'red' ? 'bg-red-500' : 
                        statusColor === 'amber' ? 'bg-amber-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {isShort && (
                <p className="text-[9px] font-bold text-red-600 mt-4 uppercase tracking-tight flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                  Thiếu: {m.required - m.current} {m.unit}
                </p>
              )}
            </div>
          );
        })}

        {/* THẺ THÊM MỚI */}
        <div className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center p-6 bg-gray-50/50 group cursor-pointer hover:bg-gray-50 transition-all min-h-[220px]">
          <div className="w-10 h-10 bg-white rounded border border-border flex items-center justify-center text-gray-300 group-hover:text-primary shadow-sm transition-all mb-3">
            <Plus size={20} />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Thêm vật tư</p>
        </div>
      </div>

      {/* FIXED MODAL */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] p-4">
          <div className="bg-white max-w-lg w-full rounded-lg shadow-xl overflow-hidden animate-in zoom-in duration-300">
            
            {/* MODAL HEADER */}
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-foreground">
                Chi tiết vật tư
              </h2>
              <button 
                onClick={() => setSelectedMaterial(null)}
                className="p-2 text-gray-400 hover:text-foreground transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {selectedMaterial.name}
                </h3>
                <div className="flex gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-widest border border-primary/20">{selectedMaterial.status}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-muted-foreground rounded-full uppercase tracking-widest border border-border">{selectedMaterial.supplier}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Định mức</p>
                  <p className="text-xl font-bold text-foreground">{selectedMaterial.required} <span className="text-xs text-muted-foreground uppercase">{selectedMaterial.unit}</span></p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-[10px] font-bold text-primary uppercase mb-1">Hiện có</p>
                  <p className="text-xl font-bold text-primary">{selectedMaterial.current} <span className="text-xs text-primary/60 uppercase">{selectedMaterial.unit}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Nhật ký nhập kho
                </h5>
                <div className="space-y-2">
                  {[
                    { date: '21/03', qty: '+50', from: 'Supplier A', status: 'Xong' },
                    { date: '15/03', qty: '+100', from: 'Kho trung tâm', status: 'Xong' },
                  ].map((log, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-foreground">{log.date}</span>
                        <div>
                          <p className="text-xs font-bold text-green-600">{log.qty}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">{log.from}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-gray-50 border-t border-border flex gap-3">
               <button className="btn-primary flex-1 gap-2">
                 <ShoppingBag size={18} /> Đặt hàng nhanh
               </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
