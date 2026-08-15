import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'alert' | 'tinted';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  action,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-white border-slate-200/80 shadow-sm',
    alert: 'bg-gradient-to-br from-rose-100/90 to-rose-50/70 border-rose-200/90 shadow-sm',
    tinted: 'bg-gradient-to-br from-indigo-50/60 to-white border-indigo-100 shadow-sm',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'border rounded-2xl p-6 transition-all duration-200',
          variants[variant],
          className
        )
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
