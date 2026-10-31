import * as React from 'react';

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionOnClick?: () => void;
  illustration?: string;
  variant?: 'default' | 'transparent' | 'ghost';
}

const iconMap = {
  default: ' Folder',
  // Icon names would come from lucide-react in actual usage
};

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, actionLabel, actionOnClick, illustration, variant = 'default', className, ...props }, ref) => {
    const iconSvg = (
      <svg
        className="h-12 w-12 text-slate-300"
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
    );

    return (
      <div
        ref={ref}
        className={`flex flex-col items-center py-12 text-center ${className}`}
        {...props}
      >
        {icon && <iconSvg />}
        {title && <h3 className="mt-4 text-lg font-medium text-slate-600">{title}</h3>}
        {description && <p className="mt-2 text-sm text-slate-400">{description}</p>}
        {actionLabel && (
          <button
            onClick={actionOnClick}
            className="mt-4 inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    );
  },
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };