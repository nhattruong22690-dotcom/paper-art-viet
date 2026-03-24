"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, AlertTriangle, Loader2, X } from 'lucide-react';
import { isMaintenanceMode, subscribeToMaintenance } from '@/services/systemConfig.service';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);

  // Mock: Get current user role from localStorage/context
  const getUserRole = () => {
    if (typeof window === 'undefined') return 'User';
    return localStorage.getItem('user_role') || 'User'; 
  };

  const handleMaintenanceChange = useCallback((config: any) => {
    const isM = !!config.is_maintenance;
    const role = getUserRole();
    
    // Immediate Redirect for Non-Admins if maintenance is ON
    if (isM && role !== 'Admin' && pathname !== '/maintenance') {
       router.push('/maintenance');
       return;
    }

    // Auto-Reload for everyone if maintenance turns OFF and we are on maintenance page
    if (!isM && pathname === '/maintenance') {
       window.location.href = '/'; // Full reload to clear cache/state
       return;
    }

    setIsMaintenance(isM);
    setShowBanner(isM && role === 'Admin');
  }, [pathname, router]);

  useEffect(() => {
    // Initial Load
    isMaintenanceMode().then(isM => {
      const role = getUserRole();
      if (isM && role !== 'Admin' && pathname !== '/maintenance') {
         router.push('/maintenance');
      } else {
         setIsMaintenance(isM);
         setShowBanner(isM && role === 'Admin');
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

    return () => {
       subscription.unsubscribe();
    };
  }, [handleMaintenanceChange, pathname, router]);

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
