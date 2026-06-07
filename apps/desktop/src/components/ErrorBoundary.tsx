import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro React Capturado (Global):', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#0D1711] text-white">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
          <h1 className="text-3xl font-black mb-2 text-center">Ops! Algo deu errado.</h1>
          <p className="text-gray-400 text-center max-w-lg mb-8">
            Encontramos um erro inesperado ao renderizar esta interface. 
            Isso pode ter ocorrido devido a uma instabilidade temporária.
          </p>
          <div className="glass p-4 rounded-xl border border-red-500/20 bg-red-500/5 mb-8 w-full max-w-2xl overflow-auto text-left">
            <p className="text-red-400 font-mono text-sm break-words">
              {this.state.error?.message || 'Erro desconhecido.'}
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 font-bold transition-all shadow-lg"
          >
            <RefreshCcw className="w-5 h-5" />
            Recarregar Aplicativo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
