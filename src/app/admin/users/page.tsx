"use client";

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Save, 
  Search, 
  User, 
  Loader2, 
  X,
  Lock,
  CheckCircle2,
  ChevronDown,
  Shield,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
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
  { id: 'read', label: 'R', color: 'bg-primary' },
  { id: 'write', label: 'W', color: 'bg-emerald-500' },
  { id: 'update', label: 'U', color: 'bg-amber-500' },
  { id: 'delete', label: 'D', color: 'bg-rose-500' }
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
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 px-4 md:px-0">
      {/* Header Section */}
      <div className="bg-neo-purple/10 p-8 rounded-xl border-neo border-black shadow-neo flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-3">
            <Shield size={14} className="text-black" />
            <span>Hệ thống</span>
            <ChevronRight size={10} />
            <span className="text-black italic tracking-widest">Security & Permissions</span>
          </nav>
          <h1 className="text-4xl font-black text-black tracking-tight uppercase leading-none">
            Quản trị <span className="text-neo-purple italic">Quyền hạn</span>
          </h1>
          <p className="text-black/60 text-sm mt-3 font-bold uppercase tracking-tight italic leading-none flex items-center gap-2">
             <span className="w-2 h-2 bg-neo-mint rounded-full border border-black" /> Thiết lập ma trận truy cập nhắm mục tiêu
          </p>
        </div>
        
        <div className="relative group w-full md:w-96">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-colors" size={24} />
           <input 
             type="text"
             placeholder="Tìm mã số hoặc tên nhân viên..."
             className="w-full pl-16 pr-6 h-14 bg-white border-2 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-neo-purple/20 transition-all text-sm font-black text-black uppercase tracking-tight shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      {/* Main Table Container */}
      <div className="neo-card !p-0 border-none shadow-none bg-transparent">
        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6 animate-in fade-in">
             <Loader2 size={64} className="animate-spin text-black opacity-20" />
             <p className="text-xs font-black uppercase tracking-[0.4em] text-black/40 italic">Đang đồng bộ giao thức bảo mật...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-0">
              <thead>
                <tr>
                  <th className="px-8 py-6">Người dùng & Vai trò</th>
                  <th className="px-8 py-6 text-center">Ma trận Quyền hạn (ACL Matrix)</th>
                  <th className="px-8 py-6 text-right w-48 font-black">Trạng thái & Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="group hover:bg-neo-purple/5 transition-all bg-white">
                    <td className="px-8 py-8">
                       <div className="flex items-center gap-6">
                         <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center text-black/20 group-hover:text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-neo-purple transition-all italic">
                            <span className="font-black text-xl">{user.email[0].toUpperCase()}</span>
                         </div>
                         <div className="flex flex-col">
                            <span className="font-black text-black text-lg tracking-tighter uppercase italic leading-none mb-3">{user.email}</span>
                            <div className="flex flex-wrap items-center gap-3">
                               <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">{user.employeeName || 'No Employee Record'}</span>
                               <div className="relative inline-flex items-center gap-2 px-3 py-1 bg-neo-purple/20 rounded border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                  <select 
                                    value={user.role}
                                    onChange={(e) => updateLocalUser(user.id, 'role', e.target.value)}
                                    className="bg-transparent text-[10px] font-black uppercase text-black outline-none appearance-none cursor-pointer tracking-widest pr-4 italic"
                                  >
                                     {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                  <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-black pointer-events-none" />
                               </div>
                            </div>
                         </div>
                      </div>
                    </td>

                    <td className="px-8 py-8 text-center bg-black/[0.02]">
                       <div className="flex justify-center">
                          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 p-6 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                             {MODULES.map(module => (
                                <div key={module.id} className="flex flex-col items-center gap-4 py-2">
                                   <span className="text-[10px] font-black uppercase text-black/40 tracking-[0.2em] w-20 text-center truncate italic">{module.label}</span>
                                   <div className="flex gap-1.5">
                                      {ACTIONS.map(action => {
                                        const has = (user.permissions?.[module.id] || []).includes(action.id);
                                        const actionColor = action.id === 'read' ? 'bg-neo-purple' : action.id === 'write' ? 'bg-neo-mint' : action.id === 'update' ? 'bg-neo-yellow' : 'bg-neo-red';
                                        
                                        return (
                                          <button
                                            key={action.id}
                                            onClick={() => togglePermission(user.id, module.id, action.id)}
                                            className={cn(
                                              "w-9 h-9 rounded border-2 border-black flex items-center justify-center text-[11px] font-black uppercase transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none",
                                              has ? actionColor + " text-black" : "bg-white text-black/10 hover:text-black/40"
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

                    <td className="px-8 py-8 text-right">
                       <div className="flex flex-col items-end gap-5">
                          <button 
                            onClick={() => updateLocalUser(user.id, 'is_active', !user.is_active)}
                            className={cn(
                              "flex items-center gap-3 px-5 py-2 rounded border-2 border-black text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
                              user.is_active ? 'bg-neo-mint text-black' : 'bg-neo-red text-black'
                            )}
                          >
                             {user.is_active ? <CheckCircle2 size={16} /> : <Lock size={16} />}
                             {user.is_active ? 'ACTIVE' : 'LOCKED'}
                          </button>
                          
                          <button 
                            onClick={() => handleUpdate(user)}
                            disabled={savingId === user.id}
                            className="btn-primary w-full h-14 text-[11px] uppercase tracking-[0.3em] font-black gap-3"
                          >
                             {savingId === user.id ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                             Sync matrix
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

      <div className="mt-10 pt-10 border-t-neo border-black flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black text-black/20 uppercase tracking-[0.4em]">
         <div className="flex items-center gap-4">
            <span className="px-3 py-1 bg-black text-white rounded">V2.5.0</span>
            <Shield size={16} className="text-black/40" /> 
            <span>AUTH PROTOCOL SECURED</span>
         </div>
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
               <span className="w-2.5 h-2.5 bg-neo-mint border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
               RSA-4096 STANDBY
            </span>
            <span className="flex items-center gap-2">
               <span className="w-2.5 h-2.5 bg-neo-yellow border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
               ENCRYPTED CHANNEL
            </span>
         </div>
      </div>
    </div>
  );
}
