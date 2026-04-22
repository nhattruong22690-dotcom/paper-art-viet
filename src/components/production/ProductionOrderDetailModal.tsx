"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Briefcase, 
  LayoutGrid, 
  PencilLine, 
  ClipboardList, 
  ChevronRight, 
  Trash2, 
  Edit3 
} from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProductionOrder, Status } from './ProductionPipeline';
import ProductionBatchForm from './ProductionBatchForm';
import { useNotification } from '@/context/NotificationContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusConfig = {
  Pending: { label: "Chờ xử lý", color: "bg-gray-100 text-gray-600 border-gray-200" },
  Processing: { label: "Đang sản xuất", color: "bg-primary/10 text-primary border-primary/20" },
  QualityControl: { label: "Kiểm tra QC", color: "bg-amber-50 text-amber-600 border-amber-200" },
  Completed: { label: "Hoàn thành", color: "bg-green-50 text-green-600 border-green-200" },
  Archived: { label: "Đã lưu trữ", color: "bg-gray-100 text-gray-400 border-gray-200" },
};

interface ProductionOrderDetailModalProps {
  order: ProductionOrder | null;
  onClose: () => void;
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onStatusChange: (id: string, newStatus: string) => Promise<void>;
  onViewContract?: (orderId: string) => void;
}

export default function ProductionOrderDetailModal({
  order: initialOrder,
  onClose,
  onUpdate,
  onDelete,
  onStatusChange,
  onViewContract
}: ProductionOrderDetailModalProps) {
  const { confirm, showToast } = useNotification();
  const [order, setOrder] = useState<ProductionOrder | null>(initialOrder);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogsDetail, setShowLogsDetail] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [outsourcers, setOutsourcers] = useState<any[]>([]);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editForm, setEditForm] = useState({
    quantityTarget: 0,
    allocationType: 'internal' as 'internal' | 'outsourced',
    assignedTo: ''
  });
  
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    if (order) {
      loadLogs(order.id);
      setEditForm({
        quantityTarget: order.quantityTarget,
        allocationType: order.allocationType || 'internal',
        assignedTo: order.assignedTo || ''
      });
      loadFacilities();
    }
  }, [order?.id]);

  const loadLogs = async (id: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/production/logs?productionOrderId=${id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const loadFacilities = async () => {
    try {
      const [wRes, oRes] = await Promise.all([
        fetch('/api/production/facilities/workshops'),
        fetch('/api/production/facilities/outsourcers')
      ]);
      const [wData, oData] = await Promise.all([wRes.json(), oRes.json()]);
      setWorkshops(wData || []);
      setOutsourcers(oData || []);
    } catch (err) {
      console.error("Failed to load facilities:", err);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ghi nhận sản xuất này? Hệ thống sẽ tự động tính toán lại sản lượng.")) return;
    
    try {
      const res = await fetch(`/api/production/logs?id=${logId}`, { method: 'DELETE' });
      if (res.ok) {
        if (order) loadLogs(order.id);
        // We need to notify the parent that data changed so it can refresh the order stats
        onUpdate(order?.id || '', {}); 
      }
    } catch (err) {
      console.error("Failed to delete log:", err);
    }
  };

  const handleEditLog = (log: any) => {
    setEditingLog(log);
    setShowEditModal(true);
  };

  const handleSaveEditLog = async (data: any) => {
    try {
      const res = await fetch('/api/production/logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingLog.id, ...data })
      });
      if (res.ok) {
        setShowEditModal(false);
        if (order) loadLogs(order.id);
        onUpdate(order?.id || '', {});
      }
    } catch (err) {
      console.error("Failed to save edit log:", err);
    }
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl card !p-0 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 bg-white">
        {/* Unified Top Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-white">
           <div className="space-y-3">
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded border border-primary/20 uppercase tracking-widest">{order.sku}</span>
                 {order.contractCode && (
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       onViewContract?.(order.orderId || '');
                     }}
                     className="flex items-center gap-1.5 text-[10px] font-black text-neo-mint bg-neo-mint/10 border border-neo-mint/30 px-3 py-1 rounded hover:bg-neo-mint/20 transition-all uppercase tracking-widest"
                   >
                     <Briefcase size={12} /> HĐ: {order.contractCode}
                   </button>
                 )}
              </div>
              <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">{order.title}</h2>
           </div>
           <div className="flex items-center gap-3">
              <button 
                title="Ghi nhận sản xuất"
                onClick={() => setShowBatchForm(true)}
                className="p-3 bg-primary text-white rounded-xl shadow-neo hover:shadow-neo-hover active:translate-y-0.5 transition-all group flex items-center gap-2"
              >
                 <PencilLine size={24} strokeWidth={2.5} />
                 <span className="text-[10px] font-black uppercase tracking-widest pr-2 hidden group-hover:block">Ghi nhận sản xuất</span>
              </button>
              <button 
                onClick={onClose}
                className="p-3 text-gray-400 hover:text-foreground transition-all hover:bg-gray-100 rounded-xl"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
           </div>
        </div>

        <div className="overflow-y-auto custom-scrollbar max-h-[80vh]">
          {/* Info Bar - 4 columns */}
          <div className="p-8 grid grid-cols-4 gap-8 border-b border-gray-50 bg-gray-50/20">
             <div className="space-y-1.5 border-l-2 border-gray-200 pl-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Khách hàng</p>
                <p className="font-bold text-foreground text-sm truncate">{order.customer || 'Khách lẻ'}</p>
             </div>
             <div className="space-y-1.5 border-l-2 border-red-100 pl-4 border-l-red-400/30">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Hạn khách giao</p>
                <p className="font-bold text-red-600 text-sm flex items-center gap-2">
                   <Calendar size={14} /> {order.dueDate}
                </p>
             </div>
             <div className="space-y-1.5 border-l-2 border-neo-blue/20 pl-4 border-l-neo-blue/40">
                <p className="text-[10px] font-black text-neo-blue uppercase tracking-[0.2em] mb-1">Hạn hoàn thành SX</p>
                <p className="font-bold text-neo-blue text-sm flex items-center gap-2 italic">
                   <Clock size={14} /> {order.deadlineProduction ? new Date(order.deadlineProduction).toLocaleDateString('vi-VN') : '---'}
                </p>
             </div>
             <div className="space-y-1.5 border-l-2 border-amber-100 pl-4 border-l-amber-400/30">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Độ ưu tiên</p>
                <p className={cn(
                  "font-black italic text-sm flex items-center gap-1.5",
                  order.priority === 'Urgent' ? 'text-red-500 animate-pulse font-black' : 
                  order.priority === 'High' ? 'text-orange-500' : 'text-amber-500'
                )}>
                  <AlertCircle size={14} />
                  {order.priority === 'Urgent' ? 'RẤT GẤP' : 
                   order.priority === 'High' ? 'KHẨN CẤP' : 'TRUNG BÌNH'}
                </p>
             </div>
          </div>

          {/* Progress Summary Table */}
          <div className="p-8 bg-gray-50/30 border-b border-gray-100">
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
               <LayoutGrid size={14} className="text-primary" />
               Tình hình sản xuất (Process)
            </h3>
            
            <div className="grid grid-cols-4 gap-4">
               {[
                 { label: "Mục tiêu", val: order.quantityTarget, color: "text-foreground" },
                 { label: "Hoàn thành", val: order.quantityCompleted, color: "text-green-600" },
                 { label: "Còn lại", val: Math.max(0, order.quantityTarget - order.quantityCompleted), color: "text-amber-600" },
                 { label: "Tiến độ", val: `${order.progress !== undefined ? order.progress : (order.quantityTarget > 0 ? Math.round((order.quantityCompleted / order.quantityTarget) * 100) : 0)}%`, color: "text-primary" },
               ].map((stat, idx) => (
                 <div key={idx} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</span>
                    <span className={cn("text-xl font-black tabular-nums tracking-tighter", stat.color)}>{stat.val}</span>
                 </div>
               ))}
            </div>

             <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Thay đổi trạng thái quy trình</p>
                   <div className="flex flex-wrap gap-2">
                      {(Object.keys(statusConfig) as (keyof typeof statusConfig)[]).map(status => (
                        <button
                          key={status}
                          onClick={() => onStatusChange(order.id, status)}
                          className={cn(
                            "px-4 py-2 text-[10px] font-black rounded-lg border-2 transition-all uppercase tracking-widest shadow-sm",
                            order.status === status 
                              ? "bg-primary text-white border-black" 
                              : "bg-white text-muted-foreground border-border hover:border-gray-400 hover:bg-gray-50"
                          )}
                        >
                          {statusConfig[status].label}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <p className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Cấu hình & Hạn SX</p>
                     <button 
                       onClick={() => setIsEditingOrder(!isEditingOrder)}
                       className={cn(
                         "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded border-2 transition-all",
                         isEditingOrder ? "bg-neo-pink text-white border-black" : "bg-white text-primary border-primary/20 hover:border-primary"
                       )}
                     >
                       {isEditingOrder ? 'Hủy sửa' : 'Sửa cấu hình'}
                     </button>
                   </div>

                   <div className="flex flex-col gap-4">
                      {isEditingOrder ? (
                        <div className="bg-white border-2 border-black p-4 rounded-xl space-y-4 shadow-neo-sm animate-in slide-in-from-right-4">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sản lượng mục tiêu</label>
                                <input 
                                  type="number"
                                  className="form-input h-10 w-full font-black text-center border-black"
                                  value={editForm.quantityTarget}
                                  onChange={(e) => setEditForm({...editForm, quantityTarget: parseInt(e.target.value) || 0})}
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Phương thức</label>
                                <select 
                                  className="form-input h-10 w-full font-bold text-xs border-black cursor-pointer"
                                  value={editForm.allocationType}
                                  onChange={(e) => setEditForm({...editForm, allocationType: e.target.value as any, assignedTo: ''})}
                                >
                                  <option value="internal">SX Nội bộ</option>
                                  <option value="outsourced">Gia công ngoài</option>
                                </select>
                              </div>
                           </div>

                           <div className="space-y-1.5">
                             <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Đơn vị thực hiện</label>
                             <select 
                               className="form-input h-10 w-full font-bold text-xs border-black cursor-pointer"
                               value={editForm.assignedTo}
                               onChange={(e) => setEditForm({...editForm, assignedTo: e.target.value})}
                             >
                               <option value="">--- Chọn đơn vị ---</option>
                               {editForm.allocationType === 'internal' ? (
                                 workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                               ) : (
                                 outsourcers.map(o => <option key={o.id} value={o.id}>{o.name}</option>)
                               )}
                             </select>
                           </div>

                           <div className="flex items-center gap-2 pt-2">
                             <button 
                               onClick={() => {
                                 onUpdate(order.id, { 
                                   quantityTarget: editForm.quantityTarget,
                                   allocationType: editForm.allocationType,
                                   assignedTo: editForm.assignedTo
                                 });
                                 setIsEditingOrder(false);
                               }}
                               className="flex-1 bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-neo-purple transition-all shadow-neo-sm"
                             >
                               Lưu thay đổi
                             </button>
                             <button 
                               onClick={() => onDelete(order.id)}
                               className="bg-red-50 text-red-500 border-2 border-red-200 p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-neo-sm"
                               title="Xóa lệnh sản xuất"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                           {[
                             { val: 'Urgent', label: 'Rất gấp', color: 'bg-red-500' },
                             { val: 'High', label: 'Khẩn cấp', color: 'bg-orange-500' },
                             { val: 'Medium', label: 'Bình thường', color: 'bg-amber-400' },
                             { val: 'Low', label: 'Thấp', color: 'bg-gray-400' }
                           ].map((p) => (
                             <button
                               key={p.val}
                               onClick={() => onUpdate(order.id, { priority: p.val })}
                               className={cn(
                                 "px-3 py-2 text-[9px] font-black rounded-lg border-2 transition-all uppercase tracking-widest flex items-center gap-1",
                                 order.priority === p.val
                                   ? `${p.color} text-white border-black shadow-neo-sm`
                                   : "bg-white text-muted-foreground border-border hover:bg-gray-50"
                               )}
                             >
                               <AlertCircle size={10} /> {p.label}
                             </button>
                           ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                         <span className="text-[10px] font-black text-foreground border-b-2 border-black/10 pb-0.5 uppercase tracking-tighter shrink-0">Hạn hoàn thành SX:</span>
                         <input 
                           type="date"
                           className="bg-white border-2 border-black px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm hover:shadow-active transition-all"
                           value={order.deadlineProduction ? new Date(order.deadlineProduction).toISOString().split('T')[0] : ''}
                           onChange={(e) => onUpdate(order.id, { deadlineProduction: e.target.value })}
                         />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Collapsible Production Log List */}
          <div className="p-8">
             <button 
               onClick={() => setShowLogsDetail(!showLogsDetail)}
               className="w-full flex items-center justify-between p-5 bg-foreground text-white rounded-xl shadow-neo hover:shadow-neo-hover transition-all group"
             >
                <div className="flex items-center gap-4">
                   <span className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-amber-400">
                      <ClipboardList size={20} />
                   </span>
                   <div className="text-left">
                      <p className="text-sm font-black uppercase tracking-widest">Danh sách sản xuất chi tiết</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Xem lịch sử ghi nhận sản lượng</p>
                   </div>
                </div>
                <div className={cn("transition-transform duration-300", showLogsDetail ? "rotate-90" : "rotate-0")}>
                   <ChevronRight size={24} strokeWidth={3} />
                </div>
             </button>

             {showLogsDetail && (
                <div className="mt-4 border-2 border-black rounded-2xl overflow-x-auto custom-scrollbar animate-in slide-in-from-top duration-300">
                   <table className="w-full text-left border-collapse min-w-[700px] table-fixed">
                      <thead>
                         <tr className="bg-gray-100 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <th className="px-5 py-4 border-b border-black/5 font-black">Thời gian</th>
                            <th className="px-5 py-4 border-b border-black/5 font-black">Nhân sự</th>
                            <th className="px-5 py-4 border-b border-black/5 font-black text-center">SL</th>
                            <th className="px-5 py-4 border-b border-black/5 font-black text-center">Lỗi (K/V)</th>
                            <th className="px-5 py-4 border-b border-black/5 font-black">Ghi chú</th>
                            <th className="px-5 py-4 border-b border-black/5 font-black w-32 text-right shrink-0">Thao tác</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {logsLoading ? (
                            <tr>
                               <td colSpan={6} className="px-5 py-16 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Đang tải lịch sử...</td>
                            </tr>
                         ) : logs.length === 0 ? (
                            <tr>
                               <td colSpan={6} className="px-5 py-16 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Chưa có ghi nhận nào cho lệnh này</td>
                            </tr>
                         ) : (() => {
                            const grouped = logs.reduce((acc: any, log: any) => {
                              const d = new Date(log.startTime || log.createdAt).toLocaleDateString('vi-VN');
                              if (!acc[d]) acc[d] = { logs: [], total: 0 };
                              acc[d].logs.push(log);
                              acc[d].total += (log.quantityProduced || 0);
                              return acc;
                            }, {});

                            return Object.keys(grouped).map(dateStr => (
                              <React.Fragment key={dateStr}>
                                {/* Date Group Header */}
                                <tr 
                                  className="bg-gray-50/80 cursor-pointer hover:bg-gray-100 transition-colors"
                                  onClick={() => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }))}
                                >
                                  <td colSpan={6} className="px-5 py-3 border-y border-black/10">
                                     <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                           <div className={cn("transition-transform duration-200", expandedDates[dateStr] ? "rotate-90" : "rotate-0")}>
                                              <ChevronRight size={16} strokeWidth={3} className="text-primary" />
                                           </div>
                                           <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                              <Calendar size={14} />
                                              NGÀY {dateStr}
                                           </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                           <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tổng sản lượng trong ngày:</span>
                                           <span className="text-xs font-black text-primary tabular-nums bg-white border border-primary/20 px-2 py-0.5 rounded shadow-sm">{grouped[dateStr].total}</span>
                                        </div>
                                     </div>
                                  </td>
                                </tr>
                                
                                {/* Group Logs */}
                                {expandedDates[dateStr] && grouped[dateStr].logs.map((log: any) => (
                                  <tr key={log.id} className="hover:bg-gray-50/30 transition-colors bg-white">
                                     <td className="px-5 py-4 pl-12 border-b border-gray-50">
                                        <p className="text-[10px] text-muted-foreground font-black flex items-center gap-1.5">
                                           <Clock size={10} strokeWidth={3} />
                                           {new Date(log.createdAt || log.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                     </td>
                                     <td className="px-5 py-4 border-b border-gray-50">
                                        <div className="flex items-center gap-2">
                                           <div className="w-6 h-6 rounded bg-black/5 flex items-center justify-center text-[8px] font-black text-muted-foreground border border-black/5">
                                              {log.staffName?.substring(0,2).toUpperCase() || '??'}
                                           </div>
                                           <span className="text-[11px] font-bold text-foreground whitespace-nowrap">{log.staffName || 'N/A'}</span>
                                        </div>
                                     </td>
                                     <td className="px-5 py-4 text-center border-b border-gray-50">
                                        <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded tabular-nums border border-primary/10">{log.quantityProduced}</span>
                                     </td>
                                     <td className="px-5 py-4 text-center border-b border-gray-50">
                                        <div className="flex items-center justify-center gap-2 font-bold tabular-nums">
                                           <span className={cn("text-[10px]", (log.technicalErrorCount || 0) > 0 ? "text-red-500" : "text-gray-300")}>{log.technicalErrorCount || 0}</span>
                                           <span className="text-gray-200">/</span>
                                           <span className={cn("text-[10px]", (log.materialErrorCount || 0) > 0 ? "text-amber-500" : "text-gray-300")}>{log.materialErrorCount || 0}</span>
                                        </div>
                                     </td>
                                     <td className="px-5 py-4 border-b border-gray-50">
                                        <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px] italic">{log.note || '---'}</p>
                                     </td>
                                     <td className="px-5 py-4 border-b border-gray-50 text-right w-32 shrink-0">
                                        <div className="flex items-center justify-end gap-3">
                                           <button 
                                             onClick={() => handleEditLog(log)}
                                             className="p-1.5 hover:bg-neo-blue/10 hover:text-neo-blue rounded-lg transition-colors"
                                             title="Chỉnh sửa"
                                           >
                                              <Edit3 size={14} />
                                           </button>
                                           <button 
                                             onClick={() => handleDeleteLog(log.id)}
                                             className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                             title="Xóa"
                                           >
                                              <Trash2 size={14} />
                                           </button>
                                        </div>
                                     </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            ));
                         })()}
                      </tbody>
                   </table>
                </div>
             )}
          </div>
        </div>
      </div>

      <ProductionBatchForm 
        isOpen={showBatchForm}
        onClose={() => setShowBatchForm(false)}
        onSuccess={() => {
          if (order) {
            loadLogs(order.id);
            onUpdate(order.id, {}); // Trigger refresh in parent
          }
        }}
        productionOrder={{
          id: order.id,
          title: order.title,
          sku: order.sku,
          quantityTarget: order.quantityTarget,
          quantityCompleted: order.quantityCompleted
        }}
      />

      {/* Edit Log Modal */}
      {showEditModal && editingLog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white border-4 border-black rounded-[2.5rem] w-full max-w-xl shadow-neo overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-neo-blue p-6 border-b-4 border-black flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                       <PencilLine size={20} className="text-neo-blue" />
                    </div>
                    <div>
                       <h2 className="text-lg font-black uppercase tracking-tight text-black">Chỉnh sửa ghi nhận</h2>
                       <p className="text-[10px] text-black/60 font-bold uppercase tracking-widest">Hiệu chỉnh sản lượng và thông tin chi tiết</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowEditModal(false)}
                   className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-neo-active active:translate-x-[2px] active:translate-y-[2px]"
                 >
                    <X size={24} strokeWidth={3} />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Sản lượng hoàn thành</label>
                       <input 
                         type="number" 
                         defaultValue={editingLog.quantityProduced}
                         id="edit-qty"
                         className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-bold text-sm focus:bg-white outline-none transition-all tabular-nums text-black"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Nhân sự (Mã/Tên)</label>
                       <input 
                         type="text" 
                         defaultValue={editingLog.staffName}
                         id="edit-staff"
                         disabled
                         className="w-full bg-gray-100 border-2 border-black/10 rounded-xl px-4 py-3 font-bold text-sm text-gray-400 italic"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-red-500">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-60 pl-1 font-bold">Lỗi kỹ thuật (KT)</label>
                       <input 
                         type="number" 
                         defaultValue={editingLog.technicalErrorCount}
                         id="edit-tech"
                         className="w-full bg-red-50 border-2 border-black rounded-xl px-4 py-3 font-bold text-sm focus:bg-white outline-none transition-all tabular-nums text-black"
                       />
                    </div>
                    <div className="space-y-2 text-amber-500">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-60 pl-1 font-bold">Lỗi vật tư (VT)</label>
                       <input 
                         type="number" 
                         defaultValue={editingLog.materialErrorCount}
                         id="edit-mat"
                         className="w-full bg-amber-50 border-2 border-black rounded-xl px-4 py-3 font-bold text-sm focus:bg-white outline-none transition-all tabular-nums text-black"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Ghi chú chi tiết</label>
                    <textarea 
                      id="edit-note"
                      rows={3}
                      defaultValue={editingLog.note}
                      className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-bold text-sm focus:bg-white outline-none transition-all resize-none text-black"
                      placeholder="Nhập lý do điều chỉnh hoặc lỗi phát sinh..."
                    />
                 </div>
              </div>

              <div className="p-8 bg-gray-50 border-t-4 border-black flex gap-4">
                 <button 
                   onClick={() => setShowEditModal(false)}
                   className="flex-1 bg-white border-2 border-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all font-bold"
                 >
                    Hủy bỏ
                 </button>
                 <button 
                   onClick={() => {
                     const qty = (document.getElementById('edit-qty') as HTMLInputElement).value;
                     const tech = (document.getElementById('edit-tech') as HTMLInputElement).value;
                     const mat = (document.getElementById('edit-mat') as HTMLInputElement).value;
                     const note = (document.getElementById('edit-note') as HTMLTextAreaElement).value;
                     handleSaveEditLog({
                       quantityProduced: Number(qty),
                       technicalErrorCount: Number(tech),
                       materialErrorCount: Number(mat),
                       note: note
                     });
                   }}
                   className="flex-[2] bg-neo-blue text-black border-2 border-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-neo hover:shadow-neo-hover active:translate-x-[2px] active:translate-y-[2px] transition-all font-bold"
                 >
                    Lưu thay đổi
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
