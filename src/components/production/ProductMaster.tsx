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
  ChevronRight
} from 'lucide-react';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getAllProducts, upsertProduct } from '@/services/product.service';
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

  const handleSaveProduct = async (data: Partial<Product>) => {
    setIsLoading(true);
    try {
      await upsertProduct(data);
      showToast('success', 'Đã lưu sản phẩm thành công');
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
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-24 px-6 md:px-12 font-typewriter">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 bg-white/40 p-10 border-b-2 border-retro-sepia/10 relative overflow-hidden retro-card">
        <div className="washi-tape-top" />
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Package size={240} strokeWidth={0.5} className="text-retro-sepia" />
        </div>
        
        <div className="relative z-10">
          <nav className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-4 opacity-60">
            <Package size={14} strokeWidth={1.5} />
            <span>Sản xuất</span>
            <ChevronRight size={12} strokeWidth={1.5} />
            <span className="text-retro-sepia">Danh mục Vật phẩm</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-black text-retro-sepia uppercase tracking-tighter italic underline decoration-double decoration-retro-mustard/30 underline-offset-8">
            Master List <span className="text-retro-brick">Sản phẩm</span>
          </h1>
          <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] italic mt-4 opacity-60">Quản lý Định mức nguyên vật liệu (BOM) & Kế hoạch sản xuất — 1984</p>
        </div>

        <button 
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="relative z-10 flex items-center gap-4 px-10 py-5 bg-retro-brick text-white shadow-[4px_4px_0px_#3E272333] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-retro-sepia transition-all active:scale-95"
        >
          <Plus size={20} strokeWidth={2.5} />
          Khởi tạo Sản phẩm mới
        </button>
      </div>


      {/* SEARCH/FILTER BAR */}
      <div className="bg-white/60 p-8 border-2 border-retro-sepia/10 shadow-inner flex flex-col md:flex-row gap-8 font-typewriter">
        <div className="relative flex-1 group">
          <input 
            type="text"
            placeholder="Tra cứu tên sản phẩm hoặc mã định danh SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white/40 border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all shadow-inner placeholder:italic placeholder:font-normal placeholder:lowercase"
          />
          <Search size={22} strokeWidth={1.5} className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20 group-focus-within:text-retro-brick transition-colors" />
        </div>
        
        <button className="px-10 py-5 bg-white border-2 border-retro-sepia/10 font-black text-[11px] uppercase tracking-[0.2em] text-retro-sepia flex items-center gap-4 hover:bg-retro-paper transition-all shadow-sm rotate-1 hover:rotate-0">
          <Filter size={20} strokeWidth={1.5} /> Lọc thuộc tính
        </button>
      </div>


      {/* PRODUCTS GRID/LIST */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center font-typewriter">
           <Loader2 size={56} strokeWidth={1.5} className="text-retro-brick animate-spin mb-8" />
           <p className="text-[10px] font-black uppercase text-retro-earth tracking-[0.4em] animate-pulse italic">Đang truy xuất Sổ cái vật phẩm...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-32 text-center bg-white/40 border-4 border-dashed border-retro-sepia/10 flex flex-col items-center font-typewriter">
           <Package size={80} strokeWidth={1} className="text-retro-earth/20 mb-8" />
           <h3 className="text-sm font-black text-retro-earth/60 uppercase tracking-[0.2em] italic">Không tìm thấy vật phẩm tương thích</h3>
           <p className="text-[10px] text-retro-earth/40 font-black uppercase mt-4 tracking-widest">Vui lòng rà soát lại SKU hoặc khởi tạo bản ghi mới.</p>
        </div>
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {filteredProducts.map((p) => (
             <div 
               key={p.id}
               onClick={() => {
                 setSelectedProduct(p);
                 setIsDetailOpen(true);
               }}
               className="group relative bg-white p-8 border-2 border-retro-sepia/5 hover:border-retro-sepia/20 shadow-sm hover:shadow-2xl transition-all cursor-pointer overflow-hidden font-typewriter"
             >
                {/* Background Decor */}
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-retro-paper/40 group-hover:bg-retro-mustard/10 transition-colors rotate-12" />
                
                <div className="relative space-y-8">
                   <div className="flex justify-between items-start">
                      <div className="w-16 h-16 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-earth/20 group-hover:bg-retro-sepia group-hover:text-retro-paper transition-all rotate-3 group-hover:rotate-0 shadow-sm">
                         <Package size={32} strokeWidth={1.5} />
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-retro-paper/50 border border-retro-sepia/5 shadow-inner">
                         <div className="w-2 h-2 bg-retro-moss shadow-sm animate-pulse" />
                         <span className="text-[9px] font-black text-retro-earth uppercase tracking-[0.2em] italic">Đang khả dụ</span>
                      </div>
                   </div>

                   <div>
                      <h3 className="text-[13px] font-black text-retro-sepia uppercase tracking-tighter line-clamp-1 group-hover:text-retro-brick transition-all underline decoration-retro-mustard/20 group-hover:decoration-retro-brick/20 underline-offset-4">
                        {p.name || '---'}
                      </h3>
                      <p className="text-[10px] text-retro-earth/60 font-black uppercase tracking-[0.2em] mt-2 italic">{p.sku || 'CHƯA-GÁN-SKU'}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-6 bg-retro-paper/30 p-4 border border-retro-sepia/5 shadow-inner">
                      <div className="space-y-2">
                         <div className="flex items-center gap-3">
                            <Clock size={14} strokeWidth={1.5} className="text-retro-sepia/20" />
                            <span className="text-[8px] font-black text-retro-earth uppercase tracking-widest opacity-60">Thanh thời</span>
                         </div>
                         <p className="text-xs font-black text-retro-sepia italic">
                            {p.productionTimeStd || 0} <span className="text-[9px] uppercase not-italic">Phút</span>
                         </p>
                      </div>
                      <div className="space-y-2 border-l border-retro-sepia/10 pl-4">
                          <div className="flex items-center gap-3">
                            <Tag size={14} strokeWidth={1.5} className="text-retro-brick/20" />
                            <span className="text-[8px] font-black text-retro-brick uppercase tracking-widest opacity-60">Niêm giá</span>
                          </div>
                          <p className="text-xs font-black text-retro-brick italic">
                            {(() => {
                               const config = (p as any).cogsConfig;
                               if (config?.suggestedPrices?.wholesale) return Number(config.suggestedPrices.wholesale).toLocaleString();
                               return 'Liên hệ';
                            })()} <span className="text-[9px] uppercase not-italic">VNĐ</span>
                          </p>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-6 border-t-2 border-retro-sepia/5 group-hover:border-retro-sepia/10 transition-all italic">
                      <div className="flex items-center gap-4">
                         <div className="flex -space-x-4">
                            {[1, 2, 3].map(i => (
                               <div key={i} className="w-6 h-6 border-2 border-white bg-retro-paper shadow-sm" />
                            ))}
                         </div>
                         <span className="text-[9px] font-black text-retro-earth/40 uppercase tracking-widest">+{p.bomItems?.length || 0} Linh kiện định mức</span>
                      </div>
                      <div className="w-10 h-10 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia group-hover:bg-retro-sepia group-hover:text-retro-paper transition-all shadow-sm rotate-45 group-hover:rotate-0">
                         <ArrowUpRight size={18} strokeWidth={1.5} />
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>

      )}

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
          initialData={editingProduct}
        />
      )}
    </div>
  );
}
