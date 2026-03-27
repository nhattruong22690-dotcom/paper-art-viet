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
  ChevronDown,
  Loader2
} from 'lucide-react';
import dynamic from 'next/dynamic';

const MermaidDiagram = dynamic(() => import('@/components/common/MermaidDiagram'), {
  ssr: false,
});

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
    <div className="flex flex-col lg:flex-row min-h-screen bg-white font-inter">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-[360px] bg-neo-purple/5 border-r-4 border-black flex flex-col h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto z-10 p-8 space-y-10">
        <div className="space-y-8">
          <Link href="/mobile-menu" className="inline-flex items-center gap-3 text-black font-black uppercase tracking-[0.2em] text-[10px] bg-white border-2 border-black px-4 py-2 rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Quay lại Menu</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-4xl font-black text-black tracking-tighter flex items-center gap-3 uppercase italic leading-none">
              Wiki <span className="text-neo-purple underline decoration-black decoration-4">ERP</span>
            </h1>
            <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.3em] italic">Knowledge Core v4.0</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black transition-all" size={20} />
            <input 
              type="text"
              placeholder="TÌM KIẾM WIKI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 h-14 bg-white border-4 border-black rounded-xl text-xs font-black uppercase tracking-tight shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] outline-none focus:shadow-none focus:translate-x-[2px] focus:translate-y-[2px] transition-all"
            />
          </div>

          <nav className="space-y-10">
            <div className="space-y-2">
               <p className="px-2 text-[9px] font-black text-black/30 uppercase tracking-[0.4em] mb-4">Danh mục tài liệu</p>
               <div className="space-y-3">
                 {filteredGuides.map(guide => (
                   <button
                    key={guide.id}
                    onClick={() => setActiveGuideId(guide.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all text-[11px] font-black uppercase tracking-tight text-left border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]",
                      activeGuideId === guide.id 
                      ? 'bg-neo-purple text-black' 
                      : 'bg-white text-black/40 hover:text-black hover:bg-neo-purple/10'
                    )}
                   >
                     <div className="flex items-center gap-3">
                       <Book size={16} className="shrink-0" />
                       <span className="truncate">{guide.title}</span>
                     </div>
                     {activeGuideId === guide.id && <ChevronRight size={16} className="shrink-0" />}
                   </button>
                 ))}
               </div>
            </div>
            
            <div className="pt-10 border-t-4 border-black border-dashed space-y-6">
               <p className="px-2 text-[9px] font-black text-black/30 uppercase tracking-[0.4em]">Bản tin cập nhật</p>
               <div className="space-y-4">
                 {NEWS_UPDATES.map((news, idx) => (
                   <div key={idx} className="p-5 bg-white border-2 border-black rounded-xl space-y-3 group cursor-pointer hover:bg-neo-mint transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-black text-black uppercase tracking-widest px-2 py-1 bg-neo-mint border border-black rounded">{news.category}</span>
                        <span className="text-[8px] text-black/40 font-black italic">{news.date}</span>
                      </div>
                      <p className="text-[11px] font-black text-black leading-snug uppercase tracking-tight">{news.title}</p>
                   </div>
                 ))}
               </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white relative">
        <div className="max-w-4xl mx-auto p-8 lg:p-20 space-y-16">
          {/* Active Guide View */}
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
             <header className="space-y-8 border-b-4 border-black pb-12">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <span className="px-4 py-2 bg-black text-white rounded-lg text-[10px] font-black uppercase tracking-[0.3em] italic shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                    Role: {activeGuide.role}
                  </span>
                  <div className="flex items-center gap-3 text-[10px] text-black/40 font-black uppercase tracking-[0.2em] italic">
                    <Clock size={16} className="text-neo-purple" /> 
                    Updated: {activeGuide.lastUpdated}
                  </div>
                </div>
                
                <h2 className="text-5xl md:text-6xl font-black text-black tracking-tighter leading-none uppercase italic">
                   {activeGuide.title}
                </h2>
                <div className="p-8 bg-neo-purple/10 border-4 border-black rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Bookmark size={100} className="text-black" />
                   </div>
                   <p className="text-lg font-black text-black leading-relaxed italic relative z-10 tracking-tight">
                     "{activeGuide.description}"
                   </p>
                </div>
             </header>

             {/* Steps Section */}
             <div className="space-y-16 mt-16">
                <div className="flex items-center gap-4 text-black">
                   <Info size={24} className="text-neo-purple" />
                   <h3 className="text-[11px] font-black uppercase tracking-[0.4em] italic">Operational Protocol</h3>
                   <div className="h-1 flex-1 bg-black/10" />
                </div>

                <div className="grid gap-12">
                   {activeGuide.steps.map((step, idx) => (
                    <div key={idx} className="group bg-white border-4 border-black rounded-2xl p-8 lg:p-12 hover:bg-neo-purple/[0.02] transition-all duration-500 space-y-10 relative overflow-hidden shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                       <div className="absolute top-0 right-0 p-10 text-[120px] font-black text-black/5 select-none pointer-events-none group-hover:scale-110 transition-transform duration-700 uppercase tracking-tighter italic">
                         {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                       </div>
                       
                       <div className="max-w-2xl space-y-6 relative z-10">
                          <div className="space-y-2">
                            <span className="text-[10px] font-black text-neo-purple uppercase tracking-[0.4em] italic bg-black text-white px-3 py-1 rounded">Module Step {idx + 1}</span>
                            <h4 className="text-3xl font-black text-black tracking-tight uppercase italic leading-none">{step.title}</h4>
                          </div>
                          <p className="text-base text-black/70 leading-relaxed font-bold italic tracking-tight">{step.description}</p>
                          
                          {step.proTip && (
                            <div className="flex gap-6 p-8 bg-neo-yellow border-4 border-black rounded-xl relative group/tip overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                              <div className="w-14 h-14 bg-black text-neo-yellow rounded-xl flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]">
                                <Lightbulb size={28} />
                              </div>
                              <div className="space-y-2">
                                <span className="font-black uppercase tracking-[0.3em] text-[10px] text-black/60 block italic">Expert Insight:</span>
                                <p className="text-base text-black font-black leading-tight uppercase tracking-tight">
                                  {step.proTip}
                                </p>
                              </div>
                            </div>
                          )}
                       </div>

                       {/* Visualization Area */}
                       {step.chartData ? (
                         <div className="bg-black/5 border-4 border-black border-dashed rounded-2xl p-8 overflow-x-auto flex justify-center items-center group-hover:bg-white transition-colors duration-500 shadow-inner">
                           <MermaidDiagram chart={step.chartData} />
                         </div>
                       ) : (
                         <div className="aspect-video bg-neo-purple/5 border-4 border-black rounded-2xl flex items-center justify-center text-black/20 transition-all duration-700 shadow-inner overflow-hidden relative group-hover:bg-white">
                            <div className="flex flex-col items-center gap-4 relative z-10">
                               <div className="w-16 h-16 bg-white border-4 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                 <ExternalLink size={32} className="text-black/30" />
                               </div>
                               <p className="text-[10px] font-black uppercase tracking-[0.4em] italic text-black/40">Visual Reference Payload</p>
                            </div>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
             </div>

             {/* FAQ Section */}
             <div className="space-y-12 pt-20 border-t-4 border-black mt-20 pb-24">
                <div className="flex items-center gap-6">
                   <h3 className="text-[11px] font-black text-black uppercase tracking-[0.4em] italic whitespace-nowrap">Core Diagnostics & FAQ</h3>
                   <div className="h-1 flex-1 bg-black" />
                </div>
                <div className="grid lg:grid-cols-2 gap-8">
                   {activeGuide.faqs.map((faq, idx) => (
                     <div key={idx} className="p-8 bg-white border-4 border-black rounded-2xl hover:bg-neo-mint/10 transition-all space-y-6 group shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                        <div className="flex gap-5">
                          <div className="w-10 h-10 rounded-xl bg-black text-neo-mint flex items-center justify-center shrink-0 shadow-[3px_3px_0px_0px_rgba(255,255,255,0.2)]">
                             <MessageSquare size={20} />
                          </div>
                          <h5 className="font-black text-black text-base leading-tight uppercase tracking-tight italic">{faq.question}</h5>
                        </div>
                        <p className="text-sm text-black/60 leading-relaxed font-bold italic pl-14">
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
