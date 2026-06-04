import React from 'react';

export const Card = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
    return (
        <div className={`bg-white dark:bg-[#111111] rounded-3xl border border-slate-200 dark:border-white/5 shadow-xl shadow-slate-200/60 dark:shadow-none overflow-hidden ${className}`} {...props}>
            {children}
        </div>
    );
};

export const CardHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`p-6 pb-4 flex flex-col gap-1.5 ${className}`} {...props}>
        {children}
    </div>
);

export const CardTitle = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={`font-black text-slate-900 dark:text-white text-lg tracking-tight ${className}`} {...props}>
        {children}
    </h3>
);

export const CardDescription = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={`text-sm font-medium text-slate-500 dark:text-[var(--color-muted)] ${className}`} {...props}>
        {children}
    </p>
);

export const CardContent = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`p-6 pt-0 ${className}`} {...props}>
        {children}
    </div>
);

export const CardFooter = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={`p-6 pt-0 flex items-center ${className}`} {...props}>
        {children}
    </div>
);
