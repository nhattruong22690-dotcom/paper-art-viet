"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  Package, 
  User, 
  Calendar, 
  FileText,
  DollarSign,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react';
import { createPurchaseOrder, getSuppliersForDropdown } from '@/services/purchase.service';
import SupplierManagementModal from './SupplierManagementModal';
import { getMaterials } from '@/services/material.service';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Material {
  id: string;
  sku: string;
  name: string;
  referencePrice: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface POItem {
  id: string;
  materialId: string;
  quantityOrdered: number;
  expectedPrice: number;
  sku?: string;
  name?: string;
}

export default function PurchaseOrderForm({ onBack, onSuccess }: { onBack: () => void, onSuccess: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItem[]>([
    { id: '1', materialId: '', quantityOrdered: 0, expectedPrice: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supps, mats] = await Promise.all([
          getSuppliersForDropdown(),
          getMaterials({})
        ]);
        setSuppliers(supps as any);
        setMaterials(mats as any);
      } catch (error) {
        console.error("Load failed:", error);
      }
    };
    loadData();
  }, [showSupplierModal]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), materialId: '', quantityOrdered: 0, expectedPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof POItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if (field === 'materialId') {
          const m = materials.find(mat => mat.id === value);
          return { ...item, [field]: value, sku: m?.sku, name: m?.name, expectedPrice: Number(m?.referencePrice || 0) };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((acc, item) => acc + (item.quantityOrdered * item.expectedPrice), 0);
  };

  const handleSave = async () => {
    if (!selectedSupplier) {
      alert("Vui lòng chọn nhà cung cấp");
      return;
    }
    const validItems = items.filter(i => i.materialId && i.quantityOrdered > 0);
    if (validItems.length === 0) {
      alert("Vui lòng nhập ít nhất một mặt hàng hợp lệ");
      return;
    }

    setIsSaving(true);
    try {
      await createPurchaseOrder({
        supplierId: selectedSupplier,
        expectedDeliveryDate: expectedDate,
        notes,
        items: validItems.map(i => ({
          materialId: i.materialId,
          quantityOrdered: i.quantityOrdered,
          expectedPrice: i.expectedPrice
        }))
      });
      onSuccess();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Lỗi khi lưu: " + (error as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-24 font-typewriter">
      {/* HEADER SECTION */}
      <div className="bg-white p-10 border-b-2 border-retro-sepia/10 shadow-[0_15px_40px_-10px_rgba(62,39,35,0.1)] relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Save size={240} strokeWidth={0.5} className="text-retro-sepia" />
        </div>
        
        <div className="flex items-center gap-8 relative z-10 font-typewriter">
           <button 
             onClick={onBack}
             className="w-14 h-14 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia hover:bg-retro-brick/10 hover:text-retro-brick transition-all rotate-3 hover:rotate-0 shadow-sm"
           >
              <ArrowLeft size={24} strokeWidth={1.5} />
           </button>
           <div>
              <nav className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-4 opacity-60">
                <Package size={14} strokeWidth={1.5} />
                <span>Thu mua</span>
                <ChevronRight size={12} strokeWidth={1.5} />
                <span className="text-retro-sepia">Khai báo Đơn mua hàng (PO)</span>
              </nav>
              <h2 className="text-3xl font-black text-retro-sepia uppercase tracking-tighter italic">
                Lập <span className="text-retro-brick underline decoration-double decoration-retro-brick/30 underline-offset-4">Đơn Mới</span>
              </h2>
           </div>
        </div>

        <div className="flex gap-6 w-full md:w-auto relative z-10">
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="flex-1 md:flex-none flex items-center justify-center gap-4 px-12 py-5 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all active:scale-95 italic disabled:opacity-50"
           >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin" />
              ) : (
                <Save size={20} strokeWidth={2.5} />
              )}
              {isSaving ? 'Đang thụ lý...' : 'Lưu Bản Nháp'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT COLUMN: BASIC INFO */}
        <div className="lg:col-span-1 space-y-10">
          <div className="retro-card !bg-white p-10 border-2 border-retro-sepia/10 shadow-xl space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-retro-sepia/5 group-hover:text-retro-mustard/10 transition-colors pointer-events-none">
               <Briefcase size={100} strokeWidth={1} />
            </div>
            
            <div className="space-y-8 relative z-10 font-typewriter">
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">
                  <User size={14} strokeWidth={1.5} className="text-retro-mustard" />
                  Nhà cung cấp đối tác
                </label>
                <div className="relative">
                  <select 
                    className="w-full px-8 py-5 bg-retro-paper border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia appearance-none transition-all shadow-inner pr-16"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">Lựa chọn nhà cung ứng...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <button 
                    type="button"
                    onClick={() => setShowSupplierModal(true)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia hover:bg-retro-sepia hover:text-retro-paper transition-all shadow-sm"
                  >
                    <Plus size={16} strokeWidth={2} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">
                  <Calendar size={14} strokeWidth={1.5} className="text-retro-mustard" />
                  Kỳ hạn nhận nộp dự kiến
                </label>
                <input 
                  type="date"
                  className="w-full px-8 py-5 bg-white border-2 border-retro-sepia/10 text-xs font-black text-retro-sepia outline-none focus:border-retro-sepia transition-all shadow-inner"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">
                  <FileText size={14} strokeWidth={1.5} className="text-retro-mustard" />
                  Ký lục Nội bộ
                </label>
                <textarea 
                  placeholder="Yêu cầu đặc thù về tiếp nhận Logistics hoặc chất lượng vật bản..."
                  className="w-full px-8 py-6 bg-retro-paper/50 border-2 border-dashed border-retro-sepia/10 text-xs font-bold text-retro-earth outline-none focus:border-retro-mustard transition-all min-h-[140px] resize-none font-handwriting italic"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TOTAL CARD */}
          <div className="bg-retro-sepia p-10 shadow-2xl border-t-4 border-retro-brick relative overflow-hidden group">
            <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform">
               <DollarSign size={160} strokeWidth={2} className="text-white" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic font-typewriter">Tổng Thụ Giá Hiện Hành</p>
            <h3 className="text-4xl font-black text-white mt-4 italic tracking-tighter font-typewriter tabular-nums">
               {calculateTotal().toLocaleString()} <span className="text-lg text-white/40 not-italic uppercase ml-4 tracking-widest">VNĐ</span>
            </h3>
            <div className="h-1 w-24 bg-retro-brick mt-8 opacity-50"></div>
          </div>
        </div>

        {/* RIGHT COLUMN: ITEMS TABLE */}
        <div className="lg:col-span-2">
          <div className="bg-white border-2 border-retro-sepia/10 shadow-[0_20px_50px_-12px_rgba(62,39,35,0.15)] overflow-hidden">
            <div className="p-8 border-b-2 border-retro-sepia/10 bg-retro-paper/20 flex justify-between items-center font-typewriter">
               <h3 className="text-[11px] font-black text-retro-earth uppercase tracking-[0.2em] flex items-center gap-4 italic opacity-60">
                  <Package size={20} className="text-retro-brick" strokeWidth={1.5} />
                  Sổ mục Vật phẩm Thu mua
               </h3>
               <div className="px-5 py-1 bg-retro-paper border-2 border-retro-sepia/5 text-[9px] font-black text-retro-sepia uppercase tracking-widest italic shadow-sm">
                  {items.length} Dòng mục
               </div>
            </div>
            
            <div className="overflow-x-auto font-typewriter">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-retro-paper text-[9px] font-black text-retro-earth uppercase tracking-[0.2em] border-b-2 border-retro-sepia/20 italic opacity-60">
                    <th className="px-8 py-6 w-16">#</th>
                    <th className="px-8 py-6">Vật liệu Thu mua</th>
                    <th className="px-8 py-6 w-32 text-center">Số lượng</th>
                    <th className="px-8 py-6 w-44 text-right">Đơn giá Dự kiến</th>
                    <th className="px-8 py-6 w-44 text-right">Thành tiền</th>
                    <th className="px-8 py-6 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-retro-sepia/5">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-retro-paper/40 transition-all">
                      <td className="px-8 py-6">
                        <span className="text-[11px] font-black text-retro-earth/30 italic">{(index + 1).toString().padStart(2, '0')}</span>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          className="w-full bg-white border-2 border-retro-sepia/10 px-6 py-4 text-xs font-black uppercase text-retro-sepia focus:border-retro-sepia outline-none transition-all shadow-inner"
                          value={item.materialId}
                          onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                        >
                          <option value="">Chọn vật bản...</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.sku} - {m.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-6">
                         <input 
                           type="number"
                           className="w-full bg-white border-2 border-retro-sepia/10 px-4 py-4 text-xs font-black text-retro-brick text-center focus:border-retro-sepia outline-none transition-all shadow-inner tabular-nums"
                           value={item.quantityOrdered}
                           onChange={(e) => updateItem(item.id, 'quantityOrdered', Number(e.target.value))}
                         />
                      </td>
                      <td className="px-8 py-6">
                         <input 
                           type="number"
                           className="w-full bg-white border-2 border-retro-sepia/10 px-4 py-4 text-xs font-black text-retro-sepia text-right focus:border-retro-sepia outline-none transition-all shadow-inner tabular-nums"
                           value={item.expectedPrice}
                           onChange={(e) => updateItem(item.id, 'expectedPrice', Number(e.target.value))}
                         />
                      </td>
                      <td className="px-8 py-6 text-right font-black text-sm text-retro-sepia italic tabular-nums">
                         {(item.quantityOrdered * item.expectedPrice).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button 
                           onClick={() => removeItem(item.id)}
                           className="p-3 text-retro-earth/20 hover:text-retro-brick transition-all opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 size={18} strokeWidth={1.5} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-10 bg-retro-paper/20 flex justify-center border-t-2 border-retro-sepia/10">
              <button 
                onClick={addItem}
                className="flex items-center gap-4 px-10 py-5 bg-white border-2 border-dashed border-retro-sepia/20 text-[10px] font-black uppercase text-retro-earth/40 tracking-[0.2em] shadow-sm hover:border-retro-sepia hover:text-retro-sepia transition-all group italic"
              >
                <Plus size={18} strokeWidth={2.5} className="group-hover:rotate-180 transition-transform duration-500" />
                Thêm Dòng Vật Bản
              </button>
            </div>
          </div>
        </div>
      </div>
      {showSupplierModal && (
        <SupplierManagementModal onClose={() => setShowSupplierModal(false)} />
      )}
    </div>
  );
}
