import { Settings, FileText, AlertTriangle, ShieldCheck, TrendingUp, PieChart as PieChartIcon, Info, ChevronRight, Target, Activity } from 'lucide-react';
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
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* EMPLOYEE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-10 border-b-2 border-black/10">
         <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white border-2 border-black rounded-xl flex items-center justify-center text-black font-black text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] italic">
               {employee.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
            </div>
            <div>
               <h4 className="text-2xl font-black text-black tracking-tight uppercase italic underline underline-offset-4 decoration-black/10">{employee.name}</h4>
               <p className="text-[10px] text-black/40 font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-3">
                 <Target size={14} strokeWidth={3} className="text-black" />
                 {employee.group} <span className="text-black/10">•</span> Sổ Nhật Trình Điện Tử
               </p>
            </div>
         </div>
         {isHighMatError && (
            <div className="bg-neo-red/20 text-black px-6 py-3 rounded-lg border-2 border-black flex items-center gap-4 animate-pulse shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
               <AlertTriangle size={20} strokeWidth={3} className="text-black" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Critical Material Variance Detected</span>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LINE CHART SECTION */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <TrendingUp size={16} strokeWidth={3} className="text-neo-purple" /> Efficiency Vector
            </p>
            <span className="text-[10px] font-black text-black/20 uppercase tracking-widest italic">30 Day Epoch</span>
          </div>
          
          <div className="relative h-72 bg-white rounded-xl border-2 border-black p-10 group overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {/* GUIDES */}
            <div className="absolute inset-x-10 top-10 border-t-2 border-black/5 h-0" />
            <div className="absolute inset-x-10 top-1/2 border-t-2 border-black/5 h-0" />
            <div className="absolute inset-x-10 bottom-10 border-t-2 border-black/5 h-0" />

            {/* Y-AXIS LABELS */}
            <div className="absolute left-4 h-[calc(100%-80px)] top-10 flex flex-col justify-between text-[8px] font-black text-black/20 uppercase italic">
               <span>100%</span>
               <span>50%</span>
               <span>0%</span>
            </div>

            {/* SVG LINE CHART */}
            <svg className="absolute inset-0 w-full h-full px-16 pt-10 pb-10 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="neoLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              <path 
                d={`M ${employee.trend.map((val, i) => `${(i / (employee.trend.length - 1)) * 100}%,${100 - (val / max * 100)}%`).join(' L ')} L 100%,100% L 0%,100% Z`}
                fill="url(#neoLineGradient)"
                className="transition-all duration-1000"
              />

              <polyline
                fill="none"
                stroke="black"
                strokeWidth="4"
                strokeLinecap="square"
                strokeLinejoin="miter"
                points={employee.trend.map((val, i) => `${(i / (employee.trend.length - 1)) * 100},${100 - (val / max * 100)}`).join(' ')}
                className="transition-all duration-1000"
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />

              {employee.trend.map((val, i) => (
                <circle 
                  key={i}
                  cx={`${(i / (employee.trend.length - 1)) * 100}%`}
                  cy={`${100 - (val / max * 100)}%`}
                  r="6"
                  fill="white"
                  stroke="black"
                  strokeWidth="3"
                  className="transition-all duration-300 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:r-8 hover:fill-neo-purple"
                />
              ))}
            </svg>

            {/* X-AXIS */}
            <div className="absolute inset-0 px-16 pt-10 pb-10 flex justify-between pointer-events-none">
              {employee.trend.map((val, i) => (
                <div key={i} className="relative flex-1 flex flex-col items-center group/tip pointer-events-auto">
                   <div className="flex-1 w-full" />
                   <div className="absolute transition-all duration-300 opacity-0 group-hover/tip:opacity-100 -translate-y-4" style={{ bottom: `${(val / max * 100) + 12}%` }}>
                     <div className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] whitespace-nowrap italic">
                        {val}%
                     </div>
                   </div>
                   <p className="mt-3 text-[8px] font-black text-black/20 uppercase absolute -bottom-6 italic">D{i+1}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ERROR DISTRIBUTION SECTION */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
             <p className="text-[11px] font-black text-black uppercase tracking-[0.3em] flex items-center gap-3 italic">
               <PieChartIcon size={16} strokeWidth={3} className="text-neo-red" /> Defect Anatomy
             </p>
             <span className="text-[10px] font-black text-black/20 uppercase tracking-widest italic">Compositional Analysis</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-10 bg-white p-10 rounded-xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
             {/* MODERN PIE CHART */}
             <div className="relative w-36 h-36 rounded-full border-4 border-black shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" style={{
               background: totalErrors > 0 
                ? `conic-gradient(#FF6B6B 0% ${techPct}%, #FFD93D ${techPct}% 100%)`
                : '#F1F5F9'
             }}>
                <div className="absolute inset-8 bg-white rounded-full border-2 border-black flex flex-col items-center justify-center shadow-inner">
                   <p className="text-2xl font-black text-black leading-none italic">{totalErrors}</p>
                   <p className="text-[8px] text-black/40 font-black uppercase mt-1 italic tracking-widest">Sự vụ</p>
                </div>
             </div>

             <div className="flex flex-col gap-6 flex-1 w-full">
                <div className="space-y-4">
                   <div className="flex items-center justify-between border-b-2 border-black/5 pb-3">
                      <div className="flex items-center gap-4">
                         <div className="w-4 h-4 bg-neo-red border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                         <span className="text-[10px] font-black text-black uppercase tracking-widest italic">Lỗi Thao tác (Tech)</span>
                      </div>
                      <span className="text-lg font-black text-black tabular-nums italic">{techPct.toFixed(0)}%</span>
                   </div>
                   <div className="flex items-center justify-between border-b-2 border-black/5 pb-3">
                      <div className="flex items-center gap-4">
                         <div className="w-4 h-4 bg-neo-yellow border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                         <span className="text-[10px] font-black text-black uppercase tracking-widest italic">Lỗi Vật liệu (Mat)</span>
                      </div>
                      <span className="text-lg font-black text-black tabular-nums italic">{matPct.toFixed(0)}%</span>
                   </div>
                </div>
                
                <p className="text-[9px] text-black/40 font-black italic border-l-4 border-black pl-6 leading-relaxed uppercase tracking-[0.1em]">
                  Root cause distribution based on quality control audit logs.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* ERROR NOTE */}
      {employee.errorNote && (
        <div className="bg-neo-purple/5 p-8 rounded-xl border-2 border-black relative overflow-hidden group shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] italic">
           <div className="absolute -top-10 -right-10 p-4 opacity-5 pointer-events-none rotate-12 transition-transform group-hover:scale-110">
             <Activity size={180} strokeWidth={1} className="text-black" />
           </div>
           
           <div className="relative z-10 flex gap-8">
              <div className="w-14 h-14 bg-white border-2 border-black rounded-lg text-neo-red flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] shrink-0">
                 <AlertTriangle size={32} strokeWidth={3} />
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-black text-black uppercase tracking-[0.3em] italic">Auditor Metadata & Field Notes</p>
                <p className="text-xl text-black font-black leading-tight italic pr-20 underline decoration-neo-red/20 underline-offset-8">
                   "{employee.errorNote}"
                </p>
              </div>
           </div>
        </div>
      )}

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="p-8 bg-neo-green/10 border-2 border-black rounded-xl relative group hover:bg-neo-green/20 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-4 italic">Quality Fidelity Index</p>
                  <div className="flex items-baseline gap-2">
                     <p className="text-5xl font-black text-black tabular-nums tracking-tighter italic">
                        {(100 - (employee.techErrors / employee.totalQty * 100)).toFixed(1)}
                     </p>
                     <span className="text-xl font-black text-black opacity-40">%</span>
                  </div>
               </div>
               <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <ShieldCheck size={32} strokeWidth={3} className="text-black" />
               </div>
            </div>
         </div>
         
         <div className="p-8 bg-neo-yellow/10 border-2 border-black rounded-xl relative group hover:bg-neo-yellow/20 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[11px] font-black text-black uppercase tracking-[0.3em] mb-4 italic">Resource Dissipation (Waste)</p>
                  <div className="flex items-baseline gap-2">
                     <p className="text-5xl font-black text-black tabular-nums tracking-tighter italic">
                        {(totalErrors / employee.totalQty * 100).toFixed(1)}
                     </p>
                     <span className="text-xl font-black text-black opacity-40">%</span>
                  </div>
               </div>
               <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <FileText size={32} strokeWidth={3} className="text-black" />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
