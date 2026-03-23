"use client";

import React, { useState, useEffect } from 'react';
import { HelpCircle, X, ExternalLink, ChevronRight, Lightbulb, MessageSquare, Clock } from 'lucide-react';
import { GUIDE_DATA, GuideSection } from '@/data/guide';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

interface HelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpDrawer({ isOpen, onClose }: HelpDrawerProps) {
  const pathname = usePathname();
  const [relevantGuides, setRelevantGuides] = useState<GuideSection[]>([]);

  useEffect(() => {
    // Find guides that match the current route or are 'Chung'
    const matches = GUIDE_DATA.filter(guide => 
      guide.routeHints?.some(hint => pathname.startsWith(hint)) || guide.role === 'Chung'
    );
    setRelevantGuides(matches);
  }, [pathname]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-screen shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-primary-50/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 text-primary-600 rounded-xl">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="font-black text-gray-900 uppercase tracking-tight">Trợ giúp nhanh</h3>
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">Hướng dẫn vận hành ERP</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full text-gray-400 hover:text-gray-900 transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {relevantGuides.length > 0 ? (
            relevantGuides.map(guide => (
              <section key={guide.id} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-black text-gray-900 text-sm tracking-tight">{guide.title}</h4>
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase tracking-widest">
                        {guide.role}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-gray-400 font-medium italic">
                        <Clock size={10} /> Cập nhật: {guide.lastUpdated}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {guide.steps.map((step, idx) => (
                    <div key={idx} className="group p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50 hover:bg-white hover:border-primary-100 hover:shadow-xl hover:shadow-primary-50/50 transition-all">
                      <p className="text-[10px] font-black text-primary-500 uppercase tracking-tighter mb-1">Bước {idx + 1}</p>
                      <h5 className="font-bold text-gray-800 text-xs mb-2 leading-relaxed">{step.title}</h5>
                      <p className="text-[11px] text-gray-500 leading-relaxed mb-3">{step.description}</p>
                      {step.proTip && (
                        <div className="flex gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100/50">
                          <Lightbulb size={14} className="text-amber-500 shrink-0" />
                          <p className="text-[10px] text-amber-700 italic leading-snug">
                            <span className="font-black not-italic">Mẹo:</span> {step.proTip}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* FAQ Snippet */}
                {guide.faqs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                      <MessageSquare size={12} />
                      <span>Câu hỏi thường gặp</span>
                    </div>
                    {guide.faqs.slice(0, 2).map((faq, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-100 rounded-xl space-y-1">
                        <p className="text-[11px] font-bold text-gray-800 leading-tight">Q: {faq.question}</p>
                        <p className="text-[10px] text-gray-500 leading-relaxed">A: {faq.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Link 
                  href={`/guide?id=${guide.id}`}
                  className="flex items-center justify-center gap-2 w-full py-3 border border-gray-100 rounded-xl text-[10px] font-black text-gray-500 hover:bg-gray-50 hover:text-primary-600 transition-all uppercase tracking-widest"
                >
                  Xem hướng dẫn đầy đủ <ExternalLink size={12} />
                </Link>
                <div className="h-px bg-gray-50 w-full" />
              </section>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-20">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                <HelpCircle size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Cần giúp đỡ?</p>
                <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">Không tìm thấy hướng dẫn khớp với trang này. Bạn có thể xem toàn bộ Wiki.</p>
              </div>
              <Link 
                href="/guide"
                className="px-6 py-3 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary-200 hover:translate-y-[-2px] transition-all"
              >
                Truy cập Wiki ERP
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100">
          <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-[2px]">
            Hệ thống quản trị Paper Art Việt &copy; 2026
          </p>
        </div>
      </div>
    </div>
  );
}
