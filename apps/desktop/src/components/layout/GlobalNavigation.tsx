import React, { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

export function GlobalBackButton() {
    const navigate = useNavigate();
    const location = useLocation();
    const { breadcrumbs } = useBreadcrumbs();

    const handleBack = () => {
        // Se temos breadcrumbs, o penúltimo é o pai direto na hierarquia lógica.
        if (breadcrumbs.length > 1) {
            const parent = breadcrumbs[breadcrumbs.length - 2];
            if (parent.path) {
                navigate(parent.path);
                return;
            } else if (parent.onClick) {
                parent.onClick();
                return;
            }
        }

        // Fallback: se houver histórico, volta nativo. Se for deep link (histórico curto), sobe 1 nível da URL
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            const pathSegments = location.pathname.split('/').filter(Boolean);
            if (pathSegments.length > 1) {
                pathSegments.pop();
                navigate('/' + pathSegments.join('/'));
            } else {
                navigate('/dashboard');
            }
        }
    };

    // Atalhos de teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || (e.altKey && e.key === 'ArrowLeft')) {
                handleBack();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [breadcrumbs, location.pathname]);

    // Ocultar em telas raízes
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/cliente' || location.pathname === '/dashboard/agronomo' || location.pathname === '/dashboard/admin') {
        return null;
    }

    return (
        <button 
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-[var(--color-muted)] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm hover:shadow-md shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] group"
            title="Voltar (Esc ou Alt+←)"
        >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
        </button>
    );
}

export function GlobalBreadcrumb() {
    const { breadcrumbs } = useBreadcrumbs();

    if (breadcrumbs.length === 0) return null;

    return (
        <div className="px-4 sm:px-8 py-2 bg-black/20 border-t border-[rgba(255,255,255,0.02)] flex items-center text-xs font-medium text-[var(--color-muted)] overflow-x-auto whitespace-nowrap hide-scrollbar">
            {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                    {index > 0 && <span className="mx-2 text-[rgba(255,255,255,0.2)]">&gt;</span>}
                    {crumb.path ? (
                        <Link to={crumb.path} className="hover:text-white transition-colors cursor-pointer">
                            {crumb.label}
                        </Link>
                    ) : crumb.onClick ? (
                        <span onClick={crumb.onClick} className="hover:text-white transition-colors cursor-pointer">
                            {crumb.label}
                        </span>
                    ) : (
                        <span className={index === breadcrumbs.length - 1 ? "text-[var(--color-primary)] font-bold" : ""}>
                            {crumb.label}
                        </span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}
