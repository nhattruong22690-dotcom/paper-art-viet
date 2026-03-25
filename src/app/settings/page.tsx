"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  ShieldAlert, 
  Power, 
  AlertTriangle, 
  Info, 
  Save, 
  Loader2,
  Lock,
  Unlock,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { getConfig, setMaintenanceMode } from '@/services/systemConfig.service';
import { useNotification } from '@/context/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SettingsPage() {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('Hệ thống đang bảo trì định kỳ. Vui lòng quay lại sau.');

  useEffect(() => {
    getConfig('maintenance_mode').then(val => {
      if (val) {
        setIsMaintenance(val.is_maintenance);
        setMaintenanceMsg(val.message || '');
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const handleToggleMaintenance = async () => {
    setSaving(true);
    try {
      const newVal = !isMaintenance;
      await setMaintenanceMode(newVal, maintenanceMsg);
      setIsMaintenance(newVal);
      showToast('success', newVal ? 'Hệ thống đã chuyển sang chế độ BẢO TRÌ' : 'Hệ thống đã MỞ CỬA trở lại');
    } catch (err: any) {
      console.error('Update Failed:', err);
      showToast('error', `Lỗi: ${err.message || 'Không thể cập nhật trạng thái hệ thống'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-40 flex flex-col items-center gap-8 text-retro-earth/40 italic font-typewriter">
         <div className="w-14 h-14 border-4 border-retro-sepia/10 border-t-retro-brick animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Đang nạp Cấu hình Bảo mật...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-700 px-6 md:px-12 font-typewriter">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 bg-retro-paper p-10 border-b-2 border-retro-sepia/10 relative overflow-hidden shadow-[0_15px_40px_-10px_rgba(62,39,35,0.1)]">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Settings size={240} strokeWidth={0.5} className="text-retro-sepia" />
        </div>
        
        <div className="relative z-10">
          <nav className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-6 opacity-60">
            <Terminal size={14} strokeWidth={1.5} />
            <span>Trung tâm Điều hành</span>
            <ChevronRight size={12} strokeWidth={1.5} />
            <span className="text-retro-sepia">Cấu hình Hệ thống</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black text-retro-sepia uppercase tracking-tighter italic">
            Thiết lập <span className="text-retro-brick underline decoration-double decoration-retro-brick/30 underline-offset-8">Vận hành</span>
          </h1>
          <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] italic mt-4 opacity-60 flex items-center gap-2">
            <div className="w-2 h-2 bg-retro-brick rotate-45" />
            Kiểm soát Trạng thái & Quyền hạn Cốt lõi — MCMLXXXIV
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="bg-white border-2 border-retro-sepia/10 shadow-[0_20px_50px_-12px_rgba(62,39,35,0.15)] overflow-hidden">
           <div className="p-10 border-b-2 border-retro-sepia/10 bg-retro-paper/20 flex flex-col sm:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 bg-retro-brick text-white flex items-center justify-center shadow-xl rotate-3">
                    <ShieldAlert size={28} strokeWidth={2} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-retro-sepia tracking-tighter uppercase italic">Phong tỏa & <span className="text-retro-brick">Bảo trì</span></h3>
                    <p className="text-[9px] text-retro-earth font-black uppercase tracking-[0.2em] mt-1 opacity-60 italic">Cơ chế Master Control Unit</p>
                 </div>
              </div>
              <div className="px-6 py-2 bg-retro-sepia text-retro-paper text-[10px] font-black uppercase tracking-widest italic shadow-sm">
                Quản trị Đặc quyền
              </div>
           </div>

           <div className="p-10 md:p-14 space-y-12 relative group">
              <div className="absolute top-0 right-0 p-16 opacity-[0.03] group-hover:opacity-[0.07] transition-all pointer-events-none">
                 <Lock size={200} strokeWidth={1} className="text-retro-sepia" />
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 relative z-10 border-b-2 border-retro-sepia/5 pb-12">
                 <div className="space-y-4 flex-1 min-w-0">
                    <div className="flex items-center gap-4">
                       <p className="text-xl font-black text-retro-sepia uppercase italic tracking-tight">Ổ khóa Bảo trì Toàn cục</p>
                       <div className={cn(
                         "px-4 py-1 text-[10px] font-black text-white uppercase tracking-widest italic shadow-md rotate-2",
                         isMaintenance ? 'bg-retro-brick animate-pulse' : 'bg-retro-earth/40'
                       )}>
                          {isMaintenance ? 'Kích hoạt' : 'Hủy bỏ'}
                       </div>
                    </div>
                    <p className="text-[13px] text-retro-earth font-bold italic leading-relaxed max-w-xl opacity-60">
                       <span className="text-retro-brick font-black">Lưu ý quan trọng:</span> Khi kích hoạt, toàn bộ nhân viên sẽ bị tước quyền truy cập ngay lập tức. Chỉ tài khoản Quản trị tối cao (Admin) mới có thể tiếp tục chiêu hoán dữ liệu.
                    </p>
                 </div>

                 <button 
                   onClick={handleToggleMaintenance}
                   disabled={saving}
                   className={cn(
                      "relative w-28 h-14 bg-retro-paper border-4 transition-all duration-500 shadow-inner rounded-none",
                      isMaintenance ? 'border-retro-brick shadow-retro-brick/20' : 'border-retro-sepia/20',
                      saving ? 'opacity-50' : 'active:scale-95'
                   )}
                 >
                    <div className={cn(
                       "absolute top-1 left-1 w-10 h-10 bg-white border-2 shadow-xl transition-all duration-500 flex items-center justify-center text-retro-earth/40",
                       isMaintenance ? 'translate-x-[64px] border-retro-brick text-retro-brick' : 'translate-x-0 border-retro-sepia/20',
                       isMaintenance ? 'rotate-[360deg]' : 'rotate-0'
                    )}>
                       {saving ? <Loader2 size={24} className="animate-spin" /> : isMaintenance ? <Lock size={24} strokeWidth={2.5} /> : <Unlock size={24} strokeWidth={2.5} />}
                    </div>
                 </button>
              </div>

              <div className="space-y-6 relative z-10">
                 <label className="text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] ml-1 italic opacity-60 flex items-center gap-4">
                    <MessageSquare size={16} strokeWidth={2} className="text-retro-mustard" /> Thông báo Hiển thị cho Nhân sự bị phong tỏa
                 </label>
                 <div className="relative">
                    <textarea 
                       value={maintenanceMsg}
                       onChange={(e) => setMaintenanceMsg(e.target.value)}
                       placeholder="VD: Hệ thống đang tái cấu trúc kho báu dữ liệu..."
                       className="w-full bg-white border-2 border-retro-sepia/10 px-10 py-8 text-sm font-black text-retro-sepia outline-none focus:border-retro-mustard transition-all shadow-inner h-32 resize-none font-handwriting italic leading-relaxed"
                    />
                    <div className="absolute bottom-6 right-8 flex items-center gap-3 text-[9px] font-black text-retro-earth/20 uppercase tracking-[0.2em] italic">
                       <AlertTriangle size={14} className="text-retro-mustard/40" /> 
                       Sử dụng Sóng Broadcast PAV
                    </div>
                 </div>
              </div>
           </div>

           <div className="p-8 bg-retro-paper/40 border-t-2 border-retro-sepia/10 flex items-start gap-6 border-dashed">
              <div className="w-12 h-12 bg-retro-moss/10 text-retro-moss flex items-center justify-center shadow-inner shrink-0 rotate-3">
                 <ShieldCheck size={24} strokeWidth={2} />
              </div>
              <div className="space-y-2 pt-1">
                 <p className="text-[11px] font-black text-retro-moss uppercase tracking-[0.2em] italic">Cơ chế Realtime-Sync Độc quyền</p>
                 <p className="text-[12px] font-bold text-retro-earth leading-relaxed italic opacity-70">
                   Hệ thống sử dụng hạ tầng PAV-Sync để truyền phát tín hiệu 'Lockdown' trong vòng 1/1000 giây. Không cần tải lại trang. Hiệu quả tức thì trên mọi thiết bị đầu cuối.
                 </p>
              </div>
           </div>
        </div>
      </div>

      <div className="flex justify-end gap-6 pt-6">
         <button className="px-12 py-5 bg-retro-sepia text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-brick transition-all active:scale-95 italic flex items-center gap-4">
            <Save size={20} strokeWidth={2.5} /> Lưu Cấu hình Toàn cục
         </button>
      </div>

      <div className="flex flex-col items-center py-16 opacity-30">
          <div className="h-[2px] w-32 bg-retro-sepia/20 mb-8" />
          <p className="text-[10px] font-black text-retro-earth uppercase tracking-[0.5em] italic">Cuối danh lục Cài đặt</p>
      </div>
    </div>
  );
}
