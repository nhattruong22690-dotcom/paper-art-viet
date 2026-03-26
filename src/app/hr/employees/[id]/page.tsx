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
  Briefcase,
  Calendar,
  Mail,
  Building2,
  Key,
  Users
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

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
        salaryType: data.salaryType || 'monthly',
        baseSalary: data.baseSalary || 0
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
        showToast('success', 'Đã cập nhật hồ sơ thành công');
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
    const isConfirmed = await confirm("Hồ sơ này sẽ bị xóa vĩnh viễn khỏi hệ thống. Bạn có chắc chắn?");
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
      <div className="py-40 flex flex-col items-center gap-4 text-muted-foreground animate-in fade-in">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-xs font-bold uppercase tracking-widest">Đang tải dữ liệu hồ sơ...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="py-40 text-center space-y-6 animate-in fade-in">
        <AlertCircle className="mx-auto text-rose-500" size={48} />
        <h2 className="text-xl font-bold text-foreground">Không tìm thấy hồ sơ nhân viên</h2>
        <button onClick={() => router.push('/hr/employees')} className="btn-secondary h-11 px-8 rounded-xl shadow-sm">
           Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="card !flex-col md:!flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => router.push('/hr/employees')}
             className="w-10 h-10 border border-border rounded-xl flex items-center justify-center text-muted-foreground hover:bg-gray-50 transition-all active:scale-95"
           >
              <ArrowLeft size={18} />
           </button>
           <div>
              <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                <Users size={12} />
                <span>Nhân sự</span>
                <ChevronRight size={10} />
                <span className="text-primary">Chi tiết nhân sự</span>
              </nav>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Hồ sơ: <span className="text-primary">{formData.name}</span>
              </h1>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <button
             onClick={handleDelete}
             className="w-11 h-11 bg-white border border-border rounded-xl flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95 shadow-sm"
             title="Xóa hồ sơ"
           >
              <Trash2 size={18} />
           </button>
           <button
             onClick={handleSave}
             disabled={saving}
             className="btn-primary h-11 px-8 rounded-xl shadow-lg shadow-primary/20 flex-1 md:flex-none flex items-center justify-center gap-2"
           >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Lưu thay đổi
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
         {/* Main Content */}
         <div className="lg:col-span-8 space-y-6">
            <div className="card !p-0 overflow-hidden shadow-sm">
               <div className="bg-gray-50 border-b border-border px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                     <User size={18} />
                  </div>
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Thông tin cơ bản</h3>
               </div>
               
               <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Họ và Tên</label>
                     <input
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       className="form-input !text-base font-bold"
                       placeholder="Nguyễn Văn A"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Số điện thoại</label>
                     <input
                       value={formData.phone}
                       onChange={(e) => setFormData({...formData, phone: e.target.value})}
                       className="form-input !text-base font-bold"
                       placeholder="0xxx xxx xxx"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Số CCCD / Passport</label>
                     <input
                       value={formData.idCard}
                       onChange={(e) => setFormData({...formData, idCard: e.target.value})}
                       className="form-input !text-base font-bold tracking-wider"
                       placeholder="Số định danh..."
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email liên hệ</label>
                     <input
                       value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})}
                       className="form-input !text-base font-bold"
                       placeholder="email@example.com"
                     />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Địa chỉ thường trú</label>
                     <input
                       value={formData.address}
                       onChange={(e) => setFormData({...formData, address: e.target.value})}
                       className="form-input !text-base font-medium"
                       placeholder="Địa chỉ cụ thể..."
                     />
                  </div>
               </div>
            </div>

            <div className="card !p-0 overflow-hidden shadow-sm">
               <div className="bg-gray-50 border-b border-border px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                     <DollarSign size={18} />
                  </div>
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Chế độ Đãi ngộ</h3>
               </div>
               
               <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Hình thức trả lương</label>
                     <select
                       value={formData.salaryType}
                       onChange={(e) => setFormData({...formData, salaryType: e.target.value})}
                       className="form-input !text-sm font-bold appearance-none bg-white"
                     >
                        <option value="monthly">Lương tháng (Cố định)</option>
                        <option value="daily">Lương ngày (Công nhật)</option>
                        <option value="product">Theo sản lượng (Khoán)</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Mức lương cơ bản (VND)</label>
                     <input
                       type="number"
                       value={formData.baseSalary}
                       onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                       className="form-input !text-xl font-black text-primary tracking-tight"
                       placeholder="0"
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar Status & History */}
         <div className="lg:col-span-4 space-y-6">
            <div className="card !p-6 bg-gray-900 text-white border-none shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ShieldCheck size={120} />
               </div>
               
               <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-6">Trạng thái Hệ thống</h4>
               
               <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className={cn(
                        "w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]",
                        formData.status === 'active' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
                     )} />
                     <p className="font-bold text-lg tracking-tight uppercase">
                        {formData.status === 'active' ? 'Đang hoạt động' : 'Đã khóa hồ sơ'}
                     </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                     <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Tài khoản liên kết</p>
                     <p className="text-sm font-medium text-white/80 flex items-center gap-2">
                        <Mail size={14} className="opacity-40" />
                        {employee.hasAccount ? employee.account?.email : 'Chưa có tài khoản'}
                     </p>
                  </div>

                  <button
                    onClick={() => employee.hasAccount && router.push(`/hr/users/${employee.account?.id}`)}
                    className="w-full h-11 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest transition-all mt-4 border border-white/10"
                  >
                     {employee.hasAccount ? 'Quản trị bảo mật' : 'Cấp quyền truy cập'}
                     <ChevronRight size={14} />
                  </button>
               </div>
            </div>

            <div className="card !p-6 shadow-sm">
               <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Nhật ký biến động</h4>
                  <History size={16} className="text-muted-foreground/30" />
               </div>
               
               <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {history.length > 0 ? history.map((log: any, idx: number) => (
                    <div key={idx} className="relative pl-8">
                       <div className="absolute left-1 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-primary shadow-sm z-10" />
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight mb-1">{new Date(log.created_at).toLocaleDateString('vi-VN')}</p>
                       <p className="text-xs font-bold text-foreground leading-snug">
                          {log.change_type === 'salary_update' ? 'Điều chỉnh đãi ngộ' : 'Thay đổi phân công'}
                       </p>
                       <p className="text-[10px] font-bold text-primary mt-1 uppercase">{log.new_value}</p>
                    </div>
                  )) : (
                    <div className="py-8 text-center space-y-3 opacity-20">
                       <Clock size={32} className="mx-auto" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">Chưa có lịch sử</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
