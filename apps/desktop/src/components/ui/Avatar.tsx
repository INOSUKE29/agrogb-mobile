import React from 'react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ 
    src, 
    alt, 
    fallback, 
    size = 'md', 
    className = '', 
    ...props 
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base'
    };

    return (
        <div 
            className={`relative flex shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {src ? (
                <img 
                    src={src} 
                    alt={alt || "Avatar"} 
                    className="aspect-square h-full w-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
            ) : (
                <div className="flex h-full w-full items-center justify-center font-bold text-slate-700 dark:text-[var(--color-muted)]">
                    {fallback || '?'}
                </div>
            )}
        </div>
    );
};
