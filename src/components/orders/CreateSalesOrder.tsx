"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import ProductFormModal from '@/components/production/ProductFormModal';
import { upsertProduct } from '@/services/product.service';
import { useNotification } from "@/context/NotificationContext";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Trash2, 
  X, 
  ChevronRight, 
  ChevronDown, 
  ShoppingCart,
  Calendar,
  Lock,
  Check,
  Package,
  ArrowUpRight,
  Loader2,
  Calculator,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { getMilestoneTemplate } from '@/services/systemConfig.service';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility for thousand separator and decimal handling
function formatNumber(val: number | string | undefined | null, currency: string = 'VND') {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(/,/g, '')) : val;
  if (isNaN(num)) return val.toString();
  
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(num);
  }
  
  return new Intl.NumberFormat('vi-VN').format(num);
}

// Utility to parse formatted number (supports decimals)
function parseNumber(val: string): number {
  if (!val) return 0;
  // Remove thousand separators but keep the decimal point
  // Standardizing: remove all non-digits except first dot/comma
  const cleanVal = val.replace(/,/g, '.'); // Convert all commas to dots
  const parts = cleanVal.split('.');
  if (parts.length > 2) {
    // If multiple dots, keep only the first one as decimal point
    return parseFloat(parts[0] + '.' + parts.slice(1).join('')) || 0;
  }
  return parseFloat(cleanVal) || 0;
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
  unit: string;
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
    if (!searchTerm) return list.slice(0, 50);
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
        className="w-full h-14 px-4 bg-white border-2 border-black rounded-xl flex items-center justify-between cursor-pointer group hover:bg-neo-purple/5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
      >
        <div className="flex flex-col justify-center overflow-hidden">
          {selectedProduct ? (
            <div className="flex flex-col">
              <span className="text-[0.5625rem] font-black text-black/60 uppercase tracking-widest leading-none mb-1">{selectedProduct.sku}</span>
              <span className="text-sm font-black text-black italic truncate">{selectedProduct.name}</span>
            </div>
          ) : (
            <span className="text-xs font-black text-black/40 italic uppercase tracking-widest">Chọn sản phẩm...</span>
          )}
        </div>
        <ChevronDown size={18} className={cn("text-black transition-transform duration-300", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-black rounded-xl shadow-neo z-[999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 min-w-[300px]">
          <div className="p-4 bg-black/5 border-b-2 border-black">
            <div className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" />
              <input
                type="text"
                autoFocus
                placeholder="Tìm sản phẩm..."
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-black rounded-xl text-xs font-black outline-none focus:bg-neo-purple/5 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { 
                    onSelect(p.id); 
                    setIsOpen(false); 
                    setSearchTerm(''); 
                  }}
                  className="w-full text-left px-6 py-4 hover:bg-neo-purple/5 transition-colors border-b-2 border-black/5 last:border-0 flex flex-col gap-1"
                >
                  <span className="text-[0.5625rem] font-black text-black/60 uppercase tracking-widest leading-none">{p.sku}</span>
                  <span className="text-xs font-black text-black italic leading-tight block truncate">{p.name}</span>
                </button>
              ))
            ) : (
              <div className="p-10 text-center flex flex-col items-center gap-4">
                <p className="text-[0.625rem] font-black text-black/20 uppercase tracking-widest">Không tìm thấy</p>
                <button 
                  type="button"
                  onClick={onQuickCreate} 
                  className="btn-secondary !h-10 !px-6 text-[0.625rem]"
                >
                  <Plus size={14} /> Tạo nhanh
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


const CurrencySelector: React.FC<{ value: string, onChange: (val: string) => void }> = ({ value, onChange }) => {
  return (
    <div className="flex bg-white border-2 border-black rounded-xl overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
      <button
        type="button"
        onClick={() => onChange('VND')}
        className={cn(
          "flex-1 px-4 py-2 text-[0.625rem] font-black transition-all",
          value === 'VND' ? "bg-black text-white" : "text-black hover:bg-black/5"
        )}
      >
        VND
      </button>
      <button
        type="button"
        onClick={() => onChange('USD')}
        className={cn(
          "flex-1 px-4 py-2 text-[0.625rem] font-black transition-all",
          value === 'USD' ? "bg-black text-white" : "text-black hover:bg-black/5"
        )}
      >
        USD
      </button>
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
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [milestones, setMilestones] = useState<{id: string, label: string, deadline: string, isCompleted: boolean, completedAt?: string | null}[]>([]);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('VND');
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

  const [customerSearch, setCustomerSearch] = useState('');
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

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

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedCustomer(null);
    setContractCode('');
    setIsDuplicate(false);
    setDeadline('');
    setMilestones([]);
    setNotes('');
    setCurrency('VND');
    setItems([]);
    setCustomerSearch('');
    setManagerPass('');
    setIsSubmitting(false);
    setShowManagerLock(false);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Lock scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId);
      setSelectedCustomer(customer || null);
      if (customer) {
        setCustomerSearch(`${customer.customerCode || '??'} - ${customer.name}`);
      }
    } else {
      setSelectedCustomer(null);
      setContractCode('');
      setCustomerSearch('');
    }
  }, [selectedCustomerId, customers]);

  // Kiểm tra trùng mã hợp đồng
  useEffect(() => {
    if (!contractCode.trim()) {
      setIsDuplicate(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingCode(true);
      try {
        const res = await fetch(`/api/orders/check-duplicate?code=${encodeURIComponent(contractCode.trim())}`);
        const data = await res.json();
        setIsDuplicate(data.isDuplicate);
      } catch (error) {
        console.error('Lỗi kiểm tra trùng mã:', error);
      } finally {
        setIsCheckingCode(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [contractCode]);

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
      
      const cogs = Number(details.costPrice || details.calculatedCogs || 0);
      const wholesalePrice = Number(details.wholesalePrice || 0);
      const exportPrice = Number(details.exportPrice || 0);
      const defaultDealPrice = wholesalePrice > 0 ? wholesalePrice : Number(details.basePrice || 0);

      setItems(prev => prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            productId: details.id,
            sku: details.sku,
            productName: details.name,
            unit: details.unit || 'Cái',
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
      unit: 'Cái',
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

  const addMilestone = () => {
    setMilestones([...milestones, { 
      id: Math.random().toString(36).substr(2, 9), 
      label: '', 
      deadline: '', 
      isCompleted: false 
    }]);
  };

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id));
  };

  const updateMilestone = (id: string, field: string, value: any) => {
    setMilestones(milestones.map(m => m.id === id ? { ...m, [field]: value } : m));
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

  const loadDefaultMilestones = async () => {
    try {
      const template = await getMilestoneTemplate();
      if (!template || !Array.isArray(template) || template.length === 0) {
        showToast('error', 'Chưa có cấu hình thời hạn mặc định trong Cài đặt');
        return;
      }

      const newMilestones = template.map(item => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        label: item.label,
        deadline: '',
        isCompleted: false
      }));

      setMilestones(newMilestones);
      showToast('success', `Đã tải ${newMilestones.length} công đoạn mặc định`);
    } catch (err) {
      console.error(err);
      showToast('error', 'Lỗi khi tải dữ liệu mặc định');
    }
  };

  const totalRevenue = items.reduce((sum, item) => sum + (item.quantity * item.dealPrice), 0);
  const totalCOGS = items.reduce((sum, item) => sum + (item.quantity * item.cogs), 0);
  const totalProfit = totalRevenue - totalCOGS;
  const isNegativeMargin = items.some(item => item.dealPrice > 500 && item.dealPrice < item.cogs);

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
          contractCode: contractCode.trim(),
          deadlineDelivery: deadline,
          currency: currency,
          estimated_stages: milestones.filter(m => m.label.trim()), // Chỉ gửi những khâu có tên
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
        showToast('success', `Đã tạo đơn hàng thành công!`);
        onSuccess();
        onClose();
      } else {
        showModal('error', 'Không thể tạo đơn hàng.', data.error);
      }
    } catch (e) {
      showModal('error', 'Lỗi kết nối hệ thống.', String(e));
    } finally {
      setIsSubmitting(false);
      setShowManagerLock(false);
    }
  };

  const canSubmit = selectedCustomerId && items.length > 0 && deadline && contractCode.trim() && !isDuplicate && !isSubmitting;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleClose} />
      
      <div className="relative bg-white w-full h-full sm:h-[95vh] sm:max-w-7xl sm:rounded-xl shadow-neo border-neo border-black overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
         
         {/* HEADER */}
         <div className="p-6 md:p-8 border-b-neo border-black bg-neo-purple/10 flex justify-between items-center relative z-50 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                 <ShoppingCart size={24} className="text-black" />
              </div>
              <div>
                <h2 className="text-[clamp(1.2rem,4vw,2rem)] font-black text-black tracking-tight uppercase italic leading-tight">Tạo Đơn Hàng Mới</h2>
                <p className="text-[0.625rem] text-black/40 font-black uppercase tracking-[0.2em] mt-1 italic">Hệ thống quản trị Paper Art Việt</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <button 
                 onClick={handleSubmit}
                 disabled={!canSubmit}
                 className={cn(
                   "btn-primary btn-confirm-flash h-12 px-8 text-xs uppercase tracking-widest",
                   !canSubmit && "opacity-50 cursor-not-allowed"
                 )}
               >
                 {isSubmitting ? (
                   <Loader2 size={18} className="animate-spin" />
                 ) : (
                   <>
                     {!canSubmit && <Lock size={14} className="opacity-50" />}
                     Xác nhận Đơn hàng <Check size={18} strokeWidth={3} />
                   </>
                 )}
               </button>
               <button onClick={handleClose} className="w-12 h-12 border-2 border-black rounded-xl flex items-center justify-center text-black/40 hover:text-black hover:bg-neo-red transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none bg-white">
                 <X size={24} strokeWidth={2.5} />
               </button>
            </div>
          </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 bg-slate-50/50 overscroll-contain">
          <div className="max-w-6xl mx-auto space-y-10 pb-20">
            
            {/* CUSTOMER SECTION */}
            <section className="p-8 bg-white border-neo border-black rounded-xl shadow-neo space-y-10">
               <div className="flex items-center gap-3">
                  <h3 className="text-[0.6875rem] font-black text-black/40 uppercase tracking-[0.3em]">Thông tin khách hàng & Hợp đồng</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-3 relative" ref={comboboxRef}>
                     <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest ml-1">Tìm khách hàng</label>
                     <div className="relative group/field">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={20} />
                       <input 
                        type="text"
                        placeholder="Tên hoặc mã KH..."
                        value={customerSearch}
                        onFocus={() => setIsComboboxOpen(true)}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          if (selectedCustomerId) setSelectedCustomerId('');
                          setIsComboboxOpen(true);
                        }}
                        className="form-input pl-12 h-14"
                       />
                     </div>

                     {isComboboxOpen && (
                       <div className="absolute top-full left-0 w-full mt-2 bg-white border-2 border-black rounded-xl shadow-neo z-[100] overflow-hidden">
                          {filteredCustomers.length > 0 ? (
                            <div className="max-h-64 overflow-y-auto">
                              {filteredCustomers.map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => handleSelectCustomer(c)}
                                  className="w-full text-left px-6 py-4 hover:bg-neo-purple/5 transition-colors border-b-2 border-black/5 last:border-0"
                                >
                                  <div className="flex flex-col">
                                     <span className="text-[0.5625rem] font-black text-black/60 uppercase tracking-widest leading-none mb-1">{c.customerCode || 'KH LẠ'}</span>
                                     <span className="text-sm font-black text-black italic">{c.name}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-10 text-center text-black/20 text-[0.625rem] font-black uppercase">Không có kết quả</div>
                          )}
                       </div>
                     )}
                     
                     {selectedCustomer && (
                       <div className="mt-4 p-5 bg-neo-purple/5 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-3 animate-in fade-in italic">
                          <div className="flex items-center gap-3">
                             <Phone size={14} className="text-black" />
                             <p className="text-[0.6875rem] font-black text-black tabular-nums">{selectedCustomer.phone || 'N/A'}</p>
                          </div>
                          <div className="flex items-start gap-3">
                             <MapPin size={14} className="text-black mt-0.5" />
                             <p className="text-[0.6875rem] font-black text-black/60 leading-relaxed uppercase">{selectedCustomer.address || 'N/A'}</p>
                          </div>
                       </div>
                     )}
                  </div>

                  <div className="space-y-3">
                     <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest ml-1">Số hợp đồng</label>
                     <div className="relative group/field">
                       <input 
                        type="text" 
                        value={contractCode}
                        onChange={(e) => setContractCode(e.target.value)}
                        className={cn(
                          "form-input h-14 font-black tracking-widest text-center",
                          isDuplicate ? "border-neo-red bg-neo-red/5" : ""
                        )}
                        placeholder="Nhập số hợp đồng..."
                       />
                       {isCheckingCode && (
                         <div className="absolute right-4 top-1/2 -translate-y-1/2">
                           <Loader2 size={16} className="animate-spin text-black/20" />
                         </div>
                       )}
                     </div>
                     {isDuplicate && (
                       <div className="flex items-center gap-2 text-neo-red animate-in fade-in slide-in-from-top-1">
                         <AlertCircle size={12} />
                         <span className="text-[0.5625rem] font-black uppercase italic">Số hợp đồng này đã tồn tại!</span>
                       </div>
                     )}
                  </div>

                  <div className="space-y-3">
                     <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest ml-1">Hạn giao hàng</label>
                     <input 
                      type="date" 
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="form-input h-14 font-black"
                     />
                  </div>
                   <div className="space-y-3">
                      <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest ml-1">Đơn vị tiền tệ</label>
                      <CurrencySelector value={currency} onChange={setCurrency} />
                   </div>
               </div>
            </section>

            {/* ORDER ITEMS SECTION */}
            <section className="p-8 bg-white border-neo border-black rounded-xl shadow-neo space-y-8">
               <div className="flex justify-between items-center bg-neo-purple/5 p-4 rounded-xl border-2 border-black border-dashed">
                  <div className="flex items-center gap-3">
                     <ShoppingCart size={18} className="text-black" />
                     <h3 className="text-[0.6875rem] font-black text-black/40 uppercase tracking-[0.3em]">Danh sách sản phẩm</h3>
                  </div>
                  <button 
                    onClick={addItem}
                    className="btn-secondary !h-10 !px-6 text-[0.625rem]"
                  >
                    <Plus size={14} strokeWidth={2.5} /> Thêm sản phẩm
                  </button>
               </div>

               <div className="space-y-6">
                 {items.map((item, idx) => {
                   const isLoss = item.dealPrice > 500 && item.dealPrice < item.cogs;
                   return (
                     <div key={item.id} className="relative bg-white border-neo border-black rounded-xl shadow-neo group transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-active">
                        {/* DELETION BANNER/ACTION */}
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center bg-white border-b-neo border-l-neo border-black text-black/20 hover:text-neo-red hover:bg-neo-red/5 transition-all z-10"
                        >
                          <Trash2 size={18} />
                        </button>

                        <div className="p-6 md:p-8 space-y-6">
                           {/* LINE 1: PRODUCT, UNIT, QUANTITY */}
                           <div className="flex flex-col md:flex-row gap-6 items-start">
                              <div className="flex-1 w-full space-y-2">
                                 <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest ml-1 block">Sản phẩm #{idx + 1}</label>
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
                              <div className="w-full md:w-24 space-y-2">
                                 <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest ml-1 block">ĐVT</label>
                                 <div className="h-[3.5rem] bg-black/5 border-neo border-black rounded-xl flex items-center justify-center font-black text-[0.75rem] italic uppercase tracking-widest text-black/60">
                                    {item.unit || 'Cái'}
                                 </div>
                              </div>
                              <div className="w-full md:w-32 space-y-2">
                                 <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest ml-1 block">Số lượng</label>
                                 <input 
                                   type="number" 
                                   step="any"
                                   value={item.quantity || ''}
                                   onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                   className="form-input !h-[3.5rem] text-center font-black tabular-nums shadow-neo" 
                                   placeholder="0"
                                  />
                              </div>
                           </div>

                           {/* DASHED SEPARATOR */}
                           <div className="border-t-2 border-dashed border-black/10" />

                           {/* LINE 2: COGS, PRICE, TOTAL */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest ml-1 block">Giá vốn</label>
                                 <div className="relative">
                                    <input 
                                       type="number" 
                                       step="any"
                                       value={item.cogs || ''}
                                       onChange={(e) => updateItem(item.id, 'cogs', parseFloat(e.target.value) || 0)}
                                       placeholder="0.00"
                                       className="form-input !h-[3.5rem] text-right font-black tabular-nums text-black/40 italic bg-black/5 shadow-neo"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.5rem] font-black text-black/20 uppercase tracking-widest pointer-events-none">{currency}</span>
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <div className="flex justify-between items-center px-1">
                                    <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest block font-space">Giá Deal</label>
                                    <div className="flex gap-2">
                                      {(item.wholesalePrice ?? 0) > 0 && (
                                         <button onClick={() => updateItem(item.id, 'dealPrice', item.wholesalePrice ?? 0)} className="text-[0.5rem] font-black text-black/40 uppercase hover:text-black italic underline decoration-dotted">Sỉ</button>
                                      )}
                                      {(item.exportPrice ?? 0) > 0 && (
                                         <button onClick={() => updateItem(item.id, 'dealPrice', item.exportPrice ?? 0)} className="text-[0.5rem] font-black text-black/40 uppercase hover:text-black italic underline decoration-dotted">XK</button>
                                      )}
                                    </div>
                                 </div>
                                 <div className="relative">
                                    <input 
                                      type="number" 
                                      step="any"
                                      value={item.dealPrice || ''}
                                      onChange={(e) => updateItem(item.id, 'dealPrice', parseFloat(e.target.value) || 0)}
                                      placeholder="0.00"
                                      className={cn(
                                        "form-input !h-[3.5rem] text-right font-black tabular-nums shadow-neo",
                                        isLoss ? "border-neo-red !bg-neo-red/5" : "focus:bg-neo-purple/5"
                                      )}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.5rem] font-black text-black/20 uppercase tracking-widest pointer-events-none">{currency}</span>
                                 </div>
                                 {isLoss && (
                                    <div className="flex items-center gap-2 px-1 text-neo-red animate-pulse">
                                       <Lock size={10} strokeWidth={3} />
                                       <span className="text-[0.5rem] font-black uppercase tracking-widest italic">Giá dưới vốn</span>
                                    </div>
                                 )}
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[0.625rem] font-black text-black/40 uppercase tracking-widest ml-1 block bg-neo-yellow/30 w-fit px-2 py-0.5 rounded-md">Thành tiền</label>
                                 <div className="h-[3.5rem] bg-black text-white border-neo border-black rounded-xl flex items-center justify-end px-6 font-black text-[1.2rem] italic tabular-nums shadow-neo">
                                    {formatNumber(item.quantity * item.dealPrice, currency)}
                                    <span className="ml-2 text-[0.6rem] opacity-50 uppercase tracking-widest">{currency}</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                   );
                 })}
                 {items.length === 0 && (
                   <div className="py-20 text-center bg-white border-2 border-dashed border-black/10 rounded-2xl flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center text-black/20">
                         <Package size={32} />
                      </div>
                      <p className="text-[0.625rem] font-black text-black/20 uppercase tracking-[0.2em] italic">Chưa có sản phẩm nào được thêm</p>
                      <button onClick={addItem} className="btn-secondary !h-10 !px-8 text-[0.625rem]">Bắt đầu thêm ngay</button>
                   </div>
                 )}
               </div>
            </section>

            {/* MILESTONES SECTION */}
            <section className="p-8 bg-white border-neo border-black rounded-xl shadow-neo space-y-8">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-neo-yellow/20 border-2 border-black rounded-lg flex items-center justify-center">
                        <Calendar size={16} className="text-black" />
                     </div>
                     <h3 className="text-[0.6875rem] font-black text-black/40 uppercase tracking-[0.3em]">Thời hạn các khâu dự tính</h3>
                  </div>
                   <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        onClick={loadDefaultMilestones}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neo-blue/10 text-neo-blue rounded-lg hover:bg-neo-blue/20 border border-neo-blue/20 transition-all shadow-sm font-bold text-[9px] uppercase tracking-widest"
                        title="Tải từ cài đặt mặc định"
                      >
                        <RefreshCw size={12} strokeWidth={3} /> Tải mặc định
                      </button>
                      <button 
                        type="button"
                        onClick={addMilestone}
                        className="btn-secondary !h-10 !px-6 text-[0.625rem]"
                      >
                        <Plus size={14} strokeWidth={2.5} /> Thêm khâu
                      </button>
                   </div>
               </div>

               {milestones.length > 0 ? (
                 <div className="border-2 border-black rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-black/5 text-[0.5625rem] font-black text-black/40 uppercase tracking-widest border-b-2 border-black">
                             <th className="px-6 py-3">Các công đoạn</th>
                             <th className="px-6 py-3 w-40">Thời gian dự tính</th>
                             <th className="px-6 py-3 w-40 text-center">Hoàn thành thực tế</th>
                             <th className="px-6 py-3 w-32 text-center">Hoàn thành</th>
                             <th className="px-6 py-3 w-12"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y-2 divide-black/5">
                          {milestones.map((m) => (
                             <tr key={m.id} className="group">
                                <td className="px-6 py-3">
                                   <input 
                                     type="text" 
                                     placeholder="Tên công đoạn..."
                                     value={m.label}
                                     onChange={(e) => updateMilestone(m.id, 'label', e.target.value)}
                                     className="w-full bg-transparent border-none outline-none font-black text-xs italic placeholder:text-black/10"
                                   />
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     type="date" 
                                     value={m.deadline}
                                     onChange={(e) => updateMilestone(m.id, 'deadline', e.target.value)}
                                     className="w-full bg-transparent border-none outline-none font-black text-xs tabular-nums"
                                   />
                                </td>
                                <td className="px-6 py-3">
                                   <input 
                                     type="date" 
                                     value={m.completedAt || ''}
                                     onChange={(e) => {
                                       updateMilestone(m.id, 'completedAt', e.target.value);
                                       if (e.target.value) {
                                          updateMilestone(m.id, 'isCompleted', true);
                                       }
                                     }}
                                     className="w-full bg-transparent border-none outline-none font-black text-xs tabular-nums text-center text-neo-green-pure"
                                   />
                                </td>
                                <td className="px-6 py-3 text-center">
                                   <div className="flex justify-center">
                                      <div className={cn(
                                        "w-6 h-6 border-2 border-black rounded-lg flex items-center justify-center transition-all",
                                        m.isCompleted ? "bg-neo-green-pure" : "bg-white"
                                      )}>
                                         {m.isCompleted && <Check size={14} strokeWidth={4} className="text-white" />}
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-3 text-center">
                                   <button onClick={() => removeMilestone(m.id)} className="w-8 h-8 flex items-center justify-center text-black/20 hover:text-neo-red transition-all">
                                     <Trash2 size={14} />
                                   </button>
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="py-10 text-center border-2 border-dashed border-black/10 rounded-xl">
                    <p className="text-[0.625rem] font-black text-black/20 uppercase tracking-widest italic">Chưa có công đoạn nào được thiết lập</p>
                 </div>
               )}
            </section>
          </div>
        </div>

        {/* FOOTER SUMMARY */}
        <div className={cn(
          "shrink-0 border-t-neo border-black p-8 transition-all relative z-10",
          isNegativeMargin ? "bg-neo-red/10 animate-pulse" : "bg-white"
        )}>
           <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-10">
              <div className="flex flex-wrap items-center gap-12 w-full lg:w-auto">
                 <div className="flex flex-col">
                   <span className="text-[0.5625rem] font-black text-black/40 uppercase tracking-widest mb-1">Tổng doanh thu</span>
                   <span className="text-3xl font-black text-black italic tabular-nums">{formatNumber(totalRevenue, currency)} <span className="text-xs">{currency}</span></span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[0.5625rem] font-black text-black/40 uppercase tracking-widest mb-1">Tổng giá vốn</span>
                   <span className="text-2xl font-black text-black/20 italic tabular-nums">{formatNumber(totalCOGS, currency)} <span className="text-xs">{currency}</span></span>
                 </div>
                 <div className="flex flex-col">
                   <span className="text-[0.5625rem] font-black text-black/40 uppercase tracking-widest mb-1">Thặng dư dự kiến</span>
                   <span className={cn("text-3xl font-black italic tabular-nums", totalProfit >= 0 ? "text-neo-green-pure text-green-600" : "text-neo-red")}>
                      {formatNumber(totalRevenue - totalCOGS, currency)} <span className="text-xs">{currency}</span>
                   </span>
                 </div>
              </div>
              
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || !canSubmit}
                className="btn-primary btn-confirm-flash !h-16 !px-12 text-sm uppercase tracking-[0.2em] w-full lg:w-auto"
              >
                {isSubmitting ? "Processing..." : "Xác nhận & Chốt đơn"}
                {!isSubmitting && <ArrowUpRight size={20} strokeWidth={3} />}
              </button>
           </div>
        </div>

        {/* MANAGER LOCK */}
        {showManagerLock && (
           <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowManagerLock(false)} />
              <div className="relative bg-white w-full max-w-sm p-10 rounded-xl border-neo border-black shadow-neo animate-in zoom-in-95 duration-300">
                 <div className="w-16 h-16 bg-neo-red/10 text-neo-red border-2 border-black rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <Lock size={32} strokeWidth={2.5} />
                 </div>
                 <h3 className="text-lg font-black text-black text-center uppercase tracking-tight mb-2 italic">Manager Authorization</h3>
                 <p className="text-[0.625rem] text-black/40 text-center font-black uppercase tracking-widest mb-10 leading-relaxed italic">
                    Đơn hàng dưới giá vốn. Cần xác thực quản lý.
                 </p>
                 
                 <input 
                   type="password" 
                   value={managerPass}
                   onChange={(e) => setManagerPass(e.target.value)}
                   className="form-input h-14 text-center text-2xl font-black tracking-[0.5em] focus:bg-neo-red/5 mb-8"
                   placeholder="****"
                 />
  
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setShowManagerLock(false)} className="h-14 font-black text-[0.625rem] uppercase tracking-widest text-black/40 hover:text-black transition-all">Hủy</button>
                    <button onClick={handleSubmit} className="btn-primary !h-14 text-[0.625rem] uppercase tracking-widest">Verify</button>
                 </div>
              </div>
           </div>
        )}

        <ProductFormModal 
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSubmit={handleCreateQuickProduct}
          initialData={null}
        />
      </div>
    </div>
  );
}
