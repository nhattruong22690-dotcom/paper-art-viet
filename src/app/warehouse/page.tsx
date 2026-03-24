"use client";

import React, { useState } from 'react';
import { 
  ClipboardList, 
  Box,
} from 'lucide-react';
import InventoryDashboard from '@/components/inventory/InventoryDashboardRefined';
import PackingStation from '@/components/warehouse/PackingStation';

export default function WarehousePage() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'packing'>('inventory');

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      {/* TAB NAVIGATION */}
      <div className="flex justify-center mt-8">
        <div className="bg-white p-1.5 rounded-[24px] shadow-sm border border-gray-100 flex gap-1">
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`
              px-8 py-3 rounded-[20px] font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-3
              ${activeTab === 'inventory' 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
            `}
          >
            <ClipboardList size={18} /> Kiểm soát vật tư
          </button>
          <button 
            onClick={() => setActiveTab('packing')}
            className={`
              px-8 py-3 rounded-[20px] font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 flex items-center gap-3
              ${activeTab === 'packing' 
                ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}
            `}
          >
            <Box size={18} /> Trạm đóng gói
          </button>
        </div>
      </div>

      {/* RENDER CONTENT BASED ON TAB */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {activeTab === 'inventory' ? (
          <InventoryDashboard />
        ) : (
          <PackingStation />
        )}
      </div>
    </div>
  );
}
