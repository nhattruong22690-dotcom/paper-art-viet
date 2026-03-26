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
  ArrowRight
} from 'lucide-react';
import { getEmployees, deleteEmployee } from '@/services/employee.service';
import { useNotification } from '@/context/NotificationContext';

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
  const { showToast } = useNotification();
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
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-slate-400 animate-in fade-in">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Đang đồng bộ hồ sơ nhân sự...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
            <Users size={12} />
            <span>Nhân sự</span>
            <ChevronRight size={10} />
            <span className="text-primary italic">Employee Directory</span>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Danh bạ <span className="text-primary italic">Nhân sự</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">
             Quản lý hồ sơ, cấp quyền và theo dõi trạng thái nhân sự toàn hệ thống.
          </p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary gap-3 shadow-vibrant"
        >
          <UserPlus size={20} strokeWidth={2.5} />
          <span>Thêm nhân viên mới</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="card !p-5 flex flex-col md:flex-row gap-5 border border-slate-50 shadow-soft">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên, email hoặc phòng ban..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-12 h-12 bg-slate-50/50 border-slate-100 rounded-xl"
          />
        </div>
        <button className="btn-secondary gap-3 whitespace-nowrap px-8">
          <Filter size={18} strokeWidth={2.5} /> 
          <span>Bộ lọc nâng cao</span>
        </button>
      </div>

      {/* Employee Table */}
      <div className="card !p-0 border border-slate-50 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="!mt-0">
            <thead>
              <tr>
                <th className="px-8">Nhân viên</th>
                <th className="px-8">Phòng ban & Chức vụ</th>
                <th className="px-8">Thông tin liên hệ</th>
                <th className="px-8">Quản trị hệ thống</th>
                <th className="w-24 px-8"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="group transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-primary flex items-center justify-center font-black text-sm shrink-0 uppercase shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        {emp.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 tracking-tight text-base group-hover:text-primary transition-colors">{emp.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{emp.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                      <p className="font-bold text-slate-900 text-sm tracking-tight">{emp.department}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg">{emp.position}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm",
                          emp.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100 opacity-60'
                        )}>
                          {emp.status === 'active' ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 tracking-tight">
                        <Mail size={12} className="text-primary opacity-50" strokeWidth={3} />
                        {emp.email}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <Phone size={12} className="text-slate-300" strokeWidth={3} />
                        {emp.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1.5">
                       <div className="flex items-center gap-2 text-xs font-bold text-slate-900 tracking-tight">
                         <Calendar size={14} className="text-slate-300" />
                         {emp.joinDate || '---'}
                       </div>
                       <div className={cn(
                         "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                         emp.account?.role ? "bg-blue-50 text-primary border border-blue-100" : "bg-slate-50 text-slate-300 border border-slate-100"
                       )}>
                          <ShieldCheck size={10} strokeWidth={3} />
                          {emp.account?.role || 'No Account'}
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 justify-end translate-x-4 group-hover:translate-x-0">
                       <button 
                         onClick={() => {
                           setSelectedEmployee(emp);
                           setIsGrantModalOpen(true);
                         }}
                         className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-blue-50 hover:border-blue-100 border border-transparent rounded-xl transition-all"
                         title="Cấp tài khoản"
                       >
                          <UserCog size={18} strokeWidth={2.5} />
                       </button>
                       <button 
                         onClick={() => handleDelete(emp.id)}
                         className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 border border-transparent rounded-xl transition-all"
                         title="Xóa hồ sơ"
                       >
                          <Trash2 size={18} strokeWidth={2.5} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-32 text-center text-slate-200">
                     <Users size={64} strokeWidth={1} className="mx-auto mb-6 opacity-10" />
                     <p className="text-xs font-black uppercase tracking-[0.3em]">Không tìm thấy hồ sơ phù hợp</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="pt-8 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
         <span>Human Capital v3.1</span>
         <span className="flex items-center gap-2 pl-4 border-l border-slate-100">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            Database Synchronized
         </span>
      </div>
    </div>
  );
}
