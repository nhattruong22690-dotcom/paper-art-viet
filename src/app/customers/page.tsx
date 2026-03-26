"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Plus, Filter, Search, Phone, MapPin,
  Building2, Trash2, Mail, FileText,
  AlertCircle, X, ChevronRight, UserPlus,
  ChevronDown, ChevronUp, Edit3, Loader2,
  ExternalLink
} from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Customer {
  id: string;
  customerCode: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  _count?: {
    orders: number;
  };
}

export default function CustomersPage() {
  const { showToast, showModal, confirm } = useNotification();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    name: '',
    customerCode: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generateCodeFromName = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData(prev => ({
      ...prev,
      name: newName,
      customerCode: !editingCustomer && (prev.customerCode === '' || prev.customerCode === generateCodeFromName(prev.name))
        ? generateCodeFromName(newName)
        : prev.customerCode
    }));
  };

  const handleOpenModal = (customer?: Customer) => {
    setError(null);
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || '',
        customerCode: customer.customerCode || (customer as any).customer_code || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        name: '',
        customerCode: '',
        phone: '',
        email: '',
        address: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await confirm('Bạn có chắc chắn muốn xóa khách hàng này? Thao tác này không thể hoàn tác.');
    if (!ok) return;

    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('success', 'Đã xóa hồ sơ khách hàng');
        fetchCustomers();
      }
    } catch (e) {
      showModal('error', 'Không thể xóa khách hàng.', 'Lỗi hệ thống');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
    const method = editingCustomer ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        showToast('success', editingCustomer ? 'Cập nhật thành công' : 'Đã đăng ký khách hàng mới');
        fetchCustomers();
      } else {
        setError(data.error || 'Có lỗi xảy ra trong quá trình lưu hồ sơ.');
      }
    } catch (e) {
      setError('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại đường truyền.');
    } finally {
      setIsLoading(false);
    }
  };

  const groupedCustomers = useMemo(() => {
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.customerCode || (c as any).customer_code || '').toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    const groups: { [key: string]: Customer[] } = {};
    sorted.forEach(c => {
      const firstLetter = c.name.trim().charAt(0).toUpperCase() || '#';
      if (!groups[firstLetter]) groups[firstLetter] = [];
      groups[firstLetter].push(c);
    });
    return groups;
  }, [customers, search]);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#".split("");
  const availableLetters = useMemo(() => Object.keys(groupedCustomers).sort(), [groupedCustomers]);

  const scrollToLetter = (letter: string) => {
    const element = document.getElementById(`group-${letter}`);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: elementPosition, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      {/* Header Section */}
      <div className="card !flex-col md:!flex-row justify-between items-start md:items-center gap-6">
        <div>
          <nav className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">
            <Building2 size={12} />
            <span>Hệ thống</span>
            <ChevronRight size={10} />
            <span className="text-primary">Hồ sơ khách hàng</span>
          </nav>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Quản lý Đối tác & Khách hàng
          </h1>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="hidden md:flex flex-col items-end px-4 border-r border-border">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tổng đối tác</span>
            <span className="text-xl font-black text-foreground">{customers.length}</span>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-primary gap-2 w-full md:w-auto justify-center"
          >
            <Plus size={20} /> Thêm khách hàng
          </button>
        </div>
      </div>

      {/* Sticky Filters & Alphabet */}
      <div className="card !p-4 sticky top-0 z-30 shadow-md flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã khách hàng..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-10 h-10 w-full"
            />
          </div>
          <button className="btn-secondary gap-2 w-full md:w-auto justify-center">
            <Filter size={18} /> Bộ lọc
          </button>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {alphabet.map(letter => {
            const hasData = groupedCustomers[letter];
            return (
              <button
                key={letter}
                disabled={!hasData}
                onClick={() => scrollToLetter(letter)}
                className={cn(
                  "min-w-[28px] h-7 text-[10px] font-bold rounded flex items-center justify-center transition-all",
                  hasData 
                    ? 'bg-primary/5 text-primary hover:bg-primary hover:text-white border border-primary/20' 
                    : 'text-muted-foreground/30 border border-transparent'
                )}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-sm font-medium">Đang tải dữ liệu khách hàng...</p>
        </div>
      ) : availableLetters.length === 0 ? (
        <div className="card !p-24 flex flex-col items-center justify-center text-center text-muted-foreground border-dashed">
          <Users size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">Không tìm thấy khách hàng nào phù hợp</p>
        </div>
      ) : (
        <div className="space-y-12">
          {availableLetters.map(letter => (
            <div key={letter} id={`group-${letter}`} className="scroll-mt-32 space-y-4">
              <div className="flex items-center gap-4 px-2">
                <div className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {letter}
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 gap-3">
                {groupedCustomers[letter].map((c) => {
                  const isExpanded = expandedIds.has(c.id);
                  return (
                    <div 
                      key={c.id} 
                      className={cn(
                        "card !p-0 overflow-hidden transition-all border border-border hover:border-primary/30",
                        isExpanded ? "ring-1 ring-primary/20 shadow-lg" : "hover:shadow-md"
                      )}
                    >
                      {/* Card Header/Row */}
                      <div 
                        onClick={() => toggleExpand(c.id)}
                        className="p-4 md:px-6 flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={cn(
                            "w-10 h-10 rounded bg-gray-50 flex items-center justify-center font-bold text-[10px] border border-border text-muted-foreground uppercase group-hover:bg-primary/5 group-hover:text-primary transition-colors",
                            isExpanded && "bg-primary text-white border-primary"
                          )}>
                            {c.customerCode || 'N/A'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{c.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                               <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                 <Phone size={10} /> {c.phone || '---'}
                               </span>
                               <span className="hidden sm:inline-block text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                                 <Mail size={10} /> {c.email || '---'}
                               </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 ml-4">
                          <div className="hidden lg:flex flex-col items-end">
                            <span className="text-sm font-bold text-foreground tabular-nums">{c._count?.orders || 0}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Đơn hàng</span>
                          </div>
                          {isExpanded ? <ChevronUp size={20} className="text-primary" /> : <ChevronDown size={20} className="text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 border-t border-border animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
                             <div className="space-y-4">
                                <div>
                                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Liên hệ</label>
                                   <div className="mt-2 space-y-2">
                                      <p className="flex items-center gap-3 text-sm font-medium text-foreground">
                                         <Phone size={14} className="text-primary/50" /> {c.phone || 'Chưa cập nhật'}
                                      </p>
                                      <p className="flex items-center gap-3 text-sm font-medium text-foreground truncate">
                                         <Mail size={14} className="text-primary/50" /> {c.email || 'Chưa cập nhật'}
                                      </p>
                                   </div>
                                </div>
                                <div className="flex gap-2">
                                   <button
                                     onClick={(e) => { e.stopPropagation(); handleOpenModal(c); }}
                                     className="btn-secondary !py-2 text-xs flex-1 justify-center"
                                   >
                                     <Edit3 size={14} /> Chỉnh sửa
                                   </button>
                                   <button
                                     onClick={(e) => handleDelete(e, c.id)}
                                     className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                   >
                                     <Trash2 size={14} />
                                   </button>
                                </div>
                             </div>

                             <div className="md:col-span-2 space-y-4">
                                <div>
                                   <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Địa chỉ giao nhận</label>
                                   <p className="mt-2 text-sm text-foreground flex items-start gap-3">
                                      <MapPin size={16} className="text-red-500/50 mt-0.5" />
                                      {c.address || 'Chưa thiết lập tuyến logistics.'}
                                   </p>
                                </div>
                                {c.notes && (
                                   <div className="bg-gray-50/50 p-4 rounded-xl border border-border">
                                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                         <FileText size={12} /> Ghi chú đặc thù
                                      </label>
                                      <p className="mt-2 text-sm text-muted-foreground italic leading-relaxed">
                                         {c.notes}
                                      </p>
                                   </div>
                                )}
                             </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Section */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 backdrop-blur-sm bg-black/40 animate-in fade-in duration-300">
          <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col border border-border overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 md:p-8 border-b border-border bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {editingCustomer ? 'Cập nhật khách hàng' : 'Đăng ký khách hàng mới'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Hồ sơ đối tác Paper Art Việt</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-muted-foreground"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-xs font-bold animate-in slide-in-from-top-2">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Tên khách hàng / Đơn vị</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="form-input"
                    placeholder="Nhập tên chính thức..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Mã khách hàng</label>
                  <input
                    required
                    type="text"
                    value={formData.customerCode}
                    onChange={(e) => setFormData({ ...formData, customerCode: e.target.value.toUpperCase() })}
                    maxLength={10}
                    className="form-input text-center font-bold tracking-widest text-primary"
                    placeholder="MÃ SỐ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input"
                    placeholder="0xxx xxx xxx"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input"
                    placeholder="example@mail.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Địa chỉ giao nhận</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-input min-h-[80px] py-3 resize-none"
                  placeholder="Nhập địa chỉ đầy đủ..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider ml-1">Ghi chú đặc thù</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input min-h-[60px] py-3 resize-none text-muted-foreground italic bg-gray-50/30"
                  placeholder="Tiền lệ giao dịch, sở thích đối tác..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-border mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1 justify-center"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-[1.5] justify-center"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : (
                    <>
                       <UserPlus size={18} className="mr-2" />
                       {editingCustomer ? 'Cập nhật hồ sơ' : 'Khởi tạo khách hàng'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
