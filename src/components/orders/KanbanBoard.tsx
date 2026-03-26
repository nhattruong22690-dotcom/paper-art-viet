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
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Tìm mã đơn hoặc khách hàng..."
            className="w-full bg-white border border-border rounded-lg py-2.5 pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setFilterDelay(!filterDelay)}
             className={cn(
               "px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border shadow-sm",
               filterDelay ? "bg-red-600 text-white border-red-700" : "bg-white text-muted-text border-border hover:border-gray-400"
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
              "px-4 py-2 rounded-lg whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-all",
              activeTab === stage.id ? "bg-primary text-white" : "bg-white text-muted-foreground border border-border"
            )}
          >
            {stage.label} ({getOrdersByStage(stage.id).length})
          </button>
        ))}
      </div>

      {/* Desktop Kanban Grid */}
      <div className="hidden md:grid grid-cols-5 gap-4 items-start h-[calc(100vh-280px)]">
        {STAGES.map(stage => (
          <div 
            key={stage.id} 
            className="flex flex-col h-full bg-gray-50/50 rounded-lg p-3 border border-border transition-colors hover:bg-gray-100/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage.id)}
          >
            <div className="px-2 py-2 flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded text-white shadow-sm", stage.color)}>
                   <stage.icon size={12} strokeWidth={2.5} />
                </div>
                <h3 className="text-[10px] font-bold text-foreground uppercase tracking-wider">{stage.label}</h3>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-white px-2 py-0.5 rounded-full border border-border">
                {getOrdersByStage(stage.id).length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar pb-10">
              {getOrdersByStage(stage.id).map(order => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onClick={() => setSelectedOrderId(order.id)} 
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
            onClick={() => setSelectedOrderId(order.id)} 
          />
        ))}
        {getOrdersByStage(activeTab).length === 0 && (
          <div className="py-12 text-center bg-gray-50 rounded-lg border-2 border-dashed border-border">
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">Cột này hiện chưa có đơn hàng nào</p>
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
