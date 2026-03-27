"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  X,
  CreditCard,
  Briefcase,
  Building2,
  Calendar,
  Loader2,
  Trash2,
  UserCog,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { getEmployees, deleteEmployee } from '@/services/employee.service';
import { useNotification } from '@/context/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: string;
  joinDate: string;
  salaryType: string;
  baseSalary: number;
  hasAccount: boolean;
  account?: any;
}

export default function EmployeesPage() {
  const { showToast, confirm: confirmDialog } = useNotification();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await fetch('/api/hr/employees');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEmployees(data);
    } catch (error: any) {
      console.error('Failed to load employees:', error);
      showToast('error', 'Không thể tải danh sách nhân sự');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!await confirmDialog('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    try {
      const res = await fetch(`/api/hr/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Xóa thất bại');
      }
      setEmployees(prev => prev.filter(e => e.id !== id));
      showToast('success', 'Đã xóa nhân viên thành công');
    } catch (error: any) {
      showToast('error', error.message || 'Hành động thất bại');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6 text-black animate-in fade-in">
        <Loader2 className="w-14 h-14 animate-spin text-black opacity-20" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Synchronizing Human Capital Ledger...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Users size={28} className="text-black" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-black tracking-tight uppercase italic">Danh bạ Nhân sự</h1>
              <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">Employee Directory & Organizational Matrix</p>
           </div>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary h-14 px-10 text-xs uppercase tracking-widest gap-4"
        >
          <UserPlus size={20} strokeWidth={3} />
          <span>Thêm nhân viên mới</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group/field">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="Tìm theo tên, email hoặc phòng ban..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-14 h-16 font-black"
          />
        </div>
        <button className="btn-secondary h-16 px-10 text-[10px] uppercase tracking-[0.2em] gap-3">
          <Filter size={20} strokeWidth={3} /> 
          <span>Bộ lọc nâng cao</span>
        </button>
      </div>

      {/* Employee Table */}
      <div className="neo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-[10px] font-black text-neo-purple uppercase tracking-widest">
                <th className="px-8 py-5 border-b-2 border-black">Nhân viên</th>
                <th className="px-8 py-5 border-b-2 border-black">Phòng ban & Chức vụ</th>
                <th className="px-8 py-5 border-b-2 border-black">Thông tin liên hệ</th>
                <th className="px-8 py-5 border-b-2 border-black">Quản trị hệ thống</th>
                <th className="w-32 px-8 border-b-2 border-black"></th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black/5">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="group hover:bg-neo-purple/5 transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white border-2 border-black text-black flex items-center justify-center font-black text-sm shrink-0 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-all duration-300 italic">
                        {emp.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-black tracking-tight text-base uppercase italic group-hover:text-neo-purple transition-colors leading-none">{emp.name}</p>
                        <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mt-1">{emp.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <p className="font-black text-black text-sm tracking-tight uppercase italic">{emp.department}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-black/40 uppercase tracking-widest bg-black/5 px-2 py-0.5 rounded-lg border border-black/5 italic">{emp.position}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic",
                          emp.status === 'active' ? 'bg-neo-green/20 text-black' : 'bg-neo-red/20 text-black'
                        )}>
                          {emp.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black text-black tracking-tight italic">
                        <Mail size={14} strokeWidth={3} className="text-black/20" />
                        {emp.email}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-black/40 uppercase tracking-widest tabular-nums">
                        <Phone size={14} strokeWidth={3} className="text-black/10" />
                        {emp.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-xs font-black text-black tracking-tight tabular-nums italic">
                         <Calendar size={14} strokeWidth={3} className="text-black/20" />
                         {emp.joinDate || '---'}
                       </div>
                       <div className={cn(
                         "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic",
                         emp.account?.role ? "bg-neo-purple/20 text-black" : "bg-white text-black/10 border-black/10 shadow-none"
                       )}>
                          <ShieldCheck size={12} strokeWidth={3} />
                          {emp.account?.role || 'No Account'}
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center gap-3 justify-end">
                       <button 
                         onClick={() => {
                           setSelectedEmployee(emp);
                           setIsGrantModalOpen(true);
                         }}
                         className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black/20 hover:text-black hover:bg-black/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
                         title="Cấp tài khoản"
                       >
                          <UserCog size={20} strokeWidth={3} />
                       </button>
                       <button 
                         onClick={() => handleDelete(emp.id)}
                         className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black/20 hover:text-neo-red hover:bg-neo-red/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
                         title="Xóa hồ sơ"
                       >
                          <Trash2 size={20} strokeWidth={3} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-32 text-center opacity-10">
                     <Users size={80} strokeWidth={1} className="mx-auto mb-6" />
                     <p className="text-sm font-black uppercase tracking-[0.4em] italic">No active personnel records found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="pt-10 border-t-2 border-black border-dashed flex justify-between items-center text-[10px] font-black text-black/20 uppercase tracking-[0.3em] italic">
         <span>Human Capital Framework v4.0 • Enterprise Core</span>
         <span className="flex items-center gap-3 pl-6">
            <span className="w-2 h-2 bg-neo-green rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            Central Personnel Ledger Synchronized
         </span>
      </div>
    </div>
  );
}
