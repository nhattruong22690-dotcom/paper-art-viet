"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Package, 
  Percent, 
  Tag, 
  Layers, 
  ChevronRight, 
  Plus, 
  FileText, 
  AlertCircle,
  Calculator,
  Save,
  Info,
  History
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border border-slate-200">
        
        {/* HEADER */}
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {initialData ? 'Chỉnh sửa Vật tư' : 'Đăng ký Vật tư mới'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <Package size={14} className="text-blue-500" /> Quản lý danh mục nguyên vật liệu sản xuất
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-600 hover:border-rose-600 transition-all shadow-sm"
          >
            <X size={20} />
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
          className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8"
        >
          {/* SECTION 1: CƠ BẢN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tên vật tư / Quy cách</label>
              <div className="relative">
                <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  required
                  type="text" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-300 transition-all outline-none"
                  placeholder="Ví dụ: Giấy Mỹ Thuật 250gsm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Mã hiệu (SKU)</label>
              <div className="relative">
                <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  required
                  type="text" 
                  value={formData.sku || ''}
                  onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-blue-600 uppercase tracking-widest focus:bg-white focus:border-blue-300 transition-all outline-none"
                  placeholder="SKU-001"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Chủng loại</label>
              <div className="relative">
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 rounded-xl outline-none focus:bg-white focus:border-blue-300 appearance-none transition-all cursor-pointer"
                >
                  <option value="Giấy">Giấy</option>
                  <option value="Keo">Keo</option>
                  <option value="Phụ kiện">Phụ kiện</option>
                </select>
                <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 rotate-90 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Đơn vị tính</label>
              <input 
                required
                type="text" 
                value={formData.unit || ''}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-blue-300 transition-all outline-none"
                placeholder="Tờ, Ram, Kg..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Định mức tối thiểu</label>
              <input 
                type="number" 
                value={formData.minStock || 0}
                onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-rose-600 focus:bg-white focus:border-blue-300 transition-all outline-none tabular-nums"
              />
            </div>
          </div>

          {/* SECTION 2: GIÁ & CÔNG CỤ TÍNH */}
          <div className="bg-blue-50/50 p-6 md:p-8 rounded-2xl border border-blue-100 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
                <Calculator size={18} />
              </div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Công cụ tính đơn giá nhập</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Giá nhập tổng đơn (Bulk)</label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="number" 
                    value={formData.purchasePrice || ''}
                    onChange={e => setFormData({...formData, purchasePrice: e.target.value ? Number(e.target.value) : null})}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-blue-300 transition-all outline-none tabular-nums"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Số lượng / Quy cách lô</label>
                <div className="relative">
                  <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input 
                    type="number" 
                    value={formData.purchaseQuantity || ''}
                    onChange={e => setFormData({...formData, purchaseQuantity: e.target.value ? Number(e.target.value) : null})}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:border-blue-300 transition-all outline-none tabular-nums"
                    placeholder="Số lượng/Lô"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-white rounded-xl border border-blue-100 shadow-sm border-dashed">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-100">
                    <History size={18} />
                 </div>
                 <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Đơn giá tự động tính toán</p>
                    <p className="text-lg font-black text-emerald-600 tracking-tight">
                      {calculatedUnitPrice ? calculatedUnitPrice.toLocaleString() : '---'} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">VNĐ / {formData.unit || 'ĐV'}</span>
                    </p>
                 </div>
              </div>

              <div className="mt-4 md:mt-0 space-y-2 text-right">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1.5 px-1">
                  <Info size={12} className="text-blue-400" /> Giá tham chiếu áp dụng
                </label>
                <div className="relative">
                  <input 
                    required
                    type="number" 
                    value={formData.referencePrice || (calculatedUnitPrice || '')}
                    onChange={e => setFormData({...formData, referencePrice: Number(e.target.value)})}
                    className="w-40 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black text-center shadow-lg shadow-blue-900/10 focus:ring-4 focus:ring-blue-100 transition-all outline-none tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col md:flex-row gap-4 pt-4 shrink-0">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-white border border-slate-200 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all active:scale-95 order-2 md:order-1"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              className="flex-[1.5] py-4 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 order-1 md:order-2"
            >
              <Save size={18} />
              {initialData ? 'Cập nhật Vật tư' : 'Lưu bản đăng ký mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
