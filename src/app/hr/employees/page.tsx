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
  ChevronRight,
  MoveLeft,
  Pin
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/context/NotificationContext';
import Link from 'next/link';

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
    <div className="max-w-7xl mx-auto space-y-8 pb-32 md:pb-20 px-4 animate-in fade-in duration-700 pt-4">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 text-left relative">
        <div className="flex items-center gap-6">
          <Link 
            href="/mobile-menu/hr"
            className="lg:hidden w-12 h-14 bg-white border-2 border-retro-sepia flex items-center justify-center text-retro-sepia shadow-md active:scale-95 transition-all relative overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-retro-brick/40" />
            <MoveLeft size={24} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <nav className="flex items-center gap-2 font-typewriter text-[10px] font-black text-retro-brick uppercase mb-2">
              <span>PAV ERP</span>
              <span className="text-retro-sepia/20">/</span>
              <span className="text-retro-sepia underline underline-offset-4 decoration-dotted">Hồ sơ nhân viên</span>
            </nav>
            <h1 className="text-3xl md:text-5xl font-typewriter font-black text-retro-sepia tracking-tighter uppercase italic">
              Danh sách <span className="text-retro-brick">Nhân viên</span>
            </h1>
            <div className="font-handwriting text-[11px] text-retro-earth uppercase tracking-widest mt-2 flex items-center gap-2">
               <span className="w-8 h-px bg-retro-earth/30" />
               Personnel Directory & Registry
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="retro-btn w-full md:w-auto bg-retro-sepia text-retro-mustard flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={2} />
          Ghi nhận hồ sơ mới
        </button>
      </header>

      {/* SEARCH/FILTER with Washi Tape Effect */}
      <div className="flex flex-col md:flex-row gap-4 px-1 md:px-0 relative">
        <div className="flex-1 relative washi-tape-top shadow-xl">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/40" size={18} />
          <input 
            type="text" 
            placeholder="Tra cứu tên hoặc mã nhân viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border-2 border-retro-sepia/10 rounded-none py-4 md:py-6 pl-14 pr-8 text-sm outline-none focus:border-retro-sepia transition-all font-typewriter font-bold uppercase tracking-tight"
          />
        </div>
      </div>

      <div className="bg-white border-2 border-retro-sepia/10 shadow-[0_20px_40px_rgba(0,0,0,0.1)] overflow-hidden min-h-[500px] relative">
        {/* Decorative Paper Clip */}
        <div className="paper-clip" />

        {loading ? (
          <div className="py-24 flex flex-col items-center gap-4 text-retro-earth italic">
             <Loader2 size={40} className="animate-spin text-retro-brick" />
             <p className="font-typewriter text-[11px] font-black uppercase tracking-widest text-retro-earth">Đang quét hồ sơ...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table View */}
            <table className="hidden md:table w-full text-left">
              <thead>
                <tr className="bg-retro-paper border-b border-retro-sepia/20">
                  <th className="p-8 font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest">Họ tên nhân viên</th>
                  <th className="p-8 font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest">Tổ đội / Chức vụ</th>
                  <th className="p-8 font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest">Trạng thái hệ thống</th>
                  <th className="p-8 font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-retro-sepia/5 text-sm">
                {filteredEmployees.map(emp => (
                  <tr key={emp.id} className="hover:bg-retro-paper/50 transition-all group">
                    <td 
                      className="p-8 flex items-center gap-5 cursor-pointer group/link" 
                      onClick={() => emp.id && router.push(`/hr/employees/${emp.id}`)}
                    >
                       <div className="w-12 h-12 rounded-full bg-retro-beige border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia/60 group-hover/link:bg-retro-sepia group-hover/link:text-retro-mustard transition-all shadow-inner">
                          <User size={20} strokeWidth={1.5} />
                       </div>
                       <div className="flex flex-col">
                          <span className="font-typewriter text-[13px] font-black text-retro-sepia tracking-tighter group-hover/link:text-retro-brick transition-all">
                            {emp.name}
                          </span>
                          <span className="font-handwriting text-[10px] text-retro-earth mt-1 leading-none">
                            ID: {emp.employeeCode}
                          </span>
                       </div>
                    </td>
                    <td className="p-8">
                       <div className="flex flex-col">
                          <span className="font-typewriter text-[11px] font-black text-retro-sepia uppercase tracking-tighter">{emp.department}</span>
                          <span className="font-handwriting text-[10px] text-retro-earth mt-1 italic leading-none">{emp.position}</span>
                       </div>
                    </td>
                    <td className="p-8">
                       {emp.hasAccount ? (
                         <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-retro-sepia text-retro-mustard text-[9px] font-typewriter font-black uppercase tracking-widest shadow-sm">
                             <ShieldCheck size={12} /> {emp.account?.role}
                           </div>
                           {emp.account?.is_active ? 
                             <div className="flex items-center gap-1">
                               <span className="w-2 h-2 rounded-full bg-retro-moss shadow-[0_0_8px_rgba(85,107,47,0.5)] animate-pulse" />
                               <span className="text-[8px] font-black text-retro-moss font-typewriter uppercase">Online</span>
                             </div> :
                             <Lock size={12} className="text-retro-brick" />
                           }
                         </div>
                       ) : (
                         <button 
                           onClick={() => {
                             setSelectedEmp(emp);
                             setGrantData({...grantData, email: emp.email || ''});
                             setIsGrantModalOpen(true);
                           }}
                           className="flex items-center gap-1 font-handwriting text-xs text-retro-earth hover:text-retro-brick underline underline-offset-4 decoration-retro-brick/20"
                         >
                            <Plus size={12} /> Cấp quyền truy cập
                         </button>
                       )}
                    </td>
                    <td className="p-8 text-right">
                       <button 
                         onClick={() => emp.id && router.push(`/hr/employees/${emp.id}`)}
                         className="p-3 bg-retro-paper text-retro-sepia border border-retro-sepia/10 hover:bg-retro-sepia hover:text-white transition-all active:scale-90"
                       >
                          <ChevronRight size={18} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-retro-sepia/5">
              {filteredEmployees.map(emp => (
                <div key={emp.id} className="p-6 space-y-4 active:bg-retro-paper transition-all relative">
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => emp.id && router.push(`/hr/employees/${emp.id}`)}
                    >
                       <div className="w-12 h-12 rounded-full bg-retro-beige border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia/60">
                        <User size={20} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-typewriter text-sm font-black text-retro-sepia tracking-tighter uppercase truncate">{emp.name}</span>
                        <span className="font-handwriting text-[10px] text-retro-earth mt-1">ID: {emp.employeeCode}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => emp.id && router.push(`/hr/employees/${emp.id}`)}
                      className="w-11 h-11 flex items-center justify-center bg-retro-paper border border-retro-sepia/10 text-retro-sepia active:bg-retro-sepia active:text-white transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between pl-16">
                    <div className="flex flex-col">
                      <span className="font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-tighter">{emp.department}</span>
                      <span className="font-handwriting text-[9px] text-retro-earth italic mt-0.5">{emp.position}</span>
                    </div>
                    
                    <div className="shrink-0 scale-90 origin-right">
                       {emp.hasAccount ? (
                         <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1.5 px-3 py-1 bg-retro-sepia text-retro-mustard text-[8px] font-typewriter font-black uppercase">
                             <ShieldCheck size={10} /> {emp.account?.role}
                           </div>
                         </div>
                       ) : (
                         <button 
                           onClick={() => {
                             setSelectedEmp(emp);
                             setGrantData({...grantData, email: emp.email || ''});
                             setIsGrantModalOpen(true);
                           }}
                           className="font-handwriting text-[10px] text-retro-earth underline decoration-dotted"
                         >
                            Cấp quyền
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredEmployees.length === 0 && (
              <div className="py-32 text-center text-retro-sepia/20 italic uppercase font-typewriter text-[10px] tracking-[0.2em] opacity-30">
                 Hồ sơ trống - Không tìm thấy bản ghi
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD EMPLOYEE MODAL using Antique Folder style */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-8 bg-retro-sepia/80 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white border-4 border-retro-earth w-full max-w-2xl overflow-y-auto max-h-[90vh] md:max-h-none shadow-2xl relative animate-in slide-in-from-bottom-8">
              {/* Folder Tab Effect */}
              <div className="absolute top-0 right-10 -translate-y-full w-24 h-10 bg-retro-earth rounded-t-xl" />
              
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-retro-sepia hover:text-retro-brick transition-all z-10"
              >
                <X size={24} />
              </button>

              <div className="p-8 md:p-12 space-y-10">
                 <header className="relative">
                    <Pin className="absolute -top-4 -left-4 text-retro-brick rotate-45" size={24} />
                    <span className="font-handwriting text-xs text-retro-brick uppercase tracking-widest mb-2 block">New Registry Record</span>
                    <h2 className="text-3xl font-typewriter font-black uppercase text-retro-sepia">Hành chính <span className="text-retro-brick">Nhân sự</span></h2>
                    <div className="w-full h-1 bg-retro-sepia/10 mt-4" />
                 </header>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest ml-1 opacity-60">Họ và Tên (Type here)</label>
                       <input 
                         type="text"
                         value={newEmployeeData.name}
                         onChange={(e) => setNewEmployeeData({...newEmployeeData, name: e.target.value})}
                         placeholder="VD: Nguyen Van A"
                         className="w-full bg-retro-paper/20 border-b-2 border-retro-sepia/20 py-4 px-2 text-sm font-typewriter font-bold focus:border-retro-sepia outline-none transition-all uppercase"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest ml-1 opacity-60">Mã định danh (PAV-ID)</label>
                       <input 
                         type="text"
                         value={newEmployeeData.employeeCode}
                         onChange={(e) => setNewEmployeeData({...newEmployeeData, employeeCode: e.target.value})}
                         placeholder="VD: PAV-001"
                         className="w-full bg-retro-paper/20 border-b-2 border-retro-sepia/20 py-4 px-2 text-sm font-typewriter font-black focus:border-retro-sepia outline-none uppercase tracking-widest"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest ml-1 opacity-60">Số máy liên lạc</label>
                       <input 
                         type="text"
                         value={newEmployeeData.phone}
                         onChange={(e) => setNewEmployeeData({...newEmployeeData, phone: e.target.value})}
                         className="w-full bg-retro-paper/20 border-b-2 border-retro-sepia/20 py-4 px-2 text-sm font-typewriter font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest ml-1 opacity-60">Tổ làm việc (Registry Dept)</label>
                       <select 
                         value={newEmployeeData.department}
                         onChange={(e) => setNewEmployeeData({...newEmployeeData, department: e.target.value})}
                         className="w-full bg-retro-paper/20 border-b-2 border-retro-sepia/20 py-4 px-2 text-sm font-typewriter font-black uppercase appearance-none cursor-pointer"
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
                   className="retro-btn w-full py-5 bg-retro-sepia text-retro-mustard flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {adding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} strokeWidth={2} />}
                    Xác nhận đóng dấu hồ sơ
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* GRANT ACCOUNT MODAL */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-8 bg-retro-sepia/90 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white border-2 border-retro-sepia w-full max-w-md overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-300">
              <button 
                onClick={() => setIsGrantModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-retro-sepia hover:text-retro-brick transition-all z-10"
              >
                <X size={20} />
              </button>

              <div className="p-8 md:p-10 space-y-8">
                 <header className="text-center">
                    <div className="w-16 h-16 bg-retro-paper rounded-full border-2 border-dotted border-retro-sepia flex items-center justify-center text-retro-sepia mx-auto mb-4">
                       <ShieldCheck size={32} strokeWidth={1} />
                    </div>
                    <h2 className="text-2xl font-typewriter font-black uppercase text-retro-sepia tracking-tighter">Cấp quyền <span className="text-retro-brick">Truy cập</span></h2>
                    <p className="font-handwriting text-xs text-retro-earth mt-3">Định danh cho: {selectedEmp?.name}</p>
                 </header>

                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest ml-1 opacity-60">Địa chỉ tín thư (Email)</label>
                       <input 
                         type="email"
                         value={grantData.email}
                         onChange={(e) => setGrantData({...grantData, email: e.target.value})}
                         className="w-full bg-retro-paper/20 border-b-2 border-retro-sepia/20 py-4 px-2 text-sm font-typewriter font-bold outline-none focus:border-retro-sepia transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="font-typewriter text-[10px] font-black text-retro-sepia uppercase tracking-widest ml-1 opacity-60">Vai trò quản trị (Role)</label>
                       <select 
                         value={grantData.role}
                         onChange={(e) => setGrantData({...grantData, role: e.target.value})}
                         className="w-full bg-retro-paper/20 border-b-2 border-retro-sepia/20 py-4 px-2 text-sm font-typewriter font-black uppercase outline-none"
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
                   className="retro-btn w-full py-5 bg-retro-brick text-white border-none flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                 >
                    {granting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} strokeWidth={2} />}
                    Xác nhận cấp định danh
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
