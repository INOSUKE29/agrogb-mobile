import React, { useState, useEffect } from 'react';
import { 
    PieChart, 
    TrendingUp, 
    DollarSign, 
    Package, 
    Leaf, 
    Activity, 
    Calendar,
    Download,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { supabase } from '../../services/supabase';

export default function RelatoriosDashboardScreen() {
    const [loading, setLoading] = useState(true);
    
    // Métricas principais
    const [totalVendas, setTotalVendas] = useState(0);
    const [totalDespesas, setTotalDespesas] = useState(0);
    const [saldoCaixa, setSaldoCaixa] = useState(0);
    const [totalColhido, setTotalColhido] = useState(0);

    // Mock dados para gráficos
    const [vendasMensais, setVendasMensais] = useState<any[]>([]);
    
    useEffect(() => {
        fetchDadosBI();
    }, []);

    const fetchDadosBI = async () => {
        setLoading(true);
        try {
            // 1. Busca de Vendas (Receitas)
            const { data: vendas } = await supabase.from('vendas').select('valor_total, created_at');
            const totalV = (vendas || []).reduce((acc, cur) => acc + (cur.valor_total || 0), 0);
            
            // 2. Busca de Contas (Para pegar despesas - apenas mock simplificado se tabela faltar)
            const { data: contas } = await supabase.from('contas').select('valor, tipo');
            const despesas = (contas || []).filter(c => c.tipo === 'DESPESA').reduce((acc, cur) => acc + (cur.valor || 0), 0);
            
            setTotalVendas(totalV);
            setTotalDespesas(despesas);
            setSaldoCaixa(totalV - despesas); // Simplificação
            setTotalColhido(125000); // Mock de 125 toneladas para visual

            // Mock distribuição mensal
            setVendasMensais([
                { mes: 'Jan', valor: totalV * 0.1 },
                { mes: 'Fev', valor: totalV * 0.15 },
                { mes: 'Mar', valor: totalV * 0.25 },
                { mes: 'Abr', valor: totalV * 0.3 },
                { mes: 'Mai', valor: totalV * 0.1 },
                { mes: 'Jun', valor: totalV * 0.1 },
            ]);

        } catch (error) {
            console.error('Erro ao carregar BI:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    return (
        <div className="animate-fade-in pb-12 space-y-8">
            {/* HERO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm font-bold mb-4">
                            <PieChart className="w-4 h-4" /> Inteligência de Negócios
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                            Dashboard de Resultados
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Visão panorâmica da rentabilidade, custos de produção e indicadores de sucesso da sua safra.
                        </p>
                    </div>
                    <button className="bg-gray-100 dark:bg-white/5 hover:bg-white/10 border border-white/10 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
                        <Download className="w-5 h-5" /> Exportar PDF
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full"></div></div>
            ) : (
                <>
                    {/* KPIs SUPERIORES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Receita Total */}
                        <div className="glass p-6 rounded-3xl relative overflow-hidden group bg-[#0B1521] border border-gray-800 shadow-2xl shadow-slate-900/40 hover:border-white/10 hover:-translate-y-1 transition-all">
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 bg-white/5 rounded-full text-white">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/10">
                                    <ArrowUpRight className="w-3 h-3" /> +12.5%
                                </span>
                            </div>
                            <h3 className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1 relative z-10">Faturamento Bruto</h3>
                            <p className="text-3xl font-black text-white relative z-10">{formatCurrency(totalVendas)}</p>
                        </div>

                        {/* Despesas */}
                        <div className="glass p-6 rounded-3xl relative overflow-hidden group bg-[#0B1521] border border-gray-800 shadow-2xl shadow-slate-900/40 hover:border-white/10 hover:-translate-y-1 transition-all">
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 bg-white/5 rounded-full text-white">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/10">
                                    <ArrowDownRight className="w-3 h-3" /> +4.2%
                                </span>
                            </div>
                            <h3 className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1 relative z-10">Custos Operacionais</h3>
                            <p className="text-3xl font-black text-white relative z-10">{formatCurrency(totalDespesas)}</p>
                        </div>

                        {/* Lucro Líquido */}
                        <div className="glass p-6 rounded-3xl relative overflow-hidden group bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 shadow-xl shadow-slate-200/60 dark:shadow-none hover:border-[var(--color-primary)]/30 hover:-translate-y-1 transition-all">
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 bg-[var(--color-primary)]/10 rounded-full text-[var(--color-primary)]">
                                    <Activity className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1 relative z-10">Lucro Líquido / Caixa</h3>
                            <p className="text-3xl font-black text-white relative z-10">{formatCurrency(saldoCaixa)}</p>
                        </div>

                        {/* Produção */}
                        <div className="glass p-6 rounded-3xl relative overflow-hidden group bg-[#0B1521] border border-gray-800 shadow-2xl shadow-slate-900/40 hover:border-white/10 hover:-translate-y-1 transition-all">
                            <div className="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="p-3 bg-white/5 rounded-full text-white">
                                    <Leaf className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1 relative z-10">Volume Colhido</h3>
                            <p className="text-3xl font-black text-white relative z-10">{totalColhido.toLocaleString()} <span className="text-lg text-[var(--color-muted)]">KG</span></p>
                        </div>
                    </div>

                    {/* CHARTS AREA */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* CHART 1: Faturamento Mensal (Monochrome + Accent) */}
                        <div className="lg:col-span-2 glass p-6 rounded-3xl flex flex-col h-[400px] bg-[#0B1521] border border-gray-800 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
                            <div className="flex justify-between items-center mb-8 relative z-10">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-[var(--color-muted)]" /> Evolução de Faturamento
                                </h3>
                                <select className="bg-gray-100 dark:bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-gray-900 dark:text-white outline-none cursor-pointer hover:bg-white/10 transition-colors">
                                    <option>Safra 2025/2026</option>
                                    <option>Safra 2024/2025</option>
                                </select>
                            </div>

                            <div className="flex-1 flex items-end justify-between gap-2 px-4 pb-2 border-b border-white/10 relative z-10">
                                {/* Grid lines */}
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                                    <div className="border-t border-dashed border-white w-full h-0"></div>
                                    <div className="border-t border-dashed border-white w-full h-0"></div>
                                    <div className="border-t border-dashed border-white w-full h-0"></div>
                                </div>

                                {/* Bars - Professional Grey/Emerald hover */}
                                {vendasMensais.map((d, i) => {
                                    const maxVal = Math.max(...vendasMensais.map(m => m.valor), 1);
                                    const heightPct = (d.valor / maxVal) * 100;
                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1 group z-10">
                                            <div className="w-full max-w-[40px] bg-gradient-to-t from-white/5 to-white/10 rounded-t-lg relative transition-all duration-500 ease-out border-t-2 border-white/20 group-hover:from-[var(--color-primary)]/30 group-hover:to-[var(--color-primary)] group-hover:border-[var(--color-primary)]" style={{ height: `${Math.max(heightPct, 5)}%` }}>
                                                {/* Tooltip on hover */}
                                                <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black border border-white/10 text-gray-900 dark:text-white text-xs font-bold px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                                                    {formatCurrency(d.valor)}
                                                </div>
                                            </div>
                                            <span className="text-xs text-[var(--color-muted)] font-bold mt-3 uppercase tracking-widest">{d.mes}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* CHART 2: Distribuição de Custos (Monochrome) */}
                        <div className="lg:col-span-1 glass p-6 rounded-3xl flex flex-col h-[400px] bg-[#111111] border border-gray-800 shadow-2xl relative overflow-hidden">
                            <h3 className="text-lg font-black text-white flex items-center gap-2 mb-8 relative z-10">
                                <Package className="w-5 h-5 text-gray-400" /> Composição de Custos
                            </h3>

                            <div className="flex-1 flex flex-col justify-center gap-6 relative z-10">
                                {/* Progress Bar Items */}
                                {[
                                    { label: 'Defensivos', value: 45 },
                                    { label: 'Sementes', value: 25 },
                                    { label: 'Fertilizantes', value: 20 },
                                    { label: 'Combustível', value: 10 },
                                ].map((item, i) => (
                                    <div key={i} className="group cursor-pointer">
                                        <div className="flex justify-between text-sm font-bold mb-2">
                                            <span className="text-white group-hover:text-[var(--color-primary)] transition-colors">{item.label}</span>
                                            <span className="text-[var(--color-muted)] group-hover:text-[var(--color-primary)] transition-colors">{item.value}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-white/5 h-2 rounded-full overflow-hidden border border-gray-200 dark:border-white/5">
                                            <div className="h-full bg-white/20 group-hover:bg-[var(--color-primary)] transition-colors rounded-full" style={{ width: `${item.value}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </>
            )}
        </div>
    );
}
