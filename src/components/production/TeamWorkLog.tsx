"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Copy, 
  Trash2, 
  Save, 
  AlertTriangle,
  ClipboardList,
  Calendar,
  Search,
  CheckCircle2,
  Package,
  Layers,
  QrCode,
  Loader2,
  ChevronDown,
  User as UserIcon,
  History,
  ArrowRight,
  X,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { createBatchWorkLogs, getPOMaterialNeeds } from '@/services/workLog.service';
import { useNotification } from "@/context/NotificationContext";
import { getMaterialBatches } from '@/services/material.service';
import QRScanner from '@/components/common/QRScanner';
import HelpIcon from '@/components/common/HelpIcon';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces
interface ProductionOrder {
  id: string;
  sku: string;
  productName: string;
  contractCode?: string;
  customerName?: string;
  quantityTarget: number;
  quantityCompleted: number;
  order?: {
    contractCode: string;
    customer: { name: string };
  };
}

interface Worker {
  id: string;
  name: string;
}

interface LogEntry {
  id: string;
  productionOrderId: string;
  userId: string;
  quantityProduced: number;
  technicalErrorCount: number;
  materialErrorCount: number;
  errorNote: string;
}

interface BOMMaterial {
  materialId: string;
  name: string;
  sku: string;
  unit: string;
  requiredPerUnit: number;
  selectedBatchId?: string;
  availableBatches?: any[];
}

export default function TeamWorkLog() {
  const { showToast, showModal } = useNotification();
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [bomItems, setBomItems] = useState<BOMMaterial[]>([]);
  const [fetchingBOM, setFetchingBOM] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Fetch production orders and workers on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [ordersRes, workersRes] = await Promise.all([
          fetch('/api/production/orders'),
          fetch('/api/production/workers')
        ]);
        
        const ordersData = await ordersRes.json();
        const workersData = await workersRes.json();
        
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setWorkers(Array.isArray(workersData) ? workersData : []);
        
        if (entries.length === 0) {
          handleAddRow();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      loadBOM(selectedOrderId);
    } else {
      setBomItems([]);
    }
  }, [selectedOrderId]);

  const loadBOM = async (orderId: string) => {
    setFetchingBOM(true);
    try {
      const items = await getPOMaterialNeeds(orderId);
      const mappedBOM = await Promise.all(items.map(async (item: any) => {
        const batches = await getMaterialBatches(item.materialId);
        return {
          materialId: item.materialId,
          name: item.material.name,
          sku: item.material.sku,
          unit: item.material.unit,
          requiredPerUnit: Number(item.quantity),
          availableBatches: batches,
          selectedBatchId: batches[0]?.id || '' 
        };
      }));
      setBomItems(mappedBOM);
    } catch (error) {
      console.error('Failed to load BOM:', error);
    } finally {
      setFetchingBOM(false);
    }
  };

  const handleAddRow = () => {
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      productionOrderId: selectedOrderId,
      userId: '',
      quantityProduced: 0,
      technicalErrorCount: 0,
      materialErrorCount: 0,
      errorNote: ''
    };
    setEntries(prev => [...prev, newEntry]);
  };

  const handleCopyRow = (index: number) => {
    const entryToCopy = entries[index];
    const newEntry: LogEntry = {
      ...entryToCopy,
      id: Math.random().toString(36).substr(2, 9),
      userId: '', 
    };
    const newEntries = [...entries];
    newEntries.splice(index + 1, 0, newEntry);
    setEntries(newEntries);
  };

  const handleRemoveRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof LogEntry, value: any) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleSaveAll = async () => {
    if (!selectedOrderId) {
      showToast('warning', "Vui lòng chọn Lệnh sản xuất");
      return;
    }
    
    const validEntries = entries.filter(e => e.userId && (e.quantityProduced > 0 || e.technicalErrorCount > 0 || e.materialErrorCount > 0));
    if (validEntries.length === 0) {
      showToast('warning', "Vui lòng nhập ít nhất một dòng log hợp lệ");
      return;
    }

    if (bomItems.some(item => !item.selectedBatchId && (item.availableBatches?.length ?? 0) > 0)) {
       showModal('warning', "Thiếu thông tin vật tư", "Vui lòng chọn Lô vật tư cho tất cả nguyên liệu trong BOM");
       return;
    }

    setIsSaving(true);
    try {
      const batchesUsed = bomItems
        .filter(item => item.selectedBatchId)
        .map(item => ({
          batchId: item.selectedBatchId!,
          materialId: item.materialId,
          quantity: totalBatchQty * item.requiredPerUnit
        }));

      const payload = validEntries.map(e => ({
        productionOrderId: selectedOrderId,
        employeeId: e.userId,
        staffName: workers.find(w => w.id === e.userId)?.name,
        quantityProduced: e.quantityProduced,
        technicalErrorCount: e.technicalErrorCount,
        materialErrorCount: e.materialErrorCount,
        errorNote: e.errorNote,
        startTime: new Date(workDate),
        endTime: new Date(workDate)
      }));

      await createBatchWorkLogs(payload, batchesUsed);
      showToast('success', `Đã lưu thành công ${validEntries.length} bản ghi báo cáo!`);
      setEntries([entries[0]]); 
      loadBOM(selectedOrderId); 
    } catch (error) {
      console.error("Save failed:", error);
      showModal('error', 'Lỗi khi lưu báo cáo', String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const totalBatchQty = entries.reduce((sum, e) => sum + e.quantityProduced + e.technicalErrorCount + e.materialErrorCount, 0);
  const currentOrder = orders.find(o => o.id === selectedOrderId);
  
  const orderDisplayInfo = currentOrder ? {
    contractCode: currentOrder.order?.contractCode || currentOrder.sku,
    customerName: currentOrder.order?.customer?.name || 'Vãng lai'
  } : null;

  const isOverLimit = currentOrder ? (totalBatchQty + currentOrder.quantityCompleted > currentOrder.quantityTarget * 1.05) : false;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 px-4 md:px-0">
      {/* Header Section */}
      <div className="px-10 py-8 border-b-[3px] border-black flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-black text-white relative overflow-hidden rounded-[2.5rem] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-neo-purple/20 to-transparent pointer-events-none" />
        
        <div className="flex items-center gap-6 relative z-10">
           <div className="w-16 h-16 bg-neo-purple/20 border-2 border-neo-purple/30 rounded-[2rem] flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.3)]">
              <ClipboardList size={28} strokeWidth={3} className="text-neo-purple" />
           </div>
           <div>
              <nav className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 opacity-100">
                <Users size={12} strokeWidth={3} className="text-neo-purple" />
                <span>Sản xuất</span>
                <ChevronRight size={10} strokeWidth={3} />
                <span className="text-neo-purple italic">Báo cáo tổ trưởng</span>
              </nav>
              <h1 className="text-2xl font-black text-white tracking-tight italic uppercase">
                Khai báo <span className="text-neo-purple underline decoration-[3px] underline-offset-4">Sản lượng hàng loạt</span>
              </h1>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
                Quản lý ghi nhận sản lượng theo nhóm nhân sự
              </p>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
           <div className="flex-1 md:w-80 group">
              <div className="relative">
                <select 
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-background border-2 border-black/10 rounded-2xl text-sm font-semibold text-foreground outline-none appearance-none cursor-pointer focus:border-primary/30 transition-all uppercase tracking-tight"
                >
                  <option value="">-- Chọn lệnh sản xuất --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      [{o.order?.contractCode || 'NO-REF'}] {o.productName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-focus-within:text-primary transition-colors" />
              </div>
           </div>
           
           <div className="w-full md:w-44 relative group">
              <input 
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-background border-2 border-black/10 rounded-2xl text-xs font-semibold text-foreground outline-none focus:border-primary/30 transition-all"
              />
              <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-focus-within:text-primary transition-colors" />
           </div>

           <button 
             onClick={() => setIsScanning(true)}
             className="w-12 h-12 bg-card border border-border/10 rounded-2xl flex items-center justify-center text-muted-foreground/30 hover:text-primary hover:border-primary/20 transition-all shadow-sm active:scale-95 shrink-0"
             title="Quét mã QR"
           >
             <QrCode size={20} />
           </button>
        </div>
      </div>

      {orderDisplayInfo && (
        <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-5 flex items-center justify-between animate-in slide-in-from-top-4 shadow-sm">
           <div className="flex items-center gap-4 text-sm font-semibold text-primary">
              <History size={18} className="opacity-40" />
              <span>Đang báo cáo cho: <span className="text-foreground uppercase">{orderDisplayInfo.customerName}</span> (HĐ: <span className="text-primary italic font-semibold">{orderDisplayInfo.contractCode}</span>)</span>
           </div>
           <button onClick={() => setSelectedOrderId('')} className="p-2.5 hover:bg-primary/10 rounded-2xl text-primary/40 hover:text-primary transition-all active:scale-95">
              <X size={18} />
           </button>
        </div>
      )}

      {/* BOM Section */}
      {selectedOrderId && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8">
          <div className="flex items-center justify-between px-4">
             <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-3 opacity-60">
                <Package size={18} className="text-primary opacity-100" />
                Vật tư tiêu hao (BOM)
             </h3>
             {fetchingBOM && <Loader2 size={16} className="animate-spin text-primary" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {bomItems.map((item, idx) => (
               <div key={item.materialId} className="bg-card p-6 rounded-[2.5rem] border border-border/10 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all flex flex-col gap-6 group">
                  <div className="flex justify-between items-start">
                     <div className="min-w-0 pr-4">
                        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 opacity-40">{item.sku}</p>
                        <h4 className="font-semibold text-foreground text-sm truncate uppercase tracking-tight group-hover:text-primary transition-colors">{item.name}</h4>
                     </div>
                     <span className="text-[9px] font-semibold bg-background border border-border/10 px-2 py-1 rounded-xl text-muted-foreground uppercase opacity-40 tracking-widest shrink-0">
                        {item.unit}
                     </span>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest ml-1 opacity-40">Lô sản xuất</label>
                        <div className="relative group/select">
                          <select 
                            value={item.selectedBatchId}
                            onChange={(e) => {
                               const newBOM = [...bomItems];
                               newBOM[idx].selectedBatchId = e.target.value;
                               setBomItems(newBOM);
                            }}
                            className="w-full pl-4 pr-10 py-2.5 bg-background border-2 border-black/5 rounded-2xl text-[11px] font-semibold text-foreground outline-none appearance-none cursor-pointer focus:border-primary/30 transition-all uppercase tracking-tight"
                          >
                            <option value="">-- Chọn lô vật tư --</option>
                            {item.availableBatches?.map((b: any) => (
                              <option key={b.id} value={b.id}>
                                {b.batchCode} (Tồn: {Number(b.remainQuantity)})
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-focus-within/select:text-primary transition-colors" />
                        </div>
                     </div>

                     <div className="flex justify-between items-end pt-2">
                        <div>
                          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 opacity-30">Dự tính sử dụng</p>
                          <p className="text-2xl font-semibold text-foreground tabular-nums tracking-tighter">
                             {(totalBatchQty * item.requiredPerUnit).toFixed(2)} <span className="text-[10px] font-semibold text-muted-foreground/30 uppercase underline underline-offset-4 decoration-muted-foreground/10">{item.unit}</span>
                          </p>
                        </div>
                        {item.selectedBatchId && (
                          <div className="w-10 h-10 bg-emerald-500/5 border border-emerald-500/10 rounded-[1.25rem] flex items-center justify-center text-emerald-500 shadow-sm animate-in zoom-in duration-300">
                            <CheckCircle2 size={20} />
                          </div>
                        )}
                     </div>
                  </div>
               </div>
             ))}

             {bomItems.length === 0 && !fetchingBOM && (
               <div className="col-span-full bg-card border-2 border-2 border-black/10 rounded-[3rem] p-16 flex flex-col items-center justify-center text-muted-foreground/20">
                  <Package size={48} className="mb-4 opacity-10" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest italic">Không có dữ liệu BOM cho lệnh này</p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-card border border-border/10 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black text-white border-b-2 border-black">
                <th className="px-8 py-5 w-16 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">#</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Đối tượng Nhân sự</th>
                <th className="px-6 py-5 w-36 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Sản lượng</th>
                <th className="px-6 py-5 w-36 text-center text-[10px] font-black uppercase tracking-[0.2em] text-rose-300">Lỗi Thợ</th>
                <th className="px-6 py-5 w-36 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Lỗi Vật tư</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Ký lục / Ghi chú</th>
                <th className="px-8 py-5 w-28 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              {entries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-background transition-all group">
                  <td className="px-8 py-6 text-center text-[10px] font-semibold text-muted-foreground opacity-20 italic">{(index + 1).toString().padStart(2, '0')}</td>
                  <td className="px-8 py-6 min-w-[240px]">
                    <div className="relative group/worker">
                      <select 
                        value={entry.userId}
                        onChange={(e) => updateEntry(entry.id, 'userId', e.target.value)}
                        className="w-full bg-transparent border-b-2 border-2 border-black/10 focus:border-primary py-2 outline-none text-sm font-semibold text-foreground transition-all appearance-none uppercase tracking-tight"
                      >
                        <option value="">-- Chọn công nhân --</option>
                        {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      <UserIcon size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none group-focus-within/worker:text-primary transition-colors" />
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <input 
                      type="number"
                      value={entry.quantityProduced || ''}
                      onChange={(e) => updateEntry(entry.id, 'quantityProduced', parseInt(e.target.value) || 0)}
                      className="w-full bg-background border border-border/10 rounded-xl py-2.5 text-center text-sm font-semibold text-foreground focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all tabular-nums"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-6">
                    <input 
                      type="number"
                      value={entry.technicalErrorCount || ''}
                      onChange={(e) => updateEntry(entry.id, 'technicalErrorCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-destructive/5 border border-destructive/10 rounded-xl py-2.5 text-center text-sm font-semibold text-destructive focus:ring-4 focus:ring-destructive/5 focus:border-destructive/20 outline-none transition-all tabular-nums"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-6">
                    <input 
                      type="number"
                      value={entry.materialErrorCount || ''}
                      onChange={(e) => updateEntry(entry.id, 'materialErrorCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-background border border-border/10 rounded-xl py-2.5 text-center text-sm font-semibold text-foreground focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none transition-all tabular-nums"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <input 
                      type="text"
                      value={entry.errorNote}
                      onChange={(e) => updateEntry(entry.id, 'errorNote', e.target.value)}
                      className="w-full bg-transparent border-b border-border/5 py-2 text-[11px] font-semibold text-muted-foreground focus:text-foreground focus:border-primary transition-all outline-none italic placeholder:opacity-20 uppercase tracking-tight"
                      placeholder="Ghi chú nhanh..."
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                       <button onClick={() => handleCopyRow(index)} className="p-2.5 bg-card border border-border/10 text-muted-foreground/30 hover:text-primary hover:border-primary/20 hover:bg-primary/5 rounded-2xl transition-all active:scale-95"><Copy size={16} /></button>
                       <button onClick={() => handleRemoveRow(entry.id)} className="p-2.5 bg-card border border-border/10 text-muted-foreground/30 hover:text-destructive hover:border-destructive/20 hover:bg-destructive/5 rounded-2xl transition-all active:scale-95"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-8 bg-background/50 border-t border-border/10 flex flex-col lg:flex-row justify-between items-center gap-8 mt-auto">
           <button 
             onClick={handleAddRow}
             className="px-8 py-4 bg-card border-2 border-2 border-black/10 rounded-[2rem] text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] shadow-sm hover:text-primary hover:border-primary/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] w-full lg:w-auto"
           >
              <Plus size={18} /> Thêm nhân sự báo cáo
           </button>

           <div className="flex items-center gap-10 w-full lg:w-auto">
              <div className="text-right flex flex-col items-end shrink-0">
                 <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1 opacity-30">Tổng kê khai tạm tính</p>
                 <p className={cn("text-3xl font-semibold tabular-nums tracking-tighter transition-colors", isOverLimit ? "text-destructive" : "text-foreground")}>
                   {totalBatchQty.toLocaleString()} <span className="text-xs font-semibold text-muted-foreground/30 uppercase ml-1 underline underline-offset-8 decoration-muted-foreground/10">đơn vị</span>
                 </p>
              </div>
              <button 
               onClick={handleSaveAll}
               disabled={isSaving || isOverLimit}
               className="w-full lg:w-auto min-w-[220px] py-5 bg-foreground text-white disabled:bg-muted-foreground/20 rounded-[2rem] font-semibold uppercase tracking-[0.2em] shadow-xl shadow-black/10 hover:bg-foreground/90 transition-all flex items-center justify-center gap-4 active:scale-95"
              >
                 {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                 {isSaving ? 'Đang lưu...' : 'Xác nhận Hồ sơ'}
              </button>
           </div>
        </div>
      </div>

      {currentOrder && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-bottom-6">
            <div className="bg-card p-6 rounded-[2rem] border border-border/10 flex items-center gap-5 shadow-sm">
              <div className="w-14 h-14 bg-background border border-border/10 rounded-2xl flex items-center justify-center text-muted-foreground/20">
                 <Package size={24} />
              </div>
              <div>
                 <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest opacity-40">Định mức Lệnh</p>
                 <p className="text-xl font-semibold text-foreground tracking-tight">{currentOrder.quantityTarget.toLocaleString()}</p>
              </div>
            </div>
            
            <div className={cn(
                "bg-card p-6 rounded-[2rem] border border-border/10 flex items-center gap-5 shadow-sm relative overflow-hidden",
                isOverLimit ? "border-l-4 border-l-destructive shadow-destructive/5" : (currentOrder.quantityCompleted + totalBatchQty >= currentOrder.quantityTarget ? "border-l-4 border-l-emerald-500 shadow-emerald-500/5" : "border-l-4 border-l-primary shadow-primary/5")
            )}>
              <div className="w-14 h-14 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                 <History size={24} />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-baseline mb-1">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest opacity-40">Tổng thực hiện</p>
                    <span className="text-[10px] font-semibold text-primary">{Math.round(((currentOrder.quantityCompleted + totalBatchQty) / currentOrder.quantityTarget) * 100)}%</span>
                 </div>
                 <p className="text-xl font-semibold text-foreground tracking-tight tabular-nums">{(currentOrder.quantityCompleted + totalBatchQty).toLocaleString()}</p>
              </div>
            </div>

            <div className="md:col-span-2 bg-card p-8 rounded-[2rem] border border-border/10 flex flex-col justify-center shadow-sm">
               <div className="h-4 bg-background border border-border/10 rounded-full overflow-hidden shadow-inner p-1">
                  <div 
                    className={cn(
                        "h-full rounded-full transition-all duration-1000 shadow-lg",
                        isOverLimit ? "bg-destructive shadow-destructive/20" : (currentOrder.quantityCompleted + totalBatchQty >= currentOrder.quantityTarget ? "bg-emerald-500 shadow-emerald-500/20" : "bg-primary shadow-primary/20")
                    )}
                    style={{ width: `${Math.min(100, ((currentOrder.quantityCompleted + totalBatchQty) / currentOrder.quantityTarget) * 100)}%` }}
                  />
               </div>
               {isOverLimit && (
                 <p className="text-[9px] font-semibold text-destructive uppercase tracking-widest mt-3 flex items-center gap-2 animate-pulse">
                    <AlertTriangle size={14} /> Cảnh báo: Kê khai vượt định mức vật tư (+5%)
                 </p>
               )}
            </div>
        </div>
      )}

      {isScanning && (
        <QRScanner 
          onScan={(data) => {
            const matched = orders.find(o => o.id === data || o.sku === data);
            if (matched) setSelectedOrderId(matched.id);
            else showToast('error', "Không tìm thấy Lệnh sản xuất");
            setIsScanning(false);
          }}
          onClose={() => setIsScanning(false)}
          title="Quét mã Lệnh Sản Xuất"
        />
      )}
    </div>
  );
}
