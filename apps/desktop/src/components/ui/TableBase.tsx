import React from 'react';

export const Table = ({ className = '', ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className="w-full overflow-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111111] shadow-sm">
        <table className={`w-full caption-bottom text-sm ${className}`} {...props} />
    </div>
);

export const Thead = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className={`border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 ${className}`} {...props} />
);

export const Tbody = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props} />
);

export const Tr = ({ className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={`border-b border-slate-100 dark:border-white/5 transition-colors hover:bg-slate-50/50 dark:hover:bg-white/5 data-[state=selected]:bg-slate-100 dark:data-[state=selected]:bg-white/10 ${className}`} {...props} />
);

export const Th = ({ className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className={`h-12 px-4 text-left align-middle font-bold text-slate-600 dark:text-[var(--color-muted)] [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
);

export const Td = ({ className = '', ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className={`p-4 align-middle text-slate-800 dark:text-white/90 [&:has([role=checkbox])]:pr-0 ${className}`} {...props} />
);
