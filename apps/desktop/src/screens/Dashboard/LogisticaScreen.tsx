import React, { useState } from 'react';
import { Package, ShoppingCart, FileText, Store, Truck } from 'lucide-react';
import EstoqueScreen from './EstoqueScreen';
import ComprasScreen from './ComprasScreen';
import CotacoesScreen from './CotacoesScreen';
import FornecedoresScreen from './FornecedoresScreen';
import EncomendasScreen from './EncomendasScreen';

export default function LogisticaScreen() {
    const [activeTab, setActiveTab] = useState<'ESTOQUE' | 'COMPRAS' | 'COTACOES' | 'FORNECEDORES' | 'ENCOMENDAS'>('ESTOQUE');

    return (
        <div className="animate-fade-in flex flex-col h-full space-y-6">
            
            {/* TABS NAVIGATION */}
            <div className="flex flex-wrap md:flex-nowrap bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0 mx-auto w-full max-w-5xl mt-4 gap-1">
                <button
                    onClick={() => setActiveTab('ESTOQUE')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'ESTOQUE'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Package className="w-4 h-4" /> Estoque
                </button>
                <button
                    onClick={() => setActiveTab('COMPRAS')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'COMPRAS'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <ShoppingCart className="w-4 h-4" /> Compras
                </button>
                <button
                    onClick={() => setActiveTab('COTACOES')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'COTACOES'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4" /> Cotações
                </button>
                <button
                    onClick={() => setActiveTab('FORNECEDORES')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'FORNECEDORES'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Store className="w-4 h-4" /> Fornecedores
                </button>
                <button
                    onClick={() => setActiveTab('ENCOMENDAS')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'ENCOMENDAS'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Truck className="w-4 h-4" /> Encomendas
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-auto custom-scrollbar relative px-1">
                {activeTab === 'ESTOQUE' && <EstoqueScreen />}
                {activeTab === 'COMPRAS' && <ComprasScreen />}
                {activeTab === 'COTACOES' && <CotacoesScreen />}
                {activeTab === 'FORNECEDORES' && <FornecedoresScreen />}
                {activeTab === 'ENCOMENDAS' && <EncomendasScreen />}
            </div>

        </div>
    );
}
