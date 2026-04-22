"use client";

import React from "react";
import { 
  Clock,
  MapPin, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Truck,
  CheckCircle2,
  PackageCheck
} from "lucide-react";
import { ProductionOrder } from "./ProductionPipeline";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProductionListViewProps {
  orders: ProductionOrder[];
  loading: boolean;
  onRefresh: () => void;
  onStatusChange?: (id: string, status: string) => void;
  onSelectOrder?: (order: ProductionOrder) => void;
  onViewOrder?: (orderId: string) => void;
}

const statusConfig = {
  Pending: { label: "Chờ xử lý", color: "bg-gray-100 text-gray-600 border-gray-200" },
  Processing: { label: "Đang sản xuất", color: "bg-blue-50 text-blue-600 border-blue-100" },
  QualityControl: { label: "Kiểm tra QC", color: "bg-amber-50 text-amber-600 border-amber-200" },
  Completed: { label: "Hoàn thành", color: "bg-green-50 text-green-600 border-green-200" },
  Archived: { label: "Đã lưu trữ", color: "bg-gray-100 text-gray-400 border-gray-200" },
};

export default function ProductionListView({ 
  orders, 
  loading, 
  onRefresh, 
  onStatusChange,
  onSelectOrder,
  onViewOrder
}: ProductionListViewProps) {
  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-black shadow-neo-active">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-black/40">Đang tải danh sách...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-black shadow-neo-active text-center px-10">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 border-2 border-black/5 opacity-30">
          <AlertCircle size={32} />
        </div>
        <h3 className="text-xl font-bold uppercase tracking-tight mb-2">Không tìm thấy lệnh nào</h3>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-black shadow-neo-active overflow-x-auto custom-scrollbar">
      <div className="w-full flex flex-col md:table md:border-collapse space-y-4 md:space-y-0 p-4 md:p-0 min-w-full md:min-w-[1000px]">
        <div className="hidden md:table-header-group bg-slate-50 text-black border-y-2 border-black">
          <div className="table-row">
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-black/10">SKU / Sản phẩm</div>
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-black/10">Mã LSX</div>
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-black/10">Mã đơn</div>
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-black/10">Khách hàng</div>
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-black/10 text-center">Sản lượng</div>
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-black/10">Tiến độ</div>
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-black/10">Hạn SX</div>
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-black/10">Vị trí</div>
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest border-r border-black/10">Ưu tiên</div>
            <div className="table-cell px-6 py-4 text-[10px] font-black uppercase tracking-widest">Trạng thái</div>
          </div>
        </div>
        <div className="block md:table-row-group md:divide-y md:divide-black/5 w-full">
          {orders.map((order) => {
            const status = statusConfig[order.status];
            return (
              <div 
                key={order.id} 
                className="block md:table-row hover:bg-gray-50/80 transition-colors group cursor-pointer bg-white border-[2.5px] border-black md:border-0 rounded-2xl md:rounded-none p-5 md:p-0 mb-4 md:mb-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-none w-full"
                onClick={() => onSelectOrder?.(order)}
              >
                <div className="block md:table-cell px-2 py-3 md:px-6 md:py-5 md:border-r md:border-black/5 border-b border-dashed border-black/10 md:border-b-0">
                  <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Sản phẩm & SKU</div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-black line-clamp-2 md:line-clamp-1 italic">{order.title}</span>
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">{order.sku}</span>
                  </div>
                </div>

                <div className="block md:table-cell px-2 py-3 md:px-6 md:py-5 md:border-r md:border-black/5 border-b border-dashed border-black/10 md:border-b-0">
                  <div className="flex items-center justify-between md:block w-full">
                    <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Mã LSX</div>
                    <span className="text-xs font-black text-foreground bg-gray-100 px-2 py-1 rounded shadow-sm border border-black/5 uppercase tracking-tighter italic">
                      {order.productionCode || '---'}
                    </span>
                  </div>
                </div>
                
                <div className="block md:table-cell px-2 py-3 md:px-6 md:py-5 md:border-r md:border-black/5 border-b border-dashed border-black/10 md:border-b-0">
                  <div className="flex items-center justify-between md:block w-full">
                    <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Mã hợp đồng</div>
                    <span 
                      className="text-xs font-bold text-primary italic whitespace-nowrap hover:underline cursor-pointer" 
                      title={order.contractCode}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (order.orderId && onViewOrder) onViewOrder(order.orderId);
                      }}
                    >
                      {order.contractCode ? `...${order.contractCode.slice(-8)}` : '---'}
                    </span>
                  </div>
                </div>
                
                <div className="block md:table-cell px-2 py-3 md:px-6 md:py-5 md:border-r md:border-black/5 border-b border-dashed border-black/10 md:border-b-0">
                  <div className="flex items-center justify-between md:block w-full">
                    <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Đối tác</div>
                    <span className="text-xs font-bold text-black/60 uppercase tracking-tight">{order.customer || 'N/A'}</span>
                  </div>
                </div>
                
                <div className="block md:table-cell px-2 py-3 md:px-6 md:py-5 md:border-r md:border-black/5 md:text-center border-b border-dashed border-black/10 md:border-b-0">
                  <div className="flex items-center justify-between md:block w-full">
                    <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Trúng thầu</div>
                    <div className="flex flex-col items-end md:items-center">
                      <span className="text-sm font-black text-black">{order.quantityCompleted} <span className="text-black/30 font-bold mx-1">/</span> {order.quantityTarget}</span>
                      <span className="text-[9px] font-bold text-black/30 uppercase tracking-tighter">Sản phẩm</span>
                    </div>
                  </div>
                </div>
                
                <div className="block md:table-cell px-2 py-4 md:px-6 md:py-5 md:border-r md:border-black/5 border-b border-dashed border-black/10 md:border-b-0">
                  <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest mb-2">Tiến độ chi tiết</div>
                  <div className="flex items-center gap-4 w-full md:max-w-[240px]">
                    <div className="flex-1 h-2.5 md:h-2 bg-gray-100 rounded-full overflow-hidden border border-black/5 shadow-inner">
                      <div 
                        className={cn(
                          "h-full transition-all duration-500",
                          order.progress > 90 ? 'bg-green-500' : order.progress > 50 ? 'bg-primary' : 'bg-amber-500'
                        )}
                        style={{ width: `${order.progress !== undefined ? order.progress : (order.quantityTarget > 0 ? Math.round((order.quantityCompleted / order.quantityTarget) * 100) : 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] md:text-sm font-black text-primary italic shrink-0 min-w-[32px]">
                      {order.progress !== undefined ? order.progress : (order.quantityTarget > 0 ? Math.round((order.quantityCompleted / order.quantityTarget) * 100) : 0)}%
                    </span>
                  </div>
                </div>
                
                <div className="block md:table-cell px-2 py-3 md:px-0 md:py-0 border-b border-dashed border-black/10 md:border-b-0">
                  <div className="flex flex-col md:flex-row w-full h-full">
                    <div className="flex items-center justify-between md:justify-center md:flex-1 md:table-cell md:px-6 md:py-5 md:border-r md:border-black/5 py-1 md:py-0">
                      <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest">Hạn giao</div>
                      <div className="flex items-center gap-2 text-xs font-bold text-neo-blue italic" title="Hạn hoàn thành SX">
                        <Clock size={14} className="text-neo-blue/40 hidden md:block" />
                        {order.deadlineProduction ? new Date(order.deadlineProduction).toLocaleDateString('vi-VN') : order.dueDate}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-center md:flex-1 md:table-cell md:px-6 md:py-5 md:border-r md:border-black/5 py-1 md:py-0">
                      <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest">Điểm SX</div>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tight">
                        {order.allocationType === 'internal' ? (
                          <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                            <MapPin size={12} />
                            <span>{order.locationName}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg border border-orange-100">
                            <Truck size={12} />
                            <span>Gia công</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-center md:flex-1 md:table-cell md:px-6 md:py-5 border-none md:border-r md:border-black/5 py-1 md:py-0">
                      <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest">Cấp bách</div>
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 w-fit",
                        order.priority === 'Urgent' ? 'bg-red-600 text-white border-red-700 animate-pulse' : 
                        order.priority === 'High' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                        order.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                      )}>
                        <AlertCircle size={10} className="hidden md:block"/>
                        {order.priority === 'Urgent' ? 'RẤT GẤP' : 
                         order.priority === 'High' ? 'KHẨN CẤP' : 
                         order.priority === 'Medium' ? 'TRUNG BÌNH' : 'THẤP'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between md:justify-center md:table-cell px-2 py-4 md:px-6 md:py-5">
                  <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest">Trạng thái</div>
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-black/5 text-[10px] md:text-[11px] font-black uppercase tracking-widest shadow-sm ${status.color}`}>
                       {order.status === 'Completed' && <CheckCircle2 size={12} />}
                       {status.label}
                    </div>
                    {order.status === 'Completed' && onStatusChange && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onStatusChange(order.id, 'Archived') }}
                        className="p-1.5 bg-white border-2 border-black rounded-lg hover:bg-neo-yellow shadow-neo-active transition-all"
                        title="Hoàn tất & Lưu trữ"
                      >
                        <PackageCheck size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="p-4 bg-gray-50 border-t border-black/5 flex justify-between items-center">
        <p className="text-[10px] font-bold text-black/40 uppercase tracking-[0.2em]">Hiển thị {orders.length} lệnh sản xuất</p>
        <div className="flex items-center gap-2">
           <TrendingUp size={14} className="text-primary" />
           <span className="text-[10px] font-black text-black uppercase tracking-widest">Dữ liệu thời gian thực</span>
        </div>
      </div>
    </div>
  );
}
