"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, Search, Plus, Trash2, Edit2, X,
  Database, ChevronRight, Save, Store, 
  AlertCircle, Loader2, Tag, Box, Info,
  Calculator, DollarSign, Layers
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAllMaterials, upsertMaterial, deleteMaterial } from '@/services/material.service';
import { useNotification } from '@/context/NotificationContext';
import { formatNumber } from '@/utils/format';
import { NumericInput } from '@/components/ui/NumericInput';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Material {
  id: string;
  code: string;
  name: string;
  type: string;
  unit: string;
  minStock: number;
  stockQuantity: number;
  price: number;
  purchasePrice?: number | null;
  purchaseQuantity?: number | null;
  unitPrice?: number | null;
  specification?: string;
  supplier?: string;
}

export default function MaterialMasterList() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [loading, setLoading] = useState(false);
  const { showToast, showModal, confirm: confirmDialog } = useNotification();
  
  // NEW: Form Sidebar State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [form, setForm] = useState<Partial<Material>>({
    code: '',
    name: '',
    type: 'Giấy',
    unit: 'Tờ',
    minStock: 0,
    price: 0,
    specification: '',
    supplier: '',
    purchasePrice: null,
    purchaseQuantity: null
  });

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await getAllMaterials();
      setMaterials(data.map((m: any) => ({
        ...m,
        minStock: Number(m.minStock || m.min_stock || 0),
        stockQuantity: Number(m.stockQuantity || m.stock_quantity || 0),
        price: Number(m.price || 0),
        purchasePrice: m.purchasePrice ? Number(m.purchasePrice) : null,
        purchaseQuantity: m.purchaseQuantity ? Number(m.purchaseQuantity) : null,
        unitPrice: m.unitPrice ? Number(m.unitPrice) : null
      })) as any);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const materialTypes = ['All', ...Array.from(new Set(materials.map(m => m.type).filter(Boolean)))];

  const filteredMaterials = materials.filter(m => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      m.name?.toLowerCase().includes(searchLower) || 
      m.code?.toLowerCase().includes(searchLower) ||
      m.specification?.toLowerCase().includes(searchLower) ||
      m.type?.toLowerCase().includes(searchLower);
    
    const matchesType = filterType === 'All' || m.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const handleUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalData = { ...form };
      await upsertMaterial(finalData as any);
      showToast('success', editingMaterial ? 'Cập nhật vật tư thành công' : 'Đã tạo vật tư mới');
      resetForm();
      fetchMaterials();
    } catch (error: any) {
      const errorMsg = error.message || (typeof error === 'string' ? error : JSON.stringify(error));
      showModal('error', 'Không thể lưu vật tư', errorMsg);
    }
  };

  const startEdit = (mat: Material) => {
    setEditingMaterial(mat);
    setForm({
      id: mat.id,
      code: mat.code || '',
      name: mat.name || '',
      type: mat.type || 'Giấy',
      unit: mat.unit || 'Tờ',
      minStock: Number(mat.minStock || 0),
      price: Number(mat.price || 0),
      specification: mat.specification || '',
      supplier: mat.supplier || '',
      purchasePrice: mat.purchasePrice,
      purchaseQuantity: mat.purchaseQuantity
    });
    setIsFormOpen(true);
  };

  const resetForm = () => {
    setEditingMaterial(null);
    setForm({
      code: '',
      name: '',
      type: 'Giấy',
      unit: 'Tờ',
      minStock: 0,
      price: 0,
      specification: '',
      supplier: '',
      purchasePrice: null,
      purchaseQuantity: null
    });
    setIsFormOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!await confirmDialog('Bạn có chắc chắn muốn xóa vật tư này?')) return;
    try {
      await deleteMaterial(id);
      showToast('success', 'Đã xóa vật tư thành công');
      fetchMaterials();
    } catch (error: any) {
      showModal('error', 'Không thể xóa vật tư', 'Vật tư này có thể đang được sử dụng trong BOM hoặc đơn hàng.');
    }
  };

  const calculatedUnitPrice = (form.purchasePrice && form.purchaseQuantity && form.purchaseQuantity > 0) 
    ? (form.purchasePrice / form.purchaseQuantity) 
    : null;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#FAF7F2] overflow-hidden relative">
      
      {/* ENTRY FORM SIDEBAR (HIGH INDEX OVERLAY) */}
      {isFormOpen && (
        <div className="absolute inset-0 z-[150] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative w-full max-w-[480px] h-full bg-white border-l-[3px] border-black shadow-2xl animate-in slide-in-from-right duration-500 overflow-y-auto">
             <div className="p-10 space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3 italic">
                     <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-neo-sm text-neo-purple">
                       {editingMaterial ? <Edit2 size={18} /> : <Plus size={18} />} 
                     </div>
                     {editingMaterial ? 'Update Master Record' : 'Register New Material'}
                   </h3>
                   <button onClick={resetForm} className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-xl hover:bg-neo-red transition-all">
                      <X size={20} />
                   </button>
                </div>

                <form onSubmit={handleUpsert} className="space-y-6 pb-20">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-black/40 ml-1">Mã hiệu (SKU) (*)</label>
                         <input 
                           required
                           value={form.code || ''}
                           onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                           placeholder="Mã NVL..." 
                           className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none rounded-xl"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-black/40 ml-1">Chủng loại (*)</label>
                         <select 
                           required
                           value={form.type}
                           onChange={e => setForm({...form, type: e.target.value})}
                           className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none rounded-xl appearance-none"
                         >
                           {materialTypes.filter(t => t !== 'All').map(t => (
                             <option key={t} value={t}>{t}</option>
                           ))}
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-black/40 ml-1">Tên gọi / Danh xưng (*)</label>
                      <input 
                        required
                        value={form.name || ''}
                        onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="VD: Giấy Couche 300gsm..." 
                        className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none rounded-xl"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-black/40 ml-1">Thông số kỹ thuật / Quy cách</label>
                      <textarea 
                        value={form.specification || ''}
                        onChange={e => setForm({...form, specification: e.target.value})}
                        placeholder="VD: 79x109, Trắng láng, Định lượng 300..." 
                        className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none min-h-[100px] resize-none rounded-xl"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-black/40 ml-1">Đơn vị (*)</label>
                         <input 
                           required
                           value={form.unit || ''}
                           onChange={e => setForm({...form, unit: e.target.value})}
                           placeholder="Tờ, Kg, Cuộn..." 
                           className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none rounded-xl"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-black/40 ml-1 italic text-neo-red">Tồn tối thiểu</label>
                         <NumericInput 
                           value={form.minStock || 0}
                           onChange={val => setForm({...form, minStock: val})}
                           className="!h-[48px] rounded-xl border-neo-red/30"
                         />
                      </div>
                   </div>

                   <div className="p-6 bg-black/5 border-2 border-black border-dashed rounded-xl space-y-6">
                     <div className="flex items-center gap-3">
                       <Calculator size={18} className="text-black" />
                       <h3 className="text-[10px] font-black text-black uppercase tracking-widest italic">Acquisition Calculator</h3>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-black/40 uppercase">Giá nhập (Lô)</label>
                           <NumericInput 
                             value={form.purchasePrice || 0}
                             onChange={val => setForm({...form, purchasePrice: val})}
                             className="!h-10 !bg-white text-xs"
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black text-black/40 uppercase">Số lượng lô</label>
                           <NumericInput 
                             value={form.purchaseQuantity || 0}
                             onChange={val => setForm({...form, purchaseQuantity: val})}
                             className="!h-10 !bg-white text-xs"
                           />
                        </div>
                     </div>

                     <div className="p-4 bg-white border-2 border-black rounded-xl shadow-neo-sm flex justify-between items-center tabular-nums">
                        <div>
                           <p className="text-[8px] font-black text-black/30 uppercase leading-none mb-1">Dự kiến</p>
                           <p className="text-sm font-black italic">{calculatedUnitPrice ? formatNumber(calculatedUnitPrice) : '---'}</p>
                        </div>
                        <div className="text-right">
                           <label className="text-[9px] font-black text-black/40 uppercase block mb-1">Sử dụng đơn giá (*)</label>
                           <NumericInput 
                             value={form.price || 0}
                             onChange={val => setForm({...form, price: val})}
                             className="!h-10 !bg-black !text-white !w-32 text-xs text-right"
                           />
                        </div>
                     </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-black/40 ml-1">Nhà cung cấp</label>
                      <input 
                        value={form.supplier || ''}
                        onChange={e => setForm({...form, supplier: e.target.value})}
                        placeholder="VD: Lan Vi, Giấy Bình Minh..." 
                        className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none rounded-xl"
                      />
                   </div>

                   <button 
                     type="submit"
                     className="w-full py-5 bg-black text-white border-[2.5px] border-black rounded-2xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-purple hover:text-black transition-all active:shadow-none active:translate-x-1 active:translate-y-1"
                   >
                      <Save size={20} />
                      {editingMaterial ? 'Lưu cập nhật' : 'Khởi tạo Master Record'}
                   </button>
                </form>
             </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION - Synchronized Premium Style */}
      <div className="px-10 py-8 border-b-[3px] border-black flex justify-between items-center bg-black text-white relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-neo-purple/20 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-50" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-neo-purple border-[2.5px] border-white rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
            <Database size={32} strokeWidth={2.5} className="text-black" />
          </div>
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">
              <span>Hệ thống Master Data</span>
              <ChevronRight size={10} strokeWidth={3} />
              <span className="text-neo-purple italic">Dictionary of Materials</span>
            </nav>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-white">
              Quản lý <span className="text-neo-purple underline decoration-[3px] underline-offset-4">Vật Tư NVL</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => setIsFormOpen(true)}
            className="px-8 h-12 bg-neo-purple border-[2.5px] border-black rounded-xl flex items-center gap-3 font-black text-[11px] uppercase text-black hover:scale-105 transition-all shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]"
          >
            <Plus size={18} strokeWidth={3} />
            Đăng ký vật tư mới
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA - Full Width List */}
      <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#FAF7F2]">
        
        {/* SEARCH & FILTERS */}
        <div className="flex flex-col gap-6">
          <div className="relative group/field">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Tìm mã hiệu, tên gọi hoặc thông số kỹ thuật vật tư..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 h-16 bg-white border-[3px] border-black rounded-2xl font-black text-base focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] outline-none transition-all shadow-neo-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
             <span className="text-[10px] font-black uppercase text-black/20 tracking-widest mr-2 flex items-center gap-2">
               <Tag size={12} /> Lọc nhanh:
             </span>
             {materialTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={cn(
                    "px-8 h-12 border-[2.5px] border-black rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                    filterType === type 
                      ? "bg-black text-white shadow-none translate-y-1" 
                      : "bg-white text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-purple/10"
                  )}
                >
                   {type === 'All' ? 'Tất cả' : type}
                </button>
             ))}
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white border-[3px] border-black rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <table className="w-full text-left border-collapse">
               <thead className="bg-[#FAF7F2] border-b-[3px] border-black uppercase text-[10px] font-black tracking-widest text-black/40 italic">
                  <tr>
                     <th className="px-10 py-6 border-r-[2.5px] border-black/5 min-w-[300px]">Vật tư / Thông số</th>
                     <th className="px-10 py-6 border-r-[2.5px] border-black/5 text-center w-32">Phân loại</th>
                     <th className="px-10 py-6 border-r-[2.5px] border-black/5 text-center w-32">Đơn vị</th>
                     <th className="px-10 py-6 border-r-[2.5px] border-black/5 min-w-[150px]">Tồn kho</th>
                     <th className="px-10 py-6 text-right min-w-[180px]">Đơn giá niêm yết</th>
                     <th className="px-10 py-6 w-[150px] text-center">Quản lý</th>
                  </tr>
               </thead>
               <tbody className="divide-y-[2.5px] divide-black/5">
                  {loading ? (
                     <tr>
                        <td colSpan={6} className="py-40 text-center italic text-black/20 font-black uppercase tracking-[0.5em]">
                           <Loader2 className="animate-spin inline mr-4" /> Syncing Inventory Database...
                        </td>
                     </tr>
                  ) : filteredMaterials.length === 0 ? (
                     <tr>
                        <td colSpan={6} className="py-40 text-center italic text-black/20 font-black uppercase tracking-[0.5em]">
                           <Box size={48} className="mx-auto mb-4 opacity-10" />
                           Không tìm thấy vật tư phù hợp
                        </td>
                     </tr>
                  ) : filteredMaterials.map((mat) => (
                    <tr key={mat.id} className="group hover:bg-neo-purple/5 transition-colors">
                       <td className="px-10 py-8 border-r-[2.5px] border-black/5">
                          <div className="flex flex-col">
                             <span className="text-sm font-black text-black uppercase italic leading-tight">{mat.specification || 'CHƯA CÓ QUY CÁCH'}</span>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-neo-purple uppercase tracking-tighter">{mat.code}</span>
                                <span className="w-1 h-1 rounded-full bg-black/10" />
                                <span className="text-[10px] font-bold text-black/40 uppercase tracking-tighter">{mat.name}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-10 py-8 border-r-[2.5px] border-black/5 text-center">
                          <span className={cn(
                            "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border-2 border-black/10",
                            mat.type === 'Giấy' ? "bg-neo-purple text-white border-black" : "bg-black text-white"
                          )}>{mat.type}</span>
                       </td>
                       <td className="px-10 py-8 border-r-[2.5px] border-black/5 text-center">
                          <span className="inline-block px-4 py-2 bg-white border-[2.5px] border-black rounded-xl text-[11px] font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                             {mat.unit}
                          </span>
                       </td>
                       <td className="px-10 py-8 border-r-[2.5px] border-black/5">
                          <div className="flex flex-col gap-1">
                             <span className={cn(
                               "text-lg font-black italic",
                               (mat.stockQuantity || 0) <= (mat.minStock || 0) ? "text-neo-red" : "text-black"
                             )}>
                               {formatNumber(mat.stockQuantity || 0)}
                             </span>
                             <span className="text-[9px] font-black text-black/30 uppercase tracking-widest">MIN: {formatNumber(mat.minStock || 0)}</span>
                          </div>
                       </td>
                       <td className="px-10 py-8 text-right tabular-nums">
                          <span className="text-2xl font-black text-black italic tracking-tighter">
                            {formatNumber(mat.price || 0)}
                            <span className="text-xs ml-1 font-normal opacity-40 not-italic uppercase tracking-widest"> VNĐ</span>
                          </span>
                       </td>
                       <td className="px-10 py-8 text-center">
                          <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                             <button 
                               onClick={() => startEdit(mat)}
                               className="w-12 h-12 rounded-2xl bg-white border-[2.5px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-purple transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                             >
                                <Edit2 size={20} strokeWidth={2.5} />
                             </button>
                             <button 
                               onClick={() => handleDelete(mat.id)}
                               className="w-12 h-12 rounded-2xl bg-white border-[2.5px] border-neo-red flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-red hover:text-white transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                             >
                                <Trash2 size={20} strokeWidth={2.5} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
        </div>
      </div>

      {/* FOOTER */}
      <div className="px-10 py-4 border-t-[3px] border-black bg-white flex justify-between items-center italic text-[11px] font-black text-black/30 shrink-0">
         <span>Master Registry Service • Paper Art Viet Enterprise resource Planning 2026</span>
         <span className="uppercase tracking-[0.2em]">{filteredMaterials.length} Items Listed</span>
      </div>
    </div>
  );
}
