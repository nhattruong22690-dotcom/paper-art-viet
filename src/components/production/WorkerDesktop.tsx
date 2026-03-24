"use client";

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  CheckCircle2, 
  History, 
  Package, 
  AlertCircle,
  Camera,
  Settings,
  FileText,
  TrendingUp,
  User,
  ChevronRight,
  Clock
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Interfaces
interface ProductionOrder {
  id: string;
  sku: string;
  productName: string;
  quantityTarget: number;
  quantityCompleted: number;
}

interface WorkHistory {
  id: string;
  startTime: Date;
  endTime: Date | null;
  quantityProduced: number;
  technicalErrorCount: number;
  materialErrorCount: number;
  status: string;
  productName: string;
}

export default function WorkerDesktop() {
  const [activeTab, setActiveTab] = useState<'work' | 'history'>('work');
  const [currentSession, setCurrentSession] = useState<any>(null); // In real app, fetch from server 
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [history, setHistory] = useState<WorkHistory[]>([]);
  
  // Form State for Submit
  const [qty, setQty] = useState<number>(0);
  const [techErrors, setTechErrors] = useState<number>(0);
  const [matErrors, setMatErrors] = useState<number>(0);
  const [evidenceImage, setEvidenceImage] = useState<string | null>(null);

  // Mock Data Initialization
  useEffect(() => {
    setOrders([
      { id: 'PO-001', sku: 'ST-001', productName: 'Thiệp 3D Chùa Một Cột', quantityTarget: 1000, quantityCompleted: 450 },
      { id: 'PO-002', sku: 'ST-002', productName: 'Thiệp 3D Tháp Rùa', quantityTarget: 500, quantityCompleted: 120 },
      { id: 'PO-003', sku: 'ST-003', productName: 'Lồng đèn Hội An', quantityTarget: 2000, quantityCompleted: 800 },
    ]);

    setHistory([
      { id: 'LOG-001', startTime: new Date(Date.now() - 3600000), endTime: new Date(), quantityProduced: 45, technicalErrorCount: 1, materialErrorCount: 2, status: 'completed', productName: 'Thiệp 3D Chùa Một Cột' },
      { id: 'LOG-002', startTime: new Date(Date.now() - 7200000), endTime: new Date(Date.now() - 3600000), quantityProduced: 38, technicalErrorCount: 0, materialErrorCount: 5, status: 'completed', productName: 'Thiệp 3D Tháp Rùa' },
    ]);
  }, []);

  const handleStart = () => {
    if (!selectedOrder) return;
    setCurrentSession({
      id: 'SESSION-' + Date.now(),
      startTime: new Date(),
      order: selectedOrder
    });
  };

  const handleSubmit = () => {
    // Transaction logic would happen here via API
    const newLog = {
      id: 'LOG-' + Date.now(),
      startTime: currentSession.startTime,
      endTime: new Date(),
      quantityProduced: qty,
      technicalErrorCount: techErrors,
      materialErrorCount: matErrors,
      status: 'completed',
      productName: currentSession.order.productName
    };
    
    setHistory([newLog, ...history]);
    setCurrentSession(null);
    setQty(0);
    setTechErrors(0);
    setMatErrors(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 md:pb-0">
      {/* MOBILE HEADER */}
      <header className="bg-white p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 z-50">
         <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
               <Package className="text-primary-600" /> WorkLog
            </h1>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Paper Art Việt - Worker Desktop</p>
         </div>
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-2xl flex items-center justify-center border border-primary-100 shadow-sm">
               <User size={18} className="text-primary-600" />
            </div>
         </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        {/* TAB NAV (Mobile Style) */}
        <div className="flex bg-white p-1.5 rounded-[24px] shadow-sm border border-gray-100">
          <button 
            onClick={() => setActiveTab('work')}
            className={cn(
              "flex-1 py-3 px-4 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === 'work' ? "bg-primary-600 text-white shadow-lg shadow-primary-100" : "text-gray-400"
            )}
          >
            <Play size={14} fill={activeTab === 'work' ? "currentColor" : "none"} /> Làm việc
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex-1 py-3 px-4 rounded-[18px] text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === 'history' ? "bg-primary-600 text-white shadow-lg shadow-primary-100" : "text-gray-400"
            )}
          >
            <History size={14} /> Lịch sử
          </button>
        </div>

        {activeTab === 'work' ? (
          <div className="space-y-6">
            {!currentSession ? (
              /* ORDER SELECTION */
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Chọn lệnh sản xuất đang chạy</p>
                <div className="grid grid-cols-1 gap-3">
                  {orders.map(order => (
                    <button 
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={cn(
                        "p-5 rounded-[32px] border-2 text-left transition-all relative overflow-hidden group active:scale-95",
                        selectedOrder?.id === order.id ? "bg-white border-primary-600 shadow-xl" : "bg-white border-gray-50 hover:border-gray-100"
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest px-2 py-1 bg-primary-50 rounded-lg">
                          {order.sku}
                        </span>
                        {selectedOrder?.id === order.id && <CheckCircle2 size={18} className="text-primary-600" />}
                      </div>
                      <h4 className="font-black text-gray-900 group-hover:text-primary-600 transition-colors">{order.productName}</h4>
                      <div className="mt-4 flex items-center gap-4">
                        <div className="flex-1 h-1.5 bg-gray-50 rounded-full overflow-hidden">
                           <div className="h-full bg-primary-500" style={{ width: `${(order.quantityCompleted / order.quantityTarget) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-gray-400">{order.quantityCompleted}/{order.quantityTarget}</span>
                      </div>
                    </button>
                  ))}
                  <button 
                    disabled={!selectedOrder}
                    onClick={handleStart}
                    className="w-full bg-primary-600 py-6 rounded-[32px] text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-primary-200 disabled:opacity-50 disabled:grayscale transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
                  >
                    <Play size={20} fill="currentColor" /> Bắt đầu làm (Check-in)
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE SESSION (Check-out) */
              <div className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="bg-primary-600 p-8 rounded-[40px] text-white shadow-2xl shadow-primary-200 relative overflow-hidden">
                   <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Đang thực hiện:</p>
                   <h2 className="text-xl font-black mb-6">{currentSession.order.productName}</h2>
                   <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                         <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                            <Clock size={16} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[9px] font-black uppercase opacity-60">Bắt đầu lúc</span>
                            <span className="text-sm font-black">{currentSession.startTime.toLocaleTimeString()}</span>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Số lượng đạt (PCS)</label>
                      <input 
                        type="number"
                        value={qty || ''}
                        onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                        placeholder="0"
                        className="w-full bg-gray-50 border border-gray-50 rounded-[24px] py-5 px-6 text-2xl font-black text-gray-900 outline-none focus:bg-white focus:border-primary-200 transition-all text-center"
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest pl-2 flex items-center gap-1.5">
                            <Settings size={12} /> Lỗi Thao tác 🛠️
                         </label>
                         <input 
                           type="number" 
                           value={techErrors || ''}
                           onChange={(e) => setTechErrors(parseInt(e.target.value) || 0)}
                           className="w-full bg-rose-50/30 border border-rose-100 rounded-[20px] py-4 px-4 text-center font-black text-rose-600 outline-none focus:bg-white"
                         />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 flex items-center gap-1.5">
                            <FileText size={12} /> Lỗi Giấy 📄
                         </label>
                         <input 
                           type="number" 
                           value={matErrors || ''}
                           onChange={(e) => setMatErrors(parseInt(e.target.value) || 0)}
                           className="w-full bg-gray-50/50 border border-gray-100 rounded-[20px] py-4 px-4 text-center font-black text-gray-400 outline-none focus:bg-white"
                         />
                      </div>
                   </div>

                   {matErrors > 0 && (
                     <div className="space-y-3">
                        <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[24px] text-gray-400 flex flex-col items-center justify-center gap-2 hover:border-primary-200 hover:text-primary-600 transition-all">
                           <Camera size={24} />
                           <span className="text-[10px] font-black uppercase tracking-widest">Chụp ảnh minh chứng (Lỗi giấy)</span>
                        </button>
                     </div>
                   )}

                    <div className="pt-4 flex flex-col gap-4">
                      {qty > 0 && (
                        <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-[20px] border border-emerald-100 animate-in fade-in duration-500">
                           <div className="flex items-center gap-3 text-emerald-600">
                             <TrendingUp size={18} />
                             <span className="text-[10px] font-black uppercase tracking-widest">Hiệu suất ước tính</span>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="text-xs font-black text-emerald-700">
                                {Math.round((qty / (currentSession.order.quantityTarget / 8)) * 100)}% Năng suất
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold",
                                (techErrors / (qty + techErrors + matErrors)) > 0.05 ? "text-rose-500" : "text-emerald-500"
                              )}>
                                {Math.max(0, Math.round(100 - (techErrors / (qty + techErrors + matErrors) * 100)))}% Chất lượng
                              </span>
                           </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={handleSubmit}
                        className="w-full bg-rose-600 py-6 rounded-[32px] text-white font-black uppercase tracking-widest text-[13px] shadow-2xl shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                         <Square size={20} fill="currentColor" /> Kết thúc (Check-out)
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* HISTORY TAB */
          <div className="space-y-4 animate-in fade-in duration-500">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Vừa hoàn thành</p>
            <div className="space-y-3">
               {history.map(item => (
                 <div key={item.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex justify-between items-center gap-4">
                    <div className="flex-1">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                         {item.startTime.toLocaleDateString()} • {item.startTime.toLocaleTimeString()} - {item.endTime?.toLocaleTimeString()}
                       </p>
                       <h4 className="text-sm font-black text-gray-900 leading-snug">{item.productName}</h4>
                       <div className="mt-2 flex gap-3 text-[10px] font-bold">
                          <span className="text-emerald-600">Đạt: {item.quantityProduced}</span>
                          <span className="text-rose-400">Lỗi: {item.technicalErrorCount + item.materialErrorCount}</span>
                       </div>
                    </div>
                    <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                       <ChevronRight size={18} />
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}
      </main>

      {/* MOBILE NAV (OPTIONAL - CURRENTLY USING TABS) */}
    </div>
  );
}
