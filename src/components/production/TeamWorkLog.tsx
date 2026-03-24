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
  QrCode
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
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* HEADER SECTION */}
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-primary-600 rounded-[22px] flex items-center justify-center text-white shadow-lg shadow-primary-100">
              <Users size={28} />
           </div>
           <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
                  Khai báo <span className="text-primary-600 underline decoration-2 underline-offset-4">Sản lượng Tổ đội</span>
                </h1>
                <HelpIcon />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ghi nhận sản lượng kèm tiêu thụ vật tư</p>
           </div>
        </div>

        {/* ORDER INFO DISPLAY (NEW REQUIREMENT) */}
        {orderDisplayInfo && (
          <div className="bg-primary-600 px-6 py-4 rounded-[28px] text-white flex flex-col justify-center animate-in slide-in-from-right-10 duration-500">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Đang thực hiện cho Đơn hàng:</p>
             <p className="text-sm font-black uppercase tracking-tight italic select-all">
               {orderDisplayInfo.customerName} — {orderDisplayInfo.contractCode}
             </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
           <div className="flex-1 md:flex-none">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Lệnh Sản Xuất</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select 
                    value={selectedOrderId}
                    onChange={(e) => {
                      setSelectedOrderId(e.target.value);
                    }}
                    className="w-full md:w-64 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-primary-200 transition-all appearance-none"
                  >
                    <option value="">-- Chọn lệnh --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        [{o.order?.contractCode || 'No Code'}] {o.productName}
                      </option>
                    ))}
                  </select>
                  <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                </div>
                <button 
                  onClick={() => setIsScanning(true)}
                  className="p-3 bg-primary-50 text-primary-600 rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                  title="Quét mã QR"
                >
                  <QrCode size={18} />
                </button>
              </div>
           </div>
           <div className="flex-1 md:flex-none">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Ngày Làm Việc</label>
              <div className="relative">
                <input 
                  type="date"
                  value={workDate}
                  onChange={(e) => setWorkDate(e.target.value)}
                  className="w-full md:w-44 bg-gray-50 border border-gray-100 rounded-2xl py-3 px-4 text-xs font-bold text-gray-700 outline-none focus:bg-white focus:border-primary-200 transition-all"
                />
                <Calendar size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
              </div>
           </div>
        </div>
      </div>

      {/* BATCH SELECTION SECTION */}
      {selectedOrderId && (
        <div className="bg-white p-8 rounded-[40px] border border-indigo-100 shadow-xl shadow-indigo-50/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                    <QrCode size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase italic">Vật tư Tiêu thụ (BOM)</h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Quét hoặc chọn Lô hàng để trừ kho chính xác</p>
                  </div>
               </div>
               
               {fetchingBOM && (
                 <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
                    <span className="text-[10px] font-black uppercase italic">Đang tải BOM...</span>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {bomItems.map((item, idx) => (
                 <div key={item.materialId} className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 hover:border-indigo-200 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">{item.sku}</p>
                          <h4 className="text-[13px] font-black text-gray-900 uppercase leading-none">{item.name}</h4>
                       </div>
                       <div className="px-3 py-1 bg-white border border-gray-100 rounded-xl text-[9px] font-black text-gray-400">
                          {item.unit}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <div>
                          <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 mb-1 block italic">Chọn Lô Hàng Dự Kiến</label>
                          <select 
                            value={item.selectedBatchId}
                            onChange={(e) => {
                               const newBOM = [...bomItems];
                               newBOM[idx].selectedBatchId = e.target.value;
                               setBomItems(newBOM);
                            }}
                            className="w-full bg-white border border-gray-100 rounded-2xl py-3 px-4 text-xs font-bold text-gray-700 outline-none focus:border-indigo-400 transition-all appearance-none"
                          >
                            <option value="">-- Quét hoặc Chọn Lô --</option>
                            {item.availableBatches?.map((b: any) => (
                              <option key={b.id} value={b.id}>
                                {b.batchCode} - Tồn: {Number(b.remainQuantity)} ({b.location || 'N/A'})
                              </option>
                            ))}
                          </select>
                       </div>

                       <div className="flex justify-between items-end pt-2">
                          <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Dự tính tiêu thụ</p>
                            <p className="text-sm font-black text-indigo-600 italic">
                               {(totalBatchQty * item.requiredPerUnit).toFixed(2)} {item.unit}
                            </p>
                          </div>
                          {item.selectedBatchId && (
                             <div className="flex items-center gap-1.5 text-emerald-500">
                                <CheckCircle2 size={12} />
                                <span className="text-[9px] font-black uppercase">Đã định vị</span>
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
               ))}

               {bomItems.length === 0 && !fetchingBOM && (
                 <div className="col-span-full py-10 bg-white/50 rounded-[32px] border border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400">
                    <Package size={32} className="mb-2 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Sản phẩm này chưa cấu hình BOM</p>
                 </div>
               )}
            </div>
          </div>
          
          {/* Decoration */}
          <div className="absolute -right-10 -top-10 text-indigo-50/50">
             <Layers size={200} />
          </div>
        </div>
      )}

      {/* EDITABLE TABLE SECTION */}
      <div className="bg-white rounded-[40px] border border-gray-100 shadow-2xl shadow-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-16">#</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhân viên</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-36">Sản lượng đạt</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-32 font-medium text-rose-500">Lỗi Thợ 🛠️</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-32">Lỗi Giấy 📄</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Ghi chú</th>
                <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center w-28">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-50/30 transition-colors group">
                  <td className="px-6 py-4 text-center text-xs font-black text-gray-300 italic">{index + 1}</td>
                  <td className="px-6 py-4">
                    <select 
                      value={entry.userId}
                      onChange={(e) => updateEntry(entry.id, 'userId', e.target.value)}
                      className="w-full bg-transparent border-b-2 border-transparent focus:border-primary-500 py-1.5 outline-none text-sm font-bold text-gray-700 transition-all"
                    >
                      <option value="">Chọn nhân viên...</option>
                      {workers.map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number"
                      value={entry.quantityProduced || ''}
                      onChange={(e) => updateEntry(entry.id, 'quantityProduced', parseInt(e.target.value) || 0)}
                      className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl py-2 px-3 text-center text-sm font-black text-emerald-700 outline-none focus:bg-white focus:border-emerald-300 transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number"
                      value={entry.technicalErrorCount || ''}
                      onChange={(e) => updateEntry(entry.id, 'technicalErrorCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-rose-50/50 border border-rose-100 rounded-xl py-2 px-3 text-center text-sm font-black text-rose-600 outline-none focus:bg-white focus:border-rose-300 transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="number"
                      value={entry.materialErrorCount || ''}
                      onChange={(e) => updateEntry(entry.id, 'materialErrorCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 px-3 text-center text-sm font-black text-gray-500 outline-none focus:bg-white focus:border-gray-300 transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input 
                      type="text"
                      value={entry.errorNote}
                      onChange={(e) => updateEntry(entry.id, 'errorNote', e.target.value)}
                      className="w-full bg-transparent border-b border-gray-100 focus:border-primary-400 py-1.5 outline-none text-xs text-gray-500 placeholder:text-gray-300 transition-all"
                      placeholder="Lý do lỗi (nếu có)..."
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                       <button 
                        onClick={() => handleCopyRow(index)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-100"
                        title="Sao chép dòng"
                       >
                          <Copy size={14} />
                       </button>
                       <button 
                        onClick={() => handleRemoveRow(entry.id)}
                        className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all shadow-sm shadow-rose-100"
                        title="Xóa dòng"
                       >
                          <Trash2 size={14} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER / ACTIONS */}
        <div className="p-8 bg-gray-50/30 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
           <button 
            onClick={handleAddRow}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-dashed border-gray-300 rounded-[20px] text-[11px] font-black uppercase tracking-widest text-gray-500 hover:border-primary-400 hover:text-primary-600 transition-all shadow-sm"
           >
              <Plus size={16} /> Thêm dòng nhân viên
           </button>

           <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-10">
                 <div className="text-right">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tổng SX trong đợt</p>
                    <p className={cn("text-xl font-black", isOverLimit ? "text-rose-600" : "text-gray-900")}>
                      {totalBatchQty} <span className="text-xs uppercase">pcs</span>
                    </p>
                 </div>
                 <button 
                  onClick={handleSaveAll}
                  disabled={isSaving || isOverLimit}
                  className="flex items-center gap-3 px-10 py-5 bg-primary-600 text-white rounded-[28px] text-[13px] font-black uppercase tracking-widest shadow-2xl shadow-primary-200 hover:bg-primary-500 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                 >
                    {isSaving ? "Đang xử lý..." : <><Save size={18} /> Lưu tất cả</>}
                 </button>
              </div>
              {isOverLimit && (
                <div className="flex items-center gap-2 text-rose-500 animate-bounce">
                   <AlertTriangle size={14} />
                   <span className="text-[10px] font-black uppercase tracking-tight">Số lượng vượt quá định mức vật tư!</span>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* QUICK STATS HELPERS */}
      {currentOrder && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-lg shadow-gray-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                 <Package size={24} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Mục tiêu đơn</p>
                 <p className="text-lg font-black text-gray-900">{currentOrder.quantityTarget} pcs</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-lg shadow-gray-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
                 <CheckCircle2 size={24} />
              </div>
              <div>
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Đã xong t.trước</p>
                 <p className="text-lg font-black text-gray-900">{currentOrder.quantityCompleted} pcs</p>
              </div>
           </div>
           <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-lg shadow-gray-50 flex items-center gap-4 col-span-1 md:col-span-2">
              <div className="flex-1">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tiến độ sau đợt này</p>
                    <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest">
                      {Math.round(((currentOrder.quantityCompleted + totalBatchQty) / currentOrder.quantityTarget) * 100)}%
                    </p>
                 </div>
                 <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                    <div 
                      className="h-full bg-primary-600 transition-all duration-1000 shadow-sm"
                      style={{ width: `${Math.min(100, Math.round(((currentOrder.quantityCompleted + totalBatchQty) / currentOrder.quantityTarget) * 100))}%` }}
                    />
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
