"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  User, 
  ArrowLeft, 
  Save, 
  Trash2, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Phone, 
  CreditCard,
  DollarSign,
  History,
  AlertCircle,
  Loader2,
  Lock,
  ChevronRight,
  Pin
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
        showToast('success', 'Kho lưu trữ đã được cập nhật');
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
    const isConfirmed = await confirm("Hồ sơ này sẽ bị tiêu hủy vĩnh viễn. Tiếp tục?");
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/hr/employees/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Đã tiêu hủy hồ sơ');
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
      <div className="py-40 flex flex-col items-center gap-4 text-retro-sepia animate-pulse italic">
        <Loader2 className="animate-spin text-retro-brick" size={48} />
        <p className="font-typewriter text-[12px] font-black uppercase tracking-[0.3em]">Đang giải mã hồ sơ...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="py-40 text-center space-y-6">
        <AlertCircle className="mx-auto text-retro-brick" size={64} />
        <h2 className="text-2xl font-typewriter font-black uppercase text-retro-sepia italic">Thư mục trống</h2>
        <button onClick={() => router.push('/hr/employees')} className="retro-btn">Quay lại</button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'text-retro-moss';
      case 'pending': return 'text-retro-mustard';
      default: return 'text-retro-brick';
    }
  };

  return (
    <div className="min-h-screen bg-retro-paper px-4 md:px-0 pb-40 md:pb-20">
      <div className="max-w-6xl mx-auto space-y-12 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        
        {/* TOP CONTROLS */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="w-full">
             <button
               onClick={() => router.push('/hr/employees')}
               className="flex items-center gap-2 font-typewriter text-[10px] font-black text-retro-sepia hover:text-retro-brick uppercase tracking-widest transition-all mb-8 group"
             >
                <ArrowLeft size={16} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
                Về kho lưu trữ
             </button>
             
             <div className="flex flex-col md:flex-row md:items-center gap-8">
                {/* POLAROID PHOTO */}
                <div className="relative group shrink-0">
                  <div className="washi-tape-top" />
                  <div className="w-32 h-32 md:w-40 md:h-40 bg-white p-2 border border-retro-sepia/10 shadow-2xl transform -rotate-2 hover:rotate-0 transition-all duration-500">
                    <div className="w-full h-full bg-retro-paper/20 border-2 border-retro-sepia/5 flex items-center justify-center text-retro-sepia/10 overflow-hidden">
                      <User size={64} strokeWidth={1} />
                    </div>
                  </div>
                  <Pin className="absolute -top-4 -right-2 text-retro-brick drop-shadow-md rotate-45" size={20} fill="currentColor" />
                </div>

                <div className="min-w-0">
                   <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "font-typewriter text-[10px] font-black uppercase tracking-widest px-3 py-1 border border-current italic",
                        getStatusColor(formData.status)
                      )}>
                        {formData.status === 'active' ? 'ĐANG LÀM VIỆC' : 'TẠM KHÓA'}
                      </span>
                   </div>
                   <h1 className="text-4xl md:text-6xl font-typewriter font-black text-retro-sepia tracking-tighter uppercase italic leading-tight mb-2">
                     {formData.name}
                   </h1>
                   <div className="flex flex-wrap items-center gap-6">
                      <span className="font-typewriter text-[12px] font-black text-retro-brick uppercase tracking-widest">
                        CODE: {formData.employeeCode}
                      </span>
                      <span className="font-handwriting text-lg text-retro-earth flex items-center gap-2">
                        <MapPin size={16} strokeWidth={1.5} /> {formData.department} / {formData.position}
                      </span>
                   </div>
                </div>
             </div>
          </div>

          <div className="hidden md:flex items-center gap-6 shrink-0 pb-1">
             <button
               onClick={handleDelete}
               className="p-4 border-2 border-retro-brick/20 text-retro-brick/30 hover:bg-retro-brick hover:text-white transition-all active:scale-95"
             >
                <Trash2 size={24} strokeWidth={1.5} />
             </button>
             <button
               onClick={handleSave}
               disabled={saving}
               className="retro-btn bg-retro-sepia text-white min-w-[200px]"
             >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} strokeWidth={1.5} />}
                Cập nhật hồ sơ
             </button>
          </div>
        </header>

        {/* MAIN FORM GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           <div className="lg:col-span-8 space-y-12">
              
              {/* PRIMARY DETAILS */}
              <div className="retro-card !bg-white/80 p-10 md:p-14">
                 <div className="washi-tape-top" />
                 <header className="flex items-center gap-4 mb-12 border-b-2 border-retro-sepia/5 pb-6">
                    <User size={24} strokeWidth={1.5} className="text-retro-brick" />
                    <h2 className="text-2xl font-typewriter font-black uppercase text-retro-sepia italic tracking-tight">Hồ sơ <span className="text-retro-brick">Cá nhân</span></h2>
                 </header>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia/60 uppercase tracking-[0.2em]">Họ và Tên (Typewritten)</label>
                       <input
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full bg-transparent border-b-2 border-retro-sepia/10 py-4 text-lg font-typewriter font-bold focus:border-retro-sepia outline-none transition-all uppercase"
                       />
                    </div>
                    <div className="space-y-4">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia/60 uppercase tracking-[0.2em]">Số điện thoại liên lạc</label>
                       <div className="relative">
                          <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-retro-sepia/20" size={18} strokeWidth={1.5} />
                          <input
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            className="w-full bg-transparent border-b-2 border-retro-sepia/10 py-4 pl-10 text-lg font-typewriter font-bold focus:border-retro-sepia outline-none transition-all"
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia/60 uppercase tracking-[0.2em]">Số Căn cước công dân</label>
                       <div className="relative">
                          <CreditCard className="absolute left-0 top-1/2 -translate-y-1/2 text-retro-sepia/20" size={18} strokeWidth={1.5} />
                          <input
                            value={formData.idCard}
                            onChange={(e) => setFormData({...formData, idCard: e.target.value})}
                            className="w-full bg-transparent border-b-2 border-retro-sepia/10 py-4 pl-10 text-lg font-typewriter font-bold focus:border-retro-sepia outline-none transition-all tracking-[0.1em]"
                          />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia/60 uppercase tracking-[0.2em]">Địa chỉ thường trú</label>
                       <div className="relative">
                          <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 text-retro-sepia/20" size={18} strokeWidth={1.5} />
                          <input
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                            className="w-full bg-transparent border-b-2 border-retro-sepia/10 py-4 pl-10 text-base font-serif font-medium focus:border-retro-sepia outline-none transition-all"
                          />
                       </div>
                    </div>
                 </div>
              </div>

              {/* SALARY & COMPENSATION */}
              <div className="retro-card !bg-retro-paper p-10 md:p-14 border-dashed">
                 <header className="flex items-center gap-4 mb-12">
                    <DollarSign size={24} strokeWidth={1.5} className="text-retro-brick" />
                    <h2 className="text-2xl font-typewriter font-black uppercase text-retro-sepia italic tracking-tight">Kế hoạch <span className="text-retro-brick">Lương bổng</span></h2>
                 </header>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia/60 uppercase tracking-[0.2em]">Chế độ thù lao</label>
                       <select
                         value={formData.salaryType}
                         onChange={(e) => setFormData({...formData, salaryType: e.target.value})}
                         className="w-full bg-transparent border-b-2 border-retro-sepia py-4 font-typewriter font-black uppercase outline-none cursor-pointer"
                       >
                          <option value="monthly">Lương tháng (Fixed)</option>
                          <option value="daily">Lương nhật (Daily)</option>
                          <option value="product">Theo sản lượng (Piece)</option>
                       </select>
                    </div>
                    <div className="space-y-4">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia/60 uppercase tracking-[0.2em]">Mức lương định biên (VND)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 text-retro-sepia/20" size={24} strokeWidth={1.5} />
                          <input
                            type="number"
                            value={formData.baseSalary}
                            onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                            className="w-full bg-transparent border-b-2 border-retro-sepia py-4 pl-10 text-3xl font-typewriter font-black text-retro-brick outline-none"
                          />
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* SIDEBAR LOGS */}
           <div className="lg:col-span-4 space-y-10">
              {/* SYSTEM ACCESS */}
              <div className="retro-card !bg-retro-sepia p-8 text-white">
                 <div className="paper-clip" />
                 <h4 className="font-typewriter text-[10px] font-black text-retro-mustard uppercase tracking-widest mb-6 italic opacity-80">Security Protocol v1.0</h4>
                 <div className="space-y-6 mb-10">
                    <div className="space-y-1">
                       <p className="text-2xl font-typewriter font-black tracking-tight italic">Registry User</p>
                       <p className="font-mono text-[11px] text-white/50 uppercase tracking-widest truncate">{employee.hasAccount ? employee.account?.email : 'UNREGISTERED'}</p>
                    </div>
                    {employee.hasAccount ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-retro-moss/20 text-retro-moss border border-retro-moss/30 text-[10px] font-black uppercase italic tracking-widest">
                         <ShieldCheck size={14} strokeWidth={1.5} /> AUTHORIZED
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-retro-brick/20 text-retro-brick border border-retro-brick/30 text-[10px] font-black uppercase italic tracking-widest">LOCKED SYSTEM</span>
                    )}
                 </div>

                 <button
                   onClick={() => employee.hasAccount && router.push(`/hr/users/${employee.account?.id}`)}
                   className="w-full py-4 border-2 border-white/20 hover:bg-white hover:text-retro-sepia font-typewriter font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-3 active:scale-95"
                 >
                    {employee.hasAccount ? 'Quản trị bảo mật' : 'Cấp khóa truy cập'} <ChevronRight size={14} />
                 </button>
              </div>

              {/* SALARY HISTORY CIRCLE */}
              <div className="retro-card !bg-white p-8">
                 <header className="flex items-center justify-between mb-10">
                    <h4 className="font-typewriter text-[10px] font-black text-retro-sepia/50 uppercase tracking-widest italic">Nhật ký biến động</h4>
                    <History size={16} strokeWidth={1.5} className="text-retro-sepia/20" />
                 </header>
                 <div className="relative pl-8 space-y-10 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-retro-sepia/10">
                    {history.length > 0 ? history.map((log: any, idx: number) => (
                      <div key={idx} className="relative group">
                         <div className="absolute -left-[35px] top-1 w-3 h-3 bg-white border-2 border-retro-sepia shadow-sm rotate-45 group-hover:bg-retro-brick transition-all" />
                         <p className="font-typewriter text-[11px] font-black uppercase text-retro-sepia tracking-tight italic mb-2">{new Date(log.created_at).toLocaleDateString()}</p>
                         <p className="font-serif text-[13px] text-retro-earth italic leading-relaxed">
                            {log.change_type === 'salary_update' ? 'Điều chỉnh đãi ngộ' : 'Thay đổi phân công'}
                         </p>
                         <p className="font-typewriter text-[10px] font-black text-retro-brick mt-2 uppercase tracking-widest">{log.new_value}</p>
                      </div>
                    )) : (
                      <div className="py-12 text-center space-y-4 text-retro-sepia/20">
                         <Clock size={32} strokeWidth={1} className="mx-auto" />
                         <p className="font-typewriter text-[10px] font-black uppercase tracking-widest">Chưa có bản ghi</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        {/* MOBILE CTA BAR */}
        <div className="fixed bottom-0 left-0 right-0 p-6 md:hidden bg-retro-paper/90 backdrop-blur-md z-40 border-t-2 border-retro-sepia/10 flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-700">
           <button
             onClick={handleDelete}
             className="w-16 h-16 border-2 border-retro-brick/30 text-retro-brick flex items-center justify-center active:scale-95 bg-white"
           >
              <Trash2 size={24} strokeWidth={1.5} />
           </button>
           <button
             onClick={handleSave}
             disabled={saving}
             className="retro-btn flex-1 h-16 bg-retro-sepia text-white items-center justify-center gap-3 active:scale-95"
           >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} strokeWidth={1.5} />}
              Lưu hồ sơ
           </button>
        </div>
      </div>
    </div>
  );
}
