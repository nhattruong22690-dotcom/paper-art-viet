"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Filter, 
  Search,
  Calendar,
  LayoutGrid,
  List,
  ArrowLeft,
  ChevronRight,
  Factory,
  Clock,
  X,
  Trash2,
  Edit3,
  Briefcase,
  MapPin,
  AlertCircle,
  ClipboardList,
  PencilLine,
  CheckCircle2,
  TrendingUp,
  Maximize2
} from 'lucide-react';
import ProductionPipeline, { ProductionOrder, Status } from '@/components/production/ProductionPipeline';
import Link from 'next/link';
import FacilitiesManagerModal from '@/components/production/FacilitiesManagerModal';
import ProductionListView from "@/components/production/ProductionListView";
import OrderDetailsPanel from "@/components/orders/OrderDetailsPanel";
import ProductionOrderDetailModal from "@/components/production/ProductionOrderDetailModal";
import ProductionBatchForm from "@/components/production/ProductionBatchForm";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNotification } from "@/context/NotificationContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const statusConfig = {
  Pending: { label: "Chờ xử lý", color: "bg-gray-100 text-gray-600 border-gray-200" },
  Processing: { label: "Đang sản xuất", color: "bg-primary/10 text-primary border-primary/20" },
  QualityControl: { label: "Kiểm tra QC", color: "bg-amber-50 text-amber-600 border-amber-200" },
  Completed: { label: "Hoàn thành", color: "bg-green-50 text-green-600 border-green-200" },
  Archived: { label: "Đã lưu trữ", color: "bg-gray-100 text-gray-400 border-gray-200" },
};

export default function ProductionPage() {
  const { confirm, showToast } = useNotification();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showFacilitiesModal, setShowFacilitiesModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'none'>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isArchiveView, setIsArchiveView] = useState(false);
  
  const [products, setProducts] = useState<{name: string, sku: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/production/orders');
      const data = await res.json();
      if (Array.isArray(data)) {
        setOrders(data);
        // Extract unique products for suggestions
        const uniqueProducts = Array.from(new Set(data.map((p: any) => JSON.stringify({ name: p.title, sku: p.sku }))))
          .map(s => JSON.parse(s as string));
        setProducts(uniqueProducts);
      }
    } catch (err) {
      console.error("Failed to fetch production orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === 'Archived') {
      const isConfirmed = await confirm(
        "XÁC NHẬN HOÀN TẤT & LƯU TRỮ\n\nLệnh sản xuất này sẽ được chuyển vào 'KHO LƯU TRỮ' và không còn xuất hiện ở danh sách đang làm việc nữa. Bạn có chắc chắn muốn hoàn tất?"
      );
      if (!isConfirmed) return;
    }

    try {
      const res = await fetch('/api/production/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        loadOrders();
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
        if (selectedOrder && selectedOrder.id === id) {
           setSelectedOrder({...selectedOrder, status: newStatus as any});
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUpdateOrder = async (id: string, updates: any) => {
    try {
      const res = await fetch('/api/production/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      if (res.ok) {
        showToast('success', 'Đã cập nhật lệnh sản xuất thành công');
        loadOrders();
        // Update local state for immediate feedback
        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
        if (selectedOrder && selectedOrder.id === id) {
           setSelectedOrder({...selectedOrder, ...updates});
        }
      }
    } catch (err) {
      console.error("Failed to update order:", err);
      showToast('error', 'Cập nhật thất bại');
    }
  };

  const handleDeleteProductionOrder = async (id: string) => {
    if (!await confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA LỆNH NÀY?\n\nToàn bộ ghi nhận sản lượng (Work Logs) liên quan sẽ bị xóa vĩnh viễn và số liệu hoàn thành sẽ quay về 0.")) return;
    
    try {
      const res = await fetch(`/api/production/orders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Đã xóa lệnh sản xuất thành công');
        setSelectedOrder(null);
        loadOrders();
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Xóa thất bại');
      }
    } catch (err: any) {
      console.error("Failed to delete production order:", err);
      showToast('error', `Không thể xóa: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter(order => {
    // Archiving logic
    if (isArchiveView) {
      if (order.status !== 'Archived') return false;
    } else {
      if (order.status === 'Archived') return false;
    }

    const statusMatch = filterStatus === 'all' || order.status === filterStatus;
    if (!statusMatch) return false;

    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      (order.title?.toLowerCase() || '').includes(s) ||
      (order.sku?.toLowerCase() || '').includes(s) ||
      (order.customer?.toLowerCase() || '').includes(s) ||
      (order.productionCode?.toLowerCase() || '').includes(s) ||
      (order.contractCode?.toLowerCase() || '').includes(s)
    );
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (sortBy === 'dueDate') {
      const dateA = a.deadlineProduction ? new Date(a.deadlineProduction).getTime() : new Date(a.dueDate).getTime();
      const dateB = b.deadlineProduction ? new Date(b.deadlineProduction).getTime() : new Date(b.dueDate).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    }
    if (sortBy === 'priority') {
      const pMap = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
      const valA = pMap[a.priority as keyof typeof pMap] || 0;
      const valB = pMap[b.priority as keyof typeof pMap] || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
    return 0;
  });

  const getStatusCount = (status: Status | 'all') => {
    if (status === 'all') return orders.length;
    return orders.filter(o => o.status === status).length;
  };

  const filteredSuggestions = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 neo-card !p-8 bg-neo-yellow shadow-neo">
        <div className="flex items-center gap-6">
          <Link 
            href="/mobile-menu/production"
            className="w-12 h-12 bg-white border-neo border-black rounded-xl flex items-center justify-center text-black hover:bg-black hover:text-white shadow-neo-active hover:shadow-neo transition-all shrink-0"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </Link>
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">
              <Factory size={14} strokeWidth={3} />
              <span>Sản xuất</span>
              <ChevronRight size={12} strokeWidth={3} />
              <span className="text-purple-600 bg-white px-2 py-0.5 rounded-lg border border-black/10">Điều phối xưởng</span>
            </nav>
            <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase font-space">
              Quản lý <span className="text-purple-500">Lệnh sản xuất</span>
            </h1>
          </div>
        </div>

        {/* Mini Stats Board - To balance the layout like the "Create Order" button */}
        <div className="flex items-center gap-3">
            {[
              { label: 'Chờ xử lý', count: getStatusCount('Pending'), color: 'bg-white' },
              { label: 'Đang chạy', count: getStatusCount('Processing'), color: 'bg-neo-mint' }
            ].map((stat, i) => (
              <div key={i} className={`hidden md:flex flex-col items-center justify-center min-w-[100px] p-2 rounded-xl border-2 border-black ${stat.color} shadow-neo-active`}>
                <span className="text-[8px] font-black uppercase tracking-tighter text-black/60">{stat.label}</span>
                <span className="text-lg font-black leading-none">{stat.count}</span>
              </div>
            ))}
        </div>
      </div>

      {/* View & Data Toggles Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
        <div className="flex flex-wrap items-center gap-4 animate-in slide-in-from-left duration-500">
          {/* Nhóm 1: Chế độ xem: Kanban / Danh sách */}
          <div className="bg-black/5 p-1.5 rounded-xl border-2 border-black flex gap-2 shadow-neo-active">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2.5 rounded-lg transition-all border-2 ${viewMode === 'kanban' ? 'bg-black text-white border-black shadow-neo' : 'text-black/40 border-transparent hover:text-black'}`}
              title="DẠNG BẢNG (KANBAN)"
            >
              <LayoutGrid size={20} strokeWidth={2.5} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all border-2 ${viewMode === 'list' ? 'bg-black text-white border-black shadow-neo' : 'text-black/40 border-transparent hover:text-black'}`}
              title="DẠNG DANH SÁCH"
            >
              <List size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Nhóm 2: Chế độ dữ liệu: Làm việc / Lưu trữ */}
          <div className="bg-black/5 p-1.5 rounded-xl border-2 border-black flex gap-2 shadow-neo-active">
            <button 
              onClick={() => setIsArchiveView(false)}
              className={`p-2.5 rounded-lg transition-all border-2 ${!isArchiveView ? 'bg-black text-white border-black shadow-neo' : 'text-black/40 border-transparent hover:text-black'}`}
              title="TIẾN ĐỘ SẢN XUẤT"
            >
              <Factory size={20} strokeWidth={2.5} className={!isArchiveView ? "animate-pulse" : ""} />
            </button>
            <button 
              onClick={() => setIsArchiveView(true)}
              className={`p-2.5 rounded-lg transition-all border-2 ${isArchiveView ? 'bg-neo-yellow text-black border-black shadow-neo' : 'text-black/40 border-transparent hover:text-black'}`}
              title="KHO LƯU TRỮ"
            >
              <Clock size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      <FacilitiesManagerModal 
        isOpen={showFacilitiesModal}
        onClose={() => setShowFacilitiesModal(false)}
      />

      {/* Unified Control Frame - Sticky */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md pt-4 pb-2 -mx-4 px-4">
        <div className="bg-white border-2 border-black rounded-[32px] shadow-neo overflow-hidden flex flex-col divide-y-2 divide-black/[0.08]">
          
          {/* Layer 1: Filter & Search */}
          <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 bg-white">
            <div className="flex-1 relative group" ref={searchRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-black transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Tìm kiếm lệnh sản xuất, SKU, mã đơn..."
                className="form-input pl-12 h-12 w-full font-bold uppercase placeholder:font-normal placeholder:normal-case shadow-neo-active focus:shadow-neo !border-black/10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && searchTerm.length >= 1 && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-black rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Gợi ý sản phẩm ({filteredSuggestions.length})</p>
                   </div>
                   <div className="max-h-60 overflow-y-auto">
                      {filteredSuggestions.map((p, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSearchTerm(p.name);
                            setShowSuggestions(false);
                          }}
                          className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors border-b border-gray-50 last:border-none group text-left"
                        >
                           <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{p.name}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{p.sku}</span>
                           </div>
                           <ChevronRight size={14} className="text-gray-300 group-hover:text-primary transition-all" />
                        </button>
                      ))}
                   </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setSortBy(sortBy === 'dueDate' ? 'none' : 'dueDate');
                  if (sortBy !== 'dueDate') setSortOrder('asc');
                }}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-2 shadow-neo-active
                  ${sortBy === 'dueDate' ? 'bg-neo-blue text-black border-black border-2' : 'bg-white text-muted-text border-black/5 hover:border-black'}`}
              >
                <Clock size={16} strokeWidth={3} /> {sortBy === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')} Hạn giao
              </button>
              <button 
                onClick={() => {
                  setSortBy(sortBy === 'priority' ? 'none' : 'priority');
                  if (sortBy !== 'priority') setSortOrder('desc');
                }}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border-2 shadow-neo-active
                  ${sortBy === 'priority' ? 'bg-neo-pink text-black border-black border-2' : 'bg-white text-muted-text border-black/5 hover:border-black'}`}
              >
                <Filter size={16} strokeWidth={3} /> {sortBy === 'priority' && (sortOrder === 'desc' ? '↑' : '↓')} Ưu tiên
              </button>
            </div>
          </div>

          {/* Layer 2: Quick Status Filters (Tabs Style) */}
          <div className="px-4 py-2 bg-gray-50/50 flex flex-wrap items-center gap-2 overflow-x-auto scrollbar-none">
            {(['all', 'Pending', 'Processing', 'QualityControl', 'Completed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-4 py-2 rounded-xl border-2 font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2
                  ${filterStatus === s ? 'bg-black text-white border-black shadow-neo-active translate-x-0.5 translate-y-0.5' : 'bg-white text-black/40 border-black/5 hover:border-black hover:text-black'}`}
              >
                <span>{s === 'all' ? 'Tất cả' : s === 'Pending' ? 'Chờ xử lý' : s === 'Processing' ? 'Đang sản xuất' : s === 'QualityControl' ? 'Kiểm tra QC' : 'Hoàn thành'}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[8px] border ${filterStatus === s ? 'bg-white/20 border-white/20' : 'bg-black/5 border-black/5'}`}>
                  {getStatusCount(s as any)}
                </span>
              </button>
            ))}
          </div>

          {/* Layer 3: Column Headers (Desktop Only) - Integrated for "Nguyên khối" look */}
          <div className="hidden md:flex divide-x-2 divide-black/[0.08] bg-white">
            {(["Pending", "Processing", "QualityControl", "Completed"] as Status[]).map((status) => {
              const count = getStatusCount(status);
              return (
                <div key={status} className="flex-1 p-4 flex items-center justify-between group cursor-default bg-white hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className={cn("w-3 h-3 rounded-full border border-black/20 shadow-sm", 
                      status === "Pending" ? "bg-gray-400" : 
                      status === "Processing" ? "bg-primary" : 
                      status === "QualityControl" ? "bg-amber-500" : "bg-green-500"
                    )} />
                    <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest">
                      {status === 'Pending' ? 'Chờ xử lý' : status === 'Processing' ? 'Đang sản xuất' : status === 'QualityControl' ? 'Kiểm tra QC' : 'Hoàn thành'}
                    </h3>
                  </div>
                  <span className="text-[10px] font-black text-black/60 bg-gray-100 px-2.5 py-1 rounded-full border border-black/5 tabular-nums">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-700">
        {viewMode === 'kanban' ? (
          <ProductionPipeline 
            searchTerm={searchTerm} 
            orders={sortedOrders} 
            loading={loading} 
            onRefresh={loadOrders} 
            onStatusChange={handleStatusChange}
            onSelectOrder={setSelectedOrder}
            onViewOrder={setViewingOrderId}
          />
        ) : (
          <ProductionListView 
            orders={sortedOrders} 
            loading={loading} 
            onRefresh={loadOrders} 
            onStatusChange={(id: string, status: string) => handleStatusChange(id, status)}
            onSelectOrder={setSelectedOrder}
            onViewOrder={setViewingOrderId}
          />
        )}
      </div>

      {/* Production Order Detail Modal */}
      <ProductionOrderDetailModal 
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdate={handleUpdateOrder}
        onDelete={handleDeleteProductionOrder}
        onStatusChange={handleStatusChange}
        onViewContract={setViewingOrderId}
      />

      {/* Order Detail Link Integration */}
      {viewingOrderId && (
        <OrderDetailsPanel 
          orderId={viewingOrderId}
          onClose={() => setViewingOrderId(null)}
          onUpdate={() => {
            setViewingOrderId(null);
            loadOrders();
          }}
          onDelete={() => {
            setViewingOrderId(null);
            loadOrders();
          }}
        />
      )}
    </div>
  );
}
