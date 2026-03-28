import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit3, Save, Calendar, User, FileText, CheckCircle2, ChevronRight, Plus, Factory, Zap, Briefcase, UserCheck } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import SplitProductionModal from './SplitProductionModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface OrderDetailsPanelProps {
  orderId: string | null;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function OrderDetailsPanel({ orderId, onClose, onUpdate, onDelete }: OrderDetailsPanelProps) {
  const { showToast, showModal, confirm: customConfirm } = useNotification();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [activeItemForSplit, setActiveItemForSplit] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

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
      setEditData(data);
    } catch (error: any) {
      console.error('Fetch error:', error);
      setFetchError(error.message || 'Lỗi không xác định khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      setIsEditing(false);
      onUpdate();
      fetchOrder();
    } catch (error) {
      console.error('Update error:', error);
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

  if (!orderId) return null;

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
                  <span className="bg-primary text-white px-2 py-0.5 rounded text-xs">#{order.contractCode || orderId.slice(-6).toUpperCase()}</span>
                  Chi tiết đơn hàng
                </h2>
                <div className="flex items-center gap-3 mt-1.5 overflow-hidden">
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100 shrink-0">Trạng thái: {order.status}</p>
                   {order.contractCode && (
                     <p className="text-[10px] text-primary font-bold tracking-widest truncate">Mã đơn: {order.contractCode}</p>
                   )}
                </div>
              </div>
              <div className="flex items-center gap-2">
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
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1.5">
                       <Calendar size={12} /> Hạn giao hàng
                    </label>
                    {isEditing ? (
                      <input 
                        type="date" 
                        className="w-full bg-white border border-border rounded-lg p-2 text-sm font-bold focus:border-primary outline-none"
                        value={editData.deadlineDelivery?.slice(0, 10)}
                        onChange={(e) => setEditData({...editData, deadlineDelivery: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm font-bold text-foreground">
                        {order.deadlineDelivery ? new Date(order.deadlineDelivery).toLocaleDateString('vi-VN') : '---'}
                      </p>
                    )}
                  </div>
                </div>

                 <div className="space-y-4">
                   <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1.5">
                       <FileText size={12} /> Mã Hợp Đồng
                    </label>
                    <p className="text-sm font-bold text-primary italic underline-offset-4 decoration-primary/30">
                      {order.contractCode || '---'}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1.5">
                       <CheckCircle2 size={12} /> Trạng thái
                    </label>
                    <select 
                      className="w-full bg-white border border-border rounded-lg p-2 text-sm font-bold focus:border-primary outline-none"
                      value={editData.status}
                      onChange={(e) => setEditData({...editData, status: e.target.value})}
                    >
                      <option value="new">Mới lên đơn</option>
                      <option value="in_production">Đang sản xuất</option>
                      <option value="packing">Chờ đóng gói</option>
                      <option value="shipping">Đang giao hàng</option>
                      <option value="completed">Hoàn tất</option>
                    </select>
                  </div>
                </div>
              </div>


              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-l-4 border-primary pl-3">Mục sản xuất</h3>
                <div className="space-y-4">
                  {(order.orderItems || []).map((item: any) => {
                    const stats = getItemProgress(item.productId, item.quantity);
                    return (
                      <div key={item.id} className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all divide-y divide-border">
                        {/* Main Item Info */}
                        <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-primary/5 rounded border border-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                 {item.product?.sku?.slice(-4) || '??'}
                              </div>
                              <div>
                                 <h4 className="text-sm font-bold text-foreground">{item.product?.name}</h4>
                                 <div className="flex items-center gap-4 mt-1.5">
                                   <div className="flex flex-col">
                                     <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Tổng đơn</span>
                                     <span className="text-[11px] font-bold text-foreground">{item.quantity}</span>
                                   </div>
                                   <div className="w-px h-6 bg-gray-100" />
                                   <div className="flex flex-col">
                                     <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Đã phân bổ</span>
                                     <span className="text-[11px] font-bold text-green-600">{stats.totalAllocated}</span>
                                   </div>
                                   <div className="w-px h-6 bg-gray-100" />
                                   <div className="flex flex-col">
                                     <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Còn lại</span>
                                     <span className={cn(
                                       "text-[11px] font-bold",
                                       stats.remaining > 0 ? "text-amber-500" : "text-muted-foreground"
                                     )}>{stats.remaining}</span>
                                   </div>
                                   <div className="w-px h-6 bg-gray-100" />
                                   <div className="flex flex-col">
                                     <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Đã xong</span>
                                     <span className="text-[11px] font-bold text-blue-600">{stats.totalDone}</span>
                                   </div>
                                 </div>
                              </div>
                           </div>
                           
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
                        </div>

                        {/* Sub-Production Orders */}
                        <div className="px-5 py-3 bg-gray-50/50">
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
                    );
                  })}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-foreground text-white rounded-lg p-6 shadow-md relative overflow-hidden">
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Giá trị đơn hàng</p>
                    <p className="text-2xl font-bold text-white">{(order.orderItems || []).reduce((acc: any, i: any) => acc + (Number(i.price) * i.quantity), 0).toLocaleString()}đ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Dự kiến lợi nhuận</p>
                    <p className="text-2xl font-bold text-green-400">
                      {(order.orderItems || []).reduce((acc: any, i: any) => acc + ((Number(i.price) - Number(i.cogsAtOrder || 0)) * i.quantity), 0).toLocaleString()}đ
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
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border bg-white shrink-0">
              <div className="flex gap-3">
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg font-bold transition-all uppercase tracking-widest text-[10px]"
                >
                  Đóng
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-bold shadow-sm transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]"
                >
                  <Save size={16} /> Lưu thay đổi
                </button>
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
        orderId={orderId}
        orderItem={activeItemForSplit}
      />
    </div>
  );
}
