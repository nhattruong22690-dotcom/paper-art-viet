'use client';

import dynamic from 'next/dynamic';
import { Layers, PackageSearch, FilePlus, PlayCircle } from 'lucide-react';

const MermaidDiagram = dynamic(() => import('@/components/common/MermaidDiagram'), {
  ssr: false, // Must be client-side only
});

export default function ProcessGuidePage() {
  const chartData = `
    graph LR
      A[Định mức vật tư - BOM] --> B[Danh mục Sản phẩm]
      B --> C[Tạo Đơn hàng]
      C --> D[Lệnh sản xuất]
      
      style A fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
      style B fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#166534
      style C fill:#fef9c3,stroke:#eab308,stroke-width:2px,color:#854d0e
      style D fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px,color:#0369a1
  `;

  const processSteps = [
    {
      title: 'Định mức vật tư (BOM)',
      description: 'Thiết lập danh sách nguyên liệu và định mức tiêu hao cho từng sản phẩm.',
      icon: <Layers className="w-5 h-5 text-blue-500" />,
      color: 'bg-blue-500/5 border-blue-500/10 text-blue-900'
    },
    {
      title: 'Danh mục Sản phẩm',
      description: 'Quản lý thông tin chi tiết các loại thiệp và sản phẩm giấy gia công.',
      icon: <PackageSearch className="w-5 h-5 text-emerald-500" />,
      color: 'bg-emerald-500/5 border-emerald-500/10 text-emerald-900'
    },
    {
      title: 'Tạo Đơn hàng',
      description: 'Tiếp nhận yêu cầu từ khách hàng và khởi tạo dữ liệu đơn hàng mới.',
      icon: <FilePlus className="w-5 h-5 text-amber-600" />,
      color: 'bg-amber-500/5 border-amber-500/10 text-amber-900'
    },
    {
      title: 'Lệnh sản xuất',
      description: 'Chuyển đổi thông tin đơn hàng thành lệnh sản xuất để phân bổ tài nguyên.',
      icon: <PlayCircle className="w-5 h-5 text-sky-500" />,
      color: 'bg-sky-500/5 border-sky-500/10 text-sky-900'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-20 animate-in fade-in duration-700 space-y-16">
      <div className="bg-neo-purple/10 p-10 rounded-xl border-neo border-black shadow-neo text-center relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-neo-yellow/20 rounded-full blur-3xl" />
        
        <h1 className="text-5xl font-black text-black mb-4 tracking-tighter uppercase italic leading-none">
          Cẩm nang <span className="text-neo-purple underline decoration-black decoration-4">Quy trình</span>
        </h1>
        <p className="text-black/60 text-lg font-bold italic uppercase tracking-tight">Hợp lý hóa luồng công việc từ BOM đến Lệnh sản xuất</p>
      </div>

      <div className="neo-card !p-0 overflow-hidden border-4 bg-white shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <div className="p-12 md:p-20 border-b-4 border-black bg-neo-purple/5 flex justify-center items-center">
          <div className="w-full max-w-3xl transform scale-110">
            <MermaidDiagram chart={chartData} />
          </div>
        </div>
        
        <div className="p-8 md:p-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 bg-white">
          {processSteps.map((step, index) => (
            <div 
              key={index} 
              className="group flex flex-col gap-6 p-8 rounded-2xl border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-xl border-2 border-black bg-neo-purple/20 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:bg-neo-purple transition-all">
                  {step.icon}
                </div>
                <span className="font-black text-[10px] uppercase text-black/30 tracking-[0.3em] italic">Step 0{index + 1}</span>
              </div>
              <div className="space-y-3">
                <h3 className="font-black text-xl leading-none tracking-tight uppercase italic text-black">{step.title}</h3>
                <p className="text-sm text-black/60 leading-relaxed font-bold italic">{step.description}</p>
              </div>
              <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                <div className="h-full bg-black transition-all duration-1000" style={{ width: `${(index + 1) * 25}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pt-8 border-t-4 border-black border-dashed">
         <p className="text-[10px] font-black text-black/20 uppercase tracking-[0.5em] italic">Paper Art Việt • Operational Core Standards • 2026 Ready</p>
      </div>
    </div>
  );
}
