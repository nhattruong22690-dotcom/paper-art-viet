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
      <div className="py-40 flex flex-col items-center justify-center gap-4 text-slate-400 animate-in fade-in">
         <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
         <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Đang đồng bộ cấu hình hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            <Terminal size={12} />
            <span>Hệ thống</span>
            <ChevronRight size={10} />
            <span className="text-primary italic">Global Configuration</span>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Thiết lập <span className="text-primary">Vận hành</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">
             Kiểm soát trạng thái thời gian thực và cấu hình hạ tầng trung tâm.
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-sm">
           <Cpu size={16} />
           <span className="text-[10px] font-black uppercase tracking-widest">Core Engine Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Maintenance Mode Card */}
        <div className="card !p-0 border border-slate-50 shadow-soft overflow-hidden">
           <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center justify-center shadow-sm">
                    <ShieldAlert size={24} strokeWidth={2.5} />
                 </div>
                 <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">Phong tỏa & Bảo trì</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 leading-none">Global Maintenance Lock</p>
                 </div>
              </div>
              <div className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10">
                ADMIN ACCESS ONLY
              </div>
           </div>

           <div className="p-8 space-y-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
                 <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-4">
                       <h4 className="text-base font-black text-slate-900 tracking-tight">Ổ khóa bảo trì toàn cục</h4>
                       <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border",
                          isMaintenance ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100 opacity-60'
                       )}>
                          {isMaintenance ? 'Enabled' : 'Disabled'}
                       </span>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xl font-medium">
                       <span className="text-rose-600 font-black uppercase tracking-widest text-[10px]">Cảnh báo nghiêm trọng:</span> Khi kích hoạt, toàn bộ phiên làm việc của nhân sự sẽ bị ngắt kết nối ngay lập tức. Chỉ tài khoản Quản trị viên mới có thể truy cập hệ thống.
                    </p>
                 </div>

                 <button 
                   onClick={handleToggleMaintenance}
                   disabled={saving}
                   className={cn(
                     "relative w-16 h-8 rounded-full transition-all duration-500 shadow-inner overflow-hidden",
                     isMaintenance ? 'bg-rose-500' : 'bg-slate-200',
                     saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                   )}
                 >
                    <div className={cn(
                      "absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-500 flex items-center justify-center",
                      isMaintenance ? 'left-9' : 'left-1'
                    )}>
                       {saving ? <RefreshCw size={12} className="animate-spin text-slate-400" /> : isMaintenance ? <Lock size={12} strokeWidth={3} className="text-rose-600" /> : <Unlock size={12} strokeWidth={3} className="text-slate-300" />}
                    </div>
                 </button>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
                    <MessageSquare size={16} strokeWidth={2.5} className="text-primary opacity-50" /> 
                    Thông báo hiển thị cho nhân sự
                 </label>
                 <textarea 
                    value={maintenanceMsg}
                    onChange={(e) => setMaintenanceMsg(e.target.value)}
                    placeholder="VD: Hệ thống đang tái cấu trúc dữ liệu..."
                    className="form-input min-h-[120px] shadow-sm font-medium"
                 />
              </div>
           </div>

           <div className="p-8 bg-blue-50/30 border-t border-slate-50 flex items-start gap-4">
              <div className="w-12 h-12 bg-white text-primary rounded-2xl border border-blue-100/50 flex items-center justify-center shadow-sm shrink-0">
                 <ShieldCheck size={24} strokeWidth={2.5} />
              </div>
              <div className="space-y-1.5 pt-1">
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest">PAV-Sync Protocol Enabled</p>
                 <p className="text-xs text-slate-500 leading-relaxed font-medium">
                   Hệ thống truyền phát tín hiệu phong tỏa qua Socket thời gian thực. Toàn bộ phiên làm việc sẽ bị chấm dứt mà không cần tải lại trình duyệt.
                 </p>
              </div>
           </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-4 px-2">
           <div className="flex items-center gap-3 text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
              <Activity size={14} /> System Health: 100%
           </div>
           <button 
             onClick={() => showToast('success', 'Đã lưu cấu hình hệ thống')}
             className="btn-primary gap-3 h-14 px-12 shadow-vibrant active:scale-95 transition-all text-[11px] uppercase tracking-widest"
           >
              <Save size={20} strokeWidth={2.5} />
              <span>Lưu cấu hình hệ thống</span>
           </button>
        </div>
      </div>

      <div className="flex justify-between items-center py-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] opacity-40 px-4">
         <div className="flex items-center gap-3">
            <Terminal size={16} strokeWidth={2.5} /> 
            <span>System Config Shell v4.0</span>
         </div>
      </div>
    </div>
  );
}
