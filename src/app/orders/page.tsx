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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-lg border border-border shadow-sm">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <ShoppingCart size={12} />
            <span>Kinh doanh</span>
            <ChevronRight size={10} />
            <span className="text-primary">Đơn hàng</span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Quản trị Đơn hàng
          </h1>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary gap-2"
        >
          <Plus size={18} />
          Tạo đơn hàng mới
        </button>
      </div>

      {/* Kanban Board Area */}
      <div className="bg-gray-50/50 p-4 rounded-lg border border-border">
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
