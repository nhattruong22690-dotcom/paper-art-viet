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
    <div className="max-w-7xl mx-auto space-y-12 pb-32 md:pb-20 px-4 md:px-0 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 border-b-2 border-retro-sepia/10 pb-10">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 bg-retro-sepia border-2 border-retro-sepia flex items-center justify-center text-retro-paper -rotate-2 shadow-xl hover:rotate-0 transition-transform cursor-pointer">
              <ShieldCheck size={40} strokeWidth={1.5} />
           </div>
           <div>
              <nav className="flex items-center gap-2 text-[10px] font-black text-retro-earth uppercase tracking-widest mb-1 font-handwriting italic">
                <span>Trạm PAV</span>
                <span className="text-retro-sepia/20">/</span>
                <span className="text-retro-sepia uppercase">Quản trị Nhân sự</span>
              </nav>
              <h1 className="text-3xl md:text-4xl font-black text-retro-sepia tracking-tighter italic uppercase font-typewriter underline decoration-double decoration-retro-mustard/30 underline-offset-8">Số hiệu <span className="text-retro-brick">Tài khoản</span></h1>
              <p className="text-retro-earth mt-3 uppercase text-xs font-bold tracking-[0.2em] italic leading-relaxed font-typewriter opacity-60 flex items-center gap-2">
                 <Lock size={14} strokeWidth={1.5} /> Phân quyền & Kiểm soát truy cập hệ thống bưu cục
              </p>
           </div>
        </div>
        <div className="w-full md:w-auto">
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full md:w-auto retro-btn bg-retro-brick text-white hover:bg-retro-sepia shadow-[4px_4px_0px_#3E272333] flex items-center justify-center gap-3 px-10 py-5"
          >
            <Plus size={18} strokeWidth={1.5} /> Cấp tài khoản mới
          </button>
        </div>
      </header>

      {/* SEARCH/FILTER */}
      <div className="flex flex-col md:flex-row gap-6 relative z-10">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/40 group-focus-within:text-retro-brick transition-colors" size={18} strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Tìm theo bưu hiệu hoặc danh tính..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/50 border-2 border-retro-sepia/10 rounded-xl py-4 md:py-5 pl-14 pr-8 text-sm outline-none focus:ring-4 focus:ring-retro-mustard/10 focus:bg-white focus:border-retro-sepia transition-all font-typewriter tracking-tight uppercase shadow-inner"
          />
        </div>
      </div>

      <div className="retro-card !p-0 !bg-white overflow-hidden border-2 shadow-2xl relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
           <ShieldCheck size={300} strokeWidth={0.5} />
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-retro-earth/40 italic">
             <Loader2 size={40} className="animate-spin text-retro-brick" strokeWidth={1.5} />
             <p className="text-[11px] font-black uppercase tracking-[0.3em] font-typewriter">Đang đối chiếu hồ sơ bưu hiệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            {/* Personnel Ledger Table */}
            <table className="hidden md:table w-full text-left border-collapse">
              <thead>
                <tr className="bg-retro-sepia text-retro-paper text-[10px] font-black uppercase tracking-[0.2em] font-typewriter">
                  <th className="p-8 border-b border-retro-sepia">Danh tính (Số hiệu Bưu)</th>
                  <th className="p-8 border-b border-retro-sepia">Chủ trì sở hữu</th>
                  <th className="p-8 border-b border-retro-sepia text-center">Đặc quyền</th>
                  <th className="p-8 border-b border-retro-sepia text-center">Hiện trạng</th>
                  <th className="p-8 border-b border-retro-sepia text-right">Mục lục</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-retro-sepia/5 text-sm font-serif italic">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-retro-paper/20 transition-all group">
                    <td className="p-8 cursor-pointer group/link" onClick={() => user.id && router.push(`/hr/users/${user.id}`)}>
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia group-hover/link:bg-retro-sepia group-hover/link:text-retro-paper transition-all rotate-3">
                             <Mail size={20} strokeWidth={1.5} />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 not-italic">
                             <span className="font-black text-retro-sepia tracking-tight text-base group-hover/link:text-retro-brick transition-colors truncate">{user.email}</span>
                             <span className="text-[10px] font-bold text-retro-earth uppercase tracking-widest mt-1 flex items-center gap-1 opacity-60">
                                <Clock size={10} strokeWidth={1.5} /> Lần truy cập cuối: 1h ago
                             </span>
                          </div>
                       </div>
                    </td>
                    <td className="p-8 cursor-pointer group/link" onClick={() => user.employee_id && router.push(`/hr/employees/${user.employee_id}`)}>
                       <div className="flex flex-col not-italic">
                          <span className="text-sm font-black text-retro-sepia uppercase tracking-tight group-hover/link:text-retro-brick transition-colors truncate">{user.employeeName || 'Vô danh'}</span>
                          <span className="text-[10px] font-bold text-retro-mustard uppercase tracking-widest mt-1 font-typewriter">{(user.employeeCode || 'NO-ID').toUpperCase()}</span>
                       </div>
                    </td>
                    <td className="p-8 text-center">
                       <span className={cn(
                          "inline-flex items-center gap-2 px-4 py-1.5 border-2 text-[10px] font-black uppercase tracking-widest font-typewriter shadow-[2px_2px_0px_currentColor]",
                          user.role === 'Admin' ? 'border-retro-brick text-retro-brick bg-retro-brick/5' : 'border-retro-earth text-retro-earth bg-retro-earth/5'
                       )}>
                          <ShieldCheck size={12} strokeWidth={1.5} /> {user.role}
                       </span>
                    </td>
                    <td className="p-8 text-center text-[10px] font-black uppercase font-typewriter">
                       {user.is_active ? 
                         <span className="text-retro-moss flex items-center justify-center gap-2 italic"><span className="w-2 h-2 rounded-full bg-retro-moss" /> Đang thông báo</span> :
                         <span className="text-retro-brick flex items-center justify-center gap-2 italic"><span className="w-2 h-2 rounded-full bg-retro-brick" /> Niêm phong</span>
                       }
                    </td>
                    <td className="p-8 text-right font-black">
                       <button 
                         onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                         className="p-4 bg-retro-paper border border-retro-sepia/20 text-retro-sepia/40 hover:text-retro-sepia hover:bg-white hover:border-retro-sepia transition-all rotate-2 hover:rotate-0 active:scale-95 shadow-sm"
                       >
                          <Edit3 size={18} strokeWidth={1.5} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards Ledger Style */}
            <div className="md:hidden divide-y-2 divide-retro-sepia/5">
               {filteredUsers.map(user => (
                  <div key={user.id} className="p-8 space-y-6 relative overflow-hidden active:bg-retro-paper/50 transition-all font-serif italic">
                     <div className="flex items-start justify-between">
                        <div 
                          className="flex items-center gap-5 flex-1 min-w-0 cursor-pointer"
                          onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                        >
                           <div className="w-12 h-12 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia shrink-0 rotate-6">
                              <Mail size={20} strokeWidth={1.5} />
                           </div>
                           <div className="flex flex-col min-w-0 not-italic">
                              <span className="font-black text-retro-sepia tracking-tight text-sm truncate uppercase font-typewriter">{user.email}</span>
                              <span className="text-[10px] font-bold text-retro-earth uppercase tracking-widest mt-1 italic">{user.role}</span>
                           </div>
                        </div>
                        <button 
                          onClick={() => user.id && router.push(`/hr/users/${user.id}`)}
                          className="w-12 h-12 flex items-center justify-center bg-retro-paper border border-retro-sepia/10 text-retro-sepia/40 rounded-lg active:bg-retro-sepia active:text-retro-paper transition-all"
                        >
                           <ChevronRight size={20} strokeWidth={1.5} />
                        </button>
                     </div>

                     <div className="flex items-center justify-between pl-16">
                        <div 
                           className="flex flex-col cursor-pointer not-italic"
                           onClick={() => user.employee_id && router.push(`/hr/employees/${user.employee_id}`)}
                        >
                           <span className="text-xs font-black text-retro-sepia uppercase tracking-tight flex items-center gap-2">
                              <User size={12} strokeWidth={1.5} className="text-retro-mustard" /> {user.employeeName || 'Bất định'}
                           </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 not-italic">
                           {user.is_active ? 
                              <span className="px-3 py-1 bg-retro-moss/10 border border-retro-moss text-retro-moss text-[9px] font-black uppercase tracking-[0.2em] font-typewriter">Thông báo</span> :
                              <span className="px-3 py-1 bg-retro-brick/10 border border-retro-brick text-retro-brick text-[9px] font-black uppercase tracking-[0.2em] font-typewriter flex items-center gap-1.5"><Lock size={10} strokeWidth={1.5} /> Khóa</span>
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
           <div className="absolute inset-0 bg-retro-sepia/40 backdrop-blur-sm" onClick={() => !submitting && setShowCreateModal(false)} />
           <div className="relative w-full max-w-xl retro-card !p-0 shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
              <div className="washi-tape-top" />
              
              <div className="p-8 md:p-12">
                <header className="flex justify-between items-center mb-10">
                   <div>
                      <h3 className="text-2xl font-black text-retro-sepia uppercase tracking-tighter italic font-typewriter underline decoration-double decoration-retro-mustard/30 underline-offset-4">Đăng ký Hồ sơ mới</h3>
                      <p className="font-handwriting text-retro-earth text-sm mt-2 font-bold italic">Bản ghi nhân sự hệ thống PAV</p>
                   </div>
                   <button onClick={() => setShowCreateModal(false)} className="p-4 bg-retro-paper border border-retro-sepia/10 hover:bg-retro-brick/5 hover:text-retro-brick transition-all">
                      <X size={24} strokeWidth={1.5} />
                   </button>
                </header>

                <div className="space-y-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-retro-sepia uppercase tracking-[0.2em] ml-1 font-typewriter opacity-60">Danh tính bưu hiệu (Email / Username)</label>
                      <input 
                        type="text"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="vd: bưu hiệu nhanvien01..."
                        className="w-full bg-white/50 border-2 border-retro-sepia/10 rounded-xl py-4 px-6 text-sm font-bold text-retro-sepia focus:bg-white focus:border-retro-sepia transition-all outline-none font-typewriter shadow-inner uppercase tracking-tighter"
                      />
                   </div>

                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-retro-sepia uppercase tracking-[0.2em] ml-1 font-typewriter opacity-60">Mật mã niêm phong (Cẩn mật)</label>
                      <input 
                        type="text"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder="Nhập khóa mã bảo mật..."
                        className="w-full bg-white/50 border-2 border-retro-sepia/10 rounded-xl py-4 px-6 text-sm font-bold text-retro-sepia focus:bg-white focus:border-retro-sepia transition-all outline-none font-typewriter shadow-inner"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-retro-sepia uppercase tracking-[0.2em] ml-1 font-typewriter opacity-60">Đặc quyền (Role)</label>
                         <div className="relative">
                            <select 
                              value={formData.role}
                              onChange={(e) => setFormData({...formData, role: e.target.value})}
                              className="w-full bg-white/50 border-2 border-retro-sepia/10 rounded-xl py-4 px-6 text-xs font-black uppercase text-retro-sepia focus:bg-white focus:border-retro-sepia transition-all outline-none font-typewriter appearance-none shadow-inner"
                            >
                               <option value="User">User (Mặc định)</option>
                               <option value="Production">Sản xuất</option>
                               <option value="Warehouse">Kho vận</option>
                               <option value="Sales">Sales (Kinh doanh)</option>
                               <option value="Supervisor">Giám sát</option>
                               <option value="Admin">Admin tối cao</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-retro-sepia/30 pointer-events-none" />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-retro-sepia uppercase tracking-[0.2em] ml-1 font-typewriter opacity-60">Liên kết Nhân sự</label>
                         <div className="relative">
                            <select 
                              value={formData.employeeId}
                              onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                              className="w-full bg-white/50 border-2 border-retro-sepia/10 rounded-xl py-4 px-6 text-xs font-black uppercase text-retro-sepia focus:bg-white focus:border-retro-sepia transition-all outline-none font-typewriter appearance-none shadow-inner"
                            >
                               <option value="">Chọn đối tượng...</option>
                               {employees.map(emp => (
                                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                               ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-retro-sepia/30 pointer-events-none" />
                         </div>
                      </div>
                   </div>

                   <div className="pt-10">
                      <button 
                        onClick={handleCreateUser}
                        disabled={submitting}
                        className="w-full retro-btn bg-retro-brick text-white hover:bg-retro-sepia py-6 flex items-center justify-center gap-3 shadow-[4px_4px_0px_#3E272333]"
                      >
                         {submitting ? <Loader2 className="animate-spin" size={20} /> : <UserCheck size={20} strokeWidth={1.5} />}
                         Ký duyệt & Cấp quyền
                      </button>
                   </div>
                </div>
              </div>
              <div className="torn-paper-bottom mt-4" />
           </div>
        </div>
      )}

    </div>
  );
}
