import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    children?: ReactNode;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundaryClass extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} />;
        }

        return this.props.children;
    }
}

function ErrorFallback({ error }: { error: Error | null }) {
    const navigate = useNavigate();

    const handleReload = () => {
        window.location.reload();
    };

    const handleGoHome = () => {
        navigate('/dashboard/agronomo');
        window.location.reload(); // Ensures state is cleared
    };

    const handleSendReport = () => {
        alert('Relatório de erro enviado à equipe técnica!');
    };

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 animate-fade-in">
            <div className="glass p-10 rounded-3xl max-w-lg w-full border border-red-500/20 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertOctagon className="w-10 h-10 text-red-500" />
                </div>
                
                <h2 className="text-2xl font-black text-white mb-2">
                    Não foi possível carregar esta tela.
                </h2>
                
                <p className="text-[var(--color-muted)] mb-8">
                    {error?.message || 'Um erro inesperado ocorreu durante a renderização do componente.'}
                </p>

                <div className="space-y-3">
                    <button 
                        onClick={handleReload}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 border border-[var(--color-border)] text-white font-bold rounded-xl transition-all"
                    >
                        <RotateCcw className="w-5 h-5" /> Recarregar
                    </button>
                    
                    <button 
                        onClick={handleGoHome}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--color-primary)] hover:opacity-90 text-gray-900 font-bold rounded-xl shadow-lg shadow-[var(--color-primary)]/20 transition-all"
                    >
                        <Home className="w-5 h-5" /> Voltar ao Painel do Agrônomo
                    </button>

                    <button 
                        onClick={handleSendReport}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-transparent hover:bg-white/5 text-[var(--color-muted)] hover:text-white font-bold rounded-xl transition-all"
                    >
                        <Send className="w-5 h-5" /> Enviar relatório
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-left">
                    <p className="text-xs font-mono text-[var(--color-muted)]/50">Código:</p>
                    <p className="text-xs font-mono font-bold text-[var(--color-muted)]">AGR-UI-001</p>
                </div>
            </div>
        </div>
    );
}

// Wrapper to use hooks like useNavigate
export default function ErrorBoundary({ children }: Props) {
    return (
        <ErrorBoundaryClass>
            {children}
        </ErrorBoundaryClass>
    );
}
