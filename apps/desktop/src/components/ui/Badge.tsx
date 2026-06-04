import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ 
    variant = 'neutral', 
    className = '', 
    children, 
    ...props 
}) => {
    const variants = {
        success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
        error: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
        neutral: 'bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-white/80 border-slate-200 dark:border-white/10'
    };

    return (
        <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};
