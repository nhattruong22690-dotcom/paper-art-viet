"use client";

import React from 'react';
import {
  ShieldAlert,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MaintenancePage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-neo-purple/5 flex items-center justify-center p-6 z-[99999] animate-in fade-in duration-700">
      <div className="max-w-xl w-full neo-card !p-14 text-center space-y-10 border-4 shadow-[20px_20px_0px_0px_rgba(0,0,0,1)] bg-white relative overflow-hidden">
        
        {/* DECORATIVE STRIPES */}
        <div className="absolute top-0 left-0 w-full h-5 bg-neo-red border-b-4 border-black" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', backgroundSize: '20px 20px' }} />

        <div className="w-28 h-28 bg-neo-red border-4 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-bounce mt-4">
          <ShieldAlert size={56} className="text-black" />
        </div>

        <header className="space-y-4">
          <span className="text-[10px] font-black text-neo-red uppercase tracking-[0.4em] italic bg-black text-white px-3 py-1 rounded">System Lockdown</span>
          <h1 className="text-5xl font-black text-black tracking-tighter italic uppercase leading-none">
            Hệ thống <span className="text-neo-red">Bảo trì</span>
          </h1>
          <p className="text-sm font-black text-black/40 uppercase tracking-[0.3em] leading-relaxed">
            Paper Art Việt • DevOps Core 2026
          </p>
        </header>

        <div className="space-y-6">
          <div className="p-8 bg-black/5 border-4 border-black rounded-2xl flex flex-col items-center gap-4 shadow-inner">
            <Clock className="text-black" size={32} />
            <p className="text-base font-black text-black leading-relaxed italic">
              Chào bạn, hệ thống đang thực hiện nâng cấp hạ tầng và tối ưu dữ liệu định kỳ để phục vụ tốt hơn. 
              Dự kiến hoàn tất lúc <span className="bg-neo-yellow px-2 border-2 border-black not-italic">14:00</span>.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 text-[11px] font-black text-black/40 uppercase tracking-[0.2em] italic">
            <RefreshCw size={18} className="animate-spin text-neo-purple" />
            Đang đồng bộ hóa dữ liệu cốt lõi...
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary h-16 w-full text-[11px] uppercase tracking-[0.2em] font-black gap-3"
          >
            <RefreshCw size={20} /> Kiểm tra lại
          </button>
          <button
            className="btn-primary h-16 w-full text-[11px] uppercase tracking-[0.2em] font-black gap-3"
          >
            Xem thông báo
          </button>
        </div>

        <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.5em] pt-4">
          Admin Access Only • V4.5
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
