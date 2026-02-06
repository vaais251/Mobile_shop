import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'gradient';
    hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
        const baseStyles = 'rounded-2xl overflow-hidden';

        const variants = {
            default: 'bg-gray-900 border border-gray-800',
            glass:
                'bg-gray-900/50 backdrop-blur-xl border border-gray-700/50',
            gradient:
                'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50',
        };

        const hoverStyles = hover
            ? 'transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10'
            : '';

        return (
            <div
                ref={ref}
                className={cn(baseStyles, variants[variant], hoverStyles, className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('p-6', className)} {...props} />
    )
);

CardHeader.displayName = 'CardHeader';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
    )
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('p-6 pt-0 flex items-center gap-4', className)}
            {...props}
        />
    )
);

CardFooter.displayName = 'CardFooter';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3
            ref={ref}
            className={cn('text-xl font-semibold text-white', className)}
            {...props}
        />
    )
);

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p
            ref={ref}
            className={cn('text-sm text-gray-400 mt-1', className)}
            {...props}
        />
    )
);

CardDescription.displayName = 'CardDescription';

export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription };
