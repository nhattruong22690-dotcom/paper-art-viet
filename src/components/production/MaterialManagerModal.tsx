"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, Search, Plus, Trash2, Edit2, Package, 
  FileSpreadsheet, Download, Loader2, Database, 
  Tag, Save, Store, ChevronRight, AlertCircle 
} from 'lucide-react';
import { 
  getAllMaterials, 
  upsertMaterial, 
  bulkUpsertMaterials,
  deleteMaterial 
} from '@/services/material.service';
import * as XLSX from 'xlsx';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Material } from '@/types/bom';
import { formatNumber } from '@/utils/format';
import { NumericInput } from '@/components/ui/NumericInput';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MaterialManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MaterialManagerModal({ isOpen, onClose }: MaterialManagerModalProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [editingMaterial, setEditingMaterial] = useState<Partial<Material> | null>(null);
  const [form, setForm] = useState<Partial<Material>>({
    code: '',
    name: '',
    type: '',
    specification: '',
    unit: '',
    price: 0,
    supplier: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadMaterials();
    }
  }, [isOpen]);

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await getAllMaterials();
      setMaterials(data);
    } catch (err: any) {
      console.error('Failed to load materials details:', err?.message || err || 'Unknown Error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertMaterial(form);
      setForm({ code: '', name: '', type: '', specification: '', unit: '', price: 0, supplier: '' });
      setEditingMaterial(null);
      loadMaterials();
    } catch (err: any) {
      console.error('Failed to save material details:', err?.message || err || 'Unknown Error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vật tư này?')) return;
    try {
      await deleteMaterial(id);
      loadMaterials();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        const materialsToInsert = data.map((row: any) => ({
          code: row["Mã hiệu"] || row["Code"] || "",
          name: row["Tên vật tư"] || row["Name"] || "",
          type: row["Loại"] || row["Type"] || "",
          specification: row["Thông số"] || row["Specification"] || "",
          unit: row["Đơn vị"] || row["Unit"] || "",
          price: Number(row["Giá"] || row["Price"] || 0),
          supplier: row["Nhà cung cấp"] || row["Supplier"] || ""
        })).filter(m => m.specification || m.name);

        if (materialsToInsert.length > 0) {
          await bulkUpsertMaterials(materialsToInsert);
          loadMaterials();
        }
      } catch (err) {
        console.error('Import failed:', err);
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      { "Mã hiệu": "PAP-001", "Tên vật tư": "Giấy Couche", "Loại": "Giấy", "Thông số": "300gsm, 79x109", "Đơn vị": "Tờ", "Giá": 5000, "Nhà cung cấp": "Lan Vi" },
      { "Mã hiệu": "GLU-001", "Tên vật tư": "Keo Sữa", "Loại": "Keo", "Thông số": "AB High-Bond", "Đơn vị": "Kg", "Giá": 45000, "Nhà cung cấp": "Bình Minh" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "mau_nhap_vat_tu_he_thong.xlsx");
  };

  const startEdit = (mat: Material) => {
    setEditingMaterial(mat);
    setForm({
      id: mat.id,
      code: mat.code || '',
      name: mat.name || '',
      type: mat.type || '',
      specification: mat.specification || '',
      unit: mat.unit || '',
      price: Number(mat.price || 0),
      supplier: mat.supplier || ''
    });
  };

  const materialTypes = ['All', ...Array.from(new Set(materials.map(m => m.type).filter(Boolean)))];

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = 
      (m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       m.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       m.specification?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       m.type?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'All' || m.type === filterType;
    
    return matchesSearch && matchesType;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-7xl h-[90vh] bg-[#FAF7F2] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] rounded-3xl flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="px-10 py-8 border-b-[3px] border-black flex justify-between items-center bg-black text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-64 h-64 bg-neo-purple/20 rounded-full translate-x-32 -translate-y-32 blur-3xl" />
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-16 h-16 bg-neo-purple border-[2.5px] border-white rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]">
              <Database size={32} strokeWidth={2.5} className="text-black" />
            </div>
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">
                <span>Cấu hình Master</span>
                <ChevronRight size={10} strokeWidth={3} />
                <span className="text-neo-purple">Danh mục Vật tư NVL</span>
              </nav>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
                Kho dữ liệu <span className="text-neo-purple underline decoration-[3px] underline-offset-4">Vật tư Hệ thống</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <button 
              onClick={downloadTemplate}
              className="px-6 h-12 border-[2.5px] border-white rounded-xl flex items-center gap-3 font-black text-[11px] uppercase bg-transparent text-white hover:bg-white/10 transition-all active:translate-y-[2px]"
            >
              <Download size={16} strokeWidth={3} />
              Tải Template
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-6 h-12 bg-neo-purple border-[2.5px] border-black rounded-xl flex items-center gap-3 font-black text-[11px] uppercase text-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)] hover:scale-105 transition-all"
            >
              {importing ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} strokeWidth={3} />}
              Import Excel
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportExcel} className="hidden" accept=".xlsx, .xls" />
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-neo-red rounded-xl border-[2.5px] border-white/20 hover:border-black text-white transition-all">
              <X size={24} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-hidden flex flex-col xl:flex-row">
          
          {/* Main List Column */}
          <div className="flex-1 overflow-y-auto p-10 space-y-10 border-r-[3px] border-black/5 bg-[#FAF7F2]">
             {/* Search & Filter Chips */}
             <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative group/field">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder="Tìm mã hiệu, tên gọi hoặc thông số kỹ thuật vật tư..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-14 h-14 bg-white border-[2.5px] border-black rounded-xl font-bold text-sm focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                     {materialTypes.map(type => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={cn(
                            "px-5 h-14 border-[2.5px] border-black rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
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
             </div>

             {/* Table List */}
             <div className="bg-white border-[3px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-[#FAF7F2] border-b-[3px] border-black uppercase text-[10px] font-black tracking-widest text-black/40 italic">
                      <tr>
                         <th className="px-8 py-5 border-r-[2.5px] border-black/5">Vật tư (ID/Name)</th>
                         <th className="px-8 py-5 border-r-[2.5px] border-black/5">Phân loại & Thông số</th>
                         <th className="px-8 py-5 border-r-[2.5px] border-black/5 text-center">Đơn vị</th>
                         <th className="px-8 py-5 border-r-[2.5px] border-black/5">Nhà cung cấp</th>
                         <th className="px-8 py-5 text-right">Đơn giá</th>
                         <th className="px-8 py-5 w-[120px] text-center">Tác vụ</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y-[2.5px] divide-black/5">
                      {loading ? (
                         <tr>
                            <td colSpan={6} className="py-20 text-center italic text-black/20 font-black uppercase tracking-[0.5em]">
                               <Loader2 className="animate-spin inline mr-4" /> Đang tải dữ liệu...
                            </td>
                         </tr>
                      ) : filteredMaterials.length === 0 ? (
                         <tr>
                            <td colSpan={6} className="py-20 text-center italic text-black/20 font-black uppercase tracking-[0.5em]">Không tìm thấy vật tư phù hợp</td>
                         </tr>
                      ) : filteredMaterials.map((mat) => (
                        <tr key={mat.id} className="group hover:bg-neo-purple/5 transition-colors">
                           <td className="px-8 py-6 border-r-[2.5px] border-black/5">
                              <div className="flex flex-col gap-1">
                                 <span className="text-[10px] font-black text-black/30 tracking-widest uppercase">{mat.code || 'NO-REF'}</span>
                                 <span className="text-sm font-black text-black uppercase italic">{mat.name || 'Vật tư chưa đặt tên'}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 border-r-[2.5px] border-black/5">
                              <div className="flex items-center gap-3 mb-2">
                                 <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded-md">{mat.type}</span>
                                 <span className="w-1.5 h-1.5 rounded-full bg-black/10" />
                              </div>
                              <span className="text-[12px] font-bold text-black/60 line-clamp-2">{mat.specification}</span>
                           </td>
                           <td className="px-8 py-6 border-r-[2.5px] border-black/5 text-center">
                              <span className="inline-block px-3 py-1 bg-white border-2 border-black rounded-lg text-[11px] font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                 {mat.unit}
                              </span>
                           </td>
                           <td className="px-8 py-6 border-r-[2.5px] border-black/5">
                              <div className="flex items-center gap-2">
                                 <Store size={14} className="text-black/20" />
                                 <span className="text-[11px] font-black text-black/60 uppercase italic">{mat.supplier || 'N/A'}</span>
                              </div>
                           </td>
                           <td className="px-8 py-6 text-right tabular-nums">
                              <span className="text-lg font-black text-black">{formatNumber(mat.price)}<span className="text-[10px] ml-1">đ</span></span>
                           </td>
                           <td className="px-8 py-6 text-center">
                              <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button 
                                   onClick={() => startEdit(mat)}
                                   className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-yellow transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                 >
                                    <Edit2 size={16} strokeWidth={2.5} />
                                 </button>
                                 <button 
                                   onClick={() => handleDelete(mat.id)}
                                   className="w-10 h-10 rounded-xl bg-white border-2 border-neo-red flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-red hover:text-white transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                                 >
                                    <Trash2 size={16} strokeWidth={2.5} />
                                 </button>
                              </div>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Right Panel: Add/Edit Form */}
          <div className="w-full xl:w-[450px] p-10 bg-white border-l-[3px] border-black overflow-y-auto">
             <div className="sticky top-0 space-y-8">
                <div className="flex items-center justify-between">
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
                     <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(168,85,247,0.4)]">
                       {editingMaterial ? <Edit2 size={18} /> : <Plus size={18} />} 
                     </div>
                     {editingMaterial ? 'Cập nhật Vật tư' : 'Thêm Vật tư mới'}
                   </h3>
                   {editingMaterial && (
                       <button 
                         onClick={() => { setEditingMaterial(null); setForm({ code: '', name: '', type: '', specification: '', unit: '', price: 0, supplier: '' }); }}
                         className="text-[10px] font-black uppercase text-neo-red underline decoration-[2px] underline-offset-4"
                       >
                         Hủy bỏ
                       </button>
                   )}
                </div>

                <form onSubmit={handleUpsert} className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-black/40 ml-1">Mã hiệu (SKU)</label>
                         <input 
                           value={form.code || ''}
                           onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                           placeholder="Mã NVL..." 
                           className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none rounded-xl"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-black/40 ml-1">Loại NVL (*)</label>
                         <input 
                           required
                           value={form.type}
                           onChange={e => setForm({...form, type: e.target.value})}
                           placeholder="Giấy, Mực..." 
                           className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none rounded-xl"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-black/40 ml-1">Tên gọi / Danh xưng (*)</label>
                      <input 
                        required
                        value={form.name || ''}
                        onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="VD: Giấy Couche 300..." 
                        className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none rounded-xl"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-black/40 ml-1">Thông số kỹ thuật (*)</label>
                      <textarea 
                        required
                        value={form.specification}
                        onChange={e => setForm({...form, specification: e.target.value})}
                        placeholder="VD: 79x109, Trắng láng, C300..." 
                        className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none min-h-[120px] resize-none rounded-xl"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-black/40 ml-1">Đơn vị (*)</label>
                         <input 
                           required
                           value={form.unit}
                           onChange={e => setForm({...form, unit: e.target.value})}
                           placeholder="Tờ, Kg..." 
                           className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:bg-white outline-none rounded-xl"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-black/40 ml-1">Đơn giá (*)</label>
                         <NumericInput 
                           value={form.price}
                           onChange={val => setForm({...form, price: val})}
                           className="!h-[48px] rounded-xl"
                         />
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-black/40 ml-1">Nhà cung cấp ưu tiên</label>
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
                      {editingMaterial ? 'Lưu cập nhật' : 'Tạo vật tư mới'}
                   </button>
                </form>

                <div className="mt-8 p-6 bg-neo-purple/10 border-[2.5px] border-black rounded-2xl border-dashed">
                   <div className="flex gap-4">
                      <AlertCircle className="text-black/40 shrink-0" size={20} />
                      <p className="text-[10px] font-black text-black/40 uppercase leading-relaxed tracking-wider italic">
                         Dữ liệu vật tư được sử dụng để tính toán giá thành BOM chính thức. Mọi thay đổi về đơn giá sẽ ảnh hưởng đến các snapshot giá thành sản phẩm liên quan.
                      </p>
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t-[3px] border-black bg-white flex justify-between items-center italic text-[10px] font-black text-black/30 shrink-0">
           Hệ thống Master Data • Paper Art Viet Enterprise Resource Planning 2026
        </div>

      </div>
    </div>
  );
}
