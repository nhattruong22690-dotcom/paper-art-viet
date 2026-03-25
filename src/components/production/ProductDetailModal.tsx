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
    sku?: string | null;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 md:p-12 animate-in fade-in duration-500 overflow-hidden font-typewriter">
      <div className="absolute inset-0 bg-retro-sepia/40 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-7xl h-[94vh] max-h-[1000px] retro-card !p-0 shadow-[0_30px_60px_-15px_rgba(62,39,35,0.5)] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border-2">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
           <Package size={600} strokeWidth={0.5} className="text-retro-sepia" />
        </div>

        {/* HEADER */}
        <div className="px-12 py-10 border-b-2 border-retro-sepia/10 flex justify-between items-end bg-retro-paper/20 relative shrink-0">
          <div className="flex items-center gap-8 relative z-10">
            <div className="w-20 h-20 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia shadow-sm rotate-3">
              <Package size={40} strokeWidth={1.5} />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-retro-sepia uppercase tracking-tighter italic">
                Hồ sơ <span className="text-retro-brick underline decoration-double decoration-retro-brick/30 underline-offset-4">Vật phẩm</span>
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] opacity-60 italic">{product.sku || 'CHƯA-GÁN-MÃ'}</span>
                <div className="w-1.5 h-1.5 bg-retro-mustard rotate-45" />
                <span className="text-sm font-black text-retro-sepia uppercase tracking-tight italic underline decoration-retro-mustard/30 underline-offset-4">
                   {product.name || 'Bản ghi nguyên mẫu'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 relative z-10">
            {activeTab === 'general' && (
              <button
                onClick={handleSaveGeneral}
                disabled={isSavingGeneral}
                className={cn(
                  "px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3 shadow-[4px_4px_0px_#3E272333] active:scale-95",
                  isSavingGeneral
                    ? "bg-retro-paper text-retro-earth/40 cursor-not-allowed border-2 border-retro-sepia/5"
                    : "bg-retro-brick text-white hover:bg-retro-sepia"
                )}
              >
                {isSavingGeneral ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : <Save size={18} strokeWidth={1.5} />}
                Ghi nhận Hồ sơ
              </button>
            )}
            {activeTab === 'bom' && (
              <button
                onClick={handleSaveBOM}
                disabled={isSavingBOM}
                className={cn(
                  "px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3 shadow-[4px_4px_0px_#3E272333] active:scale-95",
                  isSavingBOM
                    ? "bg-retro-paper text-retro-earth/40 cursor-not-allowed border-2 border-retro-sepia/5"
                    : "bg-retro-brick text-white hover:bg-retro-sepia"
                )}
              >
                {isSavingBOM ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : <Save size={18} strokeWidth={1.5} />}
                Cập nhật Định mức
              </button>
            )}
            {activeTab === 'cogs' && (
              <button
                onClick={handleSaveCOGS}
                disabled={isSavingCOGS}
                className={cn(
                  "px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3 shadow-[4px_4px_0px_#3E272333] active:scale-95",
                  isSavingCOGS
                    ? "bg-retro-paper text-retro-earth/40 cursor-not-allowed border-2 border-retro-sepia/5"
                    : "bg-retro-brick text-white hover:bg-retro-sepia"
                )}
              >
                {isSavingCOGS ? <Loader2 size={18} strokeWidth={1.5} className="animate-spin" /> : <Save size={18} strokeWidth={1.5} />}
                Niêm yết Biểu giá
              </button>
            )}
            <button 
              onClick={onClose} 
              className="p-4 bg-retro-paper border-2 border-retro-sepia/10 hover:bg-retro-brick/10 hover:text-retro-brick transition-all rotate-2 hover:rotate-0 shadow-sm"
            >
              <X size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>


        {/* TABS */}
        <div className="px-12 py-6 bg-retro-paper/40 border-b-2 border-retro-sepia/10 flex gap-10 shrink-0 relative z-10">
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] pb-3 transition-all border-b-2 italic",
              activeTab === 'general' ? "border-retro-brick text-retro-brick" : "border-transparent text-retro-earth/40 hover:text-retro-sepia"
            )}
          >
            Thông số kỹ nghệ
          </button>
          <button
            onClick={() => setActiveTab('bom')}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] pb-3 transition-all border-b-2 italic",
              activeTab === 'bom' ? "border-retro-brick text-retro-brick" : "border-transparent text-retro-earth/40 hover:text-retro-sepia"
            )}
          >
            Định mức Vật tư (BOM)
          </button>
          <button
            onClick={() => setActiveTab('cogs')}
            className={cn(
              "text-[10px] font-black uppercase tracking-[0.2em] pb-3 transition-all border-b-2 italic",
              activeTab === 'cogs' ? "border-retro-brick text-retro-brick" : "border-transparent text-retro-earth/40 hover:text-retro-sepia"
            )}
          >
            Sổ cái Giá thành (COGS)
          </button>
        </div>


        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-0">
          {activeTab === 'general' ? (
            <div className="flex flex-col h-full animate-in slide-in-from-left-4 duration-500 bg-retro-paper/10 p-12">
              <div className="flex flex-col gap-12 flex-1 pb-10 relative z-10">

                {/* PHẦN TRÊN: 2 CỘT (CONFIG & ẢNH) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                  {/* CỘT TRÁI: DỮ LIÊU & CẤU HÌNH */}
                  <div className="space-y-8">
                    <h3 className="text-[13px] font-black text-retro-sepia uppercase tracking-[0.3em] flex items-center gap-4 italic opacity-80">
                      <div className="w-10 h-10 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia">
                        <Tag size={18} strokeWidth={1.5} />
                      </div>
                      Đặc tính Kỹ nghệ cơ bản
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                      {/* Card 1: Thời gian */}
                      <div className="p-8 bg-white border-2 border-retro-sepia/10 shadow-sm hover:shadow-xl transition-all group h-full flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-retro-mustard/20" />
                        <p className="text-[10px] font-black text-retro-earth/60 uppercase tracking-[0.2em] mb-6 px-2 italic">Thanh toán thời lượng</p>
                        <div className="flex items-center gap-6 px-2">
                          <div className="w-14 h-14 bg-retro-sepia text-retro-paper flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform rotate-3 group-hover:rotate-0">
                            <Clock size={24} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 flex items-baseline gap-3 overflow-hidden">
                            <input
                              type="number"
                              value={productionTimeStd === 0 ? '' : productionTimeStd}
                              onChange={(e) => setProductionTimeStd(Number(e.target.value))}
                              placeholder="0"
                              className="w-full text-4xl font-black text-retro-sepia bg-transparent outline-none tabular-nums placeholder:text-retro-sepia/10 min-w-0"
                            />
                            <span className="text-[9px] text-retro-earth/40 font-black uppercase tracking-widest flex-shrink-0">PHÚT</span>
                          </div>
                        </div>
                      </div>
                      {/* Card 2: Giá vốn (DB costPrice) */}
                      <div className="p-8 bg-white border-2 border-retro-sepia/10 shadow-sm hover:shadow-xl transition-all group h-full flex flex-col justify-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-retro-brick/20" />
                        <div className="flex justify-between items-center mb-6 px-2">
                          <p className="text-[10px] font-black text-retro-brick uppercase tracking-[0.2em] italic">Nguyên giá Sổ cái</p>
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
                            className="p-2 bg-retro-paper border border-retro-brick/20 text-retro-brick hover:bg-retro-brick hover:text-white transition-all shadow-sm"
                            title="Tính toán lại theo BOM"
                          >
                            <Calculator size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                        <div className="flex items-center gap-6 px-2">
                          <div className="w-14 h-14 bg-retro-brick text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform -rotate-3 group-hover:rotate-0">
                            <Layers size={24} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 flex items-baseline justify-between gap-3 overflow-hidden">
                            <p className="text-3xl font-black text-retro-brick tabular-nums leading-none">
                              {Math.round(Number((product as any).costPrice || 0)).toLocaleString()}
                            </p>
                            <span className="text-[9px] text-retro-brick/40 font-black uppercase tracking-widest flex-shrink-0">VNĐ/ĐV</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Giá Sỉ */}
                      <div className={cn(
                        "p-8 bg-white border-2 border-retro-sepia/10 shadow-sm hover:shadow-xl transition-all group h-full flex flex-col justify-center relative overflow-hidden",
                        wholesalePrice > 0 && wholesalePrice < totalCOGS && "bg-retro-brick/5 border-retro-brick/20"
                      )}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-retro-mustard" />
                        <p className={cn(
                          "text-[10px] font-black text-retro-mustard uppercase tracking-[0.2em] mb-6 flex justify-between px-2 italic",
                          wholesalePrice > 0 && wholesalePrice < totalCOGS && "text-retro-brick"
                        )}>
                          Niêm giá Sỉ (x1.3)
                          {wholesalePrice > 0 && wholesalePrice < totalCOGS && <span className="animate-pulse flex items-center gap-2 italic font-black text-retro-brick">CẢNH BÁO LỖ</span>}
                        </p>
                        <div className="flex items-center gap-6 px-2">
                          <div className={cn(
                            "w-14 h-14 bg-retro-mustard text-retro-sepia flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform rotate-6 group-hover:rotate-0",
                            wholesalePrice > 0 && wholesalePrice < totalCOGS && "bg-retro-brick text-white"
                          )}>
                            <Store size={24} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 flex items-baseline justify-between gap-3 overflow-hidden">
                            <input
                              type="text"
                              value={(wholesalePrice === 0 ? Math.round(totalCOGS * 1.3) : wholesalePrice).toLocaleString()}
                              onChange={(e) => setWholesalePrice(Number(e.target.value.replace(/\./g, '').replace(/,/g, '')))}
                              className="w-full text-3xl font-black text-retro-sepia bg-transparent outline-none tabular-nums placeholder:text-retro-sepia/10 min-w-0"
                            />
                            <span className="text-[9px] text-retro-mustard/60 font-black uppercase tracking-widest flex-shrink-0">VNĐ/ĐV</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Giá Xuất Khẩu */}
                      <div className={cn(
                        "p-8 bg-white border-2 border-retro-sepia/10 shadow-sm hover:shadow-xl transition-all group h-full flex flex-col justify-center relative overflow-hidden",
                        exportPrice > 0 && exportPrice < totalCOGS && "bg-retro-brick/5 border-retro-brick/20"
                      )}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-retro-moss" />
                        <p className={cn(
                          "text-[10px] font-black text-retro-moss uppercase tracking-[0.2em] mb-6 flex justify-between px-2 italic",
                          exportPrice > 0 && exportPrice < totalCOGS && "text-retro-brick"
                        )}>
                          Niêm giá Ngoại thương (x1.8)
                          {exportPrice > 0 && exportPrice < totalCOGS && <span className="animate-pulse flex items-center gap-2 italic font-black text-retro-brick">CẢNH BÁO LỖ</span>}
                        </p>
                        <div className="flex items-center gap-6 px-2">
                          <div className={cn(
                            "w-14 h-14 bg-retro-moss text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform -rotate-6 group-hover:rotate-0",
                            exportPrice > 0 && exportPrice < totalCOGS && "bg-retro-brick text-white"
                          )}>
                            <Globe size={24} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 flex items-baseline justify-between gap-3 overflow-hidden">
                            <input
                              type="text"
                              value={(exportPrice === 0 ? Math.round(totalCOGS * 1.8) : exportPrice).toLocaleString()}
                              onChange={(e) => setExportPrice(Number(e.target.value.replace(/\./g, '').replace(/,/g, '')))}
                              className="w-full text-3xl font-black text-retro-sepia bg-transparent outline-none tabular-nums placeholder:text-retro-sepia/10 min-w-0"
                            />
                            <span className="text-[9px] text-retro-moss/60 font-black uppercase tracking-widest flex-shrink-0">VNĐ/ĐV</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* CỘT PHẢI: ẢNH MINH HỌA (SHRUNK) */}
                  <div className="space-y-8 flex flex-col">
                    <h3 className="text-[13px] font-black text-retro-sepia uppercase tracking-[0.3em] flex items-center gap-4 italic opacity-80">
                      <div className="w-10 h-10 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-earth/40">
                        <Package size={18} strokeWidth={1.5} />
                      </div>
                      Đồ hình Minh họa (Bản thảo)
                    </h3>
                    <div className="w-full h-[320px] bg-white border-4 border-dashed border-retro-sepia/10 flex flex-col items-center justify-center text-retro-earth/20 group hover:bg-white hover:border-retro-sepia/20 hover:shadow-2xl transition-all duration-500 cursor-pointer overflow-hidden relative shadow-inner">
                      <div className="absolute inset-8 border-2 border-retro-sepia/5 group-hover:border-retro-sepia/10 transition-colors" />
                      <Layers size={100} strokeWidth={0.5} className="mb-6 group-hover:text-retro-brick group-hover:scale-110 group-hover:-translate-y-4 transition-all duration-700 ease-out opacity-10" />
                      <div className="text-center relative z-10">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-retro-earth opacity-40 group-hover:text-retro-brick group-hover:opacity-100 transition-all italic">Lưu trữ đồ hình trống</p>
                        <p className="text-[9px] mt-8 font-black bg-retro-paper border border-retro-sepia/10 px-8 py-3 text-retro-sepia uppercase tracking-widest group-hover:bg-retro-brick group-hover:text-white transition-all shadow-sm rotate-1 group-hover:rotate-0">Khai báo Hình ảnh</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-10">
                  {/* CHÚ Ý (Notes CRUD) */}
                  <div className="p-12 bg-white border-2 border-retro-brick/10 border-dashed flex flex-col md:flex-row items-start gap-12 group/note-box hover:border-retro-brick transition-all duration-500 shadow-inner relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-2 h-full bg-retro-brick/10" />
                    <div className="flex-shrink-0 pt-2">
                      <h3 className="text-[10px] font-black text-retro-brick uppercase tracking-[0.4em] mb-4 leading-none italic opacity-60">Thư lục</h3>
                      <p className="text-xl font-black text-retro-sepia uppercase tracking-widest leading-none">Cương mục Sản xuất</p>
                    </div>
                    <div className="w-px h-24 bg-retro-sepia/10 hidden md:block" />

                    <div className="flex-1 w-full space-y-4">
                      {productionNotes.length > 0 ? (
                        <div className="space-y-3 font-handwriting">
                          {productionNotes.map((note, idx) => (
                            <div key={idx} className="group flex items-start gap-4 p-3 hover:bg-retro-paper transition-all border border-transparent hover:border-retro-sepia/10">
                              <div className="w-5 h-5 mt-1 bg-retro-brick text-white shadow-sm flex-shrink-0 flex items-center justify-center rotate-45 group-hover:rotate-0 transition-transform">
                                <Plus size={12} strokeWidth={3} className="rotate-45" />
                              </div>
                              <input
                                value={note}
                                onChange={(e) => updateNote(idx, e.target.value)}
                                className="flex-1 bg-transparent text-lg text-retro-sepia border-b border-transparent focus:border-retro-brick outline-none py-1 transition-all min-w-0"
                              />
                              <button
                                onClick={() => removeNote(idx)}
                                className="p-2 opacity-0 group-hover:opacity-100 text-retro-earth/20 hover:text-retro-brick hover:bg-white transition-all shadow-sm"
                                title="Xóa ghi chú"
                              >
                                <Trash2 size={16} strokeWidth={1.5} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-retro-earth/40 font-black italic px-4 py-6 uppercase tracking-widest opacity-60">Chưa có chỉ dẫn kỹ nghệ nào được ghi nhận.</p>
                      )}

                      <div className="flex items-center gap-6 pt-10 border-t border-retro-sepia/10">
                        <div className="w-5 h-5 border-2 border-retro-sepia/10 flex-shrink-0 rotate-45" />
                        <input
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addNote()}
                          placeholder="Thêm chỉ dẫn mới tại đây..."
                          className="flex-1 bg-transparent text-sm text-retro-earth/40 font-black italic border-b-2 border-retro-sepia/10 hover:border-retro-brick/30 focus:border-retro-brick focus:text-retro-sepia outline-none py-3 transition-all min-w-0 uppercase tracking-tight"
                        />
                        <button
                          onClick={addNote}
                          disabled={!noteInput.trim()}
                          className={cn(
                            "p-4 transition-all rotate-3 hover:rotate-0 flex items-center justify-center",
                            noteInput.trim() ? "bg-retro-brick text-white shadow-lg shadow-retro-brick/20" : "bg-retro-paper text-retro-earth/20 pointer-events-none grayscale"
                          )}
                        >
                          <Plus size={24} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER NÚT BẤM REMOVED FOR FLOATING */}
            </div>
          ) : activeTab === 'bom' ? (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 h-full flex flex-col bg-retro-paper/10 p-12 -m-10">
              {/* BOM ACTIONS & SEARCH */}
              <div className="flex gap-6 flex-shrink-0 relative z-10">
                <div className="flex-1 relative">
                  <Search size={22} strokeWidth={1.5} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/30" />
                  <select
                    onChange={(e) => {
                      const mat = materials.find(m => m.id === e.target.value);
                      if (mat) handleAddMaterial(mat);
                      e.target.value = "";
                    }}
                    className="w-full pl-16 pr-8 py-5 bg-white border-2 border-retro-sepia/10 text-xs font-black text-retro-sepia outline-none focus:border-retro-sepia shadow-inner transition-all appearance-none cursor-pointer placeholder:italic uppercase tracking-widest italic"
                  >
                    <option value="" className="italic text-retro-earth/40">Khai báo Vật tư vào BOM (Truy vấn danh mục)...</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id} disabled={bomItems.some(bi => bi.materialId === m.id)} className="font-typewriter text-retro-sepia">
                        {m.name} [{m.sku || 'No-SKU'}]
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-retro-sepia/20">
                    <Plus size={20} strokeWidth={2.5} />
                  </div>
                </div>
              </div>

              {/* BOM TABLE */}
              <div className="flex-1 overflow-hidden flex flex-col bg-white border-2 border-retro-sepia/10 shadow-[0_15px_40px_-10px_rgba(62,39,35,0.1)] relative">
                <div className="flex-1 overflow-y-auto scrollbar-hide">
                  <table className="w-full text-left border-collapse font-typewriter">
                    <thead className="sticky top-0 z-10 bg-retro-paper border-b-2 border-retro-sepia/10">
                      <tr>
                        <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60">Chi tiết Vật tư</th>
                        <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60 text-center w-40">Phần lượng (Q'ty)</th>
                        <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60 text-center w-24">Đơn vị</th>
                        <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60 text-right">Đơn giá quy chiếu</th>
                        <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60 text-right">Tổng định mức</th>
                        <th className="px-10 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60 text-center w-20">Trục xuất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-retro-sepia/5 relative z-0">
                      {isLoadingBOM ? (
                        <tr>
                          <td colSpan={6} className="py-32 text-center">
                            <Loader2 size={40} strokeWidth={1.5} className="text-retro-brick animate-spin mx-auto mb-6" />
                            <p className="text-[10px] font-black uppercase text-retro-earth/40 tracking-[0.3em] italic">Đang truy vấn Định mức...</p>
                          </td>
                        </tr>
                      ) : bomItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-40 text-center">
                            <Layers size={80} strokeWidth={0.5} className="text-retro-earth opacity-10 mx-auto mb-6" />
                            <p className="text-[10px] font-black uppercase text-retro-earth/30 tracking-[0.4em] italic">Chưa có thành phần nào được gán cho Bản thiết kế này</p>
                          </td>
                        </tr>
                      ) : bomItems.map((item) => {
                        const unitPrice = item.material.unitPrice || item.material.referencePrice || 0;
                        const total = unitPrice * item.quantity;
                        return (
                          <tr key={item.materialId} className="hover:bg-retro-paper/50 group transition-all">
                            <td className="px-10 py-6">
                              <p className="text-xs font-black text-retro-sepia uppercase tracking-tight">{item.material.name}</p>
                              <p className="text-[10px] text-retro-earth/40 mt-1 italic font-black">Mã hiệu: {item.material.sku || 'N/A'}</p>
                            </td>
                            <td className="px-10 py-6 text-center">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(item.materialId, Number(e.target.value))}
                                className="w-24 px-4 py-3 bg-retro-paper border-2 border-retro-sepia/10 text-xs font-black text-center text-retro-brick outline-none focus:border-retro-brick shadow-inner"
                              />
                            </td>
                            <td className="px-10 py-6 text-center">
                              <span className="text-[10px] font-black text-retro-earth uppercase tracking-widest">{item.material.unit}</span>
                            </td>
                            <td className="px-10 py-6 text-right font-black text-xs text-retro-sepia/60 tabular-nums">
                              {unitPrice.toLocaleString()} <span className="text-[9px] opacity-40">VNĐ</span>
                            </td>
                            <td className="px-10 py-6 text-right font-black text-xs text-retro-sepia tabular-nums">
                              {total.toLocaleString()} <span className="text-[9px] opacity-40">VNĐ</span>
                            </td>
                            <td className="px-10 py-6 text-center">
                              <button
                                onClick={() => handleRemoveMaterial(item.materialId)}
                                className="p-3 text-retro-earth/20 hover:text-retro-brick hover:bg-white transition-all shadow-sm border border-transparent hover:border-retro-brick/20"
                              >
                                <Trash2 size={18} strokeWidth={1.5} />
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
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-500 h-full flex flex-col bg-retro-paper/10 -m-10 p-12">
              {/* COGS CALCULATION TABLE & FOOTER */}
              <div className="bg-white border-2 border-retro-sepia/10 shadow-[0_20px_50px_-12px_rgba(62,39,35,0.15)] flex-1 overflow-y-auto flex flex-col relative">
                <div className="flex-1 p-10">
                  <h3 className="text-[13px] font-black text-retro-sepia uppercase tracking-[0.3em] mb-10 flex items-center gap-4 italic opacity-80">
                    <div className="w-10 h-10 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-brick">
                      <DollarSign size={20} strokeWidth={1.5} />
                    </div>
                    Cương mục Tính toán Giá thành (COGS)
                  </h3>

                  <div className="bg-white border border-retro-sepia/10 shadow-inner overflow-hidden mb-10 font-typewriter">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-retro-paper border-b-2 border-retro-sepia/10">
                        <tr>
                          <th className="px-8 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60">Thành phần chi phí</th>
                          <th className="px-8 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60">Diễn giải Chi tiết</th>
                          <th className="px-8 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60 text-right">Đơn giá quy chiếu</th>
                          <th className="px-8 py-6 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] italic opacity-60 text-right">Thành tiền (Quy đổi)</th>
                          <th className="px-6 py-6 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-retro-sepia/5">
                        {/* Nguyên liệu */}
                        <tr className="bg-retro-paper/5">
                          <td className="px-8 py-6 text-xs font-black text-retro-sepia uppercase tracking-widest">Nguyên liệu trực tiếp</td>
                          <td className="px-8 py-6 text-[11px] text-retro-earth/60 italic leading-relaxed max-w-[300px] truncate">{materialDetailsNames || 'Chưa định nghĩa thành phần'}</td>
                          <td className="px-8 py-6 text-xs font-black text-retro-earth/40 text-right tabular-nums italic">--</td>
                          <td className="px-8 py-6 text-xs font-black text-retro-brick text-right tabular-nums">{totalMaterialCost.toLocaleString()} <span className="text-[9px] opacity-40">VNĐ</span></td>
                          <td className="px-6 py-6 w-12"></td>
                        </tr>
                        {/* Hao hụt */}
                        <tr className="bg-retro-paper/10">
                          <td className="px-8 py-6 text-xs font-black text-retro-sepia uppercase tracking-widest">Dự phòng Hao hụt</td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <input
                                type="number"
                                value={Math.round(wasteRatio * 100)}
                                onChange={(e) => setWasteRatio(Number(e.target.value) / 100)}
                                className="w-20 px-3 py-2 bg-white border-2 border-retro-sepia/10 text-xs font-black text-center text-retro-brick outline-none focus:border-retro-brick shadow-inner"
                              /> <span className="text-[9px] font-black text-retro-earth/40 uppercase tracking-widest italic">% (Định mức rủi ro)</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-xs font-black text-retro-earth/40 text-right tabular-nums italic">--</td>
                          <td className="px-8 py-6 text-xs font-black text-retro-brick text-right tabular-nums">{Math.round(wasteCost).toLocaleString()} <span className="text-[9px] opacity-40">VNĐ</span></td>
                          <td className="px-6 py-6 w-12"></td>
                        </tr>
                        {/* Custom Costs */}
                        {customCosts.map(cost => (
                          <tr key={cost.id} className="group hover:bg-retro-paper/5 transition-all">
                            <td className="px-8 py-4">
                              <input
                                value={cost.name}
                                onChange={(e) => updateCustomCost(cost.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-transparent border-2 border-transparent hover:border-retro-sepia/10 focus:border-retro-sepia/20 text-xs font-black text-retro-sepia outline-none transition-all uppercase tracking-tight italic"
                                placeholder="Tên tiểu mục..."
                              />
                            </td>
                            <td className="px-8 py-4">
                              <input
                                value={cost.details}
                                onChange={(e) => updateCustomCost(cost.id, 'details', e.target.value)}
                                className="w-full px-3 py-2 bg-transparent border-2 border-transparent hover:border-retro-sepia/10 focus:border-retro-sepia/20 text-[11px] text-retro-earth outline-none transition-all italic opacity-60"
                                placeholder="Diễn giải nghiệp vụ..."
                              />
                            </td>
                            <td className="px-8 py-4">
                              <div className="flex items-center justify-end gap-3">
                                <input
                                  type="number"
                                  value={cost.amount === 0 ? '' : cost.amount}
                                  onChange={(e) => updateCustomCost(cost.id, 'amount', Number(e.target.value))}
                                  className="w-24 px-3 py-2 bg-retro-paper/50 border-2 border-retro-sepia/10 text-xs font-black text-retro-brick text-right tabular-nums outline-none focus:border-retro-brick shadow-inner placeholder:italic italic"
                                  placeholder="0"
                                />
                                <span className="text-[9px] font-black text-retro-earth/40 uppercase tracking-widest italic">VNĐ</span>
                              </div>
                            </td>
                            <td className="px-8 py-4 text-right">
                               <p className="text-xs font-black text-retro-sepia tabular-nums">
                                 {Number(cost.amount || 0).toLocaleString()} <span className="text-[9px] opacity-40">VNĐ</span>
                               </p>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => removeCustomCost(cost.id)}
                                className="p-2 opacity-0 group-hover:opacity-100 text-retro-earth/20 hover:text-retro-brick hover:bg-white transition-all shadow-sm border border-transparent hover:border-retro-brick/20"
                              >
                                <Trash2 size={16} strokeWidth={1.5} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-retro-paper border-t-2 border-retro-sepia/20">
                        <tr>
                          <td colSpan={5} className="px-8 py-5">
                            <button
                              onClick={addCustomCost}
                              className="text-[10px] font-black text-retro-brick flex items-center gap-3 hover:opacity-70 transition-all uppercase tracking-[0.2em] px-6 py-3 border-2 border-dashed border-retro-brick/20 italic"
                            >
                              <Plus size={16} strokeWidth={2.5} /> Khai báo Phí tổn phát sinh khác
                            </button>
                          </td>
                        </tr>
                        <tr className="bg-retro-brick text-white">
                          <td className="px-8 py-8 text-sm font-black uppercase tracking-[0.3em] italic" colSpan={3}>Tổng định mức Giá thành (COGS)</td>
                          <td className="px-8 py-8 text-2xl font-black text-right tabular-nums tracking-tighter">
                            {Math.round(totalCOGS).toLocaleString()} <span className="text-xs opacity-60">VNĐ</span>
                          </td>
                          <td className="px-6 py-8 w-12"></td>
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
