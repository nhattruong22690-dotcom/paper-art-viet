"use client";

import React from 'react';
import { Clock, User, DollarSign, ArrowRight, AlertTriangle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrderCardProps {
  order: any;
  onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("orderId", order.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const totalValue = order.orderItems.reduce((acc: number, item: any) => acc + (Number(item.price) * item.quantity), 0);
  const progress = order.overallProgress || 0;
  
  // Logic Cảnh báo: Sắp đến ngày giao (trong vòng 24h) mà tiến độ < 80%
  const now = new Date();
  const deadline = new Date(order.deadlineDelivery);
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isUrgent = hoursLeft > 0 && hoursLeft <= 24 && progress < 80;

  return (
    <div 
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={cn(
        "bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer border border-border group",
        isUrgent ? "border-red-600 bg-red-50/20" : "hover:border-primary/30"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-foreground text-white px-2 py-0.5 rounded uppercase tracking-tighter group-hover:bg-primary transition-colors w-fit">
              #{order.id.slice(-6).toUpperCase()}
            </span>
            {order.isAllocated === false && (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-0.5 rounded border border-amber-200 animate-pulse shadow-sm">
                 <AlertTriangle size={10} strokeWidth={3} />
                 <span className="text-[9px] font-black uppercase tracking-widest leading-none">Chưa phân bổ</span>
              </div>
            )}
          </div>
          {order.contractCode && (
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest italic">{order.contractCode}</span>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest",
          isUrgent ? "text-red-600 animate-pulse" : "text-muted-foreground"
        )}>
          <Clock size={12} />
          {new Date(order.deadlineDelivery).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-bold text-foreground line-clamp-1 flex items-center gap-2">
          {order.customer?.name || 'Vãng lai'}
        </h4>
        <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
           <DollarSign size={10} />
           <span className="text-[11px] font-bold tracking-tight">{totalValue.toLocaleString()}đ</span>
        </div>
      </div>

      {/* Progress Bar & Milestones */}
      <div className="space-y-2 mt-4">
        {order.estimatedStages && order.estimatedStages.length > 0 && (
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50/50 px-2 py-1 rounded border border-amber-100">
            <span>Các khâu dự tính:</span>
            <span>{order.estimatedStages.filter((s: any) => s.isCompleted).length}/{order.estimatedStages.length}</span>
          </div>
        )}
        
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
          <span className="text-muted-foreground">Tiến độ SX</span>
          <span className={cn(progress < 100 ? "text-primary" : "text-green-600")}>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
          <div 
            className={cn(
              "h-full transition-all duration-1000",
              isUrgent ? "bg-red-600" : progress === 100 ? "bg-green-600" : "bg-primary"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Chi tiết</span>
         <ArrowRight size={14} className="text-primary" />
      </div>
    </div>
  );
}
