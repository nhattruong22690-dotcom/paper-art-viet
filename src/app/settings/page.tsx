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
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Check,
  Clock
} from 'lucide-react';
import { 
  getConfig, 
  setMaintenanceMode, 
  getMilestoneTemplate, 
  updateMilestoneTemplate 
} from '@/services/systemConfig.service';
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

        {/* Milestone Template Management Card */}
        <div className="neo-card !p-0 shadow-neo overflow-hidden bg-white">
           <div className="px-10 py-8 border-b-neo border-black bg-neo-blue/10 flex flex-col sm:flex-row justify-between items-center gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-white text-black border-neo border-black rounded-2xl flex items-center justify-center shadow-neo-active">
                    <Activity size={32} strokeWidth={2.5} />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-black uppercase tracking-tight font-space">Thời hạn mặc định</h3>
                    <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.3em] mt-2 leading-none">Milestone Duration Templates</p>
                 </div>
              </div>
              <div className="px-5 py-2 bg-black text-neo-blue rounded-xl text-[10px] font-black uppercase tracking-widest shadow-neo-active">
                AUTO-CALCULATION MAPPING
              </div>
           </div>

           <MilestoneManager />
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

        {/* Footer info box */}
        <div className="flex justify-between items-center py-12 text-[11px] font-black text-black/20 uppercase tracking-[0.5em] px-8 border-t-2 border-dashed border-black/10">
           <div className="flex items-center gap-4">
              <Terminal size={20} strokeWidth={2} /> 
              <span>System Config Shell v4.0.25</span>
           </div>
        </div>
      </div>
    );
}

function MilestoneManager() {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<{ id: string, label: string, duration: number }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [newItem, setNewItem] = useState({ label: '', duration: 1 });

  useEffect(() => {
    loadTemplate();
  }, []);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const data = await getMilestoneTemplate();
      if (Array.isArray(data)) {
        setItems(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedItems: any[]) => {
    setIsSaving(true);
    try {
      await updateMilestoneTemplate(updatedItems);
      setItems(updatedItems);
      // No toast on every blur to avoid spamming
    } catch (err) {
      showToast('error', 'Lỗi khi lưu cấu hình');
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = () => {
    if (!newItem.label.trim()) return;
    const updated = [...items, { ...newItem, id: Math.random().toString(36).substr(2, 9) }];
    setItems(updated);
    setNewItem({ label: '', duration: 1 });
    handleSave(updated);
    showToast('success', 'Đã thêm công đoạn mới');
  };

  const removeItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    handleSave(updated);
    showToast('success', 'Đã xóa công đoạn');
  };

  const updateItem = (id: string, updates: Partial<{label: string, duration: number}>) => {
    const updated = items.map(i => i.id === id ? { ...i, ...updates } : i);
    setItems(updated);
  };

  return (
    <div className="p-10 space-y-8 bg-white">
      <div className="space-y-4">
        <div className="flex justify-between items-center ml-2">
           <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">Thiết lập danh mục khâu dự báo</p>
           {isSaving && <div className="flex items-center gap-2 text-[10px] font-black text-neo-blue animate-pulse"><RefreshCw size={10} className="animate-spin" /> Đang đồng bộ...</div>}
        </div>
        
        <div className="flex gap-4">
           <div className="flex-[2] relative group">
              <input 
                type="text" 
                placeholder="Tên công đoạn mới (VD: Thiết kế)..."
                className="form-input w-full p-4 h-14 text-sm font-bold shadow-neo-active focus:shadow-neo"
                value={newItem.label}
                onChange={e => setNewItem({...newItem, label: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
           </div>
           <div className="flex-1 relative group">
              <input 
                type="number" 
                min="0"
                className="form-input w-full p-4 h-14 text-sm font-bold shadow-neo-active focus:shadow-neo"
                value={newItem.duration}
                onChange={e => setNewItem({...newItem, duration: parseInt(e.target.value) || 0})}
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/30 pointer-events-none uppercase">Ngày</div>
           </div>
           <button 
             onClick={addItem}
             disabled={isSaving || !newItem.label.trim()}
             className="w-14 h-14 bg-black text-white rounded-xl border-neo border-black shadow-neo-active hover:shadow-neo transition-all flex items-center justify-center shrink-0 active:translate-y-0.5"
           >
              <Plus size={24} strokeWidth={3} />
           </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin opacity-20" size={32} /></div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center opacity-20 italic text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-black/10 rounded-2xl">
            Chưa có công đoạn mặc định nào
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item.id}
              className="group flex items-center gap-4 p-5 bg-white border-2 border-black rounded-xl shadow-neo-sm hover:translate-x-1 transition-all"
            >
              <div className="w-10 h-10 bg-neo-blue/5 border-2 border-black rounded-lg flex items-center justify-center shadow-neo-sm shrink-0">
                 <Clock size={16} className="text-neo-blue" strokeWidth={3} />
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row md:items-center gap-4">
                 <input 
                    className="flex-1 text-sm font-black uppercase tracking-tight bg-transparent border-none outline-none focus:bg-neo-blue/5 rounded px-2 py-1 placeholder:font-normal placeholder:normal-case"
                    value={item.label}
                    placeholder="Tên công đoạn..."
                    onChange={(e) => updateItem(item.id, { label: e.target.value })}
                    onBlur={() => handleSave(items)}
                 />
                 <div className="flex items-center gap-3">
                    <div className="relative group/dur">
                       <input 
                          type="number"
                          min="0"
                          className="w-16 text-[11px] font-bold text-black border-b-2 border-black/10 focus:border-neo-blue outline-none bg-transparent text-center tabular-nums transition-colors"
                          value={item.duration}
                          onChange={(e) => updateItem(item.id, { duration: parseInt(e.target.value) || 0 })}
                          onBlur={() => handleSave(items)}
                       />
                       <span className="text-[8px] font-black text-black/30 uppercase tracking-widest ml-1">Ngày</span>
                    </div>
                    <div className="px-2 py-0.5 bg-black/5 text-[8px] font-black text-black/30 rounded uppercase tracking-tighter tabular-nums border border-black/5">
                       ID: {item.id}
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => removeItem(item.id)}
                className="w-10 h-10 rounded-lg bg-white border-2 border-neo-red/20 flex items-center justify-center text-neo-red/40 opacity-20 group-hover:opacity-100 hover:text-neo-red hover:bg-neo-red/5 hover:border-neo-red transition-all shadow-neo-sm active:translate-y-0.5 active:shadow-none"
              >
                <Trash2 size={16} strokeWidth={3} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-3 p-4 bg-neo-blue/5 border-2 border-neo-blue/20 border-dashed rounded-xl">
         <div className="w-8 h-8 rounded-full bg-neo-blue/10 flex items-center justify-center shrink-0">
            <Info size={14} className="text-neo-blue" />
         </div>
         <p className="text-[9px] font-bold text-neo-blue/60 uppercase leading-relaxed tracking-wider">
            Hệ thống tự động lưu khi bạn thay đổi thông tin. <span className="text-black/80 font-black">ID của từng khâu luôn được giữ cố định</span> để đảm bảo tính nhất quán dữ liệu cho các báo cáo sau này.
         </p>
      </div>
    </div>
  );
}
