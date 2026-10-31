import * as React from 'react';

export interface KpiCardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  showBorder?: boolean;
}

export const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({ className = '', value, label, trend, trendValue, subtitle, variant = 'default', showBorder = true, ...props }, ref) => {
    const variantBorder = {
      default: 'border-slate-200 dark:border-slate-800',
      primary: 'border-indigo-500',
      success: 'border-emerald-500',
      warning: 'border-amber-500',
      error: 'border-rose-500',
    }[variant] || 'border-slate-200';

    const trendColorClass = {
      up: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
      down: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400',
      neutral: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400',
    }[trend || 'neutral'];

    return (
      <div
        ref={ref}
        className={`flex flex-col bg-white dark:bg-slate-900 rounded-2xl p-5 border ${variantBorder} transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${className}`}
        {...props}
      >
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</h3>
          {trend && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${trendColorClass}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue || ''}
            </span>
          )}
        </div>
        <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">{subtitle}</p>
        )}
      </div>
    );
  },
);

KpiCard.displayName = 'KpiCard';
