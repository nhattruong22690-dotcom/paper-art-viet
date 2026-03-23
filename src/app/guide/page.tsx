"use client";

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { 
  Search, 
  ChevronRight, 
  ExternalLink, 
  Lightbulb, 
  MessageSquare, 
  Clock, 
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { GUIDE_DATA, NEWS_UPDATES, GuideSection } from '@/data/guide';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function GuideContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FDFDFD]">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-80 bg-white border-r border-gray-100 flex flex-col h-auto lg:h-screen lg:sticky lg:top-0 overflow-y-auto">
        <div className="p-8 space-y-8">
          <Link href="/" className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Quay lại ERP</span>
          </Link>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen size={24} className="text-primary-600" />
              Wiki Hệ thống
            </h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">Hướng dẫn vận hành Paper Art Việt</p>
          </div>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-600 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Tìm câu hỏi/chức năng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500 transition-all"
            />
          </div>

          <nav className="space-y-6">
            <div className="space-y-1">
               <p className="px-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Các danh mục</p>
               {filteredGuides.map(guide => (
                 <button
                  key={guide.id}
                  onClick={() => setActiveGuideId(guide.id)}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    activeGuideId === guide.id 
                    ? 'bg-primary-600 text-white shadow-xl shadow-primary-200 ring-4 ring-primary-50' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                  }`}
                 >
                   <div className="flex items-center gap-3">
                     <span className={`w-1.5 h-1.5 rounded-full ${activeGuideId === guide.id ? 'bg-white animate-pulse' : 'bg-gray-200'}`} />
                     {guide.title}
                   </div>
                   <ChevronRight size={14} className={activeGuideId === guide.id ? 'opacity-100' : 'opacity-0'} />
                 </button>
               ))}
            </div>
            
            <div className="pt-6 border-t border-gray-50">
               <p className="px-4 text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] mb-4">Cập nhật mới nhất</p>
               <div className="space-y-3">
                 {NEWS_UPDATES.map((news, idx) => (
                   <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 space-y-2 group cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-gray-100/50 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-primary-500 uppercase tracking-widest">[{news.category}]</span>
                        <span className="text-[9px] text-gray-400 font-bold">{news.date}</span>
                      </div>
                      <p className="text-[10px] font-black text-gray-800 uppercase leading-snug group-hover:text-primary-600 transition-colors">{news.title}</p>
                   </div>
                 ))}
               </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-white lg:bg-[#FDFDFD]">
        <div className="max-w-4xl mx-auto p-6 lg:p-20 space-y-12">
          {/* Active Guide View */}
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                    {activeGuide.role}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                    <Clock size={12} /> Cập nhật lần cuối: {activeGuide.lastUpdated}
                  </div>
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{activeGuide.title}</h2>
                <p className="text-lg text-gray-500 font-medium leading-relaxed max-w-2xl">{activeGuide.description}</p>
             </header>

             {/* Steps Grid */}
             <div className="space-y-12">
                <h3 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] border-b border-gray-50 pb-4">Các bước thực hiện</h3>
                <div className="grid gap-8">
                  {activeGuide.steps.map((step, idx) => (
                    <div key={idx} className="group bg-white rounded-[40px] border border-gray-100 p-8 lg:p-12 hover:shadow-2xl hover:shadow-primary-100/30 transition-all duration-500 space-y-8 overflow-hidden relative">
                       <div className="absolute top-0 right-0 p-12 text-8xl font-black text-gray-50/50 select-none pointer-events-none italic">
                         0{idx + 1}
                       </div>
                       
                       <div className="max-w-xl space-y-6 relative z-10">
                          <div className="space-y-2">
                            <span className="text-xs font-black text-primary-600 uppercase tracking-widest">Bước {idx + 1}</span>
                            <h4 className="text-2xl font-black text-gray-900 tracking-tight">{step.title}</h4>
                          </div>
                          <p className="text-base text-gray-500 leading-relaxed font-medium">{step.description}</p>
                          
                          {step.proTip && (
                            <div className="flex gap-4 p-6 bg-primary-50/50 rounded-3xl border border-primary-100/30">
                              <Lightbulb className="text-primary-600 shrink-0 mt-1" size={24} />
                              <p className="text-sm text-primary-900 font-medium leading-relaxed">
                                <span className="font-black uppercase tracking-widest text-[10px] block mb-1">Mẹo vận hành:</span>
                                {step.proTip}
                              </p>
                            </div>
                          )}
                       </div>

                       {/* Mock Image Placeholder */}
                       <div className="aspect-video bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-center text-gray-400 group-hover:scale-[1.02] transition-transform duration-500 shadow-inner group-hover:bg-white overflow-hidden relative">
                          <div className="flex flex-col items-center gap-3">
                             <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                               <ExternalLink size={24} className="text-gray-300" />
                             </div>
                             <p className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-300">Tính năng này đang được cập nhật hình ảnh...</p>
                          </div>
                          {/* Sublte gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-tr from-primary-50/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                    </div>
                  ))}
                </div>
             </div>

             {/* FAQ Section */}
             <div className="space-y-12 pt-12">
                <div className="flex items-center gap-4">
                  <h3 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em] whitespace-nowrap">Câu hỏi thường gặp</h3>
                  <div className="h-px bg-gray-50 w-full" />
                </div>
                <div className="grid lg:grid-cols-2 gap-6">
                   {activeGuide.faqs.map((faq, idx) => (
                     <div key={idx} className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-100/50 transition-all space-y-4">
                        <div className="flex gap-3">
                          <MessageSquare size={18} className="text-primary-500 shrink-0" />
                          <h5 className="font-black text-gray-900 text-sm leading-tight italic uppercase">{faq.question}</h5>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium pl-8">{faq.answer}</p>
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
    <Suspense fallback={<div className="p-20 text-center uppercase font-black text-gray-100 tracking-widest animate-pulse">Đang tải hướng dẫn...</div>}>
      <GuideContent />
    </Suspense>
  );
}
