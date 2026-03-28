"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Factory, User, Phone, MapPin, Star, Settings, Trash2, Edit3, ChevronRight, LayoutGrid } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FacilitiesManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FacilitiesManagerModal({ isOpen, onClose }: FacilitiesManagerModalProps) {
  const { showToast, showModal } = useNotification();
  const [activeTab, setActiveTab] = useState<'workshops' | 'outsourcers'>('workshops');
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [outsourcers, setOutsourcers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, oRes] = await Promise.all([
        fetch('/api/production/facilities/workshops'),
        fetch('/api/production/facilities/outsourcers')
      ]);
      const [wData, oData] = await Promise.all([wRes.json(), oRes.json()]);
      setWorkshops(Array.isArray(wData) ? wData : []);
      setOutsourcers(Array.isArray(oData) ? oData : []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'workshop' | 'outsourcer', id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cơ sở này?')) return;
    try {
      const res = await fetch(`/api/production/facilities/${type}s?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Đã xóa thành công');
        fetchData();
      }
    } catch (error) {
      showToast('error', 'Lỗi khi xóa');
    }
  };

  const handleUpsert = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());
    
    try {
      const res = await fetch(`/api/production/facilities/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, id: editingItem?.id })
      });
      if (res.ok) {
        showToast('success', 'Đã ghi nhận thành công');
        setIsEditingModalOpen(false);
        setEditingItem(null);
        fetchData();
      }
    } catch (error) {
      showToast('error', 'Lỗi khi lưu dữ liệu');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#F5F5DC] border-neo border-black w-full max-w-4xl h-[90vh] rounded-[32px] 
                    shadow-neo overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header Section */}
        <div className="flex justify-between items-center p-8 border-b-neo border-black bg-neo-mint shrink-0">
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-[0.2em] mb-1">
               <Settings size={14} strokeWidth={3} />
               <span>Danh mục sản xuất</span>
            </nav>
            <h1 className="text-2xl font-black text-black tracking-tight uppercase font-space">
              Quản lý <span className="text-purple-600">Cơ sở sản xuất</span>
            </h1>
          </div>
          <div className="flex gap-4">
             <button 
               onClick={() => { setEditingItem(null); setIsEditingModalOpen(true); }}
               className="btn-primary h-12 flex items-center gap-2 px-6 shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
             >
               <Plus size={18} strokeWidth={3} />
               <span className="text-[10px] font-black uppercase tracking-widest">Thêm mới</span>
             </button>
             <button onClick={onClose} className="w-12 h-12 rounded-xl border-neo border-black bg-white flex items-center justify-center hover:bg-neo-red transition-all">
               <X size={20} strokeWidth={3} />
             </button>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex gap-2 p-6 bg-white border-b-neo border-black shrink-0 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('workshops')}
            className={cn(
               "px-6 py-3 rounded-xl border-neo border-black text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'workshops' ? 'bg-neo-purple shadow-neo-active' : 'bg-white text-black/30 border-black/10'
            )}
          >
            Xưởng Nội Bộ ({workshops.length})
          </button>
          <button 
            onClick={() => setActiveTab('outsourcers')}
            className={cn(
               "px-6 py-3 rounded-xl border-neo border-black text-[10px] font-black uppercase tracking-widest transition-all",
               activeTab === 'outsourcers' ? 'bg-neo-yellow shadow-neo-active' : 'bg-white text-black/30 border-black/10'
            )}
          >
            Cơ sở Gia Công ({outsourcers.length})
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
            {loading ? (
              <div className="col-span-full py-40 flex flex-col items-center gap-4 text-black/20">
                 <LayoutGrid size={48} className="animate-pulse" />
                 <p className="text-[10px] font-black uppercase tracking-[0.4em]">Đồng bộ dữ liệu cơ sở...</p>
              </div>
            ) : (
              (activeTab === 'workshops' ? workshops : outsourcers).map((item) => (
                <div key={item.id} className="neo-card bg-white p-6 relative group overflow-hidden border-2 border-black transition-all hover:shadow-neo">
                  <div className="flex justify-between items-start mb-6">
                    <div className={cn(
                       "p-3 rounded-2xl border-2 border-black shadow-neo-active",
                       activeTab === 'workshops' ? 'bg-neo-mint' : 'bg-neo-yellow'
                    )}>
                      {activeTab === 'workshops' ? <Factory size={22} strokeWidth={2.5} /> : <User size={22} strokeWidth={2.5} />}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingItem(item); setIsEditingModalOpen(true); }} className="p-2 border border-black/10 rounded-lg hover:bg-neo-purple hover:text-black transition-all">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDelete(activeTab === 'workshops' ? 'workshop' : 'outsourcer', item.id)} className="p-2 border border-black/10 rounded-lg hover:bg-neo-red hover:text-black transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black mb-1 line-clamp-1 italic tracking-tight uppercase">{item.name}</h3>
                  {activeTab === 'workshops' ? (
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-black/40 bg-black/5 p-2 rounded-lg">
                        <MapPin size={14} /> {item.location || 'Chưa xác định vị trí'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-purple-600 bg-neo-purple/10 border border-neo-purple/20 p-2 rounded-lg uppercase tracking-wider">
                        <Settings size={14} /> Quản lý: {item.managerName || 'Chưa gán'}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-black/40 bg-black/5 p-2 rounded-lg">
                        <Phone size={14} /> {item.phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-tight text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 italic">
                        Chuyên môn: {item.specialization || 'Gia công chung'}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= (item.rating || 5) ? 'fill-neo-yellow text-black' : 'text-gray-200'} />)}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {!loading && (activeTab === 'workshops' ? workshops : outsourcers).length === 0 && (
              <div className="col-span-full py-20 text-center neo-card bg-white border-dashed border-black/10">
                <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.3em] font-space italic">⚡ Chưa có dữ liệu cơ sở thực hiện nào được khởi tạo</p>
              </div>
            )}
          </div>
        </div>

        {/* Nestable Edit Modal */}
        {isEditingModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsEditingModalOpen(false)} />
            <div className="relative bg-white border-neo border-black rounded-[32px] w-full max-w-md shadow-neo p-8 animate-in zoom-in-95 duration-300">
              <h3 className="text-xl font-black uppercase mb-8 italic tracking-tighter">⚡ {editingItem ? 'Hiệu chỉnh' : 'Khai báo'} {activeTab === 'workshops' ? 'Xưởng' : 'Cơ sở'}</h3>
              
              <form onSubmit={handleUpsert} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/30">Danh xưng / Tên phụ trách</label>
                  <input name="name" defaultValue={editingItem?.name} required className="form-input bg-slate-50 border-black rounded-xl font-bold" placeholder={activeTab === 'workshops' ? 'Ví dụ: Xưởng A' : 'Ví dụ: Anh Hùng'} />
                </div>

                {activeTab === 'workshops' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/30">Vị trí thực hiện</label>
                    <input name="location" defaultValue={editingItem?.location} className="form-input bg-slate-50 border-black rounded-xl font-bold" placeholder="Ví dụ: Tầng 1 - Khu In" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black/30">Kết nối liên lạc</label>
                      <input name="phone" defaultValue={editingItem?.phone} className="form-input bg-slate-50 border-black rounded-xl font-bold" placeholder="Số điện thoại cá nhân" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black/30">Nghiệp vụ chính</label>
                      <input name="specialization" defaultValue={editingItem?.specialization} className="form-input bg-slate-50 border-black rounded-xl font-bold" placeholder="Ví dụ: Dán tay thủ công" />
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsEditingModalOpen(false)} className="flex-1 py-4 bg-white border-neo border-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-neo-active">Hủy</button>
                  <button type="submit" className="flex-1 py-4 bg-primary border-neo border-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] transition-all">Xác nhận</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
