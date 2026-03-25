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
    <div className="fixed inset-0 bg-retro-paper flex items-center justify-center p-6 z-[99999] animate-in fade-in duration-700 overflow-y-auto">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
         <ShieldCheck size={400} strokeWidth={1} className="text-retro-sepia" />
      </div>

      <div className="max-w-md w-full retro-card animate-in zoom-in-95 duration-500 !p-0 overflow-hidden">
        <div className="washi-tape-top" />
        
        <div className="p-10 md:p-14 space-y-10">
          <header className="text-center space-y-4">
             <div className="w-20 h-20 bg-retro-sepia flex items-center justify-center text-retro-paper mx-auto shadow-xl rotate-3 hover:rotate-0 transition-transform mb-6 group cursor-default">
                <Box size={40} strokeWidth={1.5} className="group-hover:scale-110 transition-transform duration-500" />
             </div>
             <span className="text-[10px] font-black text-retro-earth uppercase tracking-[0.3em] italic font-handwriting">Paper Art Việt - ERP Portal</span>
             <h1 className="text-3xl font-black text-retro-sepia tracking-tighter italic uppercase leading-none font-typewriter underline decoration-double decoration-retro-mustard/30 underline-offset-4">Xác thực <span className="text-retro-brick">Quyền hạn</span></h1>
             <p className="text-xs font-bold text-retro-earth uppercase tracking-widest leading-relaxed font-typewriter italic opacity-60">Niêm phong hệ thống - Vui lòng nhập mật mã</p>
          </header>

          <form onSubmit={handleLogin} className="space-y-8">
             <div className="space-y-3 group">
                <label className="text-[10px] font-black text-retro-sepia uppercase tracking-widest ml-1 italic font-typewriter opacity-60">Tài khoản (Công danh / Email)</label>
                <div className="relative">
                   <Mail size={18} strokeWidth={1.5} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/30 group-focus-within:text-retro-mustard transition-colors" />
                   <input 
                     type="text"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="vd: admin hoặc kien@paperart.com"
                     required
                     className="w-full bg-white/50 border-2 border-retro-sepia/10 px-14 py-5 text-sm font-bold text-retro-sepia focus:bg-white focus:border-retro-sepia transition-all outline-none font-typewriter uppercase tracking-tighter shadow-inner"
                   />
                </div>
             </div>

             <div className="space-y-3 group">
                <label className="text-[10px] font-black text-retro-sepia uppercase tracking-widest ml-1 italic font-typewriter opacity-60">Mật mã bảo mật</label>
                <div className="relative">
                   <Lock size={18} strokeWidth={1.5} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/30 group-focus-within:text-retro-brick transition-colors" />
                   <input 
                     type={showPassword ? 'text' : 'password'}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••"
                     required
                     className="w-full bg-white/50 border-2 border-retro-sepia/10 px-14 py-5 text-sm font-bold text-retro-sepia focus:bg-white focus:border-retro-sepia transition-all outline-none font-typewriter tracking-tight shadow-inner"
                   />
                   <button 
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute right-6 top-1/2 -translate-y-1/2 text-retro-sepia/30 hover:text-retro-sepia transition-all"
                   >
                      {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                   </button>
                </div>
             </div>

             <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full retro-btn bg-retro-brick text-white hover:bg-retro-sepia py-5 shadow-[4px_4px_0px_#3E272333] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                   {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} strokeWidth={1.5} />}
                   Ký tên & Truy cập
                </button>
             </div>
          </form>

          <footer className="mt-10 pt-8 border-t-2 border-dashed border-retro-sepia/10 flex items-center justify-center gap-4 text-retro-earth opacity-60 italic font-handwriting">
             <AlertCircle size={14} strokeWidth={1.5} />
             <p className="text-[9px] font-black uppercase tracking-widest">Secured by Supabase Gateway — MCMLXXXIV (2026)</p>
          </footer>
        </div>
        
        <div className="torn-paper-bottom" />
      </div>
    </div>
  );
}

