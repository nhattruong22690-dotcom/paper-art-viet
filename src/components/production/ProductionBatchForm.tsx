"use client";

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  User,
  Hash,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Search
} from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Worker {
  id: string;
  name: string;
  role: string;
}

interface BatchLogEntry {
  employeeId: string;
  staffName: string;
  date: string;
  quantityProduced: number;
  technicalErrorCount: number;
  materialErrorCount: number;
  note: string;
}

interface ProductionBatchFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productionOrder: {
    id: string;
    title: string;
    sku: string;
    quantityTarget: number;
    quantityCompleted: number;
  };
}

export default function ProductionBatchForm({
  isOpen,
  onClose,
  onSuccess,
  productionOrder
}: ProductionBatchFormProps) {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entries, setEntries] = useState<BatchLogEntry[]>([
    { 
      employeeId: '', 
      staffName: '', 
      date: new Date().toISOString().split('T')[0],
      quantityProduced: 0, 
      technicalErrorCount: 0, 
      materialErrorCount: 0, 
      note: '' 
    }
  ]);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      loadWorkers();
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const loadWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const res = await fetch('/api/production/workers');
      const data = await res.json();
      if (Array.isArray(data)) {
        setWorkers(data);
      }
    } catch (err) {
      console.error("Failed to load workers:", err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  const addEntry = () => {
    setEntries([...entries, { 
      employeeId: '', 
      staffName: '', 
      date: entries.length > 0 ? entries[entries.length - 1].date : new Date().toISOString().split('T')[0],
      quantityProduced: 0, 
      technicalErrorCount: 0, 
      materialErrorCount: 0, 
      note: '' 
    }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof BatchLogEntry, value: any) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };

    // If updating employeeId, also update staffName
    if (field === 'employeeId') {
      const selectedWorker = workers.find(w => w.id === value);
      newEntries[index].staffName = selectedWorker ? selectedWorker.name : '';
    }

    setEntries(newEntries);
  };

  const handleSubmit = async () => {
    // Basic validation
    const validEntries = entries.filter(e => e.employeeId && e.quantityProduced >= 0);
    if (validEntries.length === 0) {
      setErrorStatus("Vui lòng chọn ít nhất một nhân viên và nhập sản lượng.");
      return;
    }

    setIsSubmitting(true);
    setErrorStatus(null);

    try {
      const res = await fetch('/api/production/logs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logs: validEntries.map(e => ({
            productionOrderId: productionOrder.id,
            employeeId: e.employeeId,
            staffName: e.staffName,
            startTime: new Date(e.date + "T08:00:00Z"),
            endTime: new Date(e.date + "T17:00:00Z"),
            quantityProduced: Number(e.quantityProduced),
            technicalErrorCount: Number(e.technicalErrorCount),
            materialErrorCount: Number(e.materialErrorCount),
            note: e.note
          }))
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi khi ghi nhận dữ liệu.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorStatus(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCurrentProduced = entries.reduce((sum, e) => sum + Number(e.quantityProduced), 0);
  const remainingQty = Math.max(0, productionOrder.quantityTarget - productionOrder.quantityCompleted);
  const isOverTarget = totalCurrentProduced > remainingQty;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[var(--sidebar-width)] z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-[98vw] max-w-[1600px] h-[92vh] bg-white border-[2.5px] border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in duration-200">

        {/* Header */}
        <div className="p-6 border-b-[2.5px] border-black flex justify-between items-center bg-neo-yellow/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-neo-sm">
              <Plus size={24} strokeWidth={3} className="text-black" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Ghi nhận sản xuất hàng loạt</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded tracking-widest">{productionOrder.sku}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[200px]">{productionOrder.title}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors border-2 border-transparent hover:border-black">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* PO Summary Dashboard */}
        <div className="bg-gray-50 p-6 border-b-[2.5px] border-black grid grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-xl border-2 border-black shadow-neo-sm">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Mục tiêu PO</p>
            <p className="text-lg font-black">{productionOrder.quantityTarget}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border-2 border-black shadow-neo-sm">
            <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-1">Đã hoàn thành</p>
            <p className="text-lg font-black text-green-600">{productionOrder.quantityCompleted}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border-2 border-black shadow-neo-sm">
            <p className="text-[9px] font-black text-neo-blue uppercase tracking-widest mb-1">Cần thêm</p>
            <p className="text-lg font-black text-neo-blue">{remainingQty}</p>
          </div>
          <div className={cn(
            "p-3 rounded-xl border-2 border-black shadow-neo-sm transition-colors",
            isOverTarget ? "bg-red-500 text-white animate-pulse" : "bg-neo-yellow text-black"
          )}>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-70">Ghi nhận đợt này</p>
            <p className="text-lg font-black">{totalCurrentProduced}</p>
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar min-h-0">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500">
                <th className="pb-4 text-left min-w-[240px]">Nhân viên</th>
                <th className="pb-4 text-center w-40">Ngày ghi nhận</th>
                <th className="pb-4 text-center w-32">Sản lượng đạt</th>
                <th className="pb-4 text-center w-32">Lỗi KT</th>
                <th className="pb-4 text-center w-32">Lỗi VT</th>
                <th className="pb-4 text-left">Ghi chú</th>
                <th className="pb-4 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={idx} className="group border-b border-gray-100 last:border-none">
                  <td className="py-3 pr-4">
                    <WorkerSearchableSelect 
                      workers={workers}
                      selectedId={entry.employeeId}
                      onSelect={(val) => updateEntry(idx, 'employeeId', val)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="date"
                      className="form-input h-11 w-full text-center font-bold text-xs border-black active:shadow-neo transition-all"
                      value={entry.date}
                      onChange={(e) => updateEntry(idx, 'date', e.target.value)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      className="form-input h-11 w-full text-center font-black tabular-nums border-neo-mint shadow-neo-mint/10 !min-w-[80px]"
                      placeholder="0"
                      min="0"
                      value={entry.quantityProduced || ''}
                      onChange={(e) => updateEntry(idx, 'quantityProduced', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      className="form-input h-11 w-full text-center font-bold tabular-nums border-red-200 text-red-500 !min-w-[70px]"
                      placeholder="0"
                      min="0"
                      value={entry.technicalErrorCount || ''}
                      onChange={(e) => updateEntry(idx, 'technicalErrorCount', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="number"
                      className="form-input h-11 w-full text-center font-bold tabular-nums border-amber-200 text-amber-500 !min-w-[70px]"
                      placeholder="0"
                      min="0"
                      value={entry.materialErrorCount || ''}
                      onChange={(e) => updateEntry(idx, 'materialErrorCount', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="py-3 px-2">
                    <input
                      type="text"
                      className="form-input h-11 w-full text-xs"
                      placeholder="Ghi chú (tùy chọn)..."
                      value={entry.note}
                      onChange={(e) => updateEntry(idx, 'note', e.target.value)}
                    />
                  </td>
                  <td className="py-3 pl-2">
                    <button
                      onClick={() => removeEntry(idx)}
                      disabled={entries.length === 1}
                      className={cn(
                        "p-2 rounded-lg transition-colors border-2",
                        entries.length === 1 ? "opacity-20 cursor-not-allowed border-transparent" : "text-red-400 hover:text-red-500 border-transparent hover:border-red-500 hover:bg-red-50"
                      )}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={addEntry}
            className="mt-6 flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-black hover:border-solid hover:bg-neo-yellow/10 transition-all font-black text-[10px] uppercase tracking-widest"
          >
            <Plus size={16} strokeWidth={3} />
            Thêm dòng nhân viên
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t-[2.5px] border-black bg-gray-50 flex flex-col gap-4">
          {errorStatus && (
            <div className="p-3 bg-red-50 border-2 border-red-500 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-bounce">
              <AlertCircle size={14} />
              {errorStatus}
            </div>
          )}

          {isOverTarget && (
            <div className="p-3 bg-neo-yellow/20 border-2 border-black rounded-xl text-xs font-bold flex items-center gap-2 text-black">
              <AlertTriangle size={14} className="text-neo-pink" />
              <span>Chú ý: Tổng sản lượng ghi nhận ({totalCurrentProduced}) đang vượt quá số lượng còn lại cần làm ({remainingQty}).</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl border-2 border-black font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "px-8 py-3 rounded-xl border-[2.5px] border-black bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-neo hover:shadow-neo-active active:translate-y-0.5 transition-all flex items-center gap-2",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>Đang lưu...</>
              ) : (
                <>
                  <Save size={16} strokeWidth={3} />
                  Lưu tất cả ghi nhận
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
function WorkerSearchableSelect({ workers, selectedId, onSelect }: { workers: Worker[], selectedId: string, onSelect: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedWorker = workers.find(w => w.id === selectedId);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    
    // Update position on scroll or resize if open
    const handleUpdate = () => {
      if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.bottom + 8,
          left: rect.left,
          width: rect.width
        });
      }
    };

    if (isOpen) {
      handleUpdate();
      window.addEventListener('scroll', handleUpdate, true);
      window.addEventListener('resize', handleUpdate);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isOpen]);

  const filtered = workers.filter(w => 
    w.name.toLowerCase().includes(search.toLowerCase()) || 
    (w as any).code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="form-input !pl-10 h-11 w-full font-bold bg-white text-sm flex items-center cursor-pointer overflow-hidden border-2 border-black"
      >
        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <span className={cn("truncate", !selectedWorker && "text-gray-400 font-normal")}>
          {selectedWorker ? selectedWorker.name : "--- Chọn nhân sự ---"}
        </span>
        <ChevronRight size={14} className={cn("absolute right-3 top-1/2 -translate-y-1/2 transition-transform", isOpen ? "rotate-90" : "rotate-0")} />
      </div>

      {isOpen && (
        <div 
          style={{ 
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
          }}
          className="z-[9999] bg-white border-2 border-black rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
            <Search size={14} className="text-gray-400 ml-1" />
            <input 
              autoFocus
              className="flex-1 bg-transparent border-none focus:ring-0 text-xs font-bold"
              placeholder="Tìm theo tên hoặc mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filtered.length > 0 ? filtered.map(w => (
              <button
                key={w.id}
                onClick={() => {
                  onSelect(w.id);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left hover:bg-neo-purple/10 flex flex-col gap-0.5 transition-colors border-b border-gray-50 last:border-0",
                  selectedId === w.id && "bg-neo-purple/5"
                )}
              >
                <div className="flex items-center justify-between">
                   <span className="text-xs font-black text-black">{w.name}</span>
                   <span className="text-[10px] font-black bg-black text-white px-1.5 py-0.5 rounded leading-none">{(w as any).code}</span>
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{w.role || w.position}</span>
              </button>
            )) : (
              <div className="p-4 text-center text-[9px] font-black text-gray-300 uppercase italic">Không tìm thấy</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

