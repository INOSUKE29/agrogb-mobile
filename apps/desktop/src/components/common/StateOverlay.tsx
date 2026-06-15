import React, { ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface StateOverlayProps {
    loading: boolean;
    error: Error | string | null;
    isEmpty: boolean;
    onRetry?: () => void;
    emptyAction?: ReactNode;
    emptyMessage?: string;
    skeletonLines?: number;
    children: ReactNode;
}

export function StateOverlay({
    loading,
    error,
    isEmpty,
    onRetry,
    emptyAction,
    emptyMessage = 'Nenhum registro encontrado.',
    skeletonLines = 3,
    children
}: StateOverlayProps) {
    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                {Array.from({ length: skeletonLines }).map((_, i) => (
                    <div key={i} className="h-16 bg-white/5 rounded-xl border border-[rgba(255,255,255,0.02)]"></div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center animate-fade-in-up">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Não foi possível carregar</h3>
                <p className="text-[var(--color-muted)] max-w-md mb-6">
                    {typeof error === 'string' ? error : error.message || 'Ocorreu um erro inesperado ao se comunicar com o servidor.'}
                </p>
                {onRetry && (
                    <button 
                        onClick={onRetry}
                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" /> Tentar Novamente
                    </button>
                )}
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="bg-black/20 border border-[rgba(255,255,255,0.05)] rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-3xl">
                    📭
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{emptyMessage}</h3>
                <p className="text-[var(--color-muted)] max-w-md mb-6">
                    Quando houverem dados cadastrados, eles aparecerão organizados aqui.
                </p>
                {emptyAction}
            </div>
        );
    }

    return <>{children}</>;
}
