import { Settings, FileText, AlertTriangle, ShieldCheck, TrendingUp, PieChart as PieChartIcon, Info } from 'lucide-react';

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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-start mb-4">
         <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center font-black text-primary-600 border border-primary-100 shadow-sm">
               {employee.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
            </div>
            <div>
               <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none">{employee.name}</h4>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                 {employee.group} • 7 ngày gần nhất
               </p>
            </div>
         </div>
         {isHighMatError && (
           <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-2xl border border-rose-100 flex items-center gap-2 animate-pulse shadow-sm">
              <AlertTriangle size={16} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest">Kiểm tra lô vật tư</span>
           </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* LINE CHART SECTION */}
        <div className="space-y-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp size={14} /> Xu hướng hiệu suất
          </p>
          <div className="relative h-44 flex items-end justify-between px-10 group bg-gray-50/30 rounded-3xl pt-8 pb-4">
            {/* GRID LINES */}
            <div className="absolute inset-x-0 top-8 border-t border-gray-100/50 h-0" />
            <div className="absolute inset-x-0 top-1/4 border-t border-gray-100/50 h-0" />
            <div className="absolute inset-x-0 top-1/2 border-t border-gray-100/50 h-0" />
            <div className="absolute inset-x-0 top-3/4 border-t border-gray-100/50 h-0" />

            {/* Y-AXIS LABELS */}
            <div className="absolute left-3 h-full pt-8 pb-4 flex flex-col justify-between text-[8px] font-black text-gray-300">
               <span>100%</span>
               <span>75%</span>
               <span>50%</span>
               <span>25%</span>
               <span>0%</span>
            </div>

            {/* SVG LINE CHART */}
            <svg className="absolute inset-0 w-full h-full px-10 pt-8 pb-4 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* AREA UNDER LINE */}
              <path 
                d={`M ${employee.trend.map((val, i) => `${(i / (employee.trend.length - 1)) * 100}%,${100 - (val / max * 100)}%`).join(' L ')} L 100%,100% L 0%,100% Z`}
                fill="url(#lineGradient)"
                className="transition-all duration-1000 opacity-50"
                style={{ clipPath: 'inset(0 0 0 0)' }}
              />

              {/* DRAWN LINE */}
              <polyline
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={employee.trend.map((val, i) => `${(i / (employee.trend.length - 1)) * 100},${100 - (val / max * 100)}`).join(' ')}
                className="transition-all duration-1000 shadow-lg"
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />

              {/* DATA POINTS */}
              {employee.trend.map((val, i) => (
                <g key={i} className="group/point">
                   <circle 
                     cx={`${(i / (employee.trend.length - 1)) * 100}%`}
                     cy={`${100 - (val / max * 100)}%`}
                     r="4"
                     fill="white"
                     stroke="#0ea5e9"
                     strokeWidth="2"
                     className="transition-all duration-300 group-hover/point:r-6 cursor-pointer shadow-sm"
                   />
                </g>
              ))}
            </svg>

            {/* X-AXIS LABELS AND TOOLTIPS */}
            <div className="absolute inset-0 w-full h-full px-10 pt-8 pb-4 flex justify-between pointer-events-none">
              {employee.trend.map((val, i) => (
                <div key={i} className="relative flex-1 flex flex-col items-center group/tip pointer-events-auto">
                   <div className="flex-1 w-full" />
                   <div className="absolute transition-all duration-300 opacity-0 group-hover/tip:opacity-100 scale-90 group-hover/tip:scale-100" style={{ bottom: `${(val / max * 100) + 2}%` }}>
                     <div className="bg-gray-900/90 text-white text-[9px] font-black px-2 py-1 rounded shadow-xl border border-white/10 whitespace-nowrap mb-2">
                        {val}%
                     </div>
                   </div>
                   <p className="mt-4 text-[9px] font-black text-gray-400 absolute -bottom-4">T{i+2}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ERROR PIE CHART SECTION */}
        <div className="space-y-6">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <PieChartIcon size={14} /> Phân bổ nhóm lỗi
          </p>
          <div className="flex items-center gap-8 bg-gray-50/50 p-6 rounded-[32px] border border-gray-100">
             {/* PRETTY CSS PIE CHART */}
             <div className="relative w-24 h-24 rounded-full shadow-inner border border-gray-100" style={{
               background: totalErrors > 0 
                ? `conic-gradient(#f43f5e 0% ${techPct}%, #94a3b8 ${techPct}% 100%)`
                : '#f8fafc'
             }}>
                <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-sm">
                   <p className="text-xs font-black text-gray-900 leading-none">{totalErrors}</p>
                   <p className="text-[8px] text-gray-400 font-bold uppercase mt-0.5 ml-0.5">Lỗi</p>
                </div>
             </div>

             <div className="flex flex-col gap-4 flex-1">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Lỗi thợ (🛠️)</span>
                   </div>
                   <span className="text-xs font-black text-rose-600">{techPct.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Lỗi giấy (📄)</span>
                   </div>
                   <span className="text-xs font-black text-gray-500">{matPct.toFixed(0)}%</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {employee.errorNote && (
        <div className="bg-amber-50/50 p-6 rounded-[28px] border border-amber-100 flex gap-4">
           <Info className="text-amber-500 shrink-0 mt-1" size={18} />
           <div>
              <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Ghi chú sự cố gần nhất</p>
              <p className="text-sm text-amber-800 font-medium italic leading-relaxed">"{employee.errorNote}"</p>
           </div>
        </div>
      )}

      {/* ADDITIONAL KPI DEEP DIVE */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
         <div className="bg-emerald-50/50 p-6 rounded-[28px] border border-emerald-100 flex items-center justify-between group">
            <div>
               <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Điểm Chất lượng</p>
               <p className="text-2xl font-black text-emerald-700">{(100 - (employee.techErrors / employee.totalQty * 100)).toFixed(1)}%</p>
            </div>
            <ShieldCheck size={32} className="text-emerald-200 group-hover:text-emerald-500 transition-colors" />
         </div>
         <div className="bg-gray-50/30 p-6 rounded-[28px] border border-gray-100 flex items-center justify-between group">
            <div>
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Hao hụt Vật tư</p>
               <p className="text-2xl font-black text-gray-900">{((employee.techErrors + employee.matErrors) / employee.totalQty * 100).toFixed(1)}%</p>
            </div>
            <FileText size={32} className="text-gray-100 group-hover:text-gray-400 transition-colors" />
         </div>
      </div>
    </div>
  );
}

