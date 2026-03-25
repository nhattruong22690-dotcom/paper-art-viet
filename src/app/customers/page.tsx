"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Plus, Filter, Search, Phone, MapPin,
  Building2, Trash2, Mail, FileText,
  AlertCircle, X, ChevronRight, UserPlus,
  ChevronDown, ChevronUp, ExternalLink, Hash,
  Library, Edit3
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
        name: customer.name || '',
        customerCode: code,
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
    <div className="min-h-screen bg-retro-paper/20">
      {/* HEADER SECTION - Brand and Summary */}
      <div className="bg-retro-paper border-b-2 border-retro-sepia/10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
           <Building2 size={300} strokeWidth={0.5} className="text-retro-sepia" />
        </div>
        <div className="washi-tape-top" />
        
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-10">
            <div>
              <nav className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-4 font-typewriter opacity-60">
                <Building2 size={14} strokeWidth={1.5} />
                <span>Hệ thống ERP</span>
                <ChevronRight size={12} strokeWidth={1.5} />
                <span className="text-retro-sepia">Hồ sơ Đối tác</span>
              </nav>
              <h1 className="text-3xl md:text-4xl font-black text-retro-sepia uppercase tracking-tighter italic font-typewriter underline decoration-double decoration-retro-mustard/30 underline-offset-4">
                Sổ cái <span className="text-retro-brick">Khách hàng</span>
              </h1>
              <div className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] italic mt-2 opacity-60 font-typewriter flex items-center gap-2">
                <div className="w-2 h-2 bg-retro-brick rotate-45" />
                Danh mục đối tác chiến lược & Khách hàng vãng lai — MCMLXXXIV
              </div>
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="bg-white px-6 py-4 border-2 border-retro-sepia/10 flex flex-col items-end shadow-inner min-w-[140px] rotate-1 font-typewriter">
                <span className="text-[9px] font-black text-retro-earth uppercase tracking-widest leading-none opacity-60">Tổng nhân hiệu</span>
                <span className="text-2xl font-black text-retro-sepia mt-1 italic tracking-tighter">
                  {customers.length} <span className="text-[10px] uppercase font-bold not-italic">Đơn vị</span>
                </span>
              </div>
              <button
                onClick={() => handleOpenModal()}
                className="flex-1 md:flex-none px-8 py-5 bg-retro-brick text-white font-black shadow-[4px_4px_0px_#3E272333] hover:bg-retro-sepia transition-all flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em] active:scale-95 font-typewriter italic"
              >
                <Plus size={20} strokeWidth={2.5} /> Thêm đối tác mới
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* STICKY SEARCH & NAV BAR */}
      <div className="sticky top-0 z-40 bg-retro-paper/90 backdrop-blur-md border-b-2 border-retro-sepia/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-6">
               <div className="flex-1 relative group font-typewriter">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-retro-sepia/20 group-focus-within:text-retro-brick transition-colors" size={18} strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Tra cứu tên hoặc mã định danh đối tác..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white border-2 border-retro-sepia/10 px-14 py-4 text-xs font-black uppercase text-retro-sepia outline-none focus:bg-white focus:border-retro-sepia transition-all shadow-inner placeholder:italic placeholder:font-normal placeholder:lowercase tracking-tight"
                />
              </div>
              <button className="hidden md:flex p-4 bg-white border-2 border-retro-sepia/10 text-retro-sepia hover:text-retro-brick hover:bg-white transition-all shadow-sm rotate-1 hover:rotate-0">
                <Filter size={20} strokeWidth={1.5} />
              </button>
            </div>

            {/* Jump-to-Letter Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-1 font-typewriter">
              <span className="text-[9px] font-black text-retro-earth/40 uppercase tracking-widest mr-3 flex-shrink-0 italic opacity-60">Truy cập nhanh:</span>
              {alphabet.map(letter => {
                const hasData = groupedCustomers[letter];
                return (
                  <button
                    key={letter}
                    disabled={!hasData}
                    onClick={() => scrollToLetter(letter)}
                    className={`min-w-[32px] h-8 text-[11px] font-black transition-all flex items-center justify-center border-2
                      ${hasData 
                        ? 'text-retro-sepia border-retro-sepia/10 bg-white hover:bg-retro-sepia hover:text-retro-paper hover:border-retro-sepia cursor-pointer shadow-sm active:scale-95 italic' 
                        : 'text-retro-earth/20 border-transparent cursor-not-allowed opacity-30'}`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 space-y-6">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center font-typewriter">
            <div className="w-14 h-14 border-4 border-retro-sepia/10 border-t-retro-brick animate-spin mb-6" />
            <p className="text-[10px] font-black text-retro-earth uppercase tracking-[0.3em] animate-pulse italic">Đang đồng bộ Sổ cái...</p>
          </div>
        ) : availableLetters.length === 0 ? (
          <div className="retro-card !bg-white/40 p-24 flex flex-col items-center justify-center text-center border-4 border-dashed border-retro-sepia/10">
            <Users size={64} strokeWidth={1} className="text-retro-earth/20 mb-8" />
            <p className="text-xs font-black text-retro-earth/40 uppercase tracking-[0.3em] italic leading-relaxed font-typewriter">Dữ liệu đối tác trống<br/>với bộ lọc hiện hành</p>
          </div>
        ) : (

          <div className="space-y-12">
            {availableLetters.map(letter => (
              <div key={letter} id={`group-${letter}`} className="space-y-6 scroll-mt-40">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-retro-sepia flex items-center justify-center text-retro-paper font-black text-xl shadow-xl rotate-3 font-typewriter">
                    {letter}
                  </div>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-retro-sepia/10 to-transparent" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {groupedCustomers[letter].map((c) => {
                    const isExpanded = expandedIds.has(c.id);
                    return (
                      <div 
                        key={c.id} 
                        onClick={() => toggleExpand(c.id)}
                        className={`group relative overflow-hidden transition-all duration-300 cursor-pointer border-2
                          ${isExpanded ? 'retro-card !bg-white !p-8 shadow-2xl !border-retro-sepia/20' : 'bg-white border-retro-sepia/5 hover:border-retro-sepia/20 h-20 flex items-center px-8 shadow-sm hover:shadow-lg'}`}
                      >

                        {isExpanded ? (
                          <div className="space-y-8 animate-in slide-in-from-top-4 duration-300">
                            {/* Expanded Card Top */}
                            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                              <div className="flex gap-6 items-center">
                                <div className="w-16 h-16 bg-retro-paper border-2 border-retro-sepia text-retro-sepia flex items-center justify-center font-black text-xs shadow-xl rotate-3 font-typewriter">
                                  {c.customerCode || (c as any).customer_code || '??'}
                                </div>
                                <div className="font-typewriter">
                                  <h4 className="text-2xl font-black text-retro-sepia uppercase italic tracking-tighter underline decoration-retro-mustard/30 underline-offset-4">{c.name}</h4>
                                  <div className="text-[10px] font-black text-retro-moss uppercase tracking-[0.2em] mt-2 flex items-center gap-2 italic opacity-80">
                                    <div className="w-2 h-2 bg-retro-moss shadow-sm animate-pulse" /> Đã Ký Hiệp Định Đối Tác
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-3 w-full md:w-auto">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenModal(c); }}
                                  className="flex-1 md:flex-none p-4 bg-retro-paper border-2 border-retro-sepia/10 text-retro-sepia hover:text-retro-brick hover:bg-white transition-all shadow-sm rotate-1"
                                >
                                  <Edit3 size={18} strokeWidth={1.5} />
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, c.id)}
                                  className="flex-1 md:flex-none p-4 bg-retro-paper border-2 border-retro-brick/10 text-retro-brick hover:bg-retro-brick hover:text-white transition-all shadow-sm -rotate-1"
                                >
                                  <Trash2 size={18} strokeWidth={1.5} />
                                </button>
                                <button className="p-4 bg-retro-sepia text-retro-paper shadow-sm"><ChevronUp size={20} strokeWidth={1.5} /></button>
                              </div>
                            </div>


                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-8 border-t-2 border-retro-sepia/5 font-typewriter">
                               <div className="space-y-4">
                                  <label className="text-[9px] font-black text-retro-earth/40 uppercase tracking-[0.2em] italic">Thông tri liên lạc</label>
                                  <div className="flex items-center gap-4 text-retro-sepia">
                                    <Phone size={16} strokeWidth={1.5} className="text-retro-mustard" />
                                    <span className="text-sm font-black italic tracking-tight">{c.phone || 'N/A'}</span>
                                  </div>
                                  <div className="flex items-center gap-4 text-retro-sepia">
                                    <Mail size={16} strokeWidth={1.5} className="text-retro-mustard" />
                                    <span className="text-sm font-black italic truncate tracking-tight">{c.email || 'N/A'}</span>
                                  </div>
                               </div>
                               <div className="md:col-span-2 space-y-4">
                                  <label className="text-[9px] font-black text-retro-earth/40 uppercase tracking-[0.2em] italic">Địa chỉ & Lưu bút ghi nhận</label>
                                  <div className="flex items-start gap-4">
                                    <MapPin size={16} strokeWidth={1.5} className="text-retro-brick mt-0.5 flex-shrink-0" />
                                    <span className="text-[13px] font-bold text-retro-earth leading-relaxed font-serif italic">{c.address || 'Chưa thiết lập tuyến Logistics giao nhận.'}</span>
                                  </div>
                                  {c.notes && (
                                    <div className="flex items-start gap-4 mt-4 bg-retro-paper/40 p-4 border-l-4 border-retro-mustard italic">
                                      <FileText size={16} strokeWidth={1.5} className="text-retro-earth/40 mt-0.5 flex-shrink-0" />
                                      <span className="text-[12px] font-bold text-retro-earth/60 leading-relaxed font-handwriting">{c.notes}</span>
                                    </div>
                                  )}
                               </div>
                            </div>
                          </div>

                        ) : (
                          /* Condensed Card Row */
                          <div className="w-full flex items-center justify-between gap-6 font-typewriter">
                            <div className="flex items-center gap-6 flex-1">
                              <span className="w-12 text-[10px] font-black text-retro-paper bg-retro-sepia py-1 text-center flex-shrink-0 tracking-widest uppercase rotate-2">
                                {c.customerCode || (c as any).customer_code || '??'}
                              </span>
                              <h4 className="text-sm font-black text-retro-sepia uppercase italic tracking-tighter truncate max-w-[150px] md:max-w-md underline decoration-retro-mustard/20 underline-offset-4">{c.name}</h4>
                              <div className="hidden sm:flex items-center gap-3 text-[11px] font-black text-retro-earth/40 italic">
                                <Phone size={14} strokeWidth={1.5} className="text-retro-mustard/40" /> {c.phone || '---'}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-8">
                               <div className="hidden lg:flex flex-col items-end mr-6">
                                  <span className="text-sm font-black text-retro-sepia leading-none italic tracking-tighter">{c._count?.orders || 0}</span>
                                  <span className="text-[8px] font-black text-retro-earth/40 uppercase tracking-[0.2em] mt-1">Đã thụ ký</span>
                                </div>
                               <ChevronDown size={20} className="text-retro-sepia/20 group-hover:text-retro-brick group-hover:translate-y-1 transition-all" strokeWidth={1.5} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex flex-col items-center py-16 opacity-30 font-typewriter">
               <div className="h-[2px] w-24 bg-retro-sepia/20 mb-8" />
               <p className="text-[10px] font-black text-retro-earth uppercase tracking-[0.4em] italic">Hết danh bản hồ sơ đối tác</p>
            </div>

          </div>
        )}
      </div>

      <button
        onClick={() => handleOpenModal()}
        className="md:hidden fixed bottom-8 right-8 w-16 h-16 bg-retro-brick text-white rounded-none shadow-2xl flex items-center justify-center z-50 active:scale-95 transition-all rotate-3 shadow-[4px_4px_0px_#3E272333]"
      >
        <Plus size={32} strokeWidth={2.5} />
      </button>


      {/* CUSTOMER MODAL - SMART ERP FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-500 overflow-hidden">
          <div className="absolute inset-0 bg-retro-sepia/40 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl max-h-[90vh] retro-card !p-0 shadow-[0_30px_60px_-15px_rgba(62,39,35,0.5)] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden border-2">
            <div className="washi-tape-top" />
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
               <Building2 size={400} strokeWidth={0.5} className="text-retro-sepia" />
            </div>

            <div className="p-8 md:p-12 border-b-2 border-retro-sepia/10 flex justify-between items-center bg-retro-paper/40 relative shrink-0">
              <div className="relative z-10">
                <h3 className="text-3xl font-black text-retro-sepia tracking-tighter italic font-typewriter uppercase">
                  {editingCustomer ? 'Kiểm duyệt' : 'Đăng ký'} <span className="text-retro-brick underline decoration-double decoration-retro-brick/30">Đối tác</span>
                </h3>
                <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] mt-4 italic flex items-center gap-3 font-typewriter opacity-60">
                  <FileText size={16} strokeWidth={1.5} className="text-retro-mustard" /> Danh lục hồ sơ đối tác Paper Art Việt
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-4 bg-retro-paper border-2 border-retro-sepia/10 hover:bg-retro-brick/10 hover:text-retro-brick transition-all rotate-2 hover:rotate-0 shadow-sm"
              >
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide bg-retro-paper/40 pb-20">
              {error && (
                <div className="mb-10 p-6 bg-retro-brick/5 border-2 border-retro-brick/20 flex items-center gap-5 text-retro-brick animate-in slide-in-from-top-4 font-typewriter italic">
                  <AlertCircle size={24} strokeWidth={2} className="flex-shrink-0" />
                  <p className="text-[11px] font-black uppercase tracking-tight leading-relaxed">{error}</p>
                </div>
              )}

              <div className="space-y-10">
                {/* Main Identity */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-3 font-typewriter">
                    <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Đơn vị / Danh xưng đối tác</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={handleNameChange}
                      className="w-full px-8 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black uppercase text-retro-sepia shadow-inner outline-none placeholder:italic placeholder:font-normal placeholder:lowercase tracking-tight"
                      placeholder="Nhập tên chính thức trong hồ sơ..."
                    />
                  </div>
                  <div className="space-y-3 font-typewriter">
                    <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Số hiệu định danh</label>
                    <input
                      required
                      type="text"
                      value={formData.customerCode}
                      onChange={(e) => setFormData({ ...formData, customerCode: e.target.value.toUpperCase() })}
                      maxLength={10}
                      className="w-full px-8 py-5 bg-retro-paper border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black text-retro-brick uppercase tracking-widest text-center shadow-inner outline-none"
                      placeholder="MÃ SỐ"
                    />
                    {!editingCustomer && formData.name && (
                      <p className="text-[8px] text-retro-mustard font-black uppercase text-center mt-2 italic opacity-80">Đề xuất tự động từ hệ thống</p>
                    )}
                  </div>
                </div>

                {/* Contact Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 font-typewriter">
                    <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Số hiệu Viễn thông (Phone)</label>
                    <div className="relative">
                      <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20" size={18} strokeWidth={1.5} />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-8 pl-16 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black text-retro-sepia shadow-inner outline-none tracking-tight"
                        placeholder="09xx.xxx.xxx"
                      />
                    </div>
                  </div>
                  <div className="space-y-3 font-typewriter">
                    <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Thư tín Điện tử (Email)</label>
                    <div className="relative">
                      <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20" size={18} strokeWidth={1.5} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-8 pl-16 py-5 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-sm font-black text-retro-sepia shadow-inner outline-none lowercase italic tracking-tight"
                        placeholder="contract@paperartviet.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Address & Notes */}
                <div className="space-y-8">
                  <div className="space-y-3 font-typewriter">
                    <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Tọa độ giao nhận (Logistics Address)</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-6 text-retro-brick/40" size={20} strokeWidth={1.5} />
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-8 pl-18 py-6 bg-white border-2 border-retro-sepia/10 focus:border-retro-sepia transition-all text-[13px] font-bold text-retro-earth h-28 resize-none leading-relaxed font-serif italic outline-none shadow-inner"
                        placeholder="Vui lòng tả thực địa chỉ giao nhận hàng hóa..."
                      />
                    </div>
                  </div>
                  <div className="space-y-3 font-typewriter">
                    <label className="text-[10px] font-black text-retro-earth uppercase tracking-widest ml-1 opacity-60">Ký lục đặc thù / Di bút nhân viên</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-8 py-5 bg-retro-paper/50 border-2 border-dashed border-retro-sepia/10 focus:border-retro-mustard transition-all text-sm font-bold h-24 resize-none italic text-retro-earth/60 font-handwriting outline-none"
                      placeholder="Lưu lại thói quen, sở thích hoặc tiền lệ giao dịch của đối tác..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 mt-16 relative z-10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-5 bg-retro-paper border-2 border-retro-sepia/10 text-[11px] font-black uppercase tracking-[0.2em] text-retro-earth/60 hover:text-retro-sepia hover:border-retro-sepia transition-all font-typewriter order-2 md:order-1 active:scale-95 italic"
                >
                  Quay lại Sổ cái
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-[1.5] py-5 bg-retro-brick text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[4px_4px_0px_#3E272333] hover:bg-retro-sepia transition-all order-1 md:order-2 flex items-center justify-center gap-4 active:scale-95 font-typewriter italic"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={22} strokeWidth={2} /> 
                      {editingCustomer ? 'Xác nhận Hồ sơ' : 'Khởi tạo Đối tác'}
                    </>
                  )}
                </button>
              </div>
            </form>
            <div className="torn-paper-bottom" />
          </div>
        </div>
      )}

    </div>
  );
}
