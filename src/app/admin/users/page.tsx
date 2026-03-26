"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Save, 
  Search, 
  User, 
  Mail, 
  Loader2, 
  ChevronRight, 
  ArrowLeft,
  FileText,
  Lock,
  Unlock,
  Building2,
  Trash2,
  AlertCircle,
  Shield,
  CheckCircle2,
  ChevronDown,
  Activity,
  UserCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PermissionMap = Record<string, string[]>;

interface UserProfile {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  permissions?: PermissionMap;
  employeeName?: string;
  employeeCode?: string;
  updated_at?: string;
}

const MODULES = [
  { id: 'logistics', label: 'Kho vận' },
  { id: 'production', label: 'Sản xuất' },
  { id: 'sales', label: 'Kinh doanh' },
  { id: 'hr', label: 'Nhân sự' },
  { id: 'system', label: 'Hệ thống' }
];

const ACTIONS = [
  { id: 'read', label: 'R', color: 'bg-primary', active: 'hover:bg-blue-600' },
  { id: 'write', label: 'W', color: 'bg-emerald-500', active: 'hover:bg-emerald-600' },
  { id: 'update', label: 'U', color: 'bg-amber-500', active: 'hover:bg-amber-600' },
  { id: 'delete', label: 'D', color: 'bg-rose-500', active: 'hover:bg-rose-600' }
];

export default function AdminUsersPage() {
  const { showToast } = useNotification();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async (user: UserProfile) => {
    setSavingId(user.id);
    try {
      const res = await fetch('/api/admin/users/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          role: user.role,
          isActive: user.is_active,
          permissions: user.permissions || {}
        })
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      
      showToast('success', `Đã cập nhật quyền cho ${user.employeeName || user.email}`);
      fetchUsers();
    } catch (err: any) {
      showToast('error', `Lỗi cập nhật: ${err.message}`);
    } finally {
      setSavingId(null);
    }
  };

  const togglePermission = (userId: string, moduleId: string, actionId: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id !== userId) return user;
      
      const perms = user.permissions || {};
      const modulePerms = perms[moduleId] || [];
      const newModulePerms = modulePerms.includes(actionId)
        ? modulePerms.filter(a => a !== actionId)
        : [...modulePerms, actionId];
      
      return {
        ...user,
        permissions: { ...perms, [moduleId]: newModulePerms }
      };
    }));
  };

  const updateLocalUser = (id: string, field: keyof UserProfile, value: any) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roles = ['Admin', 'Warehouse', 'Production', 'Staff', 'Supervisor', 'Sales'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            <Shield size={12} />
            <span>Hệ thống</span>
            <ChevronRight size={10} />
            <span className="text-primary italic">Security & Permissions</span>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Quản trị <span className="text-primary">Quyền truy cập</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">
             Thiết lập ma trận quyền hạn granular cho từng tài khoản nhân sự.
          </p>
        </div>
        
        <div className="relative group w-full md:w-96">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
           <input 
             type="text"
             placeholder="Tìm kiếm tài khoản / tên..."
             className="form-input pl-12 h-12 bg-slate-50 border-slate-100 rounded-xl"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="card !p-0 border border-slate-50 shadow-soft overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4 animate-in fade-in">
             <Loader2 size={48} className="animate-spin text-primary opacity-30" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Đang đồng bộ quyền hạn...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full !mt-0 text-left">
              <thead>
                <tr>
                  <th className="px-8 py-5">Tài khoản & Vai trò</th>
                  <th className="px-8 py-5 text-center">Ma trận Quyền hạn (ACL Matrix)</th>
                  <th className="px-8 py-5 text-right w-40">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="group hover:bg-slate-50/30 transition-all">
                    <td className="px-8 py-7">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner">
                            <User size={22} strokeWidth={2.5} />
                         </div>
                         <div className="flex flex-col">
                            <span className="font-black text-slate-900 text-base tracking-tighter">{user.email}</span>
                            <div className="mt-1.5 flex items-center gap-3">
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{user.employeeName || 'No Employee Record'}</span>
                               <div className="relative inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50/50 rounded-lg border border-blue-100/50">
                                  <select 
                                    value={user.role}
                                    onChange={(e) => updateLocalUser(user.id, 'role', e.target.value)}
                                    className="bg-transparent text-[9px] font-black uppercase text-primary py-0.5 pr-4 outline-none appearance-none cursor-pointer tracking-widest"
                                  >
                                     {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                  <ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-primary opacity-60 pointer-events-none" />
                               </div>
                            </div>
                         </div>
                      </div>
                    </td>

                    <td className="px-8 py-7">
                       <div className="flex justify-center">
                          <div className="flex gap-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-inner">
                             {MODULES.map(module => (
                                <div key={module.id} className="flex flex-col items-center gap-3">
                                   <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest w-16 text-center truncate">{module.label}</span>
                                   <div className="flex gap-1.5">
                                      {ACTIONS.map(action => {
                                        const has = (user.permissions?.[module.id] || []).includes(action.id);
                                        return (
                                          <button
                                            key={action.id}
                                            onClick={() => togglePermission(user.id, module.id, action.id)}
                                            title={`${module.label}: ${action.id}`}
                                            className={cn(
                                              "w-8 h-8 rounded-xl transition-all flex items-center justify-center text-[10px] font-black uppercase text-white shadow-sm active:scale-90",
                                              has ? action.color : "bg-white border border-slate-200 text-slate-200 hover:border-primary/50 hover:text-primary"
                                            )}
                                          >
                                             {action.label}
                                          </button>
                                        );
                                      })}
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    </td>

                    <td className="px-8 py-7">
                       <div className="flex flex-col items-end gap-3">
                          <button 
                            onClick={() => updateLocalUser(user.id, 'is_active', !user.is_active)}
                            className={cn(
                              "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border",
                              user.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                            )}
                          >
                             {user.is_active ? <CheckCircle2 size={12} strokeWidth={3} /> : <Lock size={12} strokeWidth={3} />}
                             {user.is_active ? 'Active' : 'Locked'}
                          </button>
                          
                          <button 
                            onClick={() => handleUpdate(user)}
                            disabled={savingId === user.id}
                            className="btn-primary h-11 w-full text-[10px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-vibrant"
                          >
                             {savingId === user.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2.5} />}
                             Sync
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center py-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] opacity-50 px-4">
         <div className="flex items-center gap-3">
            <Shield size={16} strokeWidth={2.5} /> 
            <span>Auth Protocol v2.5.0-Release</span>
         </div>
         <div className="flex items-center gap-4">
            <span>RSA-4096 VALIDATED</span>
            <span className="w-px h-3 bg-slate-200" />
            <span>SESSION STANDBY</span>
         </div>
      </div>
    </div>
  );
}
