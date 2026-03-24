"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  Box
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();

      if (!res.ok) {
        showToast('error', data.error || 'Đăng nhập thất bại');
        return;
      }

      if (data.success) {
         showToast('success', 'Đăng nhập hệ thống thành công');
         // Force reload to refresh AuthContext and Middleware
         window.location.replace('/');
      }
    } catch (err) {
      showToast('error', 'Lỗi kết nối hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-6 z-[99999] animate-in fade-in duration-700">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
         <ShieldCheck size={400} />
      </div>

      <div className="max-w-md w-full bg-white rounded-[48px] p-10 md:p-14 shadow-2xl shadow-gray-200 border border-gray-100 relative overflow-hidden animate-in zoom-in-95 duration-500">
        <header className="text-center mb-10 space-y-4">
           <div className="w-20 h-20 bg-primary-600 rounded-[28px] flex items-center justify-center text-white mx-auto shadow-xl shadow-primary-200 mb-6 group">
              <Box size={40} className="group-hover:scale-110 transition-transform duration-500" />
           </div>
           <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.3em] italic">Paper Art Việt - ERP Hub</span>
           <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase leading-none">Authentication</h1>
           <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Vui lòng đăng nhập để tiếp tục</p>
        </header>

        <form onSubmit={handleLogin} className="space-y-6">
           <div className="space-y-2 group">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic opacity-60">Tài khoản (Email/Username)</label>
              <div className="relative">
                 <Mail size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                 <input 
                   type="text"
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="admin hoặc admin@paperart.com"
                   required
                   className="w-full bg-gray-50 border border-gray-100 rounded-3xl py-5 pl-14 pr-8 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all outline-none"
                 />
              </div>
           </div>

           <div className="space-y-2 group">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic opacity-60">Mật mã bảo mật</label>
              <div className="relative">
                 <Lock size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-rose-500 transition-colors" />
                 <input 
                   type={showPassword ? 'text' : 'password'}
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="••••••••"
                   required
                   className="w-full bg-gray-50 border border-gray-100 rounded-3xl py-5 pl-14 pr-14 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-rose-50 transition-all outline-none"
                 />
                 <button 
                   type="button"
                   onClick={() => setShowPassword(!showPassword)}
                   className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-900 transition-all"
                 >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                 </button>
              </div>
           </div>

           <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary-600 transition-all active:scale-95 shadow-xl shadow-gray-200 disabled:opacity-50"
              >
                 {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                 Xác thực danh tính
              </button>
           </div>
        </form>

        <footer className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-center gap-4 text-gray-300 opacity-60 italic">
           <AlertCircle size={14} />
           <p className="text-[9px] font-black uppercase tracking-widest">Secured by Supabase Gateway 2026</p>
        </footer>
      </div>
    </div>
  );
}
