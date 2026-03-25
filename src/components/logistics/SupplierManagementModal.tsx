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
  AlertCircle,
  FileText,
  ChevronRight,
  Edit3,
  Building
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
        setFormData(data[0] as any);
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
      setMessage({ type: 'error', text: 'Tên nhà cung ứng là bắt buộc.' });
      return;
    }
    
    setLoading(true);
    try {
      await upsertSupplier(formData);
      setMessage({ type: 'success', text: 'Đã lưu thông tin nhà cung ứng.' });
      setIsEditing(false);
      loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi lưu.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSupplier || !confirm(`Xác nhận xóa nhà cung ứng ${selectedSupplier.name}?`)) return;
    
    setLoading(true);
    try {
      await deleteSupplier(selectedSupplier.id);
      setSelectedSupplier(null);
      loadData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi khi xóa.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500 overflow-hidden">
      <div className="absolute inset-0 bg-retro-sepia/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl h-[85vh] retro-card !p-0 shadow-[0_30px_60px_-15px_rgba(62,39,35,0.6)] flex flex-col md:flex-row animate-in zoom-in-95 duration-300 overflow-hidden border-2">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Building2 size={600} strokeWidth={0.5} className="text-retro-sepia" />
        </div>

        {/* SIDEBAR: LIST OF SUPPLIERS */}
        <div className="w-full md:w-[350px] bg-white border-r-2 border-retro-sepia/10 flex flex-col h-full relative z-10 font-typewriter">
           <div className="p-8 border-b-2 border-retro-sepia/10 bg-retro-paper/20">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-black text-retro-sepia uppercase tracking-tighter italic underline decoration-retro-mustard/30 underline-offset-4">Nhà cung ứng</h3>
                 <button 
                  onClick={handleAddNew}
                  className="w-10 h-10 bg-retro-brick text-white flex items-center justify-center shadow-md hover:bg-retro-sepia transition-all rotate-3 hover:rotate-0"
                 >
                   <Plus size={20} strokeWidth={2.5} />
                 </button>
              </div>
              <div className="relative group">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-retro-sepia/20 group-focus-within:text-retro-brick transition-all" size={16} strokeWidth={2} />
                 <input 
                   type="text"
                   placeholder="Tra cứu danh tính..."
                   className="w-full pl-12 pr-4 py-3 bg-white border-2 border-retro-sepia/10 text-[11px] font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia shadow-inner italic"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto scrollbar-hide divide-y-2 divide-retro-sepia/5">
              {suppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className={cn(
                    "w-full p-6 text-left transition-all group relative",
                    selectedSupplier?.id === s.id ? "bg-retro-paper" : "hover:bg-retro-paper/30"
                  )}
                >
                   {selectedSupplier?.id === s.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-retro-brick" />}
                   <p className={cn(
                     "text-[12px] font-black uppercase tracking-tight italic mb-2 transition-all",
                     selectedSupplier?.id === s.id ? "text-retro-brick" : "text-retro-sepia group-hover:text-retro-brick"
                   )}>{s.name}</p>
                   <div className="flex items-center gap-4 text-[9px] font-black text-retro-earth/40 uppercase tracking-widest opacity-60">
                      <Tag size={12} strokeWidth={2} className="text-retro-mustard" />
                      {s.mainMaterialType || 'Hạng mục chung'}
                   </div>
                </button>
              ))}
              {suppliers.length === 0 && (
                <div className="p-10 text-center text-retro-earth/20 italic text-[10px] uppercase tracking-[0.2em]">
                   Vô thư bản ghi
                </div>
              )}
           </div>
        </div>

        {/* MAIN CONTENT: DETAILS & FORM */}
        <div className="flex-1 overflow-y-auto p-10 md:p-14 bg-retro-paper/30 relative z-0 flex flex-col font-typewriter">
           {selectedSupplier || isEditing ? (
             <div className="space-y-12 animate-in slide-in-from-right-10 duration-500 pb-32">
                <div className="flex justify-between items-start gap-10">
                   <div>
                      <h4 className="text-3xl font-black text-retro-sepia uppercase tracking-tighter italic mb-4 underline decoration-double decoration-retro-mustard/30 underline-offset-8">
                        {isEditing ? (selectedSupplier ? 'Hiệu đính đối tác' : 'Khai báo mới') : 'Hồ sơ Chi tiết'}
                      </h4>
                      <p className="text-[10px] text-retro-earth/60 font-black uppercase tracking-[0.2em] italic flex items-center gap-3">
                         <Building size={16} strokeWidth={2} className="text-retro-mustard" /> Thư tịch đối tác Cung ứng & Hậu cần
                      </p>
                   </div>
                   <div className="flex gap-4">
                      {!isEditing ? (
                        <>
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="w-12 h-12 bg-white border-2 border-retro-sepia/10 text-retro-sepia flex items-center justify-center hover:text-retro-brick hover:bg-white transition-all rotate-2 hover:rotate-0 shadow-sm"
                          >
                            <Edit3 size={20} strokeWidth={2} />
                          </button>
                          <button 
                            onClick={handleDelete}
                            className="w-12 h-12 bg-white border-2 border-retro-brick/10 text-retro-brick flex items-center justify-center hover:bg-retro-brick hover:text-white transition-all -rotate-2 hover:rotate-0 shadow-sm"
                          >
                            <Trash2 size={20} strokeWidth={2} />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 bg-retro-paper border-2 border-retro-sepia/10 text-[10px] font-black uppercase tracking-widest text-retro-earth/40 hover:text-retro-sepia hover:border-retro-sepia shadow-sm italic transition-all"
                        >
                          Đình chỉ
                        </button>
                      )}
                      <button 
                        onClick={onClose}
                        className="w-12 h-12 bg-retro-sepia text-retro-paper flex items-center justify-center hover:bg-retro-brick transition-all shadow-lg"
                      >
                        <X size={24} strokeWidth={2.5} />
                      </button>
                   </div>
                </div>

                {message && (
                  <div className={cn(
                    "p-6 border-2 flex items-center gap-6 animate-in slide-in-from-top-4 italic font-typewriter",
                    message.type === 'success' ? "bg-retro-moss/5 border-retro-moss text-retro-moss" : "bg-retro-brick/5 border-retro-brick text-retro-brick"
                  )}>
                    {message.type === 'success' ? <CheckCircle2 size={22} strokeWidth={2.5} /> : <AlertCircle size={22} strokeWidth={2.5} />}
                    <p className="text-[11px] font-black uppercase tracking-tight">{message.text}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
                   {/* Name & ID */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-retro-earth/40 uppercase tracking-widest ml-1 opacity-60">Danh hiệu Cơ sở / Công ty</label>
                      <input 
                        disabled={!isEditing}
                        className="w-full px-8 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black uppercase text-retro-sepia outline-none shadow-inner italic placeholder:font-normal"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Nhập tôn danh chính thức..."
                      />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-retro-earth/40 uppercase tracking-widest ml-1 opacity-60">Mã số Thuế / Thu ngân</label>
                      <input 
                        disabled={!isEditing}
                        className="w-full px-8 py-5 bg-retro-paper/50 border-2 border-retro-sepia/10 focus:border-retro-brick transition-all text-sm font-black uppercase text-retro-brick outline-none shadow-inner text-center tracking-widest"
                        value={formData.taxId || ''}
                        onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                        placeholder="00-000-000-00"
                      />
                   </div>

                   {/* Contacts */}
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-retro-earth/40 uppercase tracking-widest ml-1 opacity-60">Đại diện Thụ lý / Contact</label>
                      <div className="relative">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20" size={18} strokeWidth={1.5} />
                        <input 
                          disabled={!isEditing}
                          className="w-full pl-16 pr-8 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black text-retro-sepia outline-none shadow-inner italic"
                          value={formData.contactPerson || ''}
                          onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                          placeholder="Họ và tên..."
                        />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-retro-earth/40 uppercase tracking-widest ml-1 opacity-60">Số hiệu Viễn thông (Phone)</label>
                      <div className="relative">
                        <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20" size={18} strokeWidth={1.5} />
                        <input 
                          disabled={!isEditing}
                          className="w-full pl-16 pr-8 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black text-retro-sepia outline-none shadow-inner"
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="09xx.xxx.xxx"
                        />
                      </div>
                   </div>

                   {/* Address */}
                   <div className="md:col-span-2 space-y-4">
                      <label className="text-[10px] font-black text-retro-earth/40 uppercase tracking-widest ml-1 opacity-60">Địa chỉ Trụ sở & Logistics</label>
                      <div className="relative">
                        <MapPin className="absolute left-6 top-6 text-retro-brick/40" size={20} strokeWidth={2} />
                        <textarea 
                          disabled={!isEditing}
                          className="w-full pl-18 pr-8 py-6 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-bold text-retro-earth h-28 resize-none outline-none shadow-inner leading-relaxed italic"
                          value={formData.address || ''}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          placeholder="Mô tả tọa độ giao nhận..."
                        />
                      </div>
                   </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end pt-10">
                     <button 
                      onClick={handleSave}
                      className="flex items-center gap-6 px-16 py-5 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all active:scale-95 italic"
                     >
                       <Save size={20} strokeWidth={2.5} />
                       Hạ bút Lưu hồ sơ
                     </button>
                  </div>
                )}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                <div className="w-32 h-32 border-4 border-dashed border-retro-sepia/10 rounded-full flex items-center justify-center mb-10 rotate-12">
                   <Building size={64} strokeWidth={0.5} className="text-retro-sepia" />
                </div>
                <h4 className="text-xl font-black text-retro-sepia uppercase tracking-[0.2em] italic">Vô Thư Bản Ghi</h4>
                <p className="text-[11px] font-black text-retro-earth uppercase tracking-widest mt-4">Vui lòng lựa chọn hoặc khởi tạo hồ sơ đối tác mới.</p>
             </div>
           )}

           <div className="torn-paper-bottom" />
        </div>
      </div>
    </div>
  );
}
