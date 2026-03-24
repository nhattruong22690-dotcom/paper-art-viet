"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SplitAllocation {
  id: string;
  assignedTo: string;
  type: 'internal' | 'outsourced';
  quantity: number;
}

interface SplitProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: string;
  orderItem: any;
}

export default function SplitProductionModal({ isOpen, onClose, onSuccess, orderId, orderItem }: SplitProductionModalProps) {
  const { showToast, showModal } = useNotification();
  const [allocations, setAllocations] = useState<SplitAllocation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && orderItem) {
      // Initialize with existing production orders if any, else one empty row
      const existingPOs = orderItem.productionOrders || [];
      if (existingPOs.length > 0) {
        setAllocations(existingPOs.map((po: any) => ({
          id: po.id || Math.random().toString(36).substr(2, 9),
          assignedTo: po.assignedTo || po.outsourcedName || '',
          type: po.allocationType || (po.outsourcedName ? 'outsourced' : 'internal'),
          quantity: po.quantityTarget || 0
        })));
      } else {
        setAllocations([{
          id: Math.random().toString(36).substr(2, 9),
          assignedTo: 'Xưởng A',
          type: 'internal',
          quantity: orderItem.quantity
        }]);
      }
    }
  }, [isOpen, orderItem]);

  const addRow = () => {
    setAllocations([...allocations, {
      id: Math.random().toString(36).substr(2, 9),
      assignedTo: '',
      type: 'internal',
      quantity: 0
    }]);
  };

  const removeRow = (id: string) => {
    if (allocations.length > 1) {
      setAllocations(allocations.filter(a => a.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof SplitAllocation, value: any) => {
    setAllocations(allocations.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + a.quantity, 0);
  const isValid = totalAllocated > 0 && totalAllocated <= orderItem?.quantity && allocations.every(a => a.assignedTo && a.quantity > 0);

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/production/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          productId: orderItem.productId,
          allocations: allocations.map(a => ({
            assignedTo: a.assignedTo,
            type: a.type,
            quantity: a.quantity
          }))
        })
      });

      if (res.ok) {
        showToast('success', 'Đã phân bổ sản xuất thành công');
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi lưu');
      }
    } catch (error) {
      showModal('error', 'Lỗi phân bổ', String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-w-lg rounded-none sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight italic">⚡ Phân bổ Sản xuất</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sản phẩm: {orderItem?.product?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">
            <span>Đơn vị / Thợ</span>
            <span>Số lượng</span>
          </div>

          <div className="space-y-3">
            {allocations.map((alloc) => (
              <div key={alloc.id} className="flex gap-2 group">
                <div className="flex-1 flex gap-2">
                  <select 
                    value={alloc.type}
                    onChange={(e) => updateRow(alloc.id, 'type', e.target.value)}
                    className="bg-gray-50 border-gray-100 rounded-xl px-2 py-3 text-[10px] font-bold uppercase focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="internal">Xưởng</option>
                    <option value="outsourced">Gia công</option>
                  </select>
                  <input 
                    type="text"
                    placeholder="Tên đơn vị..."
                    value={alloc.assignedTo}
                    onChange={(e) => updateRow(alloc.id, 'assignedTo', e.target.value)}
                    className="flex-1 bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-xs font-bold focus:bg-white transition-all shadow-sm"
                  />
                </div>
                <div className="w-24">
                  <input 
                    type="number"
                    value={alloc.quantity || ''}
                    onChange={(e) => updateRow(alloc.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-50 border-gray-100 rounded-xl px-4 py-3 text-xs font-black text-center focus:bg-white transition-all shadow-sm"
                  />
                </div>
                {allocations.length > 1 && (
                  <button onClick={() => removeRow(alloc.id)} className="p-3 text-gray-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button 
            type="button"
            onClick={addRow}
            className="w-full py-3 border-2 border-dashed border-gray-100 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-primary-200 hover:text-primary-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Thêm đơn vị
          </button>

          <div className="p-4 bg-gray-900 rounded-2xl flex justify-between items-center">
            <div>
              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Đã phân bổ / Tổng sản lượng</p>
              <p className={cn(
                "text-lg font-black font-mono",
                totalAllocated > orderItem?.quantity ? "text-rose-400" : "text-emerald-400"
              )}>
                {totalAllocated} / {orderItem?.quantity}
              </p>
            </div>
            {totalAllocated > orderItem?.quantity && (
              <div className="text-rose-400 flex items-center gap-2 animate-pulse">
                <AlertCircle size={20} />
                <span className="text-[10px] font-bold uppercase tracking-tighter">Vượt!</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            type="button"
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className={cn(
              "flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2",
              isValid && !isSubmitting ? "bg-primary-600 text-white shadow-primary-200 hover:bg-primary-500" : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {isSubmitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={16} /> Lưu Phân Bổ</>}
          </button>
        </div>
      </div>
    </div>
  );
}
