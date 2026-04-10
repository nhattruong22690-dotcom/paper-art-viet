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
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { createBatchWorkLogs } from '@/services/workLog.service';
import { useNotification } from "@/context/NotificationContext";

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
      showToast('warning', 'Vui lòng chọn nhân viên và nhập số lượng.');
      return;
    }

    setIsSaving(true);
    try {
      await createBatchWorkLogs(
        validEntries.map(e => ({
          productionOrderId,
          employeeId: e.userId,
          quantityProduced: Number(e.quantityProduced),
          technicalErrorCount: Number(e.technicalErrorCount),
          materialErrorCount: Number(e.materialErrorCount),
          errorNote: e.errorNote
        })),
        []
      );
      
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
    <div className="fixed inset-0 lg:left-[var(--sidebar-width)] z-[500] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 md:px-8 md:py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               <History size={20} className="text-blue-600" />
               Khai báo Sản lượng
            </h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5 opacity-80">
               <Package size={14} /> {orderName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <div 
                key={entry.id} 
                className="bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col md:flex-row gap-6 items-start md:items-end group relative"
              >
                <div className="w-6 h-6 absolute -left-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-[10px] shadow-md z-10 transition-transform group-hover:scale-110">
                   {index + 1}
                </div>

                <div className="flex-1 space-y-1.5 min-w-[200px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Thợ vận hành</label>
                  <div className="relative">
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all appearance-none shadow-sm"
                      value={entry.userId}
                      onChange={(e) => updateEntry(entry.id, 'userId', e.target.value)}
                    >
                      <option value="">-- CHỌN NHÂN VIÊN --</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center block">Sản lượng</label>
                    <input 
                      type="number"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2.5 text-center text-sm font-bold text-slate-900 focus:border-blue-500 outline-none transition-all shadow-sm"
                      value={entry.quantityProduced || ''}
                      placeholder="0"
                      onChange={(e) => updateEntry(entry.id, 'quantityProduced', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-rose-600 uppercase tracking-widest text-center block">Lỗi KT</label>
                    <input 
                      type="number"
                      className="w-full bg-rose-50 border border-rose-100 rounded-lg py-2.5 text-center text-sm font-bold text-rose-700 focus:bg-white focus:border-rose-500 outline-none transition-all shadow-sm"
                      value={entry.technicalErrorCount || ''}
                      placeholder="0"
                      onChange={(e) => updateEntry(entry.id, 'technicalErrorCount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center block">Lỗi VT</label>
                    <input 
                      type="number"
                      className="w-full bg-white border border-slate-200 rounded-lg py-2.5 text-center text-sm font-bold text-slate-600 focus:border-blue-500 outline-none transition-all shadow-sm"
                      value={entry.materialErrorCount || ''}
                      placeholder="0"
                      onChange={(e) => updateEntry(entry.id, 'materialErrorCount', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex-1 space-y-1.5 min-w-[180px]">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ghi chú</label>
                  <input 
                    type="text"
                    className="w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4 text-xs font-medium text-slate-700 outline-none focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-300"
                    placeholder="Mô tả nhanh..."
                    value={entry.errorNote}
                    onChange={(e) => updateEntry(entry.id, 'errorNote', e.target.value)}
                  />
                </div>

                <button 
                  onClick={() => handleRemoveRow(entry.id)}
                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all mb-0.5"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button
              onClick={handleAddRow}
              className="w-full py-6 bg-slate-50 border-2 border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all group"
            >
              <Plus size={24} strokeWidth={2.5} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Thêm dòng báo cáo</span>
            </button>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 md:px-8 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
           <button
             onClick={onClose}
             className="px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all font-sans"
           >
             Hủy bỏ
           </button>
           <button
             onClick={handleSave}
             disabled={isSaving}
             className="flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-200 text-xs font-bold uppercase tracking-wider hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 font-sans"
           >
             {isSaving ? (
               <Loader2 className="animate-spin" size={16} />
             ) : (
               <Save size={16} />
             )}
             {isSaving ? 'Đang lưu...' : 'Xác nhận Báo cáo'}
           </button>
        </div>
      </div>
    </div>
  );
}
