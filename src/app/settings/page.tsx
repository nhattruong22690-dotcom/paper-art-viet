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
  MessageSquare
} from 'lucide-react';
import { getConfig, setMaintenanceMode } from '@/services/systemConfig.service';
import { useNotification } from '@/context/NotificationContext';

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
      <div className="py-40 flex flex-col items-center gap-4 text-gray-400">
         <Loader2 className="animate-spin text-primary-600" size={32} />
         <p className="text-[10px] font-black uppercase tracking-widest italic animate-pulse">Đang nạp cấu hình bảo mật...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700 px-4 md:px-0">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">
            <span>PAV ERP</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 uppercase">System Control</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight italic uppercase">Cài đặt <span className="text-primary-600">Hệ thống</span></h1>
          <p className="text-gray-500 mt-1 uppercase text-[10px] font-bold tracking-[0.2em] italic leading-relaxed">Quản trị trạng thái và quyền truy cập cốt lõi</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10">
        <div className="card-refined overflow-hidden border-2 border-transparent transition-all hover:border-gray-50 bg-white">
           <header className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                    <ShieldAlert size={24} />
                 </div>
                 <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase italic font-black tracking-tight">Lockdown & <span className="text-rose-600">Maintenance</span></h3>
              </div>
              <div className="px-4 py-1.5 bg-gray-100 rounded-lg text-[9px] font-black text-gray-400 uppercase tracking-widest">Master Control</div>
           </header>

           <div className="p-8 bg-gray-50 rounded-[32px] md:rounded-[40px] border border-gray-100 space-y-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
                 <Lock size={160} />
              </div>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
                 <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                       <p className="text-lg font-black text-gray-900 uppercase italic tracking-tight">Chế độ Bảo trì Hệ thống</p>
                       <div className={`px-2 py-0.5 rounded-md text-[8px] font-black text-white uppercase tracking-widest ${isMaintenance ? 'bg-rose-500 animate-pulse' : 'bg-gray-400'}`}>
                          {isMaintenance ? 'ON' : 'OFF'}
                       </div>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest italic opacity-70 leading-relaxed max-w-lg">
                       Lưu ý: Khi bật, toàn bộ nhân viên sẽ bị đẩy ra trang thông báo bảo trì. Chỉ tài khoản Admin mới có quyền truy cập tiếp tục.
                    </p>
                 </div>

                 <button 
                   onClick={handleToggleMaintenance}
                   disabled={saving}
                   className={`
                      relative w-20 h-10 md:w-24 md:h-12 rounded-full transition-all duration-500 shadow-inner group
                      ${isMaintenance ? 'bg-rose-600' : 'bg-gray-200'}
                      ${saving ? 'opacity-50' : 'active:scale-95'}
                   `}
                 >
                    <div className={`
                       absolute top-1 md:top-1.5 left-1 md:left-1.5 w-8 h-8 md:w-9 md:h-9 bg-white rounded-full shadow-2xl transition-all duration-500 flex items-center justify-center text-gray-400
                       ${isMaintenance ? 'translate-x-10 md:translate-x-12 text-rose-600' : 'translate-x-0'}
                    `}>
                       {saving ? <Loader2 size={16} className="animate-spin" /> : isMaintenance ? <Lock size={16} /> : <Unlock size={16} />}
                    </div>
                 </button>
              </div>

              <div className="space-y-4 pt-10 border-t border-gray-200/50 relative z-10">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic opacity-60 flex items-center gap-2">
                    <MessageSquare size={12} /> Thông báo hiển thị cho nhân viên
                 </label>
                 <div className="relative">
                    <textarea 
                       value={maintenanceMsg}
                       onChange={(e) => setMaintenanceMsg(e.target.value)}
                       placeholder="VD: Hệ thống đang cập nhật kho dữ liệu mới..."
                       className="w-full bg-white border border-gray-200 rounded-3xl py-6 px-8 text-sm font-bold focus:ring-4 focus:ring-rose-50 transition-all outline-none resize-none min-h-[100px]"
                    />
                    <div className="absolute bottom-6 right-8 flex items-center gap-2 text-[9px] font-black text-gray-300 uppercase tracking-widest italic">
                       <AlertTriangle size={12} className="text-amber-400" /> Auto-Broadcast Enabled
                    </div>
                 </div>
              </div>
           </div>

           <div className="mt-10 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex items-start gap-4">
              <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-500 shadow-sm shrink-0">
                 <Info size={18} />
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-blue-950 uppercase tracking-widest">Cơ chế Realtime-Sync</p>
                 <p className="text-[11px] font-bold text-blue-700/70 leading-relaxed uppercase tracking-widest">
                   Hệ thống sử dụng Supabase Broadcast để gửi tín hiệu 'Lockdown' ngay lập tức. Nhân viên không cần tải lại trang để thấy hiệu quả.
                 </p>
              </div>
           </div>
        </div>
      </div>

      <footer className="flex justify-end gap-4">
         <button className="px-10 py-5 bg-gray-900 text-white rounded-[24px] font-black uppercase text-[11px] tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200 flex items-center gap-3">
            <Save size={18} /> Lưu cấu hình tổng
         </button>
      </footer>
    </div>
  );
}
