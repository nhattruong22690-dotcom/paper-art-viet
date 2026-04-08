import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit3, Save, Calendar, User, FileText, CheckCircle2, ChevronRight, Plus, Factory, Zap, Briefcase, UserCheck, History, RotateCcw, Activity, Layers } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import SplitProductionModal from './SplitProductionModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatMoney(amount: number, currency: string = 'VND') {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  }
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

interface OrderDetailsPanelProps {
  orderId: string | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function OrderDetailsPanel({ orderId, onClose, onUpdate, onDelete }: OrderDetailsPanelProps) {
  const { showToast, showModal, confirm: customConfirm } = useNotification();
  const { profile } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [activeItemForSplit, setActiveItemForSplit] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [expandedSnapshotItems, setExpandedSnapshotItems] = useState<Record<string, boolean>>({});

  const toggleSnapshot = (itemId: string) => {
    setExpandedSnapshotItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  useEffect(() => {
    // Luôn tắt chế độ chỉnh sửa khi đơn hàng thay đổi hoặc bảng bị đóng
    setIsEditing(false);
    if (orderId) {
      document.body.style.overflow = 'hidden';
      fetchOrder();
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [orderId]);

  useEffect(() => {
    if (isEditing && allProducts.length === 0) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => setAllProducts(data))
        .catch(err => console.error('Error fetching products:', err));
    }
  }, [isEditing]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_production': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'packing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'shipping': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const fetchOrder = async () => {
    setLoading(true);
    setOrder(null);
    setFetchError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      
      if (data.error) {
        setFetchError(data.error);
        return;
      }
      
      setOrder(data);
      // Initialize editData without relational objects that shouldn't be in update payload
      const { id, customer, productionOrders, packages, overallProgress, ...rest } = data;
      setEditData(rest);
    } catch (error: any) {
      console.error('Fetch error:', error);
      setFetchError(error.message || 'Lỗi không xác định khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const changes = generateDiffLog(order, editData);
      
      const payload: any = {
        ...editData,
        estimated_stages: editData.estimatedStages, // Map back to snake_case
        currency: editData.currency || 'VND'
      };

      if (changes.length > 0) {
        const timestamp = new Intl.DateTimeFormat('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(new Date());

        payload.newLog = {
          person: profile?.name || 'Quản trị viên',
          time: timestamp,
          message: changes.join('; ')
        };
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update order');
      }

      setIsEditing(false);
      showToast('success', 'Đã lưu thay đổi đơn hàng');
      onUpdate();
      fetchOrder();
    } catch (error) {
      console.error('Update error:', error);
      showToast('error', 'Lỗi khi cập nhật đơn hàng');
    }
  };

  const generateDiffLog = (oldData: any, newData: any) => {
    const changes: string[] = [];
    
    if (oldData.status !== newData.status) {
      const statusMap: any = { new: 'Mới', in_production: 'Sản xuất', packing: 'Đóng gói', shipping: 'Giao hàng', completed: 'Hoàn tất' };
      changes.push(`Trạng thái: ${statusMap[oldData.status] || oldData.status} -> ${statusMap[newData.status] || newData.status}`);
    }

    if (oldData.currency !== newData.currency) {
      changes.push(`Tiền tệ: ${oldData.currency || 'VND'} -> ${newData.currency}`);
    }
    
    const oldDeadline = oldData.deadlineDelivery?.slice(0, 10);
    const newDeadline = newData.deadlineDelivery?.slice(0, 10);
    if (oldDeadline !== newDeadline) {
      changes.push(`Hạn giao: ${oldDeadline || '---'} -> ${newDeadline}`);
    }
    
    if (oldData.notes !== newData.notes) {
      changes.push(`Ghi chú đã thay đổi`);
    }

    // Comparing items
    const oldItems = oldData.orderItems || [];
    const newItems = newData.orderItems || [];
    
    newItems.forEach((ni: any) => {
      const oi = oldItems.find((i: any) => i.id === ni.id);
      if (!oi) {
        changes.push(`Thêm SP: ${ni.product?.name || 'Sản phẩm mới'} (${ni.quantity})`);
      } else {
        if (oi.quantity !== ni.quantity) {
          changes.push(`SL [${ni.product?.name || '?' }]: ${oi.quantity} -> ${ni.quantity}`);
        }
        if (Number(oi.price) !== Number(ni.price)) {
          changes.push(`Giá [${ni.product?.name || '?' }]: ${formatMoney(Number(oi.price), oldData.currency)} -> ${formatMoney(Number(ni.price), newData.currency)}`);
        }
      }
    });

    oldItems.forEach((oi: any) => {
      if (!newItems.find((ni: any) => ni.id === oi.id)) {
        changes.push(`Xóa SP: ${oi.product?.name}`);
      }
    });

    return changes;
  };

  const toggleMilestone = async (milestoneId: string) => {
    const updatedStages = order.estimatedStages.map((m: any) => 
      m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
    );
    
    // Quick update to UI
    setOrder({ ...order, estimatedStages: updatedStages });
    setEditData({ ...editData, estimatedStages: updatedStages });

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estimated_stages: updatedStages }),
      });
      onUpdate();
    } catch (error) {
      console.error('Toggle milestone error:', error);
      showToast('error', 'Không thể cập nhật trạng thái công đoạn');
    }
  };

  const handleDelete = async () => {
    const poCount = order.productionOrders?.length || 0;
    const message = poCount > 0 
      ? `Đơn hàng này đang có ${poCount} Lệnh sản xuất đang chạy. Bạn có muốn xóa đơn hàng và HỦY toàn bộ các lệnh liên quan không?`
      : 'Bạn có chắc chắn muốn xóa đơn hàng này?';

    if (await customConfirm(message)) {
      try {
        await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
        showToast('success', 'Đã xóa đơn hàng thành công');
        onDelete();
      } catch (error) {
        showModal('error', 'Lỗi khi xóa đơn hàng', String(error));
        console.error('Delete error:', error);
      }
    }
  };

  const getItemProgress = (productId: string, orderItemQuantity: number) => {
    const itemPOs = order.productionOrders?.filter((po: any) => po.productId === productId) || [];
    const totalAllocated = itemPOs.reduce((acc: number, po: any) => acc + (po.quantityTarget || 0), 0);
    const totalDone = itemPOs.reduce((acc: number, po: any) => acc + (po.quantityCompleted || 0), 0);
    const remaining = Math.max(0, orderItemQuantity - totalAllocated);
    const percent = orderItemQuantity > 0 ? Math.round((totalDone / orderItemQuantity) * 100) : 0;
    return { percent, totalDone, totalAllocated, remaining, pos: itemPOs };
  };

  return (
    <div className={`fixed inset-0 z-50 transition-opacity ${orderId ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className={`absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl transition-transform duration-500 transform ${orderId ? 'translate-x-0' : 'translate-x-full'}`}>
        {loading ? (
          <div className="h-full flex items-center justify-center p-20 text-xs font-black uppercase tracking-widest text-gray-400 animate-pulse">
            Đang tải dữ liệu chi tiết...
          </div>
        ) : fetchError ? (
          <div className="h-full flex flex-col items-center justify-center p-10 text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
               <X size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Không thể tải dữ liệu</h3>
            <p className="text-sm text-gray-500 max-w-xs mb-8">
              Đã xảy ra lỗi khi truy vấn thông tin đơn hàng từ máy chủ.
              <br/>
              <span className="text-[10px] uppercase font-bold text-red-400 mt-2 block">Lỗi: {fetchError}</span>
            </p>
            <button 
              onClick={fetchOrder}
              className="px-6 py-3 bg-foreground text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-primary transition-all"
            >
              Thử lại
            </button>
          </div>
        ) : order && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-white shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="bg-primary text-white px-2 py-0.5 rounded text-xs">#{order.contractCode || (orderId ? orderId.slice(-6).toUpperCase() : '---')}</span>
                  Chi tiết đơn hàng
                </h2>
                <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shrink-0">Trạng thái: {order.status}</p>
                   <p className="text-[10px] text-primary uppercase font-bold tracking-widest bg-primary/5 px-2 py-0.5 rounded border border-primary/10 shrink-0">{order.currency || 'VND'}</p>
                    {order.contractCode && (
                       <p className="text-[10px] text-primary font-bold tracking-widest truncate">Số hợp đồng: {order.contractCode}</p>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                   <button 
                     onClick={() => setIsEditing(true)} 
                     className="flex items-center gap-2 px-3 py-1.5 bg-neo-purple/10 text-primary border border-primary/20 rounded-lg hover:bg-neo-purple/20 transition-all font-bold text-[10px] uppercase tracking-widest"
                  >
                    <Edit3 size={14} /> Chỉnh sửa
                  </button>
                )}
                <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={18} />
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1.5">
                      <User size={12} /> Khách hàng
                    </label>
                    <p className="text-sm font-bold text-foreground">{order.customer?.name || 'Vãng lai'}</p>
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">Hạn Giao Hàng</span>
                      {isEditing ? (
                        <input 
                          type="date"
                          value={editData.deadlineDelivery?.slice(0, 10)}
                          onChange={(e) => setEditData({...editData, deadlineDelivery: e.target.value})}
                          className="text-xs font-black px-2 py-1 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-white outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={14} className="text-black/40" />
                          <span className="text-xs font-black text-black italic">
                            {order.deadlineDelivery ? new Date(order.deadlineDelivery).toLocaleDateString('vi-VN') : '---'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                 <div className="space-y-4">
                   <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1.5">
                       <FileText size={12} /> Số hợp đồng
                    </label>
                    <p className="text-sm font-bold text-primary italic underline-offset-4 decoration-primary/30">
                      {order.contractCode || '---'}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">Tiền tệ</span>
                      {isEditing ? (
                        <select 
                          value={editData.currency || 'VND'}
                          onChange={(e) => setEditData({...editData, currency: e.target.value})}
                          className="text-xs font-black px-2 py-1 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold uppercase tracking-widest"
                        >
                          <option value="VND">VND</option>
                          <option value="USD">USD</option>
                        </select>
                      ) : (
                        <span className="text-sm font-bold text-foreground">{order.currency || 'VND'}</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-black/40 uppercase tracking-widest leading-none mb-1">Trạng thái</span>
                      {isEditing ? (
                        <select 
                          value={editData.status}
                          onChange={(e) => setEditData({...editData, status: e.target.value})}
                          className="text-xs font-black px-2 py-1 rounded-md border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-white outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold uppercase tracking-widest"
                        >
                          <option value="new">Mới lên đơn</option>
                          <option value="in_production">Sản xuất</option>
                          <option value="packing">Đóng gói</option>
                          <option value="shipping">Giao hàng</option>
                          <option value="completed">Hoàn tất</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                           <span className={cn(
                              "text-[10px] font-black px-2 py-1 rounded border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] uppercase tracking-widest",
                              getStatusColor(order.status)
                            )}>
                              {order.status === 'new' ? 'Mới' : 
                                order.status === 'in_production' ? 'Sản xuất' : 
                                order.status === 'packing' ? 'Đóng gói' : 
                                order.status === 'shipping' ? 'Giao hàng' : 
                                order.status === 'completed' ? 'Hoàn tất' : order.status}
                           </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-l-4 border-primary pl-3">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Mục sản xuất</h3>
                  {isEditing && (
                    <div className="flex items-center gap-2">
                       <button 
                          onClick={() => {
                           const newItems = [
                             ...(editData.orderItems || []),
                             { id: 'new-' + Math.random().toString(36).substr(2, 9), productId: '', quantity: 1, price: 0, product: { name: 'Sản phẩm mới...', sku: 'NEW' } }
                           ];
                           setEditData({ ...editData, orderItems: newItems });
                         }}
                         className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all shadow-sm"
                       >
                          <Plus size={14} strokeWidth={3} />
                       </button>
                       <button 
                          onClick={async () => {
                           if (await customConfirm('Bạn có chắc muốn xóa tất cả sản phẩm trong danh sách chỉnh sửa?')) {
                             setEditData({ ...editData, orderItems: [] });
                           }
                         }}
                         className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all shadow-sm"
                       >
                          <Trash2 size={14} />
                       </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {(isEditing ? editData.orderItems : order.orderItems || []).map((item: any) => {
                    const stats = getItemProgress(item.productId, item.quantity);
                    const isNewItem = String(item.id).startsWith('new-');
                    return (
                      <div key={item.id} className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all divide-y divide-border">
                        {/* Main Item Info */}
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/5 rounded border border-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                 {item.product?.sku?.slice(-4) || 'NEW'}
                              </div>
                               <div>
                                 <h4 className="text-sm font-bold text-foreground">
                                    {isEditing ? (
                                      <select 
                                        className="bg-gray-50 border border-border rounded px-2 py-1 text-xs font-bold w-full max-w-[200px]"
                                        value={item.productId}
                                        onChange={(e) => {
                                           const selectedProd = allProducts.find(p => p.id === e.target.value);
                                           const newItems = editData.orderItems.map((oi: any) => 
                                             oi.id === item.id ? { 
                                               ...oi, 
                                               productId: e.target.value, 
                                               product: { ...oi.product, name: selectedProd?.name || '---', sku: selectedProd?.code || '---' },
                                               price: selectedProd?.basePrice || oi.price,
                                               cogsAtOrder: selectedProd?.cogs || oi.cogsAtOrder
                                             } : oi
                                           );
                                           setEditData({ ...editData, orderItems: newItems });
                                        }}
                                      >
                                         <option value="">-- Chọn sản phẩm --</option>
                                         {allProducts.map(p => (
                                           <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                                         ))}
                                      </select>
                                    ) : (
                                      item.product?.name
                                    )}
                                 </h4>
                                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-2">
                                     <div className="flex flex-col">
                                       <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">S.Lượng</span>
                                       <span className="text-[11px] font-bold text-foreground">{item.quantity} {item.product?.unit || 'Cái'}</span>
                                     </div>
                                     <div className="w-px h-6 bg-gray-100 hidden md:block" />
                                     <div className="flex flex-col">
                                       <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Giá vốn (Chốt)</span>
                                       <span className="text-[11px] font-bold text-amber-600">{formatMoney(item.cogsAtOrder || 0, order.currency)}</span>
                                     </div>
                                     <div className="w-px h-6 bg-gray-100 hidden md:block" />
                                     <div className="flex flex-col">
                                       <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Giá Deal</span>
                                       <span className="text-[11px] font-bold text-primary">{formatMoney(item.price || 0, order.currency)}</span>
                                     </div>
                                     <div className="w-px h-6 bg-gray-100 hidden md:block" />
                                     <div className="flex flex-col">
                                       <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">TG Sản xuất</span>
                                       <span className="text-[11px] font-bold text-foreground">{item.productionTimeStd || 0} Phút</span>
                                     </div>
                                     <div className="w-px h-6 bg-gray-100 hidden md:block" />
                                     <div className="flex flex-col">
                                       <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Thành tiền</span>
                                       <span className="text-[11px] font-black text-foreground">{formatMoney(item.price * item.quantity, order.currency)}</span>
                                     </div>
                                  </div>

                                  {!isEditing && (
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed border-gray-100">
                                       <div className="flex flex-col">
                                         <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Đã phân bổ</span>
                                         <span className="text-[11px] font-bold text-green-600">{isNewItem ? '---' : stats.totalAllocated}</span>
                                       </div>
                                       <div className="w-px h-6 bg-gray-100" />
                                       <div className="flex flex-col">
                                         <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Đã xong</span>
                                         <span className="text-[11px] font-bold text-blue-600">{isNewItem ? '---' : stats.totalDone}</span>
                                       </div>
                                    </div>
                                  )}
                               </div>
                           </div>
                           
                           <div className="flex items-center gap-4">
                              {isEditing ? (
                                <div className="flex items-center gap-4">
                                  <div className="flex flex-col gap-1">
                                     <span className="text-[8px] text-muted-foreground font-bold uppercase">SL</span>
                                     <input 
                                       type="number"
                                       className="w-16 bg-gray-50 border border-border rounded p-1 text-[11px] font-bold text-right"
                                       value={item.quantity}
                                       onChange={(e) => {
                                         const value = parseFloat(e.target.value);
                                         const newItems = editData.orderItems.map((oi: any) => 
                                           oi.id === item.id ? { ...oi, quantity: isNaN(value) ? 0 : value } : oi
                                         );
                                         setEditData({ ...editData, orderItems: newItems });
                                       }}
                                     />
                                  </div>
                                   <div className="flex flex-col gap-1">
                                      <span className="text-[8px] text-muted-foreground font-bold uppercase">Giá vốn</span>
                                      <input 
                                        type="number"
                                        step="any"
                                        className="w-24 bg-gray-50 border border-border rounded p-1 text-[11px] font-bold text-right text-amber-600/60 italic"
                                        value={item.cogsAtOrder}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value);
                                          const newItems = editData.orderItems.map((oi: any) => 
                                            oi.id === item.id ? { ...oi, cogsAtOrder: isNaN(value) ? 0 : value } : oi
                                          );
                                          setEditData({ ...editData, orderItems: newItems });
                                        }}
                                        placeholder="0.00"
                                      />
                                   </div>
                                  <div className="flex flex-col gap-1">
                                     <span className="text-[8px] text-muted-foreground font-bold uppercase">Giá Deal</span>
                                     <input 
                                       type="number"
                                       className="w-24 bg-gray-50 border border-border rounded p-1 text-[11px] font-bold text-right"
                                       value={item.price}
                                       onChange={(e) => {
                                         const value = parseFloat(e.target.value);
                                         const newItems = editData.orderItems.map((oi: any) => 
                                           oi.id === item.id ? { ...oi, price: isNaN(value) ? 0 : value } : oi
                                         );
                                         setEditData({ ...editData, orderItems: newItems });
                                       }}
                                     />
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const newItems = editData.orderItems.filter((oi: any) => oi.id !== item.id);
                                      setEditData({ ...editData, orderItems: newItems });
                                    }}
                                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all border border-red-100 mt-3"
                                  >
                                     <Trash2 size={16} />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                     <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tiến độ</p>
                                     <p className="text-sm font-bold text-primary">{stats.percent}%</p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setActiveItemForSplit(item);
                                      setIsSplitModalOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-foreground text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-sm"
                                  >
                                    <Zap size={14} className="text-amber-400" /> Phân bổ
                                  </button>
                                </div>
                              )}
                           </div>
                        </div>

                         {/* Snapshot Details Section */}
                         {!isEditing && item.snapshot && (
                           <div className="px-5 py-3 bg-gray-50/50">
                              <div className="flex flex-col gap-3">
                                {item.snapshot && (
                                  <div className="border-b border-gray-200 pb-3 mb-1">
                                    <button 
                                      onClick={() => toggleSnapshot(item.id)}
                                      className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-all"
                                    >
                                      {expandedSnapshotItems[item.id] ? <Activity size={12} /> : <FileText size={12} />}
                                      {expandedSnapshotItems[item.id] ? 'Ẩn định mức snapshot' : 'Xem định mức & công đoạn đã chốt'}
                                    </button>

                                    {expandedSnapshotItems[item.id] && (
                                      <div className="mt-3 p-4 bg-white border border-primary/20 rounded-xl shadow-inner animate-in slide-in-from-top-2 duration-300">
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* BOM Snapshot */}
                                            <div className="space-y-3">
                                               <h5 className="text-[10px] font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                                                  <Layers size={12} /> Định mức vật tư (BOM)
                                               </h5>
                                               <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                  {item.snapshot.bom_data?.length > 0 ? (
                                                    item.snapshot.bom_data.map((m: any, idx: number) => (
                                                      <div key={idx} className="flex justify-between items-center text-[11px] p-2 bg-gray-50 rounded border border-gray-100">
                                                         <span className="font-bold text-gray-600">[{m.material_sku}] {m.material_name}</span>
                                                         <span className="font-black text-primary">{m.qty} {m.unit}</span>
                                                      </div>
                                                    ))
                                                  ) : <p className="text-[10px] italic text-muted-foreground">Không có dữ liệu BOM</p>}
                                               </div>
                                            </div>

                                            {/* Operations Snapshot */}
                                            <div className="space-y-3">
                                               <h5 className="text-[10px] font-black text-foreground flex items-center gap-2 uppercase tracking-tight">
                                                  <Zap size={12} /> Công đoạn sản xuất
                                               </h5>
                                               <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                                  {item.snapshot.operations_data?.length > 0 ? (
                                                    item.snapshot.operations_data.map((o: any, idx: number) => (
                                                      <div key={idx} className="flex justify-between items-center text-[11px] p-2 bg-gray-50 rounded border border-gray-100">
                                                         <span className="font-bold text-gray-600 italic">#{o.sequence} {o.name}</span>
                                                         <span className="font-black text-emerald-600">{(o.price || 0).toLocaleString('vi-VN')} đ</span>
                                                      </div>
                                                    ))
                                                  ) : <p className="text-[10px] italic text-muted-foreground">Không có dữ liệu công đoạn</p>}
                                               </div>
                                            </div>
                                         </div>
                                         
                                         {/* Financial & Production Snapshot */}
                                         <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="flex flex-col">
                                               <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Giá vốn (Chốt)</span>
                                               <span className="text-[11px] font-bold text-amber-600">{formatMoney(item.snapshot.prices?.cost || 0, order.currency)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                               <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Giá Niêm yết</span>
                                               <span className="text-[11px] font-bold text-foreground">{formatMoney(item.snapshot.prices?.base || 0, order.currency)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                               <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">TG Sản xuất (Std)</span>
                                               <span className="text-[11px] font-bold text-foreground">{(item.snapshot.production_time_std || 0)} Phút</span>
                                            </div>
                                            <div className="flex flex-col">
                                               <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Giá Deal chốt</span>
                                               <span className="text-[11px] font-bold text-primary font-black">{formatMoney(item.price || 0, order.currency)}</span>
                                            </div>
                                         </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Production Orders Grid */}
                                {stats.pos.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {stats.pos.map((po: any) => (
                                      <div key={po.id} className="bg-white p-3 rounded border border-border flex items-center justify-between shadow-sm">
                                         <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded flex items-center justify-center text-[9px] font-bold uppercase ${
                                              po.allocationType === 'internal' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                               {po.allocationType === 'internal' ? 'X' : 'GC'}
                                            </div>
                                            <div>
                                               <p className="text-[10px] font-bold text-foreground uppercase">
                                                 {po.workshop?.name || po.outsourcer?.name || po.assignedTo || 'Chưa gán'}
                                               </p>
                                               <p className="text-[9px] text-muted-foreground font-bold tracking-tight">
                                                 HT: {po.quantityCompleted || 0} / {po.quantityTarget}
                                               </p>
                                            </div>
                                         </div>
                                         <div className="text-right shrink-0">
                                            <span className={`text-[10px] font-bold ${
                                              po.currentStatus === 'completed' ? 'text-green-600' : 'text-primary'
                                            }`}>
                                              {Math.round((po.quantityCompleted / po.quantityTarget) * 100)}%
                                            </span>
                                            <div className="w-12 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                               <div 
                                                  className={`h-full ${po.currentStatus === 'completed' ? 'bg-green-600' : 'bg-primary'}`}
                                                 style={{ width: `${Math.min(100, (po.quantityCompleted / po.quantityTarget) * 100)}%` }}
                                               />
                                            </div>
                                         </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-2 opacity-50">
                                     <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest italic">Sản phẩm này chưa gán lệnh sản xuất</p>
                                  </div>
                                )}
                              </div>
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-l-4 border-amber-400 pl-3">
                   <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Thời hạn các khâu dự tính</h3>
                   {isEditing && (
                     <div className="flex items-center gap-2">
                        <button 
                           onClick={() => {
                            const newMilestones = [
                              ...(editData.estimatedStages || []),
                              { id: Math.random().toString(36).substr(2, 9), label: '', deadline: '', isCompleted: false }
                            ];
                            setEditData({ ...editData, estimatedStages: newMilestones });
                          }}
                          className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 border border-amber-200 transition-all shadow-sm"
                        >
                          <Plus size={14} strokeWidth={3} />
                        </button>
                        <button 
                           onClick={async () => {
                            if (await customConfirm('Bạn có chắc muốn xóa tất cả các khâu dự tính?')) {
                              setEditData({ ...editData, estimatedStages: [] });
                            }
                          }}
                          className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all shadow-sm"
                        >
                           <Trash2 size={14} />
                        </button>
                     </div>
                   )}
                </div>
                
                <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
                   <table className="w-full text-left text-xs">
                      <thead>
                         <tr className="bg-gray-50/50 border-b border-border text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                            <th className="px-4 py-3">Công đoạn</th>
                            <th className="px-4 py-3 w-32 text-center">Thời hạn</th>
                            <th className="px-4 py-3 w-20 text-center">Xong</th>
                            {isEditing && <th className="px-4 py-3 w-10"></th>}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                         {(isEditing ? editData.estimatedStages : order.estimatedStages)?.map((m: any) => (
                           <tr key={m.id} className={cn("transition-colors", m.isCompleted ? "bg-green-50/30" : "")}>
                              <td className="px-4 py-3 font-bold text-foreground">
                                 {isEditing ? (
                                   <input 
                                      type="text"
                                     className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-bold"
                                     value={m.label}
                                     placeholder="Tên khâu..."
                                     onChange={(e) => {
                                       const newMilestones = editData.estimatedStages.map((ms: any) => 
                                          ms.id === m.id ? { ...ms, label: e.target.value } : ms
                                       );
                                       setEditData({ ...editData, estimatedStages: newMilestones });
                                     }}
                                   />
                                 ) : m.label || '---'}
                              </td>
                              <td className="px-4 py-3 text-center tabular-nums font-bold text-muted-foreground">
                                 {isEditing ? (
                                    <input 
                                       type="date"
                                      className="w-full bg-transparent border-none outline-none focus:ring-0 p-0 text-xs font-bold text-center"
                                      value={m.deadline}
                                      onChange={(e) => {
                                        const newMilestones = editData.estimatedStages.map((ms: any) => 
                                           ms.id === m.id ? { ...ms, deadline: e.target.value } : ms
                                        );
                                        setEditData({ ...editData, estimatedStages: newMilestones });
                                      }}
                                    />
                                 ) : m.deadline ? new Date(m.deadline).toLocaleDateString('vi-VN', {day:'2-digit', month:'2-digit'}) : '---'}
                              </td>
                              <td className="px-4 py-3">
                                 <div className="flex justify-center">
                                    <button 
                                       onClick={() => !isEditing && toggleMilestone(m.id)}
                                      disabled={isEditing}
                                      className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                        m.isCompleted ? "bg-green-500 border-green-500 text-white" : "bg-white border-gray-300 hover:border-primary"
                                      )}
                                    >
                                       {m.isCompleted && <CheckCircle2 size={12} strokeWidth={3} />}
                                    </button>
                                 </div>
                              </td>
                              {isEditing && (
                                <td className="px-4 py-3 text-center">
                                   <button 
                                      onClick={() => {
                                       const newMilestones = editData.estimatedStages.filter((ms: any) => ms.id !== m.id);
                                       setEditData({ ...editData, estimatedStages: newMilestones });
                                     }}
                                     className="text-red-400 hover:text-red-600 transition-colors"
                                   >
                                      <Trash2 size={14} />
                                   </button>
                                </td>
                              )}
                           </tr>
                         ))}
                         {(!(isEditing ? editData.estimatedStages : order.estimatedStages) || (isEditing ? editData.estimatedStages : order.estimatedStages).length === 0) && (
                           <tr>
                              <td colSpan={isEditing ? 4 : 3} className="px-4 py-8 text-center text-gray-400 italic text-[10px] uppercase font-bold tracking-widest">
                                 Chưa có dữ liệu khâu dự tính
                              </td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-foreground text-white rounded-lg p-6 shadow-md relative overflow-hidden">
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Giá trị đơn hàng</p>
                    <p className="text-2xl font-bold text-white">{formatMoney((order.orderItems || []).reduce((acc: any, i: any) => acc + (Number(i.price) * i.quantity), 0), order.currency)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dự kiến lợi nhuận</p>
                    <p className="text-2xl font-bold text-green-400">
                      {formatMoney((order.orderItems || []).reduce((acc: any, i: any) => acc + ((Number(i.price) - Number(i.cogsAtOrder || 0)) * i.quantity), 0), order.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-l-4 border-gray-300 pl-3">Ghi chú hợp đồng</label>
                <textarea 
                   className="w-full bg-gray-50 border-gray-100 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary-100 min-h-[100px]"
                  placeholder="Nhập ghi chú quan trọng cho đơn hàng này..."
                  value={editData.notes || ''}
                  onChange={(e) => setEditData({...editData, notes: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              {/* Edit Logs Section */}
              <div className="space-y-4 pt-4 border-t border-dashed border-border">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 bg-gray-100 border border-border rounded flex items-center justify-center text-muted-foreground">
                      <History size={16} />
                   </div>
                   <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">Lịch sử chỉnh sửa</h3>
                </div>
                
                <div className="space-y-3">
                   {order.logs && order.logs.length > 0 ? [...order.logs].reverse().map((log: any, idx: number) => (
                     <div key={idx} className="bg-gray-50/50 p-4 rounded-xl border border-border/50 relative group">
                        <div className="flex justify-between items-start mb-2">
                           <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-primary rounded-full" />
                              <span className="text-[10px] font-black text-foreground uppercase">{log.person}</span>
                           </div>
                           <span className="text-[9px] font-bold text-muted-foreground tabular-nums">{log.time}</span>
                        </div>
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed pl-4 border-l border-gray-200">
                          {log.message || 'Cập nhật thông tin đơn hàng'}
                        </p>
                     </div>
                   )) : (
                     <div className="bg-gray-50/30 p-8 rounded-xl border-2 border-dashed border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest italic">Chưa có lịch sử thay đổi</p>
                     </div>
                   )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-white shrink-0">
              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditData(order);
                      }}
                      className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold transition-all uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={16} /> Hủy bỏ
                    </button>
                    <button 
                      onClick={handleSave}
                      className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                    >
                      <Save size={16} /> Lưu thay đổi
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={onClose}
                    className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-sm transition-all uppercase tracking-widest text-[10px]"
                  >
                    Đóng chi tiết
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <SplitProductionModal 
        isOpen={isSplitModalOpen}
        onClose={() => {
          setIsSplitModalOpen(false);
          setActiveItemForSplit(null);
        }}
        onSuccess={() => {
          fetchOrder();
          onUpdate();
        }}
        orderId={orderId || ''}
        orderItem={activeItemForSplit}
      />
    </div>
  );
}