import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { label: string; value: string | number }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
    label,
    error,
    options,
    className = '',
    id,
    ...props
}, ref) => {
    const selectId = id || Math.random().toString(36).substring(7);

    return (
        <div className="w-full flex flex-col gap-1.5">
            {label && (
                <label htmlFor={selectId} className="block text-sm font-bold text-slate-900 dark:text-white">
                    {label}
                </label>
            )}
            <div className="relative flex items-center">
                <select
                    ref={ref}
                    id={selectId}
                    className={`
                        w-full bg-slate-50 dark:bg-[var(--color-background)] text-slate-900 dark:text-white text-sm rounded-xl block p-3 pr-10 transition-all outline-none border appearance-none cursor-pointer
                        ${error ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' : 'border-slate-200 dark:border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'}
                        ${className}
                    `}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <div className="absolute right-3 text-slate-400 dark:text-[var(--color-muted)] pointer-events-none">
                    <ChevronDown className="w-5 h-5" />
                </div>
            </div>
            
            {error && (
                <span className="text-xs font-semibold text-red-500 dark:text-red-400 mt-0.5">
                    {error}
                </span>
            )}
        </div>
    );
});

Select.displayName = 'Select';
