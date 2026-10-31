import * as React from 'react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: any;
  title: string;
  description?: string;
  actionLabel?: string;
  actionOnClick?: () => void;
  illustration?: string;
  variant?: 'default' | 'transparent' | 'ghost';
  className?: string;
}

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, actionLabel, actionOnClick, illustration, variant = 'default', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex flex-col items-center py-12 text-center ${className}`}
        {...props}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2 shadow-inner">
          <svg
            className="h-7 w-7 text-slate-400 dark:text-slate-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
          </svg>
        </div>
        {title && <h3 className="mt-4 text-base font-bold text-slate-700 dark:text-slate-200">{title}</h3>}
        {description && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 max-w-sm">{description}</p>}
        {actionLabel && (
          <button
            onClick={actionOnClick}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors shadow-sm"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  },
);

EmptyState.displayName = 'EmptyState';

export const KpiEmptyState = EmptyState;
export const KpiEmptyStateComponent = EmptyState;
