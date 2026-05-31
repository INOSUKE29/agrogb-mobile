import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    label,
    error,
    leftIcon,
    rightIcon,
    className = '',
    id,
    ...props
}, ref) => {
    const inputId = id || Math.random().toString(36).substring(7);

    return (
        <div className="w-full flex flex-col gap-1.5">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-bold text-white">
                    {label}
                </label>
            )}
            <div className="relative flex items-center">
                {leftIcon && (
                    <div className="absolute left-3 text-[var(--color-muted)]">
                        {leftIcon}
                    </div>
                )}
                
                <input
                    ref={ref}
                    id={inputId}
                    className={`
                        w-full bg-[var(--color-background)] text-white text-sm rounded-xl block p-3 transition-all outline-none border
                        ${error ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-[var(--color-border)] focus:border-green-500 focus:ring-2 focus:ring-green-500/20'}
                        ${leftIcon ? 'pl-10' : ''}
                        ${rightIcon ? 'pr-10' : ''}
                        ${className}
                    `}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute right-3 text-[var(--color-muted)]">
                        {rightIcon}
                    </div>
                )}
            </div>
            
            {error && (
                <span className="text-xs font-semibold text-red-400 mt-0.5">
                    {error}
                </span>
            )}
        </div>
    );
});

Input.displayName = 'Input';
