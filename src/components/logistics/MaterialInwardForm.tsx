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
  ArrowRight,
  FileText,
  Printer
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
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-1000 pb-40">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-2 border-retro-sepia/10 pb-10">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-retro-sepia border-2 border-retro-sepia flex items-center justify-center text-retro-paper rotate-3 shadow-xl transform hover:rotate-0 transition-transform cursor-pointer">
              <Truck size={40} strokeWidth={1.5} />
           </div>
           <div>
              <h1 className="text-4xl font-typewriter font-black text-retro-sepia tracking-tighter uppercase italic mb-2">
                Hòa đơn <span className="text-retro-brick underline decoration-double decoration-1 underline-offset-8">Nhập kho</span>
              </h1>
              <p className="font-handwriting text-xl text-retro-earth flex items-center gap-2">
                <FileText size={20} strokeWidth={1.5} /> Nhật giám lô hàng nguyên vật liệu xưởng
              </p>
           </div>
        </div>

        <div className="retro-card !bg-retro-sepia text-retro-paper !p-6 transform -rotate-2">
           <p className="font-typewriter text-[10px] uppercase font-black tracking-widest mb-1 opacity-60">Thống kê giá trị</p>
           <p className="text-3xl font-typewriter font-black italic tracking-tighter tabular-nums">
             {calculateTotal().toLocaleString()} <span className="text-sm">đ</span>
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* SIDEBAR CONFIG */}
        <div className="lg:col-span-1 space-y-8">
          <div className="retro-card !bg-retro-paper relative isolate">
             <div className="washi-tape-top" />
             <div className="space-y-8 mt-6">
                <div className="space-y-3">
                   <label className="font-typewriter text-[11px] font-black text-retro-sepia uppercase tracking-widest flex items-center gap-2">
                      <Calendar size={14} className="text-retro-brick" /> Ngày nhập kho
                   </label>
                   <input 
                     type="date"
                     value={inwardDate}
                     onChange={(e) => setInwardDate(e.target.value)}
                     className="w-full bg-white/50 border-2 border-retro-sepia/10 px-5 py-4 font-typewriter text-xs font-bold text-retro-sepia outline-none focus:border-retro-sepia focus:bg-white transition-all uppercase tracking-tighter"
                   />
                </div>

                <div className="space-y-3">
                  <label className="font-typewriter text-[11px] font-black text-retro-sepia uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag size={14} className="text-retro-brick" />
                    Chỉ định Đơn hàng (PO)
                  </label>
                  <div className="relative group">
                    <select 
                      className="w-full px-5 py-4 bg-white/50 border-2 border-retro-sepia/10 font-typewriter text-[11px] font-bold text-retro-sepia outline-none focus:border-retro-sepia focus:bg-white appearance-none transition-all"
                      value={selectedPOId}
                      onChange={(e) => {
                        setSelectedPOId(e.target.value);
                        handleImportPO(e.target.value);
                      }}
                    >
                      <option value="">Lập phiếu tự do</option>
                      {pendingPOs.map(po => (
                        <option key={po.id} value={po.id}>{po.poNumber} - {po.supplier.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-retro-sepia/30 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="font-typewriter text-[11px] font-black text-retro-sepia uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={14} className="text-retro-brick" />
                    Nguồn hàng / Đối tác
                  </label>
                  <div className="relative group">
                    <select 
                      className="w-full px-5 py-4 bg-white/50 border-2 border-retro-sepia/10 font-typewriter text-[11px] font-bold text-retro-sepia outline-none focus:border-retro-sepia focus:bg-white appearance-none transition-all"
                      value={selectedPartner}
                      onChange={(e) => setSelectedPartner(e.target.value)}
                    >
                      <option value="">Chọn đối tác giao</option>
                      {partners.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-retro-sepia/30 pointer-events-none" />
                  </div>
                </div>
             </div>
          </div>
          
          <div className="p-6 border-2 border-dashed border-retro-sepia/10 text-retro-earth italic font-handwriting text-lg text-center">
            * Cẩn thận kiểm tra quy cách đóng gói trước khi ký nhận hồ sơ.
          </div>
        </div>

        {/* BATCH LEDGER */}
        <div className="lg:col-span-3">
          <div className="retro-card !p-0 !bg-white overflow-hidden border-2">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-retro-sepia text-retro-paper text-[11px] font-black uppercase tracking-widest border-b border-retro-sepia font-typewriter">
                          <th className="px-8 py-6 min-w-[200px]">Sản phẩm / Mã hiệu</th>
                          <th className="px-4 py-6 text-center w-24">Số Lượng</th>
                          <th className="px-4 py-6 text-center w-24">Quy cách</th>
                          <th className="px-4 py-6 text-center w-28">Thực nhận</th>
                          <th className="px-6 py-6 text-right w-40 bg-white/10 italic">Tổng Thành Tiền</th>
                          <th className="px-4 py-6 text-center w-24 text-retro-mustard italic">Giá PO</th>
                          <th className="px-6 py-6 w-32">Vị Trí</th>
                          <th className="px-8 py-6 w-16"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-retro-sepia/5">
                       {items.map((item) => (
                          <tr key={item.id} className="hover:bg-retro-paper/20 transition-all font-serif italic">
                             <td className="px-8 py-6">
                                <div className="space-y-2">
                                   <select 
                                     value={item.materialId}
                                     onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                                     className="w-full bg-transparent border-b-2 border-retro-sepia/10 focus:border-retro-brick py-1 text-[13px] font-black text-retro-sepia outline-none appearance-none transition-all uppercase tracking-tighter not-italic"
                                   >
                                     <option value="">Chọn vật tư...</option>
                                     {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
                                   </select>
                                   {item.sku && <p className="font-typewriter text-[10px] font-bold text-retro-earth uppercase tracking-widest opacity-60 px-1">{item.sku}</p>}
                                </div>
                             </td>
                             <td className="px-4 py-6">
                                <input 
                                  type="number"
                                  value={item.packingQty || ''}
                                  onChange={(e) => updateItem(item.id, 'packingQty', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-retro-paper/30 border border-retro-sepia/5 px-3 py-2 text-center font-typewriter text-xs font-black text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all italic"
                                />
                             </td>
                             <td className="px-4 py-6">
                                <input 
                                  type="number"
                                  value={item.itemsPerPacking || ''}
                                  onChange={(e) => updateItem(item.id, 'itemsPerPacking', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-retro-paper/30 border border-retro-sepia/5 px-3 py-2 text-center font-typewriter text-xs font-black text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all italic"
                                />
                             </td>
                             <td className="px-4 py-6 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-typewriter font-black text-retro-sepia tabular-nums not-italic">
                                    {(item.packingQty * item.itemsPerPacking).toLocaleString()}
                                  </span>
                                  <span className="font-handwriting text-[12px] text-retro-earth mt-1">
                                    {((item.packingQty * item.itemsPerPacking) > 0 
                                      ? (item.totalPrice / (item.packingQty * item.itemsPerPacking)) 
                                      : 0).toLocaleString()} <span className="text-[9px]">đ/c</span>
                                  </span>
                                </div>
                             </td>
                             <td className="px-6 py-6 bg-retro-paper/10">
                                <input 
                                  type="number"
                                  value={item.totalPrice || ''}
                                  onChange={(e) => updateItem(item.id, 'totalPrice', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-transparent border-b border-retro-sepia/20 text-right px-1 py-1 font-typewriter text-sm font-black text-retro-brick focus:border-retro-sepia outline-none transition-all italic placeholder:opacity-20"
                                />
                             </td>
                             <td className="px-4 py-6 text-center font-typewriter text-[10px] font-black text-retro-moss italic opacity-70">
                                {item.expectedPrice ? item.expectedPrice.toLocaleString() : '--'}
                             </td>
                             <td className="px-6 py-6">
                                <input 
                                  type="text"
                                  value={item.location}
                                  onChange={(e) => updateItem(item.id, 'location', e.target.value)}
                                  placeholder="Hàng A..."
                                  className="w-full bg-transparent border-b border-retro-sepia/10 focus:border-retro-sepia py-1 font-typewriter text-[10px] font-black text-retro-sepia outline-none transition-all uppercase tracking-tighter"
                                />
                             </td>
                             <td className="px-8 py-6 text-right">
                                <button onClick={() => removeItem(item.id)} className="p-2 text-retro-earth/20 hover:text-retro-brick hover:bg-retro-brick/5 transition-all">
                                   <Trash2 size={16} strokeWidth={1.5} />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                </table>
             </div>
             
             <div className="p-8 bg-retro-paper/20">
                <button 
                  onClick={addItem}
                  className="w-full py-5 border-2 border-dashed border-retro-sepia/20 bg-white/50 flex items-center justify-center gap-3 text-retro-sepia/40 hover:text-retro-sepia hover:bg-white transition-all font-typewriter text-[11px] font-black uppercase tracking-widest group"
                >
                   <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                   Ghi thêm hạng mục mới vào sổ
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* STICKY CONTROL PANEL */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-8 z-50">
        <div className="bg-white/80 backdrop-blur-3xl border-2 border-retro-sepia p-5 shadow-2xl flex items-center justify-between gap-10 ring-4 ring-white/50">
          <div className="flex items-center gap-6 ml-6">
             <div className="flex flex-col border-r-2 border-retro-sepia/10 pr-10">
                <p className="font-typewriter text-[10px] font-black text-retro-earth uppercase tracking-widest opacity-50">Tổng số hạng mục</p>
                <p className="text-2xl font-typewriter font-black text-retro-sepia tracking-tighter uppercase italic">{items.length} <span className="text-sm">Bản ghi</span></p>
             </div>
             <p className="font-handwriting text-lg text-retro-earth max-w-[180px] leading-tight">Vui lòng kiểm duyệt kỹ trước khi niêm phong hồ sơ.</p>
          </div>

          <div className="flex items-center gap-5">
            <button 
              onClick={() => window.print()}
              className="px-6 py-4 bg-retro-paper border-2 border-retro-sepia text-retro-sepia font-typewriter text-[11px] font-black uppercase tracking-widest hover:bg-retro-sepia hover:text-white transition-all flex items-center gap-3 active:scale-95 shadow-[4px_4px_0px_#3E272333]"
            >
              <Printer size={18} strokeWidth={1.5} /> In mã QR
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting || !selectedPartner || items.some(i => !i.materialId || i.packingQty <= 0)}
              className={cn(
                "retro-btn px-10 py-5 bg-retro-brick text-white min-w-[240px]",
                (isSubmitting || !selectedPartner || items.some(i => !i.materialId || i.packingQty <= 0)) && "opacity-50 grayscale cursor-not-allowed shadow-none"
              )}
            >
               {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
               Ký nhận và Nhập kho
            </button>
          </div>
        </div>
      </div>

      {/* QR PRINT SECTION (LEDGER STYLE) */}
      <div className="hidden print:block font-typewriter">
        <h2 className="text-center text-xl font-black uppercase mb-10 border-b-2 border-black pb-4">Tem nhãn Lô hàng - Paper Art Việt</h2>
        <div className="grid grid-cols-4 gap-6">
          {items.filter(i => i.materialId).map((item, idx) => (
            <div key={idx} className="border-2 border-black p-4 flex flex-col items-center">
              <p className="text-[9px] font-black uppercase mb-2 text-center h-8 overflow-hidden">{item.name}</p>
              <QRCodeSVG 
                value={JSON.stringify({ sku: item.sku, loc: item.location, date: inwardDate })}
                size={70} 
              />
              <p className="text-[10px] font-black mt-3 italic tracking-widest">{item.sku}</p>
              <p className="text-[8px] font-bold mt-1 uppercase">LOC: {item.location || 'N/A'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
