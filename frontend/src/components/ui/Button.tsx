import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base: minimum 44px touch target (WCAG AAA)
          "inline-flex items-center justify-center rounded-lg font-medium",
          "min-h-[44px] min-w-[44px]",
          "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
          "disabled:pointer-events-none disabled:opacity-50",
          // Variants
          variant === 'primary' && "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
          variant === 'secondary' && "bg-gray-800 text-gray-100 hover:bg-gray-700 active:bg-gray-600",
          variant === 'ghost' && "bg-transparent text-gray-100 hover:bg-gray-800 active:bg-gray-700",
          // Sizes
          size === 'sm' && "px-3 py-2 text-sm",
          size === 'md' && "px-4 py-2",
          size === 'lg' && "px-6 py-3 text-lg",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
