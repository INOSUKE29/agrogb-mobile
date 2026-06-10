import React, { useState } from 'react';
import { DollarSign, TrendingDown, TrendingUp, Tags, Database } from 'lucide-react';
import FinancialScreen from './FinancialScreen';
import CustosScreen from './CustosScreen';
import VendasScreen from './VendasScreen';
import CategoriasDespesaScreen from './CategoriasDespesaScreen';
import CadastroBasicoScreen from './CadastroBasicoScreen';

export default function FinanceiroMestreScreen() {
    const [activeTab, setActiveTab] = useState<'PAINEL' | 'CUSTOS' | 'VENDAS' | 'CATEGORIAS' | 'CATALOGO'>('PAINEL');

    return (
        <div className="animate-fade-in flex flex-col h-full space-y-6">
            
            {/* TABS NAVIGATION */}
            <div className="flex flex-wrap md:flex-nowrap bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0 mx-auto w-full max-w-5xl mt-4 gap-1">
                <button
                    onClick={() => setActiveTab('PAINEL')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'PAINEL'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <DollarSign className="w-4 h-4" /> Painel Geral
                </button>
                <button
                    onClick={() => setActiveTab('CUSTOS')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'CUSTOS'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <TrendingDown className="w-4 h-4" /> Custos
                </button>
                <button
                    onClick={() => setActiveTab('VENDAS')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'VENDAS'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <TrendingUp className="w-4 h-4" /> Vendas
                </button>
                <button
                    onClick={() => setActiveTab('CATEGORIAS')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'CATEGORIAS'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Tags className="w-4 h-4" /> Categorias
                </button>
                <button
                    onClick={() => setActiveTab('CATALOGO')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'CATALOGO'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Database className="w-4 h-4" /> Catálogo
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-auto custom-scrollbar relative px-1">
                {activeTab === 'PAINEL' && <FinancialScreen />}
                {activeTab === 'CUSTOS' && <CustosScreen />}
                {activeTab === 'VENDAS' && <VendasScreen />}
                {activeTab === 'CATEGORIAS' && <CategoriasDespesaScreen />}
                {activeTab === 'CATALOGO' && <CadastroBasicoScreen />}
            </div>

        </div>
    );
}
