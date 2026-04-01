"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Loader2,
  Settings2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HRConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HRConfigModal({ isOpen, onClose }: HRConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'dept' | 'pos'>('dept');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadItems();
    }
  }, [isOpen, activeTab]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'dept' ? '/api/hr/departments' : '/api/hr/positions';
      const res = await fetch(endpoint);
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setIsSubmitting(true);
    try {
      const endpoint = activeTab === 'dept' ? '/api/hr/departments' : '/api/hr/positions';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName })
      });
      if (res.ok) {
        setNewItemName('');
        loadItems();
      }
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    setIsSubmitting(true);
    try {
      const endpoint = activeTab === 'dept' ? `/api/hr/departments/${id}` : `/api/hr/positions/${id}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName })
      });
      if (res.ok) {
        setEditingId(null);
        loadItems();
      }
    } catch (error) {
      console.error('Failed to update item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      const endpoint = activeTab === 'dept' ? `/api/hr/departments/${id}` : `/api/hr/positions/${id}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        loadItems();
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white border-[2.5px] border-black rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden flex flex-col animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b-[2.5px] border-black flex justify-between items-center bg-neo-yellow/20 px-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-neo-sm">
                <Settings2 size={24} strokeWidth={3} />
             </div>
             <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Cơ cấu tổ chức</h2>
                <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-0.5">Manage Organizational Structure</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors border-2 border-transparent hover:border-black">
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-black">
           <button 
             onClick={() => setActiveTab('dept')}
             className={cn(
               "flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all",
               activeTab === 'dept' ? "bg-black text-white" : "bg-white text-black/40 hover:bg-black/5"
             )}
           >
              <Building2 size={16} />
              Phòng ban
           </button>
           <button 
             onClick={() => setActiveTab('pos')}
             className={cn(
               "flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all border-l-2 border-black",
               activeTab === 'pos' ? "bg-black text-white" : "bg-white text-black/40 hover:bg-black/5"
             )}
           >
              <Briefcase size={16} />
              Chức vụ
           </button>
        </div>

        <div className="p-10 space-y-8 min-h-[400px] flex flex-col">
           
           {/* Add Form */}
           <form onSubmit={handleAdd} className="flex gap-3">
              <input 
                type="text" 
                placeholder={activeTab === 'dept' ? "Tên phòng ban mới..." : "Tên chức vụ mới..."}
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                className="form-input flex-1 h-14 text-sm font-bold"
              />
              <button 
                type="submit"
                disabled={isSubmitting || !newItemName.trim()}
                className="btn-primary w-14 h-14 p-0 flex items-center justify-center shrink-0"
              >
                {isSubmitting ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} strokeWidth={3} />}
              </button>
           </form>

           {/* List */}
           <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-3 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                   <Loader2 className="w-8 h-8 animate-spin text-black opacity-10" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-20 text-center opacity-20 italic text-[10px] font-black uppercase tracking-widest">
                   No {activeTab === 'dept' ? 'departments' : 'positions'} found
                </div>
              ) : (
                items.map(item => (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-4 bg-white border-2 border-black rounded-xl shadow-neo-sm group hover:bg-black/5 transition-all"
                  >
                    {editingId === item.id ? (
                      <input 
                        autoFocus
                        className="flex-1 bg-transparent border-none focus:ring-0 font-bold text-sm"
                        value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleUpdate(item.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                    ) : (
                      <span className="flex-1 font-bold text-sm">{item.name}</span>
                    )}

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       {editingId === item.id ? (
                         <button 
                           onClick={() => handleUpdate(item.id)}
                           className="w-8 h-8 rounded-lg bg-neo-green border-2 border-black flex items-center justify-center text-black shadow-neo-sm active:translate-y-0.5 active:shadow-none"
                         >
                            <Check size={14} strokeWidth={3} />
                         </button>
                       ) : (
                         <button 
                           onClick={() => {
                             setEditingId(item.id);
                             setEditingName(item.name);
                           }}
                           className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center text-black/20 hover:text-black shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all"
                         >
                            <Edit2 size={14} strokeWidth={3} />
                         </button>
                       )}
                       <button 
                         onClick={() => handleDelete(item.id)}
                         className="w-8 h-8 rounded-lg bg-white border-2 border-neo-red flex items-center justify-center text-neo-red/20 hover:text-neo-red hover:bg-neo-red/5 shadow-neo-sm active:translate-y-0.5 active:shadow-none transition-all"
                       >
                          <Trash2 size={14} strokeWidth={3} />
                       </button>
                    </div>
                  </div>
                ))
              )}
           </div>

        </div>

        <div className="p-8 bg-gray-50 border-t-2 border-black flex items-center justify-between px-10">
           <div className="text-[9px] font-black uppercase tracking-widest text-black/30 italic">
              Changes will reflect in employee forms immediately
           </div>
           <button 
             onClick={onClose}
             className="px-8 py-3 rounded-xl border-2 border-black font-black text-[10px] uppercase tracking-widest bg-white shadow-neo-sm hover:shadow-neo active:translate-y-0.5 transition-all"
           >
              Xong
           </button>
        </div>

      </div>
    </div>
  );
}
