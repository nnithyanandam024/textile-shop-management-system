import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';
  
  const variants = {
    primary: 'bg-[#2012ad] hover:bg-[#1a0e91] active:bg-[#150b74] text-white focus:ring-[#2012ad] shadow-md shadow-[#2012ad]/20',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 focus:ring-[#2012ad]',
    danger: 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white focus:ring-rose-500 shadow-md shadow-rose-600/20',
    success: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white focus:ring-emerald-500 shadow-md shadow-emerald-600/20',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-[#2012ad]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs font-bold gap-2',
    lg: 'px-5 py-2.5 text-sm font-bold gap-2.5',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
