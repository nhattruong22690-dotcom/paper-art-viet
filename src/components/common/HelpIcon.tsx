"use client";

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import HelpDrawer from './HelpDrawer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HelpIconProps {
  className?: string;
  size?: number;
}

export default function HelpIcon({ className, size = 18 }: HelpIconProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all group relative",
          className
        )}
        title="Trợ giúp"
      >
        <HelpCircle size={size} className="group-hover:scale-110 transition-transform" />
        
        {/* Tooltip subtle */}
        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          TRỢ GIÚP
        </span>
      </button>

      <HelpDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
