"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import KanbanBoard from '@/components/orders/KanbanBoard';
import CreateSalesOrder from '@/components/orders/CreateSalesOrder';

export default function OrdersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-20 px-4">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Quy trình Đơn hàng</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest italic flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Paper Art Việt - Realtime Kanban
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-5 bg-gray-900 text-white rounded-[24px] font-black shadow-2xl shadow-gray-200 hover:bg-primary-600 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest active:scale-95 shrink-0"
        >
          <div className="bg-white/20 p-1 rounded-lg">
            <Plus size={18} />
          </div>
          Tạo đơn hàng mới
        </button>
      </header>

      {/* KANBAN BOARD */}
      <KanbanBoard key={refreshKey} />

      {/* CREATE ORDER MODAL */}
      <CreateSalesOrder 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
