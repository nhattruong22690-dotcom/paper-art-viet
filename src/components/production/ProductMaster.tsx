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
  Activity
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
      
      // 1. Save Basic Product (this creates ID if new)
      const savedProduct = await upsertProduct(productData);
      
      // 2. Save BOM if present (Sequential)
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
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            <Package size={12} />
            <span>Sản xuất</span>
            <ChevronRight size={10} />
            <span className="text-primary italic">Product Master List</span>
          </nav>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Danh mục <span className="text-primary italic">Sản phẩm</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">
             Quản lý hồ sơ định danh, định mức vật tư (BOM) và giá thành sản xuất.
          </p>
        </div>
        
        <button 
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="btn-primary gap-3 shadow-vibrant"
        >
          <Plus size={20} strokeWidth={2.5} />
          <span>Thêm sản phẩm mới</span>
        </button>
      </div>

      {/* FILTER / SEARCH BAR */}
      <div className="card !p-5 flex flex-col md:flex-row gap-5 border border-slate-50 shadow-soft">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Tìm theo tên sản phẩm hoặc mã SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input pl-12 h-12 bg-slate-50/50 border-slate-100 rounded-xl"
          />
        </div>
        <button className="btn-secondary gap-3 whitespace-nowrap px-8 shadow-sm">
          <Filter size={18} strokeWidth={2.5} /> 
          <span>Bộ lọc nâng cao</span>
        </button>
      </div>

      {/* PRODUCTS GRID */}
      {isLoading ? (
        <div className="py-40 flex flex-col items-center justify-center gap-4 text-slate-400 animate-in fade-in">
           <Loader2 size={48} className="animate-spin text-primary opacity-30" />
           <p className="text-[10px] font-black uppercase tracking-[0.3em]">Đang đồng bộ Master List...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-40 text-center bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-100 flex flex-col items-center animate-in fade-in">
           <Package size={80} strokeWidth={1} className="text-slate-200 mb-6 opacity-30" />
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Không có dữ liệu SKU</p>
           <button 
             onClick={() => setIsFormOpen(true)}
             className="mt-8 text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
           >
             Bắt đầu khai báo sản phẩm đầu tiên
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
               className="group card !p-8 hover:shadow-vibrant hover:border-primary/20 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[280px]"
             >
                <div className="relative space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                         <Package size={28} strokeWidth={2} />
                      </div>
                      <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                         <span className="text-[9px] font-black uppercase tracking-widest leading-none">In Production</span>
                      </div>
                   </div>

                   <div>
                      <h3 className="text-base font-black text-slate-900 group-hover:text-primary transition-colors tracking-tight line-clamp-2">
                        {p.name || 'Untitled SKU'}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2 italic">{p.sku || 'NO-REF'}</p>
                   </div>
                </div>

                <div className="space-y-6 mt-8">
                   <div className="grid grid-cols-2 gap-4 py-6 border-y border-slate-50">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Lead Time</p>
                         <div className="flex items-center gap-2">
                            <Clock size={14} className="text-slate-300" />
                            <p className="text-sm font-black text-slate-700 tabular-nums">
                               {p.productionTimeStd || 0} <span className="text-[10px] text-slate-400 font-bold">Min</span>
                            </p>
                         </div>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Target Price</p>
                          <div className="flex items-center gap-2">
                            <DollarSign size={14} className="text-amber-500/50" />
                            <p className="text-sm font-black text-slate-900 tabular-nums tracking-tight">
                              {Number(p.wholesalePrice || 0).toLocaleString()} <span className="text-[10px] text-amber-500 font-bold">SỈ</span>
                            </p>
                          </div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                               <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-black text-slate-300">
                                  {i < 3 ? <Layers size={12} /> : '+' + (p.bomItems?.length || 0)}
                               </div>
                            ))}
                         </div>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">BOM Configuration</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-200 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                         <ArrowUpRight size={20} strokeWidth={2.5} />
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      {/* FOOTER METRICS */}
      <div className="flex justify-between items-center py-8 border-t border-slate-100 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] opacity-50 px-4">
         <div className="flex items-center gap-3">
            <Activity size={16} strokeWidth={2.5} /> 
            <span>Productivity Index: Stable</span>
         </div>
         <div className="flex items-center gap-6">
            <span>{products.length} SKU Enrolled</span>
            <span className="w-px h-3 bg-slate-200" />
            <span className="flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
               Master Registry Online
            </span>
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
          initialData={editingProduct}
        />
      )}
    </div>
  );
}
