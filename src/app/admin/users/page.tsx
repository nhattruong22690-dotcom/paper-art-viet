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
  MoreHorizontal,
  ChevronRight,
  ArrowLeft,
  X,
  FileText,
  Lock,
  Unlock,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface UserProfile {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  permissions?: string[]; // ['read', 'write', 'update']
  employeeName?: string;
  employeeCode?: string;
  updated_at?: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [stampedId, setStampedId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/users');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users:', err);
      showToast('error', 'Không thể đối chiếu sổ bộ nhân sự');
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
          permissions: user.permissions || ['read']
        })
      });
      const data = await res.json();

      if (data.error) throw new Error(data.error);

      // Effect: Stamp
      setStampedId(user.id);
      setTimeout(() => setStampedId(null), 3000);

      showToast('success', `Đã cấp ấn tín mới cho ${user.employeeName || user.email}.`);
      fetchUsers();
    } catch (err: any) {
      showToast('error', `Lỗi thụ lý: ${err.message}`);
    } finally {
      setSavingId(null);
    }
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
    <div className="max-w-7xl mx-auto space-y-12 pb-32 md:pb-20 px-6 md:px-12 animate-in fade-in duration-1000 font-typewriter">
      {/* HEADER */}
      <header className="bg-white border-b-4 border-retro-sepia shadow-sm relative overflow-hidden shrink-0 mt-10">
         <div className="washi-tape-top" />
         <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
            <Building2 size={200} strokeWidth={0.5} className="text-retro-sepia" />
         </div>
         
         <div className="px-10 py-14 relative z-10">
            <div className="flex items-center gap-10">
               <Link 
                 href="/mobile-menu/hr"
                 className="w-16 h-16 bg-retro-paper border-2 border-retro-sepia flex items-center justify-center text-retro-sepia hover:bg-retro-brick text-retro-paper transition-all rotate-3 hover:rotate-0 shadow-xl"
               >
                 <ArrowLeft size={28} strokeWidth={2.5} />
               </Link>
               <div>
                 <nav className="flex items-center gap-3 text-[11px] font-black text-retro-earth uppercase tracking-[0.3em] mb-4 opacity-70 italic font-handwriting">
                   <ShieldCheck size={16} strokeWidth={2} />
                   <span>Văn phòng Quản trị</span>
                   <div className="w-1 h-1 bg-retro-sepia/20 rounded-full" />
                   <span className="text-retro-sepia">Ấn tín Phân quyền</span>
                 </nav>
                 <h1 className="text-4xl md:text-5xl font-black text-retro-sepia tracking-tighter uppercase italic underline decoration-double decoration-retro-mustard/40 underline-offset-8">
                   Sổ bộ <span className="text-retro-brick">Nhân sự</span>
                 </h1>
               </div>
            </div>
         </div>
      </header>

      {/* SEARCH/STATS */}
      <div className="flex flex-col md:flex-row gap-8 relative z-10 items-center">
         <div className="flex-1 relative group w-full">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-retro-sepia/20 group-focus-within:text-retro-brick transition-all" size={24} strokeWidth={2.5} />
            <input 
              type="text"
              placeholder="Tra cứu bưu danh hoặc danh tính..."
              className="w-full px-20 py-6 bg-white border-2 border-retro-sepia/10 text-base font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia shadow-inner italic"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
         </div>
         <div className="px-10 py-6 bg-retro-paper border-2 border-retro-sepia/5 text-[10px] font-black uppercase tracking-[0.3em] text-retro-earth italic flex items-center gap-5">
            <div className="w-2 h-2 bg-retro-mustard rotate-45 shadow-sm" />
            Vạn niên bưu hiệu: {users.length}
         </div>
      </div>

      {/* LEDGER TABLE */}
      <div className="retro-card !p-0 !bg-white border-2 shadow-2xl relative overflow-hidden min-h-[500px]">
        <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
           <FileText size={600} strokeWidth={0.5} />
        </div>

        {loading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-6">
             <Loader2 size={48} className="animate-spin text-retro-brick" strokeWidth={1} />
             <p className="text-[12px] font-black uppercase tracking-[0.4em] text-retro-earth/40">Đang đồng bộ Sổ hiệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-retro-sepia text-retro-paper text-[11px] font-black uppercase tracking-[0.3em] italic">
                  <th className="p-10 border-b-2 border-retro-sepia/10">Bưu hiệu & Danh tính</th>
                  <th className="p-10 border-b-2 border-retro-sepia/10 text-center">Đặc quyền (Role)</th>
                  <th className="p-10 border-b-2 border-retro-sepia/10 text-center">Quyền hạn (ACL)</th>
                  <th className="p-10 border-b-2 border-retro-sepia/10 text-center">Trạng thái</th>
                  <th className="p-10 border-b-2 border-retro-sepia/10 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-retro-sepia/5">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-retro-paper/20 transition-all group relative">
                    {/* STAMP EFFECT */}
                    {stampedId === user.id && (
                      <td colSpan={5} className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center">
                         <div className="px-8 py-4 border-8 border-retro-brick/80 text-retro-brick/80 text-5xl font-black uppercase tracking-[0.2em] -rotate-12 bg-white/20 backdrop-blur-sm animate-in zoom-in-150 duration-300 shadow-2xl scale-110">
                            CỐP!
                         </div>
                      </td>
                    )}

                    <td className="p-10">
                      <div className="flex items-center gap-8">
                         <div className="w-16 h-16 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia group-hover:bg-retro-sepia group-hover:text-retro-paper transition-all rotate-3">
                            <Mail size={24} strokeWidth={1.5} />
                         </div>
                         <div className="flex flex-col font-typewriter">
                            <span className="font-black text-retro-sepia uppercase text-lg tracking-tighter italic group-hover:text-retro-brick transition-colors">{user.email}</span>
                            <span className="text-[10px] font-black text-retro-earth uppercase tracking-widest mt-2 flex items-center gap-3 opacity-60">
                               <User size={12} strokeWidth={2} className="text-retro-mustard" /> {user.employeeName || 'Bưu tá tự do'}
                            </span>
                         </div>
                      </div>
                    </td>

                    <td className="p-10">
                      <div className="flex justify-center">
                         <div className="relative w-48 font-typewriter">
                            <select 
                              value={user.role}
                              onChange={(e) => updateLocalUser(user.id, 'role', e.target.value)}
                              className="w-full pl-6 pr-10 py-4 bg-retro-paper/40 border-2 border-retro-sepia/10 text-[10px] font-black uppercase tracking-widest text-retro-sepia outline-none focus:border-retro-brick appearance-none shadow-inner italic cursor-pointer transition-all"
                            >
                               {roles.map(r => (
                                 <option key={r} value={r}>{r}</option>
                               ))}
                            </select>
                            <ChevronRight size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-retro-sepia/30 rotate-90 pointer-events-none" />
                         </div>
                      </div>
                    </td>

                    <td className="p-10">
                      <div className="flex flex-col gap-3 items-center">
                         <div className="flex gap-4">
                            {['read', 'write', 'update'].map(p => {
                               const has = (user.permissions || []).includes(p);
                               return (
                                 <div key={p} className="flex flex-col items-center gap-2 group/perm cursor-pointer">
                                    <div 
                                      onClick={() => {
                                         const current = user.permissions || [];
                                         const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
                                         updateLocalUser(user.id, 'permissions', next);
                                      }}
                                      className={cn(
                                        "w-10 h-10 border-2 transition-all flex items-center justify-center",
                                        has ? "bg-retro-brick border-retro-brick text-white rotate-3 shadow-lg" : "bg-white border-retro-sepia/20 text-retro-sepia/10"
                                      )}
                                    >
                                       {p === 'read' && <FileText size={16} />}
                                       {p === 'write' && <Save size={16} />}
                                       {p === 'update' && <Key size={16} />}
                                    </div>
                                    <span className="text-[8px] font-black uppercase text-retro-earth opacity-40 group-hover/perm:opacity-100">{p}</span>
                                 </div>
                               )
                            })}
                         </div>
                      </div>
                    </td>

                    <td className="p-10 text-center">
                       <button 
                         onClick={() => updateLocalUser(user.id, 'is_active', !user.is_active)}
                         className={cn(
                           "inline-flex items-center gap-4 px-6 py-4 border-2 text-[10px] font-black uppercase tracking-[0.2em] italic shadow-[4px_4px_0px_#3E272311] transition-all active:scale-95",
                           user.is_active ? 'border-retro-moss text-retro-moss bg-retro-moss/5' : 'border-retro-brick text-retro-brick bg-retro-brick/5'
                         )}
                       >
                          {user.is_active ? <Unlock size={14} strokeWidth={2.5} /> : <Lock size={14} strokeWidth={2.5} />}
                          {user.is_active ? 'Thông Hành' : 'Niêm Phong'}
                       </button>
                    </td>

                    <td className="p-10 text-right">
                       <button 
                         onClick={() => handleUpdate(user)}
                         disabled={savingId === user.id}
                         className="px-10 py-5 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all active:scale-95 disabled:opacity-50 flex items-center gap-4 italic ml-auto"
                       >
                          {savingId === user.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} strokeWidth={2.5} />}
                          Thụ lý
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="py-40 text-center text-retro-earth/20 italic uppercase font-black text-xs tracking-[0.6em] animate-pulse">
                 Sổ bộ trống rỗng
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER NOTE */}
      <footer className="flex justify-center pt-10 border-t-2 border-retro-sepia/5">
         <p className="text-[10px] font-black text-retro-earth/40 uppercase tracking-[0.4em] italic flex items-center gap-5">
            <Lock size={12} strokeWidth={2} /> BẢO MẬT CẤP ĐỘ ADMIN — TRUY CẬP ĐÃ GHI NHẬT KÝ
         </p>
      </footer>
    </div>
  );
}
