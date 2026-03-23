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

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const data = await res.json();
      setOrder(data);
      setEditData(data);
    } catch (error) {
      console.error('Fetch error:', error);
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
        ) : order && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                  <span className="bg-primary-600 text-white px-3 py-1 rounded-xl text-sm">#{order.id.slice(-6).toUpperCase()}</span>
                  Chi tiết đơn hàng
                </h2>
                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-1">Order Status: {order.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleDelete} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                  <Trash2 size={20} />
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                      <User size={12} /> Khách hàng
                    </label>
                    <p className="text-sm font-bold text-gray-800 uppercase">{order.customer?.name || 'Vãng lai'}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                       <Calendar size={12} /> Hạn giao hàng
                    </label>
                    {isEditing ? (
                      <input 
                        type="date" 
                        className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-sm font-bold"
                        value={editData.deadlineDelivery?.slice(0, 10)}
                        onChange={(e) => setEditData({...editData, deadlineDelivery: e.target.value})}
                      />
                    ) : (
                      <p className="text-sm font-bold text-gray-800">{new Date(order.deadlineDelivery).toLocaleDateString('vi-VN')}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                   <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                       <FileText size={12} /> Nhân viên phụ trách
                    </label>
                    <p className="text-sm font-bold text-gray-800">Admin Team</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                       <CheckCircle2 size={12} /> Trạng thái
                    </label>
                    <select 
                      className="w-full bg-gray-50 border-gray-100 rounded-xl p-3 text-sm font-bold uppercase"
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


              <div className="space-y-6">
                <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-l-4 border-primary-500 pl-3">Danh sách sản phẩm cần sản xuất</h3>
                <div className="space-y-6">
                  {order.orderItems.map((item: any) => {
                    const stats = getItemProgress(item.productId, item.quantity);
                    return (
                      <div key={item.id} className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-sm hover:shadow-md transition-all divide-y divide-gray-50">
                        {/* Main Item Info */}
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600 border border-primary-100 font-black text-sm">
                                 {item.product?.sku?.slice(-4) || '??'}
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{item.product?.name}</h4>
                                 <div className="flex items-center gap-4 mt-1.5">
                                   <div className="flex flex-col">
                                     <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Tổng đơn</span>
                                     <span className="text-xs font-black text-gray-900">{item.quantity}</span>
                                   </div>
                                   <div className="w-px h-6 bg-gray-100" />
                                   <div className="flex flex-col">
                                     <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Đã phân bổ</span>
                                     <span className="text-xs font-black text-emerald-600">{stats.totalAllocated}</span>
                                   </div>
                                   <div className="w-px h-6 bg-gray-100" />
                                   <div className="flex flex-col">
                                     <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Còn lại</span>
                                     <span className={cn(
                                       "text-xs font-bold",
                                       stats.remaining > 0 ? "text-amber-500" : "text-gray-400"
                                     )}>{stats.remaining}</span>
                                   </div>
                                 </div>
                              </div>
                           </div>
                           
                           <div className="flex items-center gap-4">
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tiến độ hoàn thành</p>
                                 <p className="text-sm font-black text-primary-600">{stats.percent}%</p>
                              </div>
                              <button 
                                onClick={() => {
                                  setActiveItemForSplit(item);
                                  setIsSplitModalOpen(true);
                                }}
                                className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 transition-all shadow-lg active:scale-95"
                              >
                                <Zap size={14} className="text-amber-400" /> Phân bổ Sản xuất
                              </button>
                           </div>
                        </div>

                        {/* Sub-Production Orders */}
                        <div className="px-6 py-4 bg-gray-50/30">
                           {stats.pos.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               {stats.pos.map((po: any) => (
                                 <div key={po.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${
                                         po.allocationType === 'internal' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                       }`}>
                                          {po.allocationType === 'internal' ? 'X' : 'GC'}
                                       </div>
                                       <div>
                                          <p className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5 uppercase">
                                            {po.assignedTo || po.outsourcedName || 'Chưa gán'}
                                          </p>
                                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">
                                            {po.quantityCompleted || 0} / {po.quantityTarget} completed
                                          </p>
                                       </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                       <span className={`text-[10px] font-black uppercase tracking-tight ${
                                         po.currentStatus === 'completed' ? 'text-emerald-500' : 'text-primary-600'
                                       }`}>
                                         {Math.round((po.quantityCompleted / po.quantityTarget) * 100)}%
                                       </span>
                                       <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                          <div 
                                            className={`h-full ${po.currentStatus === 'completed' ? 'bg-emerald-500' : 'bg-primary-500'}`}
                                            style={{ width: `${Math.min(100, (po.quantityCompleted / po.quantityTarget) * 100)}%` }}
                                          />
                                       </div>
                                    </div>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <div className="text-center py-4">
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest italic opacity-50">Sản phẩm này chưa được phân bổ sản xuất</p>
                             </div>
                           )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gray-900 text-white rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 blur-3xl rounded-full" />
                <div className="grid grid-cols-2 gap-8 relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Tổng giá trị Deal</p>
                    <p className="text-2xl font-black text-white">{order.orderItems.reduce((acc: any, i: any) => acc + (Number(i.price) * i.quantity), 0).toLocaleString()}đ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Ước tính lợi nhuận</p>
                    <p className="text-2xl font-black text-emerald-400">
                      VND {order.orderItems.reduce((acc: any, i: any) => acc + ((Number(i.price) - Number(i.cogsAtOrder || 0)) * i.quantity), 0).toLocaleString()}
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
            <div className="px-8 py-6 border-t border-gray-100 bg-white">
              <div className="flex gap-4">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black transition-all uppercase tracking-widest text-xs"
                >
                  Đóng lại
                </button>
                <button 
                  onClick={handleSave}
                  className="flex-1 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black shadow-lg shadow-primary-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  <Save size={18} /> Lưu thay đổi
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
        orderId={order.id}
        orderItem={activeItemForSplit}
      />
    </div>
  );
}
