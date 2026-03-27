import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noShadow?: boolean;
}

export function Card({ className, noShadow = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border-[2.5px] border-black p-6',
        !noShadow && 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
        className
      )}
      {...props}
    />
  );
}
