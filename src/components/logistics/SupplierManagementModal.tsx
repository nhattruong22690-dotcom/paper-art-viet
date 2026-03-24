"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Tag, 
  Trash2, 
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getSuppliers, upsertSupplier, deleteSupplier } from '@/services/supplier.service';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Supplier {
  id: string;
  name: string;
  taxId?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  mainMaterialType?: string;
  active: boolean;
  updated_at?: string;
}

export default function SupplierManagementModal({ onClose }: { onClose: () => void }) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Supplier>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers({ search });
      setSuppliers(data as any);
      if (data.length > 0 && !selectedSupplier) {
        setSelectedSupplier(data[0] as any);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSelect = (s: Supplier) => {
    setSelectedSupplier(s);
    setIsEditing(false);
    setFormData(s);
    setMessage(null);
  };

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setIsEditing(true);
    setFormData({
      name: '',
      taxId: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      mainMaterialType: '',
      active: true
    });
  };

  const handleSave = async () => {
    if (!formData.name) {
      setMessage({ type: 'error', text: 'Tên công ty là bắt buộc' });
      return;
    }

    try {
      const result = await upsertSupplier(formData);
      setMessage({ type: 'success', text: 'Đã lưu thông tin nhà cung cấp' });
      loadData();
      setIsEditing(false);
      setSelectedSupplier(result as any);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi lưu dữ liệu' });
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier) return;
    if (!confirm(`Bạn có chắc muốn xóa hoặc ngừng hoạt động ${selectedSupplier.name}?`)) return;

    try {
      const result = await deleteSupplier(selectedSupplier.id);
      setMessage({ type: 'success', text: result.message });
      loadData();
      setSelectedSupplier(null);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi thực hiện' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-[90%] max-w-6xl h-[85vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative border border-gray-100">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase italic">Quản lý <span className="text-indigo-600">Nhà cung cấp</span></h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Danh mục đối tác cung ứng vật tư</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-gray-400 hover:text-rose-500 transition-all shadow-sm">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: LIST */}
          <div className="w-1/3 border-r border-gray-50 flex flex-col bg-white">
            <div className="p-6 space-y-4">
              <div className="relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Tìm Tên hoặc SĐT..." 
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 transition-all uppercase tracking-tight"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button 
                onClick={handleAddNew}
                className="w-full py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-900 transition-all shadow-lg shadow-indigo-100"
              >
                <Plus size={16} /> Thêm NCC Mới
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-2">
              {loading ? (
                <div className="py-20 text-center text-gray-300 text-[10px] font-bold uppercase tracking-widest animate-pulse">Đang tải...</div>
              ) : suppliers.length === 0 ? (
                <div className="py-20 text-center text-gray-300 text-[10px] font-bold uppercase tracking-widest italic">Không có dữ liệu</div>
              ) : suppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className={cn(
                    "w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between group",
                    selectedSupplier?.id === s.id 
                      ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" 
                      : "bg-white hover:bg-gray-50 border border-transparent hover:border-gray-100"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className={cn(
                      "text-xs font-black uppercase truncate",
                      selectedSupplier?.id === s.id ? "text-white" : "text-gray-900"
                    )}>{s.name}</p>
                    <p className={cn(
                      "text-[10px] font-bold mt-1",
                      selectedSupplier?.id === s.id ? "text-indigo-100" : "text-gray-400"
                    )}>{s.phone || 'Chưa có SĐT'}</p>
                  </div>
                  {!s.active && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[8px] font-black uppercase tracking-tighter shrink-0">Ngừng</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT: DETAILS / FORM */}
          <div className="flex-1 overflow-y-auto bg-gray-50/30 p-10 relative">
            {message && (
              <div className={cn(
                "absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 z-50",
                message.type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}>
                {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span className="text-[11px] font-black uppercase tracking-widest">{message.text}</span>
              </div>
            )}

            {selectedSupplier || isEditing ? (
              <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-4 text-gray-900">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase italic tracking-tight">{isEditing ? 'Đang tạo NCC mới' : 'Chi tiết Nhà cung cấp'}</h3>
                      {!isEditing && <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Cập nhật lần cuối: {new Date(selectedSupplier?.updated_at || Date.now()).toLocaleDateString('vi-VN')}</p>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {!isEditing && (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="px-5 py-2.5 bg-white border border-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                      >
                        Chỉnh sửa
                      </button>
                    )}
                    <button 
                      onClick={handleDelete}
                      className="p-2.5 bg-white border border-gray-100 text-rose-400 rounded-xl hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[40px] border border-gray-100 shadow-xl shadow-gray-100/30 grid grid-cols-2 gap-8">
                   {/* Tên */}
                   <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Tên Công Ty <span className="text-rose-500">*</span></label>
                      <input 
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 disabled:opacity-50 uppercase italic tracking-tighter"
                        placeholder="VD: CÔNG TY TNHH GIẤY VIỆT"
                        disabled={!isEditing}
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                   </div>

                   {/* MST & Liên Hệ */}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Mã Số Thuế</label>
                      <div className="relative">
                        <Tag size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 disabled:opacity-50"
                          disabled={!isEditing}
                          value={formData.taxId || ''}
                          onChange={e => setFormData({...formData, taxId: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Người Liên Hệ</label>
                      <div className="relative">
                        <User size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 disabled:opacity-50"
                          disabled={!isEditing}
                          value={formData.contactPerson || ''}
                          onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                        />
                      </div>
                   </div>

                   {/* SĐT & Email */}
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Số Điện Thoại</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 disabled:opacity-50"
                          disabled={!isEditing}
                          value={formData.phone || ''}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Email</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 disabled:opacity-50"
                          disabled={!isEditing}
                          value={formData.email || ''}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                   </div>

                   {/* Vật tư chính */}
                   <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Loại Vật Tư Cung Cấp Chính</label>
                      <input 
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 disabled:opacity-50 uppercase tracking-widest"
                        placeholder="VD: GIẤY, MỰC IN, PHỤ KIỆN..."
                        disabled={!isEditing}
                        value={formData.mainMaterialType || ''}
                        onChange={e => setFormData({...formData, mainMaterialType: e.target.value})}
                      />
                   </div>

                   {/* Địa chỉ */}
                   <div className="col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Địa Chỉ Trụ Sở</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-5 top-6 text-gray-300" />
                        <textarea 
                          rows={3}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold outline-none focus:bg-white focus:border-indigo-200 disabled:opacity-50"
                          disabled={!isEditing}
                          value={formData.address || ''}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                      </div>
                   </div>

                   {isEditing && (
                     <div className="col-span-2 flex justify-end gap-3 mt-4">
                        <button 
                          onClick={() => { setIsEditing(false); setFormData(selectedSupplier || {}); }}
                          className="px-8 py-3.5 bg-white border border-gray-100 text-gray-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50"
                        >
                          Hủy Bỏ
                        </button>
                        <button 
                          onClick={handleSave}
                          className="px-10 py-3.5 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-900 shadow-xl shadow-indigo-100 transition-all"
                        >
                          <Save size={16} /> Lưu Thông Tin
                        </button>
                     </div>
                   )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4 animate-in fade-in duration-700">
                 <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <Building2 size={40} className="opacity-20" />
                 </div>
                 <p className="text-sm font-black uppercase italic tracking-widest">Chọn NCC để xem chi tiết</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
