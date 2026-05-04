import React, { useMemo, useRef, useEffect } from 'react';
import { Truck, PackageCheck, ChevronRight, Package, Calendar } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Delivery {
  id: string;
  displayId: string;
  contractCode: string;
  customer: string;
  items: number;
  deadline: string;
  status: string;
  progress: number;
}

interface DeliveryTimelineProps {
  deliveries: Delivery[];
  onSelectOrder?: (id: string) => void;
}

const getStatusBadge = (status: string) => {
  switch(status?.toLowerCase()) {
    case 'draft': return { label: 'BẢN NHÁP', color: 'bg-gray-300 text-black border-black' };
    case 'production': 
    case 'in_production': return { label: 'SẢN XUẤT', color: 'bg-neo-purple text-white border-black' };
    case 'completed': return { label: 'HOÀN THÀNH', color: 'bg-neo-mint text-black border-black' };
    case 'pending': return { label: 'CHỜ DUYỆT', color: 'bg-neo-yellow text-black border-black' };
    case 'approved': return { label: 'ĐÃ DUYỆT', color: 'bg-[#4361EE] text-white border-black' };
    default: return { label: status?.toUpperCase() || 'UNKNOWN', color: 'bg-black text-white border-black' };
  }
};

export default function DeliveryTimeline({ deliveries, onSelectOrder }: DeliveryTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);
  
  // Group deliveries by date and sort them
  const groupedDeliveries = useMemo(() => {
    const groups: Record<string, Delivery[]> = {};
    
    deliveries.forEach(d => {
      const dateKey = d.deadline ? d.deadline.split('T')[0] : 'N/A';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(d);
    });

    // Ensure "Today" always exists in the timeline
    if (!groups[todayStr]) {
      groups[todayStr] = [];
    }

    // Sort descending: Future -> Today -> Past
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [deliveries]);

  // Scroll to Today so it's at the top initially
  useEffect(() => {
    if (todayRef.current && containerRef.current) {
      const container = containerRef.current;
      const todayEl = todayRef.current;
      const scrollPos = todayEl.offsetTop - container.offsetTop;
      container.scrollTo({ top: scrollPos, behavior: 'smooth' });
    }
  }, [groupedDeliveries]);

  return (
    <div className="flex flex-col h-[600px] bg-white relative">
      {/* Timeline Axis Layer (Decorative) */}
      <div className="absolute left-[35px] top-0 bottom-0 w-[2px] bg-black/20 z-0" />

      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scroll-smooth relative z-10"
      >
        {groupedDeliveries.map(([date, orders]) => {
          const isToday = date === todayStr;
          const isPast = date < todayStr && date !== 'N/A';
          const dateObj = date !== 'N/A' ? new Date(date) : null;
          
          return (
            <div 
              key={date} 
              ref={isToday ? todayRef : null}
              className={cn(
                "relative pl-[70px]",
                isToday ? "opacity-100" : (isPast ? "opacity-50" : "opacity-90")
              )}
            >
              {/* Date Marker - Bolder */}
              <div className={cn(
                "absolute left-[19px] top-0 w-8 h-8 rounded-lg border-2 flex flex-col items-center justify-center bg-white z-20 shadow-sm",
                isToday ? "border-neo-mint ring-2 ring-neo-mint/20" : "border-black",
              )}>
                {dateObj ? (
                  <>
                    <span className={cn(
                      "text-[8px] font-black uppercase leading-none",
                      isToday ? "text-neo-mint" : "text-black/50"
                    )}>
                      {dateObj.toLocaleDateString('vi-VN', { month: 'numeric' })}
                    </span>
                    <span className={cn(
                      "text-xs font-black leading-none mt-0.5",
                      "text-black"
                    )}>
                      {dateObj.getDate()}
                    </span>
                  </>
                ) : (
                  <Calendar size={14} className="text-black" />
                )}
              </div>

              {/* Today Marker Line - Green & Bolder */}
              {isToday && (
                <div className="absolute left-[35px] top-4 right-0 h-[3px] bg-neo-mint z-0 flex items-center">
                   <div className="w-4 h-4 bg-neo-mint rounded-full border-2 border-black absolute left-[-8px] shadow-neo-active animate-pulse z-40" />
                   <div className="ml-8 px-3 h-6 bg-neo-mint border-2 border-black flex items-center justify-center shadow-neo-active-sm z-30">
                      <span className="text-[9px] font-black text-black uppercase tracking-widest whitespace-nowrap">NGÀY HÔM NAY</span>
                   </div>
                </div>
              )}

              {/* Day Header */}
              <div className="mb-2 pt-0.5">
                <h5 className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  isToday ? "text-neo-mint mt-6" : "text-black/40"
                )}>
                  {date === 'N/A' ? '---' : dateObj?.toLocaleDateString('vi-VN', { weekday: 'long' })}
                </h5>
              </div>

              {/* Orders - Compact but Bolder */}
              <div className="space-y-2">
                {orders.length === 0 && (
                  <div className="px-3 py-2 border border-dashed border-black/20 rounded-xl bg-black/5 text-center">
                    <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">TRỐNG</span>
                  </div>
                )}
                {orders.map((order) => {
                  const statusBadge = getStatusBadge(order.status);
                  
                  return (
                    <div 
                      key={order.id}
                      onClick={() => onSelectOrder?.(order.id)}
                      className={cn(
                        "px-3 py-2.5 border-2 rounded-xl transition-all group cursor-pointer bg-white",
                        isToday ? "border-black shadow-neo-active bg-neo-mint/10" : "border-black hover:bg-slate-50"
                      )}
                    >
                      <div className="flex justify-between items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-black truncate uppercase font-space">
                              {order.contractCode || `#${order.displayId}`}
                            </span>
                            <span className="text-[10px] font-black text-neo-mint bg-black px-1.5 py-0.5 rounded shrink-0">
                              {order.progress}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-[10px] font-black text-black truncate uppercase opacity-60 flex-1">
                              {order.customer}
                            </p>
                            <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded border shrink-0", statusBadge.color)}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={14} strokeWidth={3} className="text-black group-hover:translate-x-1 transition-transform shrink-0" />
                      </div>
                      
                      {/* Progress Bar - Stronger */}
                      <div className="mt-2 h-1.5 bg-black/10 rounded-full overflow-hidden border border-black/5">
                         <div 
                           className="h-full bg-neo-mint border-r border-black/20 transition-all duration-500"
                           style={{ width: `${order.progress}%` }}
                         />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}


        {deliveries.length === 0 && (
          <div className="py-28 text-center">
            <div className="w-20 h-20 bg-white border-neo border-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-neo -rotate-3">
              <Truck size={40} strokeWidth={2} className="text-black/20" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-black/30">Kho vận trống</p>
          </div>
        )}
      </div>
    </div>
  );
}
