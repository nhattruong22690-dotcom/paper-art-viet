"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Tag,
  Loader2,
  Box,
  Trash2,
  Edit2,
  Database,
  ChevronRight,
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
      showModal('error', 'Không thể xóa vật tư', 'Vật tư này có thể đang được sử dụng trong BOM hoặc đơn hàng.');
    }
  };

  const types = ['All', 'Giấy', 'Keo', 'Phụ kiện'];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 mb-12">
        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-neo-purple border-[3.5px] border-black rounded-[2rem] flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-110 transition-transform">
            <Database size={36} strokeWidth={3} className="text-black" />
          </div>
          <div>
            <nav className="flex items-center gap-3 text-[10px] font-black text-black/20 uppercase tracking-[0.4em] mb-3">
              <span>Logistics Suite</span>
              <ChevronRight size={12} strokeWidth={3} />
              <span className="text-neo-purple italic">Master Registry</span>
            </nav>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-black">
              Từ điển <span className="text-neo-purple underline decoration-[3px] underline-offset-4 font-normal">Vật tư NVL</span>
            </h1>
          </div>
        </div>

        <button 
          onClick={() => {
            setEditingMaterial(null);
            setIsModalOpen(true);
          }}
          className="btn-primary h-14 px-10 text-xs uppercase tracking-widest"
        >
          <Plus size={20} strokeWidth={3} /> Đăng ký vật tư mới
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 relative group/field">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc SKU vật tư..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-14 h-16"
          />
        </div>

        <div className="flex bg-white p-2 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] gap-2 overflow-x-auto">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg whitespace-nowrap",
                activeType === type 
                  ? "bg-black text-white"
                  : "text-black/40 hover:text-black hover:bg-black/5"
              )}
            >
              {type === 'All' ? 'Tất cả' : type}
            </button>
          ))}
        </div>
      </div>

      {/* MATERIALS TABLE */}
      <div className="neo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-5 border-b-2 border-black !text-white">Vật tư / SKU</th>
                <th className="px-8 py-5 border-b-2 border-black !text-white">Phân loại</th>
                <th className="px-8 py-5 text-center border-b-2 border-black !text-white">Đơn vị</th>
                <th className="px-8 py-5 text-center border-b-2 border-black !text-white">Tồn kho</th>
                <th className="px-8 py-5 text-right border-b-2 border-black !text-white">Đơn giá tham chiếu</th>
                <th className="px-8 py-5 text-center border-b-2 border-black !text-white w-32">Quản lý</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-12 h-12 animate-spin text-black opacity-20" />
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/20">Syncing with server...</p>
                    </div>
                  </td>
                </tr>
              ) : materials.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-10">
                      <Box size={64} strokeWidth={1} />
                      <p className="text-sm font-black uppercase tracking-[0.3em]">No materials cataloged</p>
                    </div>
                  </td>
                </tr>
              ) : materials.map((m) => (
                <tr key={m.id} className="hover:bg-neo-purple/5 transition-all group">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-black text-black leading-tight italic uppercase tracking-tight">{m.name}</p>
                      <p className="text-[10px] text-black/40 font-black uppercase tracking-widest mt-0.5">{m.sku}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] inline-flex items-center gap-1.5",
                      m.type === 'Giấy' ? "bg-neo-green/20 text-black" :
                      m.type === 'Keo' ? "bg-neo-yellow/20 text-black" :
                      "bg-neo-purple/20 text-black"
                    )}>
                      <Tag size={10} strokeWidth={3} /> {m.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[11px] font-black text-black/40 uppercase tabular-nums">{m.unit}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="inline-flex flex-col items-center">
                       <p className={cn(
                         "text-lg font-black tracking-tighter tabular-nums italic",
                         m.stockQuantity < m.minStock ? "text-neo-red" : "text-black"
                       )}>
                         {m.stockQuantity.toLocaleString()}
                       </p>
                       <p className="text-[9px] text-black/20 font-black uppercase tracking-tighter">Min: {m.minStock}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="font-black text-black tabular-nums tracking-tighter text-lg italic">
                      {m.referencePrice.toLocaleString()} <span className="text-[10px] text-black/40">đ</span>
                    </p>
                    {m.unitPrice && m.unitPrice > 0 && (
                      <p className="text-[9px] text-neo-green font-black uppercase tracking-tight mt-1 italic">
                        Last In: {m.unitPrice.toLocaleString()}đ
                      </p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => handleEdit(m)}
                        className="w-10 h-10 flex items-center justify-center text-black/20 hover:text-black hover:bg-black/5 rounded-xl transition-all"
                       >
                          <Edit2 size={18} strokeWidth={2.5} />
                       </button>
                       <button 
                        onClick={() => handleDelete(m.id)}
                        className="w-10 h-10 flex items-center justify-center text-black/20 hover:text-neo-red hover:bg-neo-red/10 rounded-xl transition-all"
                       >
                          <Trash2 size={18} strokeWidth={2.5} />
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
