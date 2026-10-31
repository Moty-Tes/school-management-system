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
  primary: 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-4 disabled:opacity-50 disabled:pointer-events-none',
  secondary: 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium border border-slate-300 bg-white px-3 py-1.5 disabled:opacity-50 disabled:pointer-events-none',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:pointer-events-none',
  link: 'underline-offset-4 hover:underline text-slate-600 disabled:opacity-50 disabled:pointer-events-none',
  danger: 'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50 disabled:pointer-events-none',
};

const buttonIconSize = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild, children, variant = 'primary', size = 'md', loading, disabled, type, ...props }, ref) => {
    const Comp = asChild ? React.Children.toArray(children)[0] : 'button';

    const variantClass = buttonVariants[variant] || buttonVariants.primary;
    const iconSize = buttonIconSize[size] || buttonIconSize.md;

    return (
      <Comp
        className={className}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className={iconSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14l-7 7" />
            <path d="M14 19l-7-7" />
            <path d="M10 13l-2.3 2.3" />
            <path d="M14 10l2-2l2.3 2.3" />
          </svg>
        ) : children}
      </Comp>
    );
  },
);

Button.displayName = 'Button';

export { Button };

export interface ButtonGroupProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  vertical?: boolean;
}

const ButtonGroup = React.forwardRef<HTMLDivElement, ButtonGroupProps>(
  ({ className, children, variant = 'primary', vertical, ...props }, ref) => {
    const verticalClass = vertical ? 'flex-col' : 'flex-row';

    return (
      <div
        className={className}
        ref={ref}
        style={{ display: 'flex', flexDirection: verticalClass }}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          const childElement = React.isValidElement(child);
          if (!childElement) return null;

          const childType = childElement.type?.displayName || childElement.type?.name || '';
          const isButton = childType.includes('Button');

          return isButton ? (
            <div key={index} style={{ flex: '0 0 auto' }}>
              {React.cloneElement(childElement, {
                variant: variant as any,
                ...childElement.props,
              })}
            </div>
          ) : childElement;
        })}
      </div>
    );
  },
);

ButtonGroup.displayName = 'ButtonGroup';

export { ButtonGroup };