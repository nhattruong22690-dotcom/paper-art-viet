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
  Building,
  Briefcase
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
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl h-[85vh] bg-white rounded-lg shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300 overflow-hidden border border-border">
        
        {/* SIDEBAR: LIST OF SUPPLIERS */}
        <div className="w-full md:w-[320px] bg-gray-50 border-r border-border flex flex-col h-full shrink-0">
           <div className="p-6 border-b border-border bg-white">
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <h3 className="text-sm font-bold text-foreground tracking-tight">Nhà cung ứng</h3>
                 </div>
                 <button 
                  onClick={handleAddNew}
                  className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center shadow hover:bg-blue-700 transition-all"
                 >
                   <Plus size={16} />
                 </button>
              </div>
              <div className="relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                 <input 
                   type="text"
                   placeholder="Tìm đối tác..."
                   className="form-input pl-10 py-1.5 text-xs"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
           </div>

           <div className="flex-1 overflow-y-auto divide-y divide-border/50">
              {suppliers.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className={cn(
                    "w-full px-6 py-4 text-left transition-all relative",
                    selectedSupplier?.id === s.id ? "bg-white shadow-sm" : "hover:bg-gray-100/50"
                  )}
                >
                   {selectedSupplier?.id === s.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                   <p className={cn(
                     "text-sm font-bold tracking-tight mb-1 transition-all text-foreground",
                     selectedSupplier?.id === s.id && "text-primary"
                   )}>{s.name}</p>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <Tag size={10} />
                      {s.mainMaterialType || 'Phổ thông'}
                   </div>
                </button>
              ))}
              {suppliers.length === 0 && (
                <div className="p-10 text-center text-slate-300 italic text-[10px] uppercase tracking-widest">
                   Không có dữ liệu
                </div>
              )}
           </div>
        </div>

        {/* MAIN CONTENT: DETAILS & FORM */}
        <div className="flex-1 overflow-y-auto p-10 md:p-14 bg-white relative flex flex-col">
           {selectedSupplier || isEditing ? (
             <div className="max-w-3xl mx-auto w-full space-y-8 animate-in fade-in duration-500 pb-20">
                <div className="flex justify-between items-start gap-10">
                   <div>
                      <h4 className="text-xl font-bold text-foreground tracking-tight mb-1">
                        {isEditing ? (selectedSupplier ? 'Sửa hồ sơ' : 'Thêm đối tác') : 'Chi tiết đối tác'}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                         <Building size={12} className="text-primary" /> Thông tin cung ứng & Liên hệ
                      </p>
                   </div>
                   <div className="flex gap-2">
                       {!isEditing ? (
                         <>
                           <button 
                             onClick={() => setIsEditing(true)}
                             className="p-2 bg-white border border-border text-muted-foreground rounded-lg hover:text-primary hover:border-primary transition-all shadow-sm"
                           >
                             <Edit3 size={18} />
                           </button>
                           <button 
                             onClick={handleDelete}
                             className="p-2 bg-white border border-border text-muted-foreground rounded-lg hover:text-destructive hover:border-destructive transition-all shadow-sm"
                           >
                             <Trash2 size={18} />
                           </button>
                         </>
                       ) : (
                         <button 
                           onClick={() => setIsEditing(false)}
                           className="px-4 py-2 bg-gray-50 border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground rounded-lg hover:text-foreground transition-all"
                         >
                           Hủy
                         </button>
                       )}
                       <button 
                         onClick={onClose}
                         className="p-2 bg-foreground text-white rounded-lg hover:bg-muted-text transition-all shadow-lg"
                       >
                         <X size={18} />
                       </button>
                    </div>
                 </div>

                {message && (
                  <div className={cn(
                    "p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-4",
                    message.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                  )}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <p className="text-xs font-bold uppercase tracking-wider">{message.text}</p>
                  </div>
                )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                    {/* Name & ID */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Tên Công ty</label>
                       <input 
                         disabled={!isEditing}
                         className="form-input disabled:opacity-50"
                         value={formData.name || ''}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         placeholder="Nhập tên chính thức..."
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Mã số thuế</label>
                       <div className="relative">
                         <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                         <input 
                           disabled={!isEditing}
                           className="form-input pl-11 disabled:opacity-50 tracking-widest"
                           value={formData.taxId || ''}
                           onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                           placeholder="000-000-000"
                         />
                       </div>
                    </div>

                   {/* Contacts */}
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Người liên hệ</label>
                       <div className="relative">
                         <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                         <input 
                           disabled={!isEditing}
                           className="form-input pl-11 disabled:opacity-50"
                           value={formData.contactPerson || ''}
                           onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                           placeholder="Họ và tên..."
                         />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Số điện thoại</label>
                       <div className="relative">
                         <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                         <input 
                           disabled={!isEditing}
                           className="form-input pl-11 disabled:opacity-50"
                           value={formData.phone || ''}
                           onChange={(e) => setFormData({...formData, phone: e.target.value})}
                           placeholder="09xx.xxx.xxx"
                         />
                       </div>
                    </div>

                    {/* Material Type */}
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Phân loại Vật tư</label>
                       <div className="relative">
                         <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                         <input 
                           disabled={!isEditing}
                           className="form-input pl-11 disabled:opacity-50"
                           value={formData.mainMaterialType || ''}
                           onChange={(e) => setFormData({...formData, mainMaterialType: e.target.value})}
                           placeholder="Giấy, Keo, Phụ liệu..."
                         />
                       </div>
                    </div>

                    {/* Address */}
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Địa chỉ trụ sở</label>
                       <div className="relative">
                         <MapPin className="absolute left-4 top-4 text-muted-foreground" size={18} />
                         <textarea 
                           disabled={!isEditing}
                           className="form-input pl-11 h-24 resize-none disabled:opacity-50"
                           value={formData.address || ''}
                           onChange={(e) => setFormData({...formData, address: e.target.value})}
                           placeholder="Nhập địa chỉ chi tiết..."
                         />
                       </div>
                    </div>
                </div>

                 {isEditing && (
                   <div className="flex justify-end pt-4">
                      <button 
                       onClick={handleSave}
                       className="btn-primary gap-2 h-11 px-8"
                      >
                        <Save size={18} />
                        Lưu hồ sơ đối tác
                      </button>
                   </div>
                 )}
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none">
                <div className="w-24 h-24 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                   <Building size={40} className="text-slate-300" />
                </div>
                <h4 className="text-base font-bold text-slate-900 uppercase tracking-widest">Hồ sơ đối tác</h4>
                <p className="text-xs font-medium text-slate-500 mt-2">Vui lòng chọn một nhà cung ứng để xem chi tiết<br/>hoặc khởi tạo đối tác mới.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
