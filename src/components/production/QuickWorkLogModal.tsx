"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  X,
  CheckCircle2,
  Loader2,
  Package,
  FileText,
  User,
  History,
  AlertCircle
} from 'lucide-react';
import { createBatchWorkLogs } from '@/services/workLog.service';
import { useNotification } from "@/context/NotificationContext";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Worker {
  id: string;
  name: string;
}

interface LogEntry {
  id: string;
  userId: string;
  quantityProduced: number;
  technicalErrorCount: number;
  materialErrorCount: number;
  errorNote: string;
}

interface QuickWorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  productionOrderId: string;
  orderName: string;
  onSuccess: () => void;
}

export default function QuickWorkLogModal({
  isOpen,
  onClose,
  productionOrderId,
  orderName,
  onSuccess
}: QuickWorkLogModalProps) {
  const { showToast, showModal } = useNotification();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [entries, setEntries] = useState<LogEntry[]>([{
      id: Math.random().toString(36).substr(2, 9),
      userId: '',
      quantityProduced: 0,
      technicalErrorCount: 0,
      materialErrorCount: 0,
      errorNote: ''
  }]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Fetch workers on mount
  useEffect(() => {
    async function fetchWorkers() {
      try {
        const res = await fetch('/api/production/workers');
        const data = await res.json();
        setWorkers(data);
      } catch (error) {
        console.error("Error fetching workers:", error);
      }
    }
    if (isOpen) {
      fetchWorkers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    setEntries(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      userId: '',
      quantityProduced: 0,
      technicalErrorCount: 0,
      materialErrorCount: 0,
      errorNote: ''
    }]);
  };

  const handleRemoveRow = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof LogEntry, value: any) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSave = async () => {
    const validEntries = entries.filter(e => e.userId && (e.quantityProduced > 0 || e.technicalErrorCount > 0 || e.materialErrorCount > 0));
    
    if (validEntries.length === 0) {
      showModal('error', 'Dữ liệu trống', 'Vui lòng chọn nhân viên và nhập số lượng sản xuất hoặc lỗi.');
      return;
    }

    setIsSaving(true);
    try {
      await createBatchWorkLogs({
        productionOrderId,
        logs: validEntries.map(e => ({
          userId: e.userId,
          quantityProduced: Number(e.quantityProduced),
          technicalErrorCount: Number(e.technicalErrorCount),
          materialErrorCount: Number(e.materialErrorCount),
          errorNote: e.errorNote
        }))
      });
      
      showToast('success', 'Đã lưu nhật trình sản xuất thành công');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Save failed:", error);
      showModal('error', 'Lỗi lưu dữ liệu', error.message || 'Không thể lưu nhật trình. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-retro-sepia/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] retro-card !p-0 shadow-[0_30px_60px_-15px_rgba(62,39,35,0.6)] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border-2">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <History size={400} strokeWidth={0.5} className="text-retro-sepia" />
        </div>

        {/* HEADER */}
        <div className="p-8 md:p-14 border-b-2 border-retro-sepia/10 flex justify-between items-center bg-retro-paper/40 relative shrink-0">
          <div className="relative z-10 font-typewriter">
            <h3 className="text-3xl font-black text-retro-sepia tracking-tighter italic uppercase underline decoration-double decoration-retro-mustard/30 underline-offset-8">
               Khai báo <span className="text-retro-brick">Sản lượng</span>
            </h3>
            <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] mt-6 italic flex items-center gap-3 opacity-60">
               <Package size={16} strokeWidth={1.5} className="text-retro-mustard" /> {orderName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-5 bg-retro-paper border-2 border-retro-sepia/10 hover:bg-retro-brick/10 hover:text-retro-brick transition-all rotate-2 hover:rotate-0 shadow-sm"
          >
            <X size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 md:p-14 scrollbar-hide bg-retro-paper/30 pb-32">
          <div className="space-y-10">
            {entries.map((entry, index) => (
              <div 
                key={entry.id} 
                className="bg-white border-2 border-retro-sepia/5 p-8 shadow-sm flex flex-col md:flex-row gap-10 items-start md:items-end animate-in slide-in-from-top-4 duration-300 relative group"
              >
                <div className="w-10 h-10 absolute -left-5 top-1/2 -translate-y-1/2 bg-retro-sepia text-retro-paper flex items-center justify-center font-black text-xs rotate-3 shadow-lg z-10">
                   {index + 1}
                </div>

                <div className="flex-1 space-y-3 font-typewriter min-w-[240px]">
                  <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60 flex items-center gap-3">
                     <User size={14} className="text-retro-mustard" /> Thợ vận hành
                  </label>
                  <select 
                    className="w-full px-6 py-4 bg-retro-paper border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia appearance-none shadow-inner"
                    value={entry.userId}
                    onChange={(e) => updateEntry(entry.id, 'userId', e.target.value)}
                  >
                    <option value="">LỰA CHỌN NHÂN SỰ...</option>
                    {workers.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-6 w-full md:w-auto font-typewriter">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-retro-moss/60 uppercase tracking-widest text-center italic">Đạt chuẩn</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-4 bg-white border-2 border-retro-sepia/10 text-center text-sm font-black text-retro-moss outline-none focus:border-retro-moss shadow-inner italic"
                      value={entry.quantityProduced || ''}
                      placeholder="0"
                      onChange={(e) => updateEntry(entry.id, 'quantityProduced', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-retro-brick/60 uppercase tracking-widest text-center italic">Lỗi k.nghệ</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-4 bg-white border-2 border-retro-brick/10 text-center text-sm font-black text-retro-brick outline-none focus:border-retro-brick shadow-inner italic"
                      value={entry.technicalErrorCount || ''}
                      placeholder="0"
                      onChange={(e) => updateEntry(entry.id, 'technicalErrorCount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-retro-earth/40 uppercase tracking-widest text-center italic">Lỗi v.liệu</label>
                    <input 
                      type="number"
                      className="w-full px-4 py-4 bg-white border-2 border-retro-sepia/10 text-center text-sm font-black text-retro-earth outline-none focus:border-retro-sepia shadow-inner italic"
                      value={entry.materialErrorCount || ''}
                      placeholder="0"
                      onChange={(e) => updateEntry(entry.id, 'materialErrorCount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-3 font-typewriter min-w-[200px]">
                  <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Ghi chú đặc hưu</label>
                  <input 
                    type="text"
                    className="w-full px-6 py-4 bg-retro-paper/20 border-2 border-dashed border-retro-sepia/10 text-xs font-bold text-retro-earth outline-none focus:border-retro-mustard placeholder:italic placeholder:font-normal"
                    placeholder="Mô tả nguyên nhân (nếu có)..."
                    value={entry.errorNote}
                    onChange={(e) => updateEntry(entry.id, 'errorNote', e.target.value)}
                  />
                </div>

                <div className="h-full flex items-end">
                   <button 
                    onClick={() => handleRemoveRow(entry.id)}
                    className="p-4 text-retro-brick/20 hover:text-retro-brick hover:bg-retro-brick/5 transition-all mb-1"
                   >
                     <Trash2 size={20} strokeWidth={2.5} />
                   </button>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddRow}
              className="w-full py-8 bg-white/40 border-4 border-dashed border-retro-sepia/10 flex flex-col items-center justify-center gap-4 text-retro-sepia/40 hover:text-retro-sepia hover:border-retro-sepia transition-all group font-typewriter"
            >
              <Plus size={32} strokeWidth={1} className="group-hover:rotate-90 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] italic">Thêm dòng Nhật trình</span>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-10 md:p-14 bg-white/60 border-t-2 border-retro-sepia/10 flex justify-between gap-8 relative z-20 font-typewriter">
           <button
             onClick={onClose}
             className="px-10 py-5 bg-retro-paper border-2 border-retro-sepia/10 text-[11px] font-black uppercase tracking-[0.2em] text-retro-earth/60 hover:text-retro-sepia hover:border-retro-sepia transition-all italic active:scale-95"
           >
             Hủy bỏ Nhật trình
           </button>
           <button
             onClick={handleSave}
             disabled={isSaving}
             className="flex-1 md:flex-none flex items-center justify-center gap-6 px-16 py-5 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all disabled:opacity-50 active:scale-95 italic"
           >
             {isSaving ? (
               <Loader2 className="animate-spin" size={20} strokeWidth={2.5} />
             ) : (
               <Save size={20} strokeWidth={2.5} />
             )}
             {isSaving ? 'Đang hạ bút...' : 'Xác nhận Báo cáo Sản lượng'}
           </button>
        </div>
        <div className="torn-paper-bottom" />
      </div>
    </div>
  );
}
