"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, AlertCircle, Factory, User, Package } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SplitAllocation {
  id: string;
  facilityId: string;
  type: 'internal' | 'outsourced';
  quantity: number;
  deadline: string;
  // Metadata for existing POs
  isExisting?: boolean;
  dbId?: string;
  quantityCompleted?: number;
  status?: string;
  hasStarted?: boolean;
}

interface SplitProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  orderId: string;
  orderItem: any;
}

export default function SplitProductionModal({ isOpen, onClose, onSuccess, orderId, orderItem }: SplitProductionModalProps) {
  const { showToast, showModal, confirm } = useNotification();
  const [internalAllocations, setInternalAllocations] = useState<SplitAllocation[]>([]);
  const [outsourcedAllocations, setOutsourcedAllocations] = useState<SplitAllocation[]>([]);
  const orderDeadline = orderItem?.order?.deadlineDelivery || orderItem?.deadlineDelivery || '';
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [outsourcers, setOutsourcers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialData, setInitialData] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchFacilities();
    }
  }, [isOpen]);

  const fetchFacilities = async () => {
    try {
      const [wRes, oRes] = await Promise.all([
        fetch('/api/production/facilities/workshops'),
        fetch('/api/production/facilities/outsourcers')
      ]);
      setWorkshops(await wRes.json());
      setOutsourcers(await oRes.json());
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  useEffect(() => {
    if (isOpen && orderItem) {
      // Load existing POs from order item
      const existingPOs = orderItem.productionOrders || [];
      console.log('SplitProductionModal: loading existing POs', existingPOs);
      
      const internals = existingPOs
        .filter((po: any) => (po.allocationType || po.allocation_type) === 'internal')
        .map((po: any) => ({
          id: po.id, // Current UI ID
          dbId: po.id, // Database ID
          facilityId: po.workshop_id || po.outsourcer_id || po.workshopId || po.outsourcerId || po.assignedTo || po.assigned_to || '',
          type: 'internal' as const,
          quantity: po.quantityTarget || po.quantity_target || 0,
          quantityCompleted: po.quantityCompleted || po.quantity_completed || 0,
          deadline: (po.deadlineProduction || po.deadline_production || orderDeadline)?.slice(0, 10) || '',
          hasStarted: (po.quantityCompleted || po.quantity_completed || 0) > 0 || (po.workLogs?.length > 0),
          isExisting: true
        }));

      const externals = existingPOs
        .filter((po: any) => (po.allocationType || po.allocation_type) === 'outsourced')
        .map((po: any) => ({
          id: po.id,
          dbId: po.id,
          facilityId: po.workshop_id || po.outsourcer_id || po.workshopId || po.outsourcerId || po.assignedTo || po.assigned_to || '',
          type: 'outsourced' as const,
          quantity: po.quantityTarget || po.quantity_target || 0,
          quantityCompleted: po.quantityCompleted || po.quantity_completed || 0,
          deadline: (po.deadlineProduction || po.deadline_production || orderDeadline)?.slice(0, 10) || '',
          hasStarted: (po.quantityCompleted || po.quantity_completed || 0) > 0 || (po.workLogs?.length > 0),
          isExisting: true
        }));

      console.log('Processed allocations:', { internals, externals });
      setInternalAllocations(internals);
      setOutsourcedAllocations(externals);
      setInitialData(JSON.stringify({ i: internals, e: externals }));
    }
  }, [isOpen, orderItem, orderDeadline]);

  const hasChanges = JSON.stringify({ i: internalAllocations, e: outsourcedAllocations }) !== initialData;

  const handleClose = async () => {
    if (hasChanges) {
      const confirmed = await confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng cửa sổ này không?');
      if (!confirmed) return;
    }
    onClose();
  };

  const addRow = (type: 'internal' | 'outsourced') => {
    const newRow: SplitAllocation = {
      id: Math.random().toString(36).substr(2, 9),
      facilityId: '',
      type,
      quantity: 0,
      deadline: orderDeadline?.slice(0, 10) || '',
      isExisting: false
    };
    if (type === 'internal') setInternalAllocations([...internalAllocations, newRow]);
    else setOutsourcedAllocations([...outsourcedAllocations, newRow]);
  };

  const removeRow = async (type: 'internal' | 'outsourced', id: string) => {
    const list = type === 'internal' ? internalAllocations : outsourcedAllocations;
    const item = list.find(a => a.id === id);

    if (item?.isExisting) {
      if (item.hasStarted) {
        showModal('error', 'Không thể xóa', 'Lệnh sản xuất này đã có sản lượng thực tế. Vui lòng không thay đổi.');
        return;
      }

      const confirmed = await confirm('Xác nhận xóa lệnh? Dữ liệu lệnh sản xuất này sẽ bị xóa vĩnh viễn khỏi hệ thống khi bạn nhấn "Xác nhận Phân bổ".');
      if (!confirmed) return;
    }

    if (type === 'internal') {
      setInternalAllocations(internalAllocations.filter(a => a.id !== id));
    } else {
      setOutsourcedAllocations(outsourcedAllocations.filter(a => a.id !== id));
    }
  };

  const updateRow = (type: 'internal' | 'outsourced', id: string, field: keyof SplitAllocation, value: any) => {
    const list = type === 'internal' ? internalAllocations : outsourcedAllocations;
    const item = list.find(a => a.id === id);
    if (item?.hasStarted && field !== 'facilityId') return; // Allow facility selection even if started

    if (type === 'internal') {
      setInternalAllocations(internalAllocations.map(a => a.id === id ? { ...a, [field]: value } : a));
    } else {
      setOutsourcedAllocations(outsourcedAllocations.map(a => a.id === id ? { ...a, [field]: value } : a));
    }
  };

  const totalAllocated = [...internalAllocations, ...outsourcedAllocations].reduce((sum, a) => sum + Number(a.quantity || 0), 0);
  // Cho phép totalAllocated === 0 để xóa sạch phân bổ nếu cần
  const isValid = [...internalAllocations, ...outsourcedAllocations].every(a => 
    !a.facilityId || Number(a.quantity) >= 0
  ) && [...internalAllocations, ...outsourcedAllocations].every(a => 
    Number(a.quantity) > 0 ? !!a.facilityId : true
  );

  const handleSubmit = async () => {
    if (!isValid) return;
    
    // Yêu cầu xác nhận nếu xóa hết sạch phân bổ
    if (totalAllocated === 0) {
      const confirmed = await confirm('Bạn đang để trống phân bổ. Toàn bộ lệnh sản xuất của sản phẩm này sẽ bị XÓA KHỎI hệ thống. Bạn có chắc chắn?');
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/production/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          productId: orderItem.productId,
          orderItemId: orderItem.id,
          allocations: [...internalAllocations, ...outsourcedAllocations]
            .filter(a => Number(a.quantity) > 0)
            .map(a => ({
              id: a.dbId,
              assignedTo: a.facilityId,
              type: a.type,
              quantity: Number(a.quantity),
              deadline: a.deadline,
              quantityCompleted: a.quantityCompleted
            }))
        })
      });

      if (res.ok) {
        showToast('success', 'Đã cập nhật phân bổ thành công');
        // Reset dirty state so modal can close cleanly
        const current = JSON.stringify({ i: internalAllocations, e: outsourcedAllocations });
        setInitialData(current);
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Lỗi khi lưu');
      }
    } catch (error) {
      showModal('error', 'Lỗi phân bổ', String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={handleClose} />
      
      <div className="relative bg-white border-neo border-black w-full max-w-5xl h-[92vh] rounded-[32px] 
                    shadow-neo overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header - Spacious Info */}
        <div className="px-10 py-8 border-b-neo border-black bg-neo-mint">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-neo">
                <Factory size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">⚡ Phân bổ Sản xuất Chi tiết</h3>
                <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-1">Quản lý lệnh và khối lượng công việc cho từng xưởng/đối tác</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-3 hover:bg-black/5 rounded-full transition-colors order-last">
              <X size={28} strokeWidth={3} />
            </button>
          </div>
          
          <div className="flex flex-wrap gap-6 items-center">
            <div className="bg-white/80 px-6 py-3 rounded-2xl flex items-center gap-4 border-2 border-black/10 shadow-sm">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                <Package size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Sản phẩm yêu cầu</p>
                <p className="text-base font-black text-foreground">{orderItem?.product?.name}</p>
                <p className="text-[11px] font-bold text-muted-foreground opacity-60">Mã: {orderItem?.product?.sku || orderItem?.product?.code}</p>
              </div>
            </div>
            
            <div className="bg-white/80 px-6 py-3 rounded-2xl flex items-center gap-4 border-2 border-black/10 shadow-sm">
              <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-black text-base">SL</div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Tổng Số lượng</p>
                <p className="text-2xl font-black text-foreground leading-none">{orderItem?.quantity} <span className="text-xs uppercase ml-1 opacity-40">Items</span></p>
              </div>
            </div>

            <div className="bg-amber-100/50 px-6 py-3 rounded-2xl flex items-center gap-4 border-2 border-amber-200/50 hidden md:flex">
               <AlertCircle size={20} className="text-amber-600" />
               <p className="text-[10px] font-bold text-amber-800 uppercase leading-tight max-w-[200px]">
                 Chỉ cho phép sửa/xóa các lệnh chưa bắt đầu sản xuất thực tế.
               </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-12">
          
          {/* Section: Internal Workshops */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 border-l-6 border-emerald-500 pl-4 py-1">
                <Factory size={22} className="text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">Xưởng sản xuất nội bộ</h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-600/60 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                {internalAllocations.length} xưởng nội bộ
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_120px_140px_100px_40px] gap-4 px-4 pb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-2">
                <div>Đơn vị tiếp nhận</div>
                <div className="text-center">Số lượng</div>
                <div className="text-center">Hạn sản xuất</div>
                <div className="text-center">Tiến độ</div>
                <div></div>
              </div>
              
              {internalAllocations.map((alloc) => (
                <div key={alloc.id} className={cn(
                  "grid grid-cols-[1fr_120px_140px_100px_40px] gap-4 items-center group p-2 rounded-2xl transition-all",
                  alloc.hasStarted ? "bg-gray-50/50 opacity-80" : "hover:bg-slate-50/50"
                )}>
                  <select 
                    value={alloc.facilityId}
                    onChange={(e) => updateRow('internal', alloc.id, 'facilityId', e.target.value)}
                    className={cn(
                      "w-full bg-white border-2 border-black/5 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition-all outline-none focus:border-black/20",
                      alloc.hasStarted && "cursor-not-allowed bg-transparent border-transparent"
                    )}
                  >
                    <option value="">-- Chọn xưởng sản xuất --</option>
                    {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  
                  <input 
                    type="number"
                    disabled={alloc.hasStarted}
                    value={alloc.quantity || ''}
                    onChange={(e) => updateRow('internal', alloc.id, 'quantity', parseInt(e.target.value) || 0)}
                    className={cn(
                      "w-full bg-white border-2 border-black/5 rounded-xl px-4 py-3 text-sm font-black text-center shadow-sm transition-all outline-none focus:border-black/20",
                      alloc.hasStarted && "cursor-not-allowed bg-transparent border-transparent"
                    )}
                    placeholder="S.Lượng"
                  />
                  
                  <input 
                    type="date"
                    disabled={alloc.hasStarted}
                    value={alloc.deadline}
                    onChange={(e) => updateRow('internal', alloc.id, 'deadline', e.target.value)}
                    className={cn(
                      "w-full bg-white border-2 border-black/5 rounded-xl px-4 py-3 text-[11px] font-black text-center shadow-sm transition-all outline-none focus:border-black/20",
                      alloc.hasStarted && "cursor-not-allowed bg-transparent border-transparent"
                    )}
                  />

                  <div className="flex flex-col items-center">
                    {alloc.isExisting ? (
                      <>
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                          alloc.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {alloc.status === 'completed' ? 'Xong' : 'Chạy'}
                        </span>
                        <div className="mt-1 w-full max-w-[60px] h-1 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${Math.min(100, (alloc.quantityCompleted! / alloc.quantity) * 100)}%` }} />
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 mt-0.5 italic">{alloc.quantityCompleted}/{alloc.quantity}</span>
                      </>
                    ) : (
                      <span className="text-[9px] font-black text-emerald-600 uppercase italic">Mới</span>
                    )}
                  </div>

                  <button 
                    onClick={() => removeRow('internal', alloc.id)} 
                    disabled={alloc.hasStarted}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      alloc.hasStarted ? "opacity-10 text-gray-300 cursor-not-allowed" : "text-gray-300 hover:text-rose-500 hover:bg-rose-50"
                    )}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => addRow('internal')}
                className="w-full py-4 border-2 border-dashed border-emerald-200 rounded-2xl text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:bg-emerald-50 hover:border-emerald-300 transition-all flex items-center justify-center gap-3"
              >
                <Plus size={16} strokeWidth={3} /> Thêm xưởng nội bộ dự kiến
              </button>
            </div>
          </section>

          {/* Section: Outsourcing Partners */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 border-l-6 border-amber-500 pl-4 py-1">
                <User size={22} className="text-amber-600" />
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Cơ sở gia công (Thợ ngoài)</h4>
              </div>
              <span className="text-[10px] font-bold text-amber-600/60 uppercase bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                {outsourcedAllocations.length} đối tác gia công
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_120px_140px_100px_40px] gap-4 px-4 pb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 mb-2">
                <div>Đơn vị/Thợ gia công</div>
                <div className="text-center">Số lượng</div>
                <div className="text-center">Hạn bàn giao</div>
                <div className="text-center">Tiến độ</div>
                <div></div>
              </div>

              {outsourcedAllocations.map((alloc) => (
                <div key={alloc.id} className={cn(
                  "grid grid-cols-[1fr_120px_140px_100px_40px] gap-4 items-center group p-2 rounded-2xl transition-all",
                  alloc.hasStarted ? "bg-gray-50/50 opacity-80" : "hover:bg-slate-50/50"
                )}>
                  <select 
                    value={alloc.facilityId}
                    onChange={(e) => updateRow('outsourced', alloc.id, 'facilityId', e.target.value)}
                    className={cn(
                      "w-full bg-white border-2 border-black/5 rounded-xl px-5 py-3 text-sm font-bold shadow-sm transition-all outline-none focus:border-black/20",
                      alloc.hasStarted && "cursor-not-allowed bg-transparent border-transparent"
                    )}
                  >
                    <option value="">-- Chọn tên thợ/đối tác gia công --</option>
                    {outsourcers.map(o => <option key={o.id} value={o.id}>{o.name} ({o.specialization || 'Gia công'})</option>)}
                  </select>
                  
                  <input 
                    type="number"
                    disabled={alloc.hasStarted}
                    value={alloc.quantity || ''}
                    onChange={(e) => updateRow('outsourced', alloc.id, 'quantity', parseInt(e.target.value) || 0)}
                    className={cn(
                      "w-full bg-white border-2 border-black/5 rounded-xl px-4 py-3 text-sm font-black text-center shadow-sm transition-all outline-none focus:border-black/20",
                      alloc.hasStarted && "cursor-not-allowed bg-transparent border-transparent"
                    )}
                    placeholder="S.Lượng"
                  />
                  
                  <input 
                    type="date"
                    disabled={alloc.hasStarted}
                    value={alloc.deadline}
                    onChange={(e) => updateRow('outsourced', alloc.id, 'deadline', e.target.value)}
                    className={cn(
                      "w-full bg-white border-2 border-black/5 rounded-xl px-4 py-3 text-[11px] font-black text-center shadow-sm transition-all outline-none focus:border-black/20",
                      alloc.hasStarted && "cursor-not-allowed bg-transparent border-transparent"
                    )}
                  />

                  <div className="flex flex-col items-center">
                    {alloc.isExisting ? (
                      <>
                        <span className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter",
                          alloc.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {alloc.status === 'completed' ? 'Xong' : 'Chạy'}
                        </span>
                        <div className="mt-1 w-full max-w-[60px] h-1 bg-gray-100 rounded-full overflow-hidden">
                           <div className="h-full bg-primary" style={{ width: `${Math.min(100, (alloc.quantityCompleted! / alloc.quantity) * 100)}%` }} />
                        </div>
                        <span className="text-[8px] font-bold text-gray-400 mt-0.5 italic">{alloc.quantityCompleted}/{alloc.quantity}</span>
                      </>
                    ) : (
                      <span className="text-[9px] font-black text-amber-600 uppercase italic">Mới</span>
                    )}
                  </div>

                  <button 
                    onClick={() => removeRow('outsourced', alloc.id)} 
                    disabled={alloc.hasStarted}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      alloc.hasStarted ? "opacity-10 text-gray-300 cursor-not-allowed" : "text-gray-300 hover:text-rose-500 hover:bg-rose-50"
                    )}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => addRow('outsourced')}
                className="w-full py-4 border-2 border-dashed border-amber-200 rounded-2xl text-[10px] font-black text-amber-600 uppercase tracking-widest hover:bg-amber-50 hover:border-amber-300 transition-all flex items-center justify-center gap-3"
              >
                <Plus size={16} strokeWidth={3} /> Thêm thợ gia công mới
              </button>
            </div>
          </section>

        </div>

        {/* Footer Summary - Premium Stats */}
        <div className="p-10 bg-neo-mint/20 border-t-neo border-black flex flex-col gap-8">
          <div className="flex items-center justify-between px-6 py-5 bg-black rounded-3xl border-2 border-black shadow-neo">
              <div className="flex items-center gap-6 text-white">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors",
                  totalAllocated > orderItem?.quantity ? 'bg-red-500 border-red-400 shadow-lg shadow-red-500/20' : 
                  totalAllocated === orderItem?.quantity ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/20' : 
                  'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/20'
                )}>
                   {totalAllocated > orderItem?.quantity ? <AlertCircle size={30} strokeWidth={3} /> : <Check size={30} strokeWidth={3} />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Cân bằng phân bổ sản xuất</p>
                  <p className="text-3xl font-black tabular-nums tracking-tighter">
                    {totalAllocated} <span className="text-sm font-bold text-white/30 uppercase">/ {orderItem?.quantity} SP</span>
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                {totalAllocated > orderItem?.quantity ? (
                  <div className="flex flex-col items-end">
                    <span className="text-red-400 font-black text-xs uppercase animate-pulse mb-1">Vượt định mức sản xuất!</span>
                    <p className="text-[10px] font-bold text-white/30 max-w-[150px] leading-tight">Bạn đang phân bổ dư số lượng so với đơn hàng (Dự phòng sản xuất).</p>
                  </div>
                ) : totalAllocated < orderItem?.quantity ? (
                  <div className="flex flex-col items-end">
                    <span className="text-blue-400 font-black text-xs uppercase mb-1">Chưa phân bổ hết</span>
                    <p className="text-[10px] font-bold text-white/30">Cần {orderItem?.quantity - totalAllocated} sản phẩm nữa.</p>
                  </div>
                ) : (
                  <span className="text-emerald-400 font-black text-xs uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">Khớp dữ liệu</span>
                )}
              </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button 
              type="button"
              onClick={handleClose}
              className="py-5 bg-white border-neo border-black text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <X size={20} strokeWidth={3} /> Đóng cửa sổ
            </button>
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || !hasChanges || isSubmitting}
              className={cn(
                "py-5 border-neo border-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-neo transition-all flex items-center justify-center gap-3",
                isValid && hasChanges && !isSubmitting ? "bg-neo-purple text-black hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-active active:translate-y-1" : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
              )}
            >
              {isSubmitting ? <span className="w-6 h-6 border-4 border-black/10 border-t-black rounded-full animate-spin" /> : 
              <><Check size={24} strokeWidth={3} /> Xác nhận Phân bổ</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

