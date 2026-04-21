"use client";

import React, { useState, useEffect } from "react";
import { 
  MoreVertical, 
  Calendar, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Maximize2,
  X,
  Briefcase,
  MapPin,
  LayoutGrid,
  ClipboardList,
  PencilLine,
  Search,
  TrendingUp
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import OrderDetailsPanel from "../orders/OrderDetailsPanel";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Status = "Pending" | "Processing" | "QualityControl" | "Completed" | "Archived";

export interface ProductionOrder {
  id: string;
  sku: string;
  title: string;
  customer: string;
  quantityTarget: number;
  quantityCompleted: number;
  progress: number;
  status: Status;
  dueDate: string;
  deadlineProduction?: string;
  locationName: string;
  contractCode?: string;
  customerCode?: string;
  orderId?: string;
  allocationType: 'internal' | 'outsourced';
  priority: "Urgent" | "High" | "Medium" | "Low";
  assignedTo?: string;
}

const statusConfig = {
  Pending: { label: "Chờ xử lý", color: "bg-gray-100 text-gray-600 border-border" },
  Processing: { label: "Đang sản xuất", color: "bg-primary/10 text-primary border-primary/20" },
  QualityControl: { label: "Kiểm tra QC", color: "bg-amber-50 text-amber-600 border-amber-200" },
  Completed: { label: "Hoàn thành", color: "bg-green-50 text-green-600 border-green-200" },
  Archived: { label: "Đã lưu trữ", color: "bg-gray-100 text-gray-400 border-gray-200" },
};

export default function ProductionPipeline({ 
  searchTerm, 
  orders, 
  loading, 
  onRefresh, 
  onStatusChange, 
  onSelectOrder, 
  onViewOrder 
}: { 
  searchTerm: string;
  orders: ProductionOrder[];
  loading: boolean;
  onRefresh: () => void;
  onStatusChange?: (id: string, status: Status) => void;
  onSelectOrder?: (order: ProductionOrder) => void;
  onViewOrder?: (orderId: string) => void;
}) {
  // Logic Modal đã được chuyển lên trang cha ProductionPage.tsx

  const handleDrop = (e: React.DragEvent, newStatus: Status) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("productionOrderId");
    if (orderId && onStatusChange) {
      onStatusChange(orderId, newStatus);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const renderColumn = (status: Status) => {
    const filteredOrders = orders.filter(order => {
      const statusMatch = order.status === status;
      if (!statusMatch) return false;
      
      if (!searchTerm) return true;
      
      const search = searchTerm.toLowerCase();
      return (
        order.title?.toLowerCase().includes(search) ||
        order.contractCode?.toLowerCase().includes(search) ||
        order.customer?.toLowerCase().includes(search) ||
        order.customerCode?.toLowerCase().includes(search) ||
        order.locationName?.toLowerCase().includes(search) ||
        order.sku.toLowerCase().includes(search) ||
        order.id.toLowerCase().includes(search)
      );
    });

    return (
      <div 
        className="flex flex-col h-full bg-gray-50/50 rounded-lg p-2 md:p-3 border border-border transition-colors hover:bg-gray-100/30"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, status)}
      >
        <div className="flex-1 space-y-3 px-1 pb-10">
          {filteredOrders.map(order => {
            const isUrgent = order.priority === 'Urgent';
            const isHigh = order.priority === 'High';
            
            return (
              <div 
                key={order.id}
                onClick={() => onSelectOrder?.(order)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("productionOrderId", order.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className={cn(
                  "card !p-5 hover:-translate-y-1 transition-all cursor-pointer group relative bg-white border-2",
                  isUrgent ? "border-red-600 shadow-[4px_4px_0px_rgba(220,38,38,0.2)] bg-red-50/30" : 
                  isHigh ? "border-orange-500 shadow-[2px_2px_0px_rgba(249,115,22,0.1)]" : "border-black shadow-neo-sm hover:shadow-neo"
                )}
              >
                {isUrgent && (
                  <div className="absolute top-0 right-0 w-12 h-12 overflow-hidden pointer-events-none">
                    <div className="absolute top-[8px] right-[-15px] bg-red-600 text-white text-[7px] font-black py-0.5 px-6 rotate-45 uppercase tracking-widest shadow-sm animate-pulse">
                      GẤP
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-start mb-3">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest",
                    isUrgent ? "bg-red-600 text-white border-red-700" : "text-primary bg-primary/10 border-primary/20"
                  )}>{order.sku}</span>
                  <span className={cn(
                    "text-[9px] font-bold px-2 py-0.5 rounded uppercase border",
                    isUrgent ? 'text-red-700 bg-red-100 border-red-200' : 
                    isHigh ? 'text-orange-600 bg-orange-50 border-orange-100' : 
                    order.priority === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-gray-600 bg-gray-100 border-gray-200'
                  )}>
                    {order.priority === 'Urgent' ? 'RẤT GẤP' : order.priority === 'High' ? 'KHẨN CẤP' : order.priority === 'Medium' ? 'TRUNG BÌNH' : 'THẤP'}
                  </span>
                </div>
              
                <h4 className="font-bold text-foreground text-sm mb-4 line-clamp-2 leading-tight group-hover:text-primary transition-colors min-h-[2.5rem] italic">{order.title}</h4>
                
                <div className="space-y-3">
                  <div 
                    className="flex items-center gap-2 text-[10px] font-bold text-primary bg-neo-mint/20 border border-neo-mint/30 p-2 rounded-lg hover:bg-neo-mint/40 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (order.orderId && onViewOrder) onViewOrder(order.orderId);
                    }}
                  >
                    <Briefcase size={12} className="text-primary" />
                    <span className="truncate">Đơn: <span className="underline decoration-primary/30">#{order.contractCode || 'N/A'}</span></span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-tight px-1">
                    <div className="flex items-center gap-1.5 max-w-[140px]">
                      <MapPin size={12} className="text-gray-400 shrink-0" />
                      <span className="truncate text-foreground italic">{order.locationName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0" title="Hạn hoàn thành SX">
                      <Clock size={12} className="text-neo-blue" />
                      <span className="text-neo-blue font-bold">
                        {order.deadlineProduction ? new Date(order.deadlineProduction).toLocaleDateString('vi-VN') : order.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-end mb-1.5">
                    <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">Tiến độ sản xuất</span>
                    <span className="text-[11px] font-black text-primary italic">{order.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-black/5 shadow-inner">
                    <div 
                      className={cn(
                        "h-full transition-all duration-700 ease-out",
                        order.progress > 90 ? "bg-green-500" : order.progress > 50 ? "bg-primary" : "bg-amber-500"
                      )}
                      style={{ width: `${order.progress}%` }}
                    />
                  </div>
                </div>

                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {order.status === 'Completed' && onStatusChange && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(order.id, 'Archived');
                      }}
                      className="w-8 h-8 bg-neo-yellow border-2 border-black text-black rounded-lg flex items-center justify-center shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] shadow-none transition-all"
                      title="Xác nhận Ship & Lưu trữ"
                    >
                       <TrendingUp size={16} className="rotate-90" />
                    </button>
                  )}
                  <div className="w-8 h-8 bg-white border-2 border-black text-black rounded-lg flex items-center justify-center shadow-neo">
                     <Maximize2 size={12} strokeWidth={3} />
                  </div>
                </div>
              </div>
            );
          })}
          {filteredOrders.length === 0 && (
            <div className="py-16 text-center border-2 border-black/5 rounded-2xl opacity-30 flex flex-col items-center gap-3">
               <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Clock size={20} />
               </div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em]">Trống</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start min-h-[600px] mt-2">
      {renderColumn("Pending")}
      {renderColumn("Processing")}
      {renderColumn("QualityControl")}
      {renderColumn("Completed")}
    </div>
  );
}
