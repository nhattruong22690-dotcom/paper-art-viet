"use client";

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  User,
  MoreHorizontal,
  Package,
  FileEdit,
  FileText,
  DollarSign
} from 'lucide-react';
import QuickWorkLogModal from './QuickWorkLogModal';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
// import { getProductionOrderProfit } from '@/services/workLog.service';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface WorkSession {
  date: string;
  start: string;
  end: string;
  qty: number;
  note?: string;
}

interface WorkerHistory {
  name: string;
  avatar?: string;
  totalDone: number;
  status: 'active' | 'resting';
  logs: WorkSession[];
}

interface PipelineItem {
  id: string;
  sku: string;
  name: string;
  contractCode: string;
  customerName: string;
  qtyTarget: number;
  qtyDone: number;
  deadline: string;
  status: 'pending' | 'outsourced' | 'in_progress' | 'finished' | 'paused';
  allocationType?: 'internal' | 'outsourced';
  outsourcedName?: string;
  lastLogAt?: string; // ISO string
  hasShortage?: boolean;
  history?: WorkerHistory[];
}

interface ProfitData {
  contractPrice: number;
  totalRevenue: number;
  totalActualCOGS: number;
  profit: number;
  margin: number;
  isLowMargin: boolean;
}

// Mock data removed - fetching from API

export default function ProductionPipeline() {
  const [items, setItems] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(null);

  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  const fetchProductionOrders = async () => {
    try {
      const response = await fetch('/api/production/orders');
      const data = await response.json();
      
      const mappedItems: PipelineItem[] = data.map((po: any) => ({
        id: po.id,
        sku: po.product?.sku || 'N/A',
        name: po.product?.name || 'Sản phẩm không xác định',
        contractCode: po.order?.contractCode || `ORDER-${po.orderId.slice(-4).toUpperCase()}`,
        customerName: po.order?.customer?.name || 'Khách vãng lai',
        qtyTarget: po.quantityTarget || 0,
        qtyDone: po.quantityCompleted || 0,
        deadline: po.deadlineProduction ? new Date(po.deadlineProduction).toISOString().split('T')[0] : 'N/A',
        status: (po.currentStatus || 'pending') as any,
        allocationType: po.allocationType,
        outsourcedName: po.outsourcedName,
        lastLogAt: po.updatedAt,
        history: po.workLogs?.map((log: any) => ({
          name: log.staffName || 'Worker',
          totalDone: log.quantityProduced || 0,
          status: 'resting',
          logs: []
        })) || []
      }));

      setItems(mappedItems);
    } catch (error) {
      console.error('Failed to fetch production orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionOrders();
  }, []);

  const [expandedWorker, setExpandedWorker] = useState<string | null>(null);
  const [profitData, setProfitData] = useState<ProfitData | null>(null);
  const [loadingProfit, setLoadingProfit] = useState(false);

  useEffect(() => {
     if (selectedItem) {
        setLoadingProfit(true);
        fetch(`/api/production/profit?id=${selectedItem.id}`)
          .then(res => res.json())
          .then(data => {
            if (data.error) throw new Error(data.error);
            setProfitData(data);
          })
          .catch(e => console.error("Profit fetch failed", e))
          .finally(() => setLoadingProfit(false));
     }
  }, [selectedItem?.id]);

  const getStatusBadge = (item: PipelineItem) => {
    const isOverdue = new Date(item.deadline) < new Date() && item.qtyDone < item.qtyTarget;
    const isRecentlyActive = item.lastLogAt && (new Date().getTime() - new Date(item.lastLogAt).getTime()) < 30 * 60 * 1000;

    // Badge Phân bổ (Nổi bật)
    const allocationBadge = item.allocationType === 'outsourced' 
      ? <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border border-amber-200 shadow-sm flex items-center gap-1.5 leading-none">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          GIA CÔNG: {item.outsourcedName || 'Chưa định danh'}
        </span>
      : <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight border border-blue-200 shadow-sm flex items-center gap-1.5 leading-none">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          XƯỞNG NỘI BỘ
        </span>;

    if (item.status === 'finished') return (
      <div className="flex flex-wrap gap-2">
        {allocationBadge}
        <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-emerald-200">Hoàn thành</span>
      </div>
    );
    
    return (
      <div className="flex flex-wrap gap-2">
        {allocationBadge}
        {item.hasShortage && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-amber-200 shadow-sm flex items-center gap-1"><AlertCircle size={10} /> Thiếu NL</span>}
        {isOverdue && <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-rose-200 shadow-sm flex items-center gap-1"><Clock size={10} /> Trễ hạn</span>}
        {item.status === 'in_progress' && (
          isRecentlyActive 
            ? <span className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-primary-200 shadow-sm flex items-center gap-1"><PlayCircle size={10} /> Đang làm</span>
            : <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-gray-200 shadow-sm flex items-center gap-1"><PauseCircle size={10} /> Tạm dừng</span>
        )}
        {item.status === 'outsourced' && <span className="bg-amber-600 text-white px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border border-amber-700 shadow-sm">Đã giao GC</span>}
      </div>
    );
  };

  const Column = ({ title, status, color }: { title: string, status: string, color: string }) => {
    const columnItems = items.filter(item => item.status === status);
    
    return (
      <div className="flex flex-col gap-6 h-full">
        <div className="flex items-center justify-between px-2">
          <h3 className="flex items-center gap-3 text-[11px] font-black text-gray-400 uppercase tracking-widest">
            <span className={cn("w-2.5 h-2.5 rounded-full shadow-sm", color)}></span> {title}
          </h3>
          <span className="text-[10px] font-black text-gray-300 uppercase italic">Tổng: {columnItems.length}</span>
        </div>

        <div className="flex-1 bg-gray-50/30 rounded-[32px] border border-gray-100/50 p-5 space-y-5 overflow-y-auto border-dashed scrollbar-hide">
          {columnItems.map(item => {
            const progress = Math.round((item.qtyDone / item.qtyTarget) * 100);
            const isOverdue = new Date(item.deadline) < new Date() && item.qtyDone < item.qtyTarget;

            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "bg-white border rounded-[28px] p-6 shadow-sm hover:shadow-xl transition-all duration-500 group relative cursor-pointer active:scale-[0.98]",
                  isOverdue ? "border-rose-100/50" : "border-gray-100"
                )}
              >
                {/* ID & DEADLINE */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-tight shadow-sm border-2",
                        isOverdue ? "bg-rose-600 text-white border-rose-500" : "bg-gray-900 text-white border-gray-800"
                      )}>
                        HĐ: {item.contractCode}
                      </span>
                      <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-lg border border-primary-100 uppercase tracking-tighter">
                        SP: {item.sku}
                      </span>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1.5 text-[10px] font-black italic mt-1",
                    isOverdue ? "text-rose-500" : "text-gray-400"
                  )}>
                    <Clock size={12} strokeWidth={3} /> {item.deadline}
                  </div>
                </div>

                {/* NAME & PRODUCT */}
                <div className="mb-6">
                  <h4 className="font-black text-gray-800 text-sm uppercase tracking-tight leading-tight group-hover:text-primary-600 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">
                    Khách: {item.customerName}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Package size={12} className="text-gray-300" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.qtyTarget} PCS</span>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-2 mb-6">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-gray-900 italic tracking-tighter">{item.qtyDone} / {item.qtyTarget}</span>
                      <span className="text-[10px] font-black text-primary-600">{progress}%</span>
                   </div>
                   <div className="h-2.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100/50">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 ease-out shadow-sm",
                          isOverdue ? "bg-rose-500" : "bg-primary-600"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                   </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    {getStatusBadge(item)}
                  </div>
                  <button className="flex items-center gap-1 text-[10px] font-black text-gray-400 hover:text-primary-600 uppercase tracking-widest transition-all">
                    Chi tiết <ChevronRight size={14} strokeWidth={3} />
                  </button>
                </div>
              </div>
            );
          })}
          
          {columnItems.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center text-gray-300 grayscale opacity-40 italic text-xs">
               <Package size={32} className="mb-2" />
               Trống...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full relative text-gray-800">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">
            Pipeline <span className="text-primary-600 underline decoration-2 underline-offset-4">Sản xuất</span>
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Theo dõi tiến độ & Điều phối xưởng</p>
        </div>
        
        <Link 
          href="/production/work-log"
          className="flex items-center gap-3 px-6 py-3.5 bg-gray-900 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-xl shadow-gray-200 group active:scale-95"
        >
          <FileText size={16} className="text-primary-400 group-hover:text-white transition-colors" />
          Logs XS
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 h-[calc(100vh-340px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {loading ? (
          <div className="lg:col-span-3 flex items-center justify-center p-20 animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs italic">
            Đang tải dữ liệu Pipeline...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:col-span-3">
              <Column title="Chờ sản xuất (Xưởng)" status="pending" color="bg-blue-400" />
              <Column title="Đã giao gia công" status="outsourced" color="bg-amber-500" />
              <Column title="Đang thực hiện" status="in_progress" color="bg-primary-500" />
              <Column title="Đã hoàn thành" status="finished" color="bg-emerald-500" />
            </div>
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-12 transition-all duration-500 animate-in fade-in">
          <div 
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            onClick={() => {
              setSelectedItem(null);
              setProfitData(null);
            }}
          />
          
          <div className="relative bg-white w-full max-w-4xl max-h-full overflow-hidden rounded-[48px] shadow-2xl border border-white/20 flex flex-col animate-in zoom-in-95 duration-500">
            {/* MODAL HEADER */}
            <div className="p-10 pb-6 border-b border-gray-50 flex justify-between items-start gap-8">
               <div className="flex-1">
                 <div className="flex items-center gap-3 mb-3">
                    <span className="text-[11px] font-black px-3 py-1 bg-primary-600 text-white rounded-full uppercase tracking-widest shadow-lg shadow-primary-200">
                      {selectedItem.sku}
                    </span>
                    {getStatusBadge(selectedItem)}
                 </div>
                 <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-tight mb-2 italic">
                   {selectedItem.name}
                 </h2>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                   <Clock size={14} className="text-gray-300" /> Deadline: {selectedItem.deadline}
                 </p>
               </div>
                <button 
                onClick={() => {
                  setSelectedItem(null);
                  setProfitData(null);
                }}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all"
               >
                 <CheckCircle2 size={24} />
               </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
              {/* STATS OVERVIEW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng sản lượng</p>
                    <p className="text-2xl font-black text-gray-900">{selectedItem.qtyTarget} <span className="text-xs text-gray-400 uppercase">pcs</span></p>
                 </div>
                 <div className="bg-primary-50/30 p-6 rounded-[32px] border border-primary-100/50">
                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-1">Đã hoàn thành</p>
                    <p className="text-2xl font-black text-primary-700">{selectedItem.qtyDone} <span className="text-xs text-primary-400 uppercase">pcs</span></p>
                 </div>
                  <div className="bg-gray-50/50 p-6 rounded-[32px] border border-gray-100 font-mono">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tiến độ</p>
                    <p className="text-2xl font-black text-gray-900">{Math.round((selectedItem.qtyDone / selectedItem.qtyTarget) * 100)}%</p>
                  </div>
              </div>

              {/* PROFIT ANALYSIS SECTION - NEW */}
              <section className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-[40px] border border-gray-100 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3 italic">
                      <DollarSign size={18} className="text-emerald-500" /> Báo cáo Lợi nhuận Thực tế (Real-time COGS)
                   </h3>
                   {profitData?.isLowMargin && (
                     <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full border border-rose-100 animate-bounce">
                        <AlertCircle size={14} />
                        <span className="text-[10px] font-black uppercase tracking-tight">Biên lợi nhuận thấp! (Target &gt; 20%)</span>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative z-10">
                   <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Giá Hợp đồng</p>
                      <p className="text-lg font-black text-gray-900 italic">{profitData?.contractPrice.toLocaleString() || '0'}đ</p>
                   </div>
                   <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Tổng COGS Vật tư</p>
                      <p className="text-lg font-black text-rose-500 italic">-{profitData?.totalActualCOGS.toLocaleString() || '0'}đ</p>
                   </div>
                   <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Lợi nhuận ròng</p>
                      <p className={cn("text-lg font-black italic", profitData && profitData.profit > 0 ? "text-emerald-600" : "text-rose-600")}>
                        {profitData?.profit.toLocaleString() || '0'}đ
                      </p>
                   </div>
                   <div className={cn(
                     "p-6 rounded-[32px] border shadow-lg flex flex-col justify-center items-center text-center",
                     profitData?.isLowMargin ? "bg-rose-600 border-rose-400 text-white" : "bg-emerald-600 border-emerald-400 text-white"
                   )}>
                      <p className="text-[9px] font-bold uppercase opacity-80 mb-0.5 tracking-widest">Biên Lợi nhuận</p>
                      <p className="text-2xl font-black italic tracking-tighter">{profitData?.margin.toFixed(1) || '0'}%</p>
                   </div>
                </div>

                {/* Decoration */}
                <div className="absolute -right-10 -bottom-10 text-gray-100 pointer-events-none">
                   <DollarSign size={200} />
                </div>
              </section>

              {/* PERSONNEL SECTION */}
              <section>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-3">
                  <User size={18} className="text-primary-600" /> Nhân sự & Lịch sử làm việc
                </h3>
                
                <div className="space-y-4">
                  {selectedItem.history?.map((worker, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "border rounded-[32px] transition-all duration-500 overflow-hidden",
                        expandedWorker === worker.name ? "bg-white border-primary-100 shadow-xl" : "bg-gray-50/30 border-gray-100 hover:bg-gray-50"
                      )}
                    >
                      <button 
                        onClick={() => setExpandedWorker(expandedWorker === worker.name ? null : worker.name)}
                        className="w-full p-6 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary-600 border border-gray-100 shadow-sm">
                             <User size={24} />
                           </div>
                           <div className="text-left">
                             <p className="text-sm font-black text-gray-900 uppercase tracking-tight">{worker.name}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  worker.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                                )} />
                                <span className="text-[10px] font-black text-gray-400 uppercase">{worker.status === 'active' ? 'Đang làm' : 'Đang nghỉ'}</span>
                             </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="text-right">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Sản lượng</p>
                             <p className="text-sm font-black text-gray-900 leading-none">{worker.totalDone} <span className="text-[9px] uppercase">pcs</span></p>
                           </div>
                           <MoreHorizontal className={cn("text-gray-400 transition-transform duration-500", expandedWorker === worker.name && "rotate-90")} size={20} />
                        </div>
                      </button>

                      {/* WORK LOGS TABLE */}
                      {expandedWorker === worker.name && (
                        <div className="px-6 pb-6 animate-in slide-in-from-top-4 duration-500">
                           <div className="bg-white border border-gray-50 rounded-2xl overflow-hidden">
                              <table className="w-full text-[11px]">
                                 <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                       <th className="px-4 py-3 text-left font-black text-gray-400 uppercase tracking-tighter">Ngày</th>
                                       <th className="px-4 py-3 text-left font-black text-gray-400 uppercase tracking-tighter">Thời gian</th>
                                       <th className="px-4 py-3 text-right font-black text-gray-400 uppercase tracking-tighter">Sản lượng</th>
                                       <th className="px-4 py-3 text-left font-black text-gray-400 uppercase tracking-tighter">Ghi chú</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-50">
                                    {worker.logs.map((log, lIdx) => (
                                      <tr key={lIdx} className="hover:bg-primary-50/10 transition-colors">
                                         <td className="px-4 py-3 font-bold text-gray-600">{log.date}</td>
                                         <td className="px-4 py-3 font-medium text-gray-400 tracking-tighter">{log.start} - {log.end}</td>
                                         <td className="px-4 py-3 text-right font-black text-gray-900">{log.qty} <span className="text-[9px] text-gray-300 uppercase">pcs</span></td>
                                         <td className="px-4 py-3 text-gray-400 italic font-medium">{log.note || '-'}</td>
                                      </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
            
            {/* MODAL FOOTER */}
            <div className="p-8 bg-gray-50/50 border-t border-gray-50 flex justify-end gap-4">
               <button 
                onClick={() => {
                  setSelectedItem(null);
                  setProfitData(null);
                }}
                className="px-8 py-4 bg-white border border-gray-100 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all shadow-sm"
               >
                 Đóng cửa sổ
               </button>
               <button 
                onClick={() => setIsQuickLogOpen(true)}
                className="flex items-center gap-2 px-10 py-4 bg-primary-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all active:scale-95"
               >
                 <FileEdit size={16} /> Ghi chép Sản xuất
               </button>
            </div>
          </div>
        </div>
      )}

      {/* QUICK LOG MODAL */}
      {selectedItem && (
        <QuickWorkLogModal
          isOpen={isQuickLogOpen}
          onClose={() => setIsQuickLogOpen(false)}
          productionOrderId={selectedItem.id}
          orderName={`${selectedItem.sku} - ${selectedItem.name}`}
          onSuccess={() => {
            fetchProductionOrders();
          }}
        />
      )}
    </div>
  );
}
