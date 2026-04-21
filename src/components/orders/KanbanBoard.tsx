"use client";

import React, { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import OrderDetailsPanel from './OrderDetailsPanel';
import { Search, Filter, LayoutGrid, List, CheckCircle2, Truck, Package, Factory, ClipboardList, AlertTriangle, ShoppingCart, History, ChevronRight } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STAGES = [
  { id: 'new', label: 'Mới lên đơn', icon: ClipboardList, color: 'bg-blue-500' },
  { id: 'in_production', label: 'Đang sản xuất', icon: Factory, color: 'bg-amber-500' },
  { id: 'packing', label: 'Chờ đóng gói', icon: Package, color: 'bg-purple-500' },
  { id: 'shipping', label: 'Đang giao hàng', icon: Truck, color: 'bg-indigo-500' },
  { id: 'completed', label: 'Hoàn tất', icon: CheckCircle2, color: 'bg-emerald-500' },
];

interface KanbanBoardProps {
  selectedOrderId?: string | null;
  onSelectOrder?: (id: string | null) => void;
  onRefreshRequest?: () => void;
  isArchiveMode?: boolean;
}

export default function KanbanBoard({ 
  selectedOrderId, 
  onSelectOrder, 
  onRefreshRequest,
  isArchiveMode = false
}: KanbanBoardProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('new'); // For mobile
  const [filterDelay, setFilterDelay] = useState(false);
  const [filterUnallocated, setFilterUnallocated] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (onRefreshRequest) {
        onRefreshRequest();
      } else {
        fetchOrders();
      }
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (order.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (order.contractCode?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (filterDelay) {
      const hoursLeft = (new Date(order.deadlineDelivery).getTime() - new Date().getTime()) / (1000 * 60 * 60);
      return matchesSearch && hoursLeft <= 24 && (order.overallProgress || 0) < 80;
    }

    if (filterUnallocated) {
       return matchesSearch && order.isAllocated === false;
    }

    // Lọc theo chế độ Archive
    if (isArchiveMode) {
      return matchesSearch && order.status === 'archived';
    } else {
      return matchesSearch && order.status !== 'archived';
    }
  });

  const getOrdersByStage = (stageId: string) => {
    return filteredOrders.filter(order => order.status === stageId || (!order.status && stageId === 'new'));
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("orderId");
    if (orderId) {
      updateOrderStatus(orderId, stageId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="space-y-6">
      {/* Unified Kanban Header Frame - Sticky */}
      <div className="sticky top-0 z-30 bg-background pt-4 pb-2">
        <div className="bg-white border-2 border-black rounded-[32px] shadow-neo overflow-hidden flex flex-col divide-y-2 divide-black/[0.08]">
          
          {/* Layer 1: Title (Yellow) */}
          <div className="bg-[#f0f0d8] px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-neo-yellow border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <ShoppingCart size={18} strokeWidth={3} className="text-black" />
              </div>
              <div>
                <h3 className="font-bold text-black uppercase text-sm tracking-[0.2em] font-space leading-none">Bảng điều phối Kanban</h3>
                <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-1">Hệ thống quản lý đơn hàng</p>
              </div>
            </div>
            
            <div className="hidden sm:flex gap-2">
               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] font-bold text-black uppercase tracking-widest leading-none flex items-center">Trực tuyến</span>
            </div>
          </div>

          {/* Layer 2: Search & Filter Toolbar */}
          <div className="p-3 bg-white flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-black transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Tìm mã đơn hoặc khách hàng..."
                className="w-full bg-gray-50/50 border border-black/10 rounded-xl py-2.5 pl-11 pr-4 text-sm outline-none focus:border-black focus:ring-0 transition-all font-bold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
               <button 
                 onClick={() => {
                   setFilterDelay(!filterDelay);
                   if (!filterDelay) setFilterUnallocated(false);
                 }}
                 className={cn(
                   "px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-2",
                   filterDelay ? "bg-red-600 text-white border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-muted-text border-black/5 hover:border-black"
                 )}
               >
                 <Filter size={14} /> Trễ tiến độ
               </button>
               <button 
                 onClick={() => {
                   setFilterUnallocated(!filterUnallocated);
                   if (!filterUnallocated) setFilterDelay(false);
                 }}
                 className={cn(
                   "px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-2",
                   filterUnallocated ? "bg-amber-400 text-black border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" : "bg-white text-muted-text border-black/5 hover:border-black"
                 )}
               >
                 <AlertTriangle size={14} /> Chưa phân bổ
               </button>
            </div>
          </div>

          {/* Layer 3: Column Headers (Desktop Only) */}
          <div className="hidden md:flex divide-x-2 divide-black/[0.08] bg-white">
            {STAGES.map(stage => (
              <div key={stage.id} className="flex-1 p-4 flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1.5 rounded-lg text-white shadow-sm transition-transform group-hover:scale-110", stage.color)}>
                     <stage.icon size={12} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-[10px] font-black text-foreground uppercase tracking-wider">{stage.label}</h3>
                </div>
                <span className="text-[10px] font-black text-black/60 bg-gray-100 px-2 py-0.5 rounded-full border border-black/5">
                  {getOrdersByStage(stage.id).length}
                </span>
              </div>
            ))}
          </div>
          
          {/* Layer 4: Mobile Stage Tabs (Mobile Only) */}
          <div className="md:hidden bg-white p-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-black/5">
            {STAGES.map(stage => (
              <button 
                key={stage.id}
                onClick={() => setActiveTab(stage.id)}
                className={cn(
                  "px-4 py-2 rounded-lg whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0",
                  activeTab === stage.id ? "bg-black text-white" : "bg-gray-100 text-muted-foreground border border-black/5"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", stage.color)} />
                {stage.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isArchiveMode ? (
        /* Archive List View */
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white border-2 border-black rounded-2xl overflow-hidden shadow-neo">
             <div className="bg-gray-100 px-6 py-3 border-b-2 border-black flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-black/40">Danh sách đơn hàng đã lưu trữ</span>
                <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">{filteredOrders.length} Đơn hàng</span>
             </div>
             <div className="divide-y-2 divide-black/5">
                {filteredOrders.length > 0 ? filteredOrders.map(order => (
                  <div 
                    key={order.id} 
                    onClick={() => onSelectOrder?.(order.id)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg border border-black/10 flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <History size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="text-sm font-black text-black">#{order.contractCode || order.id.slice(-6).toUpperCase()}</span>
                           <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">Đã lưu trữ</span>
                        </div>
                        <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-0.5">{order.customer?.name || 'Vãng lai'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className="text-[10px] font-black text-black/20 uppercase tracking-widest leading-none mb-1">Tiến độ cuối</p>
                          <p className="text-sm font-black text-emerald-600 italic">{order.overallProgress || 100}%</p>
                       </div>
                       <ChevronRight className="text-black/10 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} strokeWidth={3} />
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center">
                     <p className="text-sm font-bold text-black/20 uppercase tracking-widest italic">Kho lưu trữ hiện đang trống</p>
                  </div>
                )}
             </div>
           </div>
        </div>
      ) : (
        <>
          {/* Desktop Kanban Grid */}
      <div className="hidden md:grid grid-cols-5 gap-4 items-start min-h-[600px] mt-2">
        {STAGES.map(stage => (
          <div 
            key={stage.id} 
            className="flex flex-col h-full bg-gray-50/50 rounded-lg p-3 border border-border transition-colors hover:bg-gray-100/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="flex-1 space-y-3 px-1 pb-10 mt-3">
              {getOrdersByStage(stage.id).map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onClick={() => onSelectOrder?.(order.id)} 
                />
              ))}
              {getOrdersByStage(stage.id).length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-border rounded-lg opacity-40">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Trống</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Card List (single stage) */}
      <div className="md:hidden space-y-3">
        {getOrdersByStage(activeTab).map(order => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onClick={() => onSelectOrder?.(order.id)} 
          />
        ))}
        {getOrdersByStage(activeTab).length === 0 && (
          <div className="py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-border">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Cột này hiện chưa có đơn hàng nào</p>
          </div>
        )}
      </div>
        </>
      )}

      {/* Sidebar removed - now handled by parent OrdersPage */}
    </div>
  );
}
