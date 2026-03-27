"use client";

import React, { useState } from 'react';
import { 
  Scan, 
  Package, 
  Printer, 
  X, 
  Plus, 
  CheckCircle2,
  ArrowRight,
  MapPin
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const availableItems = [
  { sku: '3D-ROS-001', name: 'Thiệp Hoa Hồng 3D (Lẻ)', qtyReady: 120 },
  { sku: 'CMC-GIFT-02', name: 'Hộp Quà Chùa Một Cột', qtyReady: 200 },
  { sku: 'LOG-SEN-33', name: 'Thiệp Logo Lotus Blue', qtyReady: 45 },
  { sku: 'WED-VINE-01', name: 'Thiệp Cưới Vintage White', qtyReady: 500 },
];

export default function PackingStation() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [currentBox, setCurrentBox] = useState<any[]>([]);
  const [boxWeight, setBoxWeight] = useState("2.5");

  const addToBox = (item: any) => {
    setCurrentBox([...currentBox, { ...item, packedQty: 10 }]); // Giả lập pack 10 pcs
  };

  const removeFromBox = (sku: string) => {
    setCurrentBox(currentBox.filter(item => item.sku !== sku));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-[calc(100vh-320px)] pb-10">
        
        {/* BÊN TRÁI: DANH SÁCH HÀNG SẴN SÀNG (LIST VIEW) */}
        <div className="neo-card !p-0 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b-neo border-black flex justify-between items-center bg-neo-purple/5">
            <h3 className="font-black text-black uppercase text-xs tracking-widest flex items-center gap-2">
              <Package size={18} className="text-black" /> Chờ đóng gói
            </h3>
            <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">TỔNG: {availableItems.length} SKU</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-none shadow-none mt-0 rounded-none">
              <thead className="sticky top-0 bg-white/90 backdrop-blur-md z-10 border-b-neo border-black">
                <tr className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Mẫu thiệp / SKU</th>
                  <th className="px-8 py-5 text-center">Tồn kho</th>
                  <th className="px-8 py-5 text-right">Lệnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {availableItems.map(item => (
                  <tr 
                    key={item.sku} 
                    className="group bg-transparent hover:bg-neo-purple/5 transition-all cursor-pointer"
                    onClick={() => addToBox(item)}
                  >
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-black bg-neo-purple px-2 py-1 rounded border-2 border-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        {item.sku}
                      </span>
                      <h4 className="font-black text-black text-sm mt-3 group-hover:text-neo-purple transition-colors uppercase tracking-tight truncate w-48 italic">
                        {item.name}
                      </h4>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-black text-black tabular-nums tracking-tighter">{item.qtyReady}</span>
                        <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">PCS</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button className="p-3 bg-white border-2 border-black group-hover:bg-black group-hover:text-white rounded-xl transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none">
                         <Plus size={20} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-black/5 border-t-neo border-black">
            <button className="w-full py-5 bg-white border-2 border-black rounded-xl flex items-center justify-center gap-4 text-black font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-purple hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:scale-95">
              <Scan size={24} className="text-black" />
              <span>Quét mã SKU</span>
            </button>
          </div>
        </div>

        {/* BÊN PHẢI: CHI TIẾT THÙNG HÀNG HIỆN TẠI (CURRENT BOX) */}
        <div className="neo-card !p-0 flex flex-col h-full overflow-hidden relative border-4 bg-white shadow-[12px_12px_0px_0px_rgba(216,180,254,1)]">
          <div className="p-6 border-b-neo border-black flex justify-between items-center bg-neo-purple/10">
            <div>
              <h3 className="font-black text-black uppercase text-sm tracking-widest mb-1">Thùng đang đóng</h3>
              <p className="text-[10px] text-black/60 font-black uppercase italic tracking-widest">ID: XINH-2026-001</p>
            </div>
            <Package size={32} className="text-black opacity-20" />
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {currentBox.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-black/10 space-y-6">
                <div className="w-20 h-20 rounded-2xl border-4 border-dashed border-black/10 flex items-center justify-center">
                  <Plus size={32} />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-center">Vui lòng chọn hoặc quét SKU</p>
              </div>
            ) : (
              currentBox.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-6 bg-white border-2 border-black rounded-xl group relative overflow-hidden transition-all hover:bg-neo-purple/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-[9px] font-black text-black/40 uppercase tracking-widest mb-1">{item.sku}</p>
                    <h4 className="font-black text-black text-base truncate uppercase tracking-tight italic">{item.name}</h4>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-black text-black tabular-nums italic">10</p>
                      <p className="text-[9px] font-black text-black/40 uppercase tracking-widest">Packed</p>
                    </div>
                    <button 
                      onClick={() => removeFromBox(item.sku)}
                      className="w-10 h-10 bg-white border-2 border-black text-black hover:bg-neo-red hover:text-white rounded-lg transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center justify-center"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-neo-purple/5 border-t-neo border-black space-y-6">
            <div className="p-5 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <label className="text-[10px] font-black text-black/40 uppercase tracking-widest block mb-2">Trọng lượng (KG)</label>
              <input 
                type="text" 
                value={boxWeight}
                onChange={(e) => setBoxWeight(e.target.value)}
                className="bg-transparent text-3xl font-black text-black w-full outline-none italic tracking-tighter"
              />
            </div>
            <button 
              onClick={() => setIsPrinting(true)}
              disabled={currentBox.length === 0}
              className="btn-primary btn-confirm-flash w-full h-16 text-xs uppercase tracking-[0.3em] font-black gap-4"
            >
              <Printer size={24} /> Hoàn tất & In Nhãn
            </button>
          </div>
        </div>

        {/* PRINT LABEL MODAL */}
        {isPrinting && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[110] p-6 animate-in fade-in duration-300">
            <div className="bg-white border-neo border-black rounded-xl w-full max-w-sm overflow-hidden shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-300">
              <div className="p-8 border-b-neo border-black flex justify-between items-center bg-neo-yellow/10">
                <h3 className="font-black text-black uppercase text-sm tracking-widest">Shipping Label</h3>
                <button onClick={() => setIsPrinting(false)} className="w-10 h-10 border-2 border-black rounded-lg flex items-center justify-center text-black hover:bg-neo-red shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">
                  <X size={24} />
                </button>
              </div>
              
              {/* LABEL CONTENT (10x15cm AREA) */}
              <div id="shipping-label" className="p-10 bg-white space-y-8">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black text-black/40 uppercase mb-2 tracking-widest">Customer</p>
                    <h4 className="text-lg font-black text-black italic uppercase tracking-tight leading-none">Amazon US<br/>Distribution</h4>
                  </div>
                  <div className="bg-black p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(216,180,254,1)]">
                    <QRCodeSVG value="XINH-2026-001" size={80} fgColor="#D8B4FE" bgColor="transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 border-y-2 border-dashed border-black py-6">
                  <div>
                    <p className="text-[9px] font-black text-black/40 uppercase mb-1 tracking-widest">Box ID</p>
                    <p className="text-sm font-black text-black uppercase tracking-tight">XINH-2026-001</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-black/40 uppercase mb-1 tracking-widest">Date</p>
                    <p className="text-sm font-black text-black uppercase tracking-tight">22/03/2026</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] font-black text-black/40 uppercase mb-1 tracking-widest">Weight</p>
                    <p className="text-2xl font-black text-black tracking-tighter italic">{boxWeight} KG</p>
                  </div>
                </div>

                <div className="space-y-3">
                   <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Contents</p>
                   {currentBox.map((item, i) => (
                     <div key={i} className="flex justify-between items-center text-[11px] font-black py-2 border-b-2 border-black/5 last:border-0">
                       <span className="truncate pr-4 uppercase tracking-tighter text-black/60 italic">{item.sku} - {item.name}</span>
                       <span className="shrink-0 font-black text-neo-purple">x10</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-10 pt-0">
                <button 
                  onClick={() => {
                    window.print();
                    setIsPrinting(false);
                    setCurrentBox([]);
                  }}
                  className="btn-primary w-full h-16 text-xs uppercase tracking-[0.3em] font-black gap-4"
                >
                  <Printer size={24} /> IN NGAY (10x15)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
