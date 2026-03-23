"use client";

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Package, Percent, Tag, Layers, ChevronRight, Plus } from 'lucide-react';
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
    purchaseQuantity: null
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
        purchaseQuantity: null
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (formData.purchasePrice && formData.purchaseQuantity && formData.purchaseQuantity > 0) {
      const unit = formData.purchasePrice / formData.purchaseQuantity;
      setCalculatedUnitPrice(unit);
      // Optional: Automatically update reference price (unitPrice) if user hasn't typed it manually?
      // But prompt says just "hiển thị ... ngay bên cạnh".
    } else {
      setCalculatedUnitPrice(null);
    }
  }, [formData.purchasePrice, formData.purchaseQuantity]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {initialData ? 'Cập nhật' : 'Thêm mới'} <span className="text-indigo-600 underline decoration-2 underline-offset-4">Vật tư</span>
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Thông tin chi tiết nguyên vật liệu</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          const finalData = { ...formData };
          // Auto-fill reference price with calculated price if not manually provided
          if (!finalData.referencePrice && calculatedUnitPrice) {
            finalData.referencePrice = calculatedUnitPrice;
          }
          onSubmit(finalData);
        }} className="p-8 space-y-8">
          
          {/* SECTION 1: CƠ BẢN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên vật tư</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all"
                  placeholder="Ví dụ: Giấy Kraft 300gsm"
                />
                <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mã SKU</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  value={formData.sku || ''}
                  onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all uppercase"
                  placeholder="P-KRAFT-300"
                />
                <Layers size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Loại</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all appearance-none cursor-pointer"
              >
                <option value="Giấy">Giấy</option>
                <option value="Keo">Keo</option>
                <option value="Phụ kiện">Phụ kiện</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Đơn vị</label>
              <input 
                required
                type="text" 
                value={formData.unit || ''}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all"
                placeholder="Tờ / Ram / Kg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tồn kho tối thiểu</label>
              <input 
                type="number" 
                value={formData.minStock || 0}
                onChange={e => setFormData({...formData, minStock: Number(e.target.value)})}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all"
              />
            </div>
          </div>

          {/* SECTION 2: GIÁ & THÔNG MINH */}
          <div className="bg-indigo-50/30 p-6 rounded-[32px] border border-indigo-100/50 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                <Percent size={14} />
              </div>
              <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Tính giá vật tư thông minh</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Giá mua tổng (Bulk Price)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.purchasePrice || ''}
                    onChange={e => setFormData({...formData, purchasePrice: e.target.value ? Number(e.target.value) : null})}
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-indigo-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:border-indigo-300 transition-all"
                    placeholder="Ví dụ: 240,000"
                  />
                  <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">Số lượng đóng gói (Package Qty)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={formData.purchaseQuantity || ''}
                    onChange={e => setFormData({...formData, purchaseQuantity: e.target.value ? Number(e.target.value) : null})}
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-indigo-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:border-indigo-300 transition-all"
                    placeholder="Ví dụ: 24 (túi/hộp)"
                  />
                  <Package size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <ChevronRight size={18} />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Đơn giá/đơn vị tự động</p>
                    <p className="text-sm font-black text-indigo-600">
                      {calculatedUnitPrice ? calculatedUnitPrice.toLocaleString() : '---'} <span className="text-[10px] text-gray-400">VNĐ / {formData.unit || 'ĐV'}</span>
                    </p>
                 </div>
              </div>

              <div className="space-y-1 text-right">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Giá tham chiếu cuối</label>
                <div className="relative">
                  <input 
                    required
                    type="number" 
                    value={formData.referencePrice || (calculatedUnitPrice || '')}
                    onChange={e => setFormData({...formData, referencePrice: Number(e.target.value)})}
                    className="w-32 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-900 text-center outline-none focus:border-indigo-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              className="flex-3 py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3"
            >
              <Plus size={16} />
              {initialData ? 'Lưu thay đổi' : 'Tạo vật tư mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
