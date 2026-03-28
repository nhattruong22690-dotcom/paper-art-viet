"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertCircle, Factory, User, Package } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SplitAllocation {
  id: string;
  facilityId: string;
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
  const [internalAllocations, setInternalAllocations] = useState<SplitAllocation[]>([]);
  const [outsourcedAllocations, setOutsourcedAllocations] = useState<SplitAllocation[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [outsourcers, setOutsourcers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFacilities();
    }
  }, [isOpen]);

  const fetchFacilities = async () => {
    try {
      const [wRes, oRes] = await Promise.all([
        fetch('/api/production/facilities/workshops'),
        fetch('/api/production/facilities/outsourcers')
      ]);
      setWorkshops(await wRes.json());
      setOutsourcers(await oRes.json());
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  useEffect(() => {
    if (isOpen && orderItem) {
      const existingPOs = orderItem.productionOrders || [];
      const internals = existingPOs
        .filter((po: any) => po.allocationType === 'internal' || !po.outsourcedName)
        .map((po: any) => ({
          id: po.id || Math.random().toString(36).substr(2, 9),
          facilityId: po.assignedTo || po.workshop_id || '',
          type: 'internal' as const,
          quantity: po.quantityTarget || 0
        }));

      const externals = existingPOs
        .filter((po: any) => po.allocationType === 'outsourced' || po.outsourcedName)
        .map((po: any) => ({
          id: po.id || Math.random().toString(36).substr(2, 9),
          facilityId: po.outsourcedName || po.outsourcer_id || '',
          type: 'outsourced' as const,
          quantity: po.quantityTarget || 0
        }));

      setInternalAllocations(internals.length > 0 ? internals : [{
        id: 'init-1',
        facilityId: '',
        type: 'internal',
        quantity: 0
      }]);
      setOutsourcedAllocations(externals);
    }
  }, [isOpen, orderItem]);

  const addRow = (type: 'internal' | 'outsourced') => {
    const newRow = {
      id: Math.random().toString(36).substr(2, 9),
      facilityId: '',
      type,
      quantity: 0
    };
    if (type === 'internal') setInternalAllocations([...internalAllocations, newRow]);
    else setOutsourcedAllocations([...outsourcedAllocations, newRow]);
  };

  const removeRow = (type: 'internal' | 'outsourced', id: string) => {
    if (type === 'internal') {
      if (internalAllocations.length > 0) setInternalAllocations(internalAllocations.filter(a => a.id !== id));
    } else {
      setOutsourcedAllocations(outsourcedAllocations.filter(a => a.id !== id));
    }
  };

  const updateRow = (type: 'internal' | 'outsourced', id: string, field: keyof SplitAllocation, value: any) => {
    if (type === 'internal') {
      setInternalAllocations(internalAllocations.map(a => a.id === id ? { ...a, [field]: value } : a));
    } else {
      setOutsourcedAllocations(outsourcedAllocations.map(a => a.id === id ? { ...a, [field]: value } : a));
    }
  };

  const totalAllocated = [...internalAllocations, ...outsourcedAllocations].reduce((sum, a) => sum + a.quantity, 0);
  const isValid = totalAllocated > 0 && 
                  totalAllocated <= (orderItem?.quantity || 0) && 
                  [...internalAllocations, ...outsourcedAllocations].every(a => a.facilityId && a.quantity >= 0);

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
          allocations: [...internalAllocations, ...outsourcedAllocations]
            .filter(a => a.quantity > 0)
            .map(a => ({
              assignedTo: a.facilityId,
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-white border-neo border-black w-full max-w-2xl h-[90vh] rounded-[32px] 
                    shadow-neo overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header - Optimized Info */}
        <div className="px-8 py-6 border-b-neo border-black bg-neo-mint">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-black uppercase italic tracking-tighter">⚡ Phân bổ Sản xuất</h3>
            <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
              <X size={24} strokeWidth={3} />
            </button>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="bg-white/50 px-4 py-2 rounded-xl flex items-center gap-3 border border-black/10">
              <Package size={20} className="text-purple-600" />
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Sản phẩm</p>
                <p className="text-sm font-black text-foreground">{orderItem?.product?.name} <span className="opacity-40 italic">({orderItem?.product?.sku || orderItem?.product?.code})</span></p>
              </div>
            </div>
            <div className="bg-white/50 px-4 py-2 rounded-xl flex items-center gap-3 border border-black/10">
              <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-xs">SL</div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-none">Tổng yêu cầu</p>
                <p className="text-lg font-black text-foreground leading-none">{orderItem?.quantity} <span className="text-[10px] uppercase ml-1">Cái</span></p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-10">
          
          {/* Table 1: Internal Workshop */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
              <Factory size={18} className="text-emerald-600" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Xưởng sản xuất nội bộ</h4>
            </div>
            <div className="space-y-3">
              {internalAllocations.map((alloc) => (
                <div key={alloc.id} className="flex gap-3 group items-center">
                  <select 
                    value={alloc.facilityId}
                    onChange={(e) => updateRow('internal', alloc.id, 'facilityId', e.target.value)}
                    className="flex-1 bg-slate-50 border-neo border-black rounded-xl px-4 py-3 text-sm font-bold focus:bg-white transition-all shadow-neo-active"
                  >
                    <option value="">-- Chọn xưởng sản xuất --</option>
                    {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <div className="w-32 relative">
                     <input 
                       type="number"
                       value={alloc.quantity || ''}
                       onChange={(e) => updateRow('internal', alloc.id, 'quantity', parseInt(e.target.value) || 0)}
                       className="w-full bg-slate-50 border-neo border-black rounded-xl px-4 py-3 text-sm font-black text-center focus:bg-white transition-all shadow-neo-active"
                     />
                  </div>
                  <button onClick={() => removeRow('internal', alloc.id)} className="p-3 text-gray-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => addRow('internal')}
                className="w-full py-3 border-2 border-dashed border-emerald-200 rounded-2xl text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Thêm xưởng nội bộ
              </button>
            </div>
          </section>

          {/* Table 2: External Outsourcing */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-l-4 border-amber-500 pl-3">
              <User size={18} className="text-amber-600" />
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">Cơ sở gia công (Thợ ngoài)</h4>
            </div>
            <div className="space-y-3">
              {outsourcedAllocations.map((alloc) => (
                <div key={alloc.id} className="flex gap-3 group items-center">
                  <select 
                    value={alloc.facilityId}
                    onChange={(e) => updateRow('outsourced', alloc.id, 'facilityId', e.target.value)}
                    className="flex-1 bg-slate-50 border-neo border-black rounded-xl px-4 py-3 text-sm font-bold focus:bg-white transition-all shadow-neo-active"
                  >
                    <option value="">-- Chọn tên thợ/cơ sở gia công --</option>
                    {outsourcers.map(o => <option key={o.id} value={o.id}>{o.name} ({o.specialization || 'Gia công'})</option>)}
                  </select>
                  <div className="w-32">
                     <input 
                       type="number"
                       value={alloc.quantity || ''}
                       onChange={(e) => updateRow('outsourced', alloc.id, 'quantity', parseInt(e.target.value) || 0)}
                       className="w-full bg-slate-50 border-neo border-black rounded-xl px-4 py-3 text-sm font-black text-center focus:bg-white transition-all shadow-neo-active"
                     />
                  </div>
                  <button onClick={() => removeRow('outsourced', alloc.id)} className="p-3 text-gray-300 hover:text-rose-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => addRow('outsourced')}
                className="w-full py-3 border-2 border-dashed border-amber-200 rounded-2xl text-[10px] font-black text-amber-600 uppercase tracking-widest hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={14} /> Thêm thợ gia công
              </button>
            </div>
          </section>

        </div>

        {/* Footer Summary */}
        <div className="p-8 bg-neo-mint/20 border-t-neo border-black flex flex-col gap-6">
          <div className="flex items-center justify-between p-4 bg-black rounded-2xl border-2 border-black">
              <div className="flex items-center gap-4 text-white">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 border-white/20 ${totalAllocated > orderItem?.quantity ? 'bg-red-500' : 'bg-emerald-500'}`}>
                   {totalAllocated > orderItem?.quantity ? <AlertCircle size={24} /> : <Check size={24} />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Tiến độ phân bổ</p>
                  <p className="text-xl font-black">{totalAllocated} / {orderItem?.quantity} <span className="text-xs uppercase opacity-60">Sản phẩm</span></p>
                </div>
              </div>
              {totalAllocated > orderItem?.quantity && (
                <span className="text-red-400 font-black text-xs uppercase animate-pulse">Vượt định mức!</span>
              )}
          </div>

          <div className="flex gap-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white border-neo border-black text-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Hủy bỏ
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={cn(
                "flex-1 py-4 border-neo border-black rounded-xl text-xs font-black uppercase tracking-widest shadow-neo transition-all flex items-center justify-center gap-2",
                isValid && !isSubmitting ? "bg-neo-purple text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-active" : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              )}
            >
              {isSubmitting ? <span className="w-5 h-5 border-3 border-black/10 border-t-black rounded-full animate-spin" /> : <><Check size={20} strokeWidth={3} /> Xác nhận Phân bổ</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
