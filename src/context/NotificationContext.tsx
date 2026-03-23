'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type NotificationType = 'success' | 'warning' | 'error';

interface NotificationState {
  id: string;
  type: NotificationType;
  message: string;
  details?: string;
  isModal?: boolean;
}

interface ConfirmState {
  message: string;
  resolve: (value: boolean) => void;
}

interface NotificationContextType {
  showToast: (type: NotificationType, message: string) => void;
  showModal: (type: NotificationType, message: string, details?: string) => void;
  confirm: (message: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationState[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showToast = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message, isModal: false }]);
    
    if (type === 'success' || type === 'warning') {
      setTimeout(() => removeNotification(id), 5000);
    }
  }, [removeNotification]);

  const showModal = useCallback((type: NotificationType, message: string, details?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, message, details, isModal: true }]);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  const handleConfirm = (value: boolean) => {
    if (confirmState) {
      confirmState.resolve(value);
      setConfirmState(null);
    }
  };

  return (
    <NotificationContext.Provider value={{ showToast, showModal, confirm }}>
      {children}
      <GlobalNotificationUI 
        notifications={notifications} 
        removeNotification={removeNotification}
        confirmState={confirmState}
        handleConfirm={handleConfirm}
      />
    </NotificationContext.Provider>
  );
};

// UI Component internal to the context file or exported separately
import { CheckCircle2, AlertTriangle, XCircle, Info, X, ChevronRight, AlertCircle } from 'lucide-react';

const GlobalNotificationUI = ({ 
  notifications, 
  removeNotification,
  confirmState,
  handleConfirm 
}: { 
  notifications: NotificationState[], 
  removeNotification: (id: string) => void,
  confirmState: ConfirmState | null,
  handleConfirm: (v: boolean) => void
}) => {
  const [expandedError, setExpandedError] = useState<string | null>(null);

  return (
    <>
      {/* TOASTS CONTAINER */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm">
        {notifications.filter(n => !n.isModal).map((n) => (
          <div 
            key={n.id}
            className={`
              pointer-events-auto flex items-start gap-4 p-4 rounded-3xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-right-full duration-300
              ${n.type === 'success' ? 'bg-emerald-50/90 border-emerald-100 text-emerald-900' : ''}
              ${n.type === 'warning' ? 'bg-amber-50/90 border-amber-100 text-amber-900' : ''}
              ${n.type === 'error' ? 'bg-rose-50/90 border-rose-100 text-rose-900' : ''}
            `}
          >
            <div className="flex-shrink-0 mt-0.5">
              {n.type === 'success' && <CheckCircle2 size={20} className="text-emerald-500" />}
              {n.type === 'warning' && <AlertTriangle size={20} className="text-amber-500" />}
              {n.type === 'error' && <XCircle size={20} className="text-rose-500" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-black uppercase tracking-tight">{n.message}</p>
            </div>
            <button onClick={() => removeNotification(n.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* MODAL OVERLAY */}
      {notifications.some(n => n.isModal) && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
          {notifications.filter(n => n.isModal).map((n) => (
            <div key={n.id} className="relative bg-white w-full max-w-md p-10 rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-500">
               <div className={`
                 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8
                 ${n.type === 'success' ? 'bg-emerald-50 text-emerald-500' : ''}
                 ${n.type === 'warning' ? 'bg-amber-50 text-amber-500' : ''}
                 ${n.type === 'error' ? 'bg-rose-50 text-rose-500' : ''}
               `}>
                 {n.type === 'success' && <CheckCircle2 size={40} />}
                 {n.type === 'warning' && <AlertTriangle size={40} />}
                 {n.type === 'error' && <XCircle size={40} />}
               </div>
               
               <h3 className="text-2xl font-black text-gray-900 text-center uppercase tracking-tight italic mb-3">
                 {n.type === 'success' ? 'Thành công' : n.type === 'warning' ? 'Chú ý' : 'Lỗi hệ thống'}
               </h3>
               
               <p className="text-base text-gray-600 text-center font-bold mb-8">{n.message}</p>

               {n.details && (
                 <div className="mb-8">
                    <button 
                      onClick={() => setExpandedError(expandedError === n.id ? null : n.id)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all"
                    >
                      <span>Chi tiết kỹ thuật (Admin)</span>
                      <ChevronRight size={14} className={`transition-transform duration-300 ${expandedError === n.id ? 'rotate-90' : ''}`} />
                    </button>
                    {expandedError === n.id && (
                      <div className="mt-3 p-6 bg-gray-900 rounded-3xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
                        <code className="text-[11px] text-rose-400 font-mono break-all whitespace-pre-wrap leading-relaxed">{n.details}</code>
                      </div>
                    )}
                 </div>
               )}

               <button 
                onClick={() => removeNotification(n.id)}
                className={`
                  w-full py-5 text-[13px] font-black uppercase tracking-widest rounded-3xl shadow-xl transition-all active:scale-95
                  ${n.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' : ''}
                  ${n.type === 'warning' ? 'bg-amber-500 text-white shadow-amber-500/20' : ''}
                  ${n.type === 'error' ? 'bg-rose-500 text-white shadow-rose-500/20' : ''}
                `}
               >
                 Đã hiểu
               </button>
            </div>
          ))}
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmState && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" />
          <div className="relative bg-white w-full max-w-md p-10 rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertCircle size={40} />
             </div>
             
             <h3 className="text-2xl font-black text-gray-900 text-center uppercase tracking-tight italic mb-3">
               Xác nhận
             </h3>
             
             <p className="text-base text-gray-600 text-center font-bold mb-10">{confirmState.message}</p>

             <div className="flex gap-4">
                <button 
                  onClick={() => handleConfirm(false)}
                  className="flex-1 py-5 bg-gray-50 text-gray-400 text-[13px] font-black uppercase tracking-widest rounded-3xl hover:bg-gray-100 transition-all active:scale-95"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={() => handleConfirm(true)}
                  className="flex-1 py-5 bg-gray-900 text-white text-[13px] font-black uppercase tracking-widest rounded-3xl hover:bg-black shadow-xl shadow-gray-200 transition-all active:scale-95"
                >
                  Xác nhận
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};
