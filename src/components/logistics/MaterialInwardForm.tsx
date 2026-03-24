"use client";

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  Truck, 
  Calendar, 
  CheckCircle2, 
  Loader2,
  Copy,
  ChevronDown,
  Tag,
  Package, 
  MapPin, 
  ChevronRight, 
  Filter, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createMaterialBatchInward, getMaterials } from '@/services/material.service';
import { getPurchaseOrders, getPOWithItems } from '@/services/purchase.service';
import { getSuppliers } from '@/services/supplier.service';
import { QRCodeSVG } from 'qrcode.react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Partner {
  id: string;
  name: string;
}

interface Material {
  id: string;
  sku: string;
  name: string;
  referencePrice: number;
}

interface InwardItem {
  id: string;
  materialId: string;
  sku?: string;
  name?: string;
  packingQty: number;
  itemsPerPacking: number;
  totalPrice: number;
  location: string;
  note: string;
  poItemId?: string;
  expectedPrice?: number;
}

export default function MaterialInwardForm() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [pendingPOs, setPendingPOs] = useState<any[]>([]);
  const [selectedPOId, setSelectedPOId] = useState('');
  const [selectedPartner, setSelectedPartner] = useState('');
  const [inwardDate, setInwardDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<InwardItem[]>([
    { id: '1', materialId: '', packingQty: 0, itemsPerPacking: 1, totalPrice: 0, location: '', note: '' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [mats, supps, pos] = await Promise.all([
          getMaterials({}),
          getSuppliers(),
          getPurchaseOrders({ status: 'ordered' })
        ]);

        setMaterials(mats.map((m: any) => ({
          id: m.id,
          sku: m.sku,
          name: m.name,
          referencePrice: Number(m.referencePrice || 0)
        })));
        
        setPartners(supps as any);
        setPendingPOs(pos as any);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), materialId: '', packingQty: 0, itemsPerPacking: 1, totalPrice: 0, location: '', note: '' }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InwardItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'materialId') {
          const m = materials.find(mat => mat.id === value);
          return { ...item, [field]: value, sku: m?.sku, name: m?.name };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const copyItem = (item: InwardItem) => {
    setItems([...items, { ...item, id: Math.random().toString(36).substr(2, 9) }]);
  };

  const handleImportPO = async (poId: string) => {
    if (!poId) {
      setItems([{ id: '1', materialId: '', packingQty: 0, itemsPerPacking: 1, totalPrice: 0, location: '', note: '' }]);
      setSelectedPartner('');
      return;
    }
    try {
      const po = await getPOWithItems(poId);
      if (!po) return;

      setSelectedPartner(po.supplierId);
      const inwardItems: InwardItem[] = po.items.map((pItem: any) => {
        const remaining = Number(pItem.quantityOrdered) - Number(pItem.quantityReceived);
        return {
          id: Math.random().toString(36).substr(2, 9),
          materialId: pItem.materialId,
          sku: pItem.material.sku,
          name: pItem.material.name,
          packingQty: remaining > 0 ? remaining : 0,
          itemsPerPacking: 1,
          totalPrice: remaining > 0 ? (remaining * Number(pItem.expectedPrice)) : 0,
          location: '',
          note: `Nhập cho PO ${po.poNumber}`,
          poItemId: pItem.id,
          expectedPrice: Number(pItem.expectedPrice)
        };
      });
      setItems(inwardItems.length > 0 ? inwardItems : [{ id: '1', materialId: '', packingQty: 0, itemsPerPacking: 1, totalPrice: 0, location: '', note: '' }]);
    } catch (error) {
      console.error("Failed to load PO details:", error);
    }
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + Number(item.totalPrice || 0), 0);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await createMaterialBatchInward({
        partnerId: selectedPartner,
        items: items.map(item => ({
          materialId: item.materialId,
          sku: item.sku || '',
          quantity: item.packingQty * item.itemsPerPacking,
          price: (item.packingQty * item.itemsPerPacking) > 0 
            ? item.totalPrice / (item.packingQty * item.itemsPerPacking) 
            : 0,
          location: item.location,
          note: item.note,
          poItemId: item.poItemId
        }))
      });
      alert('Đã hoàn thành nhập kho thành công!');
      
      const updatedPOs = await getPurchaseOrders({ status: 'ordered' });
      setPendingPOs(updatedPOs as any);
      
      setItems([{ id: '1', materialId: '', packingQty: 0, itemsPerPacking: 1, totalPrice: 0, location: '', note: '' }]);
      setSelectedPartner('');
      setSelectedPOId('');
    } catch (error) {
      console.error('Failed to save inward:', error);
      alert('Có lỗi xảy ra khi lưu nhập kho.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700 pb-32">
      {/* HEADER SECTION */}
      <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-2xl shadow-gray-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-emerald-600 rounded-[28px] flex items-center justify-center text-white shadow-xl shadow-emerald-100">
              <Truck size={32} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                Phiếu <span className="text-emerald-600">Nhập kho</span> Vật tư
              </h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ghi nhận vật tư mới theo Lô hàng (Batch Tracking)</p>
           </div>
        </div>

        <div className="flex gap-4">
           <div className="bg-gray-50 px-8 py-4 rounded-[32px] border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic text-center">Tổng giá trị hóa đơn</p>
              <p className="text-2xl font-black text-emerald-600 italic tracking-tighter text-center">
                {calculateTotal().toLocaleString()}đ
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR CONFIG */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/30 space-y-8">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                   <Calendar size={12} className="text-emerald-500" /> Ngày nhập hàng
                </label>
                <input 
                  type="date"
                  value={inwardDate}
                  onChange={(e) => setInwardDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-xs font-black text-gray-800 focus:bg-white focus:border-emerald-200 outline-none transition-all uppercase tracking-tighter"
                />
             </div>

             <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                 <ShoppingBag size={12} className="text-indigo-500" />
                 Nhập theo Đơn mua hàng (PO)
               </label>
               <div className="relative group">
                 <select 
                   className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[28px] text-xs font-bold focus:outline-none focus:border-indigo-500 appearance-none shadow-sm transition-all"
                   value={selectedPOId}
                   onChange={(e) => {
                     setSelectedPOId(e.target.value);
                     handleImportPO(e.target.value);
                   }}
                 >
                   <option value="">Lập phiếu nhập tự do...</option>
                   {pendingPOs.map(po => (
                     <option key={po.id} value={po.id}>{po.poNumber} - {po.supplier.name}</option>
                   ))}
                 </select>
                 <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:translate-x-1 transition-transform pointer-events-none" />
               </div>
             </div>

             <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 flex items-center gap-2">
                 <MapPin size={12} className="text-emerald-500" />
                 Đối tác giao hàng
               </label>
               <div className="relative group">
                 <select 
                   className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-[28px] text-xs font-bold focus:outline-none focus:border-emerald-500 appearance-none shadow-sm transition-all"
                   value={selectedPartner}
                   onChange={(e) => setSelectedPartner(e.target.value)}
                 >
                   <option value="">Chọn đối tác...</option>
                   {partners.map(p => (
                     <option key={p.id} value={p.id}>{p.name}</option>
                   ))}
                 </select>
                 <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:translate-x-1 transition-transform pointer-events-none" />
               </div>
             </div>
          </div>
        </div>

        {/* BATCH EDIT TABLE */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-[44px] border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                          <th className="px-8 py-6 min-w-[200px]">Vật tư / SKU</th>
                          <th className="px-4 py-6 text-center w-24">Số Lượng ĐG</th>
                          <th className="px-4 py-6 text-center w-24">Quy cách ĐG</th>
                          <th className="px-4 py-6 text-center w-28">Tổng lượng</th>
                          <th className="px-6 py-6 text-right w-40 bg-emerald-50/30">Tổng Tiền (VNĐ)</th>
                          <th className="px-4 py-6 text-center w-24 text-blue-500 italic">Giá PO</th>
                          <th className="px-6 py-6 w-32">Vị Trí Kho</th>
                          <th className="px-8 py-6 w-16"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {items.map((item) => (
                          <tr key={item.id} className="hover:bg-emerald-50/10 transition-colors group">
                             <td className="px-8 py-5">
                                <div className="space-y-1">
                                   <select 
                                     value={item.materialId}
                                     onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                                     className="w-full bg-transparent border-b-2 border-gray-100 focus:border-emerald-500 py-1 text-xs font-black text-gray-800 outline-none appearance-none transition-all uppercase tracking-tighter"
                                   >
                                     <option value="">--- Chọn Vật Tư ---</option>
                                     {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
                                   </select>
                                   {item.sku && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.sku}</p>}
                                </div>
                             </td>
                             <td className="px-4 py-5">
                                <input 
                                  type="number"
                                  value={item.packingQty || ''}
                                  onChange={(e) => updateItem(item.id, 'packingQty', Number(e.target.value))}
                                  placeholder="Thùng"
                                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-center text-xs font-black text-gray-800 focus:bg-white focus:border-emerald-200 outline-none transition-all italic"
                                />
                             </td>
                             <td className="px-4 py-5">
                                <input 
                                  type="number"
                                  value={item.itemsPerPacking || ''}
                                  onChange={(e) => updateItem(item.id, 'itemsPerPacking', Number(e.target.value))}
                                  placeholder="Cái/Thùng"
                                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-center text-xs font-black text-gray-800 focus:bg-white focus:border-emerald-200 outline-none transition-all italic"
                                />
                             </td>
                             <td className="px-4 py-5 text-center">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-gray-800 tabular-nums">
                                    {(item.packingQty * item.itemsPerPacking).toLocaleString()}
                                  </span>
                                  <span className="text-[9px] font-bold text-gray-400 italic">
                                    {((item.packingQty * item.itemsPerPacking) > 0 
                                      ? (item.totalPrice / (item.packingQty * item.itemsPerPacking)) 
                                      : 0).toLocaleString()}đ/đv
                                  </span>
                                </div>
                             </td>
                             <td className="px-6 py-5 bg-emerald-50/10">
                                <input 
                                  type="number"
                                  value={item.totalPrice || ''}
                                  onChange={(e) => updateItem(item.id, 'totalPrice', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-transparent border-b border-emerald-100 text-right px-1 py-1 text-xs font-black text-emerald-600 focus:border-emerald-500 outline-none transition-all italic"
                                />
                             </td>
                             <td className="px-4 py-5 text-center text-[10px] font-black text-blue-500 italic">
                                {item.expectedPrice ? item.expectedPrice.toLocaleString() + 'đ' : '--'}
                             </td>
                             <td className="px-6 py-5">
                                <input 
                                  type="text"
                                  value={item.location}
                                  onChange={(e) => updateItem(item.id, 'location', e.target.value)}
                                  placeholder="Vị trí"
                                  className="w-full bg-transparent border-b border-gray-100 focus:border-emerald-200 py-1 text-[10px] font-black text-gray-800 outline-none transition-all uppercase tracking-tighter"
                                />
                             </td>
                             <td className="px-8 py-5 text-right">
                                <button onClick={() => removeItem(item.id)} className="p-2 text-gray-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                   <Trash2 size={14} />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                </table>
             </div>
             
             <div className="p-8 bg-gray-50/30 border-t border-gray-100">
                <button 
                  onClick={addItem}
                  className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-white transition-all text-[11px] font-black uppercase tracking-widest group"
                >
                   <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                   Thêm dòng vật tư mới
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-50">
        <div className="bg-white/90 backdrop-blur-2xl border border-white/20 p-4 rounded-[40px] shadow-2xl flex items-center justify-between gap-6 ring-1 ring-black/5">
          <div className="flex items-center gap-4 ml-4">
             <div className="flex flex-col">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng vật tư</p>
                <p className="text-lg font-black text-gray-900">{items.length} Hạng mục</p>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.print()}
              className="px-8 py-4 rounded-3xl bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg flex items-center gap-3 active:scale-95"
            >
              <Tag size={16} /> In Mã QR
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting || !selectedPartner || items.some(i => !i.materialId || i.packingQty <= 0)}
              className={cn(
                "px-10 py-5 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-3",
                isSubmitting || !selectedPartner || items.some(i => !i.materialId || i.packingQty <= 0)
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100"
              )}
            >
               {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
               Xác nhận Nhập kho
            </button>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY SECTION */}
      <div className="hidden print:block">
        <div className="grid grid-cols-3 gap-6">
          {items.filter(i => i.materialId).map((item, idx) => (
            <div key={idx} className="border border-gray-300 p-4 rounded-xl flex flex-col items-center">
              <p className="text-[10px] font-bold uppercase mb-2">{item.name}</p>
              <QRCodeSVG 
                value={JSON.stringify({ sku: item.sku, loc: item.location, date: inwardDate })}
                size={80} 
              />
              <p className="text-[9px] font-mono mt-2">{item.sku}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
