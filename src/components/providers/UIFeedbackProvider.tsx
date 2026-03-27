'use client';

import React, { useEffect } from 'react';
import { playClickSound } from '@/utils/audio';

export function UIFeedbackProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      
      if (button) {
        // Play sound for all buttons
        playClickSound();
        
        // Add additional visual feedback for confirmable actions if using specific classes
        if (button.classList.contains('btn-confirm-flash')) {
          // This is handled by CSS animation in globals.css
        }
      }
    };

    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  return <>{children}</>;
}
