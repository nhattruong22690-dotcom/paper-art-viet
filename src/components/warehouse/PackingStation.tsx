"use client";

import React, { useState } from 'react';
import { 
  Scan, 
  Package, 
  Printer, 
  X, 
  Plus, 
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-320px)]">
        
        {/* BÊN TRÁI: DANH SÁCH HÀNG SẴN SÀNG (LIST VIEW) */}
        <div className="card-refined bg-gray-50/30 border-dashed flex flex-col h-full overflow-hidden p-0">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white/50">
            <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
              📦 Chờ đóng gói (List View)
            </h3>
            <span className="text-[10px] font-black text-gray-400 uppercase italic">Tổng: {availableItems.length} SKU</span>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-white z-10 border-b border-gray-100 shadow-sm">
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                  <th className="px-6 py-4">Mẫu thiệp / SKU</th>
                  <th className="px-6 py-4 text-center">Tồn kho / Sẵn sàng</th>
                  <th className="px-6 py-4 text-right">Lệnh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {availableItems.map(item => (
                  <tr 
                    key={item.sku} 
                    className="group bg-white hover:bg-primary-50/30 transition-all cursor-pointer"
                    onClick={() => addToBox(item)}
                  >
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md uppercase border border-primary-100/50">
                        {item.sku}
                      </span>
                      <h4 className="font-bold text-gray-800 text-sm mt-1 group-hover:text-primary-700 transition-colors uppercase tracking-tight truncate w-48">
                        {item.name}
                      </h4>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-gray-900 italic tracking-tighter">{item.qtyReady}</span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase leading-none">pcs</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button className="p-2.5 bg-gray-50 group-hover:bg-primary-600 group-hover:text-white rounded-xl transition-all shadow-sm">
                         <Plus size={16} />
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-white border-t border-gray-100">
            <button className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-gray-400 hover:text-primary-500 hover:border-primary-200 transition-all group">
              <Scan size={20} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-black uppercase tracking-widest">Quét mã vạch (SKU)</span>
            </button>
          </div>
        </div>

        {/* BÊN PHẢI: CHI TIẾT THÙNG HÀNG HIỆN TẠI (CURRENT BOX) */}
        <div className="card-refined flex flex-col h-full overflow-hidden p-0 relative border-2 border-primary-50">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-primary-50/20">
            <div>
              <h3 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-0.5">Thùng đang đóng</h3>
              <p className="text-[10px] text-primary-600 font-bold uppercase italic">Mã dự kiến: XINH-20260322-001</p>
            </div>
            <Package size={24} className="text-primary-500" />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {currentBox.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4">
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <Plus size={24} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest">Vui lòng chọn hoặc quét sản phẩm</p>
              </div>
            ) : (
              currentBox.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl group relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 opacity-0 group-hover:opacity-100 transition-all" />
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter mb-1">{item.sku}</p>
                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-black text-gray-900">10</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Đã cho vào</p>
                    </div>
                    <button 
                      onClick={() => removeFromBox(item.sku)}
                      className="p-2 hover:bg-rose-50 text-gray-300 hover:text-rose-500 rounded-lg transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-white border-t border-gray-100 space-y-4 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex gap-4">
              <div className="flex-1 p-4 bg-gray-50 rounded-2xl">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Cân nặng (kg)</label>
                <input 
                  type="text" 
                  value={boxWeight}
                  onChange={(e) => setBoxWeight(e.target.value)}
                  className="bg-transparent text-xl font-black text-gray-900 w-full outline-none italic"
                />
              </div>
            </div>
            <button 
              onClick={() => setIsPrinting(true)}
              disabled={currentBox.length === 0}
              className="w-full py-5 bg-primary-600 disabled:bg-gray-200 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:bg-primary-500 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Printer size={20} /> Hoàn tất & In Nhãn
            </button>
          </div>
        </div>

        {/* PRINT LABEL MODAL */}
        {isPrinting && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-4">
            <div className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black text-gray-900 uppercase text-sm tracking-widest">Nhãn Thùng hàng</h3>
                <button onClick={() => setIsPrinting(false)} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
              </div>
              
              {/* LABEL CONTENT (10x15cm AREA) */}
              <div id="shipping-label" className="p-8 bg-white space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Customer / Khách hàng</p>
                    <h4 className="text-sm font-black text-gray-900 italic uppercase">Amazon US Distribution</h4>
                  </div>
                  <div className="bg-gray-900 p-2 rounded-xl">
                    <QRCodeSVG value="XINH-20260322-001" size={60} fgColor="#FFFFFF" bgColor="transparent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-dashed border-gray-100 py-4">
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Box ID / Mã thùng</p>
                    <p className="text-xs font-black text-gray-900">XINH-20260322-001</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Date / Ngày đóng</p>
                    <p className="text-xs font-black text-gray-900">22/03/2026</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Weight / Trọng lượng</p>
                    <p className="text-xs font-black text-gray-900">{boxWeight} KG</p>
                  </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[8px] font-bold text-gray-400 uppercase">Contents / Danh sách sản phẩm</p>
                   {currentBox.map((item, i) => (
                     <div key={i} className="flex justify-between items-center text-[10px] font-bold py-1 border-b border-gray-50 last:border-0">
                       <span className="truncate pr-4 uppercase tracking-tighter text-gray-600">{item.sku} - {item.name}</span>
                       <span className="shrink-0 font-black">x10</span>
                     </div>
                   ))}
                </div>
              </div>

              <div className="p-8 pt-0">
                <button 
                  onClick={() => {
                    window.print();
                    setIsPrinting(false);
                    setCurrentBox([]);
                  }}
                  className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all"
                >
                  <Printer size={18} /> IN NGAY (10x15)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
