import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'raised' | 'hoverable';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'raised', padding = 'md', children, ...props }, ref) => {
    const baseStyle = 'rounded-2xl overflow-hidden transition-all duration-300 bg-white dark:bg-slate-900';

    const variants = {
      flat: 'border border-slate-200 dark:border-slate-800',
      raised: 'border border-slate-200/60 dark:border-slate-800 shadow-sm',
      hoverable: 'border border-slate-200/60 dark:border-slate-800/80 shadow-sm hover:shadow-md hover:border-primary-500/20 hover:-translate-y-1 cursor-pointer',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyle, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
