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
  Newspaper
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-retro-paper font-typewriter overflow-hidden">
      {/* Sidebar Navigation - The Index */}
      <aside className="w-full lg:w-[400px] bg-white border-r-2 border-retro-sepia/10 flex flex-col h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto z-10 shadow-2xl scrollbar-hide">
        <div className="p-10 space-y-10">
          <Link href="/" className="flex items-center gap-3 text-retro-earth hover:text-retro-brick transition-all group italic">
            <ArrowLeft size={16} strokeWidth={2.5} className="group-hover:-translate-x-2 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Hoàn nguyên ERP</span>
          </Link>

          <div className="space-y-4 border-b-2 border-retro-sepia/5 pb-8">
            <h1 className="text-3xl font-black text-retro-sepia tracking-tighter flex items-center gap-4 italic uppercase">
              <BookOpen size={28} className="text-retro-brick" strokeWidth={2} />
              Bách khoa <span className="text-retro-brick underline decoration-double underline-offset-4">Wiki</span>
            </h1>
            <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] leading-relaxed opacity-60 italic">Sổ tay Nghị thảo & Vận hành PAV — 1984</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-retro-sepia/20 group-focus-within:text-retro-brick transition-all" size={20} strokeWidth={1.5} />
            <input 
              type="text"
              placeholder="Tra cứu chức danh/ngữ nghĩa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-6 py-4 bg-retro-paper/20 border-2 border-retro-sepia/10 text-xs font-black uppercase text-retro-sepia outline-none focus:border-retro-sepia transition-all shadow-inner placeholder:italic placeholder:font-normal placeholder:lowercase tracking-tight"
            />
          </div>

          <nav className="space-y-10">
            <div className="space-y-3">
               <p className="px-4 text-[10px] font-black text-retro-earth/30 uppercase tracking-[0.3em] mb-6 italic underline decoration-retro-mustard/20 underline-offset-4">Mục lục Chương hồi</p>
               {filteredGuides.map(guide => (
                 <button
                  key={guide.id}
                  onClick={() => setActiveGuideId(guide.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-6 py-4 transition-all text-[11px] font-black uppercase tracking-widest border-2 group italic relative overflow-hidden",
                    activeGuideId === guide.id 
                    ? 'bg-retro-sepia text-retro-paper border-retro-sepia shadow-xl translate-x-2' 
                    : 'bg-white text-retro-earth hover:bg-retro-paper/50 hover:text-retro-sepia border-retro-sepia/5'
                  )}
                 >
                   <div className="flex items-center gap-4 relative z-10">
                     <span className={cn(
                       "w-2 h-2 rotate-45 transition-all duration-500",
                       activeGuideId === guide.id ? 'bg-retro-mustard animate-pulse' : 'bg-retro-sepia/10 group-hover:bg-retro-sepia/40'
                     )} />
                     {guide.title}
                   </div>
                   {activeGuideId === guide.id && <ChevronRight size={16} strokeWidth={2.5} className="text-retro-mustard animate-in slide-in-from-left-2" />}
                   
                   {/* Layout décor for active state */}
                   {activeGuideId === guide.id && (
                     <div className="absolute top-0 left-0 w-1 h-full bg-retro-mustard" />
                   )}
                 </button>
               ))}
            </div>
            
            <div className="pt-10 border-t-2 border-retro-sepia/5 space-y-8">
               <p className="px-4 text-[10px] font-black text-retro-earth/30 uppercase tracking-[0.3em] italic flex items-center gap-3">
                 <Newspaper size={16} strokeWidth={2} /> Cập nhật Sắc lệnh
               </p>
               <div className="space-y-4">
                 {NEWS_UPDATES.map((news, idx) => (
                   <div key={idx} className="p-6 bg-retro-paper/20 border-2 border-retro-sepia/5 space-y-3 group cursor-pointer hover:bg-white hover:border-retro-sepia/10 hover:shadow-xl transition-all rotate-1 hover:rotate-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-retro-brick uppercase tracking-widest italic opacity-80 decoration-retro-brick/20 underline">[{news.category}]</span>
                        <span className="text-[9px] text-retro-earth/40 font-black tabular-nums">{news.date}</span>
                      </div>
                      <p className="text-[11px] font-black text-retro-sepia uppercase leading-relaxed group-hover:text-retro-brick transition-colors italic group-hover:underline">{news.title}</p>
                   </div>
                 ))}
               </div>
            </div>
          </nav>
          
          <div className="py-10 text-center border-t-2 border-retro-sepia/5 opacity-40">
             <Hexagon size={48} strokeWidth={0.5} className="mx-auto text-retro-sepia rotate-12" />
          </div>
        </div>
      </aside>

      {/* Main Content Area - THE MANUSCRIPT */}
      <main className="flex-1 overflow-y-auto bg-retro-paper/40 relative scrollbar-hide">
        {/* Layout Background Decor */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3E2723 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-4xl mx-auto p-10 lg:p-24 space-y-20 relative z-10">
          {/* Active Guide View */}
          <div className="space-y-20 animate-in fade-in slide-in-from-right-8 duration-700">
             <header className="space-y-8 border-b-2 border-retro-sepia/10 pb-16 relative">
                <div className="absolute -top-10 -right-10 p-20 opacity-[0.02] pointer-events-none overflow-hidden">
                   <HelpCircle size={400} strokeWidth={0.5} className="text-retro-sepia" />
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
                  <span className="px-6 py-2 bg-retro-sepia text-retro-paper text-[10px] font-black uppercase tracking-[0.2em] shadow-xl rotate-1 italic">
                    {activeGuide.role}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-retro-earth/40 font-black uppercase tracking-widest italic">
                    <Clock size={14} strokeWidth={2} className="text-retro-mustard" /> 
                    Ghi chép sau cùng: {activeGuide.lastUpdated}
                  </div>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-black text-retro-sepia tracking-tighter uppercase italic leading-tight underline decoration-retro-brick/10 underline-offset-8 decoration-8">{activeGuide.title}</h2>
                <p className="text-lg text-retro-earth font-bold leading-relaxed max-w-2xl font-handwriting italic opacity-80 border-l-4 border-retro-mustard/30 pl-8 bg-white/30 p-6 shadow-sm">
                  "{activeGuide.description}"
                </p>
             </header>

             {/* Steps Grid */}
             <div className="space-y-16">
                <h3 className="text-[11px] font-black text-retro-earth uppercase tracking-[0.4em] border-b-2 border-dashed border-retro-sepia/20 pb-6 italic opacity-40">Diễn trình Vận hành</h3>
                <div className="grid gap-12">
                   {activeGuide.steps.map((step, idx) => (
                    <div key={idx} className="group bg-white border-2 border-retro-sepia/10 p-12 lg:p-16 hover:shadow-2xl hover:border-retro-sepia/20 transition-all duration-500 space-y-12 overflow-hidden relative shadow-lg">
                       <div className="washi-tape-top" />
                       <div className="absolute top-0 right-0 p-16 text-9xl font-black text-retro-sepia/5 select-none pointer-events-none italic tabular-nums -rotate-3 group-hover:scale-110 transition-transform duration-700">
                         {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                       </div>
                       
                       <div className="max-w-2xl space-y-8 relative z-10">
                          <div className="space-y-3">
                            <span className="text-[10px] font-black text-retro-brick uppercase tracking-[0.3em] italic border-b-2 border-retro-brick/20 pb-1">Công thu thứ {idx + 1}</span>
                            <h4 className="text-3xl font-black text-retro-sepia tracking-tighter uppercase italic underline decoration-retro-mustard/20 underline-offset-4">{step.title}</h4>
                          </div>
                          <p className="text-base text-retro-earth leading-relaxed font-bold italic opacity-70 group-hover:opacity-100 transition-opacity">{step.description}</p>
                          
                          {step.proTip && (
                            <div className="flex gap-6 p-8 bg-retro-paper border-2 border-retro-mustard/20 shadow-inner relative group/tip overflow-hidden">
                              <div className="absolute -bottom-4 -right-4 opacity-10 group-hover/tip:opacity-20 transition-all">
                                <Lightbulb size={100} strokeWidth={1} className="text-retro-mustard" />
                              </div>
                              <div className="w-12 h-12 bg-retro-mustard text-white flex items-center justify-center shadow-xl rotate-12 group-hover/tip:rotate-0 transition-transform shrink-0">
                                <Lightbulb size={24} strokeWidth={2.5} />
                              </div>
                              <div className="space-y-3 pt-1">
                                <span className="font-black uppercase tracking-[0.2em] text-[10px] text-retro-earth/60 italic block">Mẹo vận hành Chuyên thủ:</span>
                                <p className="text-sm text-retro-sepia font-black italic leading-relaxed uppercase tracking-tight">
                                  {step.proTip}
                                </p>
                              </div>
                            </div>
                          )}
                       </div>

                       {/* Mock Image Placeholder */}
                       <div className="aspect-video bg-retro-paper/20 border-2 border-retro-sepia/10 flex items-center justify-center text-retro-earth/30 group-hover:scale-[1.01] transition-transform duration-700 shadow-inner group-hover:bg-white overflow-hidden relative grayscale group-hover:grayscale-0">
                          <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#3E2723 1px, transparent 1px), linear-gradient(90deg, #3E2723 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
                          <div className="flex flex-col items-center gap-4 relative z-10">
                             <div className="w-20 h-20 bg-white border-2 border-retro-sepia/10 flex items-center justify-center shadow-[4px_4px_0px_#3E272311] rotate-6 group-hover:rotate-0 transition-all">
                               <ExternalLink size={28} className="text-retro-sepia/40" strokeWidth={1.5} />
                             </div>
                             <p className="text-[11px] font-black uppercase tracking-[0.2em] italic opacity-60">Thụy đồ chức năng đang thụ pháp...</p>
                          </div>
                          {/* Layout décor */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-retro-brick/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="washi-tape-top opacity-20" />
                       </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* FAQ Section */}
             <div className="space-y-16 pt-20 border-t-4 border-double border-retro-sepia/10">
                <div className="flex items-center gap-6">
                  <h3 className="text-[11px] font-black text-retro-brick uppercase tracking-[0.4em] whitespace-nowrap italic underline underline-offset-8">Vấn nghi Thường gặp</h3>
                  <div className="h-[2px] bg-retro-sepia/10 w-full" />
                </div>
                <div className="grid lg:grid-cols-2 gap-10">
                   {activeGuide.faqs.map((faq, idx) => (
                     <div key={idx} className="p-10 bg-white border-2 border-retro-sepia/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all space-y-6 group relative overflow-hidden rotate-1 hover:rotate-0">
                        <div className="absolute -top-4 -right-4 w-12 h-12 bg-retro-paper opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rotate-45 border-2 border-retro-sepia/10">
                           <Bookmark size={20} className="text-retro-mustard" strokeWidth={2.5} />
                        </div>
                        <div className="flex gap-5">
                          <MessageSquare size={20} className="text-retro-brick shrink-0 mt-1" strokeWidth={2.5} />
                          <h5 className="font-black text-retro-sepia text-[15px] leading-snug italic uppercase underline decoration-retro-mustard/20 decoration-dashed underline-offset-4">{faq.question}</h5>
                        </div>
                        <p className="text-xs text-retro-earth leading-relaxed font-bold italic opacity-60 pl-10 border-l-2 border-retro-sepia/5">{faq.answer}</p>
                     </div>
                   ))}
                </div>
             </div>

             <div className="flex flex-col items-center py-20 opacity-20 italic">
                <div className="w-16 h-[2px] bg-retro-sepia mb-8" />
                <p className="text-[10px] font-black text-retro-earth uppercase tracking-[0.6em]">Hoàn chương</p>
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
       <div className="min-h-screen bg-retro-paper flex flex-col items-center justify-center font-typewriter italic gap-8 p-20 text-center">
          <div className="w-16 h-16 border-4 border-retro-sepia/10 border-t-retro-brick animate-spin" />
          <p className="text-[11px] font-black text-retro-earth uppercase tracking-[0.4em] animate-pulse">Đang rà soát Bách khoa Toàn thư...</p>
       </div>
    }>
      <GuideContent />
    </Suspense>
  );
}
