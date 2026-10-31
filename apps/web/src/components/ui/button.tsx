import * as React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild, children, ...props }, ref) => {
    const Comp = asChild ? React.Children.toArray(children)[0] : 'button';
    return (
      <Comp className={className} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button };