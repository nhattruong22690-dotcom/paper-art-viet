"use client";

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Edit2, 
  Trash2, 
  Tag, 
  Layers, 
  ArrowUpRight,
  Clock,
  DollarSign,
  Loader2,
  ChevronRight,
  LayoutGrid,
  List,
  Activity,
  Box
} from 'lucide-react';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAllProducts, upsertProduct, updateProductBOM } from '@/services/product.service';
import ProductDetailModal from './ProductDetailModal';
import ProductFormModal from './ProductFormModal';
import { useNotification } from "@/context/NotificationContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Product {
  id: string;
  sku: string | null;
  name: string | null;
  basePrice: any;
  costPrice: any;
  wholesalePrice: any;
  exportPrice: any;
  productionTimeStd: number | null;
  bomItems?: any[];
}

export default function ProductMaster() {
  const { showToast, showModal } = useNotification();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await getAllProducts();
      setProducts(data as any);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSaveProduct = async (payload: any) => {
    setIsLoading(true);
    try {
      const { bomItems, ...productData } = payload;
      
      const savedProduct = await upsertProduct(productData);
      
      if (bomItems && bomItems.length > 0) {
          await updateProductBOM(savedProduct.id, bomItems);
      }
      
      showToast('success', 'Đã lưu sản phẩm và định mức thành công');
      setIsFormOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Failed to save product:', error);
      showModal('error', 'Không thể lưu sản phẩm', String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.sku?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-neo-purple/5 p-8 rounded-xl border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-3">
            <Package size={12} strokeWidth={3} className="text-black" />
            <span>Sản xuất</span>
            <ChevronRight size={10} strokeWidth={3} />
            <span className="text-black italic">Danh sách Sản phẩm</span>
          </nav>
          <h1 className="text-4xl font-black text-black tracking-tighter uppercase italic">
            Danh mục <span className="text-neo-purple underline decoration-[4px] decoration-black underline-offset-4">Sản phẩm</span>
          </h1>
          <p className="text-[11px] text-black/60 font-black uppercase tracking-[0.1em] mt-3 italic leading-relaxed">
             Quản lý hồ sơ định danh, định mức vật tư (BOM) và cơ cấu giá thành Master.
          </p>
        </div>
        
        <button 
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="w-full md:w-auto px-10 py-5 bg-black text-white rounded-xl border-[2.5px] border-black font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-purple hover:text-black transition-all active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        >
          <Plus size={22} strokeWidth={3} />
          <span>Khai báo sản phẩm mới</span>
        </button>
      </div>

      {/* FILTER / SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative group/field">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU định danh..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-6 h-16 bg-white border-[2.5px] border-black rounded-xl font-black text-black focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all placeholder:text-black/20 uppercase tracking-tight"
          />
        </div>
        <button className="h-16 px-8 bg-white border-[2.5px] border-black rounded-xl text-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-neo-yellow transition-all flex items-center justify-center gap-3 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          <Filter size={20} strokeWidth={3} /> 
          <span className="text-xs uppercase tracking-widest">Bộ lọc</span>
        </button>
      </div>

      {/* PRODUCTS GRID */}
      {isLoading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4 animate-in fade-in">
           <Loader2 size={48} className="animate-spin text-black opacity-20" />
           <p className="text-[11px] font-black uppercase tracking-[0.4em] text-black/20">Đang đồng bộ dữ liệu Master...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-xl border-[2.5px] border-dashed border-black/20 flex flex-col items-center animate-in fade-in">
           <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mb-6">
              <Box size={40} strokeWidth={1.5} className="text-black/10" />
           </div>
           <p className="text-[12px] font-black text-black/20 uppercase tracking-[0.5em]">Tài liệu SKU trống</p>
           <button 
             onClick={() => setIsFormOpen(true)}
             className="mt-8 text-[11px] font-black text-neo-purple uppercase tracking-widest hover:underline decoration-[2px] underline-offset-4"
           >
             Bắt đầu khai báo hồ sơ đầu tiên
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {filteredProducts.map((p) => (
             <div 
               key={p.id}
               onClick={() => {
                 setSelectedProduct(p);
                 setIsDetailOpen(true);
               }}
               className="group relative bg-white border-[2.5px] border-black rounded-xl p-8 hover:bg-[#F3E8FF]/20 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer flex flex-col h-full min-h-[320px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
             >
                {/* Status Badge */}
                <div className="absolute top-8 right-8 px-4 py-1.5 bg-[#ECFDF5] text-[#10B981] rounded-lg border-[2px] border-black flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                   <div className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />
                   <span className="text-[11px] font-black uppercase tracking-widest leading-none italic">Đang hoạt động</span>
                </div>

                <div className="w-16 h-16 bg-neo-purple/10 border-[2.5px] border-black rounded-xl flex items-center justify-center mb-8 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:bg-neo-purple transition-colors">
                   <Package size={32} className="text-black" />
                </div>

                <div className="flex-1 space-y-3">
                   <p className="text-[11px] text-black/40 font-black uppercase tracking-[0.3em] italic">{p.sku || 'NO-REF'}</p>
                   <h3 className="text-xl font-black text-black tracking-tighter leading-tight italic uppercase line-clamp-2">
                     {p.name || 'Sản phẩm chưa đặt tên'}
                   </h3>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-8 mt-8 border-t-[2.5px] border-black">
                   <div className="space-y-1.5">
                      <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Thời gian SX</p>
                      <div className="flex items-center gap-2">
                         <Clock size={16} strokeWidth={3} className="text-black/20" />
                         <p className="font-black text-black tabular-nums text-lg italic">
                            {p.productionTimeStd || 0} <span className="text-[9px] font-bold text-black/40 uppercase">phút</span>
                         </p>
                      </div>
                   </div>
                   <div className="space-y-1.5">
                       <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Giá bán sỉ</p>
                       <div className="flex items-center gap-2">
                         <DollarSign size={16} strokeWidth={3} className="text-[#10B981]/40" />
                         <p className="font-black text-black tabular-nums text-lg italic">
                           {Number(p.wholesalePrice || 0).toLocaleString()} <span className="text-[9px] font-bold text-black/40 uppercase">đ</span>
                         </p>
                       </div>
                   </div>
                </div>

                <div className="flex items-center justify-between mt-8 pt-6">
                   <div className="flex items-center gap-3">
                      <div className="flex -space-x-3">
                         {[1, 2, 3].map(i => (
                            <div key={i} className="w-10 h-10 rounded-lg border-[2.5px] border-black bg-white flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform group-hover:scale-110">
                               {i < 3 ? <Layers size={18} className="text-black/20" /> : <p className="text-[11px] font-black text-black">+{p.bomItems?.length || 0}</p>}
                             </div>
                         ))}
                      </div>
                      <span className="text-[11px] font-black text-black/30 uppercase tracking-widest ml-4">Chi tiết kỹ thuật</span>
                   </div>
                   <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center hover:bg-neo-purple hover:text-black transition-all border-[2px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                      <ArrowUpRight size={24} strokeWidth={3} />
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* FOOTER METRICS */}
      <div className="flex flex-col md:flex-row justify-between items-center py-10 border-t-[2.5px] border-black gap-6">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-neo-purple/20 border-[2px] border-black rounded-lg flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
               <Activity size={20} strokeWidth={3} className="text-black" />
            </div>
            <p className="text-[11px] font-black text-black uppercase tracking-[0.3em] italic">Trạng thái hệ thống: Đã đồng bộ</p>
         </div>
         <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="flex flex-col items-end">
               <span className="text-[9px] font-black text-black/40 uppercase">Tổng SKU tồn kho</span>
               <span className="text-xl font-black text-black italic">{products.length} Bản ghi Master</span>
            </div>
            <div className="w-px h-10 bg-black/10 hidden md:block" />
            <div className="flex items-center gap-3 bg-[#E0E7FF] px-6 py-2.5 rounded-lg border-[2px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase text-[11px] font-black italic">
               <div className="w-2 h-2 bg-neo-purple rounded-full animate-pulse" />
               Hệ thống Trực tuyến
            </div>
         </div>
      </div>

      {selectedProduct && (
        <ProductDetailModal 
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          product={selectedProduct}
          onUpdate={fetchProducts}
        />
      )}

      {isFormOpen && (
        <ProductFormModal 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleSaveProduct}
          initialData={editingProduct || undefined}
        />
      )}
    </div>
  );
}
