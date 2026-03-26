"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Edit2, 
  Trash2, 
  History,
  Tag,
  Layers,
  DollarSign,
  Loader2,
  Box,
  FileText,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMaterials, upsertMaterial, deleteMaterial } from '@/services/material.service';
import MaterialFormModal from './MaterialFormModal';
import { useNotification } from '@/context/NotificationContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Material {
  id: string;
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

export default function MaterialMasterList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState('All');
  const [isLoading, setIsLoading] = useState(false);
  const { showToast, showModal, confirm: confirmDialog } = useNotification();
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const data = await getMaterials({ 
        search: searchTerm, 
        type: activeType === 'All' ? undefined : activeType 
      });
      setMaterials(data.map((m: any) => ({
        ...m,
        minStock: Number(m.minStock),
        stockQuantity: Number(m.stockQuantity),
        referencePrice: Number(m.referencePrice) || (m.purchasePrice && m.purchaseQuantity && Number(m.purchaseQuantity) > 0 ? Number(m.purchasePrice) / Number(m.purchaseQuantity) : 0),
        purchasePrice: m.purchasePrice ? Number(m.purchasePrice) : null,
        purchaseQuantity: m.purchaseQuantity ? Number(m.purchaseQuantity) : null,
        unitPrice: m.unitPrice ? Number(m.unitPrice) : null
      })) as any);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMaterials();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, activeType]);

  const handleSubmit = async (data: Partial<Material>) => {
    try {
      await upsertMaterial(data as any);
      setIsModalOpen(false);
      setEditingMaterial(null);
      showToast('success', 'Đã lưu vật tư thành công');
      fetchMaterials();
    } catch (error: any) {
      console.error('Failed to save material full error:', error);
      const errorMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      showModal('error', 'Không thể lưu vật tư', errorMsg);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!await confirmDialog('Bạn có chắc chắn muốn xóa vật tư này?')) return;
    
    try {
      await deleteMaterial(id);
      showToast('success', 'Đã xóa vật tư thành công');
      fetchMaterials();
    } catch (error: any) {
      console.error('Failed to delete material:', error);
      showModal('error', 'Không thể xóa vật tư', 'Vật tư này có thể đang được sử dụng trong BOM hoặc đơn hàng.');
    }
  };

  const types = ['All', 'Giấy', 'Keo', 'Phụ kiện'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Từ điển Vật tư</h1>
          <p className="text-slate-500 text-sm mt-1">Danh mục gốc và định mức nguyên vật liệu sản xuất.</p>
        </div>

        <button 
          onClick={() => {
            setEditingMaterial(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/10"
        >
          <Plus size={18} /> Đăng ký vật tư mới
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc SKU vật tư..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-300 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
          />
        </div>

        <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-lg",
                activeType === type 
                  ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              )}
            >
              {type === 'All' ? 'Tất cả' : type}
            </button>
          ))}
        </div>
      </div>

      {/* MATERIALS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-8 py-5">Vật tư / SKU</th>
                <th className="px-8 py-5">Phân loại</th>
                <th className="px-8 py-5 text-center">Đơn vị</th>
                <th className="px-8 py-5 text-center">Tồn kho</th>
                <th className="px-8 py-5 text-right">Đơn giá tham chiếu</th>
                <th className="px-8 py-5 text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 text-slate-400">
                      <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                      <p className="text-xs font-bold uppercase tracking-widest">Đang trích xuất dữ liệu...</p>
                    </div>
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center text-slate-300">
                    <div className="flex flex-col items-center gap-4">
                      <Box size={48} strokeWidth={1} />
                      <p className="text-sm font-medium">Không tìm thấy vật tư nào</p>
                    </div>
                  </td>
                </tr>
              ) : materials.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-50 text-slate-300 border border-slate-100 rounded-lg flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
                          <Package size={20} />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{m.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{m.sku}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm",
                      m.type === 'Giấy' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      m.type === 'Keo' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">{m.unit}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex flex-col items-center">
                       <p className={cn(
                         "text-base font-black tracking-tight",
                         m.stockQuantity < m.minStock ? "text-rose-600" : "text-slate-900"
                       )}>
                         {m.stockQuantity.toLocaleString()}
                       </p>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Min: {m.minStock}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-sm font-black text-slate-900 tabular-nums tracking-tight">
                      {m.referencePrice.toLocaleString()} <span className="text-[10px] text-slate-400 underline decoration-slate-200">đ</span>
                    </p>
                    {m.unitPrice && m.unitPrice > 0 && (
                      <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-tight mt-0.5">
                        Giá nhập: {m.unitPrice.toLocaleString()}đ
                      </p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => handleEdit(m)}
                        className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm"
                       >
                          <Edit2 size={16} />
                       </button>
                       <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:text-rose-600 hover:border-rose-600 transition-all shadow-sm"
                       >
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <MaterialFormModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMaterial(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingMaterial}
      />
    </div>
  );
}
