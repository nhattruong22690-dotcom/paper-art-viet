"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  History,
  Tag,
  Layers,
  DollarSign,
  Loader2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMaterials, upsertMaterial } from '@/services/material.service';
import MaterialFormModal from './MaterialFormModal';

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
      // Convert Decimal to number for UI
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
      fetchMaterials();
    } catch (error) {
      console.error('Failed to save material:', error);
      alert('Có lỗi xảy ra khi lưu vật tư.');
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const types = ['All', 'Giấy', 'Keo', 'Phụ kiện'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
            Danh mục <span className="text-indigo-600 underline decoration-2 underline-offset-4">Vật tư</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Quản lý từ điển nguyên vật liệu xưởng</p>
        </div>

        <button 
          onClick={() => {
            setEditingMaterial(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          <Plus size={16} />
          Thêm vật tư mới
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-col md:flex-row gap-6">
        <div className="relative flex-1">
          <input 
            type="text"
            placeholder="Tìm theo tên vật tư hoặc mã SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all uppercase tracking-tighter"
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-100 rounded-2.5xl flex-wrap">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeType === type 
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* MATERIALS TABLE */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vật tư / SKU</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Loại</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Đơn vị</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tồn kho</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Giá tham chiếu / Đơn vị</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {materials.map((m) => (
                <tr key={m.id} className={cn(
                  "hover:bg-indigo-50/10 transition-colors group",
                  m.stockQuantity < m.minStock && "bg-rose-50/10"
                )}>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-all">
                          <Layers size={20} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{m.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold tracking-widests uppercase">{m.sku}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      m.type === 'Giấy' ? "bg-blue-50 text-blue-600" :
                      m.type === 'Keo' ? "bg-amber-50 text-amber-600" :
                      "bg-purple-50 text-purple-600"
                    )}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-[10px] font-black text-gray-500 uppercase">{m.unit}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <p className={cn(
                      "text-xs font-black italic",
                      m.stockQuantity < m.minStock ? "text-rose-600" : "text-gray-700"
                    )}>
                      {m.stockQuantity}
                    </p>
                    <p className="text-[8px] text-gray-400 uppercase font-bold">Min: {m.minStock}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-xs font-black text-indigo-600 tabular-nums">
                      {m.referencePrice.toLocaleString()}đ
                    </p>
                    {m.unitPrice && m.unitPrice > 0 && (
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                        Smart: {m.unitPrice.toLocaleString()}đ
                      </p>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                       <button 
                        onClick={() => handleEdit(m)}
                        className="p-2.5 hover:bg-indigo-50 text-gray-300 hover:text-indigo-600 rounded-xl transition-all"
                       >
                          <Edit2 size={14} />
                       </button>
                       <button className="p-2.5 hover:bg-rose-50 text-gray-300 hover:text-rose-600 rounded-xl transition-all">
                          <Trash2 size={14} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {materials.length === 0 && !isLoading && (
          <div className="py-24 flex flex-col items-center text-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <Tag size={32} />
             </div>
             <h3 className="text-sm font-black text-gray-800 uppercase italic">Không tìm thấy vật tư</h3>
             <p className="text-[11px] text-gray-400 font-medium">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
          </div>
        )}

        {isLoading && (
          <div className="py-24 flex flex-col items-center text-center">
             <Loader2 size={32} className="text-indigo-600 animate-spin mb-4" />
             <h3 className="text-sm font-black text-gray-800 uppercase italic">Đang tải dữ liệu...</h3>
          </div>
        )}
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
