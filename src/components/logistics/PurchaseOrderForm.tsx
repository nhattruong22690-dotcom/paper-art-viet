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
  Loader2
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER SECTION */}
      <div className="bg-white p-8 border-b border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <button 
             onClick={onBack}
             className="w-10 h-10 bg-white border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all rounded-lg shadow-sm"
           >
              <ArrowLeft size={20} />
           </button>
           <div>
              <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                <Package size={12} />
                <span>Thu mua</span>
                <ChevronRight size={10} />
                <span className="text-primary">Khai báo Đơn mua hàng (PO)</span>
              </nav>
              <h2 className="text-xl font-bold text-foreground tracking-tight">Lập đơn mua hàng mới</h2>
           </div>
        </div>

        <div className="flex gap-4 w-full md:w-auto">
           <button 
             onClick={handleSave}
             disabled={isSaving}
             className="btn-primary flex-1 md:flex-none gap-2"
           >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? 'Đang lưu...' : 'Lưu đơn hàng'}
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-8">
        {/* LEFT COLUMN: BASIC INFO */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-lg border border-border shadow-sm space-y-6">
            
            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  <User size={12} className="text-primary" />
                  Nhà cung cấp
                </label>
                <div className="relative">
                  <select 
                    className="form-input pr-12"
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all rounded"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  <Calendar size={12} className="text-primary" />
                  Ngày giao hàng dự kiến
                </label>
                <input 
                  type="date"
                  className="form-input"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
                  <FileText size={12} className="text-primary" />
                  Ghi chú nội bộ
                </label>
                <textarea 
                  placeholder="Yêu cầu đặc thù về giao hàng hoặc chất lượng..."
                  className="form-input min-h-[120px] resize-none"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* TOTAL CARD */}
          <div className="bg-primary p-8 rounded-lg shadow-lg relative overflow-hidden group border border-blue-400/20">
            <div className="absolute -bottom-6 -right-6 opacity-10 group-hover:scale-110 transition-transform">
               <DollarSign size={120} strokeWidth={2} className="text-white" />
            </div>
            <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Tạm tính đơn hàng</p>
            <h3 className="text-3xl font-bold text-white mt-2 tabular-nums">
               {calculateTotal().toLocaleString()} <span className="text-sm font-normal text-white/60 ml-1">VNĐ</span>
            </h3>
          </div>
        </div>

        {/* RIGHT COLUMN: ITEMS TABLE */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="p-6 border-b border-border bg-gray-50/50 flex justify-between items-center">
               <h3 className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Package size={16} className="text-primary" />
                  Danh mục vật tư thu mua
               </h3>
               <span className="px-2 py-1 bg-white border border-border rounded text-[10px] font-bold text-muted-foreground uppercase">
                  {items.length} Dòng
               </span>
            </div>
            
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-none rounded-none shadow-none">
                <thead>
                  <tr className="bg-gray-50/30 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border italic">
                    <th className="px-6 py-4 w-12">#</th>
                    <th className="px-6 py-4">Vật tư</th>
                    <th className="px-6 py-4 w-28 text-center">Số lượng</th>
                    <th className="px-6 py-4 w-36 text-right">Đơn giá</th>
                    <th className="px-6 py-4 w-36 text-right">Thành tiền</th>
                    <th className="px-6 py-4 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold text-muted-foreground italic">{(index + 1).toString().padStart(2, '0')}</span>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          className="form-input py-1.5 px-3 h-9"
                          value={item.materialId}
                          onChange={(e) => updateItem(item.id, 'materialId', e.target.value)}
                        >
                          <option value="">Chọn vật tư...</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>{m.sku} - {m.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                         <input 
                           type="number"
                           className="form-input py-1.5 px-2 h-9 text-center tabular-nums"
                           value={item.quantityOrdered}
                           onChange={(e) => updateItem(item.id, 'quantityOrdered', Number(e.target.value))}
                         />
                      </td>
                      <td className="px-6 py-4">
                         <input 
                           type="number"
                           className="form-input py-1.5 px-2 h-9 text-right tabular-nums"
                           value={item.expectedPrice}
                           onChange={(e) => updateItem(item.id, 'expectedPrice', Number(e.target.value))}
                         />
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-xs text-foreground tabular-nums tracking-tight">
                         {(item.quantityOrdered * item.expectedPrice).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                         <button 
                           onClick={() => removeItem(item.id)}
                           className="p-2 text-muted-foreground hover:text-destructive transition-all"
                         >
                            <Trash2 size={16} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-8 bg-gray-50/30 flex justify-center border-t border-border mt-auto">
              <button 
                onClick={addItem}
                className="flex items-center gap-2 px-6 py-2.5 bg-white border border-dashed border-border rounded-lg text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary transition-all group shadow-sm"
              >
                <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                Thêm dòng vật tư
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
