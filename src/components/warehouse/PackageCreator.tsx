"use client";

import React, { useState, useEffect } from "react";
import { Package, Database, Plus, Box } from "lucide-react";

interface PackageCreatorProps {
  onPackageCreated: (pkg: any) => void;
}

export default function PackageCreator({ onPackageCreated }: PackageCreatorProps) {
  const [completedItems, setCompletedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/warehouse/package')
      .then(res => res.json())
      .then(data => {
        setCompletedItems(Array.isArray(data) ? data : []);
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
      setSelectedItems([...selectedItems, { ...item, packQty: Math.max(0, item.quantityCompleted - item.quantityPacked) }]);
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
            productId: i.productId || i.id,
            quantity: i.packQty 
          }))
        })
      });
      const newPkg = await res.json();
      
      const formattedPkg = {
        packageCode: newPkg.packageCode,
        customerName: newPkg.order?.customer?.name || 'Khách lẻ',
        items: (newPkg.packingListDetails || []).map((d: any) => ({
          name: d.product?.name || 'Sản phẩm',
          sku: d.product?.sku || 'N/A',
          quantity: d.quantity
        }))
      };
      
      onPackageCreated(formattedPkg);
      setSelectedItems([]);
    } catch (error) {
      console.error('Failed to create package:', error);
    }
  };

  return (
    <div className="bg-white border-[3px] border-black p-10 rounded-[2.5rem] text-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-6 mb-10 pb-8 border-b-2 border-black/10">
        <div className="w-16 h-16 bg-neo-purple/20 border-2 border-neo-purple/30 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(139,92,246,0.3)]">
           <Package size={32} strokeWidth={3} className="text-neo-purple" />
        </div>
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
            Tạo thùng <span className="text-neo-purple underline decoration-[3px] underline-offset-4">Hàng mới</span>
          </h2>
          <p className="text-[10px] font-black text-black/30 uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
            Hệ thống đóng gói Master (XINH-Series)
          </p>
        </div>
      </div>

      {/* Item List */}
      <div className="space-y-6 mb-10 flex-1 overflow-y-auto pr-4 custom-scrollbar">
        <p className="text-[11px] font-black text-black/40 uppercase tracking-widest ml-2 flex items-center gap-2">
          <Database size={14} strokeWidth={3} /> Danh mục sản phẩm chờ đóng gói
        </p>
        
        <div className="grid gap-4">
          {loading ? (
             <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-black/10 border-t-neo-purple rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-black/20">Đang quét kho thành phẩm...</p>
             </div>
          ) : completedItems.length === 0 ? (
             <div className="py-20 flex flex-col items-center justify-center text-black/10 border-2 border-dashed border-black/10 rounded-[2rem]">
                <Box size={48} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-widest mt-4 italic">Không có hàng chờ đóng gói</p>
             </div>
          ) : completedItems.map(item => (
            <div 
              key={item.id}
              onClick={() => toggleItem(item)}
              className={`p-6 rounded-2xl border-[2.5px] transition-all cursor-pointer flex justify-between items-center group relative overflow-hidden ${
                selectedItems.find(i => i.id === item.id) 
                ? "bg-neo-purple/10 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" 
                : "bg-white border-black/10 hover:border-black/30 hover:bg-black/5"
              }`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-xl border-2 border-black flex items-center justify-center font-black text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${selectedItems.find(i => i.id === item.id) ? 'bg-neo-purple text-white' : 'bg-white text-black/20'}`}>
                   {item.sku?.substring(0, 2).toUpperCase() || 'SP'}
                </div>
                <div>
                  <div className="text-[10px] font-black text-black/30 uppercase tracking-widest">{item.sku}</div>
                  <div className="font-black text-black text-sm uppercase italic tracking-tight group-hover:text-neo-purple transition-colors">{item.productName}</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-lg font-black text-black tabular-nums tracking-tighter italic">
                    {item.quantityCompleted - item.quantityPacked}
                  </div>
                  <div className="text-[9px] font-black text-black/30 uppercase tracking-widest">Tồn kho</div>
                </div>

                {selectedItems.find(i => i.id === item.id) && (
                  <div className="flex items-center gap-4 animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                    <div className="w-px h-8 bg-black/10 mx-2" />
                    <div className="flex flex-col">
                       <span className="text-[9px] font-black text-neo-purple uppercase tracking-widest mb-1">Số lượng đóng</span>
                       <input 
                        type="number" 
                        className="w-20 bg-white border-2 border-black rounded-lg px-2 py-1 text-center font-black text-sm italic shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] outline-none focus:bg-neo-purple/5"
                        value={selectedItems.find(i => i.id === item.id).packQty}
                        onChange={(e) => updatePackQty(item.id, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button 
        disabled={selectedItems.length === 0}
        onClick={handleCreatePackage}
        className="w-full h-20 bg-black text-white disabled:bg-black/10 disabled:text-black/20 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[10px_10px_0px_0px_rgba(139,92,246,0.3)] hover:bg-neo-purple hover:text-black transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-4 italic"
      >
        <Plus size={24} strokeWidth={4} />
        <span>TẠO THÙNG & SINH MÃ (PACK)</span>
      </button>
    </div>
  );
}
