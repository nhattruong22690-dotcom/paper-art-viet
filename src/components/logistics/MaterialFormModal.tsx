"use client";

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Package, Percent, Tag, Layers, ChevronRight, Plus, FileText, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500 overflow-hidden font-typewriter">
      <div className="absolute inset-0 bg-retro-sepia/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] retro-card !p-0 shadow-[0_30px_60px_-15px_rgba(62,39,35,0.5)] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border-2">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Package size={400} strokeWidth={0.5} className="text-retro-sepia" />
        </div>

        {/* HEADER */}
        <div className="p-8 md:p-12 border-b-2 border-retro-sepia/10 flex justify-between items-center bg-retro-paper/40 relative shrink-0">
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-retro-sepia tracking-tighter italic uppercase">
              {initialData ? 'Kiểm duyệt' : 'Khai báo'} <span className="text-retro-brick underline decoration-double decoration-retro-brick/30">Vật tư</span>
            </h2>
            <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] mt-4 italic flex items-center gap-3 opacity-60">
              <FileText size={16} strokeWidth={1.5} className="text-retro-mustard" /> Danh lục nguyên vật liệu cơ sở Paper Art Việt
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-4 bg-retro-paper border-2 border-retro-sepia/10 hover:bg-retro-brick/10 hover:text-retro-brick transition-all rotate-2 hover:rotate-0 shadow-sm"
          >
            <X size={24} strokeWidth={2} />
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
          className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide bg-retro-paper/40 pb-20"
        >
          <div className="space-y-10">
            {/* SECTION 1: CƠ BẢN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Thanh mục / Tên vật tư</label>
                <div className="relative">
                  <input 
                    required
                    type="text" 
                    value={formData.name || ''}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full pl-14 pr-6 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black uppercase text-retro-sepia shadow-inner outline-none placeholder:italic placeholder:font-normal placeholder:lowercase tracking-tight"
                    placeholder="Nhập danh xưng vật phẩm..."
                  />
                  <Tag size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20" strokeWidth={1.5} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Mã hiệu định danh (SKU)</label>
                <div className="relative">
                  <input 
                    required
                    type="text" 
                    value={formData.sku || ''}
                    onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                    className="w-full pl-14 pr-6 py-5 bg-retro-paper border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black text-retro-brick uppercase tracking-widest shadow-inner outline-none"
                    placeholder="MÃ SỐ - HIỆU"
                  />
                  <Layers size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Chủng loại</label>
                <div className="relative">
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-8 py-5 bg-white border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia appearance-none transition-all shadow-inner cursor-pointer italic"
                  >
                    <option value="Giấy">Giấy</option>
                    <option value="Keo">Keo</option>
                    <option value="Phụ kiện">Phụ kiện</option>
                  </select>
                  <ChevronRight size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-retro-sepia/30 rotate-90 pointer-events-none" strokeWidth={3} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Đơn vị thụ ký</label>
                <input 
                  required
                  type="text" 
                  value={formData.unit || ''}
                  onChange={e => setFormData({...formData, unit: e.target.value})}
                  className="w-full px-8 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black text-retro-sepia shadow-inner outline-none tracking-tight italic"
                  placeholder="Tờ / Ram / Kg..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Định mức Tồn kho Min</label>
                <input 
                  type="number" 
                  value={formData.minStock || 0}
                  onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                  className="w-full px-8 py-5 bg-retro-paper border-2 border-retro-sepia/10 focus:border-retro-brick transition-all text-sm font-black text-retro-brick text-center shadow-inner outline-none tabular-nums"
                />
              </div>
            </div>

            {/* SECTION 2: GIÁ & THÔNG MINH */}
            <div className="bg-white/40 p-8 border-2 border-retro-sepia/10 shadow-inner space-y-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-retro-sepia/5 group-hover:text-retro-mustard/10 transition-colors pointer-events-none">
                 <Percent size={100} strokeWidth={1} />
              </div>
              
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-10 h-10 bg-retro-mustard flex items-center justify-center text-white shadow-lg rotate-12">
                  <Percent size={18} strokeWidth={2.5} />
                </div>
                <h3 className="text-[11px] font-black text-retro-sepia uppercase tracking-[0.2em] italic">Tính giá vật tư Thông tri</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-retro-earth/60 uppercase tracking-widest ml-1">Giá thụ mua Tổng (Bulk)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formData.purchasePrice || ''}
                      onChange={e => setFormData({...formData, purchasePrice: e.target.value ? Number(e.target.value) : null})}
                      className="w-full pl-14 pr-6 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black text-retro-sepia shadow-inner outline-none tabular-nums"
                      placeholder="0"
                    />
                    <DollarSign size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20" strokeWidth={1.5} />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-retro-earth/60 uppercase tracking-widest ml-1">Sản lượng Quy cách (Qty)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formData.purchaseQuantity || ''}
                      onChange={e => setFormData({...formData, purchaseQuantity: e.target.value ? Number(e.target.value) : null})}
                      className="w-full pl-14 pr-6 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black text-retro-sepia shadow-inner outline-none tabular-nums"
                      placeholder="Số lượng/Lô"
                    />
                    <Package size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20" strokeWidth={1.5} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-retro-paper/60 border-2 border-dashed border-retro-sepia/10 relative z-10 group/calc">
                <div className="flex items-center gap-5">
                   <div className="w-12 h-12 bg-white border-2 border-retro-sepia/10 flex items-center justify-center text-retro-mustard shadow-sm group-hover/calc:rotate-0 transition-all rotate-3">
                      <ChevronRight size={20} strokeWidth={2.5} />
                   </div>
                   <div>
                      <p className="text-[9px] font-black text-retro-earth/40 uppercase tracking-tighter italic">Đơn giá thụ ký tự định</p>
                      <p className="text-lg font-black text-retro-brick italic tabular-nums">
                        {calculatedUnitPrice ? calculatedUnitPrice.toLocaleString() : '---'} <span className="text-[10px] text-retro-earth/40 uppercase font-black not-italic ml-1">VNĐ / {formData.unit || 'ĐV'}</span>
                      </p>
                   </div>
                </div>

                <div className="mt-6 md:mt-0 space-y-2 text-right">
                  <label className="text-[9px] font-black text-retro-earth/40 uppercase tracking-widest italic flex items-center justify-end gap-2">
                    <AlertCircle size={12} strokeWidth={2} /> Giá tham chiếu thực địa
                  </label>
                  <div className="relative">
                    <input 
                      required
                      type="number" 
                      value={formData.referencePrice || (calculatedUnitPrice || '')}
                      onChange={e => setFormData({...formData, referencePrice: Number(e.target.value)})}
                      className="w-40 px-6 py-3 bg-white border-2 border-retro-sepia focus:border-retro-brick transition-all text-sm font-black text-retro-sepia text-center shadow-xl outline-none tabular-nums italic"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col md:flex-row gap-6 mt-16 relative z-10">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-5 bg-retro-paper border-2 border-retro-sepia/10 text-[11px] font-black uppercase tracking-[0.2em] text-retro-earth/60 hover:text-retro-sepia hover:border-retro-sepia transition-all active:scale-95 italic order-2 md:order-1"
              >
                Hủy bỏ thao tác
              </button>
              <button 
                type="submit"
                className="flex-[1.5] py-5 bg-retro-brick text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_#3E272333] hover:bg-retro-sepia transition-all active:scale-95 flex items-center justify-center gap-4 italic order-1 md:order-2"
              >
                <Plus size={20} strokeWidth={2.5} />
                {initialData ? 'Cập nhật Sổ cái' : 'Khai báo Vật tư mới'}
              </button>
            </div>
          </div>
        </form>
        <div className="torn-paper-bottom" />
      </div>
    </div>
  );
}
