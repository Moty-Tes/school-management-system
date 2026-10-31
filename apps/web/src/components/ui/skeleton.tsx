import * as React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  width?: string | number;
  height?: string | number;
  radius?: 'sm' | 'md' | 'lg' | 'full';
  bg?: string;
  animated?: boolean;
  type?: 'default' | 'text' | 'button' | 'circle' | 'avatar';
}

const radiusMap = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

const typeStyles = {
  default: 'h-8 w-full rounded-xl mb-2',
  text: 'h-4 w-3/4 rounded-lg mb-2',
  button: 'h-10 w-full rounded-xl mb-3',
  circle: 'h-10 w-10 rounded-full',
  avatar: 'h-10 w-10 rounded-xl',
};

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = '', width, height, radius = 'lg', bg, animated = true, type = 'default', style, ...props }, ref) => {
    const radiusClass = radiusMap[radius] || radiusMap.lg;
    const typeClass = typeStyles[type] || typeStyles.default;
    const animationClass = animated ? 'animate-pulse' : '';

    return (
      <div
        ref={ref}
        className={`bg-slate-200/80 dark:bg-slate-800/80 ${typeClass} ${radiusClass} ${animationClass} ${className}`}
        style={{
          width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
          height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
          ...style,
        }}
        {...props}
      />
    );
  },
);

Skeleton.displayName = 'Skeleton';
