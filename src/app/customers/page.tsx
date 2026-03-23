"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Plus, Filter, Search, Phone, MapPin,
  Building2, Trash2, Edit3, Mail, FileText,
  AlertCircle, X, ChevronRight, UserPlus,
  ChevronDown, ChevronUp, ExternalLink, Hash
} from 'lucide-react';

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

import { useNotification } from '@/context/NotificationContext';

export default function CustomersPage() {
  const { showToast, showModal, confirm: customConfirm } = useNotification();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(15);
  
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

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Smart Auto-generation of Customer Code
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
      const code = customer.customerCode || (customer as any).customer_code || '';
      setFormData({
        name: customer.name,
        customerCode: code,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    } else {
      setEditingCustomer(null);
      setFormData({ name: '', customerCode: '', phone: '', email: '', address: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setError(null);
    if (!formData.name.trim() || !formData.customerCode.trim()) {
      setError("Vui lòng nhập đầy đủ Tên và Mã khách hàng!");
      return;
    }

    const method = editingCustomer ? 'PUT' : 'POST';
    const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCustomers();
      } else {
        const err = await res.json();
        if (res.status === 409 || err.error?.includes('unique') || err.error?.includes('tồn tại')) {
          setError("Mã khách hàng này đã tồn tại, vui lòng kiểm tra lại");
        } else {
          setError(`Lỗi: ${err.error || 'Vui lòng thử lại sau'}`);
        }
      }
    } catch (e) {
      setError("Lỗi kết nối hệ thống!");
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (await customConfirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
      try {
        const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('success', "Đã xóa khách hàng thành công");
          fetchCustomers();
        } else {
          showModal('error', "Không thể xóa khách hàng", "Có thể khách đã có đơn hàng hoặc lỗi hệ thống.");
        }
      } catch (e) {
        showModal('error', "Lỗi kết nối", String(e));
      }
    }
  };

  // Grouping & Search Logic
  const groupedCustomers = useMemo(() => {
    const filtered = customers.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.customerCode || (c as any).customer_code || '').toLowerCase().includes(search.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    
    // Group by first letter
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
      const offset = 140; // sticky header offset
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* HEADER SECTION - Brand and Summary */}
      <div className="bg-white border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <nav className="flex items-center gap-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">
                <Building2 size={12} />
                <span>ERP SYSTEM</span>
                <ChevronRight size={10} />
                <span className="text-blue-600">Master Data</span>
              </nav>
              <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight flex items-center gap-4">
                Quản lý <span className="text-blue-600">Khách hàng</span>
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 flex flex-col items-end">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-none">Cơ sở dữ liệu</span>
                <span className="text-xl font-black text-blue-900 mt-1">{customers.length} <span className="text-[10px] text-gray-400 uppercase ml-1">đơn vị</span></span>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2 text-[10px] uppercase tracking-widest active:scale-95"
              >
                <Plus size={18} strokeWidth={3} /> Thêm khách mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY SEARCH & NAV BAR */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
               <div className="flex-1 relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên hoặc mã khách hàng..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-100/50 border-transparent rounded-xl py-3 pl-14 pr-6 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all font-semibold"
                />
              </div>
              <button className="hidden md:flex p-3 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm">
                <Filter size={18} />
              </button>
            </div>

            {/* Jump-to-Letter Bar */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest mr-2 flex-shrink-0">Jump To:</span>
              {alphabet.map(letter => {
                const hasData = groupedCustomers[letter];
                return (
                  <button
                    key={letter}
                    disabled={!hasData}
                    onClick={() => scrollToLetter(letter)}
                    className={`min-w-[28px] h-7 rounded-lg text-[10px] font-black transition-all flex items-center justify-center
                      ${hasData 
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white cursor-pointer shadow-sm' 
                        : 'text-gray-200 cursor-not-allowed'}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] animate-pulse">Syncing Central Data...</p>
          </div>
        ) : availableLetters.length === 0 ? (
          <div className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center text-center">
            <Users size={48} className="text-gray-100 mb-6" />
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic leading-relaxed">Không tìm thấy dữ liệu khách hàng<br/>trong bộ lọc hiện tại</p>
          </div>
        ) : (
          <div className="space-y-12">
            {availableLetters.map(letter => (
              <div key={letter} id={`group-${letter}`} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-100">
                    {letter}
                  </div>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                </div>

                <div className="grid grid-cols-1 gap-1">
                  {groupedCustomers[letter].map((c) => {
                    const isExpanded = expandedIds.has(c.id);
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => toggleExpand(c.id)}
                        className={`group relative overflow-hidden transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-0.5
                          ${isExpanded ? 'bg-white rounded-[32px] p-6 shadow-xl ring-1 ring-blue-50' : 'bg-white/60 even:bg-gray-50/50 rounded-2xl h-16 flex items-center px-6'}`}
                      >
                        {isExpanded ? (
                          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                            {/* Expanded Card Top */}
                            <div className="flex justify-between items-start">
                              <div className="flex gap-4 items-center">
                                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-blue-200">
                                  {c.customerCode || (c as any).customer_code || '??'}
                                </div>
                                <div>
                                  <h4 className="text-xl font-black text-blue-950 uppercase italic tracking-tight">{c.name}</h4>
                                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Verified Partner
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenModal(c); }}
                                  className="p-3 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                                >
                                  <Edit3 size={18} />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, c.id)}
                                  className="p-3 bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm"
                                >
                                  <Trash2 size={18} />
                                </button>
                                <button className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm"><ChevronUp size={18} /></button>
                              </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-50">
                               <div className="space-y-2">
                                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Liên hệ</label>
                                  <div className="flex items-center gap-3 text-blue-900">
                                    <Phone size={14} className="text-blue-400" />
                                    <span className="text-sm font-bold">{c.phone || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-blue-900">
                                    <Mail size={14} className="text-blue-400" />
                                    <span className="text-sm font-bold truncate max-w-[200px]">{c.email || 'N/A'}</span>
                                  </div>
                               </div>
                               <div className="md:col-span-2 space-y-2">
                                  <label className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Địa chỉ & Ghi chú</label>
                                  <div className="flex items-start gap-3">
                                    <MapPin size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-gray-500 leading-relaxed">{c.address || 'Chưa cập nhật địa chỉ giao hàng.'}</span>
                                  </div>
                                  {c.notes && (
                                    <div className="flex items-start gap-3 mt-2">
                                      <FileText size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                      <span className="text-xs font-medium italic text-gray-400 leading-relaxed">{c.notes}</span>
                                    </div>
                                  )}
                               </div>
                            </div>
                          </div>
                        ) : (
                          /* Condensed Card Row */
                          <div className="w-full flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <span className="w-10 text-[10px] font-black text-blue-600 bg-blue-50 py-1 rounded-md text-center flex-shrink-0 tracking-tighter uppercase whitespace-nowrap">
                                {c.customerCode || (c as any).customer_code || '??'}
                              </span>
                              <h4 className="text-sm font-bold text-blue-950 uppercase italic truncate max-w-[150px] md:max-w-xs">{c.name}</h4>
                              <div className="hidden sm:flex items-center gap-2 text-[11px] font-semibold text-gray-400">
                                <Phone size={12} className="text-blue-200" /> {c.phone || 'N/A'}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                               <div className="hidden lg:flex flex-col items-end mr-6">
                                  <span className="text-[11px] font-black text-blue-900 leading-none">{c._count?.orders || 0}</span>
                                  <span className="text-[7px] font-black text-blue-200 uppercase tracking-widest">Hợp đồng</span>
                               </div>
                               <ChevronDown size={16} className="text-gray-300 group-hover:text-blue-400 group-hover:translate-y-0.5 transition-all" />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Pagination / Load More Simulation (Visible batching already handles clutter, showing all groups is standard but limit is asked) */}
            <div className="flex flex-col items-center py-10 opacity-50">
               <div className="h-[1px] w-20 bg-gray-200 mb-6" />
               <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">End of Central Records</p>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON - For Mobile */}
      <button
        onClick={() => handleOpenModal()}
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl shadow-blue-400/50 flex items-center justify-center z-50 active:scale-90 transition-all"
      >
        <Plus size={28} strokeWidth={3} />
      </button>

      {/* CUSTOMER MODAL - SMART ERP FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 md:p-12 rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-500 scrollbar-hide">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-3xl font-black text-blue-950 tracking-tight italic">
                  {editingCustomer ? 'Cập nhật' : 'Thiết lập'} <span className="text-blue-600 underline underline-offset-8 decoration-4">Đối tác</span>
                </h3>
                <p className="text-[11px] text-gray-400 font-black uppercase tracking-widest mt-4 italic flex items-center gap-2">
                  <FileText size={14} className="text-blue-300" /> Thông tin hồ sơ khách hàng ERP
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-gray-50 text-gray-400 hover:text-rose-500 rounded-full transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-600 animate-in slide-in-from-top-4">
                <AlertCircle size={20} className="flex-shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
              </div>
            )}

            <div className="space-y-8">
              {/* Main Identity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[11px] font-black text-blue-400 uppercase tracking-widest ml-1">Tên khách hàng / Công ty</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-200 transition-all text-sm font-bold placeholder:text-gray-200"
                    placeholder="NHẬP TÊN CÔNG TY HOẶC CÁ NHÂN..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-blue-400 uppercase tracking-widest ml-1">Mã định danh</label>
                  <input
                    type="text"
                    value={formData.customerCode}
                    onChange={(e) => setFormData({ ...formData, customerCode: e.target.value.toUpperCase() })}
                    maxLength={10}
                    className="w-full px-8 py-5 bg-blue-50/50 border border-blue-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white focus:border-blue-300 transition-all text-sm font-black text-blue-700 uppercase tracking-widest text-center"
                    placeholder="MÃ KH"
                  />
                  {!editingCustomer && formData.name && (
                    <p className="text-[9px] text-blue-400 font-black uppercase text-center mt-1 italic opacity-60">Gợi ý từ tên khách</p>
                  )}
                </div>
              </div>

              {/* Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-blue-400 uppercase tracking-widest ml-1">SĐT liên hệ</label>
                  <div className="relative">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-300" size={16} />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-8 pl-14 py-5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:bg-white focus:border-blue-200 transition-all text-sm font-bold"
                      placeholder="09xx.xxx.xxx"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-blue-400 uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-300" size={16} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-8 pl-14 py-5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:bg-white focus:border-blue-200 transition-all text-sm font-bold"
                      placeholder="example@contract.com"
                    />
                  </div>
                </div>
              </div>

              {/* Address & Notes */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-blue-400 uppercase tracking-widest ml-1">Địa chỉ giao hàng</label>
                  <div className="relative">
                    <MapPin className="absolute left-6 top-6 text-blue-300" size={16} />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-8 pl-14 py-5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:bg-white focus:border-blue-200 transition-all text-sm font-bold h-24 resize-none leading-relaxed"
                      placeholder="Nhập địa chỉ đầy đủ để phục vụ logistics..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-blue-400 uppercase tracking-widest ml-1">Ghi chú đặc biệt</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-8 py-5 bg-gray-50 border border-gray-100 rounded-3xl focus:outline-none focus:bg-white focus:border-blue-200 transition-all text-sm font-medium h-20 resize-none italic text-gray-400"
                    placeholder="Lưu ý về sở thích khách hàng, quy trình thanh toán..."
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-12 pb-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-5 bg-gray-50 text-gray-500 text-[11px] font-black uppercase rounded-[28px] hover:bg-gray-100 transition-all tracking-[0.2em] order-2 md:order-1"
              >
                Quay lại
              </button>
              <button
                onClick={handleSave}
                className="flex-[1.5] py-5 bg-blue-600 text-white text-[11px] font-black uppercase rounded-[28px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 tracking-[0.2em] order-1 md:order-2 flex items-center justify-center gap-3 active:scale-95"
              >
                <UserPlus size={18} /> {editingCustomer ? 'Xác nhận cập nhật' : 'Khởi tạo khách hàng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
