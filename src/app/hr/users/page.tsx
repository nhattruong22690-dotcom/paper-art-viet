"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  User, 
  Search, 
  Filter, 
  Plus, 
  Loader2, 
  Edit3, 
  X, 
  Clock,
  ChevronRight,
  UserCheck,
  ChevronDown,
  Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';

// Simple cn utility since @/lib/utils might be missing
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UsersPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const [users, setUsers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'User',
    employeeId: '',
    name: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('error', 'Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/hr/employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
       console.error('Failed to load employees:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchEmployees();
  }, []);

  const handleCreateUser = async () => {
    if (!formData.email || !formData.password) {
      showToast('warning', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      showToast('success', 'Đã tạo tài khoản thành công');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', role: 'User', employeeId: '', name: '' });
      fetchUsers();
    } catch (err: any) {
      showToast('error', `Lỗi: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <ShieldCheck size={28} className="text-black" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-black tracking-tight uppercase italic">Quản trị Tài khoản</h1>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">Identity Management & Access Control Layer</p>
           </div>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary h-14 px-10 text-xs uppercase tracking-widest gap-4"
        >
          <Plus size={20} strokeWidth={3} /> Cấp tài khoản mới
        </button>
      </header>

      {/* SEARCH/FILTER */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group/field">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="Tìm theo email hoặc tên nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-14 h-16 font-black"
          />
        </div>
        <button className="btn-secondary h-16 px-10 text-[10px] uppercase tracking-[0.2em] gap-3">
           <Filter size={20} strokeWidth={3} /> Bộ lọc
        </button>
      </div>

      <div className="neo-card !p-0 overflow-hidden">
        {loading ? (
          <div className="py-32 flex flex-col items-center gap-6">
             <Loader2 size={40} className="animate-spin text-black opacity-20" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Syncing security principal ledger...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black text-[10px] font-black text-neo-purple uppercase tracking-widest">
                  <th className="px-8 py-5 border-b-2 border-black">Tài khoản</th>
                  <th className="px-8 py-5 border-b-2 border-black">Nhân viên liên kết</th>
                  <th className="px-8 py-5 text-center border-b-2 border-black">Quyền hạn</th>
                  <th className="px-8 py-5 text-center border-b-2 border-black">Trạng thái</th>
                  <th className="px-8 py-5 text-right border-b-2 border-black w-24"></th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/5">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-neo-purple/5 transition-all group">
                    <td className="px-8 py-6 cursor-pointer" onClick={() => user.id && router.push(`/hr/users/${user.id}`)}>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-black/20 group-hover:bg-black group-hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none">
                             <Mail size={18} strokeWidth={3} />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-black text-black group-hover:text-neo-purple transition-colors italic underline underline-offset-4 decoration-black/10">{user.email}</span>
                             <span className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1 flex items-center gap-2 tabular-nums">
                                <Clock size={12} strokeWidth={3} /> {user.last_login ? new Date(user.last_login).toLocaleDateString('vi-VN') : 'NEVER RECORDED'}
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6 cursor-pointer" onClick={() => user.employee_id && router.push(`/hr/employees/${user.employee_id}`)}>
                       <div className="space-y-1">
                          <p className="font-black text-black uppercase italic tracking-tight group-hover:text-neo-purple transition-colors">{user.employeeName || 'UNLINKED PRINCIPAL'}</p>
                          <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">{(user.employeeCode || 'NO-ID')}</p>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className={cn(
                         "px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg border-2 border-black flex items-center justify-center gap-2 w-fit mx-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic",
                         user.role === 'Admin' ? 'bg-neo-red/20 text-black' : 'bg-neo-purple/20 text-black'
                       )}>
                         <ShieldCheck size={12} strokeWidth={3} /> {user.role}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                       {user.is_active ? 
                         <span className="px-4 py-1.5 bg-neo-green/20 text-black border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic">Active</span> :
                         <span className="px-4 py-1.5 bg-neo-red/20 text-black border-2 border-black rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic">Locked</span>
                       }
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                         onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                         className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black/20 hover:text-black hover:bg-black/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
                       >
                          <Edit3 size={18} strokeWidth={3} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !submitting && setShowCreateModal(false)} />
           <div className="relative w-full max-w-xl bg-white border-neo border-black rounded-xl shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300 overflow-hidden">
              <header className="p-8 border-b-2 border-black flex justify-between items-center bg-neo-purple/10">
                 <div>
                    <h3 className="text-2xl font-black text-black tracking-tight uppercase italic">Cấp Tài khoản Mới</h3>
                    <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em] mt-1">Hệ thống vận hành PAV • IAM v4.0</p>
                 </div>
                 <button 
                   onClick={() => setShowCreateModal(false)} 
                   className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center text-black hover:bg-neo-red transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                 >
                    <X size={24} strokeWidth={3} />
                 </button>
              </header>

              <div className="p-10 space-y-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Email / Tên đăng nhập</label>
                    <div className="relative group/field">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                      <input 
                        type="text"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="nhanvien@paperartviet.com"
                        className="form-input pl-12 h-14 font-black"
                      />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Mật khẩu bảo mật</label>
                    <div className="relative group/field">
                      <ShieldCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" />
                      <input 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="••••••••"
                        className="form-input pl-12 h-14 font-black tabular-nums"
                      />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Quyền hạn (Role)</label>
                       <div className="relative group/field">
                         <select 
                           value={formData.role}
                           onChange={(e) => setFormData({...formData, role: e.target.value})}
                           className="form-input h-14 appearance-none cursor-pointer uppercase text-xs font-black italic tracking-widest pr-10"
                         >
                            <option value="User">Standard User</option>
                            <option value="Production">Production Line</option>
                            <option value="Warehouse">Logistics Master</option>
                            <option value="Sales">Sales Executive</option>
                            <option value="Supervisor">Shift Supervisor</option>
                            <option value="Admin">System Admin</option>
                         </select>
                         <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-black/40 uppercase tracking-widest ml-1">Nhân sự liên kết</label>
                       <div className="relative group/field">
                         <select 
                           value={formData.employeeId}
                           onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                           className="form-input h-14 appearance-none cursor-pointer uppercase text-xs font-black italic tracking-widest pr-10"
                         >
                            <option value="">Chọn nhân viên...</option>
                            {employees.map(emp => (
                               <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                         </select>
                         <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t font-black text-black/40 text-[9px] uppercase tracking-[0.2em] italic flex items-center gap-3">
                    <Info size={16} strokeWidth={3} />
                    Granting access creates a persistent principal in the security database.
                 </div>

                 <button 
                   onClick={handleCreateUser}
                   disabled={submitting}
                   className="btn-primary btn-confirm-flash w-full h-16 text-xs uppercase tracking-[0.3em] gap-4"
                 >
                    {submitting ? <Loader2 className="animate-spin" size={24} /> : <UserCheck size={24} strokeWidth={3} />}
                    Xác nhận Cấp quyền
                 </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
