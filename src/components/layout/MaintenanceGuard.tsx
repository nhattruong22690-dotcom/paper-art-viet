"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, AlertTriangle, Loader2, X } from 'lucide-react';
import { isMaintenanceMode, subscribeToMaintenance } from '@/services/systemConfig.service';
import { useAuth } from '@/context/AuthContext';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, isAdmin, loading: authLoading } = useAuth();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  const handleMaintenanceChange = useCallback((config: any) => {
    const isM = !!config.is_maintenance;
    
    // Immediate Redirect for Non-Admins if maintenance is ON
    // We allow /login so Admins can still authenticate
    if (isM && !isAdmin && pathname !== '/maintenance' && pathname !== '/login') {
       router.push('/maintenance');
       return;
    }

    // Auto-Reload for everyone if maintenance turns OFF and we are on maintenance page
    if (!isM && pathname === '/maintenance') {
       window.location.href = '/'; // Full reload to clear cache/state
       return;
    }

    setIsMaintenance(isM);
    setShowBanner(isM && isAdmin);
  }, [pathname, router, isAdmin]);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to settle

    // Initial Load
    isMaintenanceMode().then(isM => {
      if (isM && !isAdmin && pathname !== '/maintenance' && pathname !== '/login') {
         router.push('/maintenance');
      } else {
         setIsMaintenance(isM);
         setShowBanner(isM && isAdmin);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Maintenance Check Failed:', err);
      setLoading(false);
    });

    // Subscribe to Realtime Changes
    const subscription = subscribeToMaintenance((config) => {
       handleMaintenanceChange(config);
    });

    // Fallback Polling (Every 10s to ensure catch up)
    const interval = setInterval(() => {
       isMaintenanceMode().then(isM => {
          if (isM !== isMaintenance) {
             handleMaintenanceChange({ is_maintenance: isM });
          }
       });
    }, 10000);

    return () => {
       subscription.unsubscribe();
       clearInterval(interval);
    };
  }, [handleMaintenanceChange, pathname, router, isAdmin, authLoading, isMaintenance]);

  if (loading && pathname !== '/maintenance') {
    return (
      <div className="fixed inset-0 bg-white z-[99999] flex items-center justify-center">
         <div className="flex flex-col items-center gap-4 text-gray-400 animate-pulse">
            <Loader2 className="animate-spin text-rose-500" size={32} />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Đang đồng bộ hóa hệ thống...</p>
         </div>
      </div>
    );
  }

  return (
    <>
      {/* Admin Warning Banner */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-[10001] bg-amber-500 text-white py-2.5 px-6 flex items-center justify-between shadow-lg shadow-amber-500/20 border-b border-amber-600 animate-in slide-in-from-top duration-500">
           <div className="flex items-center gap-3">
              <ShieldAlert size={18} className="animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2">
                 <span className="hidden md:inline">🔥 Trạng thái đặc biệt:</span> Hệ thống đang ở chế độ bảo trì. Chỉ Admin mới có quyền truy cập.
              </p>
           </div>
           <button 
             onClick={() => setShowBanner(false)}
             className="p-1 hover:bg-white/10 rounded-lg transition-all"
           >
              <X size={14} />
           </button>
        </div>
      )}

      {/* Adjust viewport for banner */}
      <div className={showBanner ? 'pt-10 transition-all duration-500' : 'transition-all duration-500'}>
        {children}
      </div>
    </>
  );
}
