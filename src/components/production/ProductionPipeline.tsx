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
  DollarSign,
  Search,
  ArrowUpRight,
  TrendingDown,
  Circle,
  X
} from 'lucide-react';
import QuickWorkLogModal from './QuickWorkLogModal';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

    const allocationBadge = item.allocationType === 'outsourced' 
      ? <span className="bg-retro-mustard/10 text-retro-mustard px-3 py-1 border border-retro-mustard/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 italic">
          <div className="w-1.5 h-1.5 bg-retro-mustard animate-pulse rotate-45" />
          Ủy thác: {item.outsourcedName || 'Vô danh'}
        </span>
      : <span className="bg-retro-sepia text-retro-paper px-3 py-1 border border-retro-sepia text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 italic">
          <div className="w-1.5 h-1.5 bg-retro-paper rotate-45" />
          Trực thuộc Xưởng
        </span>;

    if (item.status === 'finished') return (
      <div className="flex flex-wrap gap-2">
        {allocationBadge}
        <span className="bg-retro-moss/10 text-retro-moss px-3 py-1 border border-retro-moss/20 text-[9px] font-black uppercase tracking-widest italic">Tất toán</span>
      </div>
    );
    
    return (
      <div className="flex flex-wrap gap-2">
        {allocationBadge}
        {item.hasShortage && <span className="bg-retro-brick/10 text-retro-brick px-3 py-1 border border-retro-brick/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 italic"><AlertCircle size={10} strokeWidth={2.5} /> Hiếm muộn NL</span>}
        {isOverdue && <span className="bg-retro-brick text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 italic shadow-sm"><Clock size={10} strokeWidth={2.5} /> Quá kỳ hạn</span>}
        {item.status === 'in_progress' && (
          isRecentlyActive 
            ? <span className="bg-retro-sepia/5 text-retro-sepia px-3 py-1 border-2 border-dashed border-retro-sepia/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 italic"><PlayCircle size={10} strokeWidth={2.5} /> Đang thụ lý</span>
            : <span className="bg-retro-paper text-retro-earth/40 px-3 py-1 border border-retro-earth/10 text-[9px] font-black uppercase tracking-widest flex items-center gap-1 italic"><PauseCircle size={10} strokeWidth={2.5} /> Đình trệ</span>
        )}
        {item.status === 'outsourced' && <span className="bg-retro-mustard text-white px-3 py-1 text-[9px] font-black uppercase tracking-widest italic shadow-sm">Đã phát lệnh GC</span>}
      </div>
    );
  };

  const Column = ({ title, status, colorClass }: { title: string, status: string, colorClass: string }) => {
    const columnItems = items.filter(item => item.status === status);
    
    return (
      <div className="flex flex-col gap-8 h-full">
        <div className="flex items-center justify-between px-2 font-typewriter">
          <h3 className="flex items-center gap-4 text-[11px] font-black text-retro-sepia uppercase tracking-[0.2em] italic">
            <div className={cn("w-3 h-3 rotate-45 shadow-sm", colorClass)} /> {title}
          </h3>
          <span className="text-[10px] font-black text-retro-earth/40 uppercase italic opacity-60">Số hiệu: {columnItems.length}</span>
        </div>

        <div className="flex-1 bg-white/40 border-2 border-retro-sepia/10 p-6 space-y-6 overflow-y-auto scrollbar-hide shadow-inner min-h-[500px]">
          {columnItems.map(item => {
            const progress = Math.round((item.qtyDone / item.qtyTarget) * 100);
            const isOverdue = new Date(item.deadline) < new Date() && item.qtyDone < item.qtyTarget;

            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={cn(
                  "bg-white border-2 p-8 shadow-sm hover:shadow-xl transition-all duration-500 group relative cursor-pointer active:scale-[0.98] font-typewriter",
                  isOverdue ? "border-retro-brick/20" : "border-retro-sepia/5 hover:border-retro-sepia/20"
                )}
              >
                {/* ID & DEADLINE */}
                <div className="flex justify-between items-start mb-6">
                   <div className="flex flex-col gap-3">
                      <span className="text-[11px] font-black text-retro-sepia uppercase tracking-widest bg-retro-paper border-2 border-retro-sepia/10 px-4 py-1.5 italic group-hover:bg-retro-sepia group-hover:text-retro-paper transition-all">
                        #{item.contractCode}
                      </span>
                      <span className="text-[9px] font-black text-retro-brick uppercase tracking-tighter opacity-60">SKU: {item.sku}</span>
                   </div>
                   <div className={cn(
                     "flex items-center gap-2 text-[10px] font-black italic",
                     isOverdue ? "text-retro-brick" : "text-retro-earth/40"
                   )}>
                     <Clock size={12} strokeWidth={2.5} /> {item.deadline}
                   </div>
                </div>

                {/* NAME & PRODUCT */}
                <div className="mb-8">
                  <h4 className="font-black text-retro-sepia text-sm uppercase tracking-tight leading-tight group-hover:text-retro-brick transition-all italic underline decoration-retro-mustard/20 underline-offset-4 decoration-dotted">
                    {item.name}
                  </h4>
                  <p className="text-[10px] font-black text-retro-earth/40 uppercase tracking-widest mt-3 italic">
                    Đối tác: {item.customerName}
                  </p>
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-3 mb-8">
                   <div className="flex justify-between items-end px-1">
                      <span className="text-[10px] font-black text-retro-sepia italic tracking-tighter">{item.qtyDone} / {item.qtyTarget} <span className="text-[8px] opacity-40">PCS</span></span>
                      <span className="text-[10px] font-black text-retro-brick italic">{progress}%</span>
                   </div>
                   <div className="h-2 bg-retro-paper border border-retro-sepia/10 shadow-inner">
                      <div 
                        className={cn(
                          "h-full transition-all duration-1000 ease-out",
                          isOverdue ? "bg-retro-brick" : "bg-retro-sepia"
                        )}
                        style={{ width: `${progress}%` }}
                      >
                         <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:10px_10px]" />
                      </div>
                   </div>
                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center pt-6 border-t border-retro-sepia/5">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item)}
                  </div>
                  <ArrowUpRight size={18} strokeWidth={2} className="text-retro-sepia/20 group-hover:text-retro-brick transition-all translate-x-1 group-hover:translate-x-0" />
                </div>
              </div>
            );
          })}
          
          {columnItems.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center text-retro-earth/10 italic text-xs font-typewriter uppercase tracking-widest">
               <Package size={32} strokeWidth={0.5} className="mb-4 rotate-12" />
               Hồ sơ trống
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full relative font-typewriter text-retro-sepia">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-black text-retro-sepia uppercase tracking-tighter italic">
            Nhật trình <span className="text-retro-brick underline decoration-double decoration-retro-brick/30 underline-offset-4">Pipeline</span>
          </h2>
          <div className="text-[10px] text-retro-earth/40 font-black uppercase tracking-[0.3em] mt-3 italic flex items-center gap-3">
             <div className="w-2 h-2 bg-retro-mustard rotate-45" /> Điều phối Tiến độ & Nhân lực Xưởng
          </div>
        </div>
        
        <Link 
          href="/production/work-log"
          className="flex items-center gap-4 px-10 py-5 bg-retro-sepia text-retro-paper shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-brick transition-all active:scale-95 italic group"
        >
          <FileText size={18} strokeWidth={2} className="text-retro-mustard group-hover:text-white transition-colors" />
          Nhật trình XS
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 h-[calc(100vh-340px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-6 duration-1000">
        {loading ? (
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-40 text-retro-earth/40 font-black uppercase tracking-[0.4em] text-[10px] italic">
            <div className="w-12 h-12 border-4 border-retro-sepia/10 border-t-retro-brick animate-spin mb-8" />
            Đang đồng bộ Pipeline thực cương...
          </div>
        ) : (
          <>
            <Column title="Chờ Thụ lý (Xưởng)" status="pending" colorClass="bg-retro-sepia opacity-40" />
            <Column title="Đang Gia công ngoài" status="outsourced" colorClass="bg-retro-mustard shadow-[0_0_8px_rgba(218,165,32,0.4)]" />
            <Column title="Đang tại xưởng" status="in_progress" colorClass="bg-retro-brick animate-pulse" />
            <Column title="Đã hoàn thành" status="finished" colorClass="bg-retro-moss" />
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500 overflow-hidden">
          <div 
            className="absolute inset-0 bg-retro-sepia/60 backdrop-blur-md"
            onClick={() => {
              setSelectedItem(null);
              setProfitData(null);
            }}
          />
          
          <div className="relative bg-retro-paper w-full max-w-5xl max-h-[90vh] overflow-hidden retro-card !p-0 shadow-[0_30px_60px_-15px_rgba(62,39,35,0.5)] flex flex-col animate-in zoom-in-95 duration-500 border-2">
            <div className="washi-tape-top" />
            
            {/* MODAL HEADER */}
            <div className="p-10 md:p-14 border-b-2 border-retro-sepia/10 flex justify-between items-start gap-12 bg-white/60 relative">
               <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                  <Package size={400} strokeWidth={0.5} className="text-retro-sepia" />
               </div>

               <div className="flex-1 relative z-10 font-typewriter">
                 <div className="flex items-center gap-6 mb-6">
                    <span className="text-[12px] font-black px-5 py-2 bg-retro-sepia text-retro-paper uppercase tracking-widest shadow-xl rotate-1 italic">
                      {selectedItem.sku}
                    </span>
                    {getStatusBadge(selectedItem)}
                 </div>
                 <h2 className="text-4xl font-black text-retro-sepia uppercase tracking-tighter leading-tight mb-4 italic underline decoration-retro-mustard/30 underline-offset-8 decoration-dotted">
                   {selectedItem.name}
                 </h2>
                 <p className="text-[10px] text-retro-earth/60 font-black uppercase tracking-[0.2em] flex items-center gap-3 italic">
                   <Clock size={16} strokeWidth={2} className="text-retro-mustard" /> Thời hạn Sản xuất: {selectedItem.deadline}
                 </p>
               </div>
                <button 
                onClick={() => {
                  setSelectedItem(null);
                  setProfitData(null);
                }}
                className="p-5 bg-retro-paper border-2 border-retro-sepia/10 hover:bg-retro-brick hover:text-white transition-all rotate-3 hover:rotate-0 shadow-sm relative z-10"
               >
                 <X size={28} strokeWidth={2.5} />
               </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="flex-1 overflow-y-auto p-10 md:p-14 space-y-16 scrollbar-hide bg-retro-paper/40 pb-32">
              {/* STATS OVERVIEW */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div className="bg-white p-10 border-2 border-retro-sepia/5 shadow-sm space-y-3 relative group overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 text-retro-sepia/5 group-hover:text-retro-sepia/10 transition-all">
                       <Package size={100} strokeWidth={0.5} />
                    </div>
                    <p className="text-[10px] font-black text-retro-earth/40 uppercase tracking-[0.2em] italic">Chỉ tiêu Sản lượng</p>
                    <p className="text-4xl font-black text-retro-sepia italic tracking-tighter">
                       {selectedItem.qtyTarget} <span className="text-xs font-bold text-retro-earth/40 not-italic uppercase ml-2">Hóa vật</span>
                    </p>
                 </div>
                 <div className="bg-white p-10 border-2 border-retro-sepia/5 shadow-sm space-y-3 relative group overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 text-retro-moss/10 group-hover:text-retro-moss/20 transition-all">
                       <CheckCircle2 size={100} strokeWidth={0.5} />
                    </div>
                    <p className="text-[10px] font-black text-retro-moss/60 uppercase tracking-[0.2em] italic">Thực thu Kiện bản</p>
                    <p className="text-4xl font-black text-retro-moss italic tracking-tighter">
                       {selectedItem.qtyDone} <span className="text-xs font-bold text-retro-earth/40 not-italic uppercase ml-2">Kiện</span>
                    </p>
                 </div>
                  <div className="bg-retro-sepia p-10 border-t-4 border-retro-mustard shadow-xl space-y-3 relative overflow-hidden group">
                    <div className="absolute -right-6 -bottom-6 text-white/5 group-hover:text-white/10 transition-all">
                       <TrendingDown size={100} strokeWidth={0.5} />
                    </div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] italic">Hiệu suất Thực cương</p>
                    <p className="text-4xl font-black text-white italic tracking-tighter">
                       {Math.round((selectedItem.qtyDone / selectedItem.qtyTarget) * 100)}%
                    </p>
                  </div>
              </div>

              {/* PROFIT ANALYSIS SECTION */}
              <section className="bg-white p-10 border-2 border-retro-sepia/10 relative overflow-hidden group">
                <div className="washi-tape-top !bg-retro-mustard/20" />
                <div className="flex flex-col md:flex-row items-center justify-between mb-12 relative z-10 gap-8">
                   <h3 className="text-sm font-black text-retro-sepia uppercase tracking-[0.2em] flex items-center gap-4 italic font-typewriter">
                      <DollarSign size={24} className="text-retro-moss" strokeWidth={2.5} /> Thụ báo Lợi nhuận (Chốt kỳ real-time)
                   </h3>
                   {profitData?.isLowMargin && (
                     <div className="flex items-center gap-4 px-6 py-3 bg-retro-brick/5 text-retro-brick border-2 border-retro-brick/20 animate-pulse rotate-1 italic">
                        <AlertCircle size={18} strokeWidth={2.5} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cảnh báo: Biên lợi nhuận sụt giảm</span>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10 font-typewriter">
                   <div className="bg-retro-paper p-6 border-b-2 border-retro-sepia/20 shadow-inner">
                      <p className="text-[9px] font-black text-retro-earth/40 uppercase tracking-widest mb-2 italic">Giá ước định HĐ</p>
                      <p className="text-xl font-black text-retro-sepia italic">{profitData?.contractPrice.toLocaleString() || '0'} <small className="text-[10px] opacity-40">đ</small></p>
                   </div>
                   <div className="bg-retro-paper p-6 border-b-2 border-retro-brick/20 shadow-inner">
                      <p className="text-[9px] font-black text-retro-brick/60 uppercase tracking-widest mb-2 italic">Thực chi COGS</p>
                      <p className="text-xl font-black text-retro-brick italic">-{profitData?.totalActualCOGS.toLocaleString() || '0'} <small className="text-[10px] opacity-40">đ</small></p>
                   </div>
                   <div className="bg-retro-paper p-6 border-b-2 border-retro-moss/20 shadow-inner">
                      <p className="text-[9px] font-black text-retro-moss/60 uppercase tracking-widest mb-2 italic">Thặng dư Ròng</p>
                      <p className={cn("text-xl font-black italic", profitData && profitData.profit > 0 ? "text-retro-moss" : "text-retro-brick")}>
                        {profitData?.profit.toLocaleString() || '0'} <small className="text-[10px] opacity-40">đ</small>
                      </p>
                   </div>
                   <div className={cn(
                     "p-8 shadow-xl flex flex-col justify-center items-center text-center rotate-2 group-hover:rotate-0 transition-all",
                     profitData?.isLowMargin ? "bg-retro-brick text-white" : "bg-retro-sepia text-white"
                   )}>
                      <p className="text-[9px] font-black uppercase opacity-60 mb-2 tracking-[0.2em] italic">Biên Độ Lợi giá</p>
                      <p className="text-3xl font-black italic tracking-tighter">{profitData?.margin.toFixed(1) || '0'}%</p>
                   </div>
                </div>

                <div className="absolute -right-16 -bottom-16 text-retro-sepia/5 pointer-events-none group-hover:scale-110 transition-transform">
                   <DollarSign size={240} strokeWidth={1} />
                </div>
              </section>

              {/* PERSONNEL SECTION */}
              <section className="font-typewriter">
                <h3 className="text-sm font-black text-retro-sepia uppercase tracking-[0.2em] mb-10 flex items-center gap-4 italic underline decoration-retro-mustard/30 underline-offset-8">
                  <User size={24} className="text-retro-brick" strokeWidth={2.5} /> Nhân sổ & Ký lục Chế tác
                </h3>
                
                <div className="space-y-6">
                  {selectedItem.history?.map((worker, idx) => (
                    <div 
                      key={idx} 
                      className={cn(
                        "border-2 transition-all duration-500 overflow-hidden bg-white shadow-sm",
                        expandedWorker === worker.name ? "border-retro-sepia shadow-xl translate-x-1" : "border-retro-sepia/5 hover:border-retro-sepia/20"
                      )}
                    >
                      <button 
                        onClick={() => setExpandedWorker(expandedWorker === worker.name ? null : worker.name)}
                        className="w-full p-8 flex items-center justify-between gap-6"
                      >
                        <div className="flex items-center gap-6">
                           <div className="w-14 h-14 bg-retro-paper border-2 border-retro-sepia text-retro-sepia flex items-center justify-center font-black text-xs shadow-md rotate-3 group-hover:rotate-0 transition-all">
                             {worker.name.charAt(0)}
                           </div>
                           <div className="text-left font-typewriter">
                             <p className="text-base font-black text-retro-sepia uppercase tracking-tight italic">{worker.name}</p>
                             <div className="flex items-center gap-3 mt-2">
                                <div className={cn(
                                  "w-2 h-2 rotate-45",
                                  worker.status === 'active' ? "bg-retro-moss animate-pulse" : "bg-retro-earth/20"
                                )} />
                                <span className="text-[10px] font-black text-retro-earth/40 uppercase tracking-widest italic">{worker.status === 'active' ? 'Đang hạ thủ' : 'Hưu chiến'}</span>
                             </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-10">
                           <div className="text-right hidden sm:block">
                             <p className="text-[9px] font-black text-retro-earth/40 uppercase tracking-[0.2em] mb-2 italic">Thực thu</p>
                             <p className="text-lg font-black text-retro-sepia leading-none italic">{worker.totalDone} <span className="text-[10px] uppercase opacity-40">PCS</span></p>
                           </div>
                           <ChevronDown className={cn("text-retro-sepia/20 transition-transform duration-500", expandedWorker === worker.name && "rotate-180 text-retro-brick")} size={24} strokeWidth={2.5} />
                        </div>
                      </button>

                      {/* WORK LOGS TABLE */}
                      {expandedWorker === worker.name && (
                        <div className="px-10 pb-10 animate-in slide-in-from-top-6 duration-500">
                           <div className="bg-retro-paper/20 border-2 border-dashed border-retro-sepia/10 p-2">
                              <table className="w-full text-[11px] border-collapse font-typewriter">
                                 <thead>
                                    <tr className="bg-retro-sepia/5 border-b border-retro-sepia/10">
                                       <th className="px-6 py-4 text-left font-black text-retro-earth/40 uppercase tracking-widest italic">Kỳ báo</th>
                                       <th className="px-6 py-4 text-left font-black text-retro-earth/40 uppercase tracking-widest italic">Thời khắc</th>
                                       <th className="px-6 py-4 text-right font-black text-retro-earth/40 uppercase tracking-widest italic">Lượng</th>
                                       <th className="px-6 py-4 text-left font-black text-retro-earth/40 uppercase tracking-widest italic">Di sao</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y-2 divide-retro-sepia/5">
                                    {worker.logs.map((log, lIdx) => (
                                      <tr key={lIdx} className="hover:bg-white transition-colors group">
                                         <td className="px-6 py-4 font-black text-retro-sepia italic">{log.date}</td>
                                         <td className="px-6 py-4 font-black text-retro-earth/40 tracking-tighter opacity-60 uppercase">{log.start} - {log.end}</td>
                                         <td className="px-6 py-4 text-right">
                                            <span className="text-sm font-black text-retro-brick italic bg-retro-brick/5 px-3 py-1 border border-retro-brick/10">{log.qty} <small className="text-[9px] opacity-40">PCS</small></span>
                                         </td>
                                         <td className="px-6 py-4 text-retro-earth/60 italic font-handwriting text-sm">{log.note || '-'}</td>
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
            <div className="p-10 md:p-14 bg-white/60 border-t-2 border-retro-sepia/10 flex justify-between gap-8 relative z-20 font-typewriter">
               <button 
                onClick={() => {
                  setSelectedItem(null);
                  setProfitData(null);
                }}
                className="px-10 py-5 bg-retro-paper border-2 border-retro-sepia/10 text-[11px] font-black uppercase tracking-[0.2em] text-retro-earth/60 hover:text-retro-sepia hover:border-retro-sepia transition-all italic active:scale-95"
               >
                 Phục hồi Pipeline
               </button>
               <button 
                onClick={() => setIsQuickLogOpen(true)}
                className="flex items-center gap-4 px-12 py-5 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all active:scale-95 italic"
               >
                 <FileEdit size={20} strokeWidth={2.5} /> Ký lục Sản lượng
               </button>
            </div>
            <div className="torn-paper-bottom" />
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
