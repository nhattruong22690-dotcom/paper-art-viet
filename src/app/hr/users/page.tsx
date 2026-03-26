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
  Lock, 
  X, 
  Clock,
  ChevronRight,
  UserCheck,
  ChevronDown
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="card !flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shadow-sm">
              <ShieldCheck size={24} />
           </div>
           <div>
              <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                <span>Trạm PAV</span>
                <ChevronRight size={10} />
                <span className="text-primary">Quản trị Tài khoản</span>
              </nav>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Danh mục Tài khoản</h1>
           </div>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="btn-primary gap-2"
        >
          <Plus size={18} /> Cấp tài khoản mới
        </button>
      </header>

      {/* SEARCH/FILTER */}
      <div className="card !p-4 flex flex-col md:flex-row gap-4 relative z-10">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo email hoặc tên nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-10 h-10 bg-gray-50/20"
          />
        </div>
      </div>

      <div className="card !p-0 overflow-hidden relative">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-muted-foreground">
             <Loader2 size={40} className="animate-spin text-primary" />
             <p className="text-[11px] font-bold uppercase tracking-widest animate-pulse">Đang tải danh sách tài khoản...</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10 text-sm">
            <table className="!mt-0">
              <thead>
                <tr>
                  <th>Tài khoản</th>
                  <th>Nhân viên liên kết</th>
                  <th className="text-center">Quyền hạn</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-6 py-5 cursor-pointer" onClick={() => user.id && router.push(`/hr/users/${user.id}`)}>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                             <Mail size={18} />
                          </div>
                          <div className="flex flex-col">
                             <span className="font-bold text-foreground group-hover:text-primary transition-colors">{user.email}</span>
                             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 flex items-center gap-1 opacity-60">
                                <Clock size={10} /> Truy cập: {user.last_login ? new Date(user.last_login).toLocaleDateString('vi-VN') : '---'}
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="px-6 py-5 cursor-pointer" onClick={() => user.employee_id && router.push(`/hr/employees/${user.employee_id}`)}>
                       <div className="space-y-1">
                          <p className="font-bold text-foreground group-hover:text-primary transition-colors">{user.employeeName || 'Vô danh'}</p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{(user.employeeCode || 'NO-ID')}</p>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                       <span className={user.role === 'Admin' ? 'badge-error' : 'badge-success !bg-blue-50 !text-blue-600 !border-blue-100'}>
                         <ShieldCheck size={12} className="mr-1 inline" /> {user.role}
                       </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                       {user.is_active ? 
                         <span className="badge-success">Đang hoạt động</span> :
                         <span className="badge-error">Bị khóa</span>
                       }
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button 
                         onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                         className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                       >
                          <Edit3 size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards Ledger Style - Standardized */}
            <div className="md:hidden divide-y divide-border">
               {filteredUsers.map(user => (
                  <div key={user.id} className="p-6 space-y-4">
                     <div className="flex items-start justify-between">
                        <div 
                          className="flex items-center gap-4 flex-1 min-w-0"
                          onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                        >
                           <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-500 shrink-0">
                              <Mail size={18} />
                           </div>
                           <div className="flex flex-col min-w-0">
                              <span className="font-bold text-foreground text-sm truncate uppercase">{user.email}</span>
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{user.role}</span>
                           </div>
                        </div>
                        <button 
                          onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                          className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-primary transition-all"
                        >
                           <ChevronRight size={20} />
                        </button>
                     </div>

                     <div className="flex items-center justify-between">
                        <div 
                           className="flex flex-col"
                           onClick={() => user.employee_id && router.push(`/hr/employees/${user.employee_id}`)}
                        >
                           <span className="text-xs font-bold text-foreground flex items-center gap-2">
                              <User size={12} className="text-primary" /> {user.employeeName || 'Bất định'}
                           </span>
                        </div>

                        <div className="shrink-0">
                           {user.is_active ? 
                               <span className="badge-success text-[8px]">Hoạt động</span> :
                               <span className="badge-error text-[8px]">Khóa</span>
                           }
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="py-40 text-center text-retro-earth/30 italic uppercase font-black text-xs tracking-[0.5em] font-typewriter">
                 Hồ sơ không tìm thấy
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submitting && setShowCreateModal(false)} />
           <div className="relative w-full max-w-lg card !p-0 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="p-8">
                <header className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-xl font-bold text-foreground">Cấp Tài khoản Mới</h3>
                      <p className="text-xs text-muted-foreground mt-1">Ghi danh nhân sự vào hệ thống hệ thống vận hành PAV</p>
                   </div>
                   <button onClick={() => setShowCreateModal(false)} className="p-2 text-gray-400 hover:text-foreground transition-all">
                      <X size={20} />
                   </button>
                </header>

                <div className="space-y-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Email / Tên đăng nhập</label>
                      <input 
                        type="text"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="nhanvien@paperartviet.com"
                        className="form-input h-11"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Mật khẩu bảo mật</label>
                      <input 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Nhập mật khẩu truy cập..."
                        className="form-input h-11"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Quyền hạn (Role)</label>
                         <select 
                           value={formData.role}
                           onChange={(e) => setFormData({...formData, role: e.target.value})}
                           className="form-input h-11"
                         >
                            <option value="User">User</option>
                            <option value="Production">Sản xuất</option>
                            <option value="Warehouse">Kho vận</option>
                            <option value="Sales">Sales</option>
                            <option value="Supervisor">Giám sát</option>
                            <option value="Admin">Admin</option>
                         </select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Nhân sự liên kết</label>
                         <select 
                           value={formData.employeeId}
                           onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                           className="form-input h-11"
                         >
                            <option value="">Chọn nhân viên...</option>
                            {employees.map(emp => (
                               <option key={emp.id} value={emp.id}>{emp.name}</option>
                            ))}
                         </select>
                      </div>
                   </div>

                   <div className="pt-6">
                      <button 
                        onClick={handleCreateUser}
                        disabled={submitting}
                        className="btn-primary w-full h-12 flex items-center justify-center gap-2"
                      >
                         {submitting ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} />}
                         Xác nhận Cấp quyền
                      </button>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
