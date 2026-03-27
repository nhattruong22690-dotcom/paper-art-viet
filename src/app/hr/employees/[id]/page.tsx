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
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="neo-card !p-8 !flex-col md:!flex-row justify-between items-start md:items-center gap-6 bg-neo-purple/10 shadow-neo">
        <div className="flex items-center gap-6">
           <button 
             onClick={() => router.push('/hr/employees')}
             className="w-12 h-12 bg-white border-neo border-black rounded-xl flex items-center justify-center text-black hover:bg-neo-yellow shadow-neo-active hover:shadow-neo transition-all"
           >
              <ArrowLeft size={24} strokeWidth={3} />
           </button>
           <div>
              <nav className="flex items-center gap-2 text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-2">
                <Users size={14} strokeWidth={3} />
                <span>Nhân sự</span>
                <ChevronRight size={12} strokeWidth={3} />
                <span className="text-purple-600 bg-white px-2 py-0.5 rounded-lg border border-black/10 text-[9px]">Chi tiết hồ sơ</span>
              </nav>
              <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase font-space">
                Hồ sơ: <span className="text-purple-500 bg-white border-neo border-black px-3 py-1 -rotate-1 inline-block shadow-neo-active">{formData.name}</span>
              </h1>
           </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
           <button
             onClick={handleDelete}
             className="w-14 h-14 bg-neo-red border-neo border-black rounded-xl flex items-center justify-center text-black shadow-neo-active hover:shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
             title="Xóa hồ sơ"
           >
              <Trash2 size={24} strokeWidth={2.5} />
           </button>
           <button
             onClick={handleSave}
             disabled={saving}
             className="btn-primary !h-14 px-10 shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex-1 md:flex-none"
           >
              {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} strokeWidth={3} />}
              <span className="font-space uppercase tracking-widest text-sm ml-2">Lưu thay đổi</span>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         {/* Main Content */}
         <div className="lg:col-span-8 space-y-8">
            <div className="neo-card !p-0 overflow-hidden shadow-neo bg-white">
               <div className="bg-neo-mint border-b-neo border-black px-8 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border-neo border-black rounded-xl flex items-center justify-center shadow-neo-active">
                     <User size={20} strokeWidth={3} />
                  </div>
                  <h3 className="font-bold text-black text-sm uppercase tracking-widest font-space">Thông tin cơ bản</h3>
               </div>
               
               <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Họ và Tên nhân viên</label>
                     <input
                       value={formData.name}
                       onChange={(e) => setFormData({...formData, name: e.target.value})}
                       className="form-input !h-14 !text-lg font-bold uppercase"
                       placeholder="NGUYỄN VĂN A"
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Số điện thoại liên lạc</label>
                     <input
                       value={formData.phone}
                       onChange={(e) => setFormData({...formData, phone: e.target.value})}
                       className="form-input !h-14 !text-lg font-bold"
                       placeholder="0XXX XXX XXX"
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Số CCCD / Passport</label>
                     <input
                       value={formData.idCard}
                       onChange={(e) => setFormData({...formData, idCard: e.target.value})}
                       className="form-input !h-14 !text-lg font-bold tracking-widest"
                       placeholder="SỐ ĐỊNH DANH..."
                     />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Hộp thư điện tử (Email)</label>
                     <input
                       value={formData.email}
                       onChange={(e) => setFormData({...formData, email: e.target.value})}
                       className="form-input !h-14 !text-lg font-bold uppercase"
                       placeholder="EMAIL@EXAMPLE.COM"
                     />
                  </div>
                  <div className="md:col-span-2 space-y-3">
                     <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Địa chỉ thường trú</label>
                     <input
                       value={formData.address}
                       onChange={(e) => setFormData({...formData, address: e.target.value})}
                       className="form-input !h-14 !text-base font-bold uppercase"
                       placeholder="ĐỊA CHỈ THƯỜNG TRÚ CỤ THỂ..."
                     />
                  </div>
               </div>
            </div>

            <div className="neo-card !p-0 overflow-hidden shadow-neo bg-white">
               <div className="bg-neo-yellow border-b-neo border-black px-8 py-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border-neo border-black rounded-xl flex items-center justify-center shadow-neo-active">
                     <DollarSign size={20} strokeWidth={3} />
                  </div>
                  <h3 className="font-bold text-black text-sm uppercase tracking-widest font-space">Chế độ Đãi ngộ & Lương</h3>
               </div>
               
               <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Hình thức chi trả</label>
                     <select
                       value={formData.salaryType}
                       onChange={(e) => setFormData({...formData, salaryType: e.target.value})}
                       className="form-input !h-14 !text-sm font-black uppercase appearance-none bg-white cursor-pointer"
                     >
                        <option value="monthly">Lương tháng (Cố định)</option>
                        <option value="daily">Lương ngày (Công nhật)</option>
                        <option value="product">Theo sản lượng (Khoán)</option>
                     </select>
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Mức lương cơ bản (VND)</label>
                     <input
                       type="number"
                       value={formData.baseSalary}
                       onChange={(e) => setFormData({...formData, baseSalary: Number(e.target.value)})}
                       className="form-input !h-14 !text-2xl font-black text-purple-600 tracking-tight"
                       placeholder="0"
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* Sidebar Status & History */}
         <div className="lg:col-span-4 space-y-8">
            <div className="neo-card !p-8 bg-black text-white shadow-neo relative overflow-hidden group border-neo border-black">
               <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-20 transition-all duration-700 pointer-events-none translate-x-10 -translate-y-10 group-hover:translate-x-4 group-hover:-translate-y-4">
                  <ShieldCheck size={180} />
               </div>
               
               <h4 className="text-[10px] font-black text-neo-yellow uppercase tracking-[0.3em] mb-10">Bảo mật hệ thống</h4>
               
               <div className="space-y-10 relative z-10">
                  <div className="flex items-center gap-5">
                     <div className={cn(
                        "w-5 h-5 rounded-full border-4 border-black shadow-neo-active",
                        formData.status === 'active' ? 'bg-neo-mint' : 'bg-neo-red'
                     )} />
                     <p className="font-black text-2xl tracking-tighter uppercase font-space">
                        {formData.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                     </p>
                  </div>

                  <div className="space-y-3 pt-6 border-t-2 border-dashed border-white/20">
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tài khoản liên kết</p>
                     <p className="text-sm font-bold text-neo-purple flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                        <Mail size={16} strokeWidth={2.5} className="opacity-40" />
                        {employee.hasAccount ? employee.account?.email : 'CHƯA CÓ TÀI KHOẢN'}
                     </p>
                  </div>

                  <button
                    onClick={() => employee.hasAccount && router.push(`/hr/users/${employee.account?.id}`)}
                    className="w-full h-14 bg-white text-black rounded-xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-widest transition-all mt-4 border-neo border-black shadow-neo-active hover:shadow-neo hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                     <Lock size={16} strokeWidth={3} />
                     {employee.hasAccount ? 'Quản trị bảo mật' : 'Cấp quyền truy cập'}
                     <ChevronRight size={16} strokeWidth={3} />
                  </button>
               </div>
            </div>

            <div className="neo-card !p-8 shadow-neo bg-white">
               <div className="flex items-center justify-between mb-10 pb-6 border-b-2 border-dashed border-black/10">
                  <h4 className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">Nhật ký biến động</h4>
                  <History size={20} strokeWidth={3} className="text-black/20" />
               </div>
               
               <div className="space-y-10 relative before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[3px] before:bg-black/5">
                  {history.length > 0 ? history.map((log: any, idx: number) => (
                    <div key={idx} className="relative pl-10 group">
                       <div className="absolute left-0 top-1.5 w-7 h-7 rounded-lg bg-white border-neo border-black shadow-neo-active z-10 flex items-center justify-center group-hover:bg-neo-yellow transition-colors">
                          <Clock size={14} strokeWidth={3} />
                       </div>
                       <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">{new Date(log.created_at).toLocaleDateString('vi-VN')}</p>
                       <p className="text-sm font-black text-black leading-snug uppercase font-space">
                          {log.change_type === 'salary_update' ? 'Điều chỉnh đãi ngộ' : 'Thay đổi phân công'}
                       </p>
                       <p className="text-[10px] font-black text-purple-600 mt-2 uppercase bg-neo-purple/10 px-2 py-1 rounded inline-block border border-purple-200">{log.new_value}</p>
                    </div>
                  )) : (
                    <div className="py-12 text-center space-y-6 opacity-10">
                       <Clock size={48} strokeWidth={1} className="mx-auto" />
                       <p className="text-[10px] font-black uppercase tracking-[0.4em]">Trắng dữ liệu nhật ký</p>
                    </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
