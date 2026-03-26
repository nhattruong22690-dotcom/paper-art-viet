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
  Globe,
  ChevronDown,
  Info,
  History,
  Activity,
  Cpu
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
            unitPrice: Number(item.material.unitPrice || item.material.referencePrice || 0),
            referencePrice: Number(item.material.referencePrice || 0)
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

  const tabs = [
    { id: 'general', label: 'Thông số Kỹ nghệ', icon: Settings },
    { id: 'bom', label: 'Định mức Vật tư', icon: Layers },
    { id: 'cogs', label: 'Tính toán Giá thành', icon: DollarSign }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 md:px-8 md:py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <Package size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
                {product.name || 'Chi tiết Sản phẩm'}
              </h2>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{product.sku || 'N/A'}</span>
                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none italic">Master Profile</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {activeTab === 'general' && (
               <button onClick={handleSaveGeneral} disabled={isSavingGeneral} className="btn-primary h-11 px-6 shadow-vibrant">
                 {isSavingGeneral ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">Lưu hồ sơ</span>
               </button>
             )}
             {activeTab === 'bom' && (
               <button onClick={handleSaveBOM} disabled={isSavingBOM} className="btn-primary h-11 px-6 shadow-vibrant">
                 {isSavingBOM ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">Lưu BOM</span>
               </button>
             )}
             {activeTab === 'cogs' && (
               <button onClick={handleSaveCOGS} disabled={isSavingCOGS} className="btn-primary h-11 px-6 shadow-vibrant">
                 {isSavingCOGS ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">Niêm yết giá</span>
               </button>
             )}
             <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all">
               <X size={24} strokeWidth={2.5} />
             </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="px-8 border-b border-slate-50 flex items-center gap-8 bg-slate-50/30 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-4 px-1 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 relative",
                activeTab === tab.id 
                  ? "border-primary text-primary" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <tab.icon size={14} strokeWidth={2.5} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute -bottom-[2px] left-0 w-full h-[2px] bg-primary shadow-vibrant" />
              )}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white">
          {activeTab === 'general' ? (
            <div className="space-y-10 animate-in fade-in duration-500 pb-10">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* Left Column: Metrics */}
                  <div className="space-y-8">
                     <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pb-3 border-b border-slate-50">
                        <Tag size={12} strokeWidth={3} /> Core Specifications
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Thời gian sản xuất (STD)</p>
                           <div className="flex items-end gap-4">
                              <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                                 <Clock size={22} strokeWidth={2.5} />
                              </div>
                              <div className="flex-1">
                                 <input 
                                    type="number"
                                    value={productionTimeStd || ''}
                                    onChange={(e) => setProductionTimeStd(Number(e.target.value))}
                                    className="w-full text-3xl font-black text-slate-900 bg-transparent outline-none tabular-nums tracking-tighter"
                                    placeholder="0"
                                 />
                                 <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Phút / PCS</span>
                              </div>
                           </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 shadow-inner">
                           <div className="flex justify-between items-center mb-5">
                              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Giá vốn (Actual BOM)</p>
                              <button 
                                onClick={async () => {
                                  const module = await import('@/services/product.service');
                                  const res = await module.recalculateProductCostPrice(product.id);
                                  if (res) onUpdate();
                                }}
                                className="px-2 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 transition-all shadow-vibrant"
                              >
                                Calc
                              </button>
                           </div>
                           <div className="flex items-end gap-4">
                              <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg">
                                 <Calculator size={22} strokeWidth={2.5} />
                              </div>
                              <div>
                                 <p className="text-3xl font-black text-primary tabular-nums tracking-tighter">
                                    {Math.round(Number((product as any).costPrice || 0)).toLocaleString()}
                                 </p>
                                 <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">VNĐ / PCS</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Giá Niêm yết (Sỉ/Wholesale)</p>
                           <div className="flex items-end gap-4">
                              <div className="w-12 h-12 bg-white border border-slate-200 text-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                                 <Store size={22} strokeWidth={2.5} />
                              </div>
                              <div className="flex-1">
                                 <input 
                                    type="text"
                                    value={wholesalePrice.toLocaleString()}
                                    onChange={(e) => setWholesalePrice(Number(e.target.value.replace(/\D/g, '')))}
                                    className="w-full text-3xl font-black text-slate-900 bg-transparent outline-none tabular-nums tracking-tighter"
                                 />
                                 <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-1">Suggested x1.3 Margin</p>
                              </div>
                           </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">Giá Xuất khẩu (Global)</p>
                           <div className="flex items-end gap-4">
                              <div className="w-12 h-12 bg-white border border-slate-200 text-emerald-500 rounded-xl flex items-center justify-center shadow-sm">
                                 <Globe size={22} strokeWidth={2.5} />
                              </div>
                              <div className="flex-1">
                                 <input 
                                    type="text"
                                    value={exportPrice.toLocaleString()}
                                    onChange={(e) => setExportPrice(Number(e.target.value.replace(/\D/g, '')))}
                                    className="w-full text-3xl font-black text-slate-900 bg-transparent outline-none tabular-nums tracking-tighter"
                                 />
                                 <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-1">Suggested x1.8 Margin</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Right Column: Industry Notes */}
                  <div className="space-y-8">
                     <div className="flex items-center gap-3 text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] pb-3 border-b border-slate-100">
                        <History size={12} strokeWidth={3} /> Manufacturing Engineering Notes
                     </div>
                     
                     <div className="bg-slate-50/50 rounded-2xl p-8 border border-slate-100 shadow-inner space-y-6">
                        <div className="flex gap-3">
                           <input 
                              value={noteInput}
                              onChange={(e) => setNoteInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && addNote()}
                              placeholder="Add technical requirement..."
                              className="form-input h-12 bg-white border-slate-100 rounded-xl text-sm font-bold placeholder:text-slate-300"
                           />
                           <button onClick={addNote} className="btn-primary w-12 h-12 !p-0 shadow-vibrant">
                              <Plus size={20} strokeWidth={2.5} />
                           </button>
                        </div>
                        
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 scrollbar-hide">
                           {productionNotes.map((note, idx) => (
                              <div key={idx} className="group flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-primary/30 transition-all shadow-sm">
                                 <div className="w-6 h-6 bg-blue-50 text-primary rounded-lg flex items-center justify-center mt-0.5 shrink-0 shadow-sm">
                                    <span className="text-[10px] font-black">{idx + 1}</span>
                                 </div>
                                 <input 
                                    value={note}
                                    onChange={(e) => updateNote(idx, e.target.value)}
                                    className="flex-1 bg-transparent text-sm font-bold text-slate-700 outline-none"
                                 />
                                 <button onClick={() => removeNote(idx)} className="text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           ))}
                           {productionNotes.length === 0 && (
                              <div className="py-12 text-center flex flex-col items-center gap-3 opacity-20">
                                 <Cpu size={32} />
                                 <p className="text-[10px] font-black uppercase tracking-widest">No Technical Notes</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          ) : activeTab === 'bom' ? (
            <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col pb-10">
               <div className="relative group/field">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-200 group-focus-within/field:text-primary transition-colors" size={20} />
                  <select
                    onChange={(e) => {
                      const mat = materials.find(m => m.id === e.target.value);
                      if (mat) handleAddMaterial(mat);
                      e.target.value = "";
                    }}
                    className="form-input h-14 pl-12 pr-12 bg-slate-50 border-slate-100 rounded-2xl appearance-none cursor-pointer font-black text-slate-900 tracking-tight"
                  >
                    <option value="">-- Search & Allocate Materials to BOM --</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id} disabled={bomItems.some(bi => bi.materialId === m.id)}>
                        {m.name} [{m.sku || 'N/A'}] — {Number(m.referencePrice || m.unitPrice || 0).toLocaleString()} VNĐ/{m.unit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 pointer-events-none" />
               </div>

               <div className="flex-1 overflow-hidden flex flex-col border border-slate-50 rounded-3xl bg-white shadow-soft">
                  <div className="flex-1 overflow-y-auto">
                    <table className="w-full !mt-0 text-left">
                       <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md border-b border-slate-50">
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <th className="px-8 py-5">Material Spec</th>
                             <th className="px-8 py-5 text-center w-40">Allocation</th>
                             <th className="px-8 py-5 text-right">Unit Price</th>
                             <th className="px-8 py-5 text-right">Extension</th>
                             <th className="px-8 py-5 w-16"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {bomItems.map((item) => {
                             const unitPrice = item.material.unitPrice || item.material.referencePrice || 0;
                             return (
                                <tr key={item.materialId} className="group hover:bg-slate-50/30 transition-all">
                                   <td className="px-8 py-6">
                                      <p className="font-black text-slate-900 text-sm leading-tight">{item.material.name}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{item.material.sku || 'No-Ref'}</p>
                                   </td>
                                   <td className="px-8 py-6">
                                      <div className="flex items-center gap-3">
                                         <input 
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => handleUpdateQuantity(item.materialId, Number(e.target.value))}
                                            className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-center font-black text-slate-900 outline-none focus:border-primary shadow-sm tabular-nums"
                                         />
                                         <span className="text-[10px] font-black text-slate-400 uppercase w-12">{item.material.unit}</span>
                                      </div>
                                   </td>
                                   <td className="px-8 py-6 text-right tabular-nums text-slate-500 font-bold text-xs">{unitPrice.toLocaleString()}</td>
                                   <td className="px-8 py-6 text-right font-black text-slate-900 tabular-nums">
                                      {(unitPrice * item.quantity).toLocaleString()}
                                   </td>
                                   <td className="px-8 py-6 text-right">
                                      <button onClick={() => handleRemoveMaterial(item.materialId)} className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                         <Trash2 size={16} />
                                      </button>
                                   </td>
                                </tr>
                             )
                          })}
                          {bomItems.length === 0 && (
                             <tr>
                                <td colSpan={5} className="py-32 text-center text-slate-200">
                                   <Layers size={64} className="mx-auto mb-6 opacity-10" />
                                   <p className="text-[11px] font-black uppercase tracking-[0.4em]">No Allocation Found</p>
                                </td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                  </div>
                  
                  <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
                     <div>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                           <Activity size={14} /> Aggregate Production Cost
                        </p>
                        <p className="text-4xl font-black text-slate-900 tabular-nums tracking-tighter">
                           {totalMaterialCost.toLocaleString()} <span className="text-sm font-medium text-slate-300">VNĐ</span>
                        </p>
                     </div>
                     <div className="flex items-center gap-3 px-5 py-3 bg-white text-primary rounded-2xl border border-slate-100 shadow-soft">
                        <Calculator size={18} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Master BOM Record</span>
                     </div>
                  </div>
               </div>
            </div>
          ) : (
            <div className="space-y-10 animate-in fade-in duration-500 pb-10">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Total Card */}
                  <div className="lg:col-span-2 p-12 bg-slate-900 text-white rounded-[32px] shadow-vibrant relative overflow-hidden flex flex-col justify-between min-h-[250px]">
                     <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none scale-150">
                        <Calculator size={180} />
                     </div>
                     <div className="relative z-10">
                        <p className="text-[12px] font-black uppercase tracking-[0.4em] text-primary mb-4 opacity-70">Estimated Unit Cost (COGS)</p>
                        <h3 className="text-7xl font-black tracking-tighter tabular-nums text-white">
                           {Math.round(totalCOGS).toLocaleString()} <span className="text-2xl font-medium text-slate-600">VNĐ/PC</span>
                        </h3>
                     </div>
                     <div className="relative z-10 flex gap-12 pt-10 border-t border-white/5">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Direct Materials</span>
                           <span className="text-xl font-black text-white">{totalMaterialCost.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Ops & Maintenance</span>
                           <span className="text-xl font-black text-white">{(wasteCost + customTotal).toLocaleString()}</span>
                        </div>
                     </div>
                  </div>

                  {/* Waste Ratio Card */}
                  <div className="p-12 bg-slate-50 border border-slate-100 rounded-[32px] flex flex-col justify-between shadow-inner">
                     <div>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest mb-6">Contingency Ratio (%)</p>
                        <div className="flex items-center gap-4">
                           <input 
                              type="number"
                              value={Math.round(wasteRatio * 100)}
                              onChange={(e) => setWasteRatio(Number(e.target.value) / 100)}
                              className="w-24 text-6xl font-black text-slate-900 bg-transparent outline-none tabular-nums tracking-tighter"
                           />
                           <span className="text-3xl font-black text-slate-200">%</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 mt-8 py-2 px-3 bg-white/50 rounded-xl border border-white/80">
                        <Info size={14} className="text-slate-300" />
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">Accounts for technical variance</p>
                     </div>
                  </div>
               </div>

               {/* Custom Costs Table */}
               <div className="card !p-0 border border-slate-50 shadow-soft overflow-hidden">
                  <div className="px-10 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center sm:flex-row flex-col gap-6">
                     <div>
                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Operational Overhead Allocation</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Labor, Energy & Logistics</p>
                     </div>
                     <button onClick={addCustomCost} className="btn-secondary !py-2.5 !px-6 text-[10px]">
                        <Plus size={16} strokeWidth={3} />
                        Add Line Item
                     </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full !mt-0 text-left">
                       <thead>
                          <tr className="bg-slate-50/20 text-[9px] font-black text-slate-300 uppercase tracking-widest border-b border-slate-50">
                             <th className="px-10 py-5">Cost Center</th>
                             <th className="px-10 py-5">Execution Details</th>
                             <th className="px-10 py-5 text-right w-48">Allocation (VNĐ)</th>
                             <th className="px-10 py-5 w-20"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {customCosts.map(cost => (
                             <tr key={cost.id} className="group hover:bg-slate-50/30 transition-all">
                                <td className="px-10 py-5">
                                   <input 
                                      value={cost.name}
                                      onChange={(e) => updateCustomCost(cost.id, 'name', e.target.value)}
                                      className="w-full bg-transparent font-black text-slate-900 outline-none text-sm placeholder:text-slate-200"
                                      placeholder="Cost Center Name..."
                                   />
                                </td>
                                <td className="px-10 py-5">
                                   <input 
                                      value={cost.details}
                                      onChange={(e) => updateCustomCost(cost.id, 'details', e.target.value)}
                                      className="w-full bg-transparent text-slate-500 font-bold outline-none text-xs placeholder:text-slate-200"
                                      placeholder="Description..."
                                   />
                                </td>
                                <td className="px-10 py-5 text-right">
                                   <div className="relative group/input">
                                      <input 
                                        type="number"
                                        value={cost.amount || ''}
                                        onChange={(e) => updateCustomCost(cost.id, 'amount', Number(e.target.value))}
                                        className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-right font-black text-slate-900 outline-none focus:border-primary shadow-sm tabular-nums text-sm group-focus-within/input:shadow-lg transition-all"
                                        placeholder="0"
                                      />
                                   </div>
                                </td>
                                <td className="px-10 py-5 text-right">
                                   <button onClick={() => removeCustomCost(cost.id)} className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                      <Trash2 size={18} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
