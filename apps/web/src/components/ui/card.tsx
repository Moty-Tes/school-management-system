import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'sm' | 'md' | 'lg' | 'full';
  border?: boolean;
  borderColor?: string;
  bg?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  direction?: 'vertical' | 'horizontal';
}

const radiusMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const shadowMap = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
};

const paddingMap = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
  xl: 'p-8',
};

const directionClass = {
  vertical: 'flex flex-col',
  horizontal: 'flex flex-row',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', children, elevation = 'md', shadow = 'md', radius = 'lg', border = false, borderColor, bg, padding = 'md', direction = 'vertical', style, ...props }, ref) => {
    const radiusClass = radiusMap[radius] || radiusMap.lg;
    const shadowClass = shadowMap[shadow] || shadowMap.md;
    const paddingClass = paddingMap[padding] || paddingMap.md;
    const directionClassName = directionClass[direction] || directionClass.vertical;

    const baseClasses = `overflow-hidden ${shadowClass} ${radiusClass} transition-all duration-200 hover:shadow-lg`;
    const borderClass = border ? `border ${borderColor || 'border-slate-200 dark:border-slate-800'}` : '';
    const bgClass = bg ? `bg-${bg}` : 'bg-white dark:bg-slate-900';
    const domStyle = typeof style === 'object' && style !== null ? style : undefined;

    return (
      <div
        ref={ref}
        style={domStyle}
        className={`${baseClasses} ${borderClass} ${bgClass} ${paddingClass} ${directionClassName} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
