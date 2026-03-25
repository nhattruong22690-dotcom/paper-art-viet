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
  MapPin,
  QrCode,
  Loader2,
  ChevronDown,
  User
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
        
        // Initial empty entry
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
          selectedBatchId: batches[0]?.id || '' // Default to FIFO first batch
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
      userId: '', // Don't copy the user
    };
    const newEntries = [...entries];
    newEntries.splice(index + 1, 0, newEntry);
    setEntries(newEntries);
  };

  const handleRemoveRow = (id: string) => {
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

      const validEntries = entries
        .filter(e => e.userId && (e.quantityProduced > 0 || e.technicalErrorCount > 0 || e.materialErrorCount > 0))
        .map(e => ({
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

      await createBatchWorkLogs(validEntries, batchesUsed);
      showToast('success', `Đã lưu thành công ${validEntries.length} bản ghi báo cáo!`);
      setEntries([entries[0]]); // Reset
      loadBOM(selectedOrderId); // Refresh stock
    } catch (error) {
      console.error("Save failed:", error);
      showModal('error', 'Lỗi khi lưu báo cáo', String(error));
    } finally {
      setIsSaving(false);
    }
  };

  const totalBatchQty = entries.reduce((sum, e) => sum + e.quantityProduced + e.technicalErrorCount + e.materialErrorCount, 0);
  const currentOrder = orders.find(o => o.id === selectedOrderId);
  
  // Thông tin hiển thị cho worker
  const orderDisplayInfo = currentOrder ? {
    contractCode: currentOrder.order?.contractCode || currentOrder.sku,
    customerName: currentOrder.order?.customer?.name || 'Vãng lai'
  } : null;

  const isOverLimit = currentOrder ? (totalBatchQty + currentOrder.quantityCompleted > currentOrder.quantityTarget * 1.05) : false;

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-1000">
      {/* HEADER SECTION */}
      <div className="retro-card !p-0 !bg-white overflow-hidden shadow-2xl relative border-2">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
           <Users size={300} strokeWidth={0.5} className="text-retro-sepia" />
        </div>
        <div className="washi-tape-top" />
        
        <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-retro-sepia flex items-center justify-center text-retro-paper rotate-3 hover:rotate-0 transition-transform shadow-xl">
                <Users size={32} strokeWidth={1.5} />
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-black text-retro-sepia uppercase tracking-tighter italic font-typewriter underline decoration-double decoration-retro-mustard/30 underline-offset-4">
                    Khai báo <span className="text-retro-brick">Sản lượng Tổ đội</span>
                  </h1>
                  <HelpIcon />
                </div>
                <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] italic opacity-60 font-typewriter">Hồ sơ sản xuất & Đối chiếu tiêu hao — MCMLXXXIV</p>
             </div>
          </div>

          <div className="flex flex-wrap items-end gap-6 w-full md:w-auto">
             {orderDisplayInfo && (
                <div className="bg-retro-brick text-white px-6 py-4 shadow-[4px_4px_0px_#3E272333] flex flex-col justify-center animate-in slide-in-from-right-10 duration-500 font-typewriter">
                   <p className="text-[9px] font-black uppercase tracking-widest opacity-80 mb-1">Đang xử lý:</p>
                   <p className="text-xs font-black uppercase tracking-tight italic truncate max-w-[240px]">
                     {orderDisplayInfo.customerName} — {orderDisplayInfo.contractCode}
                   </p>
                </div>
             )}

             <div className="flex-1 md:flex-none">
                <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 mb-2 block font-typewriter opacity-60">Lệnh Sản Xuất</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select 
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(e.target.value)}
                      className="w-full md:w-64 bg-retro-paper/50 border-2 border-retro-sepia/10 px-4 py-3.5 text-xs font-black uppercase text-retro-sepia focus:bg-white focus:border-retro-sepia transition-all outline-none font-typewriter appearance-none shadow-inner"
                    >
                      <option value="">-- Chọn lệnh --</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>
                          [{o.order?.contractCode || 'NO-ID'}] {o.productName}
                        </option>
                      ))}
                    </select>
                    <Search size={14} strokeWidth={1.5} className="absolute right-4 top-1/2 -translate-y-1/2 text-retro-sepia/30 pointer-events-none" />
                  </div>
                  <button 
                    onClick={() => setIsScanning(true)}
                    className="p-3.5 bg-retro-paper border-2 border-retro-sepia/10 text-retro-sepia hover:bg-retro-sepia hover:text-retro-paper transition-all shadow-sm rotate-2 hover:rotate-0"
                    title="Quét mã QR"
                  >
                    <QrCode size={18} strokeWidth={1.5} />
                  </button>
                </div>
             </div>
             
             <div className="flex-1 md:flex-none">
                <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 mb-2 block font-typewriter opacity-60">Ngày Làm Việc</label>
                <div className="relative">
                  <input 
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full md:w-44 bg-retro-paper/50 border-2 border-retro-sepia/10 px-4 py-3.5 text-xs font-black text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all font-typewriter shadow-inner"
                  />
                  <Calendar size={14} strokeWidth={1.5} className="absolute right-4 top-1/2 -translate-y-1/2 text-retro-sepia/30 pointer-events-none" />
                </div>
             </div>
          </div>
        </div>
      </div>
      {/* BATCH SELECTION SECTION */}
      {selectedOrderId && (
        <div className="retro-card !bg-white border-2 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-retro-mustard flex items-center justify-center text-retro-sepia shadow-xl rotate-6">
                    <QrCode size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-retro-sepia uppercase tracking-tighter italic font-typewriter underline decoration-retro-mustard/30 underline-offset-4">Nguyên liệu tiêu thụ</h3>
                    <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] italic opacity-60 font-typewriter">Định danh Lô hàng & Trừ kho vật tư</p>
                  </div>
               </div>
               
               {fetchingBOM && (
                 <div className="flex items-center gap-3 text-retro-mustard animate-pulse font-typewriter">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Đang tải BOM...</span>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {bomItems.map((item, idx) => (
                 <div key={item.materialId} className="bg-retro-paper/30 p-8 border-2 border-retro-sepia/5 hover:border-retro-mustard/40 transition-all rotate-1 hover:rotate-0 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                       <Package size={60} strokeWidth={0.5} />
                    </div>
                    
                    <div className="flex justify-between items-start mb-6 border-b-2 border-dashed border-retro-sepia/10 pb-4">
                       <div className="flex-1 min-w-0 pr-4">
                          <p className="text-[9px] font-black text-retro-earth uppercase tracking-widest mb-1 italic font-typewriter opacity-60">{item.sku}</p>
                          <h4 className="text-sm font-black text-retro-sepia uppercase leading-none font-typewriter truncate">{item.name}</h4>
                       </div>
                       <div className="px-3 py-1.5 bg-retro-paper border-2 border-retro-sepia/10 text-[10px] font-black text-retro-sepia font-typewriter shrink-0">
                          {item.unit}
                       </div>
                    </div>

                    <div className="space-y-6">
                       <div>
                          <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 mb-2 block font-typewriter opacity-60">Xác định Lô tiêu thụ</label>
                          <div className="relative">
                            <select 
                              value={item.selectedBatchId}
                              onChange={(e) => {
                                 const newBOM = [...bomItems];
                                 newBOM[idx].selectedBatchId = e.target.value;
                                 setBomItems(newBOM);
                              }}
                              className="w-full bg-white border-2 border-retro-sepia/10 px-4 py-3 text-xs font-black uppercase text-retro-sepia focus:border-retro-mustard transition-all outline-none font-typewriter appearance-none shadow-inner"
                            >
                              <option value="">-- Chọn hoặc Quét Lô --</option>
                              {item.availableBatches?.map((b: any) => (
                                <option key={b.id} value={b.id}>
                                  {b.batchCode} (Tồn: {Number(b.remainQuantity)} {item.unit})
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-retro-sepia/30 pointer-events-none" />
                          </div>
                       </div>

                       <div className="flex justify-between items-end pt-2 border-t border-retro-sepia/5">
                          <div>
                            <p className="text-[9px] font-black text-retro-earth uppercase tracking-widest mb-1 opacity-60 font-typewriter">Dự toán tiêu thụ</p>
                            <p className="text-lg font-black text-retro-brick italic font-typewriter">
                               {(totalBatchQty * item.requiredPerUnit).toFixed(2)} <span className="text-[10px]">{item.unit}</span>
                            </p>
                          </div>
                          {item.selectedBatchId && (
                             <div className="flex items-center gap-2 text-retro-moss mb-1">
                                <CheckCircle2 size={16} strokeWidth={2} />
                                <span className="text-[10px] font-black uppercase font-typewriter">Đã định danh</span>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
               ))}

               {bomItems.length === 0 && !fetchingBOM && (
                 <div className="col-span-full py-16 bg-retro-paper/10 border-4 border-dashed border-retro-sepia/10 flex flex-col items-center justify-center text-retro-earth/40 italic font-typewriter">
                    <Package size={40} className="mb-4 opacity-20" strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Hồ sơ nguyên liệu chưa được thiết lập</p>
                 </div>
               )}
            </div>
          </div>
          
          {/* Decoration */}
          <div className="absolute -right-16 -top-16 text-retro-sepia/5 pointer-events-none">
             <Layers size={300} strokeWidth={0.5} />
          </div>
        </div>
      )}
      {/* EDITABLE TABLE SECTION */}
      <div className="retro-card !p-0 !bg-white border-2 shadow-2xl relative overflow-hidden">
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse font-serif italic">
            <thead>
              <tr className="bg-retro-sepia text-retro-paper text-[10px] font-black uppercase tracking-[0.2em] font-typewriter">
                <th className="px-6 py-6 text-center w-16 !italic-normal ring-1 ring-white/5">HẠNG</th>
                <th className="px-6 py-6 !italic-normal ring-1 ring-white/5">NHÂN VIÊN (THỢ)</th>
                <th className="px-6 py-6 text-center w-36 !italic-normal ring-1 ring-white/5">SẢN LƯỢNG ĐẠT</th>
                <th className="px-6 py-6 text-center w-32 !italic-normal ring-1 ring-white/5 text-retro-brick">LỖI KỸ THUẬT</th>
                <th className="px-6 py-6 text-center w-32 !italic-normal ring-1 ring-white/5">LỖI VẬT TƯ</th>
                <th className="px-6 py-6 !italic-normal ring-1 ring-white/5 text-retro-mustard">GHI CHÚ HỒ SƠ</th>
                <th className="px-6 py-6 text-center w-28 !italic-normal ring-1 ring-white/5">MỤC LỤC</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-retro-sepia/5">
              {entries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-retro-paper/20 transition-all group">
                  <td className="px-6 py-6 text-center text-xs font-black text-retro-earth/40 not-italic font-typewriter">{index + 1}</td>
                  <td className="px-6 py-6">
                    <div className="relative group/field min-w-[200px]">
                      <select 
                        value={entry.userId}
                        onChange={(e) => updateEntry(entry.id, 'userId', e.target.value)}
                        className="w-full bg-transparent border-b-2 border-retro-sepia/10 focus:border-retro-sepia py-2 outline-none text-sm font-black text-retro-sepia transition-all font-typewriter uppercase tracking-tight appearance-none"
                      >
                        <option value="">-- Chọn danh tính --</option>
                        {workers.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      <User size={14} strokeWidth={1.5} className="absolute right-0 top-1/2 -translate-y-1/2 text-retro-sepia/20 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <input 
                      type="number"
                      value={entry.quantityProduced || ''}
                      onChange={(e) => updateEntry(entry.id, 'quantityProduced', parseInt(e.target.value) || 0)}
                      className="w-full bg-retro-paper/30 border-2 border-retro-moss/10 px-4 py-2.5 text-center text-sm font-black text-retro-moss outline-none focus:bg-white focus:border-retro-moss transition-all font-typewriter shadow-inner"
                      placeholder="000"
                    />
                  </td>
                  <td className="px-6 py-6">
                    <input 
                      type="number"
                      value={entry.technicalErrorCount || ''}
                      onChange={(e) => updateEntry(entry.id, 'technicalErrorCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-retro-paper/30 border-2 border-retro-brick/10 px-4 py-2.5 text-center text-sm font-black text-retro-brick outline-none focus:bg-white focus:border-retro-brick transition-all font-typewriter shadow-inner"
                      placeholder="00"
                    />
                  </td>
                  <td className="px-6 py-6">
                    <input 
                      type="number"
                      value={entry.materialErrorCount || ''}
                      onChange={(e) => updateEntry(entry.id, 'materialErrorCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-retro-paper/30 border-2 border-retro-sepia/10 px-4 py-2.5 text-center text-sm font-black text-retro-earth outline-none focus:bg-white focus:border-retro-sepia transition-all font-typewriter shadow-inner"
                      placeholder="00"
                    />
                  </td>
                  <td className="px-6 py-6">
                    <input 
                      type="text"
                      value={entry.errorNote}
                      onChange={(e) => updateEntry(entry.id, 'errorNote', e.target.value)}
                      className="w-full bg-transparent border-b-2 border-dashed border-retro-sepia/10 focus:border-retro-mustard py-2.5 outline-none text-xs text-retro-earth font-handwriting font-bold placeholder:text-retro-earth/20 transition-all italic"
                      placeholder="Kê khai sai biệt (nếu có)..."
                    />
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button 
                        onClick={() => handleCopyRow(index)}
                        className="p-2.5 bg-retro-paper border-2 border-retro-sepia/10 text-retro-sepia hover:bg-retro-sepia hover:text-retro-paper transition-all shadow-sm rotate-3 hover:rotate-0"
                        title="Sao chép dòng"
                       >
                          <Copy size={14} strokeWidth={1.5} />
                       </button>
                       <button 
                        onClick={() => handleRemoveRow(entry.id)}
                        className="p-2.5 bg-retro-paper border-2 border-retro-brick/10 text-retro-brick hover:bg-retro-brick hover:text-white transition-all shadow-sm -rotate-3 hover:rotate-0"
                        title="Xóa dòng"
                       >
                          <Trash2 size={14} strokeWidth={1.5} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER / ACTIONS */}
        <div className="p-10 bg-retro-paper/20 border-t-2 border-retro-sepia/10 flex flex-col sm:flex-row justify-between items-center gap-8 relative z-10">
           <button 
            onClick={handleAddRow}
            className="flex items-center gap-3 px-8 py-4 bg-white border-2 border-dashed border-retro-sepia/20 text-[11px] font-black uppercase tracking-[0.2em] text-retro-earth/60 hover:border-retro-sepia hover:text-retro-sepia transition-all shadow-sm font-typewriter"
           >
              <Plus size={18} strokeWidth={1.5} /> Thêm nhân hiệu mới
           </button>

           <div className="flex flex-col items-end gap-3 font-typewriter">
              <div className="flex items-center gap-12">
                 <div className="text-right">
                    <p className="text-[9px] font-black text-retro-earth uppercase tracking-widest mb-1 opacity-60">Tổng cộng Kê khai</p>
                    <p className={cn("text-2xl font-black italic tracking-tighter underline decoration-retro-mustard underline-offset-4", isOverLimit ? "text-retro-brick" : "text-retro-sepia")}>
                      {totalBatchQty} <span className="text-[10px] uppercase font-bold not-italic">Hàn hóa</span>
                    </p>
                 </div>
                 <button 
                  onClick={handleSaveAll}
                  disabled={isSaving || isOverLimit}
                  className="retro-btn bg-retro-brick text-white hover:bg-retro-sepia px-12 py-6 shadow-[4px_4px_0px_#3E272333] flex items-center gap-3"
                 >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <><Save size={20} strokeWidth={1.5} /> Ký duyệt & Lưu trữ</>}
                 </button>
              </div>
              {isOverLimit && (
                <div className="flex items-center gap-2 text-retro-brick animate-bounce italic mr-2">
                   <AlertTriangle size={16} strokeWidth={2} />
                   <span className="text-[10px] font-black uppercase tracking-tight">Kê khai vượt định mức vật tư hệ thống!</span>
                </div>
              )}
           </div>
        </div>
      </div>


      {/* QUICK STATS HELPERS */}
      {currentOrder && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
           <div className="retro-card !bg-white border-2 shadow-xl flex items-center gap-6 p-8 relative overflow-hidden">
              <div className="w-14 h-14 bg-retro-paper border-2 border-retro-sepia flex items-center justify-center text-retro-sepia shadow-inner rotate-3">
                 <Package size={28} strokeWidth={1.5} />
              </div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-retro-earth uppercase tracking-widest mb-1 font-typewriter opacity-60">Mục tiêu bưu</p>
                 <p className="text-xl font-black text-retro-sepia font-typewriter underline decoration-retro-mustard/30 underline-offset-2">{currentOrder.quantityTarget} <span className="text-[10px]">PCS</span></p>
              </div>
           </div>
           <div className="retro-card !bg-white border-2 shadow-xl flex items-center gap-6 p-8 relative overflow-hidden">
              <div className="w-14 h-14 bg-retro-paper border-2 border-retro-moss flex items-center justify-center text-retro-moss shadow-inner -rotate-3">
                 <CheckCircle2 size={28} strokeWidth={1.5} />
              </div>
              <div className="relative z-10">
                 <p className="text-[10px] font-black text-retro-earth uppercase tracking-widest mb-1 font-typewriter opacity-60">Ghi nhận cũ</p>
                 <p className="text-xl font-black text-retro-moss font-typewriter underline decoration-retro-mustard/30 underline-offset-2">{currentOrder.quantityCompleted} <span className="text-[10px]">PCS</span></p>
              </div>
           </div>
           
           <div className="retro-card !bg-white border-2 shadow-xl col-span-1 md:col-span-2 p-8 relative overflow-hidden">
              <div className="flex-1">
                 <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                       <p className="text-[10px] font-black text-retro-earth uppercase tracking-widest mb-1 italic font-typewriter opacity-60">Tiến độ đối chiếu thực địa</p>
                       <p className="text-sm font-black text-retro-brick uppercase font-typewriter italic">Lệnh: {currentOrder.sku || 'N/A'}</p>
                    </div>
                    <p className="text-2xl font-black text-retro-sepia font-typewriter tracking-tighter italic">
                      {Math.round(((currentOrder.quantityCompleted + totalBatchQty) / currentOrder.quantityTarget) * 100)}%
                    </p>
                 </div>
                 <div className="h-5 bg-retro-paper border-2 border-retro-sepia/20 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,transparent_10%,rgba(62,39,35,0.05)_10.5%,rgba(62,39,35,0.05)_11%,transparent_11.5%)] bg-[length:20px_100%]" />
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 shadow-[2px_0px_10px_rgba(0,0,0,0.1)] relative",
                        isOverLimit ? "bg-retro-brick" : "bg-retro-moss"
                      )}
                      style={{ width: `${Math.min(100, Math.round(((currentOrder.quantityCompleted + totalBatchQty) / currentOrder.quantityTarget) * 100))}%` }}
                    >
                       <div className="absolute inset-0 bg-white/10" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {isScanning && (
        <QRScanner 
          onScan={(data) => {
            const matched = orders.find(o => o.id === data || o.sku === data);
            if (matched) {
              setSelectedOrderId(matched.id);
            } else {
              alert("Không tìm thấy Lệnh sản xuất nào khớp với mã: " + data);
            }
          }}
          onClose={() => setIsScanning(false)}
          title="Quét mã Lệnh Sản Xuất"
        />
      )}
    </div>
  );
}
