import React, { useState } from 'react';
import { BookOpen, FileText, Activity, CheckSquare, CloudRain } from 'lucide-react';
import CadernoAgricolaScreen from './CadernoAgricolaScreen';
import RecomendacoesScreen from './RecomendacoesScreen';
import MonitoramentoScreen from './MonitoramentoScreen';
import TarefasScreen from './TarefasScreen';
import ClimaScreen from './ClimaScreen';

export default function OperacoesScreen() {
    const [activeTab, setActiveTab] = useState<'CADERNO' | 'RECOMENDACOES' | 'MONITORAMENTO' | 'TAREFAS' | 'CLIMA'>('CADERNO');

    return (
        <div className="animate-fade-in flex flex-col h-full space-y-6">
            
            {/* TABS NAVIGATION */}
            <div className="flex flex-wrap md:flex-nowrap bg-white/5 p-1 rounded-2xl border border-white/10 shrink-0 mx-auto w-full max-w-5xl mt-4 gap-1">
                <button
                    onClick={() => setActiveTab('CADERNO')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'CADERNO'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <BookOpen className="w-4 h-4" /> Caderno Agrícola
                </button>
                <button
                    onClick={() => setActiveTab('RECOMENDACOES')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'RECOMENDACOES'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <FileText className="w-4 h-4" /> Recomendações
                </button>
                <button
                    onClick={() => setActiveTab('MONITORAMENTO')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'MONITORAMENTO'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <Activity className="w-4 h-4" /> Monitoramento
                </button>
                <button
                    onClick={() => setActiveTab('TAREFAS')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'TAREFAS'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <CheckSquare className="w-4 h-4" /> Tarefas
                </button>
                <button
                    onClick={() => setActiveTab('CLIMA')}
                    className={`flex-1 py-3 px-2 rounded-xl flex items-center justify-center gap-2 font-bold transition-all text-sm min-w-[120px] ${
                        activeTab === 'CLIMA'
                            ? 'bg-[var(--color-primary)] text-gray-900 shadow-md scale-[1.02]'
                            : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-white'
                    }`}
                >
                    <CloudRain className="w-4 h-4" /> Estação Clima
                </button>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 overflow-auto custom-scrollbar relative px-1">
                {activeTab === 'CADERNO' && <CadernoAgricolaScreen />}
                {activeTab === 'RECOMENDACOES' && <RecomendacoesScreen />}
                {activeTab === 'MONITORAMENTO' && <MonitoramentoScreen />}
                {activeTab === 'TAREFAS' && <TarefasScreen />}
                {activeTab === 'CLIMA' && <ClimaScreen />}
            </div>

        </div>
    );
}
