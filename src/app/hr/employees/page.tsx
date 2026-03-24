"use client";

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Search, 
  Filter, 
  Plus, 
  Loader2, 
  Lock, 
  ShieldCheck, 
  X, 
  CreditCard, 
  MapPin, 
  Phone, 
  Mail,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';

export default function EmployeesPage() {
  const router = useRouter();
  const { showToast } = useNotification();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmployeeData, setNewEmployeeData] = useState({
    name: '',
    employeeCode: '',
    phone: '',
    email: '',
    idCard: '',
    address: '',
    department: 'Sản xuất',
    position: 'Công nhân',
    joinDate: new Date().toISOString().split('T')[0],
    salaryType: 'monthly',
    baseSalary: 0
  });
  const [adding, setAdding] = useState(false);

  // Account Granting Modal State
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [grantData, setGrantData] = useState({
    email: '',
    role: 'Production'
  });
  const [granting, setGranting] = useState(false);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/employees');
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load employees:', err);
      showToast('error', 'Không thể tải danh sách nhân viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async () => {
    if (!newEmployeeData.name || !newEmployeeData.employeeCode) {
      showToast('error', 'Vui lòng điền Tên và Mã nhân viên');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEmployeeData)
      });
      
      if (res.ok) {
        showToast('success', 'Đã thêm nhân viên mới');
        setIsAddModalOpen(false);
        fetchEmployees();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Lỗi khi thêm');
      }
    } catch (err) {
      showToast('error', 'Lỗi hệ thống');
    } finally {
      setAdding(false);
    }
  };

  const handleGrantAccount = async () => {
    if (!grantData.email) return;

    setGranting(true);
    try {
      const res = await fetch('/api/hr/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: selectedEmp.id,
          email: grantData.email,
          role: grantData.role
        })
      });

      if (res.ok) {
        showToast('success', 'Đã cấp tài khoản thành công');
        setIsGrantModalOpen(false);
        fetchEmployees();
      } else {
        const err = await res.json();
        showToast('error', err.error || 'Cấp tài khoản thất bại');
      }
    } catch (err) {
      showToast('error', 'Lỗi khi cấp tài khoản');
    } finally {
      setGranting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 pb-32 md:pb-20 px-4 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">
            <span>PAV ERP</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900">Nhân sự</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight italic">Danh sách <span className="text-rose-600 truncate">Nhân viên</span></h1>
          <p className="text-gray-500 mt-1 uppercase text-[10px] md:text-xs font-bold tracking-widest italic tracking-tighter leading-relaxed">Hệ thống quản lý định danh & tiền lương Pav ERP</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full md:w-auto bg-primary-600 text-white rounded-[24px] px-8 py-4 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all flex items-center justify-center gap-3 active:scale-95 min-h-[50px]"
        >
          <Plus size={18} />
          Thêm nhân viên mới
        </button>
      </header>

      {/* SEARCH/FILTER */}
      <div className="flex flex-col md:flex-row gap-4 px-1 md:px-0">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-3xl py-4 md:py-5 pl-14 pr-8 text-sm outline-none focus:ring-4 focus:ring-rose-50 transition-all font-bold tracking-tight uppercase"
          />
        </div>
      </div>

      <div className="bg-white rounded-[32px] md:rounded-[48px] border border-gray-100 shadow-2xl shadow-gray-100/30 overflow-hidden min-h-[500px]">
        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-gray-400 italic">
             <Loader2 size={40} className="animate-spin text-rose-600" />
             <p className="text-[11px] font-black uppercase tracking-widest text-rose-300">Đang quét hồ sơ nhân sự...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhân viên</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bộ phận / Chức vụ</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Hệ thống</th>
                  <th className="p-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-rose-50/10 transition-all group">
                    <td 
                      className="p-8 flex items-center gap-5 cursor-pointer group/link" 
                      onClick={() => emp.id && router.push(`/hr/employees/${emp.id}`)}
                    >
                       <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover/link:bg-white group-hover/link:shadow-lg group-hover/link:text-primary-600 transition-all">
                          <User size={20} />
                       </div>
                       <div className="flex flex-col">
                          <span className="font-black text-gray-900 tracking-tight group-hover/link:text-primary-600 underline decoration-transparent group-hover/link:decoration-primary-200 transition-all">
                            {emp.name}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {emp.employeeCode}
                          </span>
                       </div>
                    </td>
                    <td className="p-8">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-gray-800 uppercase tracking-tight">{emp.department}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">{emp.position}</span>
                       </div>
                    </td>
                    <td className="p-8">
                       {emp.hasAccount ? (
                         <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                             <ShieldCheck size={12} /> {emp.account?.role}
                           </div>
                           {emp.account?.is_active ? 
                             <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> :
                             <Lock size={12} className="text-rose-400" />
                           }
                         </div>
                       ) : (
                         <button 
                           onClick={() => {
                             setSelectedEmp(emp);
                             setGrantData({...grantData, email: emp.email || ''});
                             setIsGrantModalOpen(true);
                           }}
                           className="flex items-center gap-1 text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
                         >
                            <Plus size={12} /> Cấp tài khoản
                         </button>
                       )}
                    </td>
                    <td className="p-8 text-right">
                       <button 
                         onClick={() => emp.id && router.push(`/hr/employees/${emp.id}`)}
                         className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                       >
                          <ChevronRight size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-50">
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="p-6 space-y-4 active:bg-rose-50 transition-all">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => emp.id && router.push(`/hr/employees/${emp.id}`)}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <User size={20} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-gray-900 tracking-tight truncate uppercase text-sm">{emp.name}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{emp.employeeCode}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => emp.id && router.push(`/hr/employees/${emp.id}`)}
                      className="w-11 h-11 flex items-center justify-center bg-gray-50 text-gray-400 rounded-2xl active:bg-rose-500 active:text-white transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pl-16">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-gray-800 uppercase tracking-tight">{emp.department}</span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">{emp.position}</span>
                    </div>
                    
                    <div className="shrink-0 scale-90 origin-right">
                       {emp.hasAccount ? (
                         <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-black uppercase tracking-widest">
                             <ShieldCheck size={10} /> {emp.account?.role}
                           </div>
                           {emp.account?.is_active ? 
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> :
                             <Lock size={10} className="text-rose-400" />
                           }
                         </div>
                       ) : (
                         <button 
                           onClick={() => {
                             setSelectedEmp(emp);
                             setGrantData({...grantData, email: emp.email || ''});
                             setIsGrantModalOpen(true);
                           }}
                           className="flex items-center gap-1 text-[9px] font-black text-primary-500 uppercase tracking-widest bg-primary-50 px-3 py-1.5 rounded-lg active:scale-95 min-h-[44px]"
                         >
                            <Plus size={10} /> Cấp quyền
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredEmployees.length === 0 && (
              <div className="py-32 text-center text-gray-300 italic uppercase font-black text-[10px] tracking-[0.2em] opacity-30">
                 Không tìm thấy nhân viên
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-8 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-t-[32px] md:rounded-[48px] w-full max-w-2xl overflow-y-auto max-h-[90vh] md:max-h-none shadow-2xl relative animate-in slide-in-from-bottom-8">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 md:top-8 right-6 md:right-8 p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 md:p-12 space-y-8 md:space-y-10">
                 <header>
                    <span className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] italic">New Record</span>
                    <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight text-gray-900">Thêm nhân sự <span className="text-rose-600">Mới</span></h2>
                 </header>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và Tên</label>
                       <input 
                         type="text"
                         value={newEmployeeData.name}
                         onChange={(e) => setNewEmployeeData({...newEmployeeData, name: e.target.value})}
                         placeholder="VD: Nguyen Van A"
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl md:rounded-3xl py-4 md:py-5 px-6 md:px-8 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-primary-50 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mã nhân viên (ID)</label>
                       <input 
                         type="text"
                         value={newEmployeeData.employeeCode}
                         onChange={(e) => setNewEmployeeData({...newEmployeeData, employeeCode: e.target.value})}
                         placeholder="VD: PAV-001"
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl md:rounded-3xl py-4 md:py-5 px-6 md:px-8 text-sm font-black focus:bg-white uppercase tracking-widest"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                       <input 
                         type="text"
                         value={newEmployeeData.phone}
                         onChange={(e) => setNewEmployeeData({...newEmployeeData, phone: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl md:rounded-3xl py-4 md:py-5 px-6 md:px-8 text-sm font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tổ làm việc</label>
                       <select 
                         value={newEmployeeData.department}
                         onChange={(e) => setNewEmployeeData({...newEmployeeData, department: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl md:rounded-3xl py-4 md:py-5 px-6 md:px-8 text-sm font-black uppercase appearance-none"
                       >
                          <option value="Sản xuất">Sản xuất</option>
                          <option value="Kho vận">Kho vận</option>
                          <option value="Hành chính">Hành chính</option>
                          <option value="Kinh doanh">Kinh doanh</option>
                       </select>
                    </div>
                 </div>

                 <button 
                   onClick={handleAddEmployee}
                   disabled={adding}
                   className="w-full py-5 bg-primary-600 text-white rounded-[24px] md:rounded-[28px] font-black uppercase text-[11px] tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 min-h-[56px]"
                 >
                    {adding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    Xác nhận nhập hồ sơ mới
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* GRANT ACCOUNT MODAL */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-8 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-t-[32px] md:rounded-[48px] w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setIsGrantModalOpen(false)}
                className="absolute top-6 md:top-8 right-6 md:right-8 p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 md:p-10 space-y-8">
                 <header className="text-center">
                    <ShieldCheck className="mx-auto text-primary-600 mb-4" size={48} />
                    <h2 className="text-2xl font-black italic uppercase tracking-tight text-gray-900">Cấp quyền <span className="text-rose-600">Hệ thống</span></h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 italic">Cấp tài khoản cho: {selectedEmp?.name}</p>
                 </header>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email đăng nhập</label>
                       <input 
                         type="email"
                         value={grantData.email}
                         onChange={(e) => setGrantData({...grantData, email: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl md:rounded-3xl py-4 md:py-5 px-6 md:px-8 text-sm font-bold focus:bg-white transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vai trò (Role)</label>
                       <select 
                         value={grantData.role}
                         onChange={(e) => setGrantData({...grantData, role: e.target.value})}
                         className="w-full bg-gray-50 border border-gray-100 rounded-2xl md:rounded-3xl py-4 md:py-5 px-6 md:px-8 text-sm font-black uppercase appearance-none"
                       >
                          <option value="Admin">Admin</option>
                          <option value="Production">Sản xuất</option>
                          <option value="Warehouse">Kho vận</option>
                          <option value="Sales">Kinh doanh</option>
                       </select>
                    </div>
                 </div>

                 <button 
                   onClick={handleGrantAccount}
                   disabled={granting}
                   className="w-full py-5 bg-gray-900 text-white rounded-[24px] md:rounded-[28px] font-black uppercase text-[11px] tracking-widest hover:bg-primary-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 min-h-[56px]"
                 >
                    {granting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                    Xác nhận cấp tài khoản
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
