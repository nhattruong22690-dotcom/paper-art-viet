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
  ChevronDown,
  Package, 
  MapPin, 
  ChevronRight, 
  ShoppingBag,
  FileText,
  Printer,
  X,
  AlertCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createMaterialBatchInward, getMaterials } from '@/services/material.service';
import { getPurchaseOrders, getPOWithItems } from '@/services/purchase.service';
import { getSuppliers } from '@/services/supplier.service';
import { QRCodeSVG } from 'qrcode.react';
import { useNotification } from '@/context/NotificationContext';

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
  const { showToast, showModal } = useNotification();

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
    if (!selectedPartner) {
        showToast('warning', 'Vui lòng chọn đối tác giao hàng');
        return;
    }
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
      showToast('success', 'Đã hoàn thành nhập kho thành công!');
      
      const updatedPOs = await getPurchaseOrders({ status: 'ordered' });
      setPendingPOs(updatedPOs as any);
      
      setItems([{ id: '1', materialId: '', packingQty: 0, itemsPerPacking: 1, totalPrice: 0, location: '', note: '' }]);
      setSelectedPartner('');
      setSelectedPOId('');
    } catch (error) {
      console.error('Failed to save inward:', error);
      showModal('error', 'Không thể lưu nhập kho', (error as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-48">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Truck size={28} className="text-black" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-black tracking-tight uppercase italic">Ghi nhận Nhập xưởng</h1>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">Material Batch Inward & Warehouse Registration</p>
           </div>
        </div>

        <div className="bg-black text-white p-6 px-10 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(30,30,30,1)] flex items-center gap-8 group">
           <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-neo-purple mb-1">Total Batch Value</p>
              <p className="text-3xl font-black italic tabular-nums tracking-tighter text-white">
                {calculateTotal().toLocaleString()} <span className="text-xs uppercase opacity-40">đ</span>
              </p>
           </div>
           <div className="h-10 w-0.5 bg-neo-purple/20" />
           <ShoppingBag size={28} className="text-neo-purple" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar Config */}
        <div className="lg:col-span-1 space-y-8">
          <div className="neo-card space-y-8 bg-white">
             <div className="space-y-2">
                <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Ngày nhập kho</label>
                <div className="relative group/field">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                  <input 
                    type="date"
                    value={inwardDate}
                    onChange={(e) => setInwardDate(e.target.value)}
                    className="form-input pl-12 h-14 font-black"
                  />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Đơn mua hàng (PO)</label>
                <div className="relative group/field">
                  <FileText size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                  <select 
                    className="form-input pl-12 pr-10 h-14 appearance-none cursor-pointer text-[11px] font-black uppercase"
                    value={selectedPOId}
                    onChange={(e) => {
                      setSelectedPOId(e.target.value);
                      handleImportPO(e.target.value);
                    }}
                  >
                    <option value="">Lập phiếu tự do</option>
                    {pendingPOs.map(po => (
                      <option key={po.id} value={po.id}>{po.poNumber} • {po.supplier.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Đối tác / Nhà cung cấp</label>
                <div className="relative group/field">
                  <Truck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                  <select 
                    className="form-input pl-12 pr-10 h-14 appearance-none cursor-pointer text-[11px] font-black uppercase"
                    value={selectedPartner}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                  >
                    <option value="">Chọn đối tác giao hàng</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
                </div>
             </div>
          </div>
          
          <div className="p-6 bg-neo-yellow/10 border-2 border-black border-dashed rounded-xl flex items-start gap-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-pulse">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-black" />
            <p className="text-[10px] font-black leading-relaxed uppercase tracking-widest italic">
              Vui lòng kiểm duyệt kỹ quy cách và số thực nhận so với PO trước khi ký xác nhận nhập kho vĩnh viễn.
            </p>
          </div>
        </div>

        {/* Batch Ledger */}
        <div className="lg:col-span-3">
          <div className="neo-card !p-0 overflow-hidden flex flex-col min-h-[500px]">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                       <tr className="bg-black text-[10px] font-black text-neo-purple uppercase tracking-widest">
                          <th className="px-8 py-5 border-b-2 border-black">Vật tư / Mã hiệu</th>
                          <th className="px-4 py-5 text-center border-b-2 border-black w-32">Số Lượng</th>
                          <th className="px-4 py-5 text-center border-b-2 border-black w-24">/ Lô</th>
                          <th className="px-4 py-5 text-center border-b-2 border-black w-32">Thực nhận</th>
                          <th className="px-8 py-5 text-right border-b-2 border-black w-44">Thành Tiền</th>
                          <th className="px-4 py-5 text-center border-b-2 border-black w-32">Xếp kho</th>
                          <th className="px-8 py-5 w-16 text-center border-b-2 border-black"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black/5">
                       {items.map((item) => (
                          <tr key={item.id} className="hover:bg-neo-purple/5 transition-all group">
                             <td className="px-8 py-6">
                                <div className="space-y-2 min-w-[240px]">
                                   <div className="relative group/field">
                                      <select 
                                        value={item.materialId}
                                        onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                                        className="w-full bg-transparent border-b-2 border-black border-dashed focus:border-solid py-2 text-xs font-black text-black outline-none transition-all uppercase tracking-tight italic"
                                      >
                                        <option value="">Chọn vật tư...</option>
                                        {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
                                      </select>
                                   </div>
                                   {item.sku && <p className="text-[9px] font-black text-black/40 px-2 py-0.5 bg-neo-purple/10 rounded-lg border border-black/10 w-fit uppercase tracking-widest">{item.sku}</p>}
                                </div>
                             </td>
                             <td className="px-4 py-6">
                                <input 
                                  type="number"
                                  value={item.packingQty || ''}
                                  onChange={(e) => updateItem(item.id, 'packingQty', Number(e.target.value))}
                                  placeholder="0"
                                  className="form-input !h-10 text-center !px-2 font-black tabular-nums"
                                />
                             </td>
                             <td className="px-4 py-6">
                                <input 
                                  type="number"
                                  value={item.itemsPerPacking || ''}
                                  onChange={(e) => updateItem(item.id, 'itemsPerPacking', Number(e.target.value))}
                                  placeholder="1"
                                  className="form-input !h-10 text-center !px-2 font-black tabular-nums"
                                />
                             </td>
                             <td className="px-4 py-6">
                                <div className="flex flex-col items-center">
                                   <span className="text-xl font-black text-black tabular-nums tracking-tighter italic">
                                     {(item.packingQty * item.itemsPerPacking).toLocaleString()}
                                   </span>
                                   <span className="text-[9px] font-black text-black/40 mt-1 uppercase tracking-widest italic leading-none">
                                     {((item.packingQty * item.itemsPerPacking) > 0 
                                       ? (item.totalPrice / (item.packingQty * item.itemsPerPacking)) 
                                       : 0).toLocaleString()} <span className="text-[8px] opacity-60">đ/pc</span>
                                   </span>
                                </div>
                             </td>
                             <td className="px-8 py-6 text-right">
                                <input 
                                  type="number"
                                  value={item.totalPrice || ''}
                                  onChange={(e) => updateItem(item.id, 'totalPrice', Number(e.target.value))}
                                  className="form-input !h-10 text-right !px-4 font-black tabular-nums italic"
                                />
                             </td>
                             <td className="px-4 py-6">
                                <input 
                                  type="text"
                                  value={item.location}
                                  onChange={(e) => updateItem(item.id, 'location', e.target.value)}
                                  placeholder="VỊ TRÍ..."
                                  className="w-full bg-transparent border-b-2 border-black border-dashed focus:border-solid py-2 text-[10px] font-black text-black text-center outline-none transition-all uppercase tracking-widest placeholder:opacity-20"
                                />
                             </td>
                             <td className="px-8 py-6 text-center">
                                <button onClick={() => removeItem(item.id)} className="w-8 h-8 flex items-center justify-center text-black/20 hover:text-neo-red transition-all">
                                   <Trash2 size={18} strokeWidth={2.5} />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                </table>
             </div>
             
             <div className="p-8 bg-black/5 flex justify-center border-t-2 border-black border-dashed mt-auto">
                <button 
                  onClick={addItem}
                  className="w-full py-4 border-2 border-dashed border-black hover:border-solid hover:bg-white text-black/40 hover:text-black transition-all rounded-xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] active:translate-y-[2px]"
                >
                   <Plus size={20} strokeWidth={3} />
                   Thêm dòng vật tư mới
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-6xl px-12 z-[100]">
        <div className="bg-white/90 backdrop-blur-xl p-6 px-10 rounded-xl shadow-neo border-neo border-black flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="hidden lg:flex items-center gap-12">
             <div className="flex flex-col">
                <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1.5 leading-none">Hạng mục kê khai</p>
                <p className="text-3xl font-black text-black tracking-tight tabular-nums italic">{items.length} <span className="text-xs uppercase italic opacity-20 ml-2">Records</span></p>
             </div>
             <div className="flex items-center gap-4 py-2 px-1 text-black/40">
                <Info size={24} strokeWidth={3} />
                <p className="text-[10px] font-black max-w-[280px] leading-relaxed italic uppercase tracking-[0.2em] opacity-40">
                  Xác nhận vĩnh viễn quy trình nhập kho và đồng bộ tồn kho thực tế.
                </p>
             </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => window.print()}
              className="h-14 px-8 border-2 border-black rounded-xl text-black/60 hover:text-black hover:bg-black/5 transition-all font-black flex items-center justify-center gap-3 active:translate-x-[1px] active:translate-y-[1px] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none"
            >
              <Printer size={20} strokeWidth={3} /> 
              <span className="text-[10px] uppercase tracking-widest">In thẻ kho</span>
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting || !selectedPartner || items.some(i => !i.materialId || (i.packingQty * i.itemsPerPacking) <= 0)}
              className="btn-primary btn-confirm-flash !h-14 !px-12 text-sm uppercase tracking-[0.2em] flex items-center gap-4 flex-1 md:flex-none"
            >
               {isSubmitting ? (
                 <Loader2 className="animate-spin" size={24} />
               ) : (
                 <>
                   Xác nhận Nhập kho <CheckCircle2 size={24} strokeWidth={3} />
                 </>
               )}
            </button>
          </div>
        </div>
      </div>

      {/* Print labels (hidden usually) */}
      <div className="hidden print:block p-10 font-sans">
        <h2 className="text-center text-3xl font-black uppercase mb-12 pb-8 border-b-4 border-black tracking-[0.3em] italic underline underline-offset-8">WHA-INWARD LABEL • PAPER ART VIỆT</h2>
        <div className="grid grid-cols-3 gap-12">
          {items.filter(i => i.materialId && (i.packingQty * i.itemsPerPacking) > 0).map((item, idx) => (
            <div key={idx} className="border-4 border-black p-8 flex flex-col items-center gap-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[11px] font-black text-center h-12 overflow-hidden uppercase leading-tight tracking-widest italic">{item.name}</p>
              <div className="p-4 bg-white border-4 border-black rounded-2xl">
                <QRCodeSVG 
                  value={JSON.stringify({ sku: item.sku, loc: item.location, date: inwardDate })}
                  size={120} 
                  level="H"
                />
              </div>
              <p className="text-xl font-black tracking-[0.4em] uppercase bg-black text-white px-6 py-2 rounded-lg italic">{item.sku}</p>
              <div className="h-0.5 w-full bg-black/10" />
              <div className="flex justify-between w-full">
                <p className="text-[10px] font-black uppercase tracking-widest">ZONE: <span className="text-sm font-black italic">{item.location || '---'}</span></p>
                <p className="text-[10px] font-black uppercase tracking-widest leading-none">ID: <span className="text-sm font-black italic">#{idx+1}</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
