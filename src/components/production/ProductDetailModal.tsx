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
   Cpu,
   Edit2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAllMaterials } from '@/services/material.service';
import { updateProductBOM, getProductDetail, upsertProduct, recalculateProductCostPrice } from '@/services/product.service';
import { useNotification } from "@/context/NotificationContext";
import { getAllOperations } from '@/services/operation.service';
import { formatNumber, parseNumber } from '@/utils/format';
import { NumericInput } from '@/components/ui/NumericInput';

function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}


interface BOMItem {
   id?: string;
   materialId: string;
   material: {
      specification: string;
      type: string;
      unit: string;
      unitPrice: any;
      referencePrice: any;
      name?: string;
      sku?: string | null;
   };
   quantity: number;
}

interface BOMVersion {
   id: string;
   version: number;
   note?: string;
   is_active: boolean;
   created_at: string;
}

interface Product {
   id: string;
   sku: string | null;
   name: string | null;
   unit?: string | null;
   basePrice: any;
   costPrice: any;
   wholesalePrice: any;
   exportPrice: any;
   productionTimeStd: number | null;
   bomVersions?: BOMVersion[];
   bomItems?: BOMItem[];
   cogsConfig?: any;
}

interface ProductDetailModalProps {
   isOpen: boolean;
   onClose: () => void;
   product: Product;
   onUpdate: () => void;
   onEdit?: (product: Product) => void;
   onCreateVersion?: (product: Product) => void;
}

export default function ProductDetailModal({ isOpen, onClose, product, onUpdate, onEdit, onCreateVersion }: ProductDetailModalProps) {
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
   const { showToast, showModal } = useNotification();
   const [wasteRatio, setWasteRatio] = useState<number>(0.05);
   const [customCosts, setCustomCosts] = useState<any[]>([]);
   const [productionNotes, setProductionNotes] = useState<string[]>([]);
   const [noteInput, setNoteInput] = useState<string>('');
   
   const [bomVersions, setBomVersions] = useState<BOMVersion[]>([]);
   const [selectedVersionId, setSelectedVersionId] = useState<string>('');
   const [bomOperations, setBomOperations] = useState<any[]>([]);
   const [allOperations, setAllOperations] = useState<any[]>([]);

   useEffect(() => {
      if (isOpen && product.id) {
         setProductionTimeStd(product.productionTimeStd || 0);
         loadProductDetail();
         loadMaterials();
         loadOperations();
      }
   }, [isOpen, product.id]);

   const loadOperations = async () => {
      try {
         const ops = await getAllOperations();
         setAllOperations(ops);
      } catch (error) {
         console.error('Failed to load operations:', error);
      }
   };

   const loadProductDetail = async () => {
      setIsLoadingBOM(true);
      try {
         const data = await getProductDetail(product.id);
         if (data) {
            setProductionTimeStd(data.productionTimeStd || 0);
            setWholesalePrice(Number(data.wholesalePrice || 0));
            setExportPrice(Number(data.exportPrice || 0));
            
            const versions = data.bomVersions || [];
            setBomVersions(versions);
            
            const active = versions.find((v: any) => v.is_active) || versions[0];
            if (active) {
               setSelectedVersionId(active.id);
               await loadBOMForVersion(active.id);
            }
         }

         const detail = data as any;
         if (detail?.cogsConfig) {
            const config = detail.cogsConfig;
            setWasteRatio(config.wasteRatio ?? 0.05);
            setCustomCosts(config.customCosts || []);
            setProductionNotes(config.productionNotes || []);
         }
      } catch (error) {
         console.error('Failed to load product detail:', error);
      } finally {
         setIsLoadingBOM(false);
      }
   };

   const loadBOMForVersion = async (versionId: string) => {
      try {
         const { getBOMDetail } = await import('@/services/bom.service');
         const bom = await getBOMDetail(versionId);
         
         if (bom) {
            setBomItems((bom.bom_materials || []).map((item: any) => ({
               id: item.id,
               materialId: item.material_id,
               quantity: Number(item.qty),
               material: {
                  ...item.materials,
                  unitPrice: Number(item.materials.price || 0),
                  referencePrice: Number(item.materials.price || 0)
               }
            })) as any);

            setBomOperations((bom.bom_operations || []).map((op: any) => ({
               id: op.id,
               operationId: op.operation_id,
               sequence: op.sequence,
               operation: op.operations
            })));
         }
      } catch (error) {
         console.error('Failed to load BOM version:', error);
      }
   };


   const loadMaterials = async () => {
      try {
         const data = await getAllMaterials();
         setMaterials(data);
      } catch (error) {
         console.error('Failed to load materials:', error);
      }
   };

   const handleAddOperation = async (op: any) => {
      setBomOperations([
         ...bomOperations,
         {
            id: `new-${Date.now()}`,
            operationId: op.id,
            sequence: bomOperations.length + 1,
            operation: op
         }
      ]);
   };

   const handleRemoveOperation = (id: string) => {
      setBomOperations(bomOperations.filter(op => op.id !== id));
   };

   const handleAddMaterial = (material: any) => {
      if (bomItems.some(item => item.materialId === material.id)) return;

      setBomItems([
         ...bomItems,
         {
            materialId: material.id,
            material: {
               specification: material.specification,
               type: material.type,
               unit: material.unit,
               unitPrice: Number(material.price || material.unitPrice || material.referencePrice || 0),
               referencePrice: Number(material.price || material.referencePrice || 0)
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
      if (!selectedVersionId) return;
      setIsSavingBOM(true);
      try {
         const { upsertBOM } = await import('@/services/bom.service');
         
         // Lấy thông tin BOM hiện tại để giữ version và product_id
         const currentVersion = bomVersions.find(v => v.id === selectedVersionId);
         if (!currentVersion) return;

         await upsertBOM(
            { 
               id: selectedVersionId, 
               product_id: product.id,
               version: currentVersion.version,
               is_active: currentVersion.is_active
            },
            bomItems.map(item => ({
               material_id: item.materialId,
               qty: item.quantity,
               scrap_rate: wasteRatio
            })),
            bomOperations.map(op => ({
               operation_id: op.operationId,
               sequence: op.sequence
            }))
         );
         
         await recalculateProductCostPrice(product.id);
         onUpdate();
         showToast('success', `Đã cập nhật BOM v${currentVersion.version} thành công`);
      } catch (error) {
         console.error('Failed to save BOM:', error);
         showModal('error', 'Lỗi lưu BOM', String(error));
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

         const calculatedBasePrice = totalCOGS;
         const calculatedWholesalePrice = totalCOGS * 1.3;
         const calculatedExportPrice = totalCOGS * 2.4;

         await upsertProduct({
            id: product.id,
            productionTimeStd,
            basePrice: calculatedBasePrice,
            wholesalePrice: calculatedWholesalePrice,
            exportPrice: calculatedExportPrice,
            cogsConfig: {
               ...cogsConfig,
               totalCOGS: calculatedBasePrice
            }
         });

         onUpdate();
         showToast('success', 'Đã niêm yết giá thành công');
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

   const totalOperationCost = bomOperations.reduce((acc, op) => {
      return acc + (Number(op.operation?.price || 0));
   }, 0);

   const wasteCost = totalMaterialCost * wasteRatio;
   const customTotal = customCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);

   const totalCOGS = totalMaterialCost + totalOperationCost + wasteCost + customTotal;


   useEffect(() => {
      if (totalCOGS > 0) {
         setWholesalePrice(totalCOGS * 1.3);
         setExportPrice(totalCOGS * 2.4);
      }
   }, [totalCOGS]);

   const tabs = [
      { id: 'general', label: 'Thông số Kỹ nghệ', icon: Settings },
      { id: 'bom', label: 'Định mức Vật tư', icon: Layers },
      { id: 'cogs', label: 'Tính toán Giá thành', icon: DollarSign }
   ];

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
         <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

         <div className="relative w-full max-w-6xl h-[90vh] bg-white border-[2.5px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">

            {/* HEADER */}
            <div className="px-8 py-6 border-b-[2.5px] border-black flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-neo-purple/10 border-[2.5px] border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                     <Package size={28} strokeWidth={3} className="text-black" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-black tracking-tighter uppercase italic leading-none">
                        {product.name || 'Chi tiết Sản phẩm'}
                     </h2>
                     <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] leading-none">{product.sku || 'N/A'}</span>
                        <span className="w-1.5 h-1.5 bg-black/10 rounded-full" />
                        
                        {/* VERSION SWITCHER */}
                        <div className="flex items-center gap-2 bg-neo-purple/5 px-2 py-1 rounded border border-black/10">
                           <History size={10} className="text-neo-purple" />
                           <select 
                              value={selectedVersionId}
                              onChange={(e) => {
                                 const vid = e.target.value;
                                 setSelectedVersionId(vid);
                                 loadBOMForVersion(vid);
                              }}
                              className="bg-transparent text-[10px] font-black text-neo-purple uppercase outline-none cursor-pointer"
                           >
                              {bomVersions.map(v => (
                                 <option key={v.id} value={v.id}>
                                    Phiên bản v{v.version} {v.is_active ? '(Active)' : ''}
                                 </option>
                              ))}
                           </select>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => onEdit?.(product)}
                    className="h-12 px-6 bg-white border-[2px] border-black rounded-xl font-black text-[11px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-yellow transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
                  >
                     <Edit2 size={16} strokeWidth={3} />
                     <span>Hiệu đính Master</span>
                  </button>

                  <button 
                    onClick={() => onCreateVersion?.(product)}
                    className="h-12 px-6 bg-[#D8B4FE] border-[2px] border-black rounded-xl font-black text-[11px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-purple transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2"
                  >
                     <Layers size={16} strokeWidth={3} />
                     <span>Phiên bản mới</span>
                  </button>
                  {activeTab === 'general' && (
                     <button onClick={handleSaveGeneral} disabled={isSavingGeneral} className="h-12 px-8 bg-black text-white border-[2px] border-black rounded-xl font-black text-[11px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-purple hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2">
                        {isSavingGeneral ? <Loader2 size={16} className="animate-spin text-white" /> : <Save size={16} strokeWidth={3} />}
                        <span>Lưu hồ sơ</span>
                     </button>
                  )}
                  {activeTab === 'bom' && (
                     <button onClick={handleSaveBOM} disabled={isSavingBOM} className="h-12 px-8 bg-black text-white border-[2px] border-black rounded-xl font-black text-[11px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-purple hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2">
                        {isSavingBOM ? <Loader2 size={16} className="animate-spin text-white" /> : <Save size={16} strokeWidth={3} />}
                        <span>Lưu BOM</span>
                     </button>
                  )}
                  {activeTab === 'cogs' && (
                     <button onClick={handleSaveCOGS} disabled={isSavingCOGS} className="h-12 px-8 bg-black text-white border-[2px] border-black rounded-xl font-black text-[11px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-purple hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2">
                        {isSavingCOGS ? <Loader2 size={16} className="animate-spin text-white" /> : <Save size={16} strokeWidth={3} />}
                        <span>Niêm yết giá</span>
                     </button>
                  )}
                  <button onClick={onClose} className="w-12 h-12 bg-white border-[2px] border-black rounded-xl flex items-center justify-center text-black hover:bg-neo-yellow transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                     <X size={24} strokeWidth={3} />
                  </button>
               </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="px-8 border-b-[2.5px] border-black flex items-center gap-10 bg-[#F8FAFC] shrink-0">
               {tabs.map((tab) => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={cn(
                        "flex items-center gap-2 py-5 px-2 text-[11px] font-black uppercase tracking-[0.15em] transition-all relative",
                        activeTab === tab.id
                           ? "text-neo-purple"
                           : "text-black/40 hover:text-black"
                     )}
                  >
                     <tab.icon size={16} strokeWidth={3} />
                     {tab.label}
                     {activeTab === tab.id && (
                        <div className="absolute bottom-[-2.5px] left-0 w-full h-[4px] bg-neo-purple border-x-[1px] border-black" />
                     )}
                  </button>
               ))}
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-10 bg-[#FAF7F2]">
               {activeTab === 'general' ? (
                  <div className="space-y-12 animate-in fade-in duration-500 pb-10">
                     <div className="grid grid-cols-1 lg:grid-cols-[450px_1fr] gap-12 items-start text-black">
                        
                        {/* Left Column: Metrics (Index Cards Stacked) */}
                        <div className="flex flex-col gap-6">
                           <div className="flex items-center gap-3 text-[11px] font-black text-black/20 uppercase tracking-[0.3em] pb-4 border-b-[2px] border-black/5 italic">
                              <Activity size={14} strokeWidth={3} /> Hệ thống Thẻ chỉ số
                           </div>

                           {/* Metrics Vertical Stack */}
                           <div className="space-y-6">
                              {/* CARD 1: PRODUCTION TIME */}
                              <div className="w-full p-8 rounded-xl bg-white border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                 <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-6 italic">Sản xuất (STD)</p>
                                 <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-black text-white rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                       <Clock size={28} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1 border-b-[2.5px] border-black/10 focus-within:border-black transition-colors">
                                       <input 
                                          type="number"
                                          value={productionTimeStd || ''}
                                          onChange={(e) => setProductionTimeStd(Number(e.target.value))}
                                          className="w-full text-5xl font-black text-black bg-transparent outline-none tabular-nums tracking-tighter"
                                          placeholder="0"
                                       />
                                       <span className="text-[10px] text-black/40 font-black uppercase tracking-widest block mt-1 italic leading-none whitespace-nowrap">Phút / Sản phẩm</span>
                                    </div>
                                 </div>
                              </div>

                              {/* CARD 2: BASE PRICE (COGS) */}
                              <div className="w-full p-8 rounded-xl bg-[#D8B4FE] border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                 <div className="flex justify-between items-center mb-6">
                                    <p className="text-[10px] font-black text-black uppercase tracking-widest italic">Giá vốn (Base)</p>
                                    <button 
                                      onClick={async () => {
                                        const module = await import('@/services/product.service');
                                        const res = await module.recalculateProductCostPrice(product.id);
                                        if (res) onUpdate();
                                      }}
                                      className="px-3 py-1 bg-white text-black border-[1.5px] border-black text-[9px] font-black uppercase tracking-widest rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                                    >
                                      Re-calc
                                    </button>
                                 </div>
                                 <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                       <Calculator size={28} strokeWidth={3} className="text-black" />
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-5xl font-black text-black tabular-nums tracking-tighter italic">
                                          {formatNumber(Math.round(Number((product as any).basePrice || 0)))}
                                       </p>
                                       <span className="text-[10px] text-black uppercase font-black tracking-widest italic block leading-none whitespace-nowrap">VNĐ / Sản phẩm</span>
                                    </div>
                                 </div>
                              </div>

                              {/* CARD 3: WHOLESALE PRICE */}
                              <div className="w-full p-8 rounded-xl bg-[#FEF3C7] border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                 <p className="text-[10px] font-black text-black uppercase tracking-widest mb-6 italic">Giá sỉ (Wholesale)</p>
                                 <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white border-[2.5px] border-black text-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                       <Store size={28} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-5xl font-black text-black tabular-nums tracking-tighter">
                                          {formatNumber(Math.round(Number((product as any).wholesalePrice || 0)))}
                                       </p>
                                       <p className="text-[10px] text-black font-black uppercase tracking-widest mt-1 italic block leading-none whitespace-nowrap">BIÊN LỢI NHUẬN ĐỀ XUẤT OK</p>
                                    </div>
                                 </div>
                              </div>

                              {/* CARD 4: EXPORT PRICE */}
                              <div className="w-full p-8 rounded-xl bg-[#D1FAE5] border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                 <p className="text-[10px] font-black text-black uppercase tracking-widest mb-6 italic">Giá XK (Export)</p>
                                 <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white border-[2.5px] border-black text-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                                       <Globe size={28} strokeWidth={3} />
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-5xl font-black text-black tabular-nums tracking-tighter">
                                          {formatNumber(Math.round(Number((product as any).exportPrice || 0)))}
                                       </p>
                                       <p className="text-[10px] text-black font-black uppercase tracking-widest mt-1 italic block leading-none whitespace-nowrap">GIÁ CHUẨN TOÀN CẦU</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Right Column: Product Image & Technical Notes */}
                        <div className="space-y-12">
                           {/* 1. Large Product Image Display */}
                           <div className="space-y-6">
                              <div className="flex items-center gap-3 text-[11px] font-black text-black/20 uppercase tracking-[0.3em] pb-4 border-b-[2px] border-black/5 italic">
                                 <Tag size={14} strokeWidth={3} /> Hình ảnh Sản phẩm
                              </div>
                              <div className="aspect-[4/3] bg-white border-[2.5px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden relative group">
                                 <div className="absolute inset-0 bg-black/5 flex items-center justify-center group-hover:bg-transparent transition-all">
                                    <Package size={120} strokeWidth={1} className="text-black opacity-10" />
                                 </div>
                                 <div className="absolute top-6 right-6 px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] italic">
                                    MASTER PROTOTYPE
                                 </div>
                              </div>
                           </div>

                           {/* 2. Technical Notes Section */}
                           <div className="space-y-6">
                              <div className="flex items-center gap-3 text-[11px] font-black text-black/20 uppercase tracking-[0.3em] pb-4 border-b-[2px] border-black/5 italic">
                                 <History size={14} strokeWidth={3} /> Nhật ký & Yêu cầu Kỹ thuật
                              </div>
                              
                              <div className="bg-white border-[2.5px] border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                                 <div className="flex gap-4">
                                    <input 
                                       value={noteInput}
                                       onChange={(e) => setNoteInput(e.target.value)}
                                       onKeyDown={(e) => e.key === 'Enter' && addNote()}
                                       placeholder="Thêm yêu cầu kỹ thuật mới..."
                                       className="flex-1 h-14 bg-white border-[2.5px] border-solid border-black/30 rounded-xl px-6 text-sm font-medium placeholder:text-black/20 focus:border-black focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all italic text-black"
                                    />
                                    <button onClick={addNote} className="w-14 h-14 bg-black text-white hover:bg-neo-purple hover:text-black border-[2px] border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                                       <Plus size={24} strokeWidth={4} />
                                    </button>
                                 </div>
                                 
                                 <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                    {productionNotes.map((note, idx) => (
                                       <div key={idx} className="group relative flex items-start gap-5 p-6 bg-[#FAF7F2] border-[2px] border-black rounded-xl hover:bg-neo-yellow/10 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                             <span className="text-[12px] font-black italic">{idx + 1}</span>
                                          </div>
                                          <textarea 
                                             rows={1}
                                             value={note}
                                             onChange={(e) => updateNote(idx, e.target.value)}
                                             className="flex-1 bg-transparent text-sm font-medium text-black outline-none italic resize-none"
                                          />
                                          <button onClick={() => removeNote(idx)} className="text-black/20 hover:text-rose-600 transition-colors">
                                             <Trash2 size={18} strokeWidth={3} />
                                          </button>
                                       </div>
                                    ))}
                                    {productionNotes.length === 0 && (
                                       <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                                          <Cpu size={48} strokeWidth={1} />
                                          <p className="text-[12px] font-black uppercase tracking-[0.4em] italic">Nhật ký Trống</p>
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
                              ) : activeTab === 'bom' ? (
                  <div className="space-y-10 animate-in fade-in duration-500 h-full flex flex-col pb-10">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative group/field">
                           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={24} />
                           <select
                              onChange={(e) => {
                                 const mat = materials.find(m => m.id === e.target.value);
                                 if (mat) handleAddMaterial(mat);
                                 e.target.value = "";
                              }}
                              className="w-full h-16 pl-16 pr-12 bg-white border-[2.5px] border-black rounded-xl appearance-none cursor-pointer font-black text-black tracking-tight focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                           >
                              <option value="">-- Phân bổ Vật tư --</option>
                              {materials.map(m => (
                                 <option key={m.id} value={m.id} disabled={bomItems.some(bi => bi.materialId === m.id)}>
                                    {m.specification} [{m.type || 'N/A'}]
                                 </option>
                              ))}
                           </select>
                           <ChevronDown size={24} strokeWidth={3} className="absolute right-6 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
                        </div>

                        <div className="relative group/field">
                           <Cpu className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={24} />
                           <select
                              onChange={(e) => {
                                 const op = allOperations.find((o: any) => o.id === e.target.value);
                                 if (op) handleAddOperation(op);
                                 e.target.value = "";
                              }}
                              className="w-full h-16 pl-16 pr-12 bg-white border-[2.5px] border-black rounded-xl appearance-none cursor-pointer font-black text-black tracking-tight focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all uppercase"
                           >
                              <option value="">-- Thêm Công đoạn --</option>
                              {allOperations.map((o: any) => (
                                 <option key={o.id} value={o.id} disabled={bomOperations.some(bo => bo.operationId === o.id)}>
                                    {o.specification} [{formatNumber(o.price || 0)} VNĐ]
                                 </option>
                              ))}
                           </select>
                           <ChevronDown size={24} strokeWidth={3} className="absolute right-6 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
                        </div>
                     </div>

                     <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 overflow-hidden min-h-0">
                        {/* MATERIALS TABLE */}
                        <div className="overflow-hidden flex flex-col border-[2.5px] border-black rounded-xl bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                           <div className="px-6 py-4 bg-[#F8FAFC] border-b-[2px] border-black flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-widest italic">Vật tư (Materials)</span>
                              <span className="badge-primary text-[10px] px-2 py-0.5">{bomItems.length} items</span>
                           </div>
                           <div className="flex-1 overflow-y-auto">
                              <table className="w-full text-left border-collapse">
                                 <thead className="sticky top-0 z-10 bg-white border-b-[2px] border-black/5">
                                    <tr className="text-[10px] font-black text-black/40 uppercase tracking-widest">
                                       <th className="px-6 py-4">Tên vật tư</th>
                                       <th className="px-6 py-4 text-center">Số lượng</th>
                                       <th className="px-6 py-4 text-right">Đơn giá</th>
                                       <th className="px-6 py-4 w-12"></th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-black/5">
                                    {bomItems.map((item) => (
                                       <tr key={item.materialId} className="group hover:bg-neo-purple/5">
                                          <td className="px-6 py-4">
                                             <p className="font-black text-black text-xs uppercase italic">{item.material.specification}</p>
                                             <p className="text-[9px] text-black/40 font-black uppercase tracking-tighter mt-0.5">{item.material.type || 'N/A'}</p>
                                          </td>
                                          <td className="px-6 py-4">
                                             <div className="flex items-center gap-2 bg-white border border-black/20 rounded px-2 py-1">
                                                <input
                                                   type="number"
                                                   value={item.quantity}
                                                   onChange={(e) => handleUpdateQuantity(item.materialId, Number(e.target.value))}
                                                   className="w-12 bg-transparent text-center font-black text-black outline-none tabular-nums text-xs"
                                                />
                                                <span className="text-[9px] font-black text-black/30 uppercase">{item.material.unit}</span>
                                             </div>
                                          </td>
                                           <td className="px-6 py-4 text-right tabular-nums text-black/40 font-black italic text-xs">{formatNumber(item.material.unitPrice || 0)}</td>
                                          <td className="px-6 py-4">
                                             <button onClick={() => handleRemoveMaterial(item.materialId)} className="text-black/20 hover:text-rose-500 transition-colors">
                                                <Trash2 size={16} strokeWidth={3} />
                                             </button>
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>

                        {/* OPERATIONS LIST */}
                        <div className="overflow-hidden flex flex-col border-[2.5px] border-black rounded-xl bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                           <div className="px-6 py-4 bg-[#F8FAFC] border-b-[2px] border-black flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-widest italic">Công đoạn (Operations)</span>
                              <button className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center hover:bg-neo-purple transition-colors">
                                 <Plus size={16} strokeWidth={3} />
                              </button>
                           </div>
                           <div className="flex-1 overflow-y-auto p-6 space-y-4">
                              {bomOperations.map((op, idx) => (
                                 <div key={op.id} className="p-4 bg-[#FAF7F2] border-[2px] border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                       <div className="flex items-center gap-3">
                                          <div className="w-6 h-6 bg-black text-white text-[10px] font-black rounded flex items-center justify-center italic">#{idx + 1}</div>
                                          <p className="font-black text-black text-xs uppercase italic">{op.operation.name}</p>
                                       </div>
                                       <button onClick={() => handleRemoveOperation(op.id)} className="text-black/20 hover:text-rose-500 transition-colors">
                                          <Trash2 size={14} strokeWidth={3} />
                                       </button>
                                    </div>
                                    <div className="flex justify-between items-center bg-white border border-black/10 rounded-lg p-3">
                                       <div className="flex flex-col">
                                          <span className="text-[8px] font-black text-black/40 uppercase italic">Chi phí/SP</span>
                                          <span className="text-xs font-black text-black italic">{(op.operation.price || 0).toLocaleString()} VNĐ</span>
                                       </div>
                                       <div className="w-px h-6 bg-black/5" />
                                       <div className="flex flex-col items-end">
                                          <span className="text-[8px] font-black text-black/40 uppercase italic">Thứ tự</span>
                                          <span className="text-xs font-black text-black italic tabular-nums">{op.sequence}</span>
                                       </div>
                                    </div>
                                 </div>
                              ))}
                              {bomOperations.length === 0 && (
                                 <div className="py-12 text-center opacity-20">
                                    <Cpu size={32} className="mx-auto mb-3" />
                                    <p className="text-[10px] font-black uppercase italic tracking-widest">N/A Operations</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="p-8 bg-[#F1F5F9] border-[2.5px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl flex justify-between items-center mt-auto">
                        <div className="flex gap-12">
                           <div>
                              <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1 italic">Vật tư</p>
                              <p className="text-2xl font-black text-black italic tabular-nums">{totalMaterialCost.toLocaleString()} <span className="text-[10px] not-italic text-black/30">VNĐ</span></p>
                           </div>
                           <div className="w-px h-full bg-black/10" />
                           <div>
                              <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1 italic">Gia công</p>
                              <p className="text-2xl font-black text-black italic tabular-nums">
                                 {bomOperations.reduce((sum, item) => sum + (item.operation.price || 0), 0).toLocaleString()} <span className="text-[10px] not-italic text-black/30">VNĐ</span>
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 bg-black text-white px-6 py-4 rounded-xl border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(139,92,246,1)]">
                           <Calculator size={24} strokeWidth={3} className="text-neo-yellow" />
                           <div>
                              <p className="text-[9px] font-black text-white/40 uppercase italic">Tổng giá trị v{bomVersions.find(v => v.id === selectedVersionId)?.version}</p>
                              <p className="text-xl font-black text-white tabular-nums italic">
                                 {(totalMaterialCost + bomOperations.reduce((sum, item) => sum + (item.operation.price || 0), 0)).toLocaleString()} VNĐ
                              </p>
                           </div>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-12 animate-in fade-in duration-500 pb-10">
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Total Card */}
                        <div className="lg:col-span-2 p-12 bg-black text-white rounded-xl border-[2.5px] border-black shadow-[10px_10px_0px_0px_rgba(139,92,246,1)] relative overflow-hidden flex flex-col justify-between min-h-[300px]">
                           <div className="absolute top-[-20%] right-[-10%] p-12 opacity-10 pointer-events-none scale-[2]">
                              <Activity size={200} />
                           </div>
                           <div className="relative z-10">
                              <p className="text-[12px] font-black uppercase tracking-[0.5em] text-neo-purple/60 mb-6 italic">Giá thành Mục tiêu (COGS)</p>
                              <h3 className="text-7xl font-black tracking-tighter tabular-nums italic text-[#FACC15]">
                                 {Math.round(totalCOGS).toLocaleString()} <span className="text-2xl font-black text-white not-italic ml-2 uppercase">VNĐ/SP</span>
                              </h3>
                           </div>
                           <div className="relative z-10 flex gap-20 pt-10 border-t-[2.5px] border-white/10 mt-8">
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-3 italic underline decoration-neo-yellow decoration-[3px] underline-offset-4">Chi phí Chung & Hao hụt</span>
                                 <span className="text-3xl font-black text-white tabular-nums italic">{(wasteCost + customTotal).toLocaleString()}</span>
                              </div>
                           </div>
                        </div>

                        {/* Waste Ratio Card */}
                        <div className="p-12 bg-white border-[2.5px] border-black rounded-xl flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FFFBEB] transition-all">
                           <div>
                              <p className="text-[11px] font-black text-black/40 uppercase tracking-[0.2em] mb-8 italic">Tỉ lệ Hao hụt/Dự phòng (%)</p>
                              <div className="flex items-center gap-6 p-6 bg-white border-[2.5px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-fit">
                                 <input
                                    type="number"
                                    value={Math.round(wasteRatio * 100)}
                                    onChange={(e) => setWasteRatio(Number(e.target.value) / 100)}
                                    className="w-24 text-6xl font-black text-black bg-transparent outline-none tabular-nums tracking-tighter italic"
                                 />
                                 <span className="text-4xl font-black text-black italic">%</span>
                              </div>
                           </div>
                           <div className="flex items-center gap-3 mt-10 py-5 px-6 bg-black text-white rounded-xl border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                              <Info size={20} strokeWidth={3} className="text-neo-yellow" />
                              <p className="text-[11px] font-black uppercase tracking-widest italic">An toàn Biến phí</p>
                           </div>
                        </div>
                     </div>

                     {/* Custom Costs Table */}
                     <div className="border-[2.5px] border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden bg-white">
                        <div className="px-10 py-8 bg-[#F8FAFC] border-b-[2.5px] border-black flex justify-between items-center sm:flex-row flex-col gap-8">
                           <div>
                              <h4 className="text-[12px] font-black text-black uppercase tracking-[0.3em] italic">Phân bổ Hoạt động (Chi phí chung)</h4>
                              <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
                                 <Cpu size={14} /> Nguồn lực Sản xuất Gián tiếp
                              </p>
                           </div>
                           <button onClick={addCustomCost} className="h-12 px-8 bg-black text-white border-[2px] border-black rounded-xl font-black text-[11px] uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(139,92,246,1)] hover:bg-neo-purple transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-3">
                              <Plus size={20} strokeWidth={4} />
                              Thêm Nguồn lực
                           </button>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full !mt-0 text-left border-collapse">
                              <thead>
                                 <tr className="bg-white text-[11px] font-black text-black/40 uppercase tracking-[0.2em] border-b-[2.5px] border-black italic">
                                    <th className="px-10 py-6">Trung tâm Chi phí</th>
                                    <th className="px-10 py-6">Chi tiết Hoạt động</th>
                                    <th className="px-10 py-6 text-right w-64">Ngân sách Phân bổ (VNĐ)</th>
                                    <th className="px-10 py-6 w-20"></th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y-[2.5px] divide-black/5">
                                 {/* Row: Direct Materials (BOM) */}
                                 <tr className="bg-[#F8FAFC]">
                                    <td className="px-10 py-7">
                                       <span className="font-black text-black italic uppercase text-base">Định mức vật tư (BOM)</span>
                                    </td>
                                    <td className="px-10 py-7">
                                       <span className="text-black/60 font-black italic text-sm"> Theo định mức BOM </span>
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                       <div className="relative group/input max-w-[240px] ml-auto">
                                          <div className="w-full h-14 bg-black/5 border-[2.5px] border-black/10 rounded-xl px-12 flex items-center justify-end font-black text-black/40 tabular-nums text-xl italic">
                                             {totalMaterialCost.toLocaleString()}
                                          </div>
                                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/20 uppercase tracking-widest pointer-events-none">VNĐ</span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-7"></td>
                                 </tr>

                                 {/* Row: Waste Contingency */}
                                 <tr className="bg-[#FEFCE8]">
                                    <td className="px-10 py-7">
                                       <span className="font-black text-black italic uppercase text-base">Chi phí hao hụt & dự phòng</span>
                                    </td>
                                    <td className="px-10 py-7">
                                       <div className="flex items-center gap-2">
                                          <span className="badge-warning text-[10px] font-black uppercase tracking-widest italic">{Math.round(wasteRatio * 100)}%</span>
                                          <span className="text-black/60 font-black italic text-sm">trên tổng vật tư</span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-7 text-right">
                                       <div className="relative group/input max-w-[240px] ml-auto">
                                          <div className="w-full h-14 bg-black/5 border-[2.5px] border-black/10 rounded-xl px-12 flex items-center justify-end font-black text-black/40 tabular-nums text-xl italic">
                                             {wasteCost.toLocaleString()}
                                          </div>
                                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/20 uppercase tracking-widest pointer-events-none">VNĐ</span>
                                       </div>
                                    </td>
                                    <td className="px-10 py-7"></td>
                                 </tr>
                                 {customCosts.map(cost => (
                                    <tr key={cost.id} className="group hover:bg-neo-yellow/5 transition-colors">
                                       <td className="px-10 py-7">
                                          <input
                                             value={cost.name}
                                             onChange={(e) => updateCustomCost(cost.id, 'name', e.target.value)}
                                             className="w-full bg-transparent font-black text-black outline-none text-base italic uppercase placeholder:text-black/10 focus:underline decoration-neo-purple decoration-[3px] underline-offset-4"
                                             placeholder="VD: Nhân công trực tiếp..."
                                          />
                                       </td>
                                       <td className="px-10 py-7">
                                          <input
                                             value={cost.details}
                                             onChange={(e) => updateCustomCost(cost.id, 'details', e.target.value)}
                                             className="w-full bg-transparent text-black/60 font-black italic outline-none text-sm placeholder:text-black/10"
                                             placeholder="Phân bổ dựa trên STD..."
                                          />
                                       </td>
                                       <td className="px-10 py-7 text-right">
                                          <div className="relative group/input">
                                             <input
                                                type="number"
                                                value={cost.amount || ''}
                                                onChange={(e) => updateCustomCost(cost.id, 'amount', Number(e.target.value))}
                                                className="w-full h-14 bg-white border-[2.5px] border-black rounded-xl px-12 text-right font-black text-[#000000] outline-none focus:border-[#D8B4FE] focus:shadow-[6px_6px_0px_0px_rgba(216,180,254,0.3)] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] tabular-nums text-xl italic transition-all"
                                                placeholder="0"
                                             />
                                          </div>
                                       </td>
                                       <td className="px-10 py-7 text-right">
                                          <button onClick={() => removeCustomCost(cost.id)} className="w-12 h-12 flex items-center justify-center bg-[#FEE2E2] border-[2.5px] border-black rounded-xl text-black hover:bg-rose-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ml-auto">
                                             <Trash2 size={20} strokeWidth={3} />
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
