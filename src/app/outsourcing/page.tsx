"use client";

import React from 'react';
import { 
  ClipboardList, 
  Plus, 
  Filter, 
  Search, 
  ArrowRight, 
  Clock, 
  MapPin, 
  Building2 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const outsourcingOrders = [
  { id: 'OS-8821', vendor: 'In ấn Thanh Xuân', service: 'Cán màng Metalized', qty: '2,500 pcs', deadline: 'Today', status: 'In Production' },
  { id: 'OS-8825', vendor: 'Ép kim Gia Huy', service: 'Ép kim Gold 18K', qty: '5,000 pcs', deadline: '24 Mar', status: 'Waiting Pickup' },
  { id: 'OS-8830', vendor: 'Cắt Laser Pro', service: 'Cắt họa tiết CNC', qty: '1,200 pcs', deadline: '26 Mar', status: 'Draft' },
];

export default function OutsourcingPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gia công ngoài (Outsourcing)</h1>
          <p className="text-gray-500 mt-1 uppercase text-xs font-bold tracking-widest italic">Paper Art Việt - External Processing</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-4 bg-primary-600 text-white rounded-[24px] font-black shadow-xl shadow-primary-200 hover:bg-primary-500 transition-all flex items-center gap-3 text-xs uppercase tracking-widest">
            <Plus size={18} /> Tạo lệnh gia công
          </button>
        </div>
      </header>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card-refined p-8 bg-gray-900 border-none">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-white/10 rounded-2xl text-primary-400">
              <Clock size={24} />
            </div>
            <span className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Đang thực hiện</span>
          </div>
          <p className="text-4xl font-black text-white italic tracking-tighter">12 <span className="text-xs font-bold text-white/40 not-italic uppercase ml-2 tracking-widest">Lệnh</span></p>
        </div>
        <div className="card-refined p-8 bg-white border-2 border-primary-50">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-primary-50 rounded-2xl text-primary-600">
              <Building2 size={24} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đối tác xưởng</span>
          </div>
          <p className="text-4xl font-black text-gray-900 italic tracking-tighter">08 <span className="text-xs font-bold text-gray-400 not-italic uppercase ml-2 tracking-widest">Nhà xưởng</span></p>
        </div>
        <div className="card-refined p-8 bg-white">
          <div className="flex justify-between items-start mb-6">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <MapPin size={24} />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chờ nhận hàng</span>
          </div>
          <p className="text-4xl font-black text-gray-900 italic tracking-tighter">05 <span className="text-xs font-bold text-gray-400 not-italic uppercase ml-2 tracking-widest">Chuyến</span></p>
        </div>
      </div>

      {/* OUTSOURCING LIST */}
      <div className="card-refined p-0 overflow-hidden border-none shadow-xl bg-white">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-sm font-black uppercase text-gray-400 tracking-widest flex items-center gap-3">
               <ClipboardList size={20} className="text-primary-500" /> Danh sách Lệnh gia công
            </h3>
            <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest hover:underline">Xem tất cả</button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="px-10 py-5">Mã lệnh / Vendor</th>
              <th className="px-10 py-5">Hạng mục</th>
              <th className="px-10 py-5 text-center">Số lượng</th>
              <th className="px-10 py-5">Hạn giao</th>
              <th className="px-10 py-5 text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {outsourcingOrders.map((o) => (
              <tr key={o.id} className="group hover:bg-primary-50/30 transition-all cursor-pointer">
                <td className="px-10 py-6">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{o.vendor}</h4>
                    <p className="text-[10px] text-primary-500 font-black tracking-widest mt-1">ID: #{o.id}</p>
                  </div>
                </td>
                <td className="px-10 py-6 text-sm font-bold text-gray-600">
                  {o.service}
                </td>
                <td className="px-10 py-6 text-center text-sm font-black italic text-gray-900">
                  {o.qty}
                </td>
                <td className="px-10 py-6 text-sm font-bold text-gray-900">
                  {o.deadline === 'Today' ? <span className="text-rose-600 animate-pulse">Hôm nay</span> : o.deadline}
                </td>
                <td className="px-10 py-6 text-right">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    o.status === 'In Production' ? 'bg-amber-50 text-amber-600' : 
                    o.status === 'Waiting Pickup' ? 'bg-primary-50 text-primary-600' : 'bg-gray-50 text-gray-400'
                  )}>
                    {o.status}
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
