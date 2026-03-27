"use client";

import React, { useState, useEffect } from 'react';
import { Plus, ListFilter, Search, ArrowRight, History, Package, ChevronRight, Activity, Database, Settings } from 'lucide-react';
import { getAllBOMs } from '@/services/bom.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import BOMDetailModal from '@/components/production/BOMDetailModal';
import MaterialManagerModal from '@/components/production/MaterialManagerModal';
import OperationManagerModal from '@/components/production/OperationManagerModal';

export default function BOMPage() {
  const [boms, setBoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null);
  const [showMaterialManager, setShowMaterialManager] = useState(false);
  const [showOperationManager, setShowOperationManager] = useState(false);

  useEffect(() => {
    loadBOMs();
  }, []);

  const loadBOMs = async () => {
    try {
      const data = await getAllBOMs();
      setBoms(data);
    } catch (err) {
      console.error('Failed to load BOMs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Activity className="w-12 h-12 animate-spin text-purple-500" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Đang tải danh sách BOM...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-[#D1FAE5]/30 p-8 rounded-xl border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-[0.2em] mb-3">
             <Package size={14} strokeWidth={3} />
             <span>Sản xuất</span>
             <ChevronRight size={12} strokeWidth={3} />
             <span className="text-purple-600 bg-purple-100 px-2 py-0.5 rounded-lg border border-black/10">Định mức vật tư (BOM)</span>
          </nav>
          <h1 className="text-4xl font-bold text-black tracking-tight uppercase font-space">
            Quản lý <span className="text-purple-500 bg-white border-[2.5px] border-black px-3 py-1 -rotate-2 inline-block shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">Định mức</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-4 font-bold uppercase tracking-wider">
             Thiết lập vật tư, công đoạn và tính toán giá thành sản phẩm
          </p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
           <Button variant="outline" onClick={() => setShowMaterialManager(true)} className="gap-2 bg-white">
              <Database size={18} strokeWidth={3} />
              Quản lý Vật tư
           </Button>
           <Button variant="outline" onClick={() => setShowOperationManager(true)} className="gap-2 bg-white">
              <Settings size={18} strokeWidth={3} />
              Công đoạn
           </Button>
           <Button onClick={() => {}} className="gap-2">
              <Plus size={18} strokeWidth={3} />
              Tạo BOM mới
           </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="!p-4 bg-white flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm hoặc mã BOM..." 
            className="w-full pl-12 pr-4 py-3 bg-[#FAF7F2] border-[2.5px] border-black text-sm font-bold placeholder:text-black/30 focus:outline-none focus:ring-0"
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Button variant="outline" className="gap-2 flex-1 md:flex-initial">
             <ListFilter size={18} />
             Bộ lọc
          </Button>
          <Button variant="outline" className="gap-2 flex-1 md:flex-initial">
             <History size={18} />
             Lịch sử
          </Button>
        </div>
      </Card>

      {/* BOM Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {boms.map((bom) => (
          <Card 
            key={bom.id} 
            className="group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer relative overflow-hidden"
            onClick={() => setSelectedBomId(bom.id)}
          >
            <div className="flex justify-between items-start mb-6">
               <div className="flex flex-col">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Mã sản phẩm: {bom.product?.code}</span>
                  <h3 className="text-xl font-bold font-space uppercase text-black group-hover:text-purple-600 transition-colors">
                    {bom.product?.name}
                  </h3>
               </div>
               <div className="bg-purple-100 border-2 border-black px-2 py-1 rounded-lg text-[10px] font-black">
                  V{bom.version}.0
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Trạng thái</span>
                  <span className={bom.is_active ? "text-emerald-600 font-black" : "text-gray-400"}>
                    {bom.is_active ? "● Đang kích hoạt" : "○ Bản nháp"}
                  </span>
               </div>
               <div className="h-[2px] bg-black/5 w-full" />
               <p className="text-xs text-gray-400 italic line-clamp-2 min-h-[32px]">
                  {bom.note || "Không có ghi chú kỹ thuật..."}
               </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
               <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-[#D8B4FE] flex items-center justify-center text-[10px] font-black">P</div>
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-[#D1FAE5] flex items-center justify-center text-[10px] font-black">I</div>
                  <div className="w-8 h-8 rounded-full border-2 border-black bg-white flex items-center justify-center text-[10px] font-black">+</div>
               </div>
               <div className="flex items-center gap-2 text-primary font-black text-[11px] uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                  Chi tiết <ArrowRight size={14} strokeWidth={3} />
               </div>
            </div>
          </Card>
        ))}

        {boms.length === 0 && (
          <div className="col-span-full py-20 text-center">
             <div className="w-24 h-24 bg-white border-[2.5px] border-black rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3">
                <Package size={48} strokeWidth={2} className="text-black/20" />
             </div>
             <p className="text-sm font-black uppercase tracking-[0.3em] text-black/30 italic">Lần đầu tiên? Hãy tạo BOM cho sản phẩm</p>
          </div>
        )}
      </div>

      {showMaterialManager && (
        <MaterialManagerModal 
          isOpen={showMaterialManager} 
          onClose={() => setShowMaterialManager(false)} 
        />
      )}

      {showOperationManager && (
        <OperationManagerModal 
          isOpen={showOperationManager} 
          onClose={() => setShowOperationManager(false)} 
        />
      )}

      {selectedBomId && (
        <BOMDetailModal 
          bomId={selectedBomId} 
          isOpen={!!selectedBomId} 
          onClose={() => setSelectedBomId(null)} 
        />
      )}
    </div>
  );
}
