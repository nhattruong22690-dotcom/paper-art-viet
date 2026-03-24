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

// Assuming ProductSelector is a component that will be created or exists elsewhere
interface ProductSelectorProps {
  value: string;
  onSelect: (productId: string) => void;
  products: Product[];
  onQuickCreate: () => void;
}

// Placeholder for ProductSelector component
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
        className="w-full h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-xl flex items-center justify-between cursor-pointer group hover:bg-white hover:border-primary-200 transition-all shadow-sm"
      >
        <div className="flex flex-col justify-center overflow-hidden">
          {selectedProduct ? (
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest leading-none mb-0.5">{selectedProduct.sku}</span>
              <span className="text-xs font-bold text-gray-800 line-clamp-1 truncate leading-tight">{selectedProduct.name}</span>
            </div>
          ) : (
            <span className="text-xs font-black text-gray-300 uppercase italic">Chọn sản phẩm...</span>
          )}
        </div>
        <ChevronDown size={14} className={cn("text-gray-300 transition-transform duration-300 shrink-0 ml-2", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-[300px]">
          <div className="p-3 bg-gray-50/50 border-b border-gray-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Mã SKU hoặc Tên sản phẩm..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none focus:border-primary-200 transition-all uppercase placeholder:text-gray-300"
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
                  className="w-full text-left px-5 py-3 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0 flex flex-col gap-0.5"
                >
                  <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest leading-none">{p.sku}</span>
                  <span className="text-xs font-bold text-gray-900 leading-tight block truncate">{p.name}</span>
                </button>
              ))
            ) : (
              <div className="p-8 text-center flex flex-col items-center gap-3">
                <Package size={32} className="text-gray-100" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Không tìm thấy sản phẩm</p>
                <button 
                  type="button"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onQuickCreate(); 
                    setIsOpen(false); 
                  }} 
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all shadow-sm shadow-primary-50/50"
                >
                  <Plus size={12} /> Tạo nhanh sản phẩm
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
  }, [customers]); // Dependencies to ensure it runs when customers are loaded

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
      
      // Kiểm tra BOM
      if (!details.bomItems || details.bomItems.length === 0) {
        showToast('warning', 'Sản phẩm này chưa được cấu hình BOM, không thể tính giá vốn');
      }

      const cogs = Number(details.costPrice || details.calculatedCogs || 0);
      const wholesalePrice = Number(details.wholesalePrice || 0);
      const exportPrice = Number(details.exportPrice || 0);
      
      // Validation warning
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
        // Nếu cập nhật Số lượng tổng, tự động đồng bộ vào phân bổ đầu tiên nếu chỉ có 1 phân bổ
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
        // Find current total allocated
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
      "fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0 transition-all duration-500",
      isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
    )}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
        onClick={handleClose}
      />
      
      {/* Container */}
      <div className="relative bg-[#fafafa] w-full h-full sm:h-[95vh] sm:max-w-7xl sm:rounded-[48px] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-500">
         {/* HEADER */}
         <div className="p-8 sm:p-10 border-b border-gray-100 bg-white flex justify-between items-center relative active:z-50 shrink-0">
           {/* ... existing header ... */}
           {/* Replace with existing header if needed, but I'll update the Save button */}
           {/* I'll just replace the whole footer/header if needed, but let's be strategic */}
           <div className="flex flex-col">
             <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight italic">Tạo Đơn hàng <span className="text-primary-600 underline">Mới</span></h2>
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Hệ thống Paper Art Viet ERP</p>
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={cn(
                  "flex items-center gap-3 px-10 py-4 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 group",
                  canSubmit 
                    ? "bg-primary-600 text-white shadow-primary-200 hover:bg-primary-500" 
                    : "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed opacity-60"
                )}
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {!canSubmit && <Lock size={14} className="opacity-50" />}
                    Lưu Hợp đồng <Check size={16} />
                  </>
                )}
              </button>
              <button onClick={handleClose} className="p-4 bg-gray-50 hover:bg-rose-50 rounded-2xl text-gray-400 hover:text-rose-500 transition-all">
                <X size={24} />
              </button>
           </div>
         </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-8 pb-24 md:pb-12">
<section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
               <Users size={14} className="text-primary-600" /> Thông tin hợp đồng
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CUSTOMER SEARCHABLE COMBOBOX */}
                <div className="space-y-2 relative" ref={comboboxRef}>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tìm Khách hàng</label>
                   <div className="relative group">
                     <Search className={cn(
                       "absolute left-4 top-1/2 -translate-y-1/2 transition-colors",
                       isComboboxOpen ? "text-primary-600" : "text-gray-400"
                     )} size={18} />
                     <input 
                      type="text"
                      placeholder="Gõ tên hoặc mã khách hàng..."
                      value={customerSearch}
                      onFocus={() => {
                        setIsComboboxOpen(true);
                        // Trigger mobile modal on small screens
                        if (window.innerWidth < 768) setIsMobileSearchOpen(true);
                      }}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        if (selectedCustomerId) setSelectedCustomerId('');
                        setIsComboboxOpen(true);
                      }}
                      className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all text-sm font-bold uppercase tracking-tight placeholder:text-gray-300"
                     />
                     {customerSearch && (
                       <button 
                        onClick={() => { setSelectedCustomerId(''); setCustomerSearch(''); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 transition-colors"
                       >
                         <X size={16} />
                       </button>
                     )}
                   </div>

                   {/* Dropdown Suggestions */}
                   {isComboboxOpen && !isMobileSearchOpen && (
                     <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        {filteredCustomers.length > 0 ? (
                          <div className="max-h-60 overflow-y-auto">
                            {filteredCustomers.map(c => (
                              <button
                                key={c.id}
                                onClick={() => handleSelectCustomer(c)}
                                className="w-full text-left px-6 py-4 hover:bg-primary-50 transition-colors border-b border-gray-50 last:border-0"
                              >
                                <div className="flex items-center justify-between">
                                   <div className="flex flex-col">
                                      <span className="text-xs font-black text-primary-600 uppercase tracking-widest">{c.customerCode || 'UNSET'}</span>
                                      <span className="text-sm font-bold text-gray-900">{c.name}</span>
                                   </div>
                                   <ChevronRight size={14} className="text-gray-300" />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Không tìm thấy khách hàng</p>
                          </div>
                        )}
                     </div>
                   )}

                   {/* Auto-filled details */}
                   {selectedCustomer && (
                     <div className="mt-4 p-5 bg-primary-50/50 border border-primary-100 rounded-2xl space-y-2 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-3">
                           <Phone size={12} className="text-primary-500" />
                           <p className="text-[11px] font-black text-primary-950 uppercase tracking-tight">Liên hệ: {selectedCustomer.phone || 'N/A'}</p>
                        </div>
                        <div className="flex items-start gap-3">
                           <MapPin size={12} className="text-primary-500 mt-0.5" />
                           <p className="text-[11px] font-bold text-gray-500 leading-relaxed uppercase">{selectedCustomer.address || 'N/A'}</p>
                        </div>
                     </div>
                   )}
                </div>

                {/* CONTRACT CODE (AUTO) */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mã Hợp đồng (Tự động)</label>
                   <div className="relative group">
                     <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                     <input 
                      type="text" 
                      readOnly
                      value={contractCode}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50/30 border border-gray-100 rounded-2xl text-sm font-black text-primary-600 uppercase italic cursor-not-allowed"
                      placeholder="Hệ thống tự ghép mã..."
                     />
                   </div>
                </div>

                {/* DEADLINE */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Hạn giao hàng dự kiến</label>
                   <div className="relative group">
                     <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={18} />
                     <input 
                      type="date" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all text-sm font-bold"
                     />
                   </div>
                </div>

                {/* NOTES (FULL WIDTH IN GRID) */}
                <div className="md:col-span-2 space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ghi chú Hợp đồng (Đóng gói, Vận chuyển...)</label>
                   <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Nhập ghi chú hoặc yêu cầu riêng của khách..."
                    className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:bg-white transition-all text-sm font-medium h-24 resize-none"
                   />
                </div>
             </div>
          </section>

          {/* ORDER ITEMS */}
          <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm relative z-20">
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                   <ShoppingCart size={14} className="text-primary-600" /> Danh sách sản phẩm
                </h3>
                <button 
                  onClick={addItem}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-600 hover:text-white transition-all active:scale-95"
                >
                  <Plus size={14} /> Thêm dòng
                </button>
             </div>

             {/* DESKTOP TABLE */}
             <div className="hidden md:block relative">
                <table className="w-full border-collapse">
                   <thead>
                      <tr className="border-b border-gray-100">
                         <th className="px-3 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Sản phẩm</th>
                         <th className="px-3 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest w-28">Số lượng</th>
                         <th className="px-3 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Giá vốn</th>
                         <th className="px-3 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest w-40">Giá Deal</th>
                         <th className="px-3 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest w-40">Thành tiền</th>
                         <th className="px-3 py-4 w-10"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {items.map((item) => {
                        const isLoss = item.dealPrice > 0 && item.dealPrice < item.cogs;
                        return (
                          <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-3 py-3 min-w-[300px]">
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
                            <td className="px-3 py-3">
                               <input 
                                type="text" 
                                inputMode="numeric"
                                value={item.quantity === 0 ? '' : formatNumber(item.quantity)}
                                placeholder="0"
                                onChange={(e) => updateItem(item.id, 'quantity', parseNumber(e.target.value))}
                                className="w-full h-11 text-center bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-xs font-black text-gray-900 shadow-sm" 
                               />
                            </td>
                            <td className="px-3 py-3 text-right">
                               <span className="text-xs font-black text-gray-900 font-mono whitespace-nowrap">
                                 {formatNumber(item.cogs)}đ
                               </span>
                            </td>
                            <td className="px-3 py-3">
                               <div className="flex flex-col items-end gap-2 text-right relative group/deal-price">
                                  <input 
                                    type="text" 
                                    inputMode="numeric"
                                    value={item.dealPrice === 0 ? '' : formatNumber(item.dealPrice)}
                                    placeholder="0"
                                    onChange={(e) => updateItem(item.id, 'dealPrice', parseNumber(e.target.value))}
                                    className={cn(
                                      "w-full h-11 text-right px-4 bg-white border rounded-xl focus:outline-none focus:ring-2 text-sm font-black transition-all relative z-10 shadow-sm",
                                      isLoss ? "border-rose-300 text-rose-600 focus:ring-rose-500/20 bg-rose-50/50" : "border-gray-200 text-gray-900 focus:ring-primary-500/20"
                                    )}
                                  />
                                  {isLoss && <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1 justify-end absolute left-0 -bottom-5 right-0 animate-pulse"><AlertCircle size={10} /> Giá bán đang lỗ</span>}
                                  <div className="flex gap-1 mt-1">
                                    {(item.wholesalePrice ?? 0) > 0 && (
                                      <button 
                                        type="button"
                                        onClick={() => updateItem(item.id, 'dealPrice', item.wholesalePrice ?? 0)}
                                        className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black hover:bg-amber-100 transition-colors border border-amber-100/50"
                                      >
                                        Sỉ: {formatNumber(item.wholesalePrice)}
                                      </button>
                                    )}
                                    {(item.exportPrice ?? 0) > 0 && (
                                      <button 
                                        type="button"
                                        onClick={() => updateItem(item.id, 'dealPrice', item.exportPrice ?? 0)}
                                        className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black hover:bg-emerald-100 transition-colors border border-emerald-100/50"
                                      >
                                        XK: {formatNumber(item.exportPrice)}
                                      </button>
                                    )}
                                  </div>
                               </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                               <span className="text-sm font-black text-gray-900 font-mono whitespace-nowrap">
                                 {formatNumber(item.quantity * item.dealPrice)}đ
                               </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                               <button 
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-2 text-gray-300 hover:text-rose-500 transition-colors"
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
                {items.map((item, idx) => {
                  const isLoss = item.dealPrice > 0 && item.dealPrice < item.cogs;
                  return (
                  <div key={item.id} className="p-5 bg-white border border-gray-100 rounded-[32px] shadow-sm relative z-10 group">
                     {/* Remove Button */}
                     <button 
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="absolute top-4 right-4 p-2 text-gray-300 hover:text-rose-500 transition-colors"
                     >
                       <Trash2 size={16} />
                     </button>

                     {/* Item Info */}
                     <div className="mb-4 pr-8">
                        {item.sku && <span className="text-[9px] font-black text-primary-600 uppercase tracking-widest block mb-0.5">{item.sku}</span>}
                        <h4 className="text-xs font-black text-gray-800 uppercase leading-tight line-clamp-1">
                          {item.productName || 'Chọn sản phẩm...'}
                        </h4>
                     </div>

                     {/* Selector */}
                     <div className="mb-4">
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
                     </div>
                     
                     {/* Grid Inputs */}
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Số lượng</p>
                           <input 
                            type="text" 
                            inputMode="numeric"
                            value={item.quantity === 0 ? '' : formatNumber(item.quantity)}
                            placeholder="0"
                            onChange={(e) => updateItem(item.id, 'quantity', parseNumber(e.target.value))}
                            className="w-full h-11 px-4 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-black focus:bg-white transition-all shadow-sm"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Giá vốn (BOM)</p>
                           <div className="h-11 flex items-center px-4 bg-gray-50/10 border border-transparent rounded-xl">
                             <span className="text-xs font-black text-[#333] font-mono">{formatNumber(item.cogs)}đ</span>
                           </div>
                        </div>
                        
                        <div className="space-y-1.5 relative group/deal-price col-span-2">
                           <div className="flex justify-between items-center px-1">
                              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Giá Deal</p>
                              {isLoss && <span className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1 animate-pulse"><AlertCircle size={10} /> Lỗ</span>}
                           </div>
                           <input 
                            type="text" 
                            inputMode="numeric"
                            value={item.dealPrice === 0 ? '' : formatNumber(item.dealPrice)}
                            placeholder="0"
                            onChange={(e) => updateItem(item.id, 'dealPrice', parseNumber(e.target.value))}
                            className={cn(
                              "w-full h-11 px-4 bg-white border rounded-xl text-sm font-black focus:outline-none focus:ring-2 relative z-10 shadow-sm",
                              isLoss ? "border-rose-300 text-rose-600 focus:ring-rose-500/20 bg-rose-50/50" : "border-gray-200 text-gray-900 focus:ring-primary-500/20"
                            )}
                           />
                           
                           {item.wholesalePrice && item.exportPrice && (
                              <div className="absolute top-[3.75rem] left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-50 opacity-0 invisible group-focus-within/deal-price:opacity-100 group-focus-within/deal-price:visible translate-y-2 group-focus-within/deal-price:translate-y-0 transition-all duration-200 overflow-hidden">
                                <div className="p-2 space-y-1">
                                  <div className="px-3 pt-2 pb-1 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Gợi ý Mức giá</div>
                                  <button 
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); updateItem(item.id, 'dealPrice', item.wholesalePrice); }}
                                    className="w-full text-left px-4 py-3 text-xs hover:bg-amber-50 rounded-xl flex justify-between items-center text-amber-700 font-black"
                                  >
                                    <span>Giá Sỉ</span>
                                    <span className="font-mono">{formatNumber(item.wholesalePrice)}đ</span>
                                  </button>
                                  <button 
                                    type="button"
                                    onMouseDown={(e) => { e.preventDefault(); updateItem(item.id, 'dealPrice', item.exportPrice); }}
                                    className="w-full text-left px-4 py-3 text-xs hover:bg-emerald-50 rounded-xl flex justify-between items-center text-emerald-700 font-black"
                                  >
                                    <span>XK / Phân Phối</span>
                                    <span className="font-mono">{formatNumber(item.exportPrice)}đ</span>
                                  </button>
                                </div>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Total Footer */}
                      <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Thành tiền</span>
                         <span className="text-sm font-black text-gray-900 font-mono tracking-tight">{formatNumber(item.quantity * item.dealPrice)}đ</span>
                      </div>

                      {/* MOBILE ALLOCATIONS */}
                      {item.productId && (
                        <div className="mt-4 pt-4 border-t border-gray-50 space-y-4">
                            <div className="flex justify-between items-center px-1">
                               <p className="text-[9px] font-black text-primary-600 uppercase tracking-widest italic">Phân bổ sản xuất</p>
                               <button 
                                 type="button"
                                 onClick={() => addAllocation(item.id)}
                                 className="text-[9px] font-black text-primary-500 hover:text-primary-700 uppercase tracking-tight flex items-center gap-1"
                               >
                                 <Plus size={10} /> Chia nhỏ
                               </button>
                            </div>
                            
                            {item.allocations.map((alloc) => (
                              <div key={alloc.id} className="space-y-2 p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                                 <div className="flex items-center justify-between gap-2">
                                    <select 
                                      value={alloc.type}
                                      onChange={(e) => updateAllocation(item.id, alloc.id, 'type', e.target.value)}
                                      className="text-[10px] font-bold bg-white border border-gray-100 rounded-lg px-2 py-2 focus:outline-none"
                                    >
                                      <option value="internal">Xưởng</option>
                                      <option value="outsourced">Gia công</option>
                                    </select>
                                    
                                    <div className="flex items-center gap-2">
                                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">SL:</span>
                                       <input 
                                          type="text"
                                          inputMode="numeric"
                                          value={alloc.quantity === 0 ? '' : formatNumber(alloc.quantity)}
                                          onChange={(e) => updateAllocation(item.id, alloc.id, 'quantity', parseNumber(e.target.value))}
                                          className="w-20 text-[10px] font-black bg-white border border-gray-100 rounded-lg px-2 py-2 text-center"
                                       />
                                       {item.allocations.length > 1 && (
                                         <button 
                                           type="button"
                                           onClick={() => removeAllocation(item.id, alloc.id)}
                                           className="p-1 text-gray-300 hover:text-rose-500"
                                         >
                                           <Minus size={14} />
                                         </button>
                                       )}
                                    </div>
                                 </div>
                                 
                                 {alloc.type === 'outsourced' && (
                                   <input 
                                      type="text"
                                      placeholder="Tên người nhận (Gia công)..."
                                      value={alloc.outsourcedName || ''}
                                      onChange={(e) => updateAllocation(item.id, alloc.id, 'outsourcedName', e.target.value)}
                                      className="w-full text-[10px] font-bold bg-white border border-gray-100 rounded-lg px-3 py-2"
                                   />
                                 )}
                              </div>
                            ))}
                            
                            {/* Validation Warning Mobile */}
                            {item.allocations.reduce((sum, a) => sum + a.quantity, 0) !== item.quantity && (
                              <div className="flex items-center gap-1.5 px-1 text-[9px] font-black text-rose-500 animate-pulse">
                                <AlertCircle size={10} /> Phân bổ ({formatNumber(item.allocations.reduce((sum, a) => sum + a.quantity, 0))}) chưa khớp ({formatNumber(item.quantity)})
                              </div>
                            )}
                        </div>
                      )}
                  </div>
                  );
                })}
             </div>

             {items.length === 0 && (
               <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                    <ShoppingCart size={32} />
                  </div>
                  <p className="text-xs font-bold text-gray-300 uppercase italic">Chưa có sản phẩm nào trong đơn hàng</p>
                  <button onClick={addItem} className="text-primary-600 text-[10px] font-black uppercase hover:underline">Thêm sản phẩm ngay</button>
               </div>
             )}
          </section>
        </div>
      </div>
    </div>

{/* MODAL FOOTER SUMMARY */}
        <div className={cn(
          "flex-shrink-0 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-colors duration-500 border-t",
          isNegativeMargin ? "bg-rose-600 border-rose-700" : "bg-white border-gray-100"
        )}>
           <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
             {/* Summary Stats */}
             <div className="flex flex-1 items-center gap-6 overflow-x-auto w-full hide-scrollbar">
                <div className="flex flex-col flex-shrink-0">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", isNegativeMargin ? "text-rose-200" : "text-gray-400")}>Tổng doanh thu</span>
                  <span className={cn("text-lg font-black", isNegativeMargin ? "text-white" : "text-gray-900")}>{formatNumber(totalRevenue)}đ</span>
                </div>
                <div className={cn("hidden sm:block w-px h-8", isNegativeMargin ? "bg-rose-500" : "bg-gray-200")} />
                <div className="flex flex-col flex-shrink-0">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", isNegativeMargin ? "text-rose-200" : "text-gray-400")}>Tổng Giá Vốn (COGS)</span>
                  <span className={cn("text-lg font-black", isNegativeMargin ? "text-rose-200" : "text-rose-500")}>-{formatNumber(totalCOGS)}đ</span>
                </div>
                <div className={cn("hidden sm:block w-px h-8", isNegativeMargin ? "bg-rose-500" : "bg-gray-200")} />
                <div className="flex flex-col flex-shrink-0">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", isNegativeMargin ? "text-white" : "text-primary-600")}>Lợi nhuận gộp</span>
                  <span className={cn("text-xl font-black", isNegativeMargin ? "text-white" : (totalProfit > 0 ? "text-emerald-500" : "text-rose-500"))}>{formatNumber(totalRevenue - totalCOGS)}đ</span>
                </div>
             </div>
             
             {/* Action Buttons */}
             <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button 
                 onClick={handleSubmit}
                 disabled={isSubmitting}
                 className={cn(
                   "w-full md:w-auto px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 flex-shrink-0",
                   isNegativeMargin ? "bg-white text-rose-600 hover:bg-rose-50 shadow-rose-900/20" : "bg-gray-900 text-white hover:bg-black shadow-gray-900/20"
                 )}
                >
                  {isSubmitting ? "Syste Processing..." : "Khởi tạo & Chốt giá BOM"}
                  {!isSubmitting && <ChevronRight size={16} />}
                </button>
             </div>
           </div>
        </div>

        {/* MOBILE SEARCH MODAL */}
        {isMobileSearchOpen && (
          <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom-full duration-300">
             <div className="flex items-center gap-4 p-6 border-b border-gray-50">
                <button 
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="p-2 text-gray-400"
                >
                  <ChevronRight className="rotate-180" size={24} />
                </button>
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-600" size={18} />
                  <input 
                    type="text"
                    autoFocus
                    placeholder="Tìm khách hàng..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      if (selectedCustomerId) setSelectedCustomerId('');
                    }}
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-base font-bold outline-none"
                  />
                </div>
             </div>
             <div className="overflow-y-auto h-[calc(100vh-100px)] p-6">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Kết quả tìm kiếm</p>
                <div className="space-y-2">
                  {filteredCustomers.map(c => (
                     <button
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="w-full text-left p-6 bg-gray-50/50 border border-gray-100 rounded-[28px] active:bg-primary-50 active:border-primary-200 transition-all"
                     >
                       <div className="flex justify-between items-center">
                          <div className="space-y-1">
                             <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{c.customerCode || 'UNSET'}</span>
                             <h4 className="text-base font-black text-blue-950 uppercase">{c.name}</h4>
                             <p className="text-[10px] font-bold text-gray-400 uppercase">{c.phone || 'Chưa cập nhật SĐT'}</p>
                          </div>
                          <ChevronDown className="-rotate-90 text-gray-300" size={20} />
                       </div>
                     </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="py-20 text-center text-gray-300 italic font-medium">Không tìm thấy khách hàng nào</div>
                  )}
                </div>
             </div>
          </div>
        )}

                {showManagerLock && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in">
             <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-xl" onClick={() => setShowManagerLock(false)} />
             <div className="relative bg-white w-full max-w-md p-10 rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
                   <Lock size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 text-center uppercase tracking-tight italic mb-2">Manager Authorization</h3>
                <p className="text-xs text-gray-400 text-center font-bold uppercase tracking-widest mb-8">Giá bán thấp hơn giá vốn. Vui lòng nhập mã phê duyệt.</p>
                
                <input 
                  type="password" 
                  placeholder="Manager Override Code"
                  value={managerPass}
                  onChange={(e) => setManagerPass(e.target.value)}
                  className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl mb-6 text-center text-lg font-black tracking-[1em]"
                />

                <div className="flex gap-4">
                   <button 
                    onClick={() => setShowManagerLock(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-400 text-[11px] font-black uppercase rounded-2xl hover:bg-gray-100 transition-all font-mono"
                   >
                     Cancel
                   </button>
                   <button 
                    onClick={handleSubmit}
                    className="flex-1 py-4 bg-gray-900 text-white text-[11px] font-black uppercase rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-gray-200"
                   >
                     Authorize
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
