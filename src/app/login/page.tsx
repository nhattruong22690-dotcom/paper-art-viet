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
  Box,
  ChevronRight
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
         window.location.replace('/');
      }
    } catch (err) {
      showToast('error', 'Lỗi kết nối hệ thống');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-6 z-[99999] animate-in fade-in duration-700 overflow-y-auto">
      <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-white mx-auto shadow-lg mb-6">
            <Box size={32} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Paper Art Việt</h1>
          <p className="text-xs font-bold text-muted-foreground mt-1 uppercase tracking-[0.2em]">Hệ thống Quản trị ERP</p>
        </div>

        <div className="bg-white rounded-lg border border-border shadow-md overflow-hidden">
          <div className="p-8 md:p-10">
            <header className="mb-8">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-widest">Xác thực quyền hạn</h2>
              <div className="h-0.5 w-10 bg-primary mt-2" />
            </header>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Tài khoản</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-all" />
                  <input 
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Tên đăng nhập hoặc email"
                    required
                    className="w-full bg-white border border-border px-11 py-3 text-sm font-bold text-foreground focus:border-primary transition-all outline-none rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Mật mã</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-all" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-white border border-border px-11 py-3 text-sm font-bold text-foreground focus:border-primary transition-all outline-none rounded-lg tracking-widest"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-foreground transition-all"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-foreground text-white rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-primary active:scale-[0.98] transition-all shadow-md disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                  Đăng nhập hệ thống
                </button>
              </div>
            </form>
          </div>

          <footer className="px-8 py-4 bg-gray-50 border-t border-border flex items-center justify-center gap-2 text-muted-foreground">
            <AlertCircle size={12} />
            <p className="text-[9px] font-bold uppercase tracking-widest italic">Pav-Sync Gateway • 2026 Edition</p>
          </footer>
        </div>

        <div className="mt-8 text-center opacity-30">
          <p className="text-[9px] font-bold text-foreground uppercase tracking-[0.3em]">Paper Art Việt Co., Ltd</p>
        </div>
      </div>
    </div>
  );
}
