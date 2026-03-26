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
  AlertCircle
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-40">
      {/* Header Section */}
      <div className="card !flex-col md:!flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg">
              <Truck size={24} />
           </div>
           <div>
              <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                <Package size={12} />
                <span>Kho vận</span>
                <ChevronRight size={10} />
                <span className="text-primary">Phiếu nhập kho</span>
              </nav>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Ghi nhận vật tư nhập xưởng
              </h1>
           </div>
        </div>

        <div className="card !bg-primary text-white !p-4 !px-6 border-none shadow-xl flex items-center gap-6">
           <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tổng giá trị lô hàng</p>
              <p className="text-2xl font-black tabular-nums">
                {calculateTotal().toLocaleString()} <span className="text-xs">đ</span>
              </p>
           </div>
           <div className="h-10 w-px bg-white/20" />
           <FileText size={24} className="opacity-40" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Config */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card space-y-6 !p-6">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Ngày nhập kho</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={inwardDate}
                    onChange={(e) => setInwardDate(e.target.value)}
                    className="form-input pl-10"
                  />
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Đơn mua hàng (PO)</label>
                <div className="relative">
                  <select 
                    className="form-input appearance-none"
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
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Đối tác / Nhà cung cấp</label>
                <div className="relative">
                  <select 
                    className="form-input appearance-none"
                    value={selectedPartner}
                    onChange={(e) => setSelectedPartner(e.target.value)}
                  >
                    <option value="">Chọn đối tác giao hàng</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
             </div>
          </div>
          
          <div className="p-5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">
              Vui lòng kiểm duyệt kỹ quy cách và số thực nhận so với PO trước khi ký xác nhận nhập kho.
            </p>
          </div>
        </div>

        {/* Batch Ledger */}
        <div className="lg:col-span-3">
          <div className="card !p-0 overflow-hidden shadow-sm">
             <div className="overflow-x-auto">
                <table className="w-full text-left !mt-0">
                    <thead>
                       <tr className="bg-gray-50 border-b border-border">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">Vật tư / Mã hiệu</th>
                          <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider w-24">Số Lượng</th>
                          <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider w-24">Quy cách</th>
                          <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider w-28">Thực nhận</th>
                          <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-wider w-40">Thành Tiền</th>
                          <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider w-28">Xếp kho</th>
                          <th className="px-6 py-4 w-16"></th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                       {items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 transition-all group">
                             <td className="px-6 py-4">
                                <div className="space-y-1 min-w-[200px]">
                                   <select 
                                     value={item.materialId}
                                     onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                                     className="w-full bg-transparent border-b border-border focus:border-primary py-1 text-sm font-bold text-foreground outline-none transition-all"
                                   >
                                     <option value="">Chọn vật tư...</option>
                                     {materials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.sku})</option>)}
                                   </select>
                                   {item.sku && <p className="text-[10px] font-bold text-primary px-1 uppercase tracking-wider">{item.sku}</p>}
                                </div>
                             </td>
                             <td className="px-4 py-4">
                                <input 
                                  type="number"
                                  value={item.packingQty || ''}
                                  onChange={(e) => updateItem(item.id, 'packingQty', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-gray-50 border border-border rounded-lg px-2 py-2 text-center text-sm font-bold focus:bg-white focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                />
                             </td>
                             <td className="px-4 py-4">
                                <input 
                                  type="number"
                                  value={item.itemsPerPacking || ''}
                                  onChange={(e) => updateItem(item.id, 'itemsPerPacking', Number(e.target.value))}
                                  placeholder="0"
                                  className="w-full bg-gray-50 border border-border rounded-lg px-2 py-2 text-center text-sm font-bold focus:bg-white focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                                />
                             </td>
                             <td className="px-4 py-4">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm font-black text-foreground tabular-nums">
                                    {(item.packingQty * item.itemsPerPacking).toLocaleString()}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground mt-0.5">
                                    {((item.packingQty * item.itemsPerPacking) > 0 
                                      ? (item.totalPrice / (item.packingQty * item.itemsPerPacking)) 
                                      : 0).toLocaleString()} <span className="opacity-60">đ/pcs</span>
                                  </span>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <input 
                                  type="number"
                                  value={item.totalPrice || ''}
                                  onChange={(e) => updateItem(item.id, 'totalPrice', Number(e.target.value))}
                                  className="w-full bg-transparent border-b border-border text-right px-1 py-1 text-sm font-black text-primary focus:border-primary outline-none transition-all"
                                />
                             </td>
                             <td className="px-4 py-4">
                                <input 
                                  type="text"
                                  value={item.location}
                                  onChange={(e) => updateItem(item.id, 'location', e.target.value)}
                                  placeholder="Vị trí..."
                                  className="w-full bg-transparent border-b border-border focus:border-primary py-1 text-[11px] font-bold text-foreground text-center outline-none transition-all uppercase"
                                />
                             </td>
                             <td className="px-6 py-4 text-right">
                                <button onClick={() => removeItem(item.id)} className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                   <Trash2 size={16} />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                </table>
             </div>
             
             <div className="p-6 bg-gray-50/50">
                <button 
                  onClick={addItem}
                  className="w-full py-4 border-2 border-dashed border-border bg-white flex items-center justify-center gap-3 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all font-bold text-xs uppercase tracking-widest rounded-xl hover:shadow-sm"
                >
                   <Plus size={18} />
                   Thêm dòng mới
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-5xl px-6 z-40">
        <div className="card !p-4 !px-8 shadow-2xl flex items-center justify-between gap-8 border-primary/20 bg-white/90 backdrop-blur-md">
          <div className="hidden md:flex items-center gap-8">
             <div className="flex flex-col border-r border-border pr-8">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hạng mục kê khai</p>
                <p className="text-xl font-black text-foreground">{items.length} <span className="text-xs font-bold text-muted-foreground uppercase ml-1">Bản ghi</span></p>
             </div>
             <p className="text-xs font-medium text-muted-foreground max-w-[200px] leading-relaxed italic">
               Kiểm tra thông tin kỹ trước khi xác nhận lưu kho vĩnh viễn.
             </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => window.print()}
              className="btn-secondary h-12 px-6 flex items-center gap-2 whitespace-nowrap"
            >
              <Printer size={18} /> In thẻ kho
            </button>
            <button 
              onClick={handleSave}
              disabled={isSubmitting || !selectedPartner || items.some(i => !i.materialId || (i.packingQty * i.itemsPerPacking) <= 0)}
              className="btn-primary h-12 px-10 flex-1 md:flex-none flex items-center justify-center gap-3 shadow-lg shadow-primary/20"
            >
               {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
               Xác nhận Nhập kho
            </button>
          </div>
        </div>
      </div>

      {/* Print labels (hidden usually) */}
      <div className="hidden print:block p-8">
        <h2 className="text-center text-xl font-bold uppercase mb-8 pb-4 border-b">Tem định danh Lô hàng - Paper Art Việt</h2>
        <div className="grid grid-cols-4 gap-6">
          {items.filter(i => i.materialId && (i.packingQty * i.itemsPerPacking) > 0).map((item, idx) => (
            <div key={idx} className="border border-black p-4 flex flex-col items-center gap-2">
              <p className="text-[10px] font-bold text-center h-8 overflow-hidden">{item.name}</p>
              <QRCodeSVG 
                value={JSON.stringify({ sku: item.sku, loc: item.location, date: inwardDate })}
                size={80} 
              />
              <p className="text-xs font-black tracking-widest">{item.sku}</p>
              <p className="text-[9px] font-bold uppercase">LOC: {item.location || '---'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
