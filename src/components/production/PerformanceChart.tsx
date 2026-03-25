import { Settings, FileText, AlertTriangle, ShieldCheck, TrendingUp, PieChart as PieChartIcon, Info, ChevronRight, Target } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface EmployeePerformance {
  id: string;
  name: string;
  group: string;
  avatar?: string;
  totalQty: number;
  kpi: number;
  techErrors: number;
  matErrors: number;
  errorNote?: string;
  trend: number[];
}

export default function PerformanceChart({ employee }: { employee: EmployeePerformance }) {
  const totalErrors = employee.techErrors + employee.matErrors;
  const techPct = totalErrors > 0 ? (employee.techErrors / totalErrors) * 100 : 0;
  const matPct = totalErrors > 0 ? (employee.matErrors / totalErrors) * 100 : 0;
  const matQtyPct = (employee.matErrors / employee.totalQty) * 100;
  const isHighMatError = matQtyPct > 3;

  const max = Math.max(...employee.trend, 100);
  
  return (
    <div className="space-y-12 animate-in fade-in duration-700 font-typewriter">
      {/* EMPLOYEE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b-2 border-retro-sepia/10 pb-10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-retro-sepia text-retro-paper flex items-center justify-center font-black text-xl shadow-xl rotate-3">
               {employee.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
            </div>
            <div>
               <h4 className="text-2xl font-black text-retro-sepia uppercase tracking-tighter italic underline decoration-retro-mustard/30 underline-offset-4">{employee.name}</h4>
               <p className="text-[10px] text-retro-earth font-black uppercase tracking-[0.2em] mt-3 flex items-center gap-3 opacity-60">
                 <Target size={14} className="text-retro-mustard" strokeWidth={2} />
                 {employee.group} • Sổ trực 07 Nhật bản
               </p>
            </div>
         </div>
         {isHighMatError && (
           <div className="bg-retro-brick text-white px-6 py-3 shadow-[4px_4px_0px_#3E272333] flex items-center gap-4 animate-pulse rotate-1">
              <AlertTriangle size={18} strokeWidth={2.5} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Cảnh báo Vật chất hồ sơ</span>
           </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* LINE CHART SECTION - THE LEDGER GRAPH */}
        <div className="space-y-8">
          <p className="text-[10px] font-black text-retro-earth uppercase tracking-[0.3em] flex items-center gap-4 italic opacity-60 px-2">
            <TrendingUp size={16} className="text-retro-brick" /> Biểu đồ Biến động Hiệu suất
          </p>
          <div className="relative h-56 bg-white border-2 border-retro-sepia/10 shadow-inner rounded-3xl pt-10 pb-6 group overflow-hidden">
            {/* GRAPH PAPER GRID */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3E2723 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            {/* HORIZONTAL GUIDES */}
            <div className="absolute inset-x-8 top-10 border-t border-retro-sepia/10 h-0" />
            <div className="absolute inset-x-8 top-1/4 mt-2 border-t border-retro-sepia/10 h-0 border-dashed" />
            <div className="absolute inset-x-8 top-1/2 border-t border-retro-sepia/10 h-0 border-dashed" />
            <div className="absolute inset-x-8 top-3/4 border-t border-retro-sepia/10 h-0 border-dashed" />

            {/* Y-AXIS LABELS */}
            <div className="absolute left-4 h-full pt-10 pb-6 flex flex-col justify-between text-[8px] font-black text-retro-earth/40 italic">
               <span>100%</span>
               <span>75%</span>
               <span>50%</span>
               <span>25%</span>
               <span>0%</span>
            </div>

            {/* SVG LINE CHART */}
            <svg className="absolute inset-0 w-full h-full px-12 pt-10 pb-6 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="retroLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B22222" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#B22222" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* AREA UNDER LINE */}
              <path 
                d={`M ${employee.trend.map((val, i) => `${(i / (employee.trend.length - 1)) * 100}%,${100 - (val / max * 100)}%`).join(' L ')} L 100%,100% L 0%,100% Z`}
                fill="url(#retroLineGradient)"
                className="transition-all duration-1000"
              />

              {/* DRAWN LINE */}
              <polyline
                fill="none"
                stroke="#B22222"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={employee.trend.map((val, i) => `${(i / (employee.trend.length - 1)) * 100},${100 - (val / max * 100)}`).join(' ')}
                className="transition-all duration-1000 shadow-sm"
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />

              {/* DATA POINTS */}
              {employee.trend.map((val, i) => (
                <g key={i} className="group/point">
                   <circle 
                     cx={`${(i / (employee.trend.length - 1)) * 100}%`}
                     cy={`${100 - (val / max * 100)}%`}
                     r="5"
                     fill="#F2EBD9"
                     stroke="#3E2723"
                     strokeWidth="2"
                     className="transition-all duration-300 group-hover/point:r-8 cursor-pointer shadow-md"
                   />
                </g>
              ))}
            </svg>

            {/* X-AXIS AND TOOLTIPS */}
            <div className="absolute inset-0 w-full h-full px-12 pt-10 pb-6 flex justify-between pointer-events-none">
              {employee.trend.map((val, i) => (
                <div key={i} className="relative flex-1 flex flex-col items-center group/tip pointer-events-auto">
                   <div className="flex-1 w-full" />
                   <div className="absolute transition-all duration-300 opacity-0 group-hover/tip:opacity-100 translate-y-2 group-hover/tip:translate-y-0" style={{ bottom: `${(val / max * 100) + 4}%` }}>
                     <div className="bg-retro-sepia text-retro-paper text-[10px] font-black px-3 py-1.5 shadow-xl border border-retro-paper/20 whitespace-nowrap mb-2 rotate-2 scale-110">
                        {val}%
                     </div>
                   </div>
                   <p className="mt-4 text-[9px] font-black text-retro-earth/40 absolute -bottom-4 italic">Kỳ {i+1}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ERROR DISTRIBUTION SECTION */}
        <div className="space-y-8">
          <p className="text-[10px] font-black text-retro-earth uppercase tracking-[0.3em] flex items-center gap-4 italic opacity-60 px-2">
            <PieChartIcon size={16} className="text-retro-mustard" /> Phân hạng Khiếm khuyết
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-10 bg-white p-10 border-2 border-retro-sepia/10 shadow-sm group hover:border-retro-sepia/20 transition-all">
             {/* RETRO PIE CHART */}
             <div className="relative w-32 h-32 rounded-full shadow-[inset_0_4px_12px_rgba(62,39,35,0.1)] border-4 border-retro-paper shrink-0 group-hover:scale-110 transition-transform duration-500" style={{
               background: totalErrors > 0 
                ? `conic-gradient(#B22222 0% ${techPct}%, #DAA520 ${techPct}% 100%)`
                : '#F2EBD9'
             }}>
                <div className="absolute inset-8 bg-white rounded-full flex flex-col items-center justify-center shadow-lg border-2 border-retro-sepia/5">
                   <p className="text-lg font-black text-retro-sepia leading-none italic">{totalErrors}</p>
                   <p className="text-[8px] text-retro-earth font-black uppercase mt-1 tracking-widest">Sự vụ</p>
                </div>
             </div>

             <div className="flex flex-col gap-6 flex-1 w-full sm:w-auto">
                <div className="space-y-4">
                   <div className="flex items-center justify-between border-b border-retro-sepia/5 pb-2">
                      <div className="flex items-center gap-4">
                         <div className="w-3 h-3 bg-retro-brick shadow-sm rotate-45" />
                         <span className="text-[10px] font-black text-retro-earth uppercase tracking-widest italic opacity-80">Lỗi Thụ Nhân (🛠️)</span>
                      </div>
                      <span className="text-sm font-black text-retro-brick italic tabular-nums">{techPct.toFixed(0)}%</span>
                   </div>
                   <div className="flex items-center justify-between border-b border-retro-sepia/5 pb-2">
                      <div className="flex items-center gap-4">
                         <div className="w-3 h-3 bg-retro-mustard shadow-sm rotate-45" />
                         <span className="text-[10px] font-black text-retro-earth uppercase tracking-widest italic opacity-80">Lỗi Vật Bối (📄)</span>
                      </div>
                      <span className="text-sm font-black text-retro-mustard italic tabular-nums">{matPct.toFixed(0)}%</span>
                   </div>
                </div>
                
                <p className="text-[9px] text-retro-earth/40 leading-relaxed italic border-l-2 border-retro-mustard/20 pl-4">
                  Phân tích dựa trên Sổ ghi chép Sản xuất & Báo cáo Kiểm duyệt Chất lượng.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* ERROR NOTE - THE MARGINALIA */}
      {employee.errorNote && (
        <div className="bg-retro-paper/40 p-10 border-2 border-dashed border-retro-mustard/30 relative group overflow-hidden">
           <div className="absolute top-4 right-6 opacity-10 group-hover:opacity-20 transition-all pointer-events-none">
             <Info size={120} strokeWidth={1} className="text-retro-mustard" />
           </div>
           
           <div className="relative z-10 flex gap-8">
              <AlertTriangle className="text-retro-brick shrink-0 mt-1" size={24} strokeWidth={2} />
              <div>
                <p className="text-[10px] font-black text-retro-brick uppercase tracking-[0.2em] mb-3 italic">Ghi lục Di bút Kiểm duyệt</p>
                <p className="text-lg text-retro-earth font-bold leading-relaxed font-handwriting italic bg-white/40 p-4 border-l-4 border-retro-brick shadow-sm inline-block">
                  "{employee.errorNote}"
                </p>
              </div>
           </div>
        </div>
      )}

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-6 border-t-2 border-retro-sepia/10">
         <div className="bg-white p-10 border-2 border-retro-sepia/10 shadow-sm relative group hover:shadow-xl transition-all overflow-hidden rotate-1 hover:rotate-0">
            <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
               <ShieldCheck size={140} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                 <p className="text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-4 italic opacity-60">Chỉ số Tinh anh</p>
                 <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-black text-retro-moss italic tracking-tighter tabular-nums">{(100 - (employee.techErrors / employee.totalQty * 100)).toFixed(1)}</p>
                    <span className="text-sm font-black text-retro-moss/40">%</span>
                 </div>
              </div>
              <div className="w-12 h-12 bg-retro-moss/10 flex items-center justify-center text-retro-moss rotate-12">
                 <ShieldCheck size={28} strokeWidth={1.5} />
              </div>
            </div>
         </div>
         
         <div className="bg-white p-10 border-2 border-retro-sepia/10 shadow-sm relative group hover:shadow-xl transition-all overflow-hidden -rotate-1 hover:rotate-0">
            <div className="absolute -bottom-6 -right-6 opacity-5 group-hover:opacity-10 transition-all pointer-events-none">
               <FileText size={140} strokeWidth={1} />
            </div>
            <div className="relative z-10 flex justify-between items-center">
              <div>
                 <p className="text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-4 italic opacity-60">Hệ số Hao hụt</p>
                 <div className="flex items-baseline gap-3">
                    <p className="text-4xl font-black text-retro-sepia italic tracking-tighter tabular-nums">{(totalErrors / employee.totalQty * 100).toFixed(1)}</p>
                    <span className="text-sm font-black text-retro-sepia/40">%</span>
                 </div>
              </div>
              <div className="w-12 h-12 bg-retro-sepia/10 flex items-center justify-center text-retro-sepia -rotate-12">
                 <FileText size={28} strokeWidth={1.5} />
              </div>
            </div>
         </div>
      </div>
    </div>
  );
}
