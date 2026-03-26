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
  User,
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 px-4 md:px-0">
      {/* Header Section */}
      <div className="card !flex-col md:!flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg">
              <ClipboardList size={24} />
           </div>
           <div>
              <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                <Users size={12} />
                <span>Sản xuất</span>
                <ChevronRight size={10} />
                <span className="text-primary">Báo cáo tổ trưởng</span>
              </nav>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Khai báo Sản lượng hàng loạt
              </h1>
           </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
           <div className="flex-1 md:w-64">
              <div className="relative">
                <select 
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="form-input pl-3 pr-10 !py-2.5 text-sm font-bold appearance-none bg-gray-50/50"
                >
                  <option value="">-- Chọn lệnh sản xuất --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      [{o.order?.contractCode || 'NO-ID'}] {o.productName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
           </div>
           
           <div className="w-full md:w-40 relative">
              <input 
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className="form-input !py-2.5 pl-10 text-xs font-bold bg-gray-50/50"
              />
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground p-px" />
           </div>

           <button 
             onClick={() => setIsScanning(true)}
             className="btn-secondary h-11 px-3 flex items-center justify-center shrink-0"
             title="Quét mã QR"
           >
             <QrCode size={20} />
           </button>
        </div>
      </div>

      {orderDisplayInfo && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
           <div className="flex items-center gap-3 text-sm font-bold text-primary">
              <History size={16} />
              <span>Đang báo cáo cho: <span className="text-foreground">{orderDisplayInfo.customerName}</span> (HĐ: {orderDisplayInfo.contractCode})</span>
           </div>
           <button onClick={() => setSelectedOrderId('')} className="p-1 hover:bg-primary/10 rounded-full text-primary transition-colors">
              <X size={16} />
           </button>
        </div>
      )}

      {/* BOM Section */}
      {selectedOrderId && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Package size={18} className="text-primary/60" />
                Vật tư tiêu hao (BOM)
             </h3>
             {fetchingBOM && <Loader2 size={16} className="animate-spin text-primary" />}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {bomItems.map((item, idx) => (
               <div key={item.materialId} className="card !p-5 border-border hover:border-primary/20 transition-all flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                     <div className="min-w-0 pr-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 truncate">{item.sku}</p>
                        <h4 className="font-bold text-foreground text-sm truncate uppercase tracking-tight">{item.name}</h4>
                     </div>
                     <span className="text-[9px] font-bold bg-gray-100 px-1.5 py-0.5 rounded text-muted-foreground uppercase">
                        {item.unit}
                     </span>
                  </div>

                  <div className="space-y-3">
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-0.5">Lô sản xuất</label>
                        <div className="relative">
                          <select 
                            value={item.selectedBatchId}
                            onChange={(e) => {
                               const newBOM = [...bomItems];
                               newBOM[idx].selectedBatchId = e.target.value;
                               setBomItems(newBOM);
                            }}
                            className="form-input !py-2 !text-xs bg-gray-50/50 appearance-none pr-8"
                          >
                            <option value="">-- Chọn vật tư --</option>
                            {item.availableBatches?.map((b: any) => (
                              <option key={b.id} value={b.id}>
                                {b.batchCode} (Tồn: {Number(b.remainQuantity)})
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        </div>
                     </div>

                     <div className="flex justify-between items-end pt-1">
                        <div>
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Dự tính sử dụng</p>
                          <p className="text-lg font-black text-foreground tabular-nums">
                             {(totalBatchQty * item.requiredPerUnit).toFixed(2)} <span className="text-[10px] font-medium text-muted-foreground uppercase">{item.unit}</span>
                          </p>
                        </div>
                        {item.selectedBatchId && <CheckCircle2 size={18} className="text-emerald-500" />}
                     </div>
                  </div>
               </div>
             ))}

             {bomItems.length === 0 && !fetchingBOM && (
               <div className="col-span-full card border-dashed !p-12 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                  <Package size={32} className="mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Không có dữ liệu BOM cho lệnh này</p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="card !p-0 overflow-hidden shadow-sm border border-border">
        <div className="overflow-x-auto">
          <table className="w-full !mt-0 text-left">
            <thead>
              <tr className="bg-gray-900 text-white">
                <th className="px-6 py-4 w-12 text-center text-[10px] font-bold uppercase tracking-widest">#</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Đối tượng Nhân sự</th>
                <th className="px-4 py-4 w-32 text-center text-[10px] font-bold uppercase tracking-widest">Sản lượng</th>
                <th className="px-4 py-4 w-32 text-center text-[10px] font-bold uppercase tracking-widest text-red-300">Lỗi Thợ</th>
                <th className="px-4 py-4 w-32 text-center text-[10px] font-bold uppercase tracking-widest">Lỗi Vật tư</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest">Ký lục / Ghi chú</th>
                <th className="px-6 py-4 w-24 text-center text-[10px] font-bold uppercase tracking-widest">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {entries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-50/80 transition-all group">
                  <td className="px-6 py-5 text-center text-xs font-bold text-muted-foreground opacity-50">{index + 1}</td>
                  <td className="px-6 py-5 min-w-[200px]">
                    <div className="relative">
                      <select 
                        value={entry.userId}
                        onChange={(e) => updateEntry(entry.id, 'userId', e.target.value)}
                        className="w-full bg-transparent border-b border-border focus:border-primary py-1.5 outline-none text-sm font-bold text-foreground transition-all appearance-none"
                      >
                        <option value="">-- Chọn công nhân --</option>
                        {workers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      <User size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-5">
                    <input 
                      type="number"
                      value={entry.quantityProduced || ''}
                      onChange={(e) => updateEntry(entry.id, 'quantityProduced', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-border rounded-lg py-2 text-center text-sm font-bold focus:bg-white focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-5">
                    <input 
                      type="number"
                      value={entry.technicalErrorCount || ''}
                      onChange={(e) => updateEntry(entry.id, 'technicalErrorCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-red-50/50 border border-red-100 rounded-lg py-2 text-center text-sm font-bold text-red-700 focus:bg-white focus:ring-1 focus:ring-red-200 outline-none transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-4 py-5">
                    <input 
                      type="number"
                      value={entry.materialErrorCount || ''}
                      onChange={(e) => updateEntry(entry.id, 'materialErrorCount', parseInt(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-border rounded-lg py-2 text-center text-sm font-bold focus:bg-white focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-5">
                    <input 
                      type="text"
                      value={entry.errorNote}
                      onChange={(e) => updateEntry(entry.id, 'errorNote', e.target.value)}
                      className="w-full bg-transparent border-b border-border py-2 text-xs text-muted-foreground focus:border-primary focus:text-foreground transition-all outline-none italic placeholder:opacity-40"
                      placeholder="Nhập ghi chú nhanh..."
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleCopyRow(index)} className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-all"><Copy size={16} /></button>
                       <button onClick={() => handleRemoveRow(entry.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
           <button 
             onClick={handleAddRow}
             className="btn-secondary h-11 px-8 rounded-full shadow-sm text-xs font-bold gap-2 whitespace-nowrap"
           >
              <Plus size={18} /> Thêm nhân sự báo cáo
           </button>

           <div className="flex items-center gap-8 w-full md:w-auto">
              <div className="text-right flex flex-col items-end shrink-0">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Tổng kê khai tạm tính</p>
                 <p className={cn("text-2xl font-black tabular-nums transition-colors", isOverLimit ? "text-red-600" : "text-foreground")}>
                   {totalBatchQty.toLocaleString()} <span className="text-xs font-bold text-muted-foreground uppercase ml-1">đơn vị</span>
                 </p>
              </div>
              <button 
               onClick={handleSaveAll}
               disabled={isSaving || isOverLimit}
               className="btn-primary h-12 px-10 rounded-xl shadow-xl shadow-primary/20 flex-1 md:flex-none justify-center gap-2 min-w-[180px]"
              >
                 {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                 {isSaving ? 'Đang lưu...' : 'Xác nhận Hồ sơ'}
              </button>
           </div>
        </div>
      </div>

      {currentOrder && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-2">
            <div className="card !p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-muted-foreground">
                 <Package size={20} />
              </div>
              <div>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Định mức Lệnh</p>
                 <p className="text-lg font-black text-foreground">{currentOrder.quantityTarget.toLocaleString()}</p>
              </div>
            </div>
            
            <div className={cn(
                "card !p-5 flex items-center gap-4 border-l-4",
                isOverLimit ? "border-l-red-500" : (currentOrder.quantityCompleted + totalBatchQty >= currentOrder.quantityTarget ? "border-l-emerald-500" : "border-l-primary")
            )}>
              <div className="w-10 h-10 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                 <History size={20} />
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-baseline">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tổng thực hiện</p>
                    <span className="text-xs font-black text-foreground">{Math.round(((currentOrder.quantityCompleted + totalBatchQty) / currentOrder.quantityTarget) * 100)}%</span>
                 </div>
                 <p className="text-lg font-black text-foreground">{(currentOrder.quantityCompleted + totalBatchQty).toLocaleString()}</p>
              </div>
            </div>

            <div className="md:col-span-2 card !p-5 flex flex-col justify-center">
               <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                        "h-full transition-all duration-1000",
                        isOverLimit ? "bg-red-500" : (currentOrder.quantityCompleted + totalBatchQty >= currentOrder.quantityTarget ? "bg-emerald-500" : "bg-primary")
                    )}
                    style={{ width: `${Math.min(100, ((currentOrder.quantityCompleted + totalBatchQty) / currentOrder.quantityTarget) * 100)}%` }}
                  />
               </div>
               {isOverLimit && (
                 <p className="text-[10px] font-bold text-red-600 uppercase tracking-tight mt-2 flex items-center gap-1">
                    <AlertTriangle size={12} /> Cảnh báo: Kê khai vượt định mức vật tư (+5%)
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
