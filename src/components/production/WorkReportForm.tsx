"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  FileText, 
  AlertCircle, 
  CheckCircle2,
  X,
  ChevronRight,
  Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotification } from "@/context/NotificationContext";
import { useScrollLock } from "@/hooks/useScrollLock";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WorkReportFormProps {
  productionOrderId: string;
  sku: string;
  productName: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function WorkReportForm({ productionOrderId, sku, productName, onClose, onSubmit }: WorkReportFormProps) {
  const { showToast } = useNotification();
  const [qty, setQty] = useState<number>(0);
  const [techErrors, setTechErrors] = useState<number>(0);
  const [matErrors, setMatErrors] = useState<number>(0);
  const [note, setNote] = useState('');
  const [errorNote, setErrorNote] = useState('');

  const totalErrors = techErrors + matErrors;
  const errorRate = qty > 0 ? (totalErrors / qty) * 100 : 0;
  const isHighError = errorRate > 5;
  
  useScrollLock(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isHighError && !errorNote.trim()) {
      showToast('warning', "Bạn cần nhập ghi chú lý do vì tổng tỉ lệ lỗi vượt quá 5%!");
      return;
    }
    
    onSubmit({
      productionOrderId,
      quantityProduced: qty,
      technicalErrorCount: techErrors,
      materialErrorCount: matErrors,
      note,
      errorNote: isHighError ? errorNote : (errorNote || null)
    });
  };

  return (
    <div className="fixed inset-0 lg:left-[var(--sidebar-width)] z-[500] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl border border-gray-100 flex flex-col animate-in zoom-in-95 duration-500 overflow-hidden">
        <header className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
           <div>
             <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
               <FileText size={20} className="text-primary-600" /> Báo cáo sản lượng
             </h2>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{sku} - {productName}</p>
           </div>
           <button onClick={onClose} className="p-3 bg-white hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all shadow-sm border border-gray-100">
             <X size={20} strokeWidth={3} />
           </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {/* PRODUCTION QUANTITY */}
          <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Số lượng hoàn thành (PCS)</label>
             <input 
               type="number" 
               required
               value={qty || ''}
               onChange={(e) => setQty(parseInt(e.target.value) || 0)}
               placeholder="Nhập số lượng..."
               className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6 text-xl font-black text-gray-900 outline-none focus:bg-white focus:border-primary-200 transition-all"
             />
          </div>

          {/* ERRORS GRID */}
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-3">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                  <Settings size={12} /> Lỗi Thao tác (🛠️)
                </label>
                <input 
                  type="number" 
                  value={techErrors || ''}
                  onChange={(e) => setTechErrors(parseInt(e.target.value) || 0)}
                  className="w-full bg-rose-50/30 border border-rose-100 rounded-2xl py-4 px-6 text-lg font-black text-rose-600 outline-none focus:bg-white focus:border-rose-200 transition-all"
                />
             </div>
             <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-2">
                  <FileText size={12} /> Lỗi Nguyên liệu (📄)
                </label>
                <input 
                  type="number" 
                  value={matErrors || ''}
                  onChange={(e) => setMatErrors(parseInt(e.target.value) || 0)}
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 px-6 text-lg font-black text-gray-600 outline-none focus:bg-white focus:border-gray-200 transition-all"
                />
             </div>
          </div>

          {/* HIGH ERROR WARNING & NOTE */}
          {isHighError && (
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[24px] space-y-4 animate-in slide-in-from-top-4 duration-500">
               <div className="flex items-center gap-3 text-amber-700">
                  <AlertCircle size={20} strokeWidth={3} />
                  <p className="text-xs font-black uppercase tracking-tight">Cảnh báo: Tỉ lệ lỗi cao ({errorRate.toFixed(1)}%)</p>
               </div>
               <p className="text-[11px] text-amber-600/80 font-medium">Hệ thống yêu cầu giải trình lý do cụ thể cho ca làm việc này.</p>
               <textarea 
                  required
                  placeholder="Nhập lý do lỗi chi tiết..."
                  value={errorNote}
                  onChange={(e) => setErrorNote(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-amber-200 h-24 transition-all"
               />
            </div>
          )}

          {/* GENERAL NOTE */}
          <div className="space-y-3">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Ghi chú chung (Không bắt buộc)</label>
             <textarea 
               value={note}
               onChange={(e) => setNote(e.target.value)}
               placeholder="Nhập ghi chú thêm..."
               className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 text-sm outline-none focus:bg-white focus:border-primary-100 h-24 transition-all"
             />
          </div>
        </form>

        <footer className="p-8 bg-gray-50/50 border-t border-gray-50 flex gap-4">
           <button 
             type="button"
             onClick={onClose}
             className="flex-1 py-4 bg-white border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all"
           >
             Hủy bỏ
           </button>
           <button 
             onClick={handleSubmit}
             className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all active:scale-95 flex items-center justify-center gap-3"
           >
             <CheckCircle2 size={18} /> Xác nhận báo cáo
           </button>
        </footer>
      </div>
    </div>
  );
}
