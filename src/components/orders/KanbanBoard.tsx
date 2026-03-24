"use client";

import React, { useState, useEffect } from 'react';
import OrderCard from './OrderCard';
import OrderDetailsPanel from './OrderDetailsPanel';
import { Search, Filter, LayoutGrid, List, CheckCircle2, Truck, Package, Factory, ClipboardList } from 'lucide-react';
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

export default function KanbanBoard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('new'); // For mobile
  const [filterDelay, setFilterDelay] = useState(false);

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
      fetchOrders();
    } catch (error) {
      console.error('Update error:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterDelay) {
      const hoursLeft = (new Date(order.deadlineDelivery).getTime() - new Date().getTime()) / (1000 * 60 * 60);
      return matchesSearch && hoursLeft <= 24 && (order.overallProgress || 0) < 80;
    }
    return matchesSearch;
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
      {/* Search & Global Filter Toolbar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Tìm mã đơn hoặc khách hàng..."
            className="w-full bg-white border border-gray-100 rounded-[24px] py-4 pl-14 pr-6 text-sm outline-none shadow-sm focus:shadow-md transition-all font-bold tracking-tight"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setFilterDelay(!filterDelay)}
             className={cn(
               "px-6 py-4 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm",
               filterDelay ? "bg-rose-500 text-white border-rose-600" : "bg-white text-gray-400 border-gray-100 hover:border-primary-200"
             )}
           >
             <Filter size={14} /> Trễ tiến độ
           </button>
        </div>
      </div>

      {/* Mobile Stage Tabs */}
      <div className="md:hidden flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        {STAGES.map(stage => (
          <button 
            key={stage.id}
            onClick={() => setActiveTab(stage.id)}
            className={cn(
              "px-5 py-3 rounded-2xl whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-all",
              activeTab === stage.id ? "bg-gray-900 text-white" : "bg-white text-gray-400 border border-gray-100"
            )}
          >
            {stage.label} ({getOrdersByStage(stage.id).length})
          </button>
        ))}
      </div>

      {/* Desktop Kanban Grid */}
      <div className="hidden md:grid grid-cols-5 gap-6 items-start h-[calc(100vh-280px)]">
        {STAGES.map(stage => (
          <div 
            key={stage.id} 
            className="flex flex-col h-full bg-gray-50/50 rounded-[40px] p-4 border border-gray-100/50 transition-colors hover:bg-gray-100/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="px-4 py-3 flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg text-white", stage.color)}>
                   <stage.icon size={14} strokeWidth={3} />
                </div>
                <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest">{stage.label}</h3>
              </div>
              <span className="text-[10px] font-black text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100 italic">
                {getOrdersByStage(stage.id).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 px-2 custom-scrollbar pb-10">
              {getOrdersByStage(stage.id).map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onClick={() => setSelectedOrderId(order.id)} 
                />
              ))}
              {getOrdersByStage(stage.id).length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-[32px] opacity-30">
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Trống</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Card List (single stage) */}
      <div className="md:hidden space-y-4">
        {getOrdersByStage(activeTab).map(order => (
          <OrderCard 
            key={order.id} 
            order={order} 
            onClick={() => setSelectedOrderId(order.id)} 
          />
        ))}
        {getOrdersByStage(activeTab).length === 0 && (
          <div className="py-20 text-center bg-gray-50 rounded-[32px] border-2 border-dashed border-gray-200">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Cột này hiện chưa có đơn hàng nào</p>
          </div>
        )}
      </div>

      {/* Detail Side Panel */}
      <OrderDetailsPanel 
        orderId={selectedOrderId} 
        onClose={() => setSelectedOrderId(null)}
        onUpdate={fetchOrders}
        onDelete={() => {
          setSelectedOrderId(null);
          fetchOrders();
        }}
      />
    </div>
  );
}
