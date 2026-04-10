"use client";

import React, { useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatNumber, parseNumber } from '@/utils/format';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NumericInputProps {
  value: number | null | undefined;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  icon?: any;
  suffix?: string;
  disabled?: boolean;
  hideWrapper?: boolean;
  inputClassName?: string;
}

export function NumericInput({ 
  value, 
  onChange, 
  className, 
  placeholder,
  icon: Icon,
  suffix,
  disabled = false,
  hideWrapper = false,
  inputClassName
}: NumericInputProps) {
  // Local state to manage the display string with separators
  const [displayValue, setDisplayValue] = useState(formatNumber(value));
  const isFocused = React.useRef(false);

  // Sync internal display value when external value changes
  useEffect(() => {
    // Only update display value from prop if not focused OR if the numeric value actually changed
    if (!isFocused.current) {
        const formatted = formatNumber(value);
        if (formatted !== displayValue) {
            setDisplayValue(formatted);
        }
    } else {
        // While focused, only update if the external value differs significantly 
        // from what we've already parsed internally (to handle external resets/changes)
        const currentInternalNum = parseNumber(displayValue);
        if (value !== currentInternalNum) {
            setDisplayValue(formatNumber(value));
        }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    
    // Only allow numbers, dots, and commas
    const filtered = inputVal.replace(/[^0-9.,]/g, '');
    
    // Handle empty or minus case for display smoothness
    if (filtered === '' || filtered === '-') {
      setDisplayValue(filtered);
      onChange(0);
      return;
    }

    // Update display value immediately to allow typing the comma/dot
    setDisplayValue(filtered);

    // Only emit to parent if it's a valid number
    const num = parseNumber(filtered);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    setDisplayValue(formatNumber(value));
  };

  const handleFocus = () => {
    isFocused.current = true;
  };

  return (
    <div className={cn("relative group/field", !hideWrapper && "w-full")}>
      <input 
        disabled={disabled}
        type="text" 
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "form-input font-black tabular-nums transition-all",
          Icon ? "pl-12" : "pl-4",
          suffix ? "pr-12" : "pr-4",
          disabled && "opacity-50 cursor-not-allowed bg-black/5",
          className
        )}
        placeholder={placeholder || "0"}
      />
      {Icon && (
        <Icon 
          size={18} 
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within/field:text-black transition-colors",
            disabled && "text-black/10"
          )} 
        />
      )}
      {suffix && (
        <span className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-black/40 uppercase",
          disabled && "text-black/10"
        )}>
          {suffix}
        </span>
      )}
    </div>
  );
}
