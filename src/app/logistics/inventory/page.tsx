import InventoryDashboard from '@/components/logistics/InventoryDashboard';
import { ArrowLeft, Box } from 'lucide-react';
import Link from 'next/link';

export default function InventoryPage() {
  return (
    <div className="bg-retro-paper min-h-screen font-typewriter overflow-hidden">
      <header className="bg-white border-b-2 border-retro-sepia/10 shadow-sm relative overflow-hidden">
         <div className="washi-tape-top" />
         <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
            <Box size={200} strokeWidth={0.5} className="text-retro-sepia" />
         </div>
         
         <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 relative z-10">
            <div className="flex items-center gap-8">
               <Link 
                 href="/mobile-menu/logistics"
                 className="w-14 h-14 bg-retro-paper border-2 border-retro-sepia/10 flex items-center justify-center text-retro-sepia hover:bg-retro-brick/10 hover:text-retro-brick transition-all rotate-3 hover:rotate-0 shadow-sm"
               >
                 <ArrowLeft size={24} strokeWidth={1.5} />
               </Link>
               <div>
                 <nav className="flex items-center gap-3 text-[10px] font-black text-retro-earth uppercase tracking-[0.2em] mb-4 opacity-60">
                   <Box size={14} strokeWidth={1.5} />
                   <span>Tiếp vận & Kho bãi</span>
                   <div className="w-1 h-1 bg-retro-sepia/20 rounded-full" />
                   <span className="text-retro-sepia">Sổ cái Tồn kho</span>
                 </nav>
                 <h1 className="text-3xl md:text-4xl font-black text-retro-sepia tracking-tighter uppercase italic underline decoration-double decoration-retro-mustard/30 underline-offset-8">
                   Trữ kho <span className="text-retro-brick">Thực địa</span>
                 </h1>
               </div>
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 md:px-12 py-12 relative z-10">
        <InventoryDashboard />
      </main>
      
      <div className="torn-paper-bottom" />
    </div>
  );
}
