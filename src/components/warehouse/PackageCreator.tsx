"use client";

import React, { useState, useEffect } from "react";

/**
 * COMPONENT MẪU: TẠO THÙNG HÀNG (PACKAGE CREATOR)
 * Logic:
 * 1. Hiển thị các lệnh sản xuất đã hoàn thành (quantityCompleted > 0).
 * 2. Chọn sản phẩm và nhập số lượng đóng gói.
 * 3. Nhấn "Đóng thùng" để sinh mã XINH-... và chuyển sang giao diện In.
 */

export default function PackageCreator({ onPackageCreated }: { onPackageCreated: (pkg: any) => void }) {
  const [completedItems, setCompletedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/warehouse/package')
      .then(res => res.json())
      .then(data => {
        setCompletedItems(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load items:', err);
        setLoading(false);
      });
  }, []);

  const toggleItem = (item: any) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, { ...item, packQty: item.quantityCompleted - item.quantityPacked }]);
    }
  };

  const updatePackQty = (id: string, qty: number) => {
    setSelectedItems(selectedItems.map(i => i.id === id ? { ...i, packQty: qty } : i));
  };

  const handleCreatePackage = async () => {
    try {
      const res = await fetch('/api/warehouse/package', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedItems.map(i => ({ 
            productId: i.productId || i.id, // Handle fallback
            quantity: i.packQty 
          }))
        })
      });
      const newPkg = await res.json();
      
      const formattedPkg = {
        packageCode: newPkg.packageCode,
        customerName: newPkg.order?.customer?.name || 'Khách lẻ',
        items: newPkg.packingListDetails.map((d: any) => ({
          name: d.product?.name || 'SP',
          sku: d.product?.sku || 'N/A',
          quantity: d.quantity
        }))
      };
      
      onPackageCreated(formattedPkg);
    } catch (error) {
      console.error('Failed to create package:', error);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-slate-200">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">📦</span>
        Đóng gói thùng hàng mới
      </h2>

      <div className="space-y-4 mb-8">
        <p className="text-sm text-slate-400">Chọn sản phẩm từ lệnh sản xuất để đóng thùng:</p>
        <div className="grid gap-3">
          {completedItems.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleItem(item)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                selectedItems.find(i => i.id === item.id) 
                ? "bg-indigo-500/10 border-indigo-500" 
                : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
              }`}
            >
              <div>
                <div className="font-bold">{item.productName}</div>
                <div className="text-xs text-slate-500">SKU: {item.sku} | Đã xong: {item.quantityCompleted} | Chờ đóng: {item.quantityCompleted - item.quantityPacked}</div>
              </div>
              {selectedItems.find(i => i.id === item.id) && (
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                  <span className="text-xs font-medium text-indigo-400">Số lượng đóng:</span>
                  <input 
                    type="number" 
                    className="w-16 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold"
                    value={selectedItems.find(i => i.id === item.id).packQty}
                    onChange={(e) => updatePackQty(item.id, parseInt(e.target.value))}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button 
        disabled={selectedItems.length === 0}
        onClick={handleCreatePackage}
        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 rounded-xl font-bold shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
      >
        TẠO THÙNG & SINH MÃ (PACK)
      </button>
    </div>
  );
}
