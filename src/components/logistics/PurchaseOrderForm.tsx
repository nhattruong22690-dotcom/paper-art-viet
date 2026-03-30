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
  ArrowLeft,
  Loader2,
  ShoppingCart,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { createPurchaseOrder, getSuppliersForDropdown } from '@/services/purchase.service';
import SupplierManagementModal from './SupplierManagementModal';
import { getMaterials } from '@/services/material.service';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotification } from '@/context/NotificationContext';

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
  const { showToast, showModal } = useNotification();

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
      showToast('warning', "Vui lòng chọn nhà cung cấp");
      return;
    }
    const validItems = items.filter(i => i.materialId && i.quantityOrdered > 0);
    if (validItems.length === 0) {
      showToast('warning', "Vui lòng nhập ít nhất một mặt hàng hợp lệ");
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
      showToast('success', 'Đã tạo đơn mua hàng thành công');
      onSuccess();
    } catch (error) {
      console.error("Save failed:", error);
      showModal('error', "Không thể tạo đơn hàng", (error as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-6">
           <button 
             onClick={onBack}
             className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center text-black/40 hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
           >
              <ArrowLeft size={28} strokeWidth={3} />
           </button>
           <div>
              <h2 className="text-3xl font-black text-black tracking-tight uppercase italic">Lập đơn Mua hàng</h2>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">Drafting Purchase Requisition & Supplier Commitment</p>
           </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="btn-primary btn-confirm-flash h-14 px-10 text-xs uppercase tracking-widest"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Save size={20} strokeWidth={3} />
          )}
          {isSaving ? 'Processing...' : 'Xác nhận & Gửi đơn'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 px-0">
        {/* LEFT COLUMN: BASIC INFO */}
        <div className="lg:col-span-1 space-y-10">
          <div className="neo-card space-y-10 bg-white">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Nhà cung cấp</label>
              <div className="relative group/field">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                <select 
                  className="form-input pl-12 pr-14 h-14 appearance-none cursor-pointer text-xs font-black uppercase"
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                  <option value="">Chọn nhà cung cung cấp...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={() => setShowSupplierModal(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-black/40 hover:text-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
                <div className="absolute right-14 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Ngày giao dự kiến</label>
              <div className="relative group/field">
                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                <input 
                  type="date"
                  className="form-input pl-12 h-14 font-black"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Ghi chú nội bộ</label>
              <textarea 
                placeholder="Yêu cầu đặc thù về giao nhận hàng..."
                className="form-input !h-40 py-4 resize-none italic font-black text-xs"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* TOTAL CARD */}
          <div className="p-8 bg-black text-white border-neo border-black rounded-xl shadow-[6px_6px_0px_0px_rgba(30,30,30,1)] relative overflow-hidden">
            <div className="absolute -bottom-8 -right-8 opacity-10 rotate-12">
               <DollarSign size={200} strokeWidth={1} className="text-neo-purple" />
            </div>
            <div className="relative z-10">
              <p className="text-[11px] font-black text-neo-purple uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="w-2 h-2 bg-neo-purple rounded-full animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                Dự chi Hợp đồng
              </p>
              <h3 className="text-5xl font-black text-white mt-6 tabular-nums tracking-tighter italic">
                 {calculateTotal().toLocaleString()} <span className="text-sm font-light opacity-30">đ</span>
              </h3>
              <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-3 italic leading-relaxed">
                * Estimated total based on reference prices. <br/>Final amount confirms on fulfillment.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ITEMS TABLE */}
        <div className="lg:col-span-2">
          <div className="neo-card !p-0 overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b-2 border-black bg-neo-purple/5 flex justify-between items-center px-8">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                    <Package size={20} className="text-black" />
                  </div>
                  <h3 className="text-[11px] font-black text-black uppercase tracking-[0.2em] italic">Danh mục vật tư thu mua</h3>
               </div>
               <span className="px-5 py-2 bg-black text-white border-2 border-black rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {items.length} Hạng mục
               </span>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black text-[10px] font-black uppercase tracking-widest">
                    <th className="px-8 py-5 border-b-2 border-black w-14 text-white">#</th>
                    <th className="px-8 py-5 border-b-2 border-black text-white">Vật tư / SKU</th>
                    <th className="px-8 py-5 w-32 text-center border-b-2 border-black text-white">Số lượng</th>
                    <th className="px-8 py-5 w-40 text-right border-b-2 border-black text-white">Đơn giá</th>
                    <th className="px-8 py-5 w-44 text-right border-b-2 border-black pr-12 text-white">Thành tiền</th>
                    <th className="px-8 py-5 w-16 border-b-2 border-black text-white"></th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/5">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-neo-purple/5 transition-all">
                      <td className="px-8 py-6">
                        <span className="text-[11px] font-black text-black/20 italic">{(index + 1).toString().padStart(2, '0')}</span>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          className="w-full bg-transparent border-b-2 border-black border-dashed focus:border-solid py-2 text-xs font-black text-black outline-none transition-all uppercase tracking-tight italic"
                          value={item.materialId}
                          onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                        >
                          <option value="">Chọn vật tư...</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.sku} • {m.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-6">
                         <input 
                           type="number"
                           className="form-input !h-10 text-center font-black tabular-nums"
                           value={item.quantityOrdered || ''}
                           onChange={(e) => updateItem(item.id, 'quantityOrdered', Number(e.target.value))}
                         />
                      </td>
                      <td className="px-8 py-6">
                         <input 
                           type="number"
                           className="form-input !h-10 text-right font-black tabular-nums italic"
                           value={item.expectedPrice || ''}
                           onChange={(e) => updateItem(item.id, 'expectedPrice', Number(e.target.value))}
                         />
                      </td>
                      <td className="px-8 py-6 text-right font-black text-black tabular-nums tracking-tighter text-lg italic pr-12">
                         {(item.quantityOrdered * item.expectedPrice).toLocaleString()}
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button 
                           onClick={() => removeItem(item.id)}
                           className="w-10 h-10 flex items-center justify-center text-black/20 hover:text-neo-red transition-all"
                         >
                            <Trash2 size={18} strokeWidth={2.5} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-10 bg-black/5 flex justify-center border-t-2 border-black border-dashed mt-auto">
              <button 
                onClick={addItem}
                className="w-full py-4 border-2 border-dashed border-black hover:border-solid hover:bg-white text-black/40 hover:text-black transition-all rounded-xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] active:translate-y-[2px]"
              >
                <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
                Thêm dòng vật tư mới
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
