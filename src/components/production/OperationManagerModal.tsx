"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Edit2, Package, FileSpreadsheet, Download, Loader2, Database, Tag, Save, Hammer, Beaker, HardDrive, Cpu, Settings, Activity, Store, ChevronRight } from 'lucide-react';
import { getAllOperations, upsertOperation, bulkUpsertOperations } from '@/services/operation.service';
import * as XLSX from 'xlsx';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Operation } from '@/types/bom';
import { useScrollLock } from '@/hooks/useScrollLock';

interface OperationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OperationManagerModal({ isOpen, onClose }: OperationManagerModalProps) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [editingOp, setEditingOp] = useState<Partial<Operation> | null>(null);
  const [form, setForm] = useState<Partial<Operation>>({
    type: '',
    specification: '',
    unit: '',
    price: 0,
    supplier: ''
  });

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      loadOperations();
    }
  }, [isOpen]);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const data = await getAllOperations();
      setOperations(data);
    } catch (err: any) {
      console.error('Failed to load operations details:', err?.message || err || 'Unknown Error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await upsertOperation(form);
      setForm({ type: '', specification: '', unit: '', price: 0, supplier: '' });
      setEditingOp(null);
      loadOperations();
    } catch (err: any) {
      console.error('Failed to save operation details:', err?.message || err || 'Unknown Error');
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
        const opsToInsert = data.map((row: any) => ({
          type: row["Loại"] || row["Type"] || "",
          specification: row["Thông số"] || row["Specification"] || row["Name"] || "",
          unit: row["Đơn vị"] || row["Unit"] || "Lần",
          price: Number(row["Giá"] || row["Price"] || row["Cost"] || 0),
          supplier: row["Nhà cung cấp"] || row["Supplier"] || ""
        })).filter(o => o.specification);

        if (opsToInsert.length > 0) {
          await bulkUpsertOperations(opsToInsert);
          loadOperations();
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
      { "Loại": "Laser", "Thông số": "Cắt bao thư", "Đơn vị": "Lần", "Giá": 500, "Nhà cung cấp": "Nội bộ" },
      { "Loại": "Dán", "Thông số": "Dán keo thủ công", "Đơn vị": "Cái", "Giá": 1200, "Nhà cung cấp": "Tổ Gia công 1" }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "mau_nhap_cong_doan.xlsx");
  };

  const startEdit = (op: Operation) => {
    setEditingOp(op);
    setForm(op);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[var(--sidebar-width)] z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-5xl h-[85vh] bg-[#FAF7F2] border-[3px] border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden">

        {/* HEADER */}
        <div className="px-10 py-8 border-b-[3px] border-black flex justify-between items-center bg-black text-white relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-neo-purple/20 to-transparent pointer-events-none" />
          
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-14 h-14 bg-neo-purple/20 border-2 border-neo-purple/30 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.3)]">
              <Cpu size={28} strokeWidth={3} className="text-neo-purple" />
            </div>
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2">
                <span>Cấu hình Master</span>
                <ChevronRight size={10} strokeWidth={3} />
                <span className="text-neo-purple">Danh mục Công đoạn</span>
              </nav>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
                Quản lý <span className="text-neo-purple underline decoration-[3px] underline-offset-4">Danh mục Công đoạn</span>
              </h1>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
                Hệ thống Master Data 5 cột tiêu chuẩn
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportExcel} 
              className="hidden" 
              accept=".xlsx, .xls" 
            />
            <button 
              onClick={downloadTemplate}
              className="px-6 h-12 bg-white border-[2.5px] border-black rounded-xl flex items-center gap-2 font-black text-[11px] uppercase bg-white hover:bg-neo-purple transition-all shadow-[4px_4px_0px_0px_rgba(139,92,246,0.5)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-black"
            >
              <Download size={18} strokeWidth={3} />
              Mẫu Excel
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="px-6 h-12 bg-neo-purple border-[2.5px] border-black rounded-xl flex items-center gap-2 font-black text-[11px] uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none text-black"
            >
              {importing ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} strokeWidth={3} />}
              Nhập Excel
            </button>
            <button onClick={onClose} className="w-12 h-12 bg-white border-[2.5px] border-black rounded-xl flex items-center justify-center text-black hover:bg-neo-red transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
              <X size={24} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10">

          {/* Form */}
          <Card className="!p-8 bg-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#BFDBFE]/20 rounded-full translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              {editingOp ? <Tag size={16} /> : <Plus size={16} />}
              {editingOp ? 'Cập nhật Công đoạn' : 'Thêm Công đoạn mới'}
            </h3>

            <form onSubmit={handleUpsert} className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40">Loại công đoạn</label>
                <input
                  required
                  value={form.type}
                  onChange={e => setForm({...form, type: e.target.value})}
                  placeholder="Cắt, In, Dán..."
                  className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:outline-none focus:bg-white"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40">Thông số kỹ thuật</label>
                <input
                  required
                  value={form.specification}
                  onChange={e => setForm({...form, specification: e.target.value})}
                  placeholder="Laser CO2, Nhiệt độ..."
                  className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:outline-none focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-black/40">Đơn vị</label>
                <input
                  required
                  value={form.unit}
                  onChange={e => setForm({...form, unit: e.target.value})}
                  placeholder="Lần, Tờ..."
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
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={e => setForm({...form, price: Number(e.target.value)})}
                    className="w-full px-4 py-3 bg-[#FAF7F2] border-[2px] border-black text-sm font-bold focus:outline-none focus:bg-white"
                  />
                  <Button type="submit" variant="primary" className="!p-3 min-w-[50px]">
                    <Save size={20} />
                  </Button>
                </div>
              </div>
            </form>
            {editingOp && (
              <button
                onClick={() => { setEditingOp(null); setForm({ type: '', specification: '', unit: '', price: 0, supplier: '' }); }}
                className="mt-4 text-[10px] font-black uppercase text-rose-500 hover:underline"
              >
                Hủy chỉnh sửa
              </button>
            )}
          </Card>

          {/* Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-[0.2em]">Danh sách công đoạn</h3>
              <span className="text-[10px] font-black text-black/30 bg-black/5 px-2 py-1 rounded border border-black/5 italic">
                Total: {operations.length} items
              </span>
            </div>

            <div className="border-[2.5px] border-black bg-white overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#FAF7F2] border-b-2 border-black">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-black/60">
                    <th className="px-6 py-4 border-r-2 border-black/5">Loại công đoạn</th>
                    <th className="px-6 py-4 border-r-2 border-black/5">Thông số kỹ thuật</th>
                    <th className="px-6 py-4 border-r-2 border-black/5 text-center">Đơn vị</th>
                    <th className="px-6 py-4 border-r-2 border-black/5">Nhà cung cấp</th>
                    <th className="px-6 py-4 text-right">Giá</th>
                    <th className="px-6 py-4 w-[100px] text-center">Sửa</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-bold">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-black/30 text-xs uppercase tracking-widest">
                        Đang tải...
                      </td>
                    </tr>
                  ) : operations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-black/30 text-xs uppercase tracking-widest">
                        Chưa có công đoạn nào. Thêm mới ở trên.
                      </td>
                    </tr>
                  ) : operations.map((op) => (
                    <tr key={op.id} className="border-b-2 border-black/5 group hover:bg-[#BFDBFE]/10">
                      <td className="px-6 py-4 border-r-2 border-black/5 uppercase tracking-tighter">{op.type}</td>
                      <td className="px-6 py-4 border-r-2 border-black/5">{op.specification}</td>
                      <td className="px-6 py-4 border-r-2 border-black/5 text-center font-mono text-xs">{op.unit}</td>
                      <td className="px-6 py-4 border-r-2 border-black/5">
                        <span className="text-[10px] font-black text-black/60 uppercase italic bg-neo-purple/10 px-2 py-1 rounded">
                          {op.supplier || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right tabular-nums">{op.price?.toLocaleString()}đ</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => startEdit(op)}
                          className="w-8 h-8 rounded-lg border-2 border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all group-hover:bg-[#BFDBFE]"
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
        <div className="p-6 bg-white border-t-[3px] border-black flex items-center gap-2 text-[10px] font-black text-black/40 uppercase tracking-widest">
          <Activity size={12} className="text-blue-500 animate-pulse" />
          Danh mục công đoạn ảnh hưởng trực tiếp đến biến phí gia công trong BOM
        </div>

      </div>
    </div>
  );
}
