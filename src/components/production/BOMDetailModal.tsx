"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Database, 
  BarChart3, 
  DollarSign, 
  Layers, 
  FileText, 
  AlertCircle,
  TrendingUp,
  Download,
  Share2,
  Clock,
  ChevronRight,
  Calculator,
  Package
} from 'lucide-react';
import { getBOMDetail, calculateBOMCost } from '@/services/bom.service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BOMWithDetails } from '@/types/bom';
import { formatNumber, formatVND } from '@/utils/format';


interface BOMDetailModalProps {
  bomId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BOMDetailModal({ bomId, isOpen, onClose }: BOMDetailModalProps) {
  const [bom, setBom] = useState<BOMWithDetails | null>(null);
  const [costs, setCosts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [bomId, isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [detail, costData] = await Promise.all([
        getBOMDetail(bomId),
        calculateBOMCost(bomId)
      ]);
      setBom(detail);
      setCosts(costData);
    } catch (err) {
      console.error('Failed to load BOM detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[var(--sidebar-width)] z-[500] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-[95vw] h-[95vh] bg-[#FAF7F2] border-[3px] border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="px-8 py-6 border-b-[3px] border-black flex justify-between items-center bg-[#D8B4FE]/20">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white border-[2.5px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-3">
              <Settings size={28} className="text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest border border-purple-200 bg-purple-50 px-2 py-0.5 rounded-lg">Version {bom?.version}.0</span>
                <span className="text-[10px] font-black text-black uppercase tracking-widest px-2 py-0.5 border-l-2 border-black ml-1">SKU: {bom?.product?.code}</span>
              </div>
              <h2 className="text-3xl font-bold font-space uppercase text-black">{bom?.product?.name}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" onClick={() => {}} className="gap-2">
                <Download size={14} /> Tải PDF
             </Button>
             <Button variant="outline" size="sm" onClick={() => {}} className="gap-2">
                <Share2 size={14} /> Chia sẻ
             </Button>
             <button 
               onClick={onClose}
               className="w-12 h-12 border-[2.5px] border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ml-4"
             >
               <X size={24} strokeWidth={3} />
             </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Left Side: Metric Cards (Vertical Stack) */}
          <div className="w-full lg:w-[320px] p-8 bg-white border-r-[3px] border-black overflow-y-auto space-y-6">
            
            {/* Metric 1: Production Status */}
            <Card className="!p-5 bg-[#D1FAE5]/30 group hover:rotate-1 transition-transform">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                     <Layers size={18} className="text-emerald-600" />
                  </div>
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200 uppercase">Trạng thái</span>
               </div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Đang sản xuất</p>
               <p className="text-2xl font-bold font-space text-black tabular-nums">{formatNumber(1200)} <span className="text-xs uppercase ml-1 opacity-40">pcs</span></p>
            </Card>

            {/* Metric 2: Material Cost */}
            <Card className="!p-5 bg-[#FDE68A]/30 group hover:-rotate-1 transition-transform">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                     <Database size={18} className="text-amber-600" />
                  </div>
                  <Calculator size={14} className="text-amber-600 animate-pulse" />
               </div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Giá vốn vật tư</p>
               <p className="text-2xl font-bold font-space text-black tabular-nums">
                  {formatNumber(costs?.materialCost)} <span className="text-xs uppercase ml-1 opacity-40">đ</span>
               </p>
               <div className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-amber-700 uppercase italic">
                  <Clock size={10} /> Chốt cách đây 2 ngày
               </div>
            </Card>

            {/* Metric 3: Operation Cost */}
            <Card className="!p-5 bg-[#BFDBFE]/30 group hover:rotate-1 transition-transform">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                     <Settings size={18} className="text-blue-600" />
                  </div>
                  <BarChart3 size={14} className="text-blue-600" />
               </div>
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Giá gia công</p>
               <p className="text-2xl font-bold font-space text-black tabular-nums">
                  {formatNumber(costs?.operationCost)} <span className="text-xs uppercase ml-1 opacity-40">đ</span>
               </p>
            </Card>

            {/* Metric 4: Total Cost (Highlighted) */}
            <Card className="!p-6 bg-[#D8B4FE] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
               <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/20 rounded-full group-hover:scale-150 transition-transform duration-700" />
               <p className="text-[10px] font-black text-purple-900 uppercase tracking-[0.2em] mb-2 relative z-10">TỔNG GIÁ THÀNH</p>
               <p className="text-4xl font-bold font-space text-black tabular-nums relative z-10">
                 {formatNumber(costs?.totalCost)} <span className="text-xs uppercase ml-1 opacity-50">đ</span>
               </p>
               <div className="mt-6 pt-4 border-t-2 border-black/10 relative z-10 flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white/40 p-2 rounded-lg border border-black/10">
                    <span className="text-[9px] font-black text-purple-900 uppercase">Gợi ý chốt Sales:</span>
                    <span className="text-xs font-bold text-black tabular-nums">{formatNumber(costs?.suggestedPrice)} đ</span>
                  </div>
                  <div className="flex items-center gap-2 text-[8px] font-bold text-black/40 uppercase tracking-widest">
                     <TrendingUp size={10} /> +5.4% so với báo giá trước
                  </div>
               </div>
            </Card>

          </div>

          {/* Right Side: Main Detail View */}
          <div className="flex-1 overflow-y-auto p-10 bg-[#FAF7F2] space-y-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               {/* Product Image Frame */}
               <div className="lg:col-span-4 aspect-square bg-white border-[2.5px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative group flex items-center justify-center p-8 overflow-hidden">
                  <div className="absolute inset-0 bg-[#f0f0f0]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="text-center">
                    <Package size={80} strokeWidth={1} className="text-black/10 mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase text-black/20 tracking-[0.5em]">No Image Preview Available</p>
                  </div>
                  <button className="absolute bottom-4 right-4 w-10 h-10 bg-white border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                    <Settings size={18} />
                  </button>
               </div>

               {/* Tech Notes */}
               <div className="lg:col-span-8 space-y-6">
                  <div className="flex items-center gap-3">
                     <FileText size={20} className="text-purple-600" />
                     <h3 className="text-lg font-bold font-space uppercase tracking-widest underline decoration-[3px] decoration-[#D8B4FE] underline-offset-4">Ghi chú kỹ thuật</h3>
                  </div>
                  <Card className="!p-8 min-h-[160px] relative bg-white italic text-gray-600 text-sm leading-relaxed border-2 border-black/10">
                    {bom?.note || "Chưa có ghi chú kỹ thuật cụ thể cho phiên bản này. Vui lòng cập nhật thông tin về phương thức gia công và lưu ý bảo quản..."}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 text-[9px] font-black text-black/20 uppercase tracking-widest">
                       <Clock size={12} /> Cập nhật lần cuối 12/03/2026
                    </div>
                  </Card>
               </div>
            </div>

            {/* Tables Section */}
            <div className="space-y-10 pt-6">
               
               {/* Materials Table */}
               <div className="space-y-6">
                  <div className="flex justify-between items-end">
                     <div className="flex items-center gap-3">
                        <Database size={20} className="text-purple-600" />
                        <h3 className="text-lg font-bold font-space uppercase tracking-widest">Chi tiết Vật tư</h3>
                     </div>
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{bom?.bom_materials?.length || 0} thành phần</span>
                  </div>
                  
                  <div className="border-[2.5px] border-black overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-black text-white uppercase text-[10px] font-black tracking-widest">
                           <tr>
                              <th className="px-6 py-4 border-r border-white/20">NVL / Mã Code</th>
                              <th className="px-6 py-4 border-r border-white/20">Loại</th>
                              <th className="px-6 py-4 border-r border-white/20 text-center">Định mức</th>
                              <th className="px-6 py-4 border-r border-white/20 text-center">Hao hụt</th>
                              <th className="px-6 py-4 text-right">Giá vốn đơn vị</th>
                              <th className="px-6 py-4 text-right bg-purple-600">Thành tiền</th>
                           </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-black border-t-2 border-black">
                           {bom?.bom_materials?.map((item, i) => {
                             const customPrices = bom?.product?.cogs_config?.customPrices || {};
                             const materialPrice = customPrices[item.material_id] ?? (item.material?.price || 0);
                             return (
                              <tr key={i} className="border-b-2 border-black/5 hover:bg-[#D8B4FE]/5 transition-colors">
                                 <td className="px-6 py-4 border-r-2 border-black/5">
                                    <div className="flex flex-col">
                                       <span>{item.material?.name}</span>
                                       <span className="text-[9px] text-gray-400 uppercase">{item.material?.code}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 border-r-2 border-black/5">
                                    <span className="px-2 py-0.5 border border-black/10 bg-gray-50 rounded text-[9px] uppercase">{item.material?.type}</span>
                                 </td>
                                 <td className="px-6 py-4 border-r-2 border-black/5 text-center">{item.qty} {item.material?.unit}</td>
                                 <td className="px-6 py-4 border-r-2 border-black/5 text-center text-rose-500">{(item.scrap_rate * 100).toFixed(1)}%</td>
                                 <td className="px-6 py-4 border-r-2 border-black/5 text-right tabular-nums">
                                    {formatNumber(materialPrice)}đ
                                    {customPrices[item.material_id] && <span className="ml-1 text-[8px] text-rose-500 italic uppercase">(*Tùy chỉnh)</span>}
                                 </td>
                                 <td className="px-6 py-4 text-right tabular-nums font-black">
                                    {formatNumber(item.qty * materialPrice * (1 + item.scrap_rate))}đ
                                 </td>
                              </tr>
                             );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>

               {/* Operations Table */}
               <div className="space-y-6">
                  <div className="flex justify-between items-end">
                     <div className="flex items-center gap-3">
                        <Settings size={20} className="text-purple-600" />
                        <h3 className="text-lg font-bold font-space uppercase tracking-widest">Quy trình công đoạn</h3>
                     </div>
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{bom?.bom_operations?.length || 0} bước thực hiện</span>
                  </div>
                  
                  <div className="border-[2.5px] border-black overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-[#D1FAE5] text-black uppercase text-[10px] font-black tracking-widest border-b-[2.5px] border-black">
                           <tr>
                              <th className="px-6 py-4 border-r-2 border-black/10 w-[80px] text-center">Bước</th>
                              <th className="px-6 py-4 border-r-2 border-black/10">Tên công đoạn</th>
                              <th className="px-6 py-4 text-right">Chi phí đơn vị</th>
                           </tr>
                        </thead>
                        <tbody className="text-sm font-bold text-black">
                           {bom?.bom_operations?.sort((a,b) => a.sequence - b.sequence).map((item, i) => {
                             const customPrices = bom?.product?.cogs_config?.customPrices || {};
                             const operationPrice = customPrices[item.operation_id] ?? (item.operation?.price || 0);
                             return (
                              <tr key={i} className="border-b-2 border-black/5 hover:bg-[#D1FAE5]/10">
                                 <td className="px-6 py-4 border-r-2 border-black/5 text-center font-space text-lg italic text-purple-600">#{item.sequence}</td>
                                 <td className="px-6 py-4 border-r-2 border-black/5 uppercase tracking-tight">{item.operation?.specification}</td>
                                 <td className="px-6 py-4 text-right tabular-nums">
                                    {formatNumber(operationPrice)}đ
                                    {customPrices[item.operation_id] && <span className="ml-1 text-[8px] text-rose-500 italic uppercase">(*Tùy chỉnh)</span>}
                                 </td>
                              </tr>
                             );
                           })}
                        </tbody>
                     </table>
                  </div>
               </div>

            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="p-8 border-t-[3px] border-black bg-white flex justify-between items-center">
            <div className="flex items-center gap-4 text-[11px] font-black text-black uppercase tracking-widest">
               <AlertCircle size={18} className="text-rose-500" />
               Hệ thống đồng bộ hóa giá vốn Real-time • {new Date().toLocaleDateString()}
            </div>
            <div className="flex gap-6">
               <Button variant="outline" onClick={onClose}>Đóng cửa sổ</Button>
               <Button variant="primary" className="border-rose-600 bg-rose-400 hover:bg-rose-500 text-white">Chỉnh sửa định mức</Button>
            </div>
        </div>

      </div>
    </div>
  );
}
