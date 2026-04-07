"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCog, 
  Mail, 
  ShieldCheck, 
  Shield, 
  Lock, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Employee {
  id: string;
  name: string;
  email: string;
  employeeCode: string;
  account?: any;
}

interface GrantAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSuccess: () => void;
}

export default function GrantAccountModal({ isOpen, onClose, employee, onSuccess }: GrantAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const { showToast } = useNotification();

  useEffect(() => {
    if (employee) {
      setEmail(employee.email || '');
      setRole(employee.account?.role || 'staff');
    }
  }, [employee, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/hr/employees/${employee.id}/grant-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      showToast('success', `Đã cấp quyền truy cập hệ thống cho ${employee.name}`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Grant account error:', error);
      showToast('error', error.message || 'Cấp tài khoản thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  const isExisting = !!employee.account;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white border-[2.5px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] rounded-xl flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b-[2.5px] border-black flex justify-between items-center bg-[#D8B4FE]/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white border-2 border-black rounded-lg flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <UserCog size={24} className="text-black" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black uppercase italic tracking-tight">
                {isExisting ? 'Cập nhật tài khoản' : 'Cấp tài khoản hệ thống'}
              </h2>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-widest mt-1 italic">
                System Access Authorization
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-black/20 hover:text-black transition-colors">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {/* Employee Info Card */}
          <div className="p-5 bg-[#FAF7F2] border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start mb-2">
                <span className="text-[9px] font-black text-black/30 uppercase tracking-[0.2em]">Personnel Record</span>
                <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black uppercase rounded">{employee.employeeCode}</span>
            </div>
            <p className="text-lg font-black text-black uppercase italic">{employee.name}</p>
          </div>

          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest flex items-center gap-2 italic">
                <Mail size={14} /> Email đăng nhập
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@paperartviet.com"
                required
                className="form-input h-14 font-black bg-white"
              />
              <p className="text-[9px] text-black/30 font-black italic">(*) Đây sẽ là tài khoản dùng để đăng nhập vào hệ thống ERP.</p>
            </div>

            {/* Role Selection */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest flex items-center gap-2 italic">
                <ShieldCheck size={14} /> Phân quyền hệ thống (Role)
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'admin', label: 'Administrator', desc: 'Toàn quyền hệ thống', color: 'bg-neo-purple' },
                  { id: 'manager', label: 'Manager', desc: 'Quản lý bộ phận', color: 'bg-neo-blue' },
                  { id: 'staff', label: 'Staff Member', desc: 'Nhân viên tác nghiệp', color: 'bg-neo-yellow' },
                  { id: 'guest', label: 'Guest', desc: 'Chỉ xem dữ liệu', color: 'bg-black/5' },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={cn(
                      "p-4 rounded-xl border-2 border-black text-left transition-all relative group",
                      role === r.id 
                        ? `${r.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]` 
                        : "bg-white hover:bg-black/5"
                    )}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-black uppercase italic">{r.label}</span>
                      {role === r.id && <CheckCircle2 size={14} className="text-black" />}
                    </div>
                    <p className="text-[9px] font-bold text-black/40 uppercase tracking-tighter">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Note */}
            {!isExisting && (
              <div className="flex items-start gap-4 p-4 bg-neo-yellow border-2 border-black rounded-xl italic">
                <Lock size={18} className="shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold text-black leading-relaxed">
                  Hệ thống sẽ tự động cấp mật khẩu mặc định là <span className="underline decoration-2">PaperArt@2025</span>. Nhân viên có thể đổi mật khẩu sau khi đăng nhập lần đầu.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="btn-secondary flex-1 h-16 uppercase text-xs tracking-widest font-black"
            >
              Hủy bỏ
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="btn-primary flex-[2] h-16 uppercase text-xs tracking-widest font-black gap-3"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} strokeWidth={3} />
              ) : (
                <Shield size={20} strokeWidth={3} />
              )}
              <span>{isExisting ? 'Cập nhật quyền' : 'Kích hoạt tài khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


