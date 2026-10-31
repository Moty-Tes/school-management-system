import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const buttonVariants = {
  primary: 'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
  secondary: 'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
  link: 'underline-offset-4 hover:underline text-indigo-600 dark:text-indigo-400 font-semibold disabled:opacity-50 disabled:pointer-events-none',
  danger: 'inline-flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-xs',
  lg: 'px-6 py-3 text-sm',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', asChild, children, variant = 'primary', size = 'md', loading, disabled, type = 'button', style, ...props }, ref) => {
    const variantClass = buttonVariants[variant] || buttonVariants.primary;
    const sizeClass = buttonSizes[size] || buttonSizes.md;
    const domStyle = typeof style === 'object' && style !== null ? style : undefined;

    return (
      <button
        ref={ref}
        type={type}
        style={domStyle}
        disabled={disabled || loading}
        className={`${variantClass} ${sizeClass} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  vertical?: boolean;
}

export const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className = '', children, variant = 'primary', vertical = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`inline-flex ${vertical ? 'flex-col' : 'flex-row'} gap-1.5 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ButtonGroup.displayName = 'ButtonGroup';
