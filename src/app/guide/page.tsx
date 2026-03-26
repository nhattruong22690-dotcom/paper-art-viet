"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { 
  Search, 
  ChevronRight, 
  ExternalLink, 
  Lightbulb, 
  MessageSquare, 
  Clock, 
  ArrowLeft,
  BookOpen,
  Bookmark,
  Hexagon,
  HelpCircle,
  Newspaper,
  Book,
  Info,
  ChevronDown
} from 'lucide-react';
import { GUIDE_DATA, NEWS_UPDATES } from '@/data/guide';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function GuideContent() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGuideId, setActiveGuideId] = useState(GUIDE_DATA[0].id);

  // Get active ID from URL if present
  useEffect(() => {
    const id = searchParams.get('id');
    if (id && GUIDE_DATA.find(g => g.id === id)) {
      setActiveGuideId(id);
    }
  }, [searchParams]);

  const activeGuide = useMemo(() => 
    GUIDE_DATA.find(g => g.id === activeGuideId) || GUIDE_DATA[0],
  [activeGuideId]);

  const filteredGuides = useMemo(() => {
    if (!searchTerm) return GUIDE_DATA;
    const lower = searchTerm.toLowerCase();
    return GUIDE_DATA.filter(g => 
      g.title.toLowerCase().includes(lower) || 
      g.description.toLowerCase().includes(lower) ||
      g.steps.some(s => s.title.toLowerCase().includes(lower) || s.description.toLowerCase().includes(lower))
    );
  }, [searchTerm]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-white">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-[320px] bg-gray-50 border-r border-border flex flex-col h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto z-10">
        <div className="p-6 space-y-8">
          <Link href="/mobile-menu" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Quay lại Menu</span>
          </Link>

          <div className="space-y-1">
            <h1 className="text-xl font-black text-foreground tracking-tight flex items-center gap-3">
              <BookOpen size={24} className="text-primary" />
              Wiki <span className="text-primary">ERP</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Trung tâm Hướng dẫn & Vận hành</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-all" size={16} />
            <input 
              type="text"
              placeholder="Tìm kiếm hướng dẫn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 h-10 !bg-white !text-sm"
            />
          </div>

          <nav className="space-y-6">
            <div className="space-y-1">
               <p className="px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-4 opacity-40">Danh mục tài liệu</p>
               {filteredGuides.map(guide => (
                 <button
                  key={guide.id}
                  onClick={() => setActiveGuideId(guide.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-xs font-bold text-left",
                    activeGuideId === guide.id 
                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                    : 'text-muted-foreground hover:bg-white hover:text-primary border border-transparent'
                  )}
                 >
                   <div className="flex items-center gap-3">
                     <Book size={14} className={activeGuideId === guide.id ? 'opacity-100' : 'opacity-40'} />
                     <span className="truncate">{guide.title}</span>
                   </div>
                   {activeGuideId === guide.id && <ChevronRight size={14} className="shrink-0" />}
                 </button>
               ))}
            </div>
            
            <div className="pt-6 border-t border-border space-y-6">
               <p className="px-2 text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">Bản tin cập nhật</p>
               <div className="space-y-3">
                 {NEWS_UPDATES.map((news, idx) => (
                   <div key={idx} className="p-4 bg-white border border-border rounded-xl space-y-2 group cursor-pointer hover:border-primary/50 transition-all shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-primary uppercase tracking-widest px-1.5 py-0.5 bg-blue-50 rounded">{news.category}</span>
                        <span className="text-[8px] text-muted-foreground font-bold">{news.date}</span>
                      </div>
                      <p className="text-[11px] font-bold text-foreground leading-snug group-hover:text-primary transition-colors">{news.title}</p>
                   </div>
                 ))}
               </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white relative">
        <div className="max-w-4xl mx-auto p-6 lg:p-16 space-y-12">
          {/* Active Guide View */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <header className="space-y-6 border-b border-border pb-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest">
                    {activeGuide.role}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    <Clock size={12} className="text-primary" /> 
                    Cập nhật mới nhất: {activeGuide.lastUpdated}
                  </div>
                </div>
                
                <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                   {activeGuide.title}
                </h2>
                <div className="p-5 bg-blue-50/50 border-l-4 border-primary rounded-r-xl">
                   <p className="text-sm font-medium text-blue-900 leading-relaxed italic">
                     "{activeGuide.description}"
                   </p>
                </div>
             </header>

             {/* Steps Section */}
             <div className="space-y-12 mt-12">
                <div className="flex items-center gap-3 text-muted-foreground">
                   <Info size={18} />
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.2em]">Quy trình thực hiện</h3>
                </div>

                <div className="grid gap-8">
                   {activeGuide.steps.map((step, idx) => (
                    <div key={idx} className="group bg-white border border-border rounded-2xl p-6 lg:p-10 hover:shadow-xl hover:border-primary/20 transition-all duration-500 space-y-8 relative overflow-hidden shadow-sm">
                       <div className="absolute top-0 right-0 p-8 text-7xl font-black text-primary/5 select-none pointer-events-none group-hover:scale-110 transition-transform duration-700 uppercase tracking-tighter">
                         {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                       </div>
                       
                       <div className="max-w-2xl space-y-4 relative z-10">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Bước {idx + 1}</span>
                            <h4 className="text-xl font-bold text-foreground tracking-tight">{step.title}</h4>
                          </div>
                          <p className="text-sm text-foreground/70 leading-relaxed font-medium">{step.description}</p>
                          
                          {step.proTip && (
                            <div className="flex gap-4 p-5 bg-emerald-50 border border-emerald-100 rounded-xl relative group/tip overflow-hidden">
                              <div className="w-10 h-10 bg-emerald-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                                <Lightbulb size={20} />
                              </div>
                              <div className="space-y-1">
                                <span className="font-bold uppercase tracking-widest text-[9px] text-emerald-700 block">Mẹo chuyên gia:</span>
                                <p className="text-[13px] text-emerald-900 font-bold leading-relaxed">
                                  {step.proTip}
                                </p>
                              </div>
                            </div>
                          )}
                       </div>

                       {/* Image Placeholder */}
                       <div className="aspect-video bg-gray-50 border border-border rounded-xl flex items-center justify-center text-muted-foreground/30 transition-all duration-700 shadow-inner overflow-hidden relative group-hover:bg-white">
                          <div className="flex flex-col items-center gap-3 relative z-10">
                             <div className="w-12 h-12 bg-white border border-border rounded-xl flex items-center justify-center shadow-sm">
                               <ExternalLink size={20} className="text-muted-foreground/40" />
                             </div>
                             <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Xem hình ảnh minh họa</p>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* FAQ Section */}
             <div className="space-y-10 pt-16 border-t border-border mt-16 pb-20">
                <div className="flex items-center gap-4">
                   <h3 className="text-[10px] font-black text-foreground uppercase tracking-[0.2em] whitespace-nowrap">Câu hỏi thường gặp</h3>
                   <div className="h-px bg-border w-full" />
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                   {activeGuide.faqs.map((faq, idx) => (
                     <div key={idx} className="p-6 bg-gray-50 border border-border rounded-2xl hover:shadow-lg hover:border-primary/20 transition-all space-y-4 group">
                        <div className="flex gap-4">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                             <MessageSquare size={16} />
                          </div>
                          <h5 className="font-bold text-foreground text-sm leading-snug">{faq.question}</h5>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium pl-12">
                           {faq.answer}
                        </p>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function GuidePage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-20 text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Đang nạp dữ liệu Wiki...</p>
       </div>
    }>
      <GuideContent />
    </Suspense>
  );
}
