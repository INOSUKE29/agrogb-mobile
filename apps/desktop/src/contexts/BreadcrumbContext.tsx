import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface BreadcrumbItem {
    label: string;
    path?: string;
    onClick?: () => void;
}

interface BreadcrumbContextType {
    breadcrumbs: BreadcrumbItem[];
    setBreadcrumbs: (crumbs: BreadcrumbItem[]) => void;
    title: string;
    setTitle: (title: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
    const [title, setTitle] = useState('');

    return (
        <BreadcrumbContext.Provider value={{ breadcrumbs, setBreadcrumbs, title, setTitle }}>
            {children}
        </BreadcrumbContext.Provider>
    );
}

export function useBreadcrumbs() {
    const context = useContext(BreadcrumbContext);
    if (!context) {
        throw new Error('useBreadcrumbs must be used within a BreadcrumbProvider');
    }
    return context;
}
