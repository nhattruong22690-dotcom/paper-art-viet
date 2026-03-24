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
  Briefcase
} from 'lucide-react';
import { getSuppliers, createPurchaseOrder } from '@/services/purchase.service';
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
  partnerCategory: string | null;
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const [supps, mats] = await Promise.all([
          getSuppliers(),
          getMaterials({})
        ]);
        setSuppliers(supps as any);
        setMaterials(mats as any);
      } catch (error) {
        console.error("Load failed:", error);
      }
    };
    loadData();
  }, []);

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
      alert("Đã tạo Đơn mua hàng (Bản nháp) thành công!");
      onSuccess();
    } catch (error) {
      console.error("Save failed:", error);
      alert("Lỗi khi lưu: " + (error as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-2xl shadow-gray-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
        <div className="flex items-center gap-6">
           <button 
             onClick={onBack}
             className="w-14 h-14 bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-gray-100"
           >
              <X size={24} />
           </button>
           <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                Lập <span className="text-indigo-600">Đơn mua mới</span>
              </h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic italic">Xây dựng kế hoạch thu mua nguyên liệu</p>
           </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-5 bg-indigo-600 text-white rounded-[28px] text-[12px] font-black uppercase tracking-widest hover:bg-gray-900 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
           >
              <Save size={20} />
              {isSaving ? 'Đang lưu...' : 'Lưu Bản Nháp'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN: BASIC INFO */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-10 rounded-[48px] border border-gray-100 shadow-xl shadow-gray-100/30 space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-gray-50 group-hover:text-indigo-50/50 transition-colors">
               <Briefcase size={80} strokeWidth={4} />
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">
                  <User size={12} className="text-indigo-400" />
                  Nhà cung cấp
                </label>
                <div className="relative group/select">
                  <select 
                    className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[24px] text-sm font-bold focus:outline-none focus:border-indigo-500 appearance-none transition-all"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                  >
                    <option value="">Chọn nhà cung cấp...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.partnerCategory || 'Vật tư'})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">
                  <Calendar size={12} className="text-indigo-400" />
                  Ngày nhận dự kiến
                </label>
                <input 
                  type="date"
                  className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[24px] text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">
                  <FileText size={12} className="text-indigo-400" />
                  Ghi chú nội bộ
                </label>
                <textarea 
                  placeholder="Yêu cầu đặc biệt cho nhà cung cấp..."
                  className="w-full px-6 py-5 bg-gray-50/50 border border-gray-100 rounded-[24px] text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all min-h-[120px] resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TOTAL CARD */}
          <div className="bg-gray-900 p-10 rounded-[48px] shadow-2xl shadow-indigo-200/20 text-white relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 opacity-10">
               <DollarSign size={160} strokeWidth={3} />
            </div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] italic">Tổng Giá Trị Dự Kiến</p>
            <h3 className="text-4xl font-black mt-4 italic tracking-tight">
               {calculateTotal().toLocaleString()} <span className="text-lg text-indigo-400 not-italic uppercase ml-2">VNĐ</span>
            </h3>
            <div className="h-1 w-20 bg-indigo-500 rounded-full mt-6 opacity-50"></div>
          </div>
        </div>

        {/* RIGHT COLUMN: ITEMS TABLE */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[48px] border border-gray-100 shadow-xl shadow-gray-100/30 overflow-hidden">
            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
               <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3 italic">
                  <Package size={16} className="text-indigo-500" />
                  Danh sách mặt hàng đặt mua
               </h3>
               <p className="text-[10px] font-bold text-indigo-500 uppercase bg-indigo-50 px-4 py-1.5 rounded-full">{items.length} Dòng</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white text-[9px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                    <th className="px-8 py-6 w-16">#</th>
                    <th className="px-8 py-6">Nguyên Vật Tư</th>
                    <th className="px-8 py-6 w-32">Số lượng</th>
                    <th className="px-8 py-6 w-44 text-right">Đơn giá dự kiến</th>
                    <th className="px-8 py-6 w-44 text-right">Thành tiền</th>
                    <th className="px-8 py-6 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-[11px] font-black text-gray-400 italic">{(index + 1).toString().padStart(2, '0')}</span>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                          value={item.materialId}
                          onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                        >
                          <option value="">Chọn vật tư...</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.sku} - {m.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-8 py-6 text-center">
                         <input 
                           type="number"
                           className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-black text-center focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                           value={item.quantityOrdered}
                           onChange={(e) => updateItem(item.id, 'quantityOrdered', Number(e.target.value))}
                         />
                      </td>
                      <td className="px-8 py-6">
                         <input 
                           type="number"
                           className="w-full bg-white border border-gray-100 rounded-2xl px-4 py-3.5 text-xs font-black text-right focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                           value={item.expectedPrice}
                           onChange={(e) => updateItem(item.id, 'expectedPrice', Number(e.target.value))}
                         />
                      </td>
                      <td className="px-8 py-6 text-right font-mono text-xs font-black text-gray-900 italic">
                         {(item.quantityOrdered * item.expectedPrice).toLocaleString()}đ
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button 
                           onClick={() => removeItem(item.id)}
                           className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 size={16} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-gray-50/30 flex justify-center">
              <button 
                onClick={addItem}
                className="flex items-center gap-3 px-8 py-4 bg-white border border-dashed border-gray-200 text-[10px] font-black uppercase text-gray-400 tracking-widest rounded-2xl hover:border-indigo-300 hover:text-indigo-600 transition-all group"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                Thêm Dòng Vật Tư
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
