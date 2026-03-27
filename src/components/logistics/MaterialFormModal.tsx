"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Package, 
  Tag, 
  Layers, 
  ChevronDown, 
  Plus, 
  Calculator,
  Save,
  Info,
  History,
  Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Material {
  id?: string;
  sku: string;
  name: string;
  type: string;
  unit: string;
  minStock: number;
  stockQuantity: number;
  referencePrice: number;
  purchasePrice?: number | null;
  purchaseQuantity?: number | null;
  unitPrice?: number | null;
}

interface MaterialFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Material>) => void;
  initialData?: Material | null;
}

export default function MaterialFormModal({ isOpen, onClose, onSubmit, initialData }: MaterialFormModalProps) {
  const [formData, setFormData] = useState<Partial<Material>>({
    sku: '',
    name: '',
    type: 'Giấy',
    unit: 'Tờ',
    minStock: 0,
    referencePrice: 0,
    purchasePrice: null,
    purchaseQuantity: null,
    stockQuantity: 0
  });

  const [calculatedUnitPrice, setCalculatedUnitPrice] = useState<number | null>(0);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        sku: '',
        name: '',
        type: 'Giấy',
        unit: 'Tờ',
        minStock: 0,
        referencePrice: 0,
        purchasePrice: null,
        purchaseQuantity: null,
        stockQuantity: 0
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (formData.purchasePrice && formData.purchaseQuantity && formData.purchaseQuantity > 0) {
      const unit = formData.purchasePrice / formData.purchaseQuantity;
      setCalculatedUnitPrice(unit);
    } else {
      setCalculatedUnitPrice(null);
    }
  }, [formData.purchasePrice, formData.purchaseQuantity]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-xl border-neo border-black shadow-neo flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* HEADER */}
        <div className="p-6 md:p-8 border-b-neo border-black bg-neo-purple/10 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
               <Package size={24} className="text-black" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black tracking-tight uppercase italic">
                {initialData ? 'Hiệu đính Vật tư' : 'Đăng ký Vật tư'}
              </h2>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">
                 Logistics & Engineering Specification
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black/40 hover:text-black hover:bg-neo-red transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-white"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            const finalData = { ...formData };
            if (!finalData.referencePrice && calculatedUnitPrice) {
              finalData.referencePrice = calculatedUnitPrice;
            }
            onSubmit(finalData);
          }} 
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scrollbar-hide"
        >
          {/* CORE SPECS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Tên vật tư / Quy cách</label>
              <div className="relative group/field">
                <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                <input 
                  required
                  type="text" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="form-input pl-12"
                  placeholder="Ví dụ: Giấy Mỹ Thuật 250gsm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Mã hiệu (SKU)</label>
              <div className="relative group/field">
                <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                <input 
                  required
                  type="text" 
                  value={formData.sku || ''}
                  onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                  className="form-input pl-12 border-solid !bg-neo-purple/10 font-black tracking-widest text-center"
                  placeholder="SKU-001"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Chủng loại</label>
              <div className="relative group/field">
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="form-input pl-4 pr-10 appearance-none cursor-pointer"
                >
                  <option value="Giấy">Giấy</option>
                  <option value="Keo">Keo</option>
                  <option value="Phụ kiện">Phụ kiện</option>
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Đơn vị tính</label>
              <input 
                required
                type="text" 
                value={formData.unit || ''}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="form-input h-14"
                placeholder="Tờ, Kg..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Tồn tối thiểu</label>
              <div className="relative group/field">
                <input 
                  type="number" 
                  value={formData.minStock || ''}
                  onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                  className="form-input h-14 pr-12 text-neo-red font-black tabular-nums"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/20 uppercase tracking-tight">MIN</span>
              </div>
            </div>
          </div>

          {/* PRICING TOOL */}
          <div className="p-8 bg-black/5 border-2 border-black border-dashed rounded-xl space-y-8">
            <div className="flex items-center gap-3">
              <Calculator size={18} className="text-black" />
              <h3 className="text-[11px] font-black text-black uppercase tracking-[0.2em] italic">Calculated Acquisition Cost</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-black/40 uppercase tracking-widest ml-1">Giá nhập tổng đơn (Lô)</label>
                <div className="relative group/field">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                  <input 
                    type="number" 
                    value={formData.purchasePrice || ''}
                    onChange={e => setFormData({...formData, purchasePrice: e.target.value ? Number(e.target.value) : null})}
                    className="form-input pl-12 !h-12 !bg-white tabular-nums"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-black/40 uppercase tracking-widest ml-1">Số lượng / Quy cách lô</label>
                <div className="relative group/field">
                  <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                  <input 
                    type="number" 
                    value={formData.purchaseQuantity || ''}
                    onChange={e => setFormData({...formData, purchaseQuantity: e.target.value ? Number(e.target.value) : null})}
                    className="form-input pl-12 !h-12 !bg-white tabular-nums"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-neo-green/20 text-black border-2 border-black rounded-lg flex items-center justify-center">
                     <Clock size={18} />
                  </div>
                  <div>
                     <p className="text-[9px] font-black text-black/40 uppercase tracking-wider leading-none mb-1">Đơn giá dự kiến</p>
                     <p className="text-xl font-black text-black tracking-tight tabular-nums italic">
                       {calculatedUnitPrice ? calculatedUnitPrice.toLocaleString() : '---'} <span className="text-[9px] font-medium text-black/40 uppercase ml-1">VNĐ / {formData.unit || 'ĐV'}</span>
                     </p>
                  </div>
               </div>

               <div className="mt-6 md:mt-0 flex flex-col items-end">
                 <label className="text-[9px] font-black text-black/60 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 px-1 italic">
                   <Info size={12} className="text-black" /> Ref. Price Applied
                 </label>
                 <input 
                   required
                   type="number" 
                   value={formData.referencePrice || (calculatedUnitPrice || '')}
                   onChange={e => setFormData({...formData, referencePrice: Number(e.target.value)})}
                   className="w-44 h-12 bg-black text-white rounded-lg text-sm font-black text-center shadow-neo-sm outline-none tabular-nums focus:ring-4 focus:ring-black/10 transition-all border-none"
                 />
               </div>
            </div>
          </div>
        </form>

        {/* FOOTER */}
        <div className="p-8 border-t-neo border-black bg-white flex flex-col md:flex-row gap-6 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 h-14 rounded-xl text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px]"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={() => {
              const finalData = { ...formData };
              if (!finalData.referencePrice && calculatedUnitPrice) {
                finalData.referencePrice = calculatedUnitPrice;
              }
              onSubmit(finalData);
            }} 
            className="btn-primary btn-confirm-flash flex-[1.5] h-14 text-[11px] uppercase tracking-[0.2em]"
          >
            <Save size={20} strokeWidth={2.5} />
            {initialData ? 'Cập nhật Specification' : 'Khởi tạo Master Record'}
          </button>
        </div>
      </div>
    </div>
  );
}
