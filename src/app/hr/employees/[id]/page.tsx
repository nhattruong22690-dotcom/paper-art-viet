"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  User, 
  ArrowLeft, 
  Save, 
  Trash2, 
  ShieldCheck, 
  ExternalLink, 
  Clock, 
  TrendingUp, 
  MapPin, 
  Phone, 
  CreditCard,
  Briefcase,
  Calendar,
  DollarSign,
  History,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  ChevronRight
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

// Simple cn utility
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function EmployeeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { showToast, confirm } = useNotification();

  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [history, setHistory] = useState<any[]>([]);

  const isValidUuid = (val: string) => 
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

  const fetchDetails = async () => {
    if (!id || id === 'undefined' || !isValidUuid(id)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/hr/employees/${id}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setEmployee(data);
      setFormData({
        name: data.name,
        employeeCode: data.employeeCode,
        phone: data.phone || '',
        email: data.email || '',
        idCard: data.idCard || '',
        address: data.address || '',
        department: data.department,
        position: data.position,
        status: data.status,
        joinDate: data.joinDate,
        salaryType: data.salaryType,
        baseSalary: data.baseSalary
      });
      setHistory(data.history || []);
    } catch (err: any) {
      showToast('error', 'Không thể tải thông tin nhân viên');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && id !== 'undefined' && isValidUuid(id)) {
      fetchDetails();
    } else if (id === 'undefined' || (id && !isValidUuid(id))) {
      setLoading(false);
      showToast('error', 'Mã nhân viên không hợp lệ');
    }
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        showToast('success', 'Cập nhật hồ sơ thành công');
        fetchDetails(); 
      } else {
        const error = await res.json();
        showToast('error', error.error || 'Cập nhật thất bại');
      }
    } catch (err) {
      showToast('error', 'Lỗi hệ thống khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm("Dữ liệu hồ sơ và tài khoản liên kết sẽ bị xóa vĩnh viễn. Bạn có chắc không?");
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/hr/employees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Đã xóa hồ sơ nhân viên');
        router.push('/hr/employees');
      } else {
        showToast('error', 'Xóa thất bại');
      }
    } catch (err) {
      showToast('error', 'Lỗi hệ thống khi xóa');
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center gap-4 text-gray-400 animate-pulse">
        <Loader2 className="animate-spin text-rose-500" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Đang truy xuất hồ sơ...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="py-40 text-center space-y-6">
        <AlertCircle className="mx-auto text-rose-500" size={64} />
        <h2 className="text-2xl font-black italic uppercase text-gray-900">Không tìm thấy nhân viên</h2>
        <button onClick={() => router.push('/hr/employees')} className="text-primary-600 font-black uppercase text-xs hover:underline decoration-2">Quay lại danh sách</button>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return { bg: 'bg-[#E8F5E9]', dot: 'bg-[#2E7D32]', text: 'text-[#2E7D32]', border: 'border-[#C8E6C9]', label: 'Đang làm việc' };
      case 'pending':
      case 'probation':
        return { bg: 'bg-[#FFF3E0]', dot: 'bg-[#EF6C00]', text: 'text-[#EF6C00]', border: 'border-[#FFE0B2]', label: 'Thử việc' };
      case 'inactive':
      case 'locked':
        return { bg: 'bg-[#FFEBEE]', dot: 'bg-[#C62828]', text: 'text-[#C62828]', border: 'border-[#FFCDD2]', label: 'Đã nghỉ/Khóa' };
      default:
        return { bg: 'bg-gray-100', dot: 'bg-gray-500', text: 'text-gray-500', border: 'border-gray-200', label: status || 'N/A' };
    }
  };

  const statusStyle = getStatusStyle(formData.status);

  return (
    <div className="min-h-screen bg-[#F5F7FB] px-4 md:px-0 pb-40 md:pb-20 transition-colors duration-500">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:gap-4">
          <div className="w-full">
             <button
               onClick={() => router.push('/hr/employees')}
               className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-primary-600 uppercase tracking-widest transition-all mb-4 md:mb-6 group"
             >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Về danh sách
             </button>
             <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-8 min-w-0">
                <div className="w-20 md:w-32 h-20 md:h-32 rounded-[32px] md:rounded-[40px] bg-white border border-gray-100 shadow-xl flex items-center justify-center text-gray-300 relative shrink-0 overflow-visible">
                   <User size={48} className="md:w-16 md:h-16 text-primary-200" />
                   <div className={cn("absolute -bottom-2 -right-2 w-6 md:w-8 h-6 md:h-8 rounded-full border-4 border-white shadow-lg flex items-center justify-center", statusStyle.bg)}>
                      <div className={cn("w-2 md:w-3 h-2 md:h-3 rounded-full", statusStyle.dot)} />
                   </div>
                </div>
                <div className="min-w-0">
                   <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border",
                        statusStyle.bg, statusStyle.text, statusStyle.border
                      )}>
                        {statusStyle.label}
                      </span>
                   </div>
                   <h1 className="text-3xl md:text-5xl font-black text-primary-900 tracking-tighter truncate leading-tight uppercase italic">{formData.name}</h1>
                   <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 md:mt-3">
                      <span className="bg-white text-primary-600 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-primary-100 shadow-sm">{formData.employeeCode}</span>
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic flex items-center gap-2"><MapPin size={12} /> {formData.department} / {formData.position}</span>
                   </div>
                </div>
             </div>
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0 px-1">
             <button
               onClick={handleDelete}
               className="p-4 bg-white text-gray-400 rounded-full hover:bg-[#FFEBEE] hover:text-[#C62828] transition-all active:scale-95 shadow-sm border border-gray-100"
             >
                <Trash2 size={24} />
             </button>
             <button
               onClick={handleSave}
               disabled={saving}
               className="bg-primary-600 text-white px-8 py-4 rounded-full font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-primary-700 transition-all active:scale-95 shadow-xl shadow-primary-200 border border-primary-500"
             >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Lưu hồ sơ
             </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
           <div className="lg:col-span-8 space-y-6 md:space-y-10">
              <div className="bg-white rounded-[40px] md:rounded-[48px] p-8 md:p-12 border border-blue-50/50 shadow-xl shadow-gray-200/20 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                    <User size={120} />
                 </div>
                 <header className="flex items-center gap-4 mb-8 md:mb-12">
                    <div className="w-10 md:w-12 h-10 md:h-12 rounded-2xl bg-primary-100/50 flex items-center justify-center text-primary-600 shadow-inner">
                       <User size={20} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black italic uppercase text-primary-900 tracking-tight">Hồ sơ <span className="text-primary-600">Cá nhân</span></h2>
                 </header>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 text-primary-900">
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Họ và Tên</label>
                       <input
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full bg-[#F5F7FB] border border-[#E0E0E0] rounded-2xl py-4 md:py-5 px-6 md:px-8 text-sm md:text-base font-bold focus:bg-white focus:border-primary-300 focus:ring-4 focus:ring-primary-50 transition-all outline-none"
                       />
                    </div>
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Số điện thoại</label>
                       <div className="relative">
                          <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                          <input
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-[#F5F7FB] border border-[#E0E0E0] rounded-2xl py-4 md:py-5 pl-14 pr-8 text-sm md:text-base font-bold focus:bg-white focus:border-primary-300 transition-all outline-none"
                          />
                       </div>
                    </div>
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Số CCCD / CMND</label>
                       <div className="relative">
                          <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                          <input
                            value={formData.idCard}
                            onChange={(e) => setFormData({...formData, idCard: e.target.value})}
                            className="w-full bg-[#F5F7FB] border border-[#E0E0E0] rounded-2xl py-4 md:py-5 pl-14 pr-8 text-sm md:text-base font-bold focus:bg-white focus:border-primary-300 transition-all outline-none"
                          />
                       </div>
                    </div>
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Địa chỉ thường trú</label>
                       <div className="relative">
                          <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" size={18} />
                          <input
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full bg-[#F5F7FB] border border-[#E0E0E0] rounded-2xl py-4 md:py-5 pl-14 pr-8 text-sm md:text-base font-bold focus:bg-white focus:border-primary-300 transition-all outline-none"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-[40px] md:rounded-[48px] p-8 md:p-12 border border-rose-50/50 shadow-xl shadow-gray-200/20">
                 <header className="flex items-center gap-4 mb-8 md:mb-12">
                    <div className="w-10 md:w-12 h-10 md:h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600 shadow-inner">
                       <DollarSign size={20} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-black italic uppercase text-primary-900 tracking-tight">Lương & <span className="text-rose-600">Đãi ngộ</span></h2>
                 </header>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Loại hình lương</label>
                       <select
                         value={formData.salaryType}
                         onChange={(e) => setFormData({...formData, salaryType: e.target.value})}
                         className="w-full bg-[#F5F7FB] border border-[#E0E0E0] rounded-2xl py-4 md:py-5 px-6 md:px-8 text-sm md:text-base font-black uppercase appearance-none focus:bg-white focus:border-primary-300 transition-all outline-none"
                       >
                          <option value="monthly">Lương tháng</option>
                          <option value="daily">Lương ngày</option>
                          <option value="product">Lương sản phẩm</option>
                       </select>
                    </div>
                    <div className="space-y-2 group">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Mức lương cơ bản (VND)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-primary-500 group-focus-within:text-white transition-colors z-10" size={18} />
                          <input
                            type="number"
                            value={formData.baseSalary}
                            onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                            className="w-full bg-primary-900 text-white border-none rounded-2xl md:rounded-3xl py-4 md:py-5 pl-14 pr-8 text-lg md:text-xl font-black transition-all shadow-xl shadow-primary-900/20 focus:ring-4 focus:ring-primary-500/10 outline-none"
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 space-y-6 md:space-y-10">
              <div className="bg-primary-900 rounded-[40px] p-8 md:p-10 text-white relative overflow-hidden group shadow-2xl shadow-primary-900/20 animate-in slide-in-from-right-4 duration-500">
                 <div className="absolute top-0 right-0 p-10 opacity-10 blur-2xl group-hover:opacity-20 transition-all">
                    <ShieldCheck size={160} />
                 </div>
                 <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 italic">System Security</h4>
                 <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                       <p className="text-xl md:text-2xl font-black tracking-tight italic">Tài khoản</p>
                       <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate max-w-[140px] md:max-w-none">{employee.hasAccount ? employee.account?.email : 'Chưa cấp'}</p>
                    </div>
                    {employee.hasAccount ? (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#E8F5E9]/10 text-[#E8F5E9] rounded-full text-[10px] font-black uppercase border border-[#E8F5E9]/20">
                         <ShieldCheck size={14} /> ACTIVE
                      </div>
                    ) : (
                      <span className="text-[10px] font-black text-rose-400 uppercase px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full">NO ACCESS</span>
                    )}
                 </div>

                 {employee.hasAccount ? (
                    <button
                      onClick={() => router.push(`/hr/users/${employee.account?.id}`)}
                      className="w-full py-4 md:py-5 bg-white/5 hover:bg-white hover:text-primary-900 rounded-[20px] md:rounded-full border border-white/10 font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 backdrop-blur-md active:scale-95 min-h-[50px] shadow-lg"
                    >
                       Quản trị bảo mật <ChevronRight size={14} />
                    </button>
                 ) : (
                    <button className="w-full py-4 md:py-5 bg-primary-600 hover:bg-primary-500 text-white rounded-[20px] md:rounded-full font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 min-h-[50px] border border-primary-400">
                       Cấp khóa truy cập <Lock size={14} />
                    </button>
                 )}
              </div>

              <div className="bg-white rounded-[40px] p-8 md:p-10 border border-gray-100 shadow-xl shadow-gray-200/10 transition-shadow hover:shadow-2xl">
                 <header className="flex items-center justify-between mb-8">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Lịch sử nâng lương</h4>
                    <History size={16} className="text-gray-300" />
                 </header>
                 <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-gray-100">
                    {history.length > 0 ? history.map((log: any, idx: number) => (
                      <div key={idx} className="relative group">
                         <div className="absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-primary-500 shadow-sm z-10 group-hover:scale-125 transition-transform" />
                         <p className="text-[10px] font-black uppercase text-primary-900 tracking-tight italic mb-1">{new Date(log.created_at).toLocaleDateString()}</p>
                         <p className="text-[11px] font-bold text-gray-400 leading-relaxed uppercase tracking-tighter">
                            {log.change_type === 'salary_update' ? 'Mức lương' : 'Chuyển bộ phận'}
                         </p>
                         <p className="text-[9px] font-black text-primary-600 mt-1 uppercase tracking-widest truncate">{log.new_value}</p>
                      </div>
                    )) : (
                      <div className="flex flex-col items-center gap-3 py-6 text-gray-300 opacity-50 italic">
                         <Clock size={32} />
                         <p className="text-[10px] font-black uppercase tracking-widest">Không có mốc thay đổi</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-6 md:hidden bg-white/80 backdrop-blur-xl z-40 border-t border-gray-100 shadow-[0_-8px_40px_rgba(0,0,0,0.05)] flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-500 text-primary-900">
           <button
             onClick={handleDelete}
             className="w-16 h-16 bg-[#FFEBEE] text-[#C62828] rounded-[24px] flex items-center justify-center active:scale-95 shadow-lg border border-[#FFCDD2]"
           >
              <Trash2 size={24} />
           </button>
           <button
             onClick={handleSave}
             disabled={saving}
             className="flex-1 h-16 bg-primary-600 text-white rounded-[24px] font-black uppercase text-[12px] tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-primary-200"
           >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Lưu hồ sơ
           </button>
        </div>
      </div>
    </div>
  );
}
