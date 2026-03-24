"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Save, 
  Lock, 
  Unlock, 
  Key, 
  Mail, 
  User, 
  Clock, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldAlert,
  Edit3
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { showToast, confirm } = useNotification();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    isActive: true
  });

  const isValidUuid = (val: string) => 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const fetchUserDetails = async () => {
    if (!id || id === 'undefined' || !isValidUuid(id)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/hr/users/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setUser(data);
      setFormData({
        role: data.role,
        isActive: data.is_active
      });
    } catch (err: any) {
      showToast('error', 'Không thể tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && id !== 'undefined' && isValidUuid(id)) {
      fetchUserDetails();
    } else if (id === 'undefined' || (id && !isValidUuid(id))) {
      setLoading(false);
      showToast('error', 'Mã tài khoản không hợp lệ');
    }
  }, [id]);

  const handleUpdate = async (updateData: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (res.ok) {
        showToast('success', 'Cập nhật tài khoản thành công');
        fetchUserDetails();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      showToast('error', 'Lỗi hệ thống');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const confirmed = await confirm("Cấp lại mã PIN", "Hệ thống sẽ tái cấp thiết lập mật khẩu mặc định (admin2206@). Hãy cẩn thận!");
    if (!confirmed) return;

    handleUpdate({ newPassword: 'admin2206@' });
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center gap-4 text-gray-400">
        <Loader2 className="animate-spin text-rose-500" size={48} />
        <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Đang nạp hồ sơ bảo mật...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-40 text-center">
        <AlertCircle className="mx-auto text-gray-300 mb-6" size={64} />
        <h2 className="text-2xl font-black italic uppercase text-gray-900">Không tìm thấy tài khoản</h2>
        <button onClick={() => router.push('/hr/users')} className="mt-4 text-primary-600 font-black uppercase text-xs">Về danh sách</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-10 pb-40 md:pb-20 px-4 md:px-0 animate-in fade-in duration-700">
      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-4 pt-4">
        <div className="w-full">
           <button 
             onClick={() => router.push('/hr/users')}
             className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-rose-500 uppercase tracking-widest mb-4 md:mb-6 group"
           >
              <ArrowLeft size={14} className="group-hover:-translate-x-1" /> Về danh sách tài khoản
           </button>
           <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8">
              <div className="w-20 md:w-28 h-20 md:h-28 rounded-3xl md:rounded-[40px] bg-gray-900 flex items-center justify-center text-white relative">
                 <ShieldCheck size={40} md:size={48} className="text-rose-600" />
                 {user.is_active ? 
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-6 md:w-8 h-6 md:h-8 rounded-xl md:rounded-2xl border-4 md:border-8 border-white shadow-lg" /> :
                    <div className="absolute -bottom-2 -right-2 bg-rose-500 w-6 md:w-8 h-6 md:h-8 rounded-xl md:rounded-2xl border-4 md:border-8 border-white shadow-lg flex items-center justify-center text-[8px] md:text-[10px] font-black"><Lock size={12} /></div>
                 }
              </div>
              <div className="min-w-0">
                 <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter truncate italic leading-tight uppercase">{user.email}</h1>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 flex items-center gap-2">
                    <User size={14} /> Chủ sở hữu: <span className="text-primary-600 cursor-pointer hover:underline" onClick={() => router.push(`/hr/employees/${user.employee_id}`)}>{user.Employees?.full_name}</span>
                 </p>
              </div>
           </div>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <button 
            onClick={() => handleUpdate({ is_active: !user.is_active })}
            className={cn(
               "px-6 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-lg",
               user.is_active ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            )}
          >
             {user.is_active ? <Lock size={18} /> : <Unlock size={18} />}
             {user.is_active ? 'Khóa tài khoản' : 'Kích hoạt lại'}
          </button>
          <button 
            onClick={() => handleUpdate({ role: formData.role })}
            disabled={saving}
            className="bg-gray-900 text-white px-8 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest hover:bg-primary-600 transition-all active:scale-95 shadow-xl shadow-gray-200"
          >
             <Save size={18} /> Lưu quyền hạn
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
         {/* Identity Card */}
         <div className="bg-white rounded-[32px] md:rounded-[48px] p-8 md:p-12 border border-gray-100 shadow-2xl shadow-gray-100/30 space-y-8 md:space-y-10">
            <header className="flex items-center justify-between">
               <h3 className="text-xl md:text-2xl font-black italic uppercase text-gray-900">Chi tiết <span className="text-rose-600">Định danh</span></h3>
               <UserCheck size={24} className="text-gray-200" />
            </header>

            <div className="space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Tên đăng nhập)</label>
                  <div className="relative group">
                     <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" />
                     <input 
                       readOnly
                       value={user.email}
                       className="w-full bg-gray-50 border border-gray-100 rounded-2xl md:rounded-3xl py-4 md:py-5 pl-14 pr-8 text-sm md:text-base font-bold text-gray-500 outline-none"
                     />
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vai trò trong hệ thống</label>
                  <div className="relative">
                     <ShieldAlert size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                     <select 
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full bg-gray-900 text-white border-none rounded-2xl md:rounded-3xl py-4 md:py-5 pl-14 pr-8 text-sm md:text-base font-black uppercase appearance-none cursor-pointer focus:ring-4 focus:ring-rose-50 transition-all shadow-xl shadow-gray-200"
                     >
                        <option value="Admin">Hệ quản trị (Admin)</option>
                        <option value="Production">Sản xuất (Production)</option>
                        <option value="Warehouse">Kho vận (Warehouse)</option>
                        <option value="Sales">Kinh doanh (Sales)</option>
                     </select>
                  </div>
               </div>
            </div>
         </div>

         {/* Security & Access Card */}
         <div className="bg-gray-50/50 rounded-[32px] md:rounded-[48px] p-8 md:p-12 border border-gray-100 space-y-8 md:space-y-10 flex flex-col justify-between">
            <div className="space-y-8 md:space-y-10">
               <header className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-black italic uppercase text-gray-900">Tính năng <span className="text-rose-600">Bảo mật</span></h3>
                  <Key size={24} className="text-gray-200" />
               </header>
               
               <div className="space-y-4 md:space-y-6">
                  <button 
                    onClick={handleResetPassword}
                    className="w-full group p-6 md:p-8 bg-white border border-gray-100 rounded-[28px] md:rounded-[40px] text-left hover:shadow-2xl hover:shadow-gray-200 transition-all flex items-center justify-between min-h-[50px] active:scale-95"
                  >
                     <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-10 md:w-14 h-10 md:h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-rose-500 group-hover:text-white transition-all shadow-inner">
                           <Key size={20} md:size={24} />
                        </div>
                        <div className="min-w-0">
                           <p className="text-[10px] md:text-xs font-black uppercase text-gray-900 tracking-tight italic">Cấp lại Mật khẩu</p>
                           <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Thiết lập về PIN mặc định</p>
                        </div>
                     </div>
                     <ChevronRight size={18} className="text-gray-300 md:w-6 md:h-6" />
                  </button>
               </div>
            </div>

            <div className="pt-6 md:pt-0">
               <p className="text-[9px] md:text-[10px] font-bold text-gray-400 text-center uppercase tracking-[0.2em] leading-relaxed">
                  Lưu ý: Mọi thay đổi đều được ghi lại trong nhật ký hệ thống của Pav ERP.
               </p>
            </div>
         </div>
      </div>

      {/* Sticky Bottom Drawer for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-6 md:hidden bg-gradient-to-t from-white via-white to-transparent backdrop-blur-md z-40 border-t border-gray-100 shadow-[0_-8px_40px_rgba(0,0,0,0.05)] flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-500">
         <button 
           onClick={() => handleUpdate({ is_active: !user.is_active })}
           className={cn(
              "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg active:scale-90 border transition-all",
              user.is_active ? "bg-rose-50 text-rose-500 border-rose-100" : "bg-emerald-50 text-emerald-500 border-emerald-100"
           )}
         >
            {user.is_active ? <Lock size={24} /> : <Unlock size={24} />}
         </button>
         <button 
           onClick={() => handleUpdate({ role: formData.role })}
           disabled={saving}
           className="flex-1 h-16 bg-gray-900 text-white rounded-[24px] font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-gray-200 disabled:opacity-50"
         >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            Lưu quyền hạn
         </button>
      </div>
    </div>
  );
}
