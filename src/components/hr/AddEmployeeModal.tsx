"use client";

import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  Save, 
  User, 
  Hash, 
  Phone, 
  Mail, 
  Building2, 
  Briefcase, 
  CreditCard, 
  MapPin, 
  Calendar,
  DollarSign
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddEmployeeModal({ isOpen, onClose, onSuccess }: AddEmployeeModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    employeeCode: '',
    name: '',
    phone: '',
    email: '',
    idCard: '',
    address: '',
    department: 'SX',
    position: 'Công nhân',
    status: 'active',
    joinDate: new Date().toISOString().split('T')[0],
    salaryType: 'monthly',
    baseSalary: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add employee');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white border-[2.5px] border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b-[2.5px] border-black flex justify-between items-center bg-neo-purple/20">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-neo-sm">
                <UserPlus size={24} strokeWidth={3} className="text-black" />
             </div>
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Thêm nhân viên mới</h2>
                <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-0.5">Create New Professional Record</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors border-2 border-transparent hover:border-black">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="flex-1 overflow-y-auto max-h-[70vh] p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Section 1: Basic Info */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 border-b border-black/5 pb-2">Thông tin cơ bản</h3>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest pl-1">Mã nhân viên</label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                        <input 
                          required
                          className="form-input !pl-10 h-12 text-sm font-bold uppercase"
                          placeholder="VD: NV001"
                          value={formData.employeeCode}
                          onChange={e => setFormData({...formData, employeeCode: e.target.value.toUpperCase()})}
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest pl-1">Họ và tên</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                        <input 
                          required
                          className="form-input !pl-10 h-12 text-sm font-bold"
                          placeholder="Nguyễn Văn A"
                          value={formData.name}
                          onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest pl-1">Số điện thoại</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                        <input 
                          className="form-input !pl-10 h-12 text-sm font-bold tabular-nums"
                          placeholder="0901234567"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest pl-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                        <input 
                          type="email"
                          className="form-input !pl-10 h-12 text-sm font-bold"
                          placeholder="name@paperartviet.com"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest pl-1">Số CCCD / Passport</label>
                   <div className="relative">
                     <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                     <input 
                       className="form-input !pl-10 h-12 text-sm font-bold tabular-nums"
                       placeholder="012345678901"
                       value={formData.idCard}
                       onChange={e => setFormData({...formData, idCard: e.target.value})}
                     />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest pl-1">Địa chỉ thường trú</label>
                   <div className="relative">
                     <MapPin className="absolute left-3 top-4 text-black/20" size={16} />
                     <textarea 
                       className="form-input !pl-10 py-3 min-h-[80px] text-sm font-bold resize-none"
                       placeholder="Số nhà, đường, phường/xã..."
                       value={formData.address}
                       onChange={e => setFormData({...formData, address: e.target.value})}
                     />
                   </div>
                </div>
              </div>

              {/* Section 2: Job Info */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black/30 border-b border-black/5 pb-2">Vị trí & Lương</h3>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest pl-1">Phòng ban</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                        <select 
                          className="form-input !pl-10 h-12 text-sm font-bold bg-white"
                          value={formData.department}
                          onChange={e => setFormData({...formData, department: e.target.value})}
                        >
                           <option value="SX">Sản xuất (SX)</option>
                           <option value="KHO">Kho vận (KHO)</option>
                           <option value="HC">Hành chính (HC)</option>
                           <option value="KT">Kỹ thuật (KT)</option>
                           <option value="SALE">Kinh doanh (SALE)</option>
                        </select>
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest pl-1">Chức vụ</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                        <select 
                          className="form-input !pl-10 h-12 text-sm font-bold bg-white"
                          value={formData.position}
                          onChange={e => setFormData({...formData, position: e.target.value})}
                        >
                           <option value="Công nhân">Công nhân</option>
                           <option value="Tổ trưởng">Tổ trưởng</option>
                           <option value="Quản lý">Quản lý</option>
                           <option value="Kỹ thuật viên">Kỹ thuật viên</option>
                           <option value="Nhân viên">Nhân viên</option>
                        </select>
                      </div>
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest pl-1">Ngày vào làm</label>
                   <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                     <input 
                       type="date"
                       className="form-input !pl-10 h-12 text-sm font-bold"
                       value={formData.joinDate}
                       onChange={e => setFormData({...formData, joinDate: e.target.value})}
                     />
                   </div>
                </div>

                <div className="p-6 bg-black/5 rounded-2xl border-2 border-black border-dashed space-y-4 shadow-neo-sm">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest pl-1">Hình thức lương</label>
                      <div className="flex gap-2">
                         {['monthly', 'hourly'].map(type => (
                           <button
                             key={type}
                             type="button"
                             onClick={() => setFormData({...formData, salaryType: type})}
                             className={cn(
                               "flex-1 h-10 rounded-lg border-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-neo-sm",
                               formData.salaryType === type 
                                 ? "bg-black text-white border-black" 
                                 : "bg-white text-black/40 border-black/10 hover:border-black hover:text-black"
                             )}
                           >
                             {type === 'monthly' ? 'Lương tháng' : 'Lương giờ'}
                           </button>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest pl-1">Lương cơ bản</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" size={16} />
                        <input 
                          type="number"
                          className="form-input !pl-10 h-12 text-sm font-bold tabular-nums"
                          placeholder="0"
                          value={formData.baseSalary || ''}
                          onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/20 uppercase">VNĐ</span>
                      </div>
                   </div>
                </div>

                <div className="p-4 bg-neo-yellow/10 border-2 border-black rounded-xl text-[10px] font-bold text-black flex items-center gap-3">
                   <div className="w-6 h-6 bg-neo-yellow border-2 border-black rounded flex items-center justify-center shrink-0">!</div>
                   <span>Nhân viên có phòng ban "Sản xuất" hoặc chức vụ "Công nhân" sẽ tự động xuất hiện trong Form Ghi nhận sản lượng.</span>
                </div>

              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 border-t-[2.5px] border-black bg-gray-50 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-8 py-4 rounded-xl border-2 border-black font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-neo-sm active:translate-y-0.5 active:shadow-none"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className={cn(
                "px-10 py-4 rounded-xl border-[2.5px] border-black bg-black text-white font-black text-[10px] uppercase tracking-widest shadow-neo hover:shadow-neo-active active:translate-y-0.5 transition-all flex items-center gap-3",
                isSubmitting && "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? 'Đanh xử lý...' : (
                <>
                  <Save size={18} strokeWidth={3} />
                  Lưu hồ sơ nhân sự
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
