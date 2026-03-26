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
  Info,
  Settings
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getMaterials } from '@/services/material.service';
import { updateProductBOM, upsertProduct } from '@/services/product.service';

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
  
  // States for the 3 tabs
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
  const [noteInput, setNoteInput] = useState('');

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
      } else {
        resetForm();
      }
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setFormData({
      sku: '',
      name: '',
      basePrice: 0,
      costPrice: 0,
      wholesalePrice: 0,
      exportPrice: 0,
      productionTimeStd: 0,
    });
    setBomItems([]);
    setWasteRatio(0.05);
    setCustomCosts([
        { id: '1', name: 'Nhân công', details: 'Lắp ráp & đóng gói', amount: 0 },
        { id: '2', name: 'Máy móc/Điện', details: 'Khấu hao & vận hành', amount: 0 }
    ]);
    setProductionNotes([]);
    setActiveTab('general');
  };

  const loadMaterials = async () => {
    try {
      const data = await getMaterials({});
      setMaterials(data);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  // BOM Logic
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

  // COGS Logic
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

  const addNote = () => {
    if (!noteInput.trim()) return;
    setProductionNotes([...productionNotes, noteInput.trim()]);
    setNoteInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const payload = {
            ...formData,
            cogsConfig: {
                wasteRatio,
                customCosts,
                productionNotes,
                totalCOGS
            },
            bomItems: bomItems.map(item => ({
                materialId: item.materialId,
                quantity: item.quantity
            })),
            costPrice: totalCOGS
        };
        await onSubmit(payload);
    } catch (error) {
        console.error('Submit failed:', error);
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
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        
        {/* HEADER */}
        <div className="px-6 py-4 md:px-8 md:py-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
               <Package size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                 {initialData ? 'Hiệu đính Sản phẩm' : 'Khai báo Sản phẩm'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                 Master List & Engineering Specification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
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

        <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-hide pb-32">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên Sản phẩm</label>
                  <div className="relative group/field">
                    <input 
                      required
                      type="text" 
                      value={formData.name || ''}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="form-input pl-12 h-12 bg-slate-50 border-slate-100 rounded-xl"
                      placeholder="Nhập tên chính thức..."
                    />
                    <Tag size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-primary transition-colors" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã SKU (Định danh)</label>
                  <div className="relative group/field">
                    <input 
                      required
                      type="text" 
                      value={formData.sku || ''}
                      onChange={e => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                      className="form-input pl-12 h-12 bg-blue-50/30 border-blue-100 rounded-xl text-primary font-black tracking-widest text-center"
                      placeholder="MÃ-SP-001"
                    />
                    <Layers size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within/field:text-primary transition-colors" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đơn giá niêm yết</label>
                  <div className="relative group/field">
                    <input 
                      type="number" 
                      value={formData.basePrice || ''}
                      onChange={e => setFormData({...formData, basePrice: Number(e.target.value)})}
                      className="form-input pl-12 pr-12 h-12 bg-slate-50 border-slate-100 rounded-xl font-bold tabular-nums"
                      placeholder="0"
                    />
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-primary transition-colors" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">VNĐ</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá sỉ (Wholesale)</label>
                  <div className="relative group/field">
                    <input 
                      type="number" 
                      value={formData.wholesalePrice || ''}
                      onChange={e => setFormData({...formData, wholesalePrice: Number(e.target.value)})}
                      className="form-input pl-12 pr-12 h-12 bg-slate-50 border-slate-100 rounded-xl font-bold tabular-nums"
                      placeholder="0"
                    />
                    <Store size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 opacity-50 group-focus-within/field:text-amber-600" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-400 uppercase">SỈ</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Giá xuất khẩu</label>
                  <div className="relative group/field">
                    <input 
                      type="number" 
                      value={formData.exportPrice || ''}
                      onChange={e => setFormData({...formData, exportPrice: Number(e.target.value)})}
                      className="form-input pl-12 pr-12 h-12 bg-slate-50 border-slate-100 rounded-xl font-bold tabular-nums"
                      placeholder="0"
                    />
                    <Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 opacity-50 group-focus-within/field:text-emerald-600" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-emerald-400 uppercase">INT</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian sản xuất tiêu chuẩn</label>
                <div className="relative group/field">
                  <input 
                    type="number" 
                    value={formData.productionTimeStd || ''}
                    onChange={e => setFormData({...formData, productionTimeStd: Number(e.target.value)})}
                    className="form-input pl-12 pr-12 h-12 bg-slate-50 border-slate-100 rounded-xl font-bold tabular-nums"
                    placeholder="0"
                  />
                  <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-primary transition-colors" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Phút / PC</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOM */}
          {activeTab === 'bom' && (
            <div className="space-y-8 animate-in fade-in duration-500 flex flex-col h-full">
               <div className="relative group/field">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/field:text-primary transition-colors" size={20} />
                  <select
                    onChange={(e) => {
                      const mat = materials.find(m => m.id === e.target.value);
                      if (mat) handleAddMaterial(mat);
                      e.target.value = "";
                    }}
                    className="form-input pl-12 pr-12 h-14 bg-slate-50 border-slate-100 rounded-xl appearance-none cursor-pointer font-bold text-slate-900"
                  >
                    <option value="">-- Tìm kiếm & Thêm Vật tư vào BOM --</option>
                    {materials.map(m => (
                      <option key={m.id} value={m.id} disabled={bomItems.some(bi => bi.materialId === m.id)}>
                        {m.name} [{m.sku || 'No-SKU'}] — {Number(m.referencePrice || m.unitPrice || 0).toLocaleString()} đ/{m.unit}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200 pointer-events-none" />
               </div>

               <div className="card !p-0 border border-slate-50 shadow-soft overflow-hidden flex flex-col flex-1">
                  <div className="overflow-x-auto">
                    <table className="w-full !mt-0 text-left">
                       <thead>
                          <tr className="bg-slate-50/50">
                             <th className="px-8 py-5">Vật tư</th>
                             <th className="px-8 py-5 text-center w-40">Định mức</th>
                             <th className="px-8 py-5 text-right">Đơn giá</th>
                             <th className="px-8 py-5 text-right w-16"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {bomItems.map((item) => (
                             <tr key={item.materialId} className="group hover:bg-slate-50/30 transition-all">
                                <td className="px-8 py-5">
                                   <p className="font-black text-slate-900 leading-tight">{item.material.name}</p>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{item.material.sku || 'N/A'}</p>
                                </td>
                                <td className="px-8 py-5">
                                   <div className="flex items-center gap-2">
                                      <input 
                                         type="number"
                                         value={item.quantity}
                                         onChange={(e) => handleUpdateQuantity(item.materialId, Number(e.target.value))}
                                         className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-center font-black text-slate-900 outline-none focus:border-primary shadow-sm tabular-nums"
                                      />
                                      <span className="text-[10px] font-black text-slate-400 uppercase w-10">{item.material.unit}</span>
                                   </div>
                                </td>
                                <td className="px-8 py-5 text-right tabular-nums">
                                   <p className="font-bold text-slate-900">{(item.material.unitPrice * item.quantity).toLocaleString()}</p>
                                   <p className="text-[9px] text-slate-400 uppercase font-black">@ {item.material.unitPrice.toLocaleString()}</p>
                                </td>
                                <td className="px-8 py-5 text-right">
                                   <button onClick={() => handleRemoveMaterial(item.materialId)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                      <Trash2 size={16} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                          {bomItems.length === 0 && (
                             <tr>
                                <td colSpan={4} className="py-24 text-center">
                                   <Layers size={48} strokeWidth={1} className="text-slate-100 mx-auto mb-4 opacity-50" />
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Chưa có cấu thành vật tư</p>
                                </td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                  </div>
                  
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center mt-auto">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng chi phí định mức (Material Cost)</p>
                        <p className="text-3xl font-black text-slate-900 tabular-nums">
                           {totalMaterialCost.toLocaleString()} <span className="text-xs font-medium text-slate-400">VNĐ</span>
                        </p>
                     </div>
                     <div className="badge-secondary flex items-center gap-2 px-4 py-2 opacity-60">
                        <Calculator size={14} strokeWidth={2.5} />
                        Auto-calculated from master records
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* TAB 3: COGS */}
          {activeTab === 'cogs' && (
             <div className="space-y-8 animate-in fade-in duration-500 pb-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 p-10 bg-slate-900 text-white rounded-3xl shadow-vibrant relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                      <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none scale-150">
                         <Calculator size={160} />
                      </div>
                      <div className="relative z-10">
                         <p className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-3">Giá thành dự kiến (COGS)</p>
                         <h3 className="text-6xl font-black tracking-tighter tabular-nums text-white">
                            {Math.round(totalCOGS).toLocaleString()} <span className="text-2xl font-medium text-slate-600">VNĐ</span>
                         </h3>
                      </div>
                      <div className="relative z-10 flex gap-10 pt-8 border-t border-white/5">
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Direct Materials</span>
                            <span className="text-lg font-black text-white">{totalMaterialCost.toLocaleString()}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1.5">Ops & Overhead</span>
                            <span className="text-lg font-black text-white">{(wasteCost + customTotal).toLocaleString()}</span>
                         </div>
                      </div>
                   </div>

                   <div className="p-10 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col justify-between">
                      <div>
                         <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Hệ số hao hụt (%)</p>
                         <div className="flex items-center gap-4">
                            <input 
                               type="number"
                               value={Math.round(wasteRatio * 100)}
                               onChange={(e) => setWasteRatio(Number(e.target.value) / 100)}
                               className="w-24 text-5xl font-black text-slate-900 bg-transparent outline-none tabular-nums"
                            />
                            <span className="text-2xl font-black text-slate-300">%</span>
                         </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold italic mt-6 leading-relaxed">
                        Phòng ngừa sai số trong quá trình sản xuất và vận chuyển vật liệu.
                      </p>
                   </div>
                </div>

                <div className="card border border-slate-50 shadow-soft overflow-hidden">
                   <div className="px-8 py-5 bg-slate-50/50 border-b border-slate-50 flex justify-between items-center sm:flex-row flex-col gap-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chi phí nhân công & vận hành (Overhead)</h4>
                      <button onClick={() => setCustomCosts([...customCosts, { id: Date.now().toString(), name: '', details: '', amount: 0 }])} className="btn-secondary !py-2 !px-4 text-[10px]">
                         <Plus size={14} strokeWidth={2.5} /> 
                         Add Expense
                      </button>
                   </div>
                   <div className="overflow-x-auto">
                    <table className="w-full !mt-0 text-left">
                       <thead>
                          <tr className="bg-slate-50/20 text-[9px] font-black text-slate-300 uppercase tracking-widest">
                             <th className="px-8 py-4">Tên mục</th>
                             <th className="px-8 py-4">Mô tả chi tiết</th>
                             <th className="px-8 py-4 text-right w-40">Số tiền (VNĐ)</th>
                             <th className="px-8 py-4 w-16"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {customCosts.map(cost => (
                             <tr key={cost.id} className="group hover:bg-slate-50/30 transition-all">
                                <td className="px-8 py-4">
                                   <input 
                                      value={cost.name}
                                      onChange={(e) => updateCustomCost(cost.id, 'name', e.target.value)}
                                      className="w-full bg-transparent font-black text-slate-900 outline-none text-sm"
                                      placeholder="VD: Nhân công xé giấy..."
                                   />
                                </td>
                                <td className="px-8 py-4">
                                   <input 
                                      value={cost.details}
                                      onChange={(e) => updateCustomCost(cost.id, 'details', e.target.value)}
                                      className="w-full bg-transparent text-slate-500 font-medium outline-none text-xs"
                                      placeholder="Mô tả công việc..."
                                   />
                                </td>
                                <td className="px-8 py-4 text-right">
                                   <input 
                                      type="number"
                                      value={cost.amount || ''}
                                      onChange={(e) => updateCustomCost(cost.id, 'amount', Number(e.target.value))}
                                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-right font-black text-slate-900 outline-none focus:border-primary shadow-sm tabular-nums text-sm"
                                      placeholder="0"
                                   />
                                </td>
                                <td className="px-8 py-4 text-right">
                                   <button onClick={() => setCustomCosts(customCosts.filter(c => c.id !== cost.id))} className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-rose-500 transition-all">
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
        <div className="p-8 border-t border-slate-50 bg-white flex flex-col md:flex-row gap-4 shrink-0 mt-auto">
          <button 
            type="button"
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"
          >
            Hủy thao tác
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] h-14 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-vibrant hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} strokeWidth={2.5} />}
            {initialData ? 'Lưu hồ sơ Master' : 'Khởi tạo Sản phẩm Master'}
          </button>
        </div>
      </div>
    </div>
  );
}
