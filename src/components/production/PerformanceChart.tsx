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
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* EMPLOYEE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-slate-100">
         <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold text-lg shadow-sm">
               {employee.name.split(' ').pop()?.substring(0, 2).toUpperCase()}
            </div>
            <div>
               <h4 className="text-xl font-bold text-slate-900 tracking-tight">{employee.name}</h4>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                 <Target size={12} className="text-blue-500" strokeWidth={2.5} />
                 {employee.group} • Nhật trình sản xuất
               </p>
            </div>
         </div>
         {isHighMatError && (
            <div className="bg-rose-50 text-rose-600 px-4 py-2 rounded-lg border border-rose-100 flex items-center gap-3 animate-pulse shadow-sm">
               <AlertTriangle size={16} strokeWidth={2.5} />
               <span className="text-[10px] font-bold uppercase tracking-wider">Cảnh báo Hao hụt Vật tư</span>
            </div>
         )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* LINE CHART SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-600" /> Biến động Hiệu suất
            </p>
            <span className="text-[10px] font-bold text-slate-300 uppercase">30 Days</span>
          </div>
          
          <div className="relative h-60 bg-slate-50 rounded-2xl border border-slate-200 p-8 pt-10 group overflow-hidden shadow-sm">
            {/* GUIDES */}
            <div className="absolute inset-x-8 top-10 border-t border-slate-200/50 h-0" />
            <div className="absolute inset-x-8 top-1/2 border-t border-slate-200/50 h-0 border-dashed" />
            <div className="absolute inset-x-8 bottom-8 border-t border-slate-200/50 h-0" />

            {/* Y-AXIS LABELS */}
            <div className="absolute left-3 h-[calc(100%-48px)] top-10 flex flex-col justify-between text-[8px] font-bold text-slate-300 uppercase">
               <span>100</span>
               <span>50</span>
               <span>0</span>
            </div>

            {/* SVG LINE CHART */}
            <svg className="absolute inset-0 w-full h-full px-12 pt-10 pb-8 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="modernLineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              <path 
                d={`M ${employee.trend.map((val, i) => `${(i / (employee.trend.length - 1)) * 100}%,${100 - (val / max * 100)}%`).join(' L ')} L 100%,100% L 0%,100% Z`}
                fill="url(#modernLineGradient)"
                className="transition-all duration-1000"
              />

              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={employee.trend.map((val, i) => `${(i / (employee.trend.length - 1)) * 100},${100 - (val / max * 100)}`).join(' ')}
                className="transition-all duration-1000"
                style={{ vectorEffect: 'non-scaling-stroke' }}
              />

              {employee.trend.map((val, i) => (
                <circle 
                  key={i}
                  cx={`${(i / (employee.trend.length - 1)) * 100}%`}
                  cy={`${100 - (val / max * 100)}%`}
                  r="4"
                  fill="white"
                  stroke="#2563EB"
                  strokeWidth="2"
                  className="transition-all duration-300 cursor-pointer shadow-sm group-hover:r-5"
                />
              ))}
            </svg>

            {/* X-AXIS */}
            <div className="absolute inset-0 px-12 pt-10 pb-8 flex justify-between pointer-events-none">
              {employee.trend.map((val, i) => (
                <div key={i} className="relative flex-1 flex flex-col items-center group/tip pointer-events-auto">
                   <div className="flex-1 w-full" />
                   <div className="absolute transition-all duration-300 opacity-0 group-hover/tip:opacity-100 -translate-y-2" style={{ bottom: `${(val / max * 100) + 8}%` }}>
                     <div className="bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-slate-700 whitespace-nowrap">
                        {val}%
                     </div>
                   </div>
                   <p className="mt-2 text-[8px] font-bold text-slate-300 uppercase absolute -bottom-5">D{i+1}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ERROR DISTRIBUTION SECTION */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <PieChartIcon size={14} className="text-amber-500" /> Tỷ lệ Khiếm khuyết
             </p>
             <span className="text-[10px] font-bold text-slate-300 uppercase">Analysis</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8 bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-sm transition-all hover:bg-slate-50/50">
             {/* MODERN PIE CHART */}
             <div className="relative w-28 h-28 rounded-full shadow-inner border-[6px] border-slate-50 shrink-0" style={{
               background: totalErrors > 0 
                ? `conic-gradient(#E11D48 0% ${techPct}%, #F59E0B ${techPct}% 100%)`
                : '#F1F5F9'
             }}>
                <div className="absolute inset-6 bg-white rounded-full flex flex-col items-center justify-center shadow-lg border border-slate-100">
                   <p className="text-lg font-bold text-slate-900 leading-none">{totalErrors}</p>
                   <p className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Sự vụ</p>
                </div>
             </div>

             <div className="flex flex-col gap-5 flex-1 w-full">
                <div className="space-y-3">
                   <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 bg-rose-500 rounded-sm shadow-sm" />
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lỗi Thao tác</span>
                      </div>
                      <span className="text-sm font-bold text-rose-600 tabular-nums">{techPct.toFixed(0)}%</span>
                   </div>
                   <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-3">
                         <div className="w-2.5 h-2.5 bg-amber-500 rounded-sm shadow-sm" />
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lỗi Vật liệu</span>
                      </div>
                      <span className="text-sm font-bold text-amber-600 tabular-nums">{matPct.toFixed(0)}%</span>
                   </div>
                </div>
                
                <p className="text-[9px] text-slate-400 font-medium italic border-l-2 border-slate-200 pl-4 leading-relaxed">
                  Phân tích dựa trên Sổ nhật trình & Kiểm duyệt định kỳ.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* ERROR NOTE */}
      {employee.errorNote && (
        <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200 relative overflow-hidden group shadow-sm">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Info size={100} className="text-slate-400" />
           </div>
           
           <div className="relative z-10 flex gap-6">
              <div className="p-3 bg-white rounded-xl text-rose-500 border border-rose-100 shadow-sm shrink-0 h-fit">
                 <AlertTriangle size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ghi chú Kiểm duyệt</p>
                <p className="text-base text-slate-700 font-medium leading-relaxed italic pr-12">
                   "{employee.errorNote}"
                </p>
              </div>
           </div>
        </div>
      )}

      {/* KPI METRICS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
         <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl relative group hover:bg-emerald-50 transition-all shadow-sm">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest mb-3">Chỉ số Tinh anh (Quality)</p>
                  <div className="flex items-baseline gap-2">
                     <p className="text-4xl font-black text-emerald-700 tabular-nums tracking-tighter">
                        {(100 - (employee.techErrors / employee.totalQty * 100)).toFixed(1)}
                     </p>
                     <span className="text-sm font-bold text-emerald-600/40">%</span>
                  </div>
               </div>
               <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                  <ShieldCheck size={24} />
               </div>
            </div>
         </div>
         
         <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl relative group hover:bg-slate-100 transition-all shadow-sm">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Hệ số Hao hụt (Waste)</p>
                  <div className="flex items-baseline gap-2">
                     <p className="text-4xl font-black text-slate-700 tabular-nums tracking-tighter">
                        {(totalErrors / employee.totalQty * 100).toFixed(1)}
                     </p>
                     <span className="text-sm font-bold text-slate-400/40">%</span>
                  </div>
               </div>
               <div className="w-10 h-10 bg-white text-slate-400 rounded-lg flex items-center justify-center border border-slate-200 shadow-sm">
                  <FileText size={24} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
