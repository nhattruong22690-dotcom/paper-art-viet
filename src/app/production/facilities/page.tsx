"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Factory, User, Phone, MapPin, Star, Settings, Trash2, Edit3, ChevronRight, LayoutGrid } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export default function FacilitiesPage() {
  const { showToast, showModal } = useNotification();
  const [activeTab, setActiveTab] = useState<'workshops' | 'outsourcers'>('workshops');
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [outsourcers, setOutsourcers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, oRes] = await Promise.all([
        fetch('/api/production/facilities/workshops'),
        fetch('/api/production/facilities/outsourcers')
      ]);
      const [wData, oData] = await Promise.all([wRes.json(), oRes.json()]);
      setWorkshops(wData);
      setOutsourcers(oData);
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
        setIsModalOpen(false);
        setEditingItem(null);
        fetchData();
      }
    } catch (error) {
      showToast('error', 'Lỗi khi lưu dữ liệu');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 neo-card !p-8 bg-neo-mint shadow-neo">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">
            <LayoutGrid size={14} strokeWidth={3} />
            <span>Sản xuất</span>
            <ChevronRight size={12} strokeWidth={3} />
            <span className="text-purple-600 bg-white px-2 py-0.5 rounded-lg border border-black/10">Quản lý cơ sở</span>
          </nav>
          <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase font-space">
            Cơ sở <span className="text-purple-500">Thực hiện</span>
          </h1>
        </div>
        
        <button 
          onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
          className="btn-primary gap-3 shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          <Plus size={22} strokeWidth={3} />
          <span className="font-space uppercase tracking-widest text-xs">Thêm cơ sở mới</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4">
        <button 
          onClick={() => setActiveTab('workshops')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-neo ${activeTab === 'workshops' ? 'bg-neo-purple text-black shadow-neo' : 'bg-white text-gray-400 border-black/10'}`}
        >
          Xưởng nội bộ ({workshops.length})
        </button>
        <button 
          onClick={() => setActiveTab('outsourcers')}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border-neo ${activeTab === 'outsourcers' ? 'bg-neo-yellow text-black shadow-neo' : 'bg-white text-gray-400 border-black/10'}`}
        >
          Cơ sở gia công ({outsourcers.length})
        </button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center items-center text-xs font-bold uppercase tracking-[0.3em] text-gray-400 animate-pulse">Đang đồng bộ dữ liệu...</div>
        ) : (
          (activeTab === 'workshops' ? workshops : outsourcers).map((item) => (
            <div key={item.id} className="neo-card bg-white p-6 relative group overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl border-2 border-black shadow-neo-active ${activeTab === 'workshops' ? 'bg-neo-mint' : 'bg-neo-yellow'}`}>
                  {activeTab === 'workshops' ? <Factory size={24} strokeWidth={2.5} /> : <User size={24} strokeWidth={2.5} />}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 bg-slate-50 border border-black/10 rounded-lg hover:bg-neo-purple hover:text-black transition-all">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(activeTab === 'workshops' ? 'workshop' : 'outsourcer', item.id)} className="p-2 bg-slate-50 border border-black/10 rounded-lg hover:bg-neo-red hover:text-black transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-xl font-black mb-1 line-clamp-1">{item.name}</h3>
              {activeTab === 'workshops' ? (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-slate-50 p-2 rounded-lg">
                    <MapPin size={14} /> {item.location || 'Chưa xác định vị trí'}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-600 bg-purple-50 p-2 rounded-lg">
                    <Settings size={14} /> Quản lý: {item.managerName || 'Chưa gán'}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 bg-slate-50 p-2 rounded-lg">
                    <Phone size={14} /> {item.phone || 'N/A'}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    Chuyên môn: {item.specialization || 'Gia công chung'}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= (item.rating || 5) ? 'fill-neo-yellow text-black' : 'text-gray-200'} />)}
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        {!loading && (activeTab === 'workshops' ? workshops : outsourcers).length === 0 && (
          <div className="col-span-full py-20 text-center neo-card bg-slate-50 border-dashed">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">Chưa có dữ liệu cơ sở thực hiện nào</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white border-neo border-black rounded-[32px] w-full max-w-md shadow-neo p-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-black uppercase mb-8 italic">⚡ {editingItem ? 'Cập nhật' : 'Thêm mới'} {activeTab === 'workshops' ? 'Xưởng' : 'Cơ sở'}</h3>
            
            <form onSubmit={handleUpsert} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tên gọi / Tên người phụ trách</label>
                <input name="name" defaultValue={editingItem?.name} required className="form-input" placeholder={activeTab === 'workshops' ? 'Ví dụ: Xưởng A' : 'Ví dụ: Anh Hùng'} />
              </div>

              {activeTab === 'workshops' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vị trí / Khu vực</label>
                    <input name="location" defaultValue={editingItem?.location} className="form-input" placeholder="Ví dụ: Tầng 1 - Khu In" />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Số điện thoại</label>
                    <input name="phone" defaultValue={editingItem?.phone} className="form-input" placeholder="Nhập SĐT liên hệ" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Chuyên môn chính</label>
                    <input name="specialization" defaultValue={editingItem?.specialization} className="form-input" placeholder="Ví dụ: Dán tay thủ công" />
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-50 border-neo border-black rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Hủy</button>
                <button type="submit" className="flex-1 py-4 bg-primary border-neo border-black rounded-xl text-xs font-black uppercase tracking-widest shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] transition-all">Lưu lại</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
