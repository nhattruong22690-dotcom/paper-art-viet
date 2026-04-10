"use client";

import React, { useState } from 'react';
import { Plus, ShoppingCart, ChevronRight } from 'lucide-react';
import KanbanBoard from '@/components/orders/KanbanBoard';
import CreateSalesOrder from '@/components/orders/CreateSalesOrder';
import OrderDetailsPanel from '@/components/orders/OrderDetailsPanel';
import Link from 'next/link';

export default function OrdersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 neo-card !p-8 bg-neo-mint shadow-neo">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">
            <ShoppingCart size={14} strokeWidth={3} />
            <span>Kinh doanh</span>
            <ChevronRight size={12} strokeWidth={3} />
            <span className="text-purple-600 bg-white px-2 py-0.5 rounded-lg border border-black/10">Đơn hàng</span>
          </nav>
          <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase font-space">
            Quản trị <span className="text-purple-500">Đơn hàng</span>
          </h1>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary gap-3 shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          <span className="font-space uppercase tracking-widest text-xs">Tạo đơn hàng mới</span>
        </button>
      </div>

      <KanbanBoard 
        key={refreshKey} 
        selectedOrderId={selectedOrderId}
        onSelectOrder={setSelectedOrderId}
        onRefreshRequest={() => setRefreshKey(prev => prev + 1)}
      />


      {/* Detail Side Panel - Moved to Page Root to ensure full height */}
      <OrderDetailsPanel 
        orderId={selectedOrderId} 
        onClose={() => setSelectedOrderId(null)}
        onUpdate={() => setRefreshKey(prev => prev + 1)}
        onDelete={() => {
          setSelectedOrderId(null);
          setRefreshKey(prev => prev + 1);
        }}
      />

      {/* Create Order Modal */}
      <CreateSalesOrder 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
