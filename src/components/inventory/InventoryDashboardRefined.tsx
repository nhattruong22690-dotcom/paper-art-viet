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
    <div className="space-y-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Kiểm soát Vật tư</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest italic">Paper Art Việt - Materials Hub</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-xs uppercase tracking-widest text-gray-600">
            <Filter size={18} /> Lọc vật tư
          </button>
        </div>
      </header>

      {/* CỘT CHÍNH - CARD GRID VIEW (3-4 CỘT) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {materials.map((m, i) => {
          const isShort = m.current < m.required;
          const progress = Math.min(100, (m.current / m.required) * 100);
          const statusColor = progress < 50 ? 'rose' : progress < 90 ? 'amber' : 'emerald';
          
          return (
            <div 
              key={i} 
              onClick={() => setSelectedMaterial(m)}
              className="card-refined p-8 group cursor-pointer border-2 border-transparent hover:border-primary-100 hover:bg-primary-50/5 transition-all duration-500 relative flex flex-col justify-between min-h-[280px]"
            >
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div className={`p-3 rounded-2xl bg-${statusColor}-50 text-${statusColor}-600 shadow-sm`}>
                    {isShort ? <AlertCircle size={22} /> : <CheckCircle2 size={22} />}
                  </div>
                  <button className="p-2 text-gray-300 group-hover:text-primary-500 transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>

                <h4 className="text-sm font-black text-gray-900 leading-tight mb-6 uppercase tracking-tight pr-4">
                  {m.name}
                </h4>

                <div className="space-y-5">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hiện có</p>
                      <p className={`text-xl font-black italic tracking-tighter ${isShort ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {m.current} <span className="text-[10px] not-italic text-gray-400 uppercase ml-1">{m.unit}</span>
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cần thiết</p>
                      <p className="text-sm font-bold text-gray-900 tracking-tight">
                        {m.required} <span className="text-[10px] text-gray-400 uppercase ml-1">{m.unit}</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${
                          statusColor === 'rose' ? 'bg-rose-500' : 
                          statusColor === 'amber' ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {isShort && (
                <p className="text-[9px] font-black text-rose-500 mt-6 uppercase italic tracking-tighter flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  Thiếu hụt: {m.required - m.current} {m.unit}
                </p>
              )}
            </div>
          );
        })}

        {/* THẺ THÊM MỚI (DASHED) */}
        <div className="border-2 border-dashed border-gray-100 rounded-[32px] flex flex-col items-center justify-center p-8 bg-gray-50/10 group cursor-pointer hover:bg-gray-50/40 hover:border-primary-200 transition-all min-h-[280px]">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-primary-500 shadow-sm transition-all mb-4 border border-gray-50">
            <Plus size={24} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-primary-600">Thêm vật tư</p>
        </div>
      </div>

      {/* MODAL CỐ ĐỊNH (FIXED MODAL) - HIỂN THỊ CHI TIẾT VẬT TƯ */}
      {selectedMaterial && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-end z-[100] transition-all p-4 lg:p-0">
          <div className="bg-white h-full lg:h-screen w-full lg:w-[500px] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col lg:rounded-l-[40px]">
            
            {/* MODAL HEADER */}
            <div className="p-10 flex justify-between items-start shrink-0">
              <div className="bg-primary-50 p-4 rounded-3xl text-primary-600">
                <Info size={32} />
              </div>
              <button 
                onClick={() => setSelectedMaterial(null)}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-10">
              <div>
                <h2 className="text-3xl font-black text-gray-900 leading-tight uppercase mb-2 tracking-tight">
                  {selectedMaterial.name}
                </h2>
                <div className="flex gap-2">
                  <span className="text-[10px] font-black px-3 py-1 bg-gray-900 text-white rounded-full uppercase tracking-widest">#{selectedMaterial.status}</span>
                  <span className="text-[10px] font-black px-3 py-1 bg-gray-100 text-gray-400 rounded-full uppercase tracking-widest italic">{selectedMaterial.supplier}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-gray-50 rounded-[32px]">
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Cần thiết</p>
                  <p className="text-2xl font-black tracking-tight">{selectedMaterial.required} <span className="text-xs text-gray-400 uppercase">{selectedMaterial.unit}</span></p>
                </div>
                <div className="p-6 bg-gray-900 rounded-[32px]">
                  <p className="text-[10px] font-black text-primary-400 uppercase mb-2">Hiện có</p>
                  <p className="text-2xl font-black text-white tracking-tight">{selectedMaterial.current} <span className="text-xs text-white/50 uppercase">{selectedMaterial.unit}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Nhật ký nhập kho gần nhất
                </h5>
                <div className="space-y-3">
                  {[
                    { date: '21/03', qty: '+50 units', from: 'Supplier A', status: 'Done' },
                    { date: '15/03', qty: '+100 units', from: 'Internal Transfer', status: 'Done' },
                  ].map((log, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-gray-50 group hover:px-2 transition-all cursor-pointer">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-black text-gray-900">{log.date}</span>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase">{log.qty}</p>
                          <p className="text-[9px] text-gray-400 italic">Source: {log.from}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-primary-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="p-10 border-t border-gray-50 bg-gray-50/30 flex gap-4 shrink-0">
               <button className="flex-1 py-5 bg-primary-600 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-500 transition-all flex items-center justify-center gap-3">
                 <ShoppingBag size={20} /> Đặt hàng nhanh
               </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
