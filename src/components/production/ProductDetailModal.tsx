"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  DollarSign,
  Clock,
  Layers,
  Plus,
  Trash2,
  Check,
  Package,
  ChevronRight,
  Loader2,
  Search,
  Tag,
  Save,
  ArrowUpRight,
  Calculator,
  Store,
  Globe
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMaterials } from '@/services/material.service';
import { updateProductBOM, updateProductCOGS, getProductDetail, upsertProduct } from '@/services/product.service';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BOMItem {
  id?: string;
  materialId: string;
  material: {
    name: string;
    unit: string;
    unitPrice: any;
    referencePrice: any;
  };
  quantity: number;
}

interface Product {
  id: string;
  sku: string | null;
  name: string | null;
  basePrice: any;
  costPrice: any;
  wholesalePrice: any;
  exportPrice: any;
  productionTimeStd: number | null;
  bomItems?: BOMItem[];
  cogsConfig?: any;
}

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onUpdate: () => void;
}

export default function ProductDetailModal({ isOpen, onClose, product, onUpdate }: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'bom' | 'cogs'>('general');
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isSavingBOM, setIsSavingBOM] = useState(false);
  const [isSavingCOGS, setIsSavingCOGS] = useState(false);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isLoadingBOM, setIsLoadingBOM] = useState(false);

  const [productionTimeStd, setProductionTimeStd] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [exportPrice, setExportPrice] = useState<number>(0);
  const [wasteRatio, setWasteRatio] = useState<number>(0.05);
  const [customCosts, setCustomCosts] = useState<any[]>([]);
  const [productionNotes, setProductionNotes] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState<string>('');

  useEffect(() => {
    if (isOpen && product.id) {
      setProductionTimeStd(product.productionTimeStd || 0);
      loadProductDetail();
      loadMaterials();
    }
  }, [isOpen, product.id]);

  const loadProductDetail = async () => {
    setIsLoadingBOM(true);
    try {
      const data = await getProductDetail(product.id);
      if (data) {
        setProductionTimeStd(data.productionTimeStd || 0);
        setWholesalePrice(Number(data.wholesalePrice || 0));
        setExportPrice(Number(data.exportPrice || 0));
      }

      if (data?.bomItems) {
        setBomItems(data.bomItems.map((item: any) => ({
          ...item,
          quantity: Number(item.quantity),
          material: {
            ...item.material,
            unitPrice: Number(item.material.unitPrice),
            referencePrice: Number(item.material.referencePrice)
          }
        })) as any);
      }

      const detail = data as any;
      if (detail?.cogsConfig) {
        const config = detail.cogsConfig;
        setWasteRatio(config.wasteRatio ?? 0.05);
        setCustomCosts(config.customCosts || []);
        setProductionNotes(config.productionNotes || []);
      } else {
        setWasteRatio(0.05);
        setCustomCosts([
          { id: '1', name: 'Nhân công', details: `${data?.productionTimeStd || product.productionTimeStd || 0} phút lắp ráp & đóng gói`, amount: (data?.productionTimeStd || product.productionTimeStd || 0) * 500 },
          { id: '2', name: 'Máy móc/Điện', details: 'Khấu hao máy Laser & Điện', amount: (data?.productionTimeStd || product.productionTimeStd || 0) * 50 }
        ]);
        setProductionNotes([
          "Sản phẩm yêu cầu độ hoàn thiện cao.",
          "Chú ý phần keo dán mép và thời gian khô keo trước khi đóng gói."
        ]);
      }
    } catch (error) {
      console.error('Failed to load product detail:', error);
    } finally {
      setIsLoadingBOM(false);
    }
  };

  const loadMaterials = async () => {
    try {
      const data = await getMaterials({});
      setMaterials(data);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  const handleAddMaterial = (material: any) => {
    if (bomItems.some(item => item.materialId === material.id)) return;

    setBomItems([
      ...bomItems,
      {
        materialId: material.id,
        material: {
          name: material.name,
          unit: material.unit,
          unitPrice: Number(material.unitPrice || material.referencePrice),
          referencePrice: Number(material.referencePrice)
        },
        quantity: 1
      }
    ]);
  };

  const handleRemoveMaterial = (materialId: string) => {
    setBomItems(bomItems.filter(item => item.materialId !== materialId));
  };

  const handleUpdateQuantity = (materialId: string, qty: number) => {
    setBomItems(bomItems.map(item =>
      item.materialId === materialId ? { ...item, quantity: qty } : item
    ));
  };

  const handleSaveBOM = async () => {
    setIsSavingBOM(true);
    try {
      await updateProductBOM(
        product.id,
        bomItems.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity
        }))
      );
      onUpdate();
    } catch (error) {
      console.error('Failed to save BOM:', error);
      alert('Có lỗi xảy ra khi lưu định mức.');
    } finally {
      setIsSavingBOM(false);
    }
  };

  const handleSaveCOGS = async () => {
    setIsSavingCOGS(true);
    try {
      const cogsConfig = {
        wasteRatio,
        customCosts,
        productionNotes
      };
      
      await upsertProduct({
        id: product.id,
        productionTimeStd,
        wholesalePrice,
        exportPrice,
        cogsConfig: cogsConfig as any
      } as any);
      
      onUpdate();
    } catch (error) {
      console.error('Failed to save COGS:', error);
      alert('Có lỗi xảy ra khi lưu cấu hình giá thành.');
    } finally {
      setIsSavingCOGS(false);
    }
  };

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      await upsertProduct({
        id: product.id,
        productionTimeStd,
        cogsConfig: {
          ...product.cogsConfig,
          productionNotes
        }
      } as any);
      onUpdate();
    } catch (error) {
      console.error('Failed to save general info:', error);
      alert('Có lỗi xảy ra khi lưu thông tin chung.');
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const updateCustomCost = (id: string, field: string, value: any) => {
    setCustomCosts(customCosts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeCustomCost = (id: string) => {
    setCustomCosts(customCosts.filter(c => c.id !== id));
  };

  const addCustomCost = () => {
    setCustomCosts([...customCosts, { id: Date.now().toString(), name: '', details: '', amount: 0 }]);
  };

  const addNote = () => {
    if (!noteInput.trim()) return;
    setProductionNotes([...productionNotes, noteInput.trim()]);
    setNoteInput('');
  };

  const removeNote = (index: number) => {
    setProductionNotes(productionNotes.filter((_, i) => i !== index));
  };

  const updateNote = (index: number, value: string) => {
    const newNotes = [...productionNotes];
    newNotes[index] = value;
    setProductionNotes(newNotes);
  };

  const totalMaterialCost = bomItems.reduce((acc, item) => {
    const price = item.material.unitPrice || item.material.referencePrice || 0;
    return acc + (Number(price) * item.quantity);
  }, 0);

  const wasteCost = totalMaterialCost * wasteRatio;
  const customTotal = customCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

  const totalCOGS = totalMaterialCost + wasteCost + customTotal;

  const materialDetailsNames = bomItems.map(item => `${item.material.name} (${item.quantity} ${item.material.unit})`).join(', ');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-7xl h-[92vh] max-h-[900px] rounded-[48px] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">

        {/* HEADER */}
        <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center text-indigo-600">
              <Package size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                Chi tiết <span className="text-indigo-600 underline decoration-2 underline-offset-4">Sản phẩm</span>
              </h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{product.sku || 'NO-SKU'}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                <span className="text-xs font-black text-gray-700 uppercase tracking-tight">{product.name || 'Sản phẩm mới'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {activeTab === 'general' && (
              <button
                onClick={handleSaveGeneral}
                disabled={isSavingGeneral}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-indigo-500/20",
                  isSavingGeneral
                    ? "bg-gray-100 text-gray-400"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 hover:-translate-y-0.5"
                )}
              >
                {isSavingGeneral ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu thông tin
              </button>
            )}
            {activeTab === 'bom' && (
              <button
                onClick={handleSaveBOM}
                disabled={isSavingBOM}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-indigo-500/20",
                  isSavingBOM
                    ? "bg-gray-100 text-gray-400"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 hover:-translate-y-0.5"
                )}
              >
                {isSavingBOM ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu BOM
              </button>
            )}
            {activeTab === 'cogs' && (
              <button
                onClick={handleSaveCOGS}
                disabled={isSavingCOGS}
                className={cn(
                  "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-indigo-500/20",
                  isSavingCOGS
                    ? "bg-gray-100 text-gray-400"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 hover:-translate-y-0.5"
                )}
              >
                {isSavingCOGS ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Lưu COGS
              </button>
            )}
            <button onClick={onClose} className="p-3.5 hover:bg-white rounded-2xl text-gray-400 hover:text-gray-900 transition-all shadow-sm border border-transparent hover:border-gray-100">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="px-10 py-4 bg-gray-50/30 border-b border-gray-100 flex gap-8 flex-shrink-0">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2",
              activeTab === 'general' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Thông tin chung
          </button>
          <button
            onClick={() => setActiveTab('bom')}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2",
              activeTab === 'bom' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Định mức Vật tư (BOM)
          </button>
          <button
            onClick={() => setActiveTab('cogs')}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest pb-2 transition-all border-b-2",
              activeTab === 'cogs' ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"
            )}
          >
            Bảng Giá Thành (COGS)
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-10">
          {activeTab === 'general' ? (
            <div className="flex flex-col h-full animate-in slide-in-from-left-4 duration-500 bg-gray-50/30 -m-10 p-10 rounded-b-[48px]">
              <div className="flex flex-col gap-10 flex-1 pb-10">

                {/* PHẦN TRÊN: 2 CỘT (CONFIG & ẢNH) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                  {/* CỘT TRÁI: DỮ LIÊU & CẤU HÌNH */}
                  <div className="space-y-6">
                    <h3 className="text-[13px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <Tag size={16} />
                      </div>
                      Thông tin cơ bản
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                      {/* Card 1: Thời gian */}
                      <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full flex flex-col justify-center">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-2">Thời gian tiêu chuẩn</p>
                        <div className="flex items-center gap-4 px-2">
                          <div className="w-12 h-12 rounded-[20px] bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                            <Clock size={22} />
                          </div>
                          <div className="flex-1 flex items-baseline gap-2 overflow-hidden">
                            <input
                              type="number"
                              value={productionTimeStd === 0 ? '' : productionTimeStd}
                              onChange={(e) => setProductionTimeStd(Number(e.target.value))}
                              placeholder="0"
                              className="w-full text-3xl font-black text-gray-900 bg-transparent outline-none tabular-nums placeholder:text-gray-300 min-w-0"
                            />
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex-shrink-0">Phút</span>
                          </div>
                        </div>
                      </div>
                      {/* Card 2: Giá vốn (DB costPrice) */}
                      <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full flex flex-col justify-center">
                        <div className="flex justify-between items-center mb-4 px-2">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Giá vốn (Database)</p>
                          <button 
                            type="button"
                            onClick={async () => {
                              const module = await import('@/services/product.service');
                              const res = await module.recalculateProductCostPrice(product.id);
                              if (res) {
                                alert(`Giá vốn đã cập nhật từ ${res.oldPrice.toLocaleString()} VNĐ thành ${res.newPrice.toLocaleString()} VNĐ.`);
                                onUpdate();
                                loadProductDetail();
                              }
                            }}
                            className="p-1.5 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-lg transition-all"
                            title="Cập nhật theo BOM"
                          >
                            <Calculator size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4 px-2">
                          <div className="w-12 h-12 rounded-[20px] bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                            <Layers size={22} />
                          </div>
                          <div className="flex-1 flex items-baseline justify-between gap-2 overflow-hidden">
                            <p className="text-2xl font-black text-indigo-900 tabular-nums leading-none">
                              {Math.round(Number((product as any).costPrice || 0)).toLocaleString()}
                            </p>
                            <span className="text-[9px] text-indigo-400 font-black uppercase tracking-tighter flex-shrink-0">VNĐ/SP</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Giá Sỉ */}
                      <div className={cn(
                        "p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full flex flex-col justify-center",
                        wholesalePrice > 0 && wholesalePrice < totalCOGS && "bg-red-50 border-red-200"
                      )}>
                        <p className={cn(
                          "text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex justify-between px-2",
                          wholesalePrice > 0 && wholesalePrice < totalCOGS && "text-red-500"
                        )}>
                          Giá Sỉ (x1.3)
                          {wholesalePrice > 0 && wholesalePrice < totalCOGS && <span className="animate-pulse">Bán lỗ!</span>}
                        </p>
                        <div className="flex items-center gap-4 px-2">
                          <div className={cn(
                            "w-12 h-12 rounded-[20px] bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-100 group-hover:scale-110 transition-transform",
                            wholesalePrice > 0 && wholesalePrice < totalCOGS && "bg-red-500"
                          )}>
                            <Store size={22} />
                          </div>
                          <div className="flex-1 flex items-baseline justify-between gap-1.5 overflow-hidden">
                            <input
                              type="text"
                              value={(wholesalePrice === 0 ? Math.round(totalCOGS * 1.3) : wholesalePrice).toLocaleString()}
                              onChange={(e) => setWholesalePrice(Number(e.target.value.replace(/\./g, '').replace(/,/g, '')))}
                              className="w-full text-2xl font-black text-amber-900 bg-transparent outline-none tabular-nums placeholder:text-amber-200 min-w-0"
                            />
                            <span className="text-[9px] text-amber-500 font-black uppercase tracking-tighter flex-shrink-0">VNĐ/SP</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Giá Xuất Khẩu */}
                      <div className={cn(
                        "p-6 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group h-full flex flex-col justify-center",
                        exportPrice > 0 && exportPrice < totalCOGS && "bg-red-50 border-red-200"
                      )}>
                        <p className={cn(
                          "text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex justify-between px-2",
                          exportPrice > 0 && exportPrice < totalCOGS && "text-red-500"
                        )}>
                          Giá Xuất khẩu (x1.8)
                          {exportPrice > 0 && exportPrice < totalCOGS && <span className="animate-pulse">Bán lỗ!</span>}
                        </p>
                        <div className="flex items-center gap-4 px-2">
                          <div className={cn(
                            "w-12 h-12 rounded-[20px] bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100 group-hover:scale-110 transition-transform",
                            exportPrice > 0 && exportPrice < totalCOGS && "bg-red-500"
                          )}>
                            <Globe size={22} />
                          </div>
                          <div className="flex-1 flex items-baseline justify-between gap-1.5 overflow-hidden">
                            <input
                              type="text"
                              value={(exportPrice === 0 ? Math.round(totalCOGS * 1.8) : exportPrice).toLocaleString()}
                              onChange={(e) => setExportPrice(Number(e.target.value.replace(/\./g, '').replace(/,/g, '')))}
                              className="w-full text-2xl font-black text-emerald-900 bg-transparent outline-none tabular-nums placeholder:text-emerald-200 min-w-0"
                            />
                            <span className="text-[9px] text-emerald-500 font-black uppercase tracking-tighter flex-shrink-0">VNĐ/SP</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* CỘT PHẢI: ẢNH MINH HỌA (SHRUNK) */}
                  <div className="space-y-6 flex flex-col">
                    <h3 className="text-[13px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500">
                        <Package size={16} />
                      </div>
                      Ảnh sản phẩm
                    </h3>
                    <div className="w-full h-[200px] bg-white rounded-[40px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 group hover:bg-gray-50 hover:border-indigo-300 hover:shadow-xl transition-all duration-500 cursor-pointer overflow-hidden relative">
                      <div className="absolute inset-4 rounded-[32px] border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <Layers size={64} className="mb-4 group-hover:text-indigo-400 group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-700 ease-out opacity-20" />
                      <div className="text-center relative z-10">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-indigo-600 transition-colors">Chưa có ảnh</p>
                        <p className="text-[10px] mt-2 opacity-60 font-bold bg-gray-100 px-4 py-1.5 rounded-full text-gray-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">Tải lên</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {/* CHÚ Ý (Notes CRUD) */}
                  <div className="p-8 bg-white/60 rounded-[32px] border border-gray-200 border-dashed flex flex-col md:flex-row items-center gap-8 group/note-box hover:border-rose-200 transition-colors duration-500">
                    <div className="flex-shrink-0">
                      <h3 className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-1 leading-none">Cần</h3>
                      <p className="text-sm font-black text-gray-800 uppercase tracking-widest leading-none">Chú ý</p>
                    </div>
                    <div className="w-px h-12 bg-gray-200 hidden md:block" />

                    <div className="flex-1 w-full space-y-3">
                      {productionNotes.length > 0 ? (
                        <div className="space-y-2">
                          {productionNotes.map((note, idx) => (
                            <div key={idx} className="group flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shadow-rose-200 flex-shrink-0 flex items-center justify-center">
                                <div className="w-1 h-1 rounded-full bg-white" />
                              </div>
                              <input
                                value={note}
                                onChange={(e) => updateNote(idx, e.target.value)}
                                className="flex-1 bg-transparent text-sm text-rose-600 font-black italic border-b border-transparent hover:border-rose-100 focus:border-rose-300 outline-none py-0.5 transition-all min-w-0"
                              />
                              <button
                                onClick={() => removeNote(idx)}
                                className="p-1 px-2.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Xóa chú ý"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 font-medium italic px-2">Chưa có chú ý nào cho sản phẩm này.</p>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <div className="w-3 h-3 rounded-full bg-gray-100 flex-shrink-0" />
                        <input
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addNote()}
                          placeholder="Thêm chú ý mới tại đây..."
                          className="flex-1 bg-transparent text-sm text-gray-400 font-medium italic border-b border-gray-50 hover:border-indigo-100 focus:border-indigo-400 focus:text-indigo-600 outline-none py-0.5 transition-all min-w-0"
                        />
                        <button
                          onClick={addNote}
                          disabled={!noteInput.trim()}
                          className={cn(
                            "p-1.5 rounded-lg transition-all",
                            noteInput.trim() ? "text-indigo-600 hover:bg-indigo-50" : "text-gray-200 pointer-events-none"
                          )}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER NÚT BẤM REMOVED FOR FLOATING */}
            </div>
          ) : activeTab === 'bom' ? (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 h-full flex flex-col">
              {/* BOM ACTIONS & SEARCH */}
              <div className="flex gap-4 flex-shrink-0">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    onChange={(e) => {
                      const mat = materials.find(m => m.id === e.target.value);
                      if (mat) handleAddMaterial(mat);
                      e.target.value = "";
                    }}
                    className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[28px] text-xs font-bold text-gray-700 outline-none focus:border-indigo-300 shadow-sm transition-all appearance-none cursor-pointer"
                  >
                    <option value="">+ Thêm vật tư vào BOM (Chọn từ danh mục)...</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id} disabled={bomItems.some(bi => bi.materialId === m.id)}>
                        {m.name} ({m.sku})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BOM TABLE */}
              <div className="flex-1 overflow-hidden flex flex-col bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-50/50 min-h-[360px]">
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md">
                      <tr className="border-b border-gray-100">
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vật tư</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Số lượng (Q'ty)</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Đơn vị</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Đơn giá</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Thành tiền</th>
                        <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {isLoadingBOM ? (
                        <tr>
                          <td colSpan={6} className="py-20 text-center">
                            <Loader2 size={32} className="text-indigo-600 animate-spin mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Đang tải định mức...</p>
                          </td>
                        </tr>
                      ) : bomItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-20 text-center">
                            <Layers size={32} className="text-gray-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest italic">Chưa có linh kiện được gán</p>
                          </td>
                        </tr>
                      ) : bomItems.map((item) => {
                        const unitPrice = item.material.unitPrice || item.material.referencePrice || 0;
                        const total = unitPrice * item.quantity;
                        return (
                          <tr key={item.materialId} className="hover:bg-indigo-50/10 group transition-colors">
                            <td className="px-8 py-5">
                              <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{item.material.name}</p>
                            </td>
                            <td className="px-8 py-5 text-center">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(item.materialId, Number(e.target.value))}
                                className="w-20 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-black text-center text-indigo-600 outline-none focus:bg-white focus:border-indigo-200"
                              />
                            </td>
                            <td className="px-8 py-5 text-center">
                              <span className="text-[10px] font-bold text-gray-400 uppercase">{item.material.unit}</span>
                            </td>
                            <td className="px-8 py-5 text-right font-black text-xs text-gray-600 tabular-nums">
                              {unitPrice.toLocaleString()} VNĐ
                            </td>
                            <td className="px-8 py-5 text-right font-black text-xs text-indigo-600 tabular-nums">
                              {total.toLocaleString()} VNĐ
                            </td>
                            <td className="px-8 py-5 text-center">
                              <button
                                onClick={() => handleRemoveMaterial(item.materialId)}
                                className="p-2 hover:bg-rose-50 text-gray-300 hover:text-rose-600 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 h-full flex flex-col">
              {/* COGS CALCULATION TABLE & FOOTER */}
              <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-50/50 p-8 flex-1 overflow-y-auto flex flex-col">
                <div className="flex-1">
                  <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <DollarSign size={16} className="text-indigo-600" />
                    Bảng Tính Giá Thành Sản Phẩm (COGS)
                  </h3>

                  <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden mb-6">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hạng mục</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Chi tiết</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Giá</th>
                          <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Thành tiền</th>
                          <th className="px-4 py-4 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {/* Nguyên liệu */}
                        <tr>
                          <td className="px-6 py-4 text-xs font-bold text-gray-700">Nguyên liệu</td>
                          <td className="px-6 py-4 text-xs text-gray-500 line-clamp-2">{materialDetailsNames || 'Chưa có nguyên liệu'}</td>
                          <td className="px-6 py-4 text-xs font-black text-gray-400 text-right tabular-nums">-</td>
                          <td className="px-6 py-4 text-xs font-black text-gray-900 text-right tabular-nums">{totalMaterialCost.toLocaleString()} VNĐ</td>
                          <td className="px-4 py-4 w-10"></td>
                        </tr>
                        {/* Hao hụt */}
                        <tr>
                          <td className="px-6 py-4 text-xs font-bold text-gray-700">Hao hụt</td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={Math.round(wasteRatio * 100)}
                                onChange={(e) => setWasteRatio(Number(e.target.value) / 100)}
                                className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-indigo-600 outline-none focus:bg-white focus:border-indigo-300"
                              /> <span className="text-[10px] font-bold text-gray-400 uppercase">% (Dự phòng hao hụt)</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-black text-gray-400 text-right tabular-nums">-</td>
                          <td className="px-6 py-4 text-xs font-black text-gray-900 text-right tabular-nums">{Math.round(wasteCost).toLocaleString()} VNĐ</td>
                          <td className="px-4 py-4 w-10"></td>
                        </tr>
                        {/* Custom Costs */}
                        {customCosts.map(cost => (
                          <tr key={cost.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-3">
                              <input
                                value={cost.name}
                                onChange={(e) => updateCustomCost(cost.id, 'name', e.target.value)}
                                className="w-full px-2 py-1.5 bg-transparent hover:bg-white border border-transparent hover:border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-300 transition-all cursor-text min-w-[80px]"
                                placeholder="Tên chi phí..."
                              />
                            </td>
                            <td className="px-6 py-3">
                              <input
                                value={cost.details}
                                onChange={(e) => updateCustomCost(cost.id, 'details', e.target.value)}
                                className="w-full px-2 py-1.5 bg-transparent hover:bg-white border border-transparent hover:border-gray-200 rounded-lg text-xs text-gray-500 outline-none focus:bg-white focus:border-indigo-300 transition-all cursor-text"
                                placeholder="Chi tiết diễn giải..."
                              />
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <input
                                  type="number"
                                  value={cost.amount === 0 ? '' : cost.amount}
                                  onChange={(e) => updateCustomCost(cost.id, 'amount', Number(e.target.value))}
                                  className="w-24 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-black text-indigo-600 text-right tabular-nums outline-none focus:bg-white focus:border-indigo-300 transition-all cursor-text"
                                  placeholder="0"
                                />
                                <span className="text-[10px] font-black text-gray-400 uppercase">VNĐ</span>
                              </div>
                            </td>
                            <td className="px-6 py-3 text-right">
                               <p className="text-xs font-black text-gray-900 tabular-nums">
                                 {Number(cost.amount || 0).toLocaleString()} VNĐ
                               </p>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => removeCustomCost(cost.id)}
                                className="p-1.5 hover:bg-rose-50 text-gray-300 hover:text-rose-600 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-indigo-50/50 border-t border-indigo-100">
                        <tr>
                          <td colSpan={5} className="px-6 py-3 bg-gray-50/80">
                            <button
                              onClick={addCustomCost}
                              className="text-[10px] font-black text-indigo-600 flex items-center gap-1.5 hover:text-indigo-800 transition-colors uppercase tracking-widest px-2 py-1 rounded hover:bg-indigo-50"
                            >
                              <Plus size={14} /> Thêm dòng chi phí khác
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-5 text-xs font-black text-indigo-900 uppercase tracking-widest" colSpan={3}>TỔNG GIÁ THÀNH (COGS)</td>
                          <td className="px-6 py-5 text-sm font-black text-indigo-600 text-right tabular-nums">{Math.round(totalCOGS).toLocaleString()} VNĐ</td>
                          <td className="px-4 py-5 w-10"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* FLOATING ACTION BUTTON AREA - REMOVED */}
        {/* WE MOVED SAVE BUTTONS TO HEADER TO AVOID OVERLAPPING WARNINGS */}
      </div>
    </div>
  );
}
