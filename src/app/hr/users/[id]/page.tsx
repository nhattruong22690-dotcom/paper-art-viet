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
  UserCheck
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

// Simple cn utility
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

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
    const confirmed = await confirm("Hệ thống sẽ tái cấp mật khẩu mặc định (admin2206@). Chắc chắn tiếp tục?");
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
    <div className="min-h-screen bg-[#F5F7FB] px-4 md:px-0 pb-40 md:pb-20 transition-colors duration-500">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-10 pt-4 animate-in fade-in duration-700">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-4">
          <div className="w-full">
             <button 
               onClick={() => router.push('/hr/users')}
               className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-primary-600 uppercase tracking-widest mb-4 md:mb-6 group transition-colors"
             >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Về danh sách tài khoản
             </button>
             <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-8 min-w-0">
                <div className="w-20 md:w-28 h-20 md:h-28 rounded-[32px] md:rounded-[40px] bg-white border border-gray-100 shadow-xl flex items-center justify-center text-gray-400 relative shrink-0">
                   <ShieldCheck size={40} className="text-primary-600" />
                   {user.is_active ? 
                      <div className="absolute -bottom-2 -right-2 bg-[#E8F5E9] w-6 md:w-8 h-6 md:h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center"><div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-[#2E7D32]" /></div> :
                      <div className="absolute -bottom-2 -right-2 bg-[#FFEBEE] w-6 md:w-8 h-6 md:h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-[#C62828]"><Lock size={12} /></div>
                   }
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border",
                        user.is_active ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]" : "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
                      )}>
                        {user.is_active ? 'Đang hoạt động' : 'Đã bị khóa'}
                      </span>
                   </div>
                   <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter truncate italic leading-tight uppercase">{user.email}</h1>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 flex flex-wrap items-center gap-2">
                      <User size={14} /> Chủ sở hữu: <span className="text-primary-600 cursor-pointer hover:underline truncate max-w-[200px] md:max-w-none" onClick={() => user.employee_id && router.push(`/hr/employees/${user.employee_id}`)}>{user.Employees?.full_name}</span>
                   </p>
                </div>
             </div>
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0 px-1">
            <button 
              onClick={() => handleUpdate({ is_active: !user.is_active })}
              className={cn(
                 "px-6 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-md border",
                 user.is_active ? "bg-gray-100 text-gray-500 border-gray-200 hover:bg-[#FFEBEE] hover:text-[#C62828] hover:border-[#FFCDD2]" : "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9] hover:bg-[#C8E6C9]"
              )}
            >
               {user.is_active ? <Lock size={18} /> : <Unlock size={18} />}
               {user.is_active ? 'Khóa tài khoản' : 'Kích hoạt lại'}
            </button>
            <button 
              onClick={() => handleUpdate({ role: formData.role })}
              disabled={saving}
              className="bg-primary-600 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-primary-700 transition-all active:scale-95 shadow-lg shadow-primary-100 border border-primary-500 flex items-center gap-3"
            >
               {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
               Lưu quyền hạn
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
           <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/20 space-y-8 md:space-y-10 animate-in slide-in-from-left-4 duration-500">
              <header className="flex items-center justify-between">
                 <h2 className="text-xl md:text-2xl font-black italic uppercase text-primary-900 tracking-tight">Chi tiết <span className="text-primary-600">Định danh</span></h2>
                 <UserCheck size={24} className="text-primary-100" />
              </header>

              <div className="space-y-6">
                 <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic opacity-60">Email đăng nhập</label>
                    <div className="relative">
                       <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" />
                       <input 
                         readOnly
                         value={user.email}
                         className="w-full bg-[#F5F7FB] border border-[#E0E0E0] rounded-2xl md:rounded-3xl py-4 md:py-5 pl-14 pr-8 text-sm md:text-base font-bold text-gray-500 truncate outline-none"
                       />
                    </div>
                 </div>
                 <div className="space-y-2 group">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic opacity-60">Vai trò hệ thống</label>
                    <div className="relative">
                       <ShieldAlert size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                       <select 
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="w-full bg-white border border-[#E0E0E0] rounded-2xl md:rounded-3xl py-4 md:py-5 pl-14 pr-8 text-sm md:text-base font-black uppercase appearance-none cursor-pointer focus:border-primary-300 focus:ring-4 focus:ring-primary-50 transition-all min-h-[50px] outline-none"
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

           <div className="bg-white rounded-[40px] p-8 md:p-12 border border-gray-100 shadow-xl shadow-gray-200/20 space-y-8 md:space-y-10 flex flex-col justify-between animate-in slide-in-from-right-4 duration-500">
              <div className="space-y-8 md:space-y-10">
                 <header className="flex items-center justify-between">
                    <h2 className="text-xl md:text-2xl font-black italic uppercase text-primary-900 tracking-tight">Tính năng <span className="text-primary-600">Bảo mật</span></h2>
                    <Key size={24} className="text-primary-100" />
                 </header>
                 
                 <div className="space-y-4 md:space-y-6">
                    <button 
                      onClick={handleResetPassword}
                      className="w-full group p-6 md:p-8 bg-[#F5F7FB] border border-[#E0E0E0] rounded-[24px] md:rounded-[32px] text-left hover:bg-white hover:border-primary-200 hover:shadow-2xl hover:shadow-primary-100/50 transition-all flex items-center justify-between active:scale-95 min-h-[64px]"
                    >
                       <div className="flex items-center gap-4 md:gap-6">
                          <div className="w-10 md:w-14 h-10 md:h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm">
                             <Key size={20} />
                          </div>
                          <div className="min-w-0">
                             <p className="text-[10px] md:text-xs font-black uppercase text-gray-900 tracking-tight italic">Đặt lại mã PIN</p>
                             <p className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Cấp lại mật khẩu mặc định</p>
                          </div>
                       </div>
                       <ChevronRight size={18} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                    </button>
                 </div>
              </div>

              <div className="pt-6 md:pt-0">
                 <p className="text-[9px] md:text-[10px] font-bold text-gray-400 text-center uppercase tracking-[0.2em] leading-relaxed italic opacity-60">
                    Lưu ý: Các thay đổi bảo mật sẽ được ghi nhận <br className="hidden md:block"/> trong nhật ký Pav ERP.
                 </p>
              </div>
           </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 md:hidden bg-white/80 backdrop-blur-xl z-40 border-t border-gray-100 shadow-[0_-8px_40px_rgba(0,0,0,0.05)] flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-500">
           <button 
             onClick={() => handleUpdate({ is_active: !user.is_active })}
             className={cn(
                "w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg active:scale-90 border transition-all",
                user.is_active ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]"
             )}
           >
              {user.is_active ? <Lock size={24} /> : <Unlock size={24} />}
           </button>
           <button 
             onClick={() => handleUpdate({ role: formData.role })}
             disabled={saving}
             className="flex-1 h-16 bg-primary-600 text-white rounded-[24px] font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-primary-200 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Lưu quyền hạn
           </button>
        </div>
      </div>
    </div>
  );
}
