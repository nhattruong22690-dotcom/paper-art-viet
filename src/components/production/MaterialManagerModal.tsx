"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Edit2, Package, FileSpreadsheet, Download, Loader2, Database, Tag, Save, Hammer, Beaker, HardDrive, Store } from 'lucide-react';
import { getAllMaterials, upsertMaterial, bulkUpsertMaterials } from '@/services/material.service';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Material } from '@/types/bom';
import { formatNumber } from '@/utils/format';
import { NumericInput } from '@/components/ui/NumericInput';

interface MaterialManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MaterialManagerModal({ isOpen, onClose }: MaterialManagerModalProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editingMaterial, setEditingMaterial] = useState<Partial<Material> | null>(null);
  const [form, setForm] = useState<Partial<Material>>({
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
      setForm({ type: '', specification: '', unit: '', price: 0, supplier: '' });
      setEditingMaterial(null);
      loadMaterials();
    } catch (err: any) {
      console.error('Failed to save material details:', err?.message || err || 'Unknown Error');
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

        // Map Excel columns to our schema
        // Expected columns: "Loại", "Thông số", "Đơn vị", "Giá" or mapping logic
        const materialsToInsert = data.map((row: any) => ({
          type: row["Loại"] || row["Type"] || "",
          specification: row["Thông số"] || row["Specification"] || row["Name"] || "",
          unit: row["Đơn vị"] || row["Unit"] || "",
          price: Number(row["Giá"] || row["Price"] || row["Cost"] || 0),
          supplier: row["Nhà cung cấp"] || row["Supplier"] || ""
        })).filter(m => m.specification);

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
      { "Loại": "Giấy", "Thông số": "Couche 300gsm", "Đơn vị": "Tờ", "Giá": 5000, "Nhà cung cấp": "Lan Vi" },
      { "Loại": "Keo", "Thông số": "Keo sữa AB", "Đơn vị": "Kg", "Giá": 45000, "Nhà cung cấp": "Bình Minh" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "mau_nhap_vat_tu.xlsx");
  };

  const startEdit = (mat: Material) => {
    setEditingMaterial(mat);
    setForm(mat);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl h-[85vh] bg-[#FAF7F2] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b-neo border-black flex justify-between items-center bg-neo-purple/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-neo-sm">
              <Package size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight">Quản lý Danh mục Vật tư</h3>
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">Hệ thống Master Data 5 cột tiêu chuẩn</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportExcel} 
              className="hidden" 
              accept=".xlsx, .xls" 
            />
            <button 
              onClick={downloadTemplate}
              className="px-4 h-10 border-2 border-black rounded-xl flex items-center gap-2 font-black text-[10px] uppercase bg-white hover:bg-black/5 transition-all shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <Download size={14} strokeWidth={3} />
              Mẫu Excel
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-4 h-10 border-2 border-black rounded-xl flex items-center gap-2 font-black text-[10px] uppercase bg-[#E0F2FE] hover:bg-[#BAE6FD] transition-all shadow-neo-sm active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              {importing ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} strokeWidth={3} />}
              Nhập Excel
            </button>
            <button onClick={onClose} className="p-2 hover:bg-neo-red rounded-xl border-2 border-transparent hover:border-black transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">
          
          {/* Quick Add/Edit Form */}
          <Card className="!p-8 bg-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D1FAE5]/20 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              {editingMaterial ? <Tag size={16} /> : <Plus size={16} />} 
              {editingMaterial ? 'Cập nhật Vật tư' : 'Thêm Vật tư mới'}
            </h3>
            
            <form onSubmit={handleUpsert} className="grid grid-cols-1 md:grid-cols-6 gap-4 relative z-10 items-end">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black/40">Loại vật tư</label>
                  <input 
                    required
                    value={form.type}
                    onChange={e => setForm({...form, type: e.target.value})}
                    placeholder="Giấy, Mực..." 
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:outline-none focus:bg-white"
                  />
               </div>
               <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black uppercase text-black/40">Thông số kỹ thuật</label>
                  <input 
                    required
                    value={form.specification}
                    onChange={e => setForm({...form, specification: e.target.value})}
                    placeholder="C200, A3..." 
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:outline-none focus:bg-white"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black/40">Đơn vị</label>
                  <input 
                    required
                    value={form.unit}
                    onChange={e => setForm({...form, unit: e.target.value})}
                    placeholder="Tờ, Kg..." 
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:outline-none focus:bg-white"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black/40">Nhà cung cấp</label>
                  <div className="relative">
                    <Store size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
                    <input 
                      value={form.supplier || ''}
                      onChange={e => setForm({...form, supplier: e.target.value})}
                      placeholder="NCC..." 
                      className="w-full pl-9 pr-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:outline-none focus:bg-white"
                    />
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-black/40">Giá</label>
                  <div className="flex items-center gap-2">
                    <NumericInput 
                      value={form.price}
                      onChange={val => setForm({...form, price: val})}
                      className="!h-[46px]" // Matching height of other inputs
                    />
                    <Button type="submit" variant="primary" className="!p-3 min-w-[50px] !h-[46px]">
                       <Save size={20} />
                    </Button>
                  </div>
               </div>
            </form>
            {editingMaterial && (
               <button 
                 onClick={() => { setEditingMaterial(null); setForm({ type: '', specification: '', unit: '', price: 0, supplier: '' }); }}
                 className="mt-4 text-[10px] font-black uppercase text-rose-500 hover:underline"
               >
                 Hủy chỉnh sửa
               </button>
            )}
          </Card>

          {/* Table */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Kho định mức vật tư</h3>
                <span className="text-[10px] font-black text-black/30 bg-black/5 px-2 py-1 rounded border border-black/5 italic">Total: {materials.length} items</span>
             </div>
             
             <div className="border-[2.5px] border-black bg-white overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-[#FAF7F2] border-b-2 border-black">
                      <tr className="text-[10px] font-black uppercase tracking-widest text-black/60">
                         <th className="px-6 py-4 border-r-2 border-black/5">Loại vật tư</th>
                         <th className="px-6 py-4 border-r-2 border-black/5">Thông số kỹ thuật</th>
                         <th className="px-6 py-4 border-r-2 border-black/5 text-center">Đơn vị</th>
                         <th className="px-6 py-4 border-r-2 border-black/5">Nhà cung cấp</th>
                         <th className="px-6 py-4 text-right">Giá</th>
                         <th className="px-6 py-4 w-[100px] text-center">Sửa</th>
                      </tr>
                   </thead>
                   <tbody className="text-sm font-bold">
                      {materials.map((mat) => (
                        <tr key={mat.id} className="border-b-2 border-black/5 group hover:bg-[#D1FAE5]/10">
                           <td className="px-6 py-4 border-r-2 border-black/5 uppercase tracking-tighter">{mat.type}</td>
                           <td className="px-6 py-4 border-r-2 border-black/5">{mat.specification}</td>
                           <td className="px-6 py-4 border-r-2 border-black/5 text-center font-mono text-xs">{mat.unit}</td>
                           <td className="px-6 py-4 border-r-2 border-black/5">
                             <span className="text-[10px] font-black text-black/60 uppercase italic bg-neo-purple/10 px-2 py-1 rounded">
                               {mat.supplier || 'N/A'}
                             </span>
                           </td>
                           <td className="px-6 py-4 text-right tabular-nums">{formatNumber(mat.price)}đ</td>
                           <td className="px-6 py-4 text-center">
                             <button 
                               onClick={() => startEdit(mat)}
                               className="w-8 h-8 rounded-lg border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all group-hover:bg-[#D1FAE5]"
                             >
                               <Tag size={14} />
                             </button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                 </table>
             </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t-[3px] border-black bg-white flex justify-between items-center italic text-[10px] font-black text-black/30">
           Tự động đồng bộ với hệ thống snapshot giá sản phẩm • 2026 Paper Art Viet
        </div>

      </div>
    </div>
  );
}
