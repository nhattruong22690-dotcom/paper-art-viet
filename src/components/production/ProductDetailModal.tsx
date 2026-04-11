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
import { updateProductBOM, getProductDetail, upsertProduct, recalculateProductCostPrice, deleteProduct } from '@/services/product.service';
import { useNotification } from "@/context/NotificationContext";
import { getAllOperations } from '@/services/operation.service';
import { formatNumber, parseNumber, formatVND } from '@/utils/format';
import { NumericInput } from '@/components/ui/NumericInput';
import { SearchableSelect } from '@/components/ui/SearchableSelect';

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
   const [basePrice, setBasePrice] = useState<number>(0);
   const { showToast, showModal, confirm } = useNotification();
   const [wasteRatio, setWasteRatio] = useState<number>(0.05);
   const [customCosts, setCustomCosts] = useState<any[]>([]);
   const [productionNotes, setProductionNotes] = useState<string[]>([]);
   const [noteInput, setNoteInput] = useState<string>('');
   const [productName, setProductName] = useState<string>('');
   const [productSKU, setProductSKU] = useState<string>('');
   const [productUnit, setProductUnit] = useState<string>('');
   const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

   const [bomVersions, setBomVersions] = useState<BOMVersion[]>([]);
   const [selectedVersionId, setSelectedVersionId] = useState<string>('');
   const [bomOperations, setBomOperations] = useState<any[]>([]);
   const [allOperations, setAllOperations] = useState<any[]>([]);

   useEffect(() => {
      if (isOpen && product.id) {
         setProductionTimeStd(product.productionTimeStd || 0);
         setProductName(product.name || '');
         setProductSKU(product.sku || '');
         setProductUnit(product.unit || '');
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
            setBasePrice(Number(data.basePrice || 0));
            setWholesalePrice(Number(data.wholesalePrice || 0));
            setExportPrice(Number(data.exportPrice || 0));
            setProductName(data.name || '');
            setProductSKU(data.sku || '');
            setProductUnit(data.unit || '');

            if (data.cogsConfig) {
               const config = data.cogsConfig;
               setWasteRatio(config.wasteRatio ?? 0.05);
               setCustomCosts(config.customCosts || []);
               setProductionNotes(config.productionNotes || []);
               const loadedCustomPrices = config.customPrices || {};
               setCustomPrices(loadedCustomPrices);
               
               const versions = data.bomVersions || [];
               setBomVersions(versions);
               const active = versions.find((v: any) => v.is_active) || versions[0];
               if (active) {
                  setSelectedVersionId(active.id);
                  loadBOMForVersion(active.id, loadedCustomPrices);
               }
            } else {
               const versions = data.bomVersions || [];
               setBomVersions(versions);
               const active = versions.find((v: any) => v.is_active) || versions[0];
               if (active) {
                  setSelectedVersionId(active.id);
                  loadBOMForVersion(active.id, {});
               }
            }
         }
      } catch (error) {
         console.error('Failed to load product detail:', error);
      } finally {
         setIsLoadingBOM(false);
      }
   };

   const loadBOMForVersion = async (versionId: string, currentCustomPrices?: Record<string, number>) => {
      setIsLoadingBOM(true);
      try {
         const { getBOMDetail } = await import('@/services/bom.service');
         const bom = await getBOMDetail(versionId);

         if (bom) {
            const pricesSource = currentCustomPrices || customPrices;
            
            setBomItems((bom.bom_materials || []).map((item: any) => {
               const definedCustomPrice = pricesSource[item.material_id];
               return {
                  id: item.id,
                  materialId: item.material_id,
                  quantity: Number(item.qty || 0),
                  material: {
                     ...(item.material || {}),
                     unitPrice: Number(definedCustomPrice ?? item.material?.price ?? 0),
                     referencePrice: Number(item.material?.price || 0)
                  }
               };
            }) as any);

            setBomOperations((bom.bom_operations || []).map((op: any) => {
               const definedCustomPrice = pricesSource[op.operation_id];
               return {
                  id: op.id,
                  operationId: op.operation_id,
                  sequence: op.sequence,
                  operation: {
                     ...(op.operation || {}),
                     price: Number(definedCustomPrice ?? op.operation?.price ?? 0)
                  }
               };
            }));
         }
      } catch (error) {
         console.error('Failed to load BOM version:', error);
      } finally {
         setIsLoadingBOM(false);
      }
   };


   const handleDeleteProduct = async () => {
      const confirmed = await confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"? Dữ liệu lịch sử đơn hàng sẽ được bảo toàn nhờ hệ thống Snapshot.`);
      if (confirmed) {
         try {
            await deleteProduct(product.id);
            showToast('success', 'Đã xóa sản phẩm thành công');
            onUpdate();
            onClose();
         } catch (error) {
            console.error('Delete error:', error);
            showToast('error', 'Không thể xóa sản phẩm này');
         }
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

   const handleUpdateMaterialPrice = (materialId: string, price: number) => {
      setBomItems(bomItems.map(item =>
         item.materialId === materialId ? { ...item, material: { ...item.material, unitPrice: price } } : item
      ));
   };

   const handleUpdateOperationPrice = (id: string, price: number) => {
      setBomOperations(bomOperations.map(op =>
         op.id === id ? { ...op, operation: { ...op.operation, price: price } } : op
      ));
   };

   const handleSaveBOM = async () => {
      if (isLoadingBOM) return;
      setIsSavingBOM(true);
      try {
         const { upsertBOM } = await import('@/services/bom.service');

         let targetVersionId = selectedVersionId;
         let targetVersionNumber = 1;
         let targetIsActive = true;

         if (targetVersionId) {
            const currentVersion = bomVersions.find(v => v.id === targetVersionId);
            if (!currentVersion) {
               setIsSavingBOM(false);
               return;
            }
            targetVersionNumber = currentVersion.version;
            targetIsActive = currentVersion.is_active;
         }

         const bomData: any = {
            product_id: product.id,
            version: targetVersionNumber,
            is_active: targetIsActive
         };

         if (targetVersionId) {
            bomData.id = targetVersionId;
         } else {
            bomData.note = 'Initial BOM';
         }

         const updatedBom = await upsertBOM(
            bomData,
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

         if (!targetVersionId && updatedBom) {
            setSelectedVersionId(updatedBom.id);
            setBomVersions([updatedBom as unknown as BOMVersion]);
         }

         const newCustomPrices = { ...customPrices };
         bomItems.forEach(item => {
            if (item.material.unitPrice !== item.material.referencePrice) {
               newCustomPrices[item.materialId] = item.material.unitPrice;
            }
         });
         bomOperations.forEach(op => {
            newCustomPrices[op.operationId] = op.operation.price;
         });

         setCustomPrices(newCustomPrices);

         await upsertProduct({
            id: product.id,
            cogsConfig: {
               wasteRatio,
               customCosts,
               productionNotes,
               customPrices: newCustomPrices
            }
         } as any);

         await recalculateProductCostPrice(product.id);
         onUpdate();
         setTimeout(() => {
            showToast('success', `Đã cập nhật BOM v${targetVersionNumber} thành công`);
         }, 100);
      } catch (error: any) {
         console.error('Failed to save BOM:', error);
         const errorMessage = error?.message || error?.error_description || String(error);
         showModal('error', 'Lỗi lưu BOM', `Chi tiết: ${errorMessage}`);
      } finally {
         setIsSavingBOM(false);
      }
   };

   const handleSaveCOGS = async () => {
      setIsSavingCOGS(true);
      try {
         const newCustomPrices = { ...customPrices };
         bomItems.forEach(item => {
            if (item.material.unitPrice !== item.material.referencePrice) {
               newCustomPrices[item.materialId] = item.material.unitPrice;
            }
         });
         bomOperations.forEach(op => {
            newCustomPrices[op.operationId] = op.operation.price;
         });

         const cogsConfig = {
            wasteRatio,
            customCosts,
            productionNotes,
            customPrices: newCustomPrices
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
            costPrice: calculatedBasePrice,
            cogsConfig: {
               ...cogsConfig,
               totalCOGS: calculatedBasePrice
            }
         });

         setCustomPrices(newCustomPrices);
         setBasePrice(calculatedBasePrice);
         setWholesalePrice(calculatedWholesalePrice);
         setExportPrice(calculatedExportPrice);

         onUpdate();
         showToast('success', 'Đã niêm yết giá & lưu Snapshot thành công');
      } catch (error: any) {
         console.error('Failed to save COGS:', error);
         const errorMessage = error?.message || error?.error_description || String(error);
         showToast('error', `Lỗi niêm yết giá: ${errorMessage}`);
      } finally {
         setIsSavingCOGS(false);
      }
   };

   const handleSaveGeneral = async () => {
      setIsSavingGeneral(true);
      try {
         await upsertProduct({
            id: product.id,
            name: productName,
            sku: productSKU,
            unit: productUnit,
            productionTimeStd,
            cogsConfig: {
               wasteRatio,
               customCosts,
               productionNotes,
               customPrices
            }
         } as any);
         onUpdate();
         showToast('success', 'Đã lưu hồ sơ sản phẩm thành công');
      } catch (error) {
         console.error('Failed to save general info:', error);
         const errorMessage = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
         showToast('error', `Lỗi khi lưu thông tin: ${errorMessage}`);
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

   const totalCOGS = Math.round(totalMaterialCost + totalOperationCost + wasteCost + customTotal);


   useEffect(() => {
      if (totalCOGS > 0) {
         setWholesalePrice(Math.round(totalCOGS * 1.3));
         setExportPrice(Math.round(totalCOGS * 2.4));
      }
   }, [totalCOGS]);

   const tabs = [
      { id: 'general', label: 'Thông tin SP', icon: Settings },
      { id: 'bom', label: 'Định mức Vật tư', icon: Layers },
      { id: 'cogs', label: 'Tính toán Giá thành', icon: DollarSign }
   ];

   if (!isOpen) return null;

   return (
      <div className="fixed inset-0 lg:left-[var(--sidebar-width)] z-[500] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
         <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

         <div className="relative w-full max-w-[95vw] h-[95vh] bg-white border-[2.5px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">

            {/* HEADER */}
            <div className="px-8 py-6 border-b-[2.5px] border-black flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-neo-purple/10 border-[2.5px] border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                     <Package size={28} strokeWidth={3} className="text-black" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-black tracking-tighter uppercase italic leading-none">
                        {productName || 'Chi tiết Sản phẩm'}
                     </h2>
                     <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] leading-none">{productSKU || 'N/A'}</span>
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
                     onClick={handleDeleteProduct}
                     className="w-12 h-12 bg-red-50 border-[2px] border-black rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                     title="Xóa sản phẩm"
                  >
                     <Trash2 size={20} strokeWidth={3} />
                  </button>

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
                                          {formatVND(Math.round(basePrice))}
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
                                          {formatVND(Math.round(wholesalePrice))}
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
                                          {formatVND(Math.round(exportPrice))}
                                       </p>
                                       <p className="text-[10px] text-black font-black uppercase tracking-widest mt-1 italic block leading-none whitespace-nowrap">GIÁ CHUẨN TOÀN CẦU</p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                         {/* Right Column: Basic Info & Image & Technical Notes */}
                         <div className="space-y-12">
                            {/* 0. Basic Info Section */}
                            <div className="space-y-6">
                               <div className="flex items-center gap-3 text-[11px] font-black text-black/20 uppercase tracking-[0.3em] pb-4 border-b-[2px] border-black/5 italic">
                                  <Package size={14} strokeWidth={3} /> Thông tin hồ sơ Sản phẩm
                               </div>
                               <div className="bg-white border-[2.5px] border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="md:col-span-2 space-y-2">
                                     <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1 italic">Tên Sản phẩm (*)</label>
                                     <input
                                        value={productName}
                                        onChange={(e) => setProductName(e.target.value)}
                                        placeholder="Nhập tên sản phẩm..."
                                        className="w-full h-12 bg-[#FAF7F2] border-[2px] border-black rounded-xl px-4 text-sm font-bold focus:bg-white outline-none transition-all italic text-black"
                                     />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1 italic">Mã SKU / Định danh</label>
                                     <input
                                        value={productSKU}
                                        onChange={(e) => setProductSKU(e.target.value)}
                                        placeholder="Mã SKU..."
                                        className="w-full h-12 bg-[#FAF7F2] border-[2px] border-black rounded-xl px-4 text-sm font-bold focus:bg-white outline-none transition-all italic text-black"
                                     />
                                  </div>
                                  <div className="space-y-2">
                                     <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1 italic">Đơn vị tính</label>
                                     <input
                                        value={productUnit}
                                        onChange={(e) => setProductUnit(e.target.value)}
                                        placeholder="Tờ, Cuộn, Bộ..."
                                        className="w-full h-12 bg-[#FAF7F2] border-[2px] border-black rounded-xl px-4 text-sm font-bold focus:bg-white outline-none transition-all italic text-black"
                                     />
                                  </div>
                               </div>
                            </div>

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
                        <SearchableSelect
                           options={materials.map(m => ({
                              id: m.id,
                              label: m.specification || m.name || 'Vật tư chưa đặt tên',
                              sublabel: `${m.code || m.sku || 'N/A'} • ${m.type || 'RAW'}`,
                              searchTerms: [m.code, m.sku, m.name, m.specification, m.type, m.note].filter(Boolean) as string[],
                              disabled: bomItems.some(bi => bi.materialId === m.id)
                           }))}
                           onSelect={(id) => {
                              const mat = materials.find(m => m.id === id);
                              if (mat) handleAddMaterial(mat);
                           }}
                           placeholder="Phân bổ Vật tư"
                           icon={<Search size={24} />}
                        />

                        <SearchableSelect
                           options={allOperations.map(op => ({
                              id: op.id,
                              label: op.specification || op.name || 'Công đoạn chưa đặt tên',
                              sublabel: `Mặc định: ${formatNumber(op.price || 0)} VNĐ`,
                              searchTerms: [op.name, op.specification, op.type, op.code, op.note].filter(Boolean) as string[],
                              disabled: bomOperations.some(bo => bo.operationId === op.id)
                           }))}
                           onSelect={(id) => {
                              const op = allOperations.find(o => o.id === id);
                              if (op) handleAddOperation(op);
                           }}
                           placeholder="Thêm Công đoạn"
                           icon={<Cpu size={24} />}
                        />
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
                                       <th className="px-6 py-4 text-center">Định mức</th>
                                       <th className="px-6 py-4 text-right">Đơn giá</th>
                                       <th className="px-6 py-4 text-right">Thành tiền</th>
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
                                          <td className="px-6 py-4 text-center">
                                             <div className="w-[85px] mx-auto">
                                                <NumericInput
                                                   value={item.quantity}
                                                   onChange={(val) => handleUpdateQuantity(item.materialId, val)}
                                                   suffix={item.material.unit}
                                                   className="w-full bg-white border border-black/20 rounded px-2 py-1 text-center font-black text-black outline-none tabular-nums text-xs !pl-2 !pr-8 shadow-none focus:border-neo-purple"
                                                   hideWrapper
                                                />
                                             </div>
                                          </td>
                                          <td className="px-6 py-4 text-right tabular-nums text-black/40 font-black italic text-xs">
                                             <div className="w-[100px] ml-auto">
                                                <NumericInput
                                                   value={item.material.unitPrice}
                                                   onChange={(val) => handleUpdateMaterialPrice(item.materialId, val)}
                                                   className="w-full bg-white border border-black/20 rounded px-2 py-1 text-right font-black text-black outline-none tabular-nums text-xs !pl-2 !pr-2 shadow-none focus:border-neo-purple"
                                                   hideWrapper
                                                />
                                             </div>
                                          </td>
                                          <td className="px-6 py-4 text-right tabular-nums text-black font-black italic text-sm">
                                             {formatVND(item.quantity * (item.material.unitPrice || 0))}
                                          </td>
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
                                          <p className="font-black text-black text-xs uppercase italic">{op.operation.specification}</p>
                                       </div>
                                       <button onClick={() => handleRemoveOperation(op.id)} className="text-black/20 hover:text-rose-500 transition-colors">
                                          <Trash2 size={14} strokeWidth={3} />
                                       </button>
                                    </div>
                                    <div className="flex justify-between items-center tabular-nums">
                                       <span className="text-[9px] font-black text-black/30 uppercase tracking-widest italic">Đơn giá nhân công</span>
                                       <div className="w-32">
                                          <NumericInput
                                             value={op.operation.price}
                                             onChange={(val) => handleUpdateOperationPrice(op.id, val)}
                                             className="w-full bg-white border border-black/20 rounded px-2 py-1 text-right font-black text-black outline-none tabular-nums text-xs !pl-2 !pr-2 shadow-none focus:border-neo-purple"
                                             hideWrapper
                                          />
                                       </div>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="space-y-10 animate-in fade-in duration-500 pb-10">
                     <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start">
                        {/* COGS DETAILS */}
                        <div className="space-y-8">
                           <div className="bg-white border-[2.5px] border-black rounded-xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                              <div className="px-8 py-5 bg-[#F8FAFC] border-b-[2.5px] border-black flex justify-between items-center">
                                 <div className="flex items-center gap-3">
                                    <Calculator size={18} />
                                    <span className="text-[11px] font-black uppercase tracking-widest italic">Cấu trúc Giá vốn thực tế</span>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                       <span className="text-[9px] font-black text-black/40 uppercase uppercase">Tỉ lệ Hao hụt (%)</span>
                                       <div className="w-20">
                                          <NumericInput
                                             value={wasteRatio * 100}
                                             onChange={(val) => setWasteRatio(val / 100)}
                                             suffix="%"
                                             className="h-8 text-xs text-right !pr-8 border-black/20"
                                             hideWrapper
                                          />
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              <div className="p-8 space-y-6">
                                 <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-[#FAF7F2] border-[2px] border-black rounded-xl">
                                       <span className="text-sm font-black text-black">Tổng Vật tư (BOM Materials)</span>
                                       <span className="text-lg font-black italic">{formatVND(totalMaterialCost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-[#FAF7F2] border-[2px] border-black rounded-xl">
                                       <span className="text-sm font-black text-black">Tổng Nhân công (BOM Operations)</span>
                                       <span className="text-lg font-black italic">{formatVND(totalOperationCost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-rose-50 border-[2px] border-rose-300 border-dashed rounded-xl">
                                       <span className="text-sm font-black text-rose-700 italic">Hao hụt ước tính ({wasteRatio * 100}%)</span>
                                       <span className="text-lg font-black text-rose-700 italic">+{formatVND(wasteCost)}</span>
                                    </div>
                                 </div>

                                 <div className="pt-6 border-t-[2.5px] border-black/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                       <span className="text-[11px] font-black uppercase text-black/30">Chi phí bổ sung (Custom)</span>
                                       <button onClick={addCustomCost} className="text-xs font-black text-neo-purple uppercase italic flex items-center gap-1">
                                          <Plus size={14} /> Thêm chi phí
                                       </button>
                                    </div>
                                    <div className="space-y-3">
                                       {customCosts.map(c => (
                                          <div key={c.id} className="flex gap-4 items-center">
                                             <input
                                                value={c.name}
                                                onChange={(e) => updateCustomCost(c.id, 'name', e.target.value)}
                                                placeholder="Tên chi phí..."
                                                className="flex-1 h-10 bg-white border border-black/20 rounded px-3 text-xs outline-none focus:border-black"
                                             />
                                             <div className="w-32">
                                                <NumericInput
                                                   value={c.amount}
                                                   onChange={(val) => updateCustomCost(c.id, 'amount', val)}
                                                   className="h-10 text-xs text-right border-black/20"
                                                   hideWrapper
                                                />
                                             </div>
                                             <button onClick={() => removeCustomCost(c.id)} className="text-black/20 hover:text-neo-red">
                                                <Trash2 size={16} />
                                             </button>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              </div>

                              <div className="p-8 bg-black text-white flex justify-between items-center tabular-nums shadow-[0px_-4px_10px_0px_rgba(0,0,0,0.1)]">
                                 <div>
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Giá thành Sản xuất (COGS)</p>
                                    <p className="text-3xl font-black italic leading-none">{formatVND(totalCOGS)}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black text-neo-purple uppercase tracking-[0.2em] mb-1">Dành cho Master Record</p>
                                    <p className="text-xs font-black text-white/60 italic uppercase tracking-widest">Update via listing button</p>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* PRICE LISTING SUGGESTIONS */}
                        <div className="space-y-8">
                           <div className="w-full p-8 rounded-xl bg-white border-[2.5px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-8">
                              <h3 className="text-[11px] font-black uppercase tracking-widest italic flex items-center gap-2">
                                 <ArrowUpRight size={16} className="text-neo-purple" /> Khuyến nghị Niêm yết
                              </h3>

                              <div className="space-y-6">
                                 <div className="p-6 bg-[#FEF3C7] border-[2px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex justify-between items-center mb-4">
                                       <span className="text-[10px] font-black text-black/40 uppercase">Giá sỉ (130% COGS)</span>
                                       <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black rounded italic">Margin 30%</span>
                                    </div>
                                    <p className="text-3xl font-black text-black tabular-nums tracking-tighter italic">{formatVND(Math.round(totalCOGS * 1.3))}</p>
                                 </div>

                                 <div className="p-6 bg-[#D1FAE5] border-[2px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="flex justify-between items-center mb-4">
                                       <span className="text-[10px] font-black text-black/40 uppercase">Giá XK (240% COGS)</span>
                                       <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black rounded italic">Global Std</span>
                                    </div>
                                    <p className="text-3xl font-black text-black tabular-nums tracking-tighter italic">{formatVND(totalCOGS * 2.4)}</p>
                                 </div>
                              </div>

                              <div className="p-6 bg-[#F8FAFC] border-2 border-black border-dashed rounded-xl">
                                 <div className="flex items-center gap-3 text-neo-red mb-4">
                                    <Info size={16} />
                                    <span className="text-[10px] font-black uppercase">Chính sách niêm yết</span>
                                 </div>
                                 <p className="text-[11px] font-medium text-black/60 italic leading-relaxed">
                                    * Giá niêm yết khi được lưu sẽ cập nhật trực tiếp vào Master Data sản phẩm. Các báo giá cũ vẫn giữ nguyên Snapshot để đối soát lịch sử.
                                 </p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
