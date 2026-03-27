"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  DollarSign, 
  Package, 
  Layers, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  Loader2, 
  ChevronRight, 
  Tag, 
  Calculator, 
  Store, 
  Globe,
  Search,
  ChevronDown,
  Trash2,
  Settings
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMaterials } from '@/services/material.service';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BOMItem {
  materialId: string;
  material: {
    name: string;
    unit: string;
    unitPrice: number;
    referencePrice: number;
    sku?: string | null;
  };
  quantity: number;
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
  cogsConfig?: any;
  bomItems?: any[];
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Product | null;
}

export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData }: ProductFormModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'bom' | 'cogs'>('general');
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    sku: '',
    name: '',
    basePrice: 0,
    costPrice: 0,
    wholesalePrice: 0,
    exportPrice: 0,
    productionTimeStd: 0,
  });

  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [wasteRatio, setWasteRatio] = useState<number>(0.05);
  const [customCosts, setCustomCosts] = useState<any[]>([
    { id: '1', name: 'Nhân công', details: 'Lắp ráp & đóng gói', amount: 0 },
    { id: '2', name: 'Máy móc/Điện', details: 'Khấu hao & vận hành', amount: 0 }
  ]);
  const [productionNotes, setProductionNotes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadMaterials();
      if (initialData) {
        setFormData({
          ...initialData,
          basePrice: Number(initialData.basePrice || 0),
          costPrice: Number(initialData.costPrice || 0),
          wholesalePrice: Number(initialData.wholesalePrice || 0),
          exportPrice: Number(initialData.exportPrice || 0),
        });
        if (initialData.bomItems) {
            setBomItems(initialData.bomItems.map(item => ({
                materialId: item.materialId,
                material: {
                    name: item.material.name,
                    unit: item.material.unit,
                    unitPrice: Number(item.material.unitPrice || item.material.referencePrice || 0),
                    referencePrice: Number(item.material.referencePrice || 0),
                    sku: item.material.sku
                },
                quantity: Number(item.quantity)
            })));
        }
        if (initialData.cogsConfig) {
            setWasteRatio(initialData.cogsConfig.wasteRatio || 0.05);
            setCustomCosts(initialData.cogsConfig.customCosts || []);
            setProductionNotes(initialData.cogsConfig.productionNotes || []);
        }
      }
    }
  }, [initialData, isOpen]);

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
          unitPrice: Number(material.unitPrice || material.referencePrice || 0),
          referencePrice: Number(material.referencePrice || 0),
          sku: material.sku
        },
        quantity: 1
      }
    ]);
  };

  const handleUpdateQuantity = (materialId: string, qty: number) => {
    setBomItems(bomItems.map(item =>
      item.materialId === materialId ? { ...item, quantity: qty } : item
    ));
  };

  const handleRemoveMaterial = (materialId: string) => {
    setBomItems(bomItems.filter(item => item.materialId !== materialId));
  };

  const totalMaterialCost = bomItems.reduce((acc, item) => {
    const price = item.material.unitPrice || item.material.referencePrice || 0;
    return acc + (price * item.quantity);
  }, 0);

  const wasteCost = totalMaterialCost * wasteRatio;
  const customTotal = customCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const totalCOGS = totalMaterialCost + wasteCost + customTotal;

  const updateCustomCost = (id: string, field: string, value: any) => {
    setCustomCosts(customCosts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Auto-calculate prices based on COGS
  useEffect(() => {
    if (totalCOGS > 0) {
      setFormData(prev => ({
        ...prev,
        basePrice: totalCOGS,
        wholesalePrice: totalCOGS * 1.3,
        exportPrice: totalCOGS * 2.4
      }));
    }
  }, [totalCOGS]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
        const calculatedBasePrice = totalCOGS;
        const calculatedWholesalePrice = totalCOGS * 1.3;
        const calculatedExportPrice = totalCOGS * 2.4;

        const payload = {
            ...formData,
            basePrice: calculatedBasePrice,
            wholesalePrice: calculatedWholesalePrice,
            exportPrice: calculatedExportPrice,
            cogsConfig: {
                wasteRatio,
                customCosts,
                productionNotes,
                totalCOGS: calculatedBasePrice
            },
            bomItems: bomItems.map(item => ({
                materialId: item.materialId,
                quantity: item.quantity
            })),
            costPrice: totalCOGS
        };
        await onSubmit(payload);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'Thông tin chung', icon: Settings },
    { id: 'bom', label: 'Định mức Vật tư', icon: Layers },
    { id: 'cogs', label: 'Tính toán Giá thành', icon: DollarSign }
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl border-neo border-black shadow-neo flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 md:px-8 md:py-6 border-b-neo border-black flex justify-between items-center bg-neo-purple/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
               <Package size={24} className="text-black" />
            </div>
            <div>
              <h3 className="text-xl font-black text-black tracking-tight uppercase italic">
                 {initialData ? 'Hiệu đính Sản phẩm' : 'Khai báo Sản phẩm'}
              </h3>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1">
                 Danh mục Master & Thông số Kỹ thuật
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black/40 hover:text-black hover:bg-neo-red transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="px-8 border-b-neo border-black flex items-center gap-8 bg-black/5 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 py-4 px-1 text-[10px] font-black uppercase tracking-widest transition-all border-b-4 relative",
                activeTab === tab.id 
                  ? "border-black text-black" 
                  : "border-transparent text-black/40 hover:text-black"
              )}
            >
              <tab.icon size={14} strokeWidth={2.5} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in duration-500 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Tên Sản phẩm</label>
                  <div className="relative group/field">
                    <input 
                      required
                      type="text" 
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="form-input pl-12"
                      placeholder="Nhập tên chính thức..."
                    />
                    <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Mã SKU (Định danh)</label>
                  <div className="relative group/field">
                    <input 
                      required
                      type="text" 
                      value={formData.sku || ''}
                      onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                      className="form-input pl-12 border-solid !bg-neo-purple/10 text-black font-black tracking-widest text-center"
                      placeholder="MÃ-SP-001"
                    />
                    <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Đơn giá niêm yết</label>
                  <div className="relative group/field">
                    <input 
                      type="number" 
                      value={formData.basePrice || ''}
                      onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})}
                      className="form-input pl-12 pr-12 font-black tabular-nums"
                      placeholder="0"
                    />
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/40 uppercase">VNĐ</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Giá sỉ (Wholesale)</label>
                  <div className="relative group/field">
                    <input 
                      type="number" 
                      value={formData.wholesalePrice || ''}
                      onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})}
                      className="form-input pl-12 pr-12 font-black tabular-nums"
                      placeholder="0"
                    />
                    <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/40 uppercase">SỈ</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Giá xuất khẩu</label>
                  <div className="relative group/field">
                    <input 
                      type="number" 
                      value={formData.exportPrice || ''}
                      onChange={e => setFormData({...formData, exportPrice: Number(e.target.value)})}
                      className="form-input pl-12 pr-12 font-black tabular-nums"
                      placeholder="0"
                    />
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/40 uppercase">INT</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Thời gian sản xuất (Phút)</label>
                <div className="relative group/field">
                  <input 
                    type="number" 
                    value={formData.productionTimeStd || ''}
                    onChange={e => setFormData({...formData, productionTimeStd: Number(e.target.value)})}
                    className="form-input pl-12 pr-12 font-black tabular-nums"
                    placeholder="0"
                  />
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/40 uppercase">Phút</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOM */}
          {activeTab === 'bom' && (
            <div className="space-y-8 animate-in fade-in duration-500 flex flex-col h-full min-h-[400px] pb-10">
               <div className="relative group/field shrink-0">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={24} />
                  <select
                    onChange={(e) => {
                      const mat = materials.find(m => m.id === e.target.value);
                      if (mat) handleAddMaterial(mat);
                      e.target.value = "";
                    }}
                    className="form-input pl-16 pr-12 h-16 bg-white border-2 border-black rounded-xl appearance-none cursor-pointer font-black text-black uppercase tracking-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="" className="text-black/20">-- Tìm kiếm & Thêm Vật tư vào BOM --</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id} disabled={bomItems.some(bi => bi.materialId === m.id)}>
                        {m.name} [{m.sku || 'No-SKU'}] — {Number(m.referencePrice || m.unitPrice || 0).toLocaleString()} đ/{m.unit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-6 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
               </div>

               <div className="neo-card !p-0 overflow-hidden flex flex-col flex-1">
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full !mt-0 text-left">
                       <thead>
                          <tr className="bg-neo-purple/10">
                             <th className="px-8 py-5 border-b-neo border-black text-[10px] font-black uppercase tracking-widest">Vật tư</th>
                             <th className="px-8 py-5 text-center w-40 border-b-neo border-black text-[10px] font-black uppercase tracking-widest">Định mức</th>
                             <th className="px-8 py-5 text-right border-b-neo border-black text-[10px] font-black uppercase tracking-widest">Đơn giá</th>
                             <th className="px-8 py-5 text-right w-16 border-b-neo border-black"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-black/5">
                           {/* Row: Direct Materials (BOM) */}
                           <tr className="bg-neo-purple/5">
                              <td className="px-8 py-4">
                                 <span className="font-black text-black italic text-sm">Định mức vật tư (BOM)</span>
                              </td>
                              <td className="px-8 py-4">
                                 <span className="text-black/60 font-medium text-xs">Theo định mức nguyên vật liệu BOM</span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <div className="relative group/input max-w-[180px] ml-auto">
                                    <div className="w-full h-12 bg-black/5 border-[2px] border-black/10 rounded-xl px-10 flex items-center justify-end font-black text-black/40 tabular-nums text-base italic">
                                       {totalMaterialCost.toLocaleString()}
                                    </div>
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-black/20 uppercase pointer-events-none">VNĐ</span>
                                 </div>
                              </td>
                              <td className="px-8 py-4"></td>
                           </tr>

                           {/* Row: Waste Contingency */}
                           <tr className="bg-neo-yellow/5">
                              <td className="px-8 py-4">
                                 <span className="font-black text-black italic text-sm">Hao hụt & Dự phòng</span>
                              </td>
                              <td className="px-8 py-4">
                                 <span className="text-black/60 font-medium text-xs">{Math.round(wasteRatio * 100)}% trên tổng vật tư</span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <div className="relative group/input max-w-[180px] ml-auto">
                                    <div className="w-full h-12 bg-black/5 border-[2px] border-black/10 rounded-xl px-10 flex items-center justify-end font-black text-black/40 tabular-nums text-base italic">
                                       {wasteCost.toLocaleString()}
                                    </div>
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-black/20 uppercase pointer-events-none">VNĐ</span>
                                 </div>
                              </td>
                              <td className="px-8 py-4"></td>
                           </tr>
                          {bomItems.map((item) => (
                             <tr key={item.materialId} className="group hover:bg-black/5 transition-all">
                                <td className="px-8 py-5">
                                   <p className="font-black text-black leading-tight italic">{item.material.name}</p>
                                   <p className="text-[10px] text-black/40 font-black uppercase tracking-widest mt-0.5">{item.material.sku || 'N/A'}</p>
                                </td>
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-2">
                                      <input 
                                         type="number"
                                         value={item.quantity}
                                         onChange={(e) => handleUpdateQuantity(item.materialId, Number(e.target.value))}
                                         className="w-full h-10 px-3 bg-white border-2 border-black rounded-xl text-center font-black text-black outline-none focus:bg-neo-purple/5 tabular-nums"
                                      />
                                      <span className="text-[10px] font-black text-black/40 uppercase w-10">{item.material.unit}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5 text-right tabular-nums">
                                   <p className="font-black text-black">{(item.material.unitPrice * item.quantity).toLocaleString()}</p>
                                   <p className="text-[9px] text-black/40 uppercase font-black">@ {item.material.unitPrice.toLocaleString()}</p>
                                </td>
                                <td className="px-8 py-5 text-right">
                                   <button onClick={() => handleRemoveMaterial(item.materialId)} className="w-8 h-8 flex items-center justify-center text-black/20 hover:text-neo-red hover:bg-neo-red/10 rounded-lg transition-all">
                                      <Trash2 size={16} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                    {bomItems.length === 0 && (
                        <div className="py-24 text-center">
                          <Layers size={48} strokeWidth={1} className="text-black/10 mx-auto mb-4" />
                          <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em]">Chưa có cấu thành vật tư</p>
                        </div>
                    )}
                  </div>
                  
                  <div className="p-8 bg-black/5 border-t-neo border-black flex justify-between items-center shrink-0">
                      <div>
                         <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-1">Tổng chi phí định mức (Material Cost)</p>
                         <p className="text-3xl font-black text-black tabular-nums italic">
                            {totalMaterialCost.toLocaleString()} <span className="text-xs font-medium text-black/40">VNĐ</span>
                         </p>
                      </div>
                      <div className="badge-success flex items-center gap-2 px-4 py-2">
                         <Calculator size={14} strokeWidth={2.5} />
                         Tự động tính toán
                      </div>
                   </div>
               </div>
            </div>
          )}

          {/* TAB 3: COGS */}
          {activeTab === 'cogs' && (
             <div className="space-y-8 animate-in fade-in duration-500 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 p-10 bg-black text-white rounded-xl shadow-neo relative overflow-hidden flex flex-col justify-between min-h-[220px] border-2 border-black">
                      <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none scale-150">
                         <Calculator size={160} />
                      </div>
                      <div className="relative z-10">
                         <p className="text-[11px] font-black uppercase tracking-[0.3em] text-neo-purple mb-3 italic">Giá thành dự kiến (COGS)</p>
                         <h3 className="text-6xl font-black tracking-tighter tabular-nums text-[#FACC15] italic">
                            {Math.round(totalCOGS).toLocaleString()} <span className="text-2xl font-black text-white ml-2 uppercase">VNĐ/SP</span>
                         </h3>
                      </div>
                      <div className="relative z-10 flex gap-10 pt-8 border-t-2 border-white/10">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1.5 font-space">Vật tư Trực tiếp</span>
                            <span className="text-lg font-black text-white italic">{totalMaterialCost.toLocaleString()}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1.5 font-space">Vận hành & Chi phí chung</span>
                            <span className="text-lg font-black text-white italic">{(wasteCost + customTotal).toLocaleString()}</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-10 bg-neo-yellow/10 border-neo border-black rounded-xl shadow-neo flex flex-col justify-between">
                      <div>
                         <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mb-4">Hệ số hao hụt (%)</p>
                         <div className="flex items-center gap-4">
                            <input 
                               type="number"
                               value={Math.round(wasteRatio * 100)}
                               onChange={(e) => setWasteRatio(Number(e.target.value) / 100)}
                               className="w-24 text-5xl font-black text-black bg-transparent outline-none tabular-nums italic"
                            />
                            <span className="text-2xl font-black text-black/20">%</span>
                         </div>
                      </div>
                      <p className="text-[10px] text-black/60 font-black uppercase italic mt-6 leading-tight tracking-widest">
                        Phòng ngừa sai số trong quá trình sản xuất.
                      </p>
                   </div>
                </div>

                <div className="neo-card !p-0 overflow-hidden">
                   <div className="px-8 py-5 bg-neo-purple/10 border-b-neo border-black flex justify-between items-center sm:flex-row flex-col gap-4">
                      <h4 className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">Chi phí nhân công & vận hành (Overhead)</h4>
                      <button onClick={() => setCustomCosts([...customCosts, { id: Date.now().toString(), name: '', details: '', amount: 0 }])} className="btn-secondary !h-10 !px-6 text-[10px]">
                         <Plus size={14} strokeWidth={2.5} /> 
                         Thêm chi phí
                      </button>
                   </div>
                   <div className="overflow-x-auto">
                    <table className="w-full !mt-0 text-left">
                       <thead>
                          <tr className="bg-black/5 text-[9px] font-black text-black/40 uppercase tracking-widest">
                             <th className="px-8 py-4 border-b-neo border-black">Tên mục</th>
                             <th className="px-8 py-4 border-b-neo border-black">Mô tả chi tiết</th>
                             <th className="px-8 py-4 text-right w-40 border-b-neo border-black">Số tiền (VNĐ)</th>
                             <th className="px-8 py-4 w-16 border-b-neo border-black"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-black/5">
                           {/* Row: Direct Materials (BOM) */}
                           <tr className="bg-neo-purple/5">
                              <td className="px-8 py-4">
                                 <span className="font-black text-black italic text-sm">Định mức vật tư (BOM)</span>
                              </td>
                              <td className="px-8 py-4">
                                 <span className="text-black/60 font-medium text-xs">Theo định mức nguyên vật liệu BOM</span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <div className="relative group/input max-w-[180px] ml-auto">
                                    <div className="w-full h-12 bg-black/5 border-[2px] border-black/10 rounded-xl px-10 flex items-center justify-end font-black text-black/40 tabular-nums text-base italic">
                                       {totalMaterialCost.toLocaleString()}
                                    </div>
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-black/20 uppercase pointer-events-none">VNĐ</span>
                                 </div>
                              </td>
                              <td className="px-8 py-4"></td>
                           </tr>

                           {/* Row: Waste Contingency */}
                           <tr className="bg-neo-yellow/5">
                              <td className="px-8 py-4">
                                 <span className="font-black text-black italic text-sm">Hao hụt & Dự phòng</span>
                              </td>
                              <td className="px-8 py-4">
                                 <span className="text-black/60 font-medium text-xs">{Math.round(wasteRatio * 100)}% trên tổng vật tư</span>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <div className="relative group/input max-w-[180px] ml-auto">
                                    <div className="w-full h-12 bg-black/5 border-[2px] border-black/10 rounded-xl px-10 flex items-center justify-end font-black text-black/40 tabular-nums text-base italic">
                                       {wasteCost.toLocaleString()}
                                    </div>
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-black/20 uppercase pointer-events-none">VNĐ</span>
                                 </div>
                              </td>
                              <td className="px-8 py-4"></td>
                           </tr>
                          {customCosts.map(cost => (
                             <tr key={cost.id} className="group hover:bg-black/5 transition-all">
                                <td className="px-8 py-4">
                                   <input 
                                      value={cost.name}
                                      onChange={(e) => updateCustomCost(cost.id, 'name', e.target.value)}
                                      className="w-full bg-transparent font-black text-black outline-none text-sm italic"
                                      placeholder="VD: Nhân công..."
                                   />
                                </td>
                                <td className="px-8 py-4">
                                   <input 
                                      value={cost.details}
                                      onChange={(e) => updateCustomCost(cost.id, 'details', e.target.value)}
                                      className="w-full bg-transparent text-black/60 font-medium outline-none text-xs"
                                      placeholder="Mô tả công việc..."
                                   />
                                </td>
                                <td className="px-8 py-4 text-right">
                                   <input 
                                      type="number"
                                      value={cost.amount || ''}
                                      onChange={(e) => updateCustomCost(cost.id, 'amount', Number(e.target.value))}
                                      className="w-full h-12 bg-white border-[2.5px] border-black rounded-xl px-12 text-right font-black text-[#000000] outline-none focus:border-[#D8B4FE] focus:shadow-[4px_4px_0px_0px_rgba(216,180,254,0.3)] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] tabular-nums text-base italic transition-all"
                                      placeholder="0"
                                   />
                                </td>
                                <td className="px-8 py-4 text-right">
                                   <button onClick={() => setCustomCosts(customCosts.filter(c => c.id !== cost.id))} className="w-12 h-12 flex items-center justify-center bg-[#FEE2E2] border-[2.5px] border-black rounded-xl text-black hover:bg-rose-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ml-auto">
                                      <Trash2 size={16} />
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

        {/* FIXED FOOTER */}
        <div className="p-8 border-t-neo border-black bg-white flex flex-col md:flex-row gap-6 shrink-0 mt-auto">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 h-14 rounded-xl text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black hover:bg-black/5 transition-all active:translate-x-[2px] active:translate-y-[2px]"
          >
            Hủy thao tác
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary btn-confirm-flash flex-[2] h-14 text-[11px] uppercase tracking-[0.2em]"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} strokeWidth={2.5} />}
            {initialData ? 'Lưu hồ sơ Master' : 'Khởi tạo Sản phẩm Master'}
          </button>
        </div>
      </div>
    </div>
  );
}
