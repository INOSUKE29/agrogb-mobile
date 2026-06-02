import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className = '',
    disabled,
    ...props
}) => {
    // Base classes
    const baseClasses = 'inline-flex items-center justify-center font-bold transition-all rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-[var(--color-background)] focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed';
    
    // Sizing
    const sizeClasses = {
        sm: 'text-xs px-3 py-1.5 gap-1.5',
        md: 'text-sm px-5 py-2.5 gap-2',
        lg: 'text-base px-6 py-3.5 gap-2.5'
    };

    // Variants
    const variantClasses = {
        primary: 'bg-[var(--color-primary)] hover:bg-emerald-600 dark:hover:bg-[var(--color-primary)]/90 text-white border-transparent shadow-lg shadow-[var(--color-primary)]/20 focus:ring-[var(--color-primary)]',
        secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-white border-slate-200 dark:border-white/5 focus:ring-slate-500',
        danger: 'bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-500 border-red-200 dark:border-red-500/30 focus:ring-red-500',
        ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-[var(--color-muted)] hover:text-slate-900 dark:hover:text-white border-transparent focus:ring-slate-500',
        outline: 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-white border-slate-300 dark:border-[var(--color-border)] focus:ring-slate-500'
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button
            className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </button>
    );
};
