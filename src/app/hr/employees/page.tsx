"use client";

import React from 'react';
import { User, Search, Filter, Plus } from 'lucide-react';

export default function EmployeesPage() {
  const employees = [
    { id: 'NV001', name: 'Nguyễn Văn A', role: 'Kỹ thuật', group: 'Tổ Lắp Ráp 3D', status: 'Active' },
    { id: 'NV002', name: 'Trần Thị B', role: 'Thiết kế', group: 'Tổ Cắt Laser', status: 'Active' },
    { id: 'NV003', name: 'Lê Văn C', role: 'Đóng gói', group: 'Tổ Đóng Gói', status: 'Away' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 animate-in fade-in duration-1000">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Danh sách Nhân sự</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest italic">Quản lý định danh & Phân tổ đội</p>
        </div>
        <button className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all flex items-center gap-3">
          <Plus size={18} /> Thêm nhân viên mới
        </button>
      </header>

      <div className="bg-white rounded-[40px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex gap-4">
           <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Tìm tên, mã NV hoặc tổ đội..."
                className="w-full bg-gray-50/50 border-none rounded-2xl py-4 pl-14 pr-8 text-sm outline-none focus:ring-2 focus:ring-primary-100 transition-all font-medium"
              />
           </div>
           <button className="px-6 py-4 bg-gray-50 text-gray-400 rounded-2xl hover:text-gray-900 transition-colors border border-gray-100/50 flex items-center gap-2 font-bold text-xs uppercase">
             <Filter size={18} /> Lọc
           </button>
        </div>

        <table className="w-full">
          <thead>
            <tr className="bg-gray-50/30 border-b border-gray-100">
              <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Nhân viên</th>
              <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
              <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Vai trò</th>
              <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổ đội</th>
              <th className="p-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-sm">
            {employees.map(emp => (
              <tr key={emp.id} className="hover:bg-primary-50/5 transition-colors group cursor-pointer">
                <td className="p-6 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                    <User size={20} />
                  </div>
                  <span className="font-black text-gray-900 uppercase tracking-tight">{emp.name}</span>
                </td>
                <td className="p-6 font-bold text-gray-400">{emp.id}</td>
                <td className="p-6 text-gray-600 font-medium">{emp.role}</td>
                <td className="p-6 text-gray-600 font-medium">{emp.group}</td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    emp.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {emp.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
