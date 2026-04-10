"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Option {
  id: string;
  label: string;
  sublabel?: string;
  searchTerms?: string[];
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: Option[];
  onSelect: (id: string) => void;
  placeholder: string;
  icon?: React.ReactNode;
  className?: string;
}

export function SearchableSelect({ options, onSelect, placeholder, icon, className }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const label = opt.label?.toLowerCase() || '';
    const sublabel = opt.sublabel?.toLowerCase() || '';
    const extra = (opt.searchTerms || []).join(' ').toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return label.includes(search) || 
           sublabel.includes(search) || 
           extra.includes(search);
  });

  return (
    <div className={cn("relative group/field", className)} ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-16 pl-16 pr-12 bg-white border-[2.5px] border-black rounded-xl flex items-center cursor-pointer font-black text-black tracking-tight transition-all uppercase shadow-neo-sm overflow-hidden",
          isOpen ? "shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ring-2 ring-black/5" : "hover:border-neo-purple"
        )}
      >
        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors">
          {icon || <Search size={24} />}
        </div>
        <span className={cn("truncate", !searchTerm && "text-black/40")}>
          {placeholder}
        </span>
        <ChevronDown size={24} strokeWidth={3} className={cn("absolute right-6 top-1/2 -translate-y-1/2 text-black transition-transform duration-300", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white border-[2.5px] border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[600] overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b-[2.5px] border-black bg-neo-purple/5">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20" size={18} />
              <input
                autoFocus
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border-[2px] border-black rounded-xl font-bold text-sm outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black/20 hover:text-black"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.id}
                  disabled={opt.disabled}
                  onClick={() => {
                    if (!opt.disabled) {
                      onSelect(opt.id);
                      setIsOpen(false);
                      setSearchTerm('');
                    }
                  }}
                  className={cn(
                    "w-full px-6 py-4 flex flex-col items-start gap-1 transition-all border-b border-black/5 last:border-0 text-left",
                    opt.disabled ? "opacity-30 grayscale cursor-not-allowed bg-black/5" : "hover:bg-neo-purple/10 active:bg-neo-purple/20"
                  )}
                >
                  <span className="font-black text-xs uppercase tracking-tight text-black flex items-center gap-2">
                    {opt.label}
                    {opt.disabled && <Check size={14} className="text-black" />}
                  </span>
                  {opt.sublabel && (
                    <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest italic">{opt.sublabel}</span>
                  )}
                </button>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20 italic">Không tìm thấy kết quả</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
