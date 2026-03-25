"use client";

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Package, Layers, Plus, ArrowUpRight, Clock, Loader2, ChevronRight, Tag, Calculator, Store, Globe } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  id?: string;
  sku: string | null;
  name: string | null;
  basePrice: any;
  costPrice: any;
  wholesalePrice: any;
  exportPrice: any;
  productionTimeStd: number | null;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => void;
  initialData?: Product | null;
}

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData }: ProductFormModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    name: '',
    basePrice: 0,
    costPrice: 0,
    wholesalePrice: 0,
    exportPrice: 0,
    productionTimeStd: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        basePrice: Number(initialData.basePrice || 0),
        costPrice: Number(initialData.costPrice || 0),
        wholesalePrice: Number(initialData.wholesalePrice || 0),
        exportPrice: Number(initialData.exportPrice || 0),
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        basePrice: 0,
        costPrice: 0,
        wholesalePrice: 0,
        exportPrice: 0,
        productionTimeStd: 0,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-retro-sepia/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] retro-card !p-0 shadow-[0_30px_60px_-15px_rgba(62,39,35,0.5)] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border-2">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Package size={400} strokeWidth={0.5} className="text-retro-sepia" />
        </div>

        {/* HEADER */}
        <div className="p-8 md:p-12 border-b-2 border-retro-sepia/10 flex justify-between items-center bg-retro-paper/20 relative shrink-0">
          <div className="relative z-10 font-typewriter">
            <h2 className="text-3xl font-black text-retro-sepia uppercase tracking-tighter italic">
              {initialData ? 'Hiệu đính' : 'Khai báo'} <span className="text-retro-brick underline decoration-double decoration-retro-brick/30 underline-offset-4">Vật phẩm</span>
            </h2>
            <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] mt-4 italic flex items-center gap-3 opacity-60">
              <Package size={16} strokeWidth={1.5} className="text-retro-mustard" /> Hồ sơ Master List & Định mức sản xuất
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-4 bg-retro-paper border-2 border-retro-sepia/10 hover:bg-retro-brick/10 hover:text-retro-brick transition-all rotate-2 hover:rotate-0 shadow-sm"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }} className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide bg-retro-paper/30 pb-20 font-typewriter">
          
          {/* SECTION 1: CƠ BẢN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Danh xưng Vật phẩm</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-6 py-4 bg-white border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all shadow-inner placeholder:italic placeholder:font-normal placeholder:lowercase"
                  placeholder="Nhập tên chính thức..."
                />
                <Tag size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-sepia/20" />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Thanh số SKU (Định danh)</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  value={formData.sku || ''}
                  onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                  className="w-full pl-12 pr-6 py-4 bg-retro-paper border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-brick outline-none focus:bg-white focus:border-retro-sepia transition-all shadow-inner text-center tracking-widest"
                  placeholder="MÃ VẬT PHẨM"
                />
                <Layers size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-sepia/20" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Đơn giá cơ sở (Nhân gian)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.basePrice || ''}
                  onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})}
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-retro-sepia/10 text-xs font-black text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all shadow-inner tabular-nums"
                  placeholder="0"
                />
                <DollarSign size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-sepia/20" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-retro-earth/40 uppercase">VNĐ</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-retro-brick uppercase tracking-widest ml-1 opacity-60 italic">Giá vốn Ước lệ (Quy chiếu)</label>
              <div className="relative">
                <input 
                  disabled
                  type="number" 
                  value={formData.costPrice || 0}
                  className="w-full pl-12 pr-12 py-4 bg-retro-paper border-2 border-dashed border-retro-sepia/20 text-xs font-black text-retro-brick outline-none cursor-not-allowed tabular-nums opacity-60"
                  placeholder="0"
                />
                <Calculator size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-brick/20" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-retro-brick/40 uppercase">GỐC</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Niêm giá Sỉ (Wholesale)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.wholesalePrice || ''}
                  onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})}
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-retro-sepia/10 text-xs font-black text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all shadow-inner tabular-nums underline decoration-retro-mustard/30 underline-offset-4"
                  placeholder="0"
                />
                <Store size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-mustard" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-retro-earth/40 uppercase">SỈ</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Tiêu chuẩn Xuất khẩu (Global)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.exportPrice || ''}
                  onChange={e => setFormData({...formData, exportPrice: Number(e.target.value)})}
                  className="w-full pl-12 pr-12 py-4 bg-white border-2 border-retro-sepia/10 text-xs font-black text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all shadow-inner tabular-nums underline decoration-retro-moss/30 underline-offset-4"
                  placeholder="0"
                />
                <Globe size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-moss" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-retro-earth/40 uppercase">XUẤT</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 mt-8">
            <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Vận hành Tiêu chuẩn (Thanh thời)</label>
            <div className="relative">
              <input 
                type="number" 
                value={formData.productionTimeStd || ''}
                onChange={e => setFormData({...formData, productionTimeStd: Number(e.target.value)})}
                className="w-full pl-12 pr-12 py-4 bg-white border-2 border-retro-sepia/10 text-xs font-black text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all shadow-inner tabular-nums"
                placeholder="0"
              />
              <Clock size={18} strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-sepia/20" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-retro-earth/40 uppercase">Phút</span>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col md:flex-row gap-6 mt-16 relative z-10">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-5 bg-retro-paper border-2 border-retro-sepia/10 text-[11px] font-black uppercase tracking-[0.2em] text-retro-earth/60 hover:text-retro-sepia hover:border-retro-sepia transition-all active:scale-95"
            >
              Hủy bỏ Thao tác
            </button>
            <button 
              type="submit"
              className="flex-[2] py-5 bg-retro-brick text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_#3E272333] hover:bg-retro-sepia transition-all flex items-center justify-center gap-4 active:scale-95"
            >
              <Plus size={22} strokeWidth={2.5} />
              {initialData ? 'Ghi nhận Thay đổi' : 'Khởi tạo Vật phẩm'}
            </button>
          </div>
        </form>
        <div className="torn-paper-bottom" />
      </div>
    </div>
  );
}
