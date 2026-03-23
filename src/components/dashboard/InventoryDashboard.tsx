"use client";

import React, { useState, useEffect } from "react";

/**
 * COMPONENT MẪU: DASHBOARD THEO DÕI VẬT TƯ & GIA CÔNG
 * Logic:
 * 1. Hiển thị vật tư, nếu có partnerId -> Hiện xưởng ngoài.
 * 2. Nút "Gửi gia công" & "Hoàn thành gia công".
 * 3. Bảng Lệnh sản xuất highlight đỏ nếu quá hạn.
 */

export default function InventoryDashboard() {
  // Giả lập dữ liệu Vật tư
  const [inventory, setInventory] = useState<any[]>([
    { id: "i1", itemName: "Giấy mỹ thuật đỏ", quantity: 500, currentLocationId: null, partner: null, isReadyForAssembly: false },
    { id: "i2", itemName: "Phôi thiệp 3D", quantity: 200, currentLocationId: "p1", partner: { name: "Xưởng In Bình Minh" }, isReadyForAssembly: false },
  ]);

  // Giả lập dữ liệu Lệnh sản xuất
  const [productionOrders, setProductionOrders] = useState<any[]>([
    { id: "po1", product: { name: "Thiệp Hoa Hồng" }, quantityTarget: 100, deadlineProduction: "2026-03-20", isOverdue: true },
    { id: "po2", product: { name: "Thiệp Cưới Gold" }, quantityTarget: 50, deadlineProduction: "2026-03-25", isOverdue: false },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Xử lý Gửi gia công
  const handleSend = (itemId: string, partnerName: string) => {
    setInventory(inventory.map(item => 
      item.id === itemId ? { ...item, currentLocationId: "pX", partner: { name: partnerName } } : item
    ));
    setIsModalOpen(false);
  };

  // Xử lý Hoàn thành
  const handleComplete = (itemId: string) => {
    setInventory(inventory.map(item => 
      item.id === itemId ? { ...item, currentLocationId: null, partner: null, isReadyForAssembly: true } : item
    ));
  };

  return (
    <div className="p-6 space-y-8 bg-[#0f172a] min-h-screen text-slate-200">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Quản lý Vật tư & Gia công</h1>
          <p className="text-slate-400 mt-1 text-sm">Theo dõi dòng chảy vật tư giữa kho nội bộ và các đối tác gia công ngoài.</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> Kho Nội Bộ
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> Xưởng Ngoài
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* CỘT 1 & 2: BẢNG VẬT TƯ (LAYOUT CHÍNH) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-5 border-b border-slate-800 bg-slate-800/30 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2">📦 Danh sách vật tư trong kho</h2>
            </div>
            <table className="w-full text-left">
              <thead className="text-[11px] text-slate-500 uppercase font-bold bg-slate-950/30">
                <tr>
                  <th className="px-6 py-4">Tên Vật tư</th>
                  <th className="px-6 py-4">Số lượng</th>
                  <th className="px-6 py-4">Vị trí hiện tại</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {inventory.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-800/20 transition-all">
                    <td className="px-6 py-5 font-medium transition-colors group-hover:text-blue-400">
                      {item.itemName}
                      {item.isReadyForAssembly && (
                        <div className="text-[10px] text-emerald-500 mt-0.5 font-bold flex items-center gap-1">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full"></span> SẴN SÀNG LẮP RÁP
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-slate-400">{item.quantity}</td>
                    <td className="px-6 py-5 text-sm">
                      {item.currentLocationId ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold text-xs transition-transform group-hover:scale-105">
                          🏭 {item.partner?.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-semibold text-xs transition-transform group-hover:scale-105">
                          🏠 Kho nội bộ
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right">
                      {!item.currentLocationId ? (
                        <button 
                          onClick={() => {setSelectedItem(item); setIsModalOpen(true);}}
                          className="px-4 py-1.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg border border-blue-600/30 transition-all text-xs font-bold active:scale-95"
                        >
                          Gửi gia công
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleComplete(item.id)}
                          className="px-4 py-1.5 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-600/30 transition-all text-xs font-bold active:scale-95"
                        >
                          Hoàn thành
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CỘT 3: LỆNH SẢN XUẤT (VÙNG CẢNH BÁO) */}
        <div className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 bg-rose-500/5 flex items-center gap-2">
              <span className="animate-pulse w-2 h-2 bg-rose-500 rounded-full"></span>
              <h2 className="font-bold text-rose-500 text-sm italic uppercase tracking-wider">Cảnh báo Deadline</h2>
            </div>
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {productionOrders.map((po) => (
                <div 
                  key={po.id} 
                  className={`p-4 rounded-xl border transition-all ${
                    po.isOverdue 
                    ? "bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]" 
                    : "bg-slate-800/30 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-bold text-sm ${po.isOverdue ? "text-rose-400" : "text-slate-200"}`}>
                      {po.product.name}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">#{po.id}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      Target: <span className="text-slate-200 font-medium">{po.quantityTarget} SP</span>
                    </div>
                    <div className={`font-bold ${po.isOverdue ? "text-rose-500" : ""}`}>
                      📅 {po.deadlineProduction}
                    </div>
                  </div>
                  {po.isOverdue && (
                    <div className="mt-3 text-[11px] font-bold text-rose-500 flex items-center gap-1.5 uppercase tracking-tighter">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Đã quá hạn sản xuất!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL GIẢ LẬP CHỌN ĐỐI TÁC */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl w-full max-w-md shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-bold mb-2">Gửi gia công ngoài</h2>
            <p className="text-slate-400 text-sm mb-6">Chọn đối tác gia công cho vật tư: <strong className="text-blue-400">{selectedItem?.itemName}</strong></p>
            <div className="space-y-3">
              <button 
                onClick={() => handleSend(selectedItem.id, "Xưởng In Bình Minh")}
                className="w-full p-4 bg-slate-800 hover:bg-slate-750 rounded-2xl text-left border border-slate-700 transition-all flex justify-between items-center group"
              >
                <div>
                  <div className="font-bold text-white">Xưởng In Bình Minh</div>
                  <div className="text-xs text-slate-500">Chuyên in offset & UV</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">→</div>
              </button>
              <button 
                onClick={() => handleSend(selectedItem.id, "Gia công Lê Trần")}
                className="w-full p-4 bg-slate-800 hover:bg-slate-750 rounded-2xl text-left border border-slate-700 transition-all flex justify-between items-center group"
              >
                <div>
                  <div className="font-bold text-white">Gia công Lê Trần</div>
                  <div className="text-xs text-slate-500">Chuyên gấp & dán túi</div>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">→</div>
              </button>
            </div>
            <button 
              onClick={() => setIsModalOpen(false)}
              className="mt-8 w-full py-3 text-slate-500 hover:text-white font-medium transition-all"
            >
              Hủy thao tác
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
