"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users, Plus, Filter, Search, Phone, MapPin,
  Building2, Trash2, Mail, FileText,
  AlertCircle, X, ChevronRight, UserPlus,
  ChevronDown, ChevronUp, Edit3, Loader2,
  ExternalLink, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  totalOrders: number;
  inProductionCount: number;
  completedCount: number;
}

export default function CustomersPage() {
  const { showToast, showModal, confirm } = useNotification();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setExpandedIds((prev: Set<string>) => {
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
    setFormData((prev: any) => ({
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

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Check if the mandatory column "Tên" or "Name" exists in the sheet headers
        const headers = Object.keys(data[0] || {});
        const nameColumnExists = headers.some(h => 
          ['Tên', 'Họ tên', 'Name', 'Customer Name', 'Tên KH'].includes(h)
        );

        if (!nameColumnExists) {
          showModal('error', 'Thiếu cột bắt buộc', 'File Excel của bạn phải có cột "Tên" hoặc "Name".');
          setIsLoading(false);
          return;
        }

        // Map fields and allow empty names if other info exists
        const mappedCustomers = data.map((row: any) => {
          const name = row['Tên'] || row['Họ tên'] || row['Name'] || row['Customer Name'] || row['Tên KH'] || '';
          const customerCode = row['Mã'] || row['Mã KH'] || row['Code'] || row['Customer Code'] || row['Mã định danh'] || '';
          const phone = row['SĐT'] || row['Điện thoại'] || row['Phone'] || row['Số điện thoại'] || '';
          const email = row['Email'] || row['Thư điện tử'] || '';
          const address = row['Địa chỉ'] || row['Address'] || row['Địa chỉ giao nhận'] || '';
          const notes = row['Ghi chú'] || row['Notes'] || row['Ghi chú vận hành'] || '';

          return { name, customerCode, phone, email, address, notes };
        }).filter(c => c.name || c.customerCode || c.phone || c.email); // Keep if any info exists

        if (mappedCustomers.length === 0) {
          showModal('error', 'Không tìm thấy dữ liệu', 'File Excel không có dữ liệu khách hàng hợp lệ.');
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const res = await fetch('/api/customers/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customers: mappedCustomers })
        });

        if (res.ok) {
          showToast('success', `Đã nhập thành công ${mappedCustomers.length} khách hàng`);
          fetchCustomers();
        } else {
          const err = await res.json();
          showModal('error', 'Lỗi khi nhập Excel', err.error);
        }
      } catch (err) {
        showModal('error', 'Lỗi phân tích file', String(err));
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportExcel = () => {
    if (customers.length === 0) {
      showToast('error', 'Không có dữ liệu để xuất');
      return;
    }

    const exportData = customers.map(c => ({
      'Mã KH': c.customerCode || '',
      'Tên khách hàng': c.name,
      'Số điện thoại': c.phone || '',
      'Email': c.email || '',
      'Địa chỉ': c.address || '',
      'Ghi chú': c.notes || '',
      'Tổng đơn': c.totalOrders,
      'Đang sản xuất': c.inProductionCount,
      'Đã hoàn thành': c.completedCount
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Danh sách khách hàng");
    XLSX.writeFile(wb, `Danh_sach_khach_hang_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('success', 'Đã xuất file Excel thành công');
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Tên khách hàng': 'Công ty TNHH Nghệ Thuật Giấy Việt',
        'Mã KH': 'PAV',
        'Số điện thoại': '0281234567',
        'Email': 'contact@paperartviet.com',
        'Địa chỉ': '123 Đường Số 1, Quận 1, TP.HCM',
        'Ghi chú': 'Khách hàng VIP'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Nhập Khách Hàng");
    XLSX.writeFile(wb, "Template_Nhap_Khach_Hang.xlsx");
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 neo-card !flex-col md:!flex-row justify-between items-start md:items-center gap-6 bg-neo-purple/10">
          <div>
            <nav className="flex items-center gap-2 text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">
              <Building2 size={14} strokeWidth={3} />
              <span>Hệ thống</span>
              <ChevronRight size={12} strokeWidth={3} />
              <span className="text-purple-600 bg-white px-2 py-0.5 rounded-lg border border-black/10">Hồ sơ khách hàng</span>
            </nav>
            <h1 className="text-3xl font-bold text-foreground tracking-tight uppercase font-space">
              Quản lý <span className="text-purple-500">Đối tác</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
            />
            
            <div className="flex items-center gap-2 bg-white/50 p-1.5 rounded-xl border border-black/5 shadow-neo-active">
              <button
                onClick={downloadTemplate}
                className="h-10 px-4 bg-white border-neo border-black rounded-lg flex items-center gap-2 hover:bg-neo-purple/10 hover:translate-x-[1px] hover:translate-y-[1px] transition-all shadow-neo-active"
                title="Tải file mẫu để nhập liệu"
              >
                <FileText size={16} className="text-black/40" />
                <span className="font-space uppercase tracking-widest text-[9px] font-black">Mẫu</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-10 px-4 bg-neo-mint border-neo border-black rounded-lg flex items-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] transition-all shadow-neo-active"
              >
                <Plus size={16} strokeWidth={3} />
                <span className="font-space uppercase tracking-widest text-[9px] font-black">Nhập Excel</span>
              </button>

              <button
                onClick={handleExportExcel}
                className="h-10 px-4 bg-neo-yellow border-neo border-black rounded-lg flex items-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] transition-all shadow-neo-active"
              >
                <FileSpreadsheet size={16} />
                <span className="font-space uppercase tracking-widest text-[9px] font-black">Xuất Excel</span>
              </button>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="btn-primary gap-3 shadow-neo hover:translate-x-[2px] hover:translate-y-[2px] transition-all h-12"
            >
              <UserPlus size={20} strokeWidth={3} /> <span className="font-space uppercase tracking-widest text-[10px] font-black">Thêm khách hàng</span>
            </button>
          </div>
        </div>

        <div className="neo-card !p-6 flex flex-col justify-center items-center text-center bg-neo-mint shadow-neo-active">
          <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] mb-2">Tổng KH</span>
          <span className="text-4xl font-bold text-black tabular-nums font-space">{customers.length}</span>
        </div>
      </div>

      {/* Sticky Filters & Alphabet */}
      <div className="neo-card !p-5 sticky top-4 z-30 shadow-neo flex flex-col gap-5 bg-white">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 group-focus-within:text-black transition-colors" size={20} />
            <input
              type="text"
              placeholder="TÌM KIẾM THEO TÊN HOẶC MÃ KHÁCH HÀNG..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input pl-12 h-12 w-full font-bold uppercase placeholder:font-normal placeholder:normal-case shadow-neo-active focus:shadow-neo"
            />
          </div>
          <button className="btn-secondary gap-3 w-full md:w-auto justify-center bg-neo-yellow">
            <Filter size={20} strokeWidth={3} /> <span className="font-space uppercase tracking-widest text-xs">Bộ lọc</span>
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {alphabet.map(letter => {
            const hasData = groupedCustomers[letter];
            return (
              <button
                key={letter}
                disabled={!hasData}
                onClick={() => scrollToLetter(letter)}
                className={cn(
                  "min-w-[32px] h-8 text-[11px] font-black rounded-lg flex items-center justify-center transition-all border-neo",
                  hasData
                    ? 'bg-neo-purple/20 text-black border-black shadow-neo-active hover:bg-neo-purple hover:shadow-neo'
                    : 'text-black/10 border-transparent'
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
        <div className="py-40 flex flex-col items-center justify-center gap-6 text-black/30">
          <Loader2 size={48} className="animate-spin text-black opacity-20" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Đang đồng bộ dữ liệu khách hàng...</p>
        </div>
      ) : availableLetters.length === 0 ? (
        <div className="neo-card !p-32 flex flex-col items-center justify-center text-center text-black/20 border-dashed bg-white/50">
          <Users size={64} strokeWidth={1} className="mb-6 opacity-10" />
          <p className="text-xs font-black uppercase tracking-[0.3em]">Không tìm thấy đối tác phù hợp</p>
        </div>
      ) : (
        <div className="space-y-16">
          {availableLetters.map(letter => (
            <div key={letter} id={`group-${letter}`} className="scroll-mt-48 space-y-6">
              <div className="flex items-center gap-6 px-2">
                <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center font-bold text-xl shadow-neo font-space">
                  {letter}
                </div>
                <div className="h-1 flex-1 bg-black/10 rounded-full" />
              </div>

              <div className="grid grid-cols-1 gap-6">
                {groupedCustomers[letter].map((c) => {
                  const isExpanded = expandedIds.has(c.id);
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "neo-card !p-0 overflow-hidden transition-all bg-white",
                        isExpanded ? "ring-4 ring-black/5 bg-neo-purple/5" : ""
                      )}
                    >
                      {/* Card Header/Row */}
                      <div
                        onClick={() => toggleExpand(c.id)}
                        className="p-5 md:p-6 lg:p-8 flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-6 flex-1 min-w-0">
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xs border-neo border-black text-black uppercase transition-all shadow-neo-active",
                            isExpanded ? "bg-black text-white" : "bg-neo-mint group-hover:bg-neo-purple"
                          )}>
                            {c.customerCode || 'N/A'}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xl font-bold text-foreground truncate group-hover:text-purple-600 transition-colors font-space uppercase tracking-tight">{c.name}</h4>
                            <div className="flex items-center gap-6 mt-2">
                              <span className="text-[11px] font-black text-black/60 flex items-center gap-2 uppercase tracking-widest">
                                <Phone size={14} className="text-black/30" /> {c.phone || '---'}
                              </span>
                              <span className="hidden sm:inline-block text-[11px] font-black text-black/60 flex items-center gap-2 uppercase tracking-widest">
                                <Mail size={14} className="text-black/30" /> {c.email || '---'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-8 ml-4 shrink-0">
                          <div className="hidden lg:grid grid-cols-3 gap-10 pr-10 border-r-2 border-black/10">
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-bold text-black tabular-nums font-space">{c.totalOrders}</span>
                              <span className="text-[9px] font-black text-black/40 uppercase tracking-[0.2em]">Tổng đơn</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-bold text-black tabular-nums font-space">{c.inProductionCount}</span>
                              <span className="text-[9px] font-black text-black/40 uppercase tracking-[0.2em]">Đang SX</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-2xl font-bold text-black tabular-nums font-space">{c.completedCount}</span>
                              <span className="text-[9px] font-black text-black/40 uppercase tracking-[0.2em]">Hoàn thành</span>
                            </div>
                          </div>
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center border-neo border-black shadow-neo-active transition-all",
                            isExpanded ? "bg-black text-white" : "bg-white group-hover:bg-neo-yellow"
                          )}>
                            {isExpanded ? <ChevronUp size={24} strokeWidth={3} /> : <ChevronDown size={24} strokeWidth={3} />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Section */}
                      {isExpanded && (
                        <div className="px-8 pb-8 pt-4 border-t-2 border-dashed border-black/10 animate-in slide-in-from-top-4 duration-500">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-6">
                            <div className="space-y-6">
                              <div>
                                <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">Chi tiết Liên hệ</label>
                                <div className="mt-4 space-y-3">
                                  <p className="flex items-center gap-4 text-sm font-bold text-foreground bg-white border-neo border-black p-3 rounded-lg shadow-neo-active">
                                    <Phone size={16} strokeWidth={2.5} className="text-purple-500" /> {c.phone || 'Chưa cập nhật'}
                                  </p>
                                  <p className="flex items-center gap-4 text-sm font-bold text-foreground bg-white border-neo border-black p-3 rounded-lg shadow-neo-active truncate">
                                    <Mail size={16} strokeWidth={2.5} className="text-purple-500" /> {c.email || 'Chưa cập nhật'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-4">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleOpenModal(c); }}
                                  className="btn-secondary !h-12 !px-0 flex-[2] justify-center bg-neo-purple"
                                >
                                  <Edit3 size={18} strokeWidth={2.5} /> <span className="font-space uppercase tracking-widest text-[10px] ml-2">Chỉnh sửa</span>
                                </button>
                                <button
                                  onClick={(e) => handleDelete(e, c.id)}
                                  className="w-12 h-12 bg-neo-red border-neo border-black rounded-xl flex items-center justify-center shadow-neo-active hover:shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                                >
                                  <Trash2 size={20} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>

                            <div className="md:col-span-2 space-y-6">
                              <div>
                                <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">Địa chỉ giao nhận & Logistics</label>
                                <div className="mt-4 p-5 bg-white border-neo border-black rounded-xl shadow-neo-active relative">
                                  <div className="absolute top-4 right-4 w-8 h-8 bg-neo-yellow rounded-lg border-2 border-black shadow-neo-active flex items-center justify-center">
                                    <MapPin size={16} strokeWidth={3} />
                                  </div>
                                  <p className="text-base font-bold text-foreground pr-10 leading-relaxed uppercase font-space">
                                    {c.address || 'Chưa thiết lập tuyến logistics.'}
                                  </p>
                                </div>
                              </div>
                              {c.notes && (
                                <div className="bg-neo-yellow/10 p-6 rounded-xl border-neo border-black shadow-neo-active">
                                  <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] flex items-center gap-3">
                                    <FileText size={14} strokeWidth={3} /> Ghi chú đặc thù
                                  </label>
                                  <p className="mt-4 text-sm font-bold text-black/70 italic leading-relaxed">
                                    " {c.notes} "
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/80 animate-in fade-in duration-300">
          <div className="relative bg-background w-full max-w-2xl rounded-2xl shadow-neo border-neo border-black flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 translate-y-[-20px]">
            <div className="p-8 border-b-neo border-black bg-neo-purple/20 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-foreground font-space uppercase tracking-tight">
                  {editingCustomer ? 'Cập nhật đối tác' : 'Khai báo khách hàng'}
                </h3>
                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-2 flex items-center gap-2">
                  <Building2 size={12} /> Registry Paper Art Việt
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-12 h-12 bg-white border-neo border-black rounded-xl flex items-center justify-center shadow-neo-active hover:shadow-neo hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-8 overflow-y-auto max-h-[75vh]">
              {error && (
                <div className="p-4 bg-neo-red border-neo border-black rounded-xl flex items-center gap-4 text-black text-xs font-black uppercase tracking-widest animate-in slide-in-from-top-2 shadow-neo-active">
                  <AlertCircle size={20} strokeWidth={3} />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Tên khách hàng / Đơn vị</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    className="form-input !h-14 font-bold text-lg"
                    placeholder="NHẬP TÊN CHÍNH THỨC..."
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2 text-center block">Mã định danh</label>
                  <input
                    required
                    type="text"
                    value={formData.customerCode}
                    onChange={(e) => setFormData({ ...formData, customerCode: e.target.value.toUpperCase() })}
                    maxLength={10}
                    className="form-input !h-14 text-center font-bold tracking-[0.3em] text-purple-600 bg-neo-purple/5 border-solid"
                    placeholder="MÃ SỐ"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Đường dây nóng (Phone)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="form-input !h-12 font-bold"
                    placeholder="0XXX XXX XXX"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Thư điện tử (Email)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="form-input !h-12 font-bold"
                    placeholder="EXAMPLE@MAIL.COM"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Địa chỉ giao nhận</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="form-input min-h-[100px] py-4 resize-none font-bold uppercase text-sm"
                  placeholder="KHAI BÁO ĐỊA CHỈ ĐẦY ĐỦ..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] ml-2">Ghi chú vận hành</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="form-input min-h-[80px] py-4 resize-none font-bold italic bg-neo-yellow/5"
                  placeholder="TIỀN LỆ GIAO DỊCH, SỞ THÍCH ĐỐI TÁC..."
                />
              </div>

              <div className="flex gap-6 pt-6 border-t-2 border-dashed border-black/10 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary flex-1 !h-14 justify-center bg-white shadow-neo-active hover:shadow-neo"
                >
                  <span className="font-space uppercase tracking-widest">Hủy bỏ</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-[1.5] !h-14 justify-center shadow-neo-active hover:shadow-neo"
                >
                  {isLoading ? <Loader2 size={24} className="animate-spin" /> : (
                    <>
                      <UserPlus size={24} strokeWidth={3} className="mr-3" />
                      <span className="font-space uppercase tracking-widest">{editingCustomer ? 'Cập nhật hồ sơ' : 'Khởi tạo khách hàng'}</span>
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
