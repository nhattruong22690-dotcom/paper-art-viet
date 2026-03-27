import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-[#D8B4FE] hover:bg-[#c084fc]',
      secondary: 'bg-[#D1FAE5] hover:bg-[#a7f3d0]',
      outline: 'bg-white hover:bg-gray-50',
      ghost: 'bg-transparent border-transparent shadow-none active:translate-x-0 active:translate-y-0',
      danger: 'bg-rose-400 hover:bg-rose-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-black uppercase tracking-widest transition-all duration-100',
          'border-[2.5px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
          'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
