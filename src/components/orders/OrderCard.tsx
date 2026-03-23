"use client";

import React from 'react';
import { Clock, User, DollarSign, ArrowRight } from 'lucide-react';
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
        "bg-white p-5 rounded-[28px] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border-2 group",
        isUrgent ? "border-rose-500 bg-rose-50/20" : "border-transparent hover:border-primary-100"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black bg-gray-900 text-white px-3 py-1 rounded-xl uppercase tracking-tighter shadow-sm group-hover:bg-primary-600 transition-colors w-fit">
            #{order.id.slice(-6).toUpperCase()}
          </span>
          {order.contractCode && (
            <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest ml-1 italic">{order.contractCode}</span>
          )}
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest",
          isUrgent ? "text-rose-600 animate-pulse" : "text-gray-400"
        )}>
          <Clock size={12} />
          {new Date(order.deadlineDelivery).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight line-clamp-1 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
          {order.customer?.name || 'Vãng lai'}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-gray-400">
           <DollarSign size={10} />
           <span className="text-[11px] font-bold tracking-tight text-gray-500">{totalValue.toLocaleString()}đ</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
          <span className="text-gray-400">Tiến độ sản xuất</span>
          <span className={cn(progress < 100 ? "text-primary-600" : "text-emerald-500")}>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
          <div 
            className={cn(
              "h-full transition-all duration-1000",
              isUrgent ? "bg-rose-500" : progress === 100 ? "bg-emerald-500" : "bg-primary-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Xem chi tiết</span>
         <ArrowRight size={14} className="text-primary-600" />
      </div>
    </div>
  );
}
