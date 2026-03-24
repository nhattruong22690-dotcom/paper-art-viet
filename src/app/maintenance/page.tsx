"use client";

import React from 'react';
import {
  ShieldAlert,
  Clock,
  Settings,
  ShieldCheck,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-6 z-[99999] animate-in fade-in duration-700">
      <div className="max-w-md w-full bg-white rounded-[48px] p-10 md:p-14 shadow-2xl shadow-gray-200 border border-gray-100 relative overflow-hidden text-center scale-in-center animate-in zoom-in-95">

        {/* Abstract Background Decoration */}
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
          <Settings size={200} className="animate-spin-slow" />
        </div>

        <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center mx-auto mb-10 shadow-inner group">
          <ShieldAlert size={48} className="group-hover:scale-110 transition-transform duration-500" />
        </div>

        <header className="space-y-4 mb-10">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] italic">System Lockdown</span>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase leading-none">Hệ thống <span className="text-rose-600 truncate">Bảo trì</span></h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Paper Art Việt - ERP Portal</p>
        </header>

        <div className="space-y-6 mb-10">
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col items-center gap-3">
            <Clock className="text-gray-400" size={24} />
            <p className="text-sm font-bold text-gray-600 leading-relaxed italic">
              Chào bạn, hệ thống đang thực hiện nâng cấp và tối ưu dữ liệu định kỳ để phục vụ tốt hơn.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest italic animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            Đang đồng bộ hóa dữ liệu cốt lõi...
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-rose-600 transition-all active:scale-95 shadow-xl shadow-gray-200"
        >
          <RefreshCw size={18} />
          Kiểm tra lại trạng thái
        </button>

        <p className="mt-8 text-[9px] font-black text-gray-300 uppercase tracking-widest underline decoration-2 underline-offset-4 decoration-gray-100">
          Chỉ dành cho quản trị viên cấp cao
        </p>
      </div>
    </div>
  );
}

// Add global CSS for slow spin
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-slow 12s linear infinite;
    }
  `;
  document.head.appendChild(style);
}
