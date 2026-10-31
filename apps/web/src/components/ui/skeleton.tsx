import * as React from 'react';

export interface SkeletonProps {
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
  lg: 'rounded-lg',
  full: 'rounded-full',
};

const bgMap = {
  default: 'bg-slate-200',
  text: 'bg-slate-100',
  button: 'bg-slate-300',
  circle: 'bg-slate-200',
  avatar: 'bg-slate-200',
};

const typeStyles = {
  default: 'h-8 w-full rounded-md mb-2',
  text: 'h-4 w-[]/60 rounded-md mb-1',
  button: 'h-10 w-full rounded-md mb-3',
  circle: 'h-8 w-8 rounded-full',
  avatar: 'h-10 w-10 rounded-md',
};

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, width, height, radius = 'md', bg = 'default', animated = true, type = 'default', ...props }, ref) => {
    const radiusClass = radiusMap[radius] || radiusMap.md;
    const bgClass = bgMap[bg] || bgMap.default;
    const typeClass = typeStyles[type] || typeStyles.default;
    const animationClass = animated ? 'animate-bounce' : '';

    return (
      <div
        ref={ref}
        className={`${className} ${typeClass} ${radiusClass} ${bgClass} ${animationClass}`}
        style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
        {...props}
      />
    );
  },
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };