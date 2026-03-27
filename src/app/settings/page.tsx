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
  Terminal,
  Activity,
  Cpu,
  RefreshCw
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
      <div className="py-40 flex flex-col items-center justify-center gap-6 text-black animate-in fade-in">
         <div className="w-20 h-20 bg-neo-purple/10 border-neo border-black rounded-3xl flex items-center justify-center shadow-neo rotate-6 animate-pulse">
            <RefreshCw className="w-10 h-10 animate-spin text-purple-600" strokeWidth={3} />
         </div>
         <p className="text-[11px] font-black uppercase tracking-[0.4em] mt-4">Đang đồng bộ cấu hình hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 bg-neo-purple/5 p-8 neo-card shadow-neo">
        <div className="space-y-4">
          <nav className="flex items-center gap-3 text-[10px] font-black text-black/40 uppercase tracking-[0.3em] mb-2">
            <Terminal size={14} strokeWidth={3} className="text-purple-600" />
            <span>Hệ thống</span>
            <ChevronRight size={12} strokeWidth={3} />
            <span className="text-purple-600 bg-white px-2 py-0.5 rounded-lg border border-black/10">Global Config</span>
          </nav>
          <h1 className="text-4xl font-bold text-foreground tracking-tighter uppercase font-space">
            Thiết lập <span className="text-purple-500 bg-white border-neo border-black px-3 py-1 -rotate-1 inline-block shadow-neo-active">Vận hành</span>
          </h1>
          <p className="text-black/60 text-xs font-black uppercase tracking-widest mt-2 max-w-md">
             Kiểm soát trạng thái thời gian thực và cấu hình hạ tầng trung tâm toàn ERP.
          </p>
        </div>
        
        <div className="flex items-center gap-3 px-6 py-3 bg-neo-mint text-black border-neo border-black rounded-2xl shadow-neo-active hover:shadow-neo transition-all">
           <Cpu size={20} strokeWidth={3} />
           <span className="text-[11px] font-black uppercase tracking-widest">Core Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* Maintenance Mode Card */}
        <div className="neo-card !p-0 shadow-neo overflow-hidden bg-white">
           <div className="px-10 py-8 border-b-neo border-black bg-neo-red/10 flex flex-col sm:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-white text-black border-neo border-black rounded-2xl flex items-center justify-center shadow-neo-active">
                    <ShieldAlert size={32} strokeWidth={2.5} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-black uppercase tracking-tight font-space">Phong tỏa & Bảo trì</h3>
                    <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.3em] mt-2 leading-none">Global Maintenance Lock</p>
                 </div>
              </div>
              <div className="px-5 py-2 bg-black text-neo-yellow rounded-xl text-[10px] font-black uppercase tracking-widest shadow-neo-active">
                ADMIN ACCESS ONLY
              </div>
           </div>

           <div className="p-10 space-y-12">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10 pb-12 border-b-2 border-dashed border-black/10">
                 <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-6">
                       <h4 className="text-lg font-bold text-black uppercase font-space">Ổ khóa bảo trì toàn cục</h4>
                       <span className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-neo-active border-2 border-black",
                          isMaintenance ? 'bg-neo-red text-black' : 'bg-neo-mint text-black'
                       )}>
                          {isMaintenance ? 'ENABLED' : 'DISABLED'}
                       </span>
                    </div>
                    <p className="text-sm text-black/60 leading-relaxed max-w-xl font-medium">
                       <span className="text-neo-red font-black uppercase tracking-widest text-[11px] bg-black text-white px-2 py-0.5 rounded-md mr-2 shadow-neo-active flex-inline items-center justify-center">Cảnh báo:</span> Khi kích hoạt, toàn bộ phiên làm việc của nhân sự sẽ bị ngắt kết nối ngay lập tức. Chỉ tài khoản Quản trị viên mới có thể truy cập hệ thống.
                    </p>
                 </div>

                 <button 
                   onClick={handleToggleMaintenance}
                   disabled={saving}
                   className={cn(
                     "relative w-20 h-10 rounded-full transition-all duration-500 shadow-neo-active border-neo border-black overflow-hidden",
                     isMaintenance ? 'bg-neo-red' : 'bg-neo-purple/20',
                     saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                   )}
                 >
                    <div className={cn(
                       "absolute top-1 w-7 h-7 bg-white rounded-full border-2 border-black shadow-neo transition-all duration-500 flex items-center justify-center",
                       isMaintenance ? 'left-11 shadow-[-4px_0_0_0_#000]' : 'left-1 shadow-[4px_0_0_0_#000]'
                    )}>
                       {saving ? <RefreshCw size={14} strokeWidth={3} className="animate-spin text-black" /> : isMaintenance ? <Lock size={14} strokeWidth={3} className="text-black" /> : <Unlock size={14} strokeWidth={3} className="text-black/30" />}
                    </div>
                 </button>
              </div>

              <div className="space-y-6">
                 <label className="text-[10px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-3 ml-2">
                    <MessageSquare size={18} strokeWidth={3} className="text-purple-600" /> 
                    Thông báo hiển thị cho nhân sự khi bảo trì
                 </label>
                 <textarea 
                    value={maintenanceMsg}
                    onChange={(e) => setMaintenanceMsg(e.target.value)}
                    placeholder="VD: HỆ THỐNG ĐANG TÁI CẤU TRÚC DỮ LIỆU..."
                    className="form-input w-full p-6 !bg-neo-purple/5 !h-auto min-h-[160px] text-base font-bold uppercase placeholder:font-normal placeholder:normal-case shadow-neo-active focus:shadow-neo"
                 />
              </div>
           </div>

           <div className="p-10 bg-neo-yellow/10 border-t-neo border-black border-dashed flex items-start gap-6">
              <div className="w-16 h-16 bg-white text-black border-neo border-black rounded-2xl flex items-center justify-center shadow-neo-active shrink-0 rotate-2">
                 <ShieldCheck size={32} strokeWidth={2.5} />
              </div>
              <div className="space-y-3 pt-2">
                 <p className="text-[11px] font-black text-black uppercase tracking-[0.2em] bg-neo-yellow px-2 py-0.5 rounded shadow-neo-active inline-block">PAV-Sync Protocol Enabled</p>
                 <p className="text-xs text-black/60 leading-relaxed font-bold uppercase tracking-widest">
                   Hệ thống truyền phát tín hiệu phong tỏa qua Socket thời gian thực. Toàn bộ phiên làm việc sẽ bị chấm dứt mà không cần tải lại trình duyệt.
                 </p>
              </div>
           </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-8 pt-6">
           <div className="flex items-center gap-4 text-[10px] font-black text-black/30 uppercase tracking-[0.4em] bg-white border-2 border-black px-6 py-3 rounded-xl shadow-neo-active">
              <Activity size={18} strokeWidth={3} /> System Health: 100%
           </div>
           <button 
             onClick={() => showToast('success', 'Đã lưu cấu hình hệ thống')}
             className="w-full sm:w-auto px-12 py-5 bg-black text-white border-neo border-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black/90 transition-all shadow-neo flex items-center justify-center gap-4 active:translate-x-[2px] active:translate-y-[2px] active:shadow-neo-active font-space"
           >
              <Save size={24} strokeWidth={3} />
              <span>Lưu cấu hình hệ thống</span>
           </button>
        </div>
      </div>

      <div className="flex justify-between items-center py-12 text-[11px] font-black text-black/20 uppercase tracking-[0.5em] px-8 border-t-2 border-dashed border-black/10">
         <div className="flex items-center gap-4">
            <Terminal size={20} strokeWidth={2} /> 
            <span>System Config Shell v4.0.25</span>
         </div>
      </div>
    </div>
  );
}
