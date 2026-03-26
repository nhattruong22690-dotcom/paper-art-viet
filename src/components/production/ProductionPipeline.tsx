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
  X
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Status = "Pending" | "Processing" | "QualityControl" | "Completed";

interface ProductionOrder {
  id: string;
  sku: string;
  title: string;
  customer: string;
  quantity: number;
  status: Status;
  dueDate: string;
  assignedTo?: string;
  priority: "High" | "Medium" | "Low";
}

const statusConfig = {
  Pending: { label: "Chờ xử lý", color: "bg-gray-100 text-gray-600 border-border" },
  Processing: { label: "Đang sản xuất", color: "bg-primary/10 text-primary border-primary/20" },
  QualityControl: { label: "Kiểm tra QC", color: "bg-amber-50 text-amber-600 border-amber-200" },
  Completed: { label: "Hoàn thành", color: "bg-green-50 text-green-600 border-green-200" },
};

export default function ProductionPipeline() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/production/orders');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOrders(data);
    } catch (error) {
      console.error("Failed to load production orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Status) => {
    try {
      const res = await fetch('/api/production/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setOrders(prev => prev.map(order => 
        order.id === id ? { ...order, status: newStatus } : order
      ));
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const renderColumn = (status: Status) => {
    const filteredOrders = orders.filter(order => order.status === status);
    const config = statusConfig[status];

    return (
      <div className="flex-1 min-w-[300px] flex flex-col card !bg-gray-50/50 !p-4">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", status === "Pending" ? "bg-gray-400" : status === "Processing" ? "bg-primary" : status === "QualityControl" ? "bg-amber-500" : "bg-green-500")} />
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">{config.label}</h3>
            <span className="bg-white px-2 py-0.5 rounded text-[10px] font-bold text-muted-foreground border border-border">{filteredOrders.length}</span>
          </div>
          <button className="text-gray-400 hover:text-foreground">
             <MoreVertical size={16} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-hide">
          {filteredOrders.map(order => (
            <div 
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="card !p-4 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group relative"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">{order.sku}</span>
                <span className={cn(
                  "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                  order.priority === 'High' ? 'text-red-600 bg-red-50 border border-red-100' : order.priority === 'Medium' ? 'text-amber-600 bg-amber-50 border border-amber-100' : 'text-gray-600 bg-gray-100 border border-gray-200'
                )}>
                  P: {order.priority}
                </span>
              </div>
              <h4 className="font-bold text-foreground text-sm mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors">{order.title}</h4>
              
              <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                <div className="flex items-center gap-1.5">
                  <User size={12} className="text-gray-400" />
                  <span className="truncate max-w-[80px]">{order.assignedTo || 'Chưa gán'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} className="text-gray-400" />
                  <span>{order.dueDate}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex -space-x-1.5 overflow-hidden">
                  <div className="inline-block h-5 w-5 rounded bg-gray-100 border border-border flex items-center justify-center text-[8px] font-bold text-muted-text uppercase">PA</div>
                  <div className="inline-block h-5 w-5 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[8px] font-bold text-primary uppercase">VT</div>
                </div>
                <button className="p-1 text-gray-300 hover:text-primary transition-all">
                  <Maximize2 size={12} />
                </button>
              </div>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-lg opacity-40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
               Trống
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
        {renderColumn("Pending")}
        {renderColumn("Processing")}
        {renderColumn("QualityControl")}
        {renderColumn("Completed")}
      </div>

      {/* Selected Order Detail Sidebar/Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-2xl card !p-0 shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-300">
            <div className="flex-1 p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                   <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase mb-2 inline-block tracking-widest">{selectedOrder.sku}</span>
                   <h2 className="text-2xl font-bold text-foreground tracking-tight">{selectedOrder.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-gray-400 hover:text-foreground transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-10">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Khách hàng</p>
                    <p className="font-bold text-muted-text">{selectedOrder.customer}</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Số lượng</p>
                    <p className="font-bold text-muted-text">{selectedOrder.quantity} sản phẩm</p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hạn giao</p>
                    <p className="font-bold text-red-600 flex items-center gap-2">
                       <Clock size={16} /> {selectedOrder.dueDate}
                    </p>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Độ ưu tiên</p>
                    <p className={cn(
                      "font-bold",
                      selectedOrder.priority === 'High' ? 'text-red-600' : 'text-amber-600'
                    )}>{selectedOrder.priority === 'High' ? 'KHẨN CẤP' : 'TRUNG BÌNH'}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Chuyển trạng thái</p>
                 <div className="flex flex-wrap gap-2">
                    {(Object.keys(statusConfig) as Status[]).map(status => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(selectedOrder.id, status)}
                        className={cn(
                          "px-4 py-2 text-xs font-bold rounded-lg border transition-all",
                          selectedOrder.status === status 
                            ? "bg-primary text-white border-primary" 
                            : "bg-white text-muted-text border-border hover:bg-gray-50 hover:border-gray-400"
                        )}
                      >
                        {statusConfig[status].label}
                      </button>
                    ))}
                 </div>
              </div>
            </div>
            <div className="w-full md:w-64 bg-gray-50 p-8 border-l border-border flex flex-col justify-between">
               <div className="space-y-6">
                  <div className="space-y-4">
                     <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Phụ trách</p>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded border border-border flex items-center justify-center text-primary font-bold shadow-sm">VT</div>
                        <div>
                           <p className="font-bold text-foreground text-sm">{selectedOrder.assignedTo || 'Chưa gán'}</p>
                           <p className="text-[10px] text-muted-foreground font-bold uppercase">Tổ trưởng</p>
                        </div>
                     </div>
                  </div>
               </div>
               <button className="btn-primary w-full gap-2">
                  Cập nhật tiến độ
                  <ChevronRight size={16} />
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
