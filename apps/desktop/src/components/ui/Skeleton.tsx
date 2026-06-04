import React from 'react';

type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
    return (
        <div 
            className={`animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/10 ${className}`} 
            {...props} 
        />
    );
};
