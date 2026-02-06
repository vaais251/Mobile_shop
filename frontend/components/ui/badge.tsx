import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'md', ...props }, ref) => {
        const baseStyles =
            'inline-flex items-center font-medium rounded-full';

        const variants = {
            default: 'bg-gray-700 text-gray-200',
            success: 'bg-green-500/20 text-green-400 border border-green-500/30',
            warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
            info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            outline: 'bg-transparent border border-gray-600 text-gray-300',
        };

        const sizes = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-2.5 py-1 text-sm',
            lg: 'px-3 py-1.5 text-base',
        };

        return (
            <span
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            />
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
