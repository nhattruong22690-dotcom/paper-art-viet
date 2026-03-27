"use client";

import React, { useState } from 'react';
import { Plus, ShoppingCart, ChevronRight } from 'lucide-react';
import KanbanBoard from '@/components/orders/KanbanBoard';
import CreateSalesOrder from '@/components/orders/CreateSalesOrder';
import Link from 'next/link';

export default function OrdersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

      {/* Kanban Board Area */}
      <div className="neo-card !p-8 bg-background shadow-neo-active">
        <div className="mb-6 flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-neo-yellow border-neo border-black flex items-center justify-center shadow-neo-active">
              <ShoppingCart size={20} strokeWidth={3} />
           </div>
           <h3 className="font-bold text-foreground uppercase text-sm tracking-widest font-space">Bảng điều phối Kanban</h3>
        </div>
        <KanbanBoard key={refreshKey} />
      </div>

      {/* Create Order Modal */}
      <CreateSalesOrder 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
