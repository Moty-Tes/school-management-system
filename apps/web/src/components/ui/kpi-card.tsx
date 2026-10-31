import * as React from 'react';

export interface KpiCardProps {
  className?: string;
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
  showBorder?: boolean;
}

const trendIcon = {
  up: 'CaretUp',
  down: 'CaretDown',
  neutral: 'Minus',
};

const trendColor = {
  up: 'green-600',
  down: 'red-600',
  neutral: 'slate-500',
};

const trendBg = {
  up: 'green-100',
  down: 'red-100',
  neutral: 'slate-100',
};

export const KpiCard = React.forwardRef<HTMLDivElement, KpiCardProps>(
  ({ className, value, label, trend, trendValue, subtitle, variant = 'default', showBorder = true, ...props }, ref) => {
    const variantBg = {
      default: 'bg-white',
      primary: 'bg-primary-50',
      success: 'bg-green-50',
      warning: 'bg-amber-50',
      error: 'bg-red-50',
    }[variant] || 'bg-white';

    const variantBorder = {
      default: 'border-border',
      primary: 'border-primary-200',
      success: 'border-green-200',
      warning: 'border-amber-200',
      error: 'border-red-200',
    }[variant] || 'border-border';

    const trendIconName = trendIcon[trend] || trendIcon.neutral;
    const trendColorName = trendColor[trend] || trendColor.neutral;
    const trendBgName = trendBg[trend] || trendBg.neutral;

    return (
      <div
        ref={ref}
        className={`flex flex-col ${variantBg} ${showBorder ? 'border-l-2 ' + variantBorder : ''} rounded-lg p-6 transition-all duration-200 hover:shadow-lg hover:shadow-primary-50/20`}
        {...props}
      >
        <div className={`flex items-baseline justify-between mb-1`}
          <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wider">{label}</h3>
          {trend && (
            <span className={`flex items-center gap-1 text-xs font-medium ${trendColorName}`}>
              <span className="icon-${trendIconName}" />
              {trendValue || ''}
            </span>
          )}
        </div>
        <p className="text-4xl font-extrabold text-slate-900 mb-1">{value}</p>
        {subtitle && (
          <p className="text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
    );
  },
);

KpiCard.displayName = 'KpiCard';

export { KpiCard };