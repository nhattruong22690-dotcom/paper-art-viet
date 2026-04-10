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
import { getAllMaterials } from '@/services/material.service';
import { getAllOperations } from '@/services/operation.service';
import { useNotification } from "@/context/NotificationContext";
import { Cpu, Info, History } from 'lucide-react';
import { formatNumber, parseNumber } from '@/utils/format';
import { NumericInput } from '@/components/ui/NumericInput';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface BOMItem {
  materialId: string;
  material: {
    specification: string;
    type: string;
    unit: string;
    unitPrice: number;
    referencePrice: number;
    name?: string;
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
  unit: string | null;
  cogsConfig?: any;
  bomItems?: any[];
  bomOperations?: any[];
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: Product | null;
  mode?: 'create' | 'edit' | 'new_version';
}

// Internal SearchableSelect Component
function SearchableSelect({
  options,
  onSelect,
  placeholder,
  icon: Icon,
  disabledIds = []
}: {
  options: any[],
  onSelect: (opt: any) => void,
  placeholder: string,
  icon: any,
  disabledIds?: string[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter(opt => {
    const text = (opt.specification || opt.name || "").toLowerCase();
    const type = (opt.type || "").toLowerCase();
    return text.includes(search.toLowerCase()) || type.includes(search.toLowerCase());
  });

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-16 pl-16 pr-12 bg-white border-[2.5px] border-black rounded-xl appearance-none cursor-pointer font-black text-black tracking-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase text-left flex items-center"
      >
        <Icon className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20" size={24} />
        <span className={cn(search ? "text-black" : "text-black/40")}>
          {placeholder}
        </span>
        <ChevronDown size={24} strokeWidth={3} className="absolute right-6 top-1/2 -translate-y-1/2 text-black" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[300] bg-white border-[2.5px] border-black rounded-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col max-h-[400px]">
          <div className="p-4 border-b-2 border-black bg-neo-purple/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" size={16} />
              <input
                autoFocus
                type="text"
                placeholder="Tìm kiếm nhanh..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border-2 border-black rounded-lg text-sm font-bold focus:outline-none"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length > 0 ? (
              filtered.map((opt) => {
                const isDisabled = disabledIds.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      onSelect(opt);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "w-full px-6 py-4 text-left border-b border-black/5 hover:bg-black/5 transition-all flex flex-col",
                      isDisabled && "opacity-40 cursor-not-allowed grayscale"
                    )}
                  >
                    <span className="font-black text-xs uppercase italic">{opt.specification || opt.name}</span>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[9px] font-black text-black/40 uppercase tracking-tighter">
                        {opt.type || 'Standard'} • {opt.unit || 'Lần'}
                      </span>
                      <span className="text-[10px] font-black text-purple-600">{(opt.price || 0).toLocaleString()}đ</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-[10px] font-black uppercase text-black/20 italic tracking-widest">
                Không tìm thấy kết quả
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export default function ProductFormModal({ isOpen, onClose, onSubmit, initialData, mode = 'create' }: ProductFormModalProps) {
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
    unit: 'Sản phẩm'
  });

  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [bomOperations, setBomOperations] = useState<any[]>([]);
  const [allOperations, setAllOperations] = useState<any[]>([]);
  const [wasteRatio, setWasteRatio] = useState<number>(0.05);
  const [customCosts, setCustomCosts] = useState<any[]>([]);
  const [productionNotes, setProductionNotes] = useState<string[]>([]);
  const { showToast } = useNotification();

  useEffect(() => {
    if (isOpen) {
      loadMaterials();
      loadOperations();
      if (initialData) {
        setFormData({
          ...initialData,
          basePrice: Number(initialData.basePrice || 0),
          costPrice: Number(initialData.costPrice || 0),
          wholesalePrice: Number(initialData.wholesalePrice || 0),
          exportPrice: Number(initialData.exportPrice || 0),
        });
        if (initialData.bomItems) {
          setBomItems(initialData.bomItems.map(item => {
            const definedCustomPrice = initialData.cogsConfig?.customPrices?.[item.materialId];
            return {
              materialId: item.materialId,
              material: {
                specification: item.material.specification || item.material.name,
                type: item.material.type || item.material.sku,
                unit: item.material.unit,
                unitPrice: typeof definedCustomPrice === 'number' ? definedCustomPrice : Number(item.material.price || item.material.unitPrice || item.material.referencePrice || 0),
                referencePrice: Number(item.material.price || item.material.referencePrice || 0),
                name: item.material.specification || item.material.name,
                sku: item.material.type || item.material.sku
              },
              quantity: Number(item.quantity)
            };
          }));
        }
        if (initialData.bomOperations) {
          setBomOperations(initialData.bomOperations.map(op => {
            const definedCustomPrice = initialData.cogsConfig?.customPrices?.[op.operationId];
            return {
              ...op,
              operation: {
                ...op.operation,
                price: typeof definedCustomPrice === 'number' ? definedCustomPrice : Number(op.operation.price || 0)
              }
            };
          }));
        }
        if (initialData.cogsConfig) {
          setWasteRatio(initialData.cogsConfig.wasteRatio || 0.05);
          setCustomCosts(initialData.cogsConfig.customCosts || []);
          setProductionNotes(initialData.cogsConfig.productionNotes || []);
        }
      } else {
        // Default custom costs for new product
        setCustomCosts([
          { id: '1', name: 'Lắp ráp', details: 'Nhân công lắp ráp/đóng gói', amount: 0 },
          { id: '2', name: 'Laser/Điện', details: 'Vận hành máy móc', amount: 0 }
        ]);
        setProductionNotes([
          "Kiểm tra chất lượng keo dán.",
          "Đóng gói theo tiêu chuẩn xuất khẩu."
        ]);
      }
    }
  }, [initialData, isOpen]);

  const loadOperations = async () => {
    try {
      const data = await getAllOperations();
      setAllOperations(data);
    } catch (error) {
      console.error('Failed to load operations:', error);
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

  const handleUpdateQuantity = (materialId: string, qty: number) => {
    setBomItems(bomItems.map(item =>
      item.materialId === materialId ? { ...item, quantity: qty } : item
    ));
  };

  const handleRemoveMaterial = (materialId: string) => {
    setBomItems(bomItems.filter(item => item.materialId !== materialId));
  };

  const handleUpdateMaterialPrice = (materialId: string, price: number) => {
    setBomItems(bomItems.map(item =>
      item.materialId === materialId ? { ...item, material: { ...item.material, unitPrice: price } } : item
    ));
  };

  const handleAddOperation = (op: any) => {
    if (bomOperations.some(item => item.operationId === op.id)) return;
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

  const handleUpdateOperationPrice = (id: string, price: number) => {
    setBomOperations(bomOperations.map(op =>
      op.id === id ? { ...op, operation: { ...op.operation, price: price } } : op
    ));
  };

  const totalMaterialCost = bomItems.reduce((acc, item) => {
    const price = item.material.unitPrice || item.material.referencePrice || 0;
    return acc + (price * item.quantity);
  }, 0);

  const totalOperationCost = bomOperations.reduce((acc, op) => {
    return acc + (Number(op.operation.price || 0));
  }, 0);

  const wasteCost = (totalMaterialCost || 0) * (wasteRatio || 0);
  const customTotal = customCosts.reduce((acc, c) => acc + (Number(c.amount) || 0), 0);
  const totalCOGS = (totalMaterialCost || 0) + (totalOperationCost || 0) + wasteCost + customTotal;

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

      const customPrices: Record<string, number> = {};
      bomItems.forEach(item => {
        if (item.material.unitPrice !== item.material.referencePrice) {
          customPrices[item.materialId] = item.material.unitPrice;
        }
      });
      bomOperations.forEach(op => {
        customPrices[op.operationId] = op.operation.price; // or track reference price, but for now just save it
      });

      const payload = {
        ...formData,
        basePrice: calculatedBasePrice,
        wholesalePrice: calculatedWholesalePrice,
        exportPrice: calculatedExportPrice,
        cogsConfig: {
          wasteRatio,
          customCosts,
          productionNotes,
          customPrices, // Include overridden prices
          totalCOGS: calculatedBasePrice
        },
        bomItems: bomItems.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity
        })),
        bomOperations: bomOperations.map(op => ({
          operationId: op.operationId,
          sequence: op.sequence
        })),
        costPrice: totalCOGS
      };
      await onSubmit(payload);
      showToast('success', initialData ? 'Đã cập nhật sản phẩm' : 'Đã tạo sản phẩm mới');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'Thông tin chung', icon: Settings },
    { id: 'bom', label: 'Định mức Vật tư', icon: Layers, hidden: mode === 'edit' },
    { id: 'cogs', label: 'Tính toán Giá thành', icon: DollarSign, hidden: mode === 'edit' }
  ].filter(t => !t.hidden);

  return (
    <div className="fixed inset-0 lg:left-[var(--sidebar-width)] z-[500] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
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
                {mode === 'new_version' ? 'Tạo Phiên bản mới' : initialData ? 'Hiệu đính Sản phẩm' : 'Khai báo Sản phẩm'}
              </h3>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1">
                {mode === 'edit' ? 'Cập nhật thông tin Master' : 'Danh mục Master & Thông số Kỹ thuật'}
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
            <div className="space-y-10 animate-in fade-in duration-500 pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-10 items-start">

                {/* Left Column: Pricing & Time Metrics */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3 text-[11px] font-black text-black/20 uppercase tracking-[0.3em] pb-4 border-b-[2px] border-black/5 italic">
                    Chính sách giá & Vận hành
                  </div>

                  {/* Price Cards Stack */}
                  <div className="space-y-6">
                    {/* BASE PRICE */}
                    <div className="w-full p-6 rounded-xl bg-[#D8B4FE] border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-4 italic">Giá vốn Niêm yết</p>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <Calculator size={24} strokeWidth={3} className="text-black" />
                        </div>
                        <div className="flex-1">
                          <NumericInput
                            value={formData.basePrice}
                            onChange={val => setFormData({ ...formData, basePrice: val })}
                            className="bg-transparent border-none shadow-none text-4xl p-0 h-auto font-black italic tracking-tighter"
                            placeholder="0"
                          />
                          <span className="text-[10px] text-black uppercase font-black tracking-widest italic block mt-1">VNĐ / ĐƠN VỊ</span>
                        </div>
                      </div>
                    </div>

                    {/* WHOLESALE PRICE */}
                    <div className="w-full p-6 rounded-xl bg-[#FEF3C7] border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-4 italic">Giá bán sỉ (B2B)</p>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <Store size={24} strokeWidth={3} className="text-black" />
                        </div>
                        <div className="flex-1">
                          <NumericInput
                            value={formData.wholesalePrice}
                            onChange={val => setFormData({ ...formData, wholesalePrice: val })}
                            className="bg-transparent border-none shadow-none text-4xl p-0 h-auto font-black italic tracking-tighter"
                            placeholder="0"
                          />
                          <span className="text-[10px] text-black uppercase font-black tracking-widest italic block mt-1">GIÁ BÁN BUÔN</span>
                        </div>
                      </div>
                    </div>

                    {/* EXPORT PRICE */}
                    <div className="w-full p-6 rounded-xl bg-[#D1FAE5] border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-black text-black uppercase tracking-widest mb-4 italic">Giá xuất khẩu (INT)</p>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <Globe size={24} strokeWidth={3} className="text-black" />
                        </div>
                        <div className="flex-1">
                          <NumericInput
                            value={formData.exportPrice}
                            onChange={val => setFormData({ ...formData, exportPrice: val })}
                            className="bg-transparent border-none shadow-none text-4xl p-0 h-auto font-black italic tracking-tighter"
                            placeholder="0"
                          />
                          <span className="text-[10px] text-black uppercase font-black tracking-widest italic block mt-1">USD/EUR MAPPING</span>
                        </div>
                      </div>
                    </div>

                    {/* PRODUCTION TIME */}
                    <div className="w-full p-6 rounded-xl bg-white border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-4 italic">Sản xuất (Lead time)</p>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-black text-white rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] shrink-0">
                          <Clock size={24} strokeWidth={3} />
                        </div>
                        <div className="flex-1 border-b-[2.5px] border-black/10 focus-within:border-black transition-colors">
                          <input
                            type="number"
                            value={formData.productionTimeStd || ''}
                            onChange={e => setFormData({ ...formData, productionTimeStd: Number(e.target.value) })}
                            className="w-full text-4xl font-black text-black bg-transparent outline-none tabular-nums tracking-tighter italic"
                            placeholder="0"
                          />
                          <span className="text-[10px] text-black/40 font-black uppercase tracking-widest block mt-1 italic">Phút / SKU</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Identification & Preview */}
                <div className="flex flex-col h-full space-y-10 min-h-0">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-[11px] font-black text-black/20 uppercase tracking-[0.3em] pb-4 border-b-[2px] border-black/5 italic">
                      Định danh & Nhận diện
                    </div>

                    <div className="bg-white border-[2.5px] border-black rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 gap-8">
                      {/* ROW 1: FULL WIDTH NAME */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1 italic">Tên Sản phẩm</label>
                        <div className="relative group/field">
                          <Tag size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                          <input
                            required
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="form-input pl-16 h-20 bg-[#FAF7F2] focus:bg-white transition-colors text-xl font-black"
                            placeholder="Nhập tên sản phẩm chính thức..."
                          />
                        </div>
                      </div>

                      {/* ROW 2: SPLIT SKU & UNIT */}
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1 italic">Mã SKU</label>
                          <div className="relative group/field">
                            <Layers size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                            <input
                              required
                              type="text"
                              value={formData.sku || ''}
                              onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                              className="form-input pl-16 h-20 bg-neo-purple/10 border-solid text-black font-black tracking-widest text-center text-lg"
                              placeholder="MÃ-SP-001"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1 italic">Đơn vị (Unit)</label>
                          <div className="relative group/field">
                            <Package size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                            <input
                              required
                              type="text"
                              value={formData.unit || ''}
                              onChange={e => setFormData({ ...formData, unit: e.target.value })}
                              className="form-input pl-16 h-20 bg-[#F0FDF4] focus:bg-white transition-colors text-center font-black text-lg"
                              placeholder="Cái/Bộ..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center gap-3 text-[11px] font-black text-black/20 uppercase tracking-[0.3em] pb-4 border-b-[2px] border-black/5 italic shrink-0">
                      Mô phỏng Nhận diện
                    </div>

                    <div className="flex-1 bg-white border-[2.5px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden relative group min-h-[300px]">
                      <div className="absolute inset-0 bg-black/5 flex items-center justify-center group-hover:bg-transparent transition-all">
                        <Package size={120} strokeWidth={1} className="text-black opacity-10" />
                      </div>
                      <div className="text-center group-hover:scale-105 transition-transform duration-500">
                        <p className="text-[12px] font-black uppercase text-black/20 tracking-[0.5em] mb-3 italic">Image Placeholder (Full Height)</p>
                        <p className="text-[10px] font-bold text-black/10 uppercase tracking-widest">Master Studio Preview (Soon)</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: BOM */}
          {activeTab === 'bom' && (
            <div className="space-y-8 animate-in fade-in duration-500 h-full flex flex-col pb-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-[50]">
                <SearchableSelect
                  options={materials}
                  onSelect={handleAddMaterial}
                  placeholder="-- Phân bổ Vật tư --"
                  icon={Search}
                  disabledIds={bomItems.map(bi => bi.materialId)}
                />

                <SearchableSelect
                  options={allOperations}
                  onSelect={handleAddOperation}
                  placeholder="-- Thêm Công đoạn --"
                  icon={Cpu}
                  disabledIds={bomOperations.map(bo => bo.operationId)}
                />
              </div>

              <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 overflow-hidden min-h-0">
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
                              <p className="font-black text-black text-xs uppercase italic">{item.material.specification || item.material.name}</p>
                              <p className="text-[9px] text-black/40 font-black uppercase tracking-tighter mt-0.5">{item.material.type || item.material.sku || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 bg-white border border-black/20 rounded px-2 py-1">
                                <NumericInput
                                  value={item.quantity}
                                  onChange={(val) => handleUpdateQuantity(item.materialId, val)}
                                  className="w-16 bg-transparent text-center font-black text-black outline-none tabular-nums text-xs border-none p-0 !pl-0 !pr-0"
                                />
                                <span className="text-[9px] font-black text-black/30 uppercase">{item.material.unit}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-black/40 font-black italic text-xs">
                              <div className="w-[100px] ml-auto">
                                <NumericInput
                                  value={item.material.unitPrice}
                                  onChange={(val) => handleUpdateMaterialPrice(item.materialId, val)}
                                  className="w-full bg-white border border-black/20 rounded px-2 py-1 text-right font-black text-black outline-none tabular-nums text-xs !pl-2 !pr-2 shadow-none focus:border-neo-purple"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right tabular-nums text-black font-black italic text-sm">
                               {formatNumber(item.quantity * (item.material.unitPrice || 0))}đ
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
                        <div className="flex justify-between items-center bg-white border border-black/10 rounded-lg p-3">
                          <div className="flex flex-col w-[120px]">
                            <span className="text-[8px] font-black text-black/40 uppercase italic mb-1">Chi phí/SP (VNĐ)</span>
                            <NumericInput
                              value={op.operation.price}
                              onChange={(val) => handleUpdateOperationPrice(op.id, val)}
                              className="w-full bg-white border border-black/20 rounded px-2 py-1 text-left font-black text-black outline-none tabular-nums text-xs !pl-2 !pr-2 shadow-none focus:border-neo-purple"
                            />
                          </div>
                          <div className="flex flex-col items-end text-right">
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

              <div className="p-8 bg-black/5 border-[2.5px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-xl flex justify-between items-center mt-auto shrink-0">
                <div className="flex gap-12">
                  <div>
                    <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1 italic">Vật tư</p>
                    <p className="text-2xl font-black text-black italic tabular-nums">{formatNumber(totalMaterialCost)} <span className="text-[10px] not-italic text-black/30">VNĐ</span></p>
                  </div>
                  <div className="w-px h-full bg-black/10" />
                  <div>
                    <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1 italic">Gia công</p>
                    <p className="text-2xl font-black text-black italic tabular-nums">{formatNumber(totalOperationCost)} <span className="text-[10px] not-italic text-black/30">VNĐ</span></p>
                  </div>
                </div>
                <div className="badge-success flex items-center gap-2 px-6 py-4 h-auto shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                  <Calculator size={20} strokeWidth={3} />
                  <div className="text-left">
                    <p className="text-[8px] font-black uppercase italic opacity-50 leading-none">Tổng BOM Sản xuất</p>
                    <p className="text-lg font-black italic tabular-nums leading-none mt-1">{formatNumber(totalMaterialCost + totalOperationCost)} VNĐ</p>
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
                      {formatNumber(Math.round(totalCOGS))} <span className="text-2xl font-black text-white ml-2 uppercase">VNĐ/SP</span>
                    </h3>
                  </div>
                  <div className="relative z-10 flex gap-10 pt-8 border-t-2 border-white/10">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1.5 font-space">Vật tư Trực tiếp</span>
                      <span className="text-lg font-black text-white italic">{formatNumber(totalMaterialCost)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1.5 font-space">Vận hành & Chi phí chung</span>
                      <span className="text-lg font-black text-white italic">{formatNumber(wasteCost + customTotal)}</span>
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
                        <th className="px-8 py-4 text-right w-48 border-b-neo border-black">Số tiền (VNĐ)</th>
                        <th className="px-8 py-4 w-12 border-b-neo border-black"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {/* Row: Direct Materials (BOM) */}
                      <tr className="bg-neo-purple/5">
                        <td className="px-6 py-4">
                          <span className="font-black text-black italic text-sm">Định mức vật tư (BOM)</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-black/60 font-medium text-xs">Theo định mức nguyên vật liệu BOM</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative group/input max-w-[180px] ml-auto">
                            <div className="w-full h-12 bg-black/5 border-[2px] border-black/10 rounded-xl px-4 flex items-center justify-end font-black text-black/40 tabular-nums text-base italic">
                              {formatNumber(totalMaterialCost)}
                            </div>
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-black/20 uppercase pointer-events-none">VNĐ</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"></td>
                      </tr>

                      {/* Row: Waste Contingency */}
                      <tr className="bg-neo-yellow/5">
                        <td className="px-6 py-4">
                          <span className="font-black text-black italic text-sm">Hao hụt & Dự phòng</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-black/60 font-medium text-xs">{Math.round(wasteRatio * 100)}% trên tổng vật tư</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative group/input max-w-[180px] ml-auto">
                            <div className="w-full h-12 bg-black/5 border-[2px] border-black/10 rounded-xl px-4 flex items-center justify-end font-black text-black/40 tabular-nums text-base italic">
                              {formatNumber(wasteCost)}
                            </div>
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-black/20 uppercase pointer-events-none">VNĐ</span>
                          </div>
                        </td>
                        <td className="px-6 py-4"></td>
                      </tr>
                      {customCosts.map(cost => (
                        <tr key={cost.id} className="group hover:bg-black/5 transition-all">
                          <td className="px-6 py-4">
                            <input
                              value={cost.name}
                              onChange={(e) => updateCustomCost(cost.id, 'name', e.target.value)}
                              className="w-full bg-transparent font-black text-black outline-none text-sm italic"
                              placeholder="VD: Nhân công..."
                            />
                          </td>
                          <td className="px-6 py-4">
                            <input
                              value={cost.details}
                              onChange={(e) => updateCustomCost(cost.id, 'details', e.target.value)}
                              className="w-full bg-transparent text-black/60 font-medium outline-none text-xs"
                              placeholder="Mô tả công việc..."
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <NumericInput
                              value={cost.amount}
                              onChange={val => updateCustomCost(cost.id, 'amount', val)}
                              className="h-12 bg-white border-[2.5px] border-black rounded-xl pl-10 pr-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:border-neo-purple"
                              suffix="VNĐ"
                            />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button onClick={() => setCustomCosts(customCosts.filter(c => c.id !== cost.id))} className="w-10 h-10 flex items-center justify-center bg-[#FEE2E2] border-[2.5px] border-black rounded-xl text-black hover:bg-rose-500 hover:text-white transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ml-auto">
                              <Trash2 size={14} />
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
