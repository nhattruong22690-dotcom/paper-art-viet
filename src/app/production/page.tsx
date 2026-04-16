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

  // Modal logic lifted from Pipeline
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [viewingOrderId, setViewingOrderId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogsDetail, setShowLogsDetail] = useState(false);
  const [showBatchForm, setShowBatchForm] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  
  // Edit Log State
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      loadLogs(selectedOrder.id);
    }
  }, [selectedOrder]);

  const loadLogs = async (id: string) => {
    setLogsLoading(true);
    try {
      const res = await fetch(`/api/production/logs?productionOrderId=${id}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

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
        loadOrders();
        // Update local state for immediate feedback
        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
        if (selectedOrder && selectedOrder.id === id) {
           setSelectedOrder({...selectedOrder, ...updates});
        }
      }
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!await confirm("Bạn có chắc chắn muốn xóa ghi nhận sản xuất này? Hệ thống sẽ tự động tính toán lại sản lượng.")) return;
    
    try {
      const res = await fetch(`/api/production/logs?id=${logId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Đã xóa ghi nhận sản xuất thành công');
        if (selectedOrder) {
          loadLogs(selectedOrder.id);
          loadOrders(); // Refresh to get updated completed quantity
        }
      } else {
        throw new Error('Xóa thất bại');
      }
    } catch (err) {
      console.error("Failed to delete log:", err);
      showToast('error', 'Không thể xóa ghi nhận. Vui lòng thử lại.');
    }
  };

  const handleEditLog = (log: any) => {
    setEditingLog(log);
    setShowEditModal(true);
  };

  const handleSaveEditLog = async (data: any) => {
    try {
      const res = await fetch('/api/production/logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingLog.id, ...data })
      });
      if (res.ok) {
        setShowEditModal(false);
        if (selectedOrder) {
          loadLogs(selectedOrder.id);
          loadOrders();
        }
      }
    } catch (err) {
      console.error("Failed to save edit log:", err);
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

      {/* Selected Order Detail Sidebar/Modal - Centralized */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-5xl card !p-0 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 bg-white">
            {/* Unified Top Header */}
            <div className="p-8 border-b border-gray-100 flex justify-between items-start bg-white">
               <div className="space-y-3">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded border border-primary/20 uppercase tracking-widest">{selectedOrder.sku}</span>
                     {selectedOrder.contractCode && (
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setViewingOrderId(selectedOrder.orderId || null);
                         }}
                         className="flex items-center gap-1.5 text-[10px] font-black text-neo-mint bg-neo-mint/10 border border-neo-mint/30 px-3 py-1 rounded hover:bg-neo-mint/20 transition-all uppercase tracking-widest"
                       >
                         <Briefcase size={12} /> HĐ: {selectedOrder.contractCode}
                       </button>
                     )}
                  </div>
                  <h2 className="text-3xl font-black text-foreground tracking-tight leading-none">{selectedOrder.title}</h2>
               </div>
               <div className="flex items-center gap-3">
                  <button 
                    title="Ghi nhận sản xuất"
                    onClick={() => setShowBatchForm(true)}
                    className="p-3 bg-primary text-white rounded-xl shadow-neo hover:shadow-neo-hover active:translate-y-0.5 transition-all group flex items-center gap-2"
                  >
                     <PencilLine size={24} strokeWidth={2.5} />
                     <span className="text-[10px] font-black uppercase tracking-widest pr-2 hidden group-hover:block">Ghi nhận sản xuất</span>
                  </button>
                  <button 
                    onClick={() => setSelectedOrder(null)}
                    className="p-3 text-gray-400 hover:text-foreground transition-all hover:bg-gray-100 rounded-xl"
                  >
                    <X size={24} strokeWidth={2.5} />
                  </button>
               </div>
            </div>
            <div className="overflow-y-auto custom-scrollbar max-h-[80vh]">
              {/* Info Bar - 4 columns */}
              <div className="p-8 grid grid-cols-4 gap-8 border-b border-gray-50 bg-gray-50/20">
                 <div className="space-y-1.5 border-l-2 border-gray-200 pl-4">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Khách hàng</p>
                    <p className="font-bold text-foreground text-sm truncate">{selectedOrder.customer || 'Khách lẻ'}</p>
                 </div>
                 <div className="space-y-1.5 border-l-2 border-red-100 pl-4 border-l-red-400/30">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Hạn khách giao</p>
                    <p className="font-bold text-red-600 text-sm flex items-center gap-2">
                       <Calendar size={14} /> {selectedOrder.dueDate}
                    </p>
                 </div>
                 <div className="space-y-1.5 border-l-2 border-neo-blue/20 pl-4 border-l-neo-blue/40">
                    <p className="text-[10px] font-black text-neo-blue uppercase tracking-[0.2em] mb-1">Hạn hoàn thành SX</p>
                    <p className="font-bold text-neo-blue text-sm flex items-center gap-2 italic">
                       <Clock size={14} /> {selectedOrder.deadlineProduction ? new Date(selectedOrder.deadlineProduction).toLocaleDateString('vi-VN') : '---'}
                    </p>
                 </div>
                 <div className="space-y-1.5 border-l-2 border-amber-100 pl-4 border-l-amber-400/30">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Độ ưu tiên</p>
                    <p className={cn(
                      "font-black italic text-sm flex items-center gap-1.5",
                      selectedOrder.priority === 'Urgent' ? 'text-red-500 animate-pulse font-black' : 
                      selectedOrder.priority === 'High' ? 'text-orange-500' : 'text-amber-500'
                    )}>
                      <AlertCircle size={14} />
                      {selectedOrder.priority === 'Urgent' ? 'RẤT GẤP' : 
                       selectedOrder.priority === 'High' ? 'KHẨN CẤP' : 'TRUNG BÌNH'}
                    </p>
                 </div>
              </div>

              {/* Progress Summary Table */}
              <div className="p-8 bg-gray-50/30 border-b border-gray-100">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                   <LayoutGrid size={14} className="text-primary" />
                   Tình hình sản xuất (Process)
                </h3>
                
                <div className="grid grid-cols-4 gap-4">
                   {[
                     { label: "Mục tiêu", val: selectedOrder.quantityTarget, color: "text-foreground" },
                     { label: "Hoàn thành", val: selectedOrder.quantityCompleted, color: "text-green-600" },
                     { label: "Còn lại", val: Math.max(0, selectedOrder.quantityTarget - selectedOrder.quantityCompleted), color: "text-amber-600" },
                     { label: "Tiến độ", val: `${selectedOrder.progress}%`, color: "text-primary" },
                   ].map((stat, idx) => (
                     <div key={idx} className="bg-white p-4 rounded-xl border border-border shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</span>
                        <span className={cn("text-xl font-black tabular-nums tracking-tighter", stat.color)}>{stat.val}</span>
                     </div>
                   ))}
                </div>

                 <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Thay đổi trạng thái quy trình</p>
                       <div className="flex flex-wrap gap-2">
                          {(Object.keys(statusConfig) as (keyof typeof statusConfig)[]).map(status => (
                            <button
                              key={status}
                              onClick={() => setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null)}
                              className={cn(
                                "px-4 py-2 text-[10px] font-black rounded-lg border-2 transition-all uppercase tracking-widest shadow-sm",
                                selectedOrder.status === status 
                                  ? "bg-primary text-white border-black" 
                                  : "bg-white text-muted-foreground border-border hover:border-gray-400 hover:bg-gray-50"
                              )}
                            >
                              {statusConfig[status].label}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-black text-foreground uppercase tracking-[0.2em]">Cài đặt Độ ưu tiên & Hạn SX</p>
                       <div className="flex flex-col gap-4">
                          <div className="flex flex-wrap gap-2">
                             {[
                               { val: 'Urgent', label: 'Rất gấp', color: 'bg-red-500' },
                               { val: 'High', label: 'Khẩn cấp', color: 'bg-orange-500' },
                               { val: 'Medium', label: 'Bình thường', color: 'bg-amber-400' },
                               { val: 'Low', label: 'Thấp', color: 'bg-gray-400' }
                             ].map((p) => (
                               <button
                                 key={p.val}
                                 onClick={() => setSelectedOrder(selectedOrder ? { ...selectedOrder, priority: p.val as any } : null)}
                                 className={cn(
                                   "px-3 py-2 text-[9px] font-black rounded-lg border-2 transition-all uppercase tracking-widest flex items-center gap-1",
                                   selectedOrder.priority === p.val
                                     ? `${p.color} text-white border-black shadow-neo-sm`
                                     : "bg-white text-muted-foreground border-border hover:bg-gray-50"
                                 )}
                               >
                                 <AlertCircle size={10} /> {p.label}
                               </button>
                             ))}
                          </div>

                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black text-foreground border-b-2 border-black/10 pb-0.5 uppercase tracking-tighter shrink-0">Hạn hoàn thành SX:</span>
                             <input 
                               type="date"
                               className="bg-white border-2 border-black px-3 py-1.5 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm hover:shadow-active transition-all"
                               value={selectedOrder.deadlineProduction ? new Date(selectedOrder.deadlineProduction).toISOString().split('T')[0] : ''}
                               onChange={(e) => setSelectedOrder(prev => prev ? { ...prev, deadlineProduction: e.target.value } : null)}
                             />
                          </div>

                          <button
                            onClick={() => handleUpdateOrder(selectedOrder.id, { 
                              priority: selectedOrder.priority, 
                              deadlineProduction: selectedOrder.deadlineProduction, status: selectedOrder.status 
                            })}
                            className="mt-2 w-full bg-primary text-white border-2 border-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-neo hover:shadow-neo-active hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-2"
                          >
                            Lưu
                          </button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Collapsible Production Log List */}
              <div className="p-8">
                 <button 
                   onClick={() => setShowLogsDetail(!showLogsDetail)}
                   className="w-full flex items-center justify-between p-5 bg-foreground text-white rounded-xl shadow-neo hover:shadow-neo-hover transition-all group"
                 >
                    <div className="flex items-center gap-4">
                       <span className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-amber-400">
                          <ClipboardList size={20} />
                       </span>
                       <div className="text-left">
                          <p className="text-sm font-black uppercase tracking-widest">Danh sách sản xuất chi tiết</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Xem lịch sử ghi nhận sản lượng</p>
                       </div>
                    </div>
                    <div className={cn("transition-transform duration-300", showLogsDetail ? "rotate-90" : "rotate-0")}>
                       <ChevronRight size={24} strokeWidth={3} />
                    </div>
                 </button>

                 {showLogsDetail && (
                    <div className="mt-4 border-2 border-black rounded-2xl overflow-x-auto custom-scrollbar animate-in slide-in-from-top duration-300">
                       <table className="w-full text-left border-collapse min-w-[700px] table-fixed">
                          <thead>
                             <tr className="bg-gray-100 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <th className="px-5 py-4 border-b border-black/5 font-black">Thời gian</th>
                                <th className="px-5 py-4 border-b border-black/5 font-black">Nhân sự</th>
                                <th className="px-5 py-4 border-b border-black/5 font-black text-center">SL</th>
                                <th className="px-5 py-4 border-b border-black/5 font-black text-center">Lỗi (K/V)</th>
                                <th className="px-5 py-4 border-b border-black/5 font-black">Ghi chú</th>
                                <th className="px-5 py-4 border-b border-black/5 font-black w-32 text-right shrink-0">Thao tác</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                             {logsLoading ? (
                                <tr>
                                   <td colSpan={6} className="px-5 py-16 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Đang tải lịch sử...</td>
                                </tr>
                             ) : logs.length === 0 ? (
                                <tr>
                                   <td colSpan={6} className="px-5 py-16 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Chưa có ghi nhận nào cho lệnh này</td>
                                </tr>
                             ) : (() => {
                                const grouped = logs.reduce((acc: any, log: any) => {
                                  const d = new Date(log.startTime || log.createdAt).toLocaleDateString('vi-VN');
                                  if (!acc[d]) acc[d] = { logs: [], total: 0 };
                                  acc[d].logs.push(log);
                                  acc[d].total += (log.quantityProduced || 0);
                                  return acc;
                                }, {});

                                return Object.keys(grouped).map(dateStr => (
                                  <React.Fragment key={dateStr}>
                                    {/* Date Group Header */}
                                    <tr 
                                      className="bg-gray-50/80 cursor-pointer hover:bg-gray-100 transition-colors"
                                      onClick={() => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }))}
                                    >
                                      <td colSpan={6} className="px-5 py-3 border-y border-black/10">
                                         <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                               <div className={cn("transition-transform duration-200", expandedDates[dateStr] ? "rotate-90" : "rotate-0")}>
                                                  <ChevronRight size={16} strokeWidth={3} className="text-primary" />
                                               </div>
                                               <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                                                  <Calendar size={14} />
                                                  NGÀY {dateStr}
                                               </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                               <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Tổng sản lượng trong ngày:</span>
                                               <span className="text-xs font-black text-primary tabular-nums bg-white border border-primary/20 px-2 py-0.5 rounded shadow-sm">{grouped[dateStr].total}</span>
                                            </div>
                                         </div>
                                      </td>
                                    </tr>
                                    
                                    {/* Group Logs */}
                                    {expandedDates[dateStr] && grouped[dateStr].logs.map((log: any) => (
                                      <tr key={log.id} className="hover:bg-gray-50/30 transition-colors bg-white">
                                         <td className="px-5 py-4 pl-12 border-b border-gray-50">
                                            <p className="text-[10px] text-muted-foreground font-black flex items-center gap-1.5">
                                               <Clock size={10} strokeWidth={3} />
                                               {new Date(log.createdAt || log.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                            </p>
                                         </td>
                                         <td className="px-5 py-4 border-b border-gray-50">
                                            <div className="flex items-center gap-2">
                                               <div className="w-6 h-6 rounded bg-black/5 flex items-center justify-center text-[8px] font-black text-muted-foreground border border-black/5">
                                                  {log.staffName?.substring(0,2).toUpperCase() || '??'}
                                               </div>
                                               <span className="text-[11px] font-bold text-foreground whitespace-nowrap">{log.staffName || 'N/A'}</span>
                                            </div>
                                         </td>
                                         <td className="px-5 py-4 text-center border-b border-gray-50">
                                            <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded tabular-nums border border-primary/10">{log.quantityProduced}</span>
                                         </td>
                                         <td className="px-5 py-4 text-center border-b border-gray-50">
                                            <div className="flex items-center justify-center gap-2 font-bold tabular-nums">
                                               <span className={cn("text-[10px]", (log.technicalErrorCount || 0) > 0 ? "text-red-500" : "text-gray-300")}>{log.technicalErrorCount || 0}</span>
                                               <span className="text-gray-200">/</span>
                                               <span className={cn("text-[10px]", (log.materialErrorCount || 0) > 0 ? "text-amber-500" : "text-gray-300")}>{log.materialErrorCount || 0}</span>
                                            </div>
                                         </td>
                                         <td className="px-5 py-4 border-b border-gray-50">
                                            <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px] italic">{log.note || '---'}</p>
                                         </td>
                                         <td className="px-5 py-4 border-b border-gray-50 text-right w-32 shrink-0">
                                            <div className="flex items-center justify-end gap-3">
                                               <button 
                                                 onClick={() => handleEditLog(log)}
                                                 className="p-1.5 hover:bg-neo-blue/10 hover:text-neo-blue rounded-lg transition-colors"
                                                 title="Chỉnh sửa"
                                               >
                                                  <Edit3 size={14} />
                                               </button>
                                               <button 
                                                 onClick={() => handleDeleteLog(log.id)}
                                                 className="p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                                                 title="Xóa"
                                               >
                                                  <Trash2 size={14} />
                                               </button>
                                            </div>
                                         </td>
                                      </tr>
                                    ))}
                                  </React.Fragment>
                                ));
                             })()}
                          </tbody>
                       </table>
                    </div>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {selectedOrder && (
        <ProductionBatchForm 
          isOpen={showBatchForm}
          onClose={() => setShowBatchForm(false)}
          onSuccess={() => {
            loadOrders();
            if (selectedOrder) {
              loadLogs(selectedOrder.id);
            }
          }}
          productionOrder={{
            id: selectedOrder.id,
            title: selectedOrder.title,
            sku: selectedOrder.sku,
            quantityTarget: selectedOrder.quantityTarget,
            quantityCompleted: selectedOrder.quantityCompleted
          }}
        />
      )}

      {/* Edit Log Modal */}
      {showEditModal && editingLog && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white border-4 border-black rounded-[2.5rem] w-full max-w-xl shadow-neo overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="bg-neo-blue p-6 border-b-4 border-black flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                       <PencilLine size={20} className="text-neo-blue" />
                    </div>
                    <div>
                       <h2 className="text-lg font-black uppercase tracking-tight text-black">Chỉnh sửa ghi nhận</h2>
                       <p className="text-[10px] text-black/60 font-bold uppercase tracking-widest">Hiệu chỉnh sản lượng và thông tin chi tiết</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowEditModal(false)}
                   className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-neo-active active:translate-x-[2px] active:translate-y-[2px]"
                 >
                    <X size={24} strokeWidth={3} />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Sản lượng hoàn thành</label>
                       <input 
                         type="number" 
                         defaultValue={editingLog.quantityProduced}
                         id="edit-qty"
                         className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-bold text-sm focus:bg-white outline-none transition-all tabular-nums text-black"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Nhân sự (Mã/Tên)</label>
                       <input 
                         type="text" 
                         defaultValue={editingLog.staffName}
                         id="edit-staff"
                         disabled
                         className="w-full bg-gray-100 border-2 border-black/10 rounded-xl px-4 py-3 font-bold text-sm text-gray-400 italic"
                       />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 text-red-500">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-60 pl-1 font-bold">Lỗi kỹ thuật (KT)</label>
                       <input 
                         type="number" 
                         defaultValue={editingLog.technicalErrorCount}
                         id="edit-tech"
                         className="w-full bg-red-50 border-2 border-black rounded-xl px-4 py-3 font-bold text-sm focus:bg-white outline-none transition-all tabular-nums text-black"
                       />
                    </div>
                    <div className="space-y-2 text-amber-500">
                       <label className="text-[10px] font-black uppercase tracking-widest opacity-60 pl-1 font-bold">Lỗi vật tư (VT)</label>
                       <input 
                         type="number" 
                         defaultValue={editingLog.materialErrorCount}
                         id="edit-mat"
                         className="w-full bg-amber-50 border-2 border-black rounded-xl px-4 py-3 font-bold text-sm focus:bg-white outline-none transition-all tabular-nums text-black"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Ghi chú chi tiết</label>
                    <textarea 
                      id="edit-note"
                      rows={3}
                      defaultValue={editingLog.note}
                      className="w-full bg-gray-50 border-2 border-black rounded-xl px-4 py-3 font-bold text-sm focus:bg-white outline-none transition-all resize-none text-black"
                      placeholder="Nhập lý do điều chỉnh hoặc lỗi phát sinh..."
                    />
                 </div>
              </div>

              <div className="p-8 bg-gray-50 border-t-4 border-black flex gap-4">
                 <button 
                   onClick={() => setShowEditModal(false)}
                   className="flex-1 bg-white border-2 border-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-all font-bold"
                 >
                    Hủy bỏ
                 </button>
                 <button 
                   onClick={() => {
                     const qty = (document.getElementById('edit-qty') as HTMLInputElement).value;
                     const tech = (document.getElementById('edit-tech') as HTMLInputElement).value;
                     const mat = (document.getElementById('edit-mat') as HTMLInputElement).value;
                     const note = (document.getElementById('edit-note') as HTMLTextAreaElement).value;
                     handleSaveEditLog({
                       quantityProduced: Number(qty),
                       technicalErrorCount: Number(tech),
                       materialErrorCount: Number(mat),
                       note: note
                     });
                   }}
                   className="flex-[2] bg-neo-blue text-black border-2 border-black px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-neo hover:shadow-neo-hover active:translate-x-[2px] active:translate-y-[2px] transition-all font-bold"
                 >
                    Lưu thay đổi
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
