import React, { useState } from 'react';
import { FileText, Download, Calendar, BarChart2, DollarSign, Package, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RelatoriosScreen() {
    const [selectedReport, setSelectedReport] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const reports = [
        { id: 'finance', title: 'Balanço Financeiro', icon: DollarSign, desc: 'Fluxo de caixa, DRE e custos operacionais.' },
        { id: 'production', title: 'Produtividade por Talhão', icon: BarChart2, desc: 'Mapa de colheita e rendimento por hectare.' },
        { id: 'inventory', title: 'Inventário de Insumos', icon: Package, desc: 'Estoque atual, movimentações e validade.' },
        { id: 'agronomic', title: 'Caderno Agrícola', icon: FileText, desc: 'Histórico de aplicações e manejos.' }
    ];

    const isValid = selectedReport && dateRange.start && dateRange.end && dateRange.start <= dateRange.end;

    const handleGenerate = () => {
        if (!isValid) return;
        setIsGenerating(true);
        setSuccessMsg(null);
        
        // Simulating report generation (Visibility of System Status Heuristic)
        setTimeout(() => {
            setIsGenerating(false);
            setSuccessMsg('Relatório gerado com sucesso! O download começará em instantes.');
            setTimeout(() => setSuccessMsg(null), 5000);
        }, 2500);
    };

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto space-y-8">
            
            {/* HERO SECTION */}
            <div className="relative rounded-3xl overflow-hidden border border-[var(--color-border)] shadow-xl group">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    <img src="/hero_reports.png" alt="Data Analytics Background" className="w-full h-full object-cover opacity-80 dark:opacity-50 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/90 to-transparent" />
                </div>
                
                <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-bold mb-4 backdrop-blur-md">
                            <BarChart2 className="w-4 h-4" /> Inteligência de Dados
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-[var(--color-foreground)] tracking-tight mb-4 drop-shadow-sm">
                            Central de Relatórios
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg">
                            Exporte dados estruturados da sua operação. Acompanhe o fluxo de caixa, produtividade por área e inventário em tempo real com precisão absoluta.
                        </p>
                    </div>
                </div>
            </div>

            {/* 12-COLUMN GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* CONFIGURAÇÃO DO RELATÓRIO (8 Colunas) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <h2 className="text-2xl font-bold text-[var(--color-foreground)]">Selecione o Módulo</h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {reports.map((report) => {
                            const Icon = report.icon;
                            const isSelected = selectedReport === report.id;
                            return (
                                <button
                                    key={report.id}
                                    onClick={() => setSelectedReport(report.id)}
                                    className={`text-left p-6 rounded-2xl transition-all duration-200 border ${
                                        isSelected 
                                            ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] shadow-md ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)]' 
                                            : 'bg-[var(--color-card)] border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:shadow-lg'
                                    }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${isSelected ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' : 'bg-gray-100 dark:bg-white/5 text-[var(--color-muted)]'}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className={`text-lg font-bold mb-2 ${isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-foreground)]'}`}>
                                        {report.title}
                                    </h3>
                                    <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                                        {report.desc}
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* PAINEL DE EXPORTAÇÃO (4 Colunas) */}
                <div className="lg:col-span-4">
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-3xl p-6 sticky top-8 shadow-xl">
                        <h3 className="text-xl font-bold text-[var(--color-foreground)] mb-6 border-b border-[var(--color-border)] pb-4">
                            Parâmetros
                        </h3>

                        {/* Date Picker Section */}
                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-muted)] mb-2">Data Inicial</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                                    <input 
                                        type="date" 
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[var(--color-muted)] mb-2">Data Final</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                                    <input 
                                        type="date" 
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                {dateRange.start && dateRange.end && dateRange.start > dateRange.end && (
                                    <p className="text-red-500 text-xs mt-2 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" /> A data final deve ser maior que a inicial.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* System Status / Feedback */}
                        {successMsg && (
                            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-600 dark:text-green-400 text-sm font-medium flex items-start gap-2 animate-fade-in">
                                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                <p>{successMsg}</p>
                            </div>
                        )}

                        {/* Action Button */}
                        <button 
                            onClick={handleGenerate}
                            disabled={!isValid || isGenerating}
                            className={`w-full py-4 px-6 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                                isGenerating 
                                    ? 'bg-[var(--color-muted)] text-white cursor-wait' 
                                    : isValid 
                                        ? 'bg-[var(--color-primary)] text-white shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95' 
                                        : 'bg-gray-200 dark:bg-white/5 text-gray-400 dark:text-white/20 cursor-not-allowed'
                            }`}
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processando Dados...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    <span>Baixar Relatório (PDF)</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
