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
  FileText
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
    } catch (error: any) {
      console.error('Failed to save material full error:', error);
      const errorMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      alert(`Có lỗi xảy ra khi lưu vật tư: ${errorMsg}`);
    }
  };

  const handleEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const types = ['All', 'Giấy', 'Keo', 'Phụ kiện'];

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-2 border-retro-sepia/10 pb-10">
        <div>
          <h1 className="text-4xl font-typewriter font-black text-retro-sepia tracking-tighter uppercase italic mb-2">
            Từ điển <span className="text-retro-brick underline decoration-double decoration-1 underline-offset-8 transition-all">Vật tư</span>
          </h1>
          <p className="font-handwriting text-lg text-retro-earth flex items-center gap-2">
            <FileText size={18} strokeWidth={1.5} /> Sổ cái quản lý nguyên vật liệu cơ sở
          </p>
        </div>

        <button 
          onClick={() => {
            setEditingMaterial(null);
            setIsModalOpen(true);
          }}
          className="retro-btn bg-retro-brick text-white min-w-[240px]"
        >
          <Plus size={20} strokeWidth={1.5} />
          Đăng ký vật tư mới
        </button>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 relative group">
          <input 
            type="text"
            placeholder="Truy tìm theo tên hoặc SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/50 border-2 border-retro-sepia/10 py-5 pl-14 pr-8 font-typewriter text-sm font-bold text-retro-sepia outline-none focus:border-retro-sepia focus:bg-white transition-all uppercase placeholder:opacity-30"
          />
          <Search size={22} strokeWidth={1.5} className="absolute left-5 top-1/2 -translate-y-1/2 text-retro-sepia/30 group-focus-within:text-retro-brick transition-colors" />
        </div>

        <div className="flex flex-wrap items-center gap-3 p-2 bg-retro-paper border-2 border-retro-sepia/5 shadow-inner">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "px-6 py-2.5 font-typewriter text-[11px] font-black uppercase tracking-widest transition-all",
                activeType === type 
                  ? "bg-retro-sepia text-retro-mustard shadow-lg transform -translate-y-0.5"
                  : "text-retro-sepia/40 hover:text-retro-sepia hover:bg-retro-sepia/5"
              )}
            >
              {type === 'All' ? 'Tất cả' : type}
            </button>
          ))}
        </div>
      </div>

      {/* MATERIALS LEDGER */}
      <div className="retro-card !p-0 !bg-white overflow-hidden border-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-retro-sepia text-retro-paper border-b-2 border-retro-sepia font-typewriter">
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest">Mô tả / Mã hiệu (SKU)</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest">Phân loại</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-center">Đơn vị</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-center">Tồn thực tế</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-right">Đơn giá tham chiếu</th>
                <th className="px-8 py-6 text-[11px] font-black uppercase tracking-widest text-center">Xác nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-retro-sepia/5">
              {materials.map((m) => (
                <tr key={m.id} className={cn(
                  "hover:bg-retro-paper/20 transition-all font-serif italic",
                  m.stockQuantity < m.minStock && "bg-retro-brick/5"
                )}>
                  <td className="px-8 py-8">
                    <div className="flex items-center gap-5">
                       <div className="w-12 h-12 bg-retro-paper flex items-center justify-center text-retro-sepia/20 border border-retro-sepia/5">
                          <Box size={24} strokeWidth={1} />
                       </div>
                       <div>
                          <p className="text-[14px] font-black text-retro-sepia uppercase not-italic tracking-tighter">{m.name}</p>
                          <p className="text-[10px] text-retro-earth font-typewriter font-bold uppercase tracking-widest mt-1 opacity-70">{m.sku}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-8">
                    <span className={cn(
                      "font-typewriter text-[9px] font-black uppercase tracking-widest border px-3 py-1 bg-white",
                      m.type === 'Giấy' ? "text-retro-moss border-retro-moss/20" :
                      m.type === 'Keo' ? "text-retro-mustard border-retro-mustard/20" :
                      "text-retro-brick border-retro-brick/20"
                    )}>
                      {m.type}
                    </span>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <span className="font-handwriting text-lg text-retro-sepia opacity-60">{m.unit}</span>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <div className="flex flex-col items-center">
                       <p className={cn(
                         "text-xl font-typewriter font-black tracking-tight",
                         m.stockQuantity < m.minStock ? "text-retro-brick underline decoration-wavy" : "text-retro-sepia"
                       )}>
                         {m.stockQuantity}
                       </p>
                       <p className="text-[9px] text-retro-earth uppercase font-black tracking-tighter mt-1">Min: {m.minStock}</p>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-right font-typewriter">
                    <p className="text-[15px] font-black text-retro-sepia tabular-nums">
                      {m.referencePrice.toLocaleString()}đ
                    </p>
                    {m.unitPrice && m.unitPrice > 0 && (
                      <p className="text-[9px] text-retro-moss font-bold uppercase tracking-tight italic">
                        Smart: {m.unitPrice.toLocaleString()}đ
                      </p>
                    )}
                  </td>
                  <td className="px-8 py-8">
                    <div className="flex items-center justify-center gap-3">
                       <button 
                        onClick={() => handleEdit(m)}
                        className="p-3 bg-retro-paper hover:bg-retro-sepia hover:text-white transition-all border border-retro-sepia/5"
                       >
                          <Edit2 size={16} strokeWidth={1.5} />
                       </button>
                       <button className="p-3 bg-retro-paper hover:bg-retro-brick hover:text-white transition-all border border-retro-sepia/5">
                          <Trash2 size={16} strokeWidth={1.5} />
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
             <div className="w-20 h-20 bg-retro-paper flex items-center justify-center text-retro-sepia/10 mb-6 border border-retro-sepia/5 rotate-12">
                <Tag size={40} strokeWidth={1} />
             </div>
             <h3 className="text-xl font-typewriter font-black text-retro-sepia uppercase italic mb-2">Thư viện trống</h3>
             <p className="font-handwriting text-lg text-retro-earth max-w-xs">Chưa có bản ghi nào khớp với điều kiện trích xuất dữ liệu.</p>
          </div>
        )}

        {isLoading && (
          <div className="py-24 flex flex-col items-center text-center">
             <Loader2 size={48} className="text-retro-brick animate-spin mb-6" strokeWidth={1.5} />
             <h3 className="text-lg font-typewriter font-black text-retro-sepia uppercase tracking-[0.2em] animate-pulse">Đang nạp dữ liệu từ kho...</h3>
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
