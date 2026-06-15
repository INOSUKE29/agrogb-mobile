import React, { useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

export default function GlobalHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { breadcrumbs, title } = useBreadcrumbs();

    // Lógica inteligente de "Voltar"
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
                pathSegments.pop(); // Remove o último nível
                navigate('/' + pathSegments.join('/'));
            } else {
                navigate('/dashboard'); // Último recurso
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
        <header className="flex flex-col z-10 shrink-0 py-4 px-4 sm:px-8 border-b border-[rgba(255,255,255,0.05)] bg-[var(--color-background)]">
            
            {/* Linha 1: Breadcrumb */}
            {breadcrumbs.length > 0 && (
                <div className="flex items-center text-xs font-medium text-[var(--color-muted)] mb-3 overflow-x-auto whitespace-nowrap hide-scrollbar">
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
            )}

            {/* Linha 2: Título e Botão Voltar */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleBack}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] text-[var(--color-muted)] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all shadow-sm hover:shadow-md shrink-0 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    title="Voltar (Esc ou Alt+←)"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-black text-white tracking-tight truncate">
                    {title || "Carregando..."}
                </h2>
            </div>
        </header>
    );
}
