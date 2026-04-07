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
  ChevronDown,
  Settings2,
  Pencil
} from 'lucide-react';
import { getEmployees, deleteEmployee } from '@/services/employee.service';
import EmployeeFormModal from '@/components/hr/EmployeeFormModal';
import HRConfigModal from '@/components/hr/HRConfigModal';
import GrantAccountModal from '@/components/hr/GrantAccountModal';
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
  isKPI: boolean;
  isNew: boolean;
  account?: any;
}

export default function EmployeesPage() {
  const { showToast, confirm: confirmDialog } = useNotification();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
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
        
        <div className="flex gap-4">
          <button 
            onClick={() => setIsConfigModalOpen(true)}
            className="btn-secondary h-14 px-8 text-xs uppercase tracking-widest gap-3"
          >
            <Settings2 size={20} strokeWidth={3} />
            <span>Cơ cấu tổ chức</span>
          </button>
          
          <button 
            onClick={() => {
              setSelectedEmployee(null);
              setIsAddModalOpen(true);
            }}
            className="btn-primary h-14 px-10 text-xs uppercase tracking-widest gap-4"
          >
            <UserPlus size={20} strokeWidth={3} />
            <span>Thêm nhân viên mới</span>
          </button>
        </div>
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
      <div className="md:neo-card md:!p-0 md:overflow-hidden">
        <div className="w-full flex flex-col md:table md:border-collapse space-y-4 md:space-y-0">
          {/* Desktop Table Header */}
          <div className="hidden md:table-header-group bg-black text-[10px] font-black text-neo-purple uppercase tracking-widest">
            <div className="table-row">
              <div className="table-cell px-8 py-5 border-b-2 border-black">Nhân viên</div>
              <div className="table-cell px-8 py-5 border-b-2 border-black">Phòng ban & Chức vụ</div>
              <div className="table-cell px-8 py-5 border-b-2 border-black">Thông tin liên hệ</div>
              <div className="table-cell px-8 py-5 border-b-2 border-black">Quản trị hệ thống</div>
              <div className="table-cell w-32 px-8 border-b-2 border-black"></div>
            </div>
          </div>
          
          {/* Table Body / Mobile Cards */}
          <div className="block md:table-row-group md:divide-y-2 md:divide-black/5 w-full">
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="block md:table-row group hover:bg-neo-purple/5 transition-all bg-white border-[2.5px] border-black md:border-0 rounded-2xl md:rounded-none p-5 md:p-0 mb-4 md:mb-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-none w-full">
                
                {/* Cột 1: Nhân viên */}
                <div className="block md:table-cell px-2 py-3 md:px-8 md:py-6 border-b-2 border-black/5 md:border-0 border-dashed">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white border-2 border-black text-black flex items-center justify-center font-black text-sm shrink-0 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-black group-hover:text-white transition-all duration-300 italic">
                      {emp.name.substring(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                         <p className="font-black text-black tracking-tight text-base uppercase italic group-hover:text-neo-purple transition-colors leading-none">{emp.name}</p>
                         {emp.isNew && (
                           <span className="px-1.5 py-0.5 rounded bg-neo-blue text-black text-[7px] font-black uppercase tracking-tighter shadow-neo-sm border border-black">NEW</span>
                         )}
                      </div>
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mt-1">{emp.employeeCode}</p>
                    </div>
                  </div>
                </div>
                
                {/* Cột 2: Tổ chức */}
                <div className="block md:table-cell px-2 py-4 md:px-8 md:py-6 border-b-2 border-black/5 md:border-0 border-dashed">
                  <div className="space-y-2">
                    <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Vị trí</div>
                    <p className="font-black text-black text-sm tracking-tight uppercase italic pb-1">{emp.department}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-black text-black/40 uppercase tracking-widest bg-black/5 px-2 py-0.5 rounded-lg border border-black/5 italic">{emp.position}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic",
                        emp.status === 'active' ? 'bg-neo-green/20 text-black' : 'bg-black/10 text-black/30 border-black/10 shadow-none'
                      )}>
                        {emp.status === 'active' ? 'Đang làm' : 'Đã nghỉ'}
                      </span>
                      {emp.isKPI && (
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-neo-yellow border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic">KPI</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Cột 3: Liên hệ */}
                <div className="block md:table-cell px-2 py-4 md:px-8 md:py-6 border-b-2 border-black/5 md:border-0 border-dashed">
                  <div className="space-y-3 md:space-y-2">
                    <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">Liên hệ</div>
                    <div className="flex items-center gap-3 text-xs font-black text-black tracking-tight italic">
                      <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center md:bg-transparent md:w-auto md:h-auto"><Mail size={16} strokeWidth={3} className="text-black/60 md:text-black/20" /></div>
                      {emp.email}
                    </div>
                    <div className="flex items-center gap-3 text-xs md:text-[10px] font-black text-black/60 md:text-black/40 uppercase tracking-widest tabular-nums">
                      <div className="w-8 h-8 rounded-lg bg-black/5 flex items-center justify-center md:bg-transparent md:w-auto md:h-auto"><Phone size={16} strokeWidth={3} className="text-black/60 md:text-black/10" /></div>
                      {emp.phone}
                    </div>
                  </div>
                </div>
                
                {/* Cột 4: Hệ thống */}
                <div className="flex justify-between items-center md:table-cell px-2 py-4 md:px-8 md:py-6 border-b-2 border-black/5 md:border-0 border-dashed">
                  <div className="space-y-1 md:space-y-2">
                     <div className="flex md:hidden text-[9px] font-black text-black/40 uppercase tracking-widest mb-2">Hệ thống</div>
                     <div className="flex items-center gap-2 text-[10px] md:text-xs font-black text-black/60 md:text-black tracking-tight tabular-nums italic pb-2 md:pb-0">
                       <Calendar size={14} strokeWidth={3} className="text-black/40 md:text-black/20" />
                       Ngày vào: {emp.joinDate || '---'}
                     </div>
                     <div className={cn(
                       "inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] italic",
                       emp.account?.role ? "bg-neo-purple/20 text-black" : "bg-white text-black/20 border-black/10 shadow-none"
                     )}>
                        <ShieldCheck size={12} strokeWidth={3} />
                        {emp.account?.role || 'No Account'}
                     </div>
                  </div>
                </div>
                
                {/* Cột 5: Hành động */}
                <div className="block md:table-cell px-2 pt-4 pb-2 md:px-8 md:py-6 text-right">
                  <div className="flex items-center gap-3 justify-between md:justify-end w-full">
                     <div className="text-[9px] font-black text-black/40 uppercase tracking-widest md:hidden">Thao tác</div>
                     <div className="flex gap-2">
                       <button 
                         onClick={() => {
                           setSelectedEmployee(emp);
                           setIsAddModalOpen(true);
                         }}
                         className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:text-black/20 md:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
                         title="Chỉnh sửa hồ sơ"
                       >
                          <Pencil size={18} strokeWidth={3} />
                       </button>
                       <button 
                         onClick={() => {
                           setSelectedEmployee(emp);
                           setIsGrantModalOpen(true);
                         }}
                         className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black/40 hover:text-black hover:bg-black/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:text-black/20 md:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
                         title="Cấp tài khoản"
                       >
                          <UserCog size={20} strokeWidth={3} />
                       </button>
                       <button 
                         onClick={() => handleDelete(emp.id)}
                         className="w-10 h-10 border-2 border-black rounded-xl flex items-center justify-center text-black/40 hover:text-neo-red hover:bg-neo-red/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:text-black/20 md:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[1px] active:shadow-none bg-white"
                         title="Xóa hồ sơ"
                       >
                          <Trash2 size={20} strokeWidth={3} />
                       </button>
                     </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredEmployees.length === 0 && (
              <div className="block md:table-row">
                <div className="block md:table-cell col-span-5 py-32 text-center opacity-10">
                   <Users size={80} strokeWidth={1} className="mx-auto mb-6" />
                   <p className="text-sm font-black uppercase tracking-[0.4em] italic">No active personnel records found</p>
                </div>
              </div>
            )}
          </div>
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

      <EmployeeFormModal 
        isOpen={isAddModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSuccess={() => {
          loadEmployees();
          showToast('success', selectedEmployee ? 'Đã cập nhật hồ sơ thành công' : 'Đã thêm nhân viên mới thành công');
        }}
      />

      <HRConfigModal 
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />

      <GrantAccountModal 
        isOpen={isGrantModalOpen}
        employee={selectedEmployee}
        onClose={() => {
          setIsGrantModalOpen(false);
          setSelectedEmployee(null);
        }}
        onSuccess={() => {
          loadEmployees();
          showToast('success', 'Đã cập nhật tài khoản thành công');
        }}
      />
    </div>
  );
}
