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
  UserCheck
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
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-32 md:pb-20 px-1 md:px-0 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="px-4 md:px-0">
          <nav className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">
            <span>PAV ERP</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 uppercase">Hệ thống</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight italic uppercase">Quản trị <span className="text-rose-600">Tài khoản</span></h1>
          <p className="text-gray-500 mt-1 uppercase text-[10px] md:text-xs font-bold tracking-widest italic leading-relaxed">Phân quyền & Kiểm soát truy cập hệ thống</p>
        </div>
        <div className="px-4 md:px-0 w-full md:w-auto">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto px-10 py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase text-[11px] tracking-widest hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-gray-200 flex items-center justify-center gap-3"
          >
            <Plus size={18} /> Tạo tài khoản mới
          </button>
        </div>
      </header>

      {/* SEARCH/FILTER */}
      <div className="flex flex-col md:flex-row gap-4 px-4 md:px-0">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo email hoặc tên nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-3xl py-4 md:py-5 pl-14 pr-8 text-sm outline-none focus:ring-4 focus:ring-rose-50 transition-all font-bold tracking-tight uppercase"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] md:rounded-[48px] border border-gray-100 shadow-2xl shadow-gray-100/30 overflow-hidden min-h-[500px] mx-2 md:mx-0">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-gray-400 italic">
             <Loader2 size={40} className="animate-spin text-rose-600" />
             <p className="text-[11px] font-black uppercase tracking-widest text-rose-300 tracking-[0.2em]">Đang đồng bộ dữ liệu bảo mật...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table mapping remains same */}
            <table className="hidden md:table w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tài khoản (Email)</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Chủ sở hữu</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Vai trò</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-rose-50/10 transition-all group">
                    <td className="p-8 cursor-pointer group/link" onClick={() => user.id && router.push(`/hr/users/${user.id}`)}>
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/link:bg-white group-hover/link:shadow-md transition-all">
                             <Mail size={18} />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                             <span className="font-black text-gray-900 tracking-tight text-sm group-hover/link:text-rose-600 truncate">{user.email}</span>
                             <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                <Clock size={8} /> Last login: 1h ago
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="p-8 cursor-pointer group/link" onClick={() => user.employee_id && router.push(`/hr/employees/${user.employee_id}`)}>
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-800 uppercase tracking-tight group-hover/link:text-primary-600 truncate">{user.employeeName || 'N/A'}</span>
                          <span className="text-[10px] font-bold text-primary-500 uppercase tracking-widest mt-1">{user.employeeCode || 'NO-EMPLOYEE'}</span>
                       </div>
                    </td>
                    <td className="p-8 text-center">
                       <span className={cn(
                          "inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest select-none",
                          user.role === 'Admin' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                       )}>
                          <ShieldCheck size={12} /> {user.role}
                       </span>
                    </td>
                    <td className="p-8 text-center text-[10px] font-black uppercase">
                       {user.is_active ? 
                         <span className="text-emerald-500 flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active</span> :
                         <span className="text-rose-500 flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Locked</span>
                       }
                    </td>
                    <td className="p-8 text-right font-black">
                       <button 
                         onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                         className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                       >
                          <Edit3 size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards remains same but with mapping */}
            <div className="md:hidden divide-y divide-gray-50">
               {filteredUsers.map(user => (
                  <div key={user.id} className="p-6 space-y-4 active:bg-rose-50/50 transition-all">
                     <div className="flex items-start justify-between">
                        <div 
                          className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                          onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                        >
                           <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                              <Mail size={18} />
                           </div>
                           <div className="flex flex-col min-w-0">
                              <span className="font-black text-gray-900 tracking-tight text-sm truncate uppercase">{user.email}</span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{user.role}</span>
                           </div>
                        </div>
                        <button 
                          onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                          className="w-11 h-11 flex items-center justify-center bg-gray-50 text-gray-400 rounded-xl active:bg-rose-500 active:text-white transition-all"
                        >
                           <ChevronRight size={18} />
                        </button>
                     </div>

                     <div className="flex items-center justify-between pl-14">
                        <div 
                           className="flex flex-col cursor-pointer"
                           onClick={() => user.employee_id && router.push(`/hr/employees/${user.employee_id}`)}
                        >
                           <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight flex items-center gap-1.5">
                              <User size={10} /> {user.employeeName || 'Chưa liên kết'}
                           </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                           {user.is_active ? 
                              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-widest">Active</span> :
                              <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1"><Lock size={8} /> Locked</span>
                           }
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            {filteredUsers.length === 0 && (
              <div className="py-32 text-center text-gray-300 italic uppercase font-black text-[10px] tracking-[0.2em] opacity-30">
                 Không tìm thấy tài khoản
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => !submitting && setShowCreateModal(false)} />
           <div className="relative w-full max-w-xl bg-white rounded-[40px] p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-300">
              <header className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">Tạo tài khoản mới</h3>
                    <div className="h-1 w-12 bg-rose-500 rounded-full mt-1" />
                 </div>
                 <button onClick={() => setShowCreateModal(false)} className="p-3 bg-gray-50 rounded-2xl hover:bg-rose-50 transition-all">
                    <X size={20} />
                 </button>
              </header>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tài khoản (Email / Username)</label>
                    <input 
                      type="text"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="vd: nhanvien01 hoặc nhanvien@paperart.com"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white transition-all outline-none"
                    />
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mật khẩu (Tối thiểu 6 ký tự)</label>
                    <input 
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Nhập mật khẩu"
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-bold focus:bg-white transition-all outline-none"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vai trò (Role)</label>
                       <select 
                         value={formData.role}
                         onChange={(e) => setFormData({...formData, role: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-black uppercase transition-all outline-none"
                       >
                          <option value="User">User (Mặc định)</option>
                          <option value="Production">Sản xuất</option>
                          <option value="Warehouse">Kho vận</option>
                          <option value="Sales">Sales (Kinh doanh)</option>
                          <option value="Supervisor">Giám sát</option>
                          <option value="Admin">Admin tối cao</option>
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Liên kết Nhân viên</label>
                       <select 
                         value={formData.employeeId}
                         onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-sm font-black uppercase transition-all outline-none"
                       >
                          <option value="">Chọn nhân viên...</option>
                          {employees.map(emp => (
                             <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="pt-6">
                    <button 
                      onClick={handleCreateUser}
                      disabled={submitting}
                      className="w-full py-5 bg-rose-600 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest hover:bg-gray-900 transition-all active:scale-95 shadow-lg shadow-rose-200 flex items-center justify-center gap-3"
                    >
                       {submitting ? <Loader2 className="animate-spin" size={18} /> : <UserCheck size={18} />}
                       Xác nhận tạo tài khoản
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
