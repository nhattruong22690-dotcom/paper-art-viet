"use client";

import React, { useState, useEffect } from 'react';
import { X, DollarSign, Package, Layers, Plus, Clock, Tag, Calculator, Store, Globe } from 'lucide-react';
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              {initialData ? 'Cập nhật' : 'Thêm mới'} <span className="text-indigo-600 underline decoration-2 underline-offset-4">Sản Phẩm</span>
            </h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Thông tin cơ bản của sản phẩm</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all shadow-sm">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(formData);
        }} className="p-8 space-y-8">
          
          {/* SECTION 1: CƠ BẢN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tên sản phẩm</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  value={formData.name || ''}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all"
                  placeholder="Ví dụ: Hộp Quà Kraft Cao Cấp"
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
                  placeholder="HQ-KRAFT-01"
                />
                <Layers size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giá bán cơ sở (VNĐ)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.basePrice || ''}
                  onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all"
                  placeholder="0"
                />
                <DollarSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-indigo-400/60 uppercase tracking-widest ml-1 text-indigo-400">Giá vốn (System - Chỉ đọc)</label>
              <div className="relative">
                <input 
                  disabled
                  type="number" 
                  value={formData.costPrice || 0}
                  className="w-full pl-10 pr-4 py-3.5 bg-indigo-50/30 border border-indigo-100/50 rounded-2xl text-xs font-black text-indigo-600 outline-none cursor-not-allowed"
                  placeholder="0"
                />
                <Calculator size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giá bán sỉ (Wholesale)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.wholesalePrice || ''}
                  onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all"
                  placeholder="0"
                />
                <Store size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Giá xuất khẩu (Export)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={formData.exportPrice || ''}
                  onChange={e => setFormData({...formData, exportPrice: Number(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all"
                  placeholder="0"
                />
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Thời gian sản xuất (Phút)</label>
            <div className="relative">
              <input 
                type="number" 
                value={formData.productionTimeStd || ''}
                onChange={e => setFormData({...formData, productionTimeStd: Number(e.target.value)})}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all"
                placeholder="0"
              />
              <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
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
              {initialData ? 'Lưu thay đổi' : 'Tạo sản phẩm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
