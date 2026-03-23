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
  Loader2
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
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20 px-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight italic">
            Danh mục <span className="text-indigo-600 underline decoration-4 underline-offset-8">Sản phẩm</span>
          </h1>
          <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest mt-3">Quản lý Master List & Định mức nguyên vật liệu (BOM)</p>
        </div>

        <button 
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-3 px-8 py-4.5 bg-indigo-600 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          <Plus size={18} />
          Thêm sản phẩm mới
        </button>
      </div>

      {/* SEARCH/FILTER BAR */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-col md:flex-row gap-6">
        <div className="relative flex-1">
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm hoặc mã SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-8 py-5 bg-gray-50/50 border border-gray-100 rounded-[28px] text-[13px] font-bold text-gray-700 outline-none focus:bg-white focus:border-indigo-200 transition-all uppercase tracking-tight"
          />
          <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        
        <button className="px-10 py-5 bg-white border border-gray-100 rounded-[28px] font-black text-[11px] uppercase tracking-widest text-gray-500 flex items-center gap-3 hover:bg-gray-50 transition-all">
          <Filter size={18} /> Lọc nâng cao
        </button>
      </div>

      {/* PRODUCTS GRID/LIST */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center">
           <Loader2 size={48} className="text-indigo-600 animate-spin mb-6" />
           <p className="text-xs font-black uppercase text-gray-400 tracking-widest italic">Đang tải danh sách sản phẩm...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-24 text-center bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-gray-50/50 flex flex-col items-center">
           <Package size={64} className="text-gray-100 mb-6" />
           <h3 className="text-lg font-black text-gray-800 uppercase italic">Không tìm thấy sản phẩm nào</h3>
           <p className="text-xs text-gray-400 font-bold uppercase mt-2">Thử thay đổi từ khóa tìm kiếm hoặc tạo sản phẩm mới.</p>
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
               className="group relative bg-white p-8 rounded-[48px] border border-gray-100 shadow-xl shadow-gray-100/30 hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all cursor-pointer overflow-hidden"
             >
                {/* Background Decor */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50/30 rounded-full group-hover:bg-indigo-100/50 transition-colors" />
                
                <div className="relative space-y-6">
                   <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                         <Package size={28} />
                      </div>
                      <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-xl">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">In Stock</span>
                      </div>
                   </div>

                   <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 group-hover:text-indigo-600 transition-all">
                        {p.name || '---'}
                      </h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">{p.sku || 'N/A'}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                         <div className="flex items-center gap-2 mb-1">
                            <Clock size={12} className="text-gray-400" />
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Manufacturing</span>
                         </div>
                         <p className="text-xs font-black text-gray-700 tabular-nums">
                            {p.productionTimeStd || 0} Phút
                         </p>
                      </div>
                      <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <div className="flex items-center gap-2 mb-1">
                            <Tag size={12} className="text-indigo-500" />
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Giá Sỉ</span>
                          </div>
                          <p className="text-xs font-black text-indigo-800 tabular-nums">
                            {(() => {
                               const config = (p as any).cogsConfig;
                               if (config?.suggestedPrices?.wholesale) return Number(config.suggestedPrices.wholesale).toLocaleString();
                               // Fallback if not saved yet (just a quick estimate for UI)
                               return 'Chưa báo';
                            })()}đ
                          </p>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t border-gray-50 group-hover:border-indigo-50 transition-all">
                      <div className="flex items-center gap-2">
                         <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                               <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-gray-100" />
                            ))}
                         </div>
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">+{p.bomItems?.length || 0} Materials</span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                         <ArrowUpRight size={16} />
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
