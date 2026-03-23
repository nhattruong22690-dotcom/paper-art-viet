"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Save, 
  X,
  CheckCircle2
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
      showToast('warning', "Vui lòng nhập ít nhất một dòng log hợp lệ (chọn nhân viên & có sản lượng/lỗi).");
      return;
    }

    setIsSaving(true);
    try {
      const logsToSave = validEntries.map(e => ({
        productionOrderId,
        userId: e.userId,
        staffName: workers.find(w => w.id === e.userId)?.name,
        quantityProduced: e.quantityProduced,
        technicalErrorCount: e.technicalErrorCount,
        materialErrorCount: e.materialErrorCount,
        errorNote: e.errorNote,
        note: 'Ghi chép nhanh từ chi tiết lệnh'
      }));

      // Gọi server action (batchesUsed để mảng rỗng vì đây là ghi chép nhanh)
      await createBatchWorkLogs(logsToSave, []);
      
      showToast('success', `Đã lưu thành công ghi chép báo cáo!`);
      onSuccess(); 
      onClose();
    } catch (error) {
       console.error("Lỗi khi lưu ghi chép nhanh:", error);
       showModal('error', "Không thể lưu báo cáo", String(error));
    } finally {
       setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 animate-in fade-in">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
        
        {/* Modal container */}
        <div className="relative bg-white w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[90vh] overflow-hidden sm:rounded-[32px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-[18px] flex items-center justify-center text-primary-600">
                   <Users size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">
                      Báo cáo Sản lượng
                   </h2>
                   <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest leading-tight">
                     Lệnh: {orderName}
                   </p>
                </div>
             </div>
             
             <button onClick={onClose} className="p-3 bg-white border border-gray-200 hover:bg-gray-100 rounded-2xl text-gray-500 transition-all">
                <X size={20} />
             </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
             <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[700px]">
                      <thead>
                         <tr className="bg-gray-50/80 border-b border-gray-100">
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-12 text-center">#</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[150px]">Nhân viên</th>
                            <th className="px-4 py-4 text-[10px] font-black text-primary-600 uppercase tracking-widest w-32 text-center">Đạt (pcs)</th>
                            <th className="px-4 py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest w-28 text-center" title="Trừ vào KPI">Lỗi Thợ</th>
                            <th className="px-4 py-4 text-[10px] font-black text-amber-500 uppercase tracking-widest w-28 text-center" title="Hao hụt vật tư">Lỗi Giấy</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-[150px]">Ghi chú</th>
                            <th className="px-4 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest w-16 text-center">Hủy</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {entries.map((entry, index) => (
                           <tr key={entry.id} className="hover:bg-primary-50/10 transition-colors">
                              <td className="px-4 py-4 text-center text-[10px] font-black text-gray-300 italic">{index + 1}</td>
                              <td className="px-4 py-4">
                                <select 
                                  value={entry.userId}
                                  onChange={(e) => updateEntry(entry.id, 'userId', e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 px-3 text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-primary-300 transition-all appearance-none input-shadow"
                                >
                                  <option value="">-- Chọn --</option>
                                  {workers.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-4">
                                <input 
                                  type="number"
                                  min="0"
                                  value={entry.quantityProduced || ''}
                                  onChange={(e) => updateEntry(entry.id, 'quantityProduced', parseInt(e.target.value) || 0)}
                                  className="w-full bg-primary-50/50 border border-primary-100 rounded-xl py-2.5 px-3 text-center text-sm font-black text-primary-700 outline-none focus:bg-white focus:border-primary-400 transition-all shadow-inner"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <input 
                                  type="number"
                                  min="0"
                                  value={entry.technicalErrorCount || ''}
                                  onChange={(e) => updateEntry(entry.id, 'technicalErrorCount', parseInt(e.target.value) || 0)}
                                  className="w-full bg-rose-50/30 border border-rose-100 rounded-xl py-2.5 px-3 text-center text-sm font-black text-rose-600 outline-none focus:bg-white focus:border-rose-300 transition-all"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <input 
                                  type="number"
                                  min="0"
                                  value={entry.materialErrorCount || ''}
                                  onChange={(e) => updateEntry(entry.id, 'materialErrorCount', parseInt(e.target.value) || 0)}
                                  className="w-full bg-amber-50/30 border border-amber-100 rounded-xl py-2.5 px-3 text-center text-sm font-black text-amber-600 outline-none focus:bg-white focus:border-amber-300 transition-all"
                                  placeholder="0"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <input 
                                  type="text"
                                  value={entry.errorNote}
                                  onChange={(e) => updateEntry(entry.id, 'errorNote', e.target.value)}
                                  className="w-full bg-transparent border-b border-gray-100 focus:border-primary-400 py-2 outline-none text-xs text-gray-600 placeholder:text-gray-300 transition-all"
                                  placeholder="Nhập ghi chú..."
                                />
                              </td>
                              <td className="px-4 py-4 text-center">
                                <button 
                                  onClick={() => handleRemoveRow(entry.id)}
                                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
                
                <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                   <button 
                     onClick={handleAddRow}
                     className="flex items-center gap-2 px-6 py-3 bg-white border border-dashed border-gray-300 rounded-[16px] text-[10px] font-black uppercase tracking-widest text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-all shadow-sm"
                   >
                     <Plus size={16} /> Thêm nhân viên
                   </button>
                </div>
             </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
             <button 
               onClick={onClose}
               className="px-8 py-4 bg-white border border-gray-200 rounded-[20px] text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-all"
             >
                Hủy bỏ
             </button>
             <button 
               onClick={handleSave}
               disabled={isSaving}
               className="flex items-center gap-2 px-10 py-4 bg-primary-600 text-white rounded-[20px] text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
             >
                {isSaving ? "Đang xử lý..." : <><Save size={16} /> Lưu Ghi Chép</>}
             </button>
          </div>
        </div>

      </div>

      {/* Success Toast Over Modal */}
      {showSuccessToast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 bg-gray-900 text-white px-6 py-4 rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4">
           <CheckCircle2 size={20} className="text-emerald-400" />
           <span className="text-xs font-bold tracking-wide">Đã ghi nhận sản lượng cho Lệnh {orderName.substring(0, 8)}...</span>
        </div>
      )}
    </>
  );
}
