"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ProductFormModal from '@/components/production/ProductFormModal';
import { upsertProduct } from '@/services/product.service';
import { useNotification } from "@/context/NotificationContext";
import { 
  Users, 
  Plus, 
  Filter, 
  Search, 
  Phone, 
  MapPin, 
  Building2, 
  Trash2, 
  Edit3, 
  Mail, 
  FileText, 
  AlertCircle, 
  X, 
  ChevronRight, 
  UserPlus, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Hash, 
  Calculator,
  ShoppingCart,
  Calendar,
  Lock,
  Check,
  Minus,
  Package,
} from 'lucide-react';
import HelpIcon from '@/components/common/HelpIcon';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility for thousand separator
function formatNumber(val: number | string | undefined | null) {
  if (val === undefined || val === null || val === '') return '';
  const num = typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(/,/g, '')) : val;
  if (isNaN(num)) return val.toString();
  return new Intl.NumberFormat('vi-VN').format(num);
}

// Utility to parse formatted number
function parseNumber(val: string): number {
  return parseInt(val.replace(/\D/g, '')) || 0;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  basePrice: number;
  cogs: number;
}

interface Allocation {
  id: string;
  type: 'internal' | 'outsourced';
  outsourcedName?: string;
  quantity: number;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  cogs: number;
  dealPrice: number;
  suggestedPrice: number;
  wholesalePrice?: number;
  exportPrice?: number;
  bomSnapshot: any[]; 
  note?: string;
  allocations: Allocation[];
}

interface Customer {
  id: string;
  customerCode?: string;
  name: string;
  phone?: string;
  address?: string;
}

// ProductSelector component
interface ProductSelectorProps {
  value: string;
  onSelect: (productId: string) => void;
  products: Product[];
  onQuickCreate: () => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ value, onSelect, products, onQuickCreate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    const list = products || [];
    if (!searchTerm) return list.slice(0, 50); // Limit initial view
    return list.filter(p => 
      (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (p.sku?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    ).slice(0, 50);
  }, [products, searchTerm]);

  const selectedProduct = useMemo(() => (products || []).find(p => p.id === value), [products, value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={selectorRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between cursor-pointer group hover:bg-white hover:border-blue-300 transition-all shadow-sm"
      >
        <div className="flex flex-col justify-center overflow-hidden">
          {selectedProduct ? (
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider leading-none mb-0.5">{selectedProduct.sku}</span>
              <span className="text-xs font-semibold text-slate-700 line-clamp-1 truncate leading-tight">{selectedProduct.name}</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-400 italic">Chọn sản phẩm...</span>
          )}
        </div>
        <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300 shrink-0 ml-2", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200 min-w-[300px]">
          <div className="p-2 bg-slate-50 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Tìm sản phẩm..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-blue-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()} 
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation();
                    onSelect(p.id); 
                    setIsOpen(false); 
                    setSearchTerm(''); 
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 flex flex-col gap-0.5"
                >
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider leading-none">{p.sku}</span>
                  <span className="text-xs font-semibold text-slate-900 leading-tight block truncate">{p.name}</span>
                </button>
              ))
            ) : (
              <div className="p-6 text-center flex flex-col items-center gap-2">
                <Package size={24} className="text-slate-200" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Không tìm thấy sản phẩm</p>
                <button 
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onQuickCreate(); 
                    setIsOpen(false); 
                  }} 
                  className="mt-1 flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Plus size={12} /> Tạo nhanh
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


interface CreateSalesOrderProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateSalesOrder({ isOpen, onClose, onSuccess }: CreateSalesOrderProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [contractCode, setContractCode] = useState('');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showManagerLock, setShowManagerLock] = useState(false);
  const [managerPass, setManagerPass] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast, showModal, confirm: customConfirm } = useNotification();
  const isDirty = selectedCustomerId || items.length > 0 || deadline || notes;

  const handleClose = async () => {
    if (isDirty) {
      if (await customConfirm('Dữ liệu chưa được lưu, bạn có chắc chắn muốn thoát?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Combobox State
  const [customerSearch, setCustomerSearch] = useState('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  // Load products from API
  const fetchProductsList = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, []);

  useEffect(() => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(Array.isArray(data) ? data : []));

    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setIsComboboxOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      setSelectedCustomer(customer || null);
      if (customer) {
        setCustomerSearch(`${customer.customerCode || '??'} - ${customer.name}`);
      }
      fetch(`/api/orders/next-code?customerId=${selectedCustomerId}`)
        .then(res => res.json())
        .then(data => setContractCode(data.contractCode || ''));
    } else {
      setSelectedCustomer(null);
      setContractCode('');
      setCustomerSearch('');
    }
  }, [selectedCustomerId, customers]);

  // Handle Duplication if duplicateId is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const duplicateId = urlParams.get('duplicateId');
    
    if (duplicateId) {
      const fetchDuplicateData = async () => {
        try {
          const res = await fetch(`/api/orders/${duplicateId}`);
          const order = await res.json();
          
          if (order && order.orderItems) {
             const newItems = order.orderItems.map((oi: any) => ({
                id: Math.random().toString(36).substr(2, 9),
                productId: oi.productId,
                productName: oi.product?.name || "SP cũ",
                sku: oi.product?.sku || oi.sku || "",
                quantity: oi.quantity || 1,
                cogs: Number(oi.cogsAtOrder || 0),
                dealPrice: Number(oi.price || 0),
                suggestedPrice: Number(oi.price || 0),
                bomSnapshot: oi.bomSnapshot || [],
                note: oi.note || ""
             }));
             setItems(newItems);
             setSelectedCustomerId(order.customerId || '');
          }
        } catch (error) {
          console.error("Error fetching duplicate order:", error);
        }
      };
      fetchDuplicateData();
    }
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch || selectedCustomerId) return customers.slice(0, 10);
    return customers.filter(c => 
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
      (c.customerCode || '').toLowerCase().includes(customerSearch.toLowerCase())
    ).slice(0, 10);
  }, [customers, customerSearch, selectedCustomerId]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setIsComboboxOpen(false);
    setIsMobileSearchOpen(false);
  };

  const handleProductDetails = async (itemId: string, productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}/details`);
      const details = await res.json();
      
      if (!details.bomItems || details.bomItems.length === 0) {
        showToast('warning', 'Sản phẩm này chưa được cấu hình BOM, không thể tính giá vốn');
      }

      const cogs = Number(details.costPrice || details.calculatedCogs || 0);
      const wholesalePrice = Number(details.wholesalePrice || 0);
      const exportPrice = Number(details.exportPrice || 0);
      
      if (cogs === 0 || wholesalePrice === 0 || exportPrice === 0) {
        showToast('warning', `Sản phẩm [${details.sku}] ${details.name} chưa được cấu hình đầy đủ Giá vốn/Sỉ/XK.`);
      }

      const defaultDealPrice = wholesalePrice > 0 ? wholesalePrice : Number(details.basePrice || 0);

      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            productId: details.id,
            sku: details.sku,
            productName: details.name,
            cogs: cogs,
            dealPrice: defaultDealPrice,
            suggestedPrice: defaultDealPrice,
            wholesalePrice: wholesalePrice,
            exportPrice: exportPrice,
            bomSnapshot: details.bomItems || [],
            note: item.note
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    }
  };

  const handleProductSelect = (itemId: string, productId: string) => {
    handleProductDetails(itemId, productId);
  };

  const handleCreateQuickProduct = async (data: any) => {
    try {
      const newProduct = await upsertProduct(data);
      await fetchProductsList();
      if (activeItemIndex !== null) {
        const itemId = items[activeItemIndex].id;
        handleProductSelect(itemId, newProduct.id);
      }
      setIsProductModalOpen(false);
    } catch (error) {
      console.error('Failed to create product:', error);
      showModal('error', 'Lỗi khi tạo sản phẩm nhanh', String(error));
    }
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: '',
      productName: '',
      sku: '',
      quantity: 1,
      cogs: 0,
      dealPrice: 0,
      suggestedPrice: 0,
      bomSnapshot: [],
      note: '',
      allocations: [{
        id: Math.random().toString(36).substr(2, 9),
        type: 'internal',
        quantity: 1
      }]
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
        if (field === 'quantity' && updated.allocations.length === 1) {
          updated.allocations[0].quantity = value;
        }
        return updated;
      }
      return item;
    }));
  };

  const addAllocation = (itemId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const currentAllocated = item.allocations.reduce((sum, a) => sum + a.quantity, 0);
        const remaining = Math.max(0, item.quantity - currentAllocated);
        return {
          ...item,
          allocations: [
            ...item.allocations,
            { id: Math.random().toString(36).substr(2, 9), type: 'internal', quantity: remaining }
          ]
        };
      }
      return item;
    }));
  };

  const removeAllocation = (itemId: string, allocationId: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        if (item.allocations.length <= 1) return item;
        return {
          ...item,
          allocations: item.allocations.filter(a => a.id !== allocationId)
        };
      }
      return item;
    }));
  };

  const updateAllocation = (itemId: string, allocationId: string, field: keyof Allocation, value: any) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          allocations: item.allocations.map(a => a.id === allocationId ? { ...a, [field]: value } : a)
        };
      }
      return item;
    }));
  };

  const totalRevenue = items.reduce((sum, item) => sum + (item.quantity * item.dealPrice), 0);
  const totalCOGS = items.reduce((sum, item) => sum + (item.quantity * item.cogs), 0);
  const totalProfit = totalRevenue - totalCOGS;
  const isNegativeMargin = items.some(item => item.dealPrice > 0 && item.dealPrice < item.cogs);

  const handleSubmit = async () => {
    if (isNegativeMargin && managerPass !== '1234') {
      setShowManagerLock(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          deadlineDelivery: deadline,
          items: items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            dealPrice: i.dealPrice,
            cogsAtOrder: i.cogs,
            bomSnapshot: i.bomSnapshot,
            note: i.note
          }))
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Đã tạo đơn hàng & ${data.taskCount} lệnh sản xuất thành công!`);
        onSuccess();
        onClose();
      } else {
        showModal('error', 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại dữ liệu đầu vào.', data.error);
      }
    } catch (e) {
      showModal('error', 'Lỗi kết nối hệ thống. Vui lòng kiểm tra lại kết nối mạng.', String(e));
    } finally {
      setIsSubmitting(false);
      setShowManagerLock(false);
    }
  };

  const canSubmit = selectedCustomerId && items.length > 0 && deadline && !isSubmitting;

  return (
    <div className={cn(
      "fixed inset-0 z-[100] flex items-center justify-center p-0 transition-all duration-300",
      isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={handleClose}
      />
      
      {/* Container */}
      <div className="relative bg-white w-full h-full sm:h-[95vh] sm:max-w-7xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 duration-500">
         {/* HEADER */}
         <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative z-50 shrink-0">
            <div className="flex flex-col">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Tạo Đơn Hàng Mới</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Hệ thống quản trị Paper Art Việt</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={handleSubmit}
                 disabled={!canSubmit}
                 className={cn(
                   "flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95",
                   canSubmit 
                     ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200" 
                     : "bg-slate-200 text-slate-400 cursor-not-allowed"
                 )}
               >
                 {isSubmitting ? (
                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                   <>
                     {!canSubmit && <Lock size={14} className="opacity-50" />}
                     Lưu đơn hàng <Check size={16} />
                   </>
                 )}
               </button>
               <button onClick={handleClose} className="p-2.5 bg-white hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-slate-200">
                 <X size={20} />
               </button>
            </div>
          </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-slate-50/30">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* CUSTOMER & INFO SECTION */}
            <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
               <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Users size={14} className="text-blue-500" /> Thông tin khách hàng & Hợp đồng
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* CUSTOMER SEARCH */}
                  <div className="space-y-1.5 relative" ref={comboboxRef}>
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tìm khách hàng</label>
                     <div className="relative group">
                       <Search className={cn(
                         "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                         isComboboxOpen ? "text-blue-500" : "text-slate-400"
                       )} size={16} />
                       <input 
                        type="text"
                        placeholder="Tên hoặc mã KH..."
                        value={customerSearch}
                        onFocus={() => {
                          setIsComboboxOpen(true);
                          if (window.innerWidth < 768) setIsMobileSearchOpen(true);
                        }}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          if (selectedCustomerId) setSelectedCustomerId('');
                          setIsComboboxOpen(true);
                        }}
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500/30 transition-all text-sm font-semibold text-slate-700"
                       />
                       {customerSearch && (
                         <button 
                          onClick={() => { setSelectedCustomerId(''); setCustomerSearch(''); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
                         >
                           <X size={14} />
                         </button>
                       )}
                     </div>

                     {isComboboxOpen && !isMobileSearchOpen && (
                       <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[60] overflow-hidden">
                          {filteredCustomers.length > 0 ? (
                            <div className="max-h-60 overflow-y-auto">
                              {filteredCustomers.map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => handleSelectCustomer(c)}
                                  className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0"
                                >
                                  <div className="flex flex-col">
                                     <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{c.customerCode || 'KH LẠ'}</span>
                                     <span className="text-sm font-bold text-slate-700">{c.name}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-6 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Không tìm thấy khách hàng
                            </div>
                          )}
                       </div>
                     )}
                     
                     {selectedCustomer && (
                       <div className="mt-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1.5 animate-in fade-in">
                          <div className="flex items-center gap-2">
                             <Phone size={10} className="text-blue-500" />
                             <p className="text-[10px] font-bold text-slate-600 uppercase">{selectedCustomer.phone || 'N/A'}</p>
                          </div>
                          <div className="flex items-start gap-2">
                             <MapPin size={10} className="text-blue-500 mt-0.5" />
                             <p className="text-[10px] font-semibold text-slate-500 leading-relaxed uppercase">{selectedCustomer.address || 'N/A'}</p>
                          </div>
                       </div>
                     )}
                  </div>

                  {/* CONTRACT CODE */}
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Số hiệu Hợp đồng</label>
                     <div className="relative group">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input 
                        type="text" 
                        readOnly
                        value={contractCode}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed"
                        placeholder="Tự động..."
                       />
                     </div>
                  </div>

                  {/* DEADLINE */}
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Hạn giao hàng</label>
                     <div className="relative group">
                       <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                        type="date" 
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500/30 transition-all text-sm font-semibold text-slate-700"
                       />
                     </div>
                  </div>

                  {/* NOTES */}
                  <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Ghi chú & Điều khoản</label>
                     <textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Ghi chú yêu cầu riêng, vận chuyển..."
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500/30 transition-all text-sm font-medium h-20 resize-none text-slate-600"
                     />
                  </div>
               </div>
            </section>

            {/* ORDER ITEMS SECTION */}
            <section className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm relative z-20 space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <ShoppingCart size={14} className="text-blue-500" /> Danh sách sản phẩm
                  </h3>
                  <button 
                    onClick={addItem}
                    className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase transition-all hover:bg-slate-800 active:scale-95"
                  >
                    <Plus size={12} /> Thêm sản phẩm
                  </button>
               </div>

               {/* TABLE */}
               <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="border-b border-slate-100">
                           <th className="px-2 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sản phẩm</th>
                           <th className="px-2 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">SL</th>
                           <th className="px-2 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Giá vốn</th>
                           <th className="px-2 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest w-44">Giá Deal</th>
                           <th className="px-2 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest w-36">Thành tiền</th>
                           <th className="px-2 py-3 w-10"></th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {items.map((item) => {
                          const isLoss = item.dealPrice > 0 && item.dealPrice < item.cogs;
                          return (
                            <tr key={item.id} className="group hover:bg-slate-50/50">
                              <td className="px-2 py-4 min-w-[280px]">
                                  <ProductSelector 
                                    value={item.productId}
                                    onSelect={(pId) => handleProductSelect(item.id, pId)}
                                    products={products}
                                    onQuickCreate={() => {
                                      const idx = items.findIndex(i => i.id === item.id);
                                      setActiveItemIndex(idx);
                                      setIsProductModalOpen(true);
                                    }}
                                  />
                              </td>
                              <td className="px-2 py-4">
                                 <input 
                                  type="text" 
                                  inputMode="numeric"
                                  value={item.quantity === 0 ? '' : formatNumber(item.quantity)}
                                  placeholder="0"
                                  onChange={(e) => updateItem(item.id, 'quantity', parseNumber(e.target.value))}
                                  className="w-full h-10 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:bg-white transition-all shadow-sm" 
                                 />
                              </td>
                              <td className="px-1 py-4 text-right">
                                 <span className="text-[11px] font-bold text-slate-400 font-mono">
                                   {formatNumber(item.cogs)}đ
                                 </span>
                              </td>
                              <td className="px-2 py-4">
                                 <div className="flex flex-col items-end gap-1.5 relative group/deal-price">
                                    <input 
                                      type="text" 
                                      inputMode="numeric"
                                      value={item.dealPrice === 0 ? '' : formatNumber(item.dealPrice)}
                                      placeholder="0"
                                      onChange={(e) => updateItem(item.id, 'dealPrice', parseNumber(e.target.value))}
                                      className={cn(
                                        "w-full h-10 text-right px-3 bg-white border rounded-lg focus:outline-none focus:ring-4 text-xs font-bold transition-all shadow-sm",
                                        isLoss ? "border-rose-300 text-rose-600 focus:ring-rose-500/10" : "border-slate-200 text-slate-900 focus:ring-blue-500/10"
                                      )}
                                    />
                                    {isLoss && <span className="text-[8px] font-bold text-rose-500 uppercase flex items-center gap-1 animate-pulse"><AlertCircle size={10} /> ĐANG DƯỚI GIÁ VỐN</span>}
                                    <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
                                      {(item.wholesalePrice ?? 0) > 0 && (
                                        <button 
                                          type="button"
                                          onClick={() => updateItem(item.id, 'dealPrice', item.wholesalePrice ?? 0)}
                                          className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold hover:bg-slate-200"
                                        >
                                          Sỉ: {formatNumber(item.wholesalePrice)}
                                        </button>
                                      )}
                                      {(item.exportPrice ?? 0) > 0 && (
                                        <button 
                                          type="button"
                                          onClick={() => updateItem(item.id, 'dealPrice', item.exportPrice ?? 0)}
                                          className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold hover:bg-slate-200"
                                        >
                                          XK: {formatNumber(item.exportPrice)}
                                        </button>
                                      )}
                                    </div>
                                 </div>
                              </td>
                              <td className="px-2 py-4 text-right">
                                 <span className="text-xs font-bold text-slate-900 font-mono">
                                   {formatNumber(item.quantity * item.dealPrice)}đ
                                 </span>
                              </td>
                              <td className="px-2 py-4 text-center">
                                 <button 
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                 >
                                   <Trash2 size={16} />
                                 </button>
                              </td>
                            </tr>
                          );
                        })}
                     </tbody>
                  </table>
               </div>

               {/* MOBILE CARDS */}
               <div className="md:hidden space-y-4">
                  {items.map((item) => {
                    const isLoss = item.dealPrice > 0 && item.dealPrice < item.cogs;
                    return (
                    <div key={item.id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 relative">
                       <button 
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="absolute top-4 right-4 text-slate-300 hover:text-rose-500"
                       >
                         <Trash2 size={16} />
                       </button>

                       <div className="pr-8 space-y-1">
                          {item.sku && <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{item.sku}</span>}
                          <h4 className="text-xs font-bold text-slate-800 uppercase line-clamp-1">
                            {item.productName || 'Vui lòng chọn sản phẩm'}
                          </h4>
                       </div>

                       <ProductSelector 
                         value={item.productId}
                         onSelect={(pId) => handleProductSelect(item.id, pId)}
                         products={products}
                         onQuickCreate={() => {
                           const idx = items.findIndex(i => i.id === item.id);
                           setActiveItemIndex(idx);
                           setIsProductModalOpen(true);
                         }}
                       />
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Số lượng</p>
                             <input 
                              type="text" 
                              inputMode="numeric"
                              value={item.quantity === 0 ? '' : formatNumber(item.quantity)}
                              placeholder="0"
                              onChange={(e) => updateItem(item.id, 'quantity', parseNumber(e.target.value))}
                              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-bold shadow-sm"
                             />
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">Giá vốn</p>
                             <div className="h-10 flex items-center px-3 text-[11px] font-bold text-slate-400 font-mono">
                               {formatNumber(item.cogs)}đ
                             </div>
                          </div>
                          
                          <div className="col-span-2 space-y-1.5">
                             <div className="flex justify-between items-center px-1">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Giá Deal</p>
                                {isLoss && <span className="text-[9px] font-bold text-rose-500 uppercase flex items-center gap-1 animate-pulse"><AlertCircle size={10} /> Lỗ</span>}
                             </div>
                             <input 
                              type="text" 
                              inputMode="numeric"
                              value={item.dealPrice === 0 ? '' : formatNumber(item.dealPrice)}
                              placeholder="0"
                              onChange={(e) => updateItem(item.id, 'dealPrice', parseNumber(e.target.value))}
                              className={cn(
                                "w-full h-10 px-4 bg-white border rounded-xl text-xs font-bold shadow-sm",
                                isLoss ? "border-rose-300 text-rose-600" : "border-slate-200 text-slate-900"
                              )}
                             />
                          </div>
                       </div>

                        <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-white">
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Thành tiền</span>
                           <span className="text-sm font-black text-slate-900 font-mono">{formatNumber(item.quantity * item.dealPrice)}đ</span>
                        </div>
                    </div>
                    );
                  })}
               </div>

               {items.length === 0 && (
                 <div className="py-16 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
                      <ShoppingCart size={24} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đơn hàng trống</p>
                    <button onClick={addItem} className="text-blue-600 text-[10px] font-bold underline uppercase tracking-widest">Thêm sản phẩm đầu tiên</button>
                 </div>
               )}
            </section>
          </div>
        </div>

        {/* FOOTER SUMMARY */}
        <div className={cn(
          "shrink-0 border-t p-4 md:p-6 transition-colors shadow-2xl z-50",
          isNegativeMargin ? "bg-rose-600 border-rose-700" : "bg-white border-slate-100"
        )}>
           <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-8 md:gap-12 overflow-x-auto w-full hide-scrollbar px-2">
                <div className="flex flex-col shrink-0">
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest mb-1", isNegativeMargin ? "text-rose-100" : "text-slate-400")}>Tổng doanh thu</span>
                  <span className={cn("text-lg font-black tracking-tight", isNegativeMargin ? "text-white" : "text-slate-900")}>{formatNumber(totalRevenue)}đ</span>
                </div>
                <div className={cn("w-px h-8 shrink-0", isNegativeMargin ? "bg-rose-500" : "bg-slate-100")} />
                <div className="flex flex-col shrink-0">
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest mb-1", isNegativeMargin ? "text-rose-100" : "text-slate-400")}>Tổng giá vốn</span>
                  <span className={cn("text-lg font-black tracking-tight", isNegativeMargin ? "text-white" : "text-slate-900")}>{formatNumber(totalCOGS)}đ</span>
                </div>
                <div className={cn("w-px h-8 shrink-0", isNegativeMargin ? "bg-rose-500" : "bg-slate-100")} />
                <div className="flex flex-col shrink-0">
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest mb-1", isNegativeMargin ? "text-rose-100" : (totalProfit > 0 ? "text-emerald-500" : "text-rose-500"))}>Thặng dư dự kiến</span>
                  <span className={cn("text-xl font-black tracking-tight", isNegativeMargin ? "text-white" : (totalProfit > 0 ? "text-emerald-600" : "text-rose-600"))}>{formatNumber(totalRevenue - totalCOGS)}đ</span>
                </div>
             </div>
             
             <button 
               onClick={handleSubmit}
               disabled={isSubmitting || !canSubmit}
               className={cn(
                 "w-full md:w-auto px-10 py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 group shrink-0 active:scale-95",
                 isNegativeMargin 
                   ? "bg-white text-rose-600 hover:bg-slate-50 shadow-rose-900/20" 
                   : (canSubmit ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-200" : "bg-slate-200 text-slate-400 cursor-not-allowed")
               )}
             >
               {isSubmitting ? "Đang xử lý..." : "Chốt Đơn Hàng"}
               {!isSubmitting && <ChevronRight size={18} />}
             </button>
           </div>
        </div>

        {/* MANAGER LOCK MODAL */}
        {showManagerLock && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in">
             <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowManagerLock(false)} />
             <div className="relative bg-white w-full max-w-sm p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                   <Lock size={28} />
                </div>
                <h3 className="text-lg font-black text-slate-900 text-center uppercase tracking-tight mb-2">Manager Authorization</h3>
                <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest mb-8 leading-relaxed">Đơn hàng đang có mức giá bán thấp hơn giá vốn. Cần mã xác nhận từ quản lý.</p>
                
                <input 
                  type="password" 
                  placeholder="MẬT MÃ QUẢN LÝ"
                  value={managerPass}
                  onChange={(e) => setManagerPass(e.target.value)}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl mb-6 text-center text-xl font-bold tracking-[0.6em] focus:bg-white focus:border-rose-400 outline-none transition-all"
                />

                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => setShowManagerLock(false)}
                    className="py-3.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded-xl hover:bg-slate-200 transition-all"
                   >
                     Hủy
                   </button>
                   <button 
                    onClick={handleSubmit}
                    className="py-3.5 bg-slate-900 text-white text-[10px] font-bold uppercase rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                   >
                     Xác nhận
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* MOBILE SEARCH MODAL (CUSTOMER) */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-[120] bg-white animate-in slide-in-from-bottom-full duration-300 flex flex-col">
             <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                <button 
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="p-2 text-slate-400"
                >
                  <X size={24} />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" size={18} />
                  <input 
                    type="text"
                    autoFocus
                    placeholder="Tìm khách hàng..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      if (selectedCustomerId) setSelectedCustomerId('');
                    }}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-base font-bold outline-none"
                  />
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2">Kết quả tìm kiếm</p>
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map(c => (
                     <button
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-5 bg-slate-50 border border-slate-100 rounded-2xl active:bg-blue-50 transition-all flex justify-between items-center"
                     >
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">{c.customerCode || 'KH LẠ'}</span>
                           <h4 className="text-base font-bold text-slate-800">{c.name}</h4>
                           <p className="text-[10px] font-bold text-slate-400 mt-0.5">{c.phone || 'Chưa cập nhật SĐT'}</p>
                        </div>
                        <ChevronRight className="text-slate-300" size={20} />
                     </button>
                  ))
                ) : (
                  <div className="py-20 text-center text-slate-300 text-sm font-medium italic">Không có kết quả</div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
