import React, { useState, useEffect } from 'react';
import { 
    Users, 
    CalendarCheck, 
    FileText, 
    Map as MapIcon,
    ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';

export default function AgroDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [kpis, setKpis] = useState({
        clientesAtivos: 0,
        visitasSemana: 0,
        recomendacoesPendentes: 0,
        recomendacoesAprovadas: 0
    });

    const [alertas, setAlertas] = useState<any[]>([]);

    const [atividadesRecentes, setAtividadesRecentes] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                // 1. Clientes (agronomist_client_links)
                const { count: countClientes } = await supabase
                    .from('agronomist_client_links')
                    .select('*', { count: 'exact', head: true })
                    .eq('agronomist_id', user.id);

                // 2. Recomendações Pendentes
                const { count: countPendentes } = await supabase
                    .from('receitas_adubacao')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Pendente'); // Simplified for now, should link to agronomist

                // 3. Recomendações Aprovadas
                const { count: countAprovadas } = await supabase
                    .from('receitas_adubacao')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Aprovada');

                setKpis({
                    clientesAtivos: countClientes || 0,
                    visitasSemana: 5, // Fictício por enquanto
                    recomendacoesPendentes: countPendentes || 0,
                    recomendacoesAprovadas: countAprovadas || 0
                });

                // Alertas Importantes
                setAlertas([
                    { id: 1, tipo: 'warning', msg: `${countPendentes || 3} recomendações aguardando aprovação` },
                    { id: 2, tipo: 'info', msg: `2 visitas agendadas para hoje` }
                ]);

                // Se houver dados reais, podemos montar o gráfico. Senão, array vazio.
                setPieData([
                    { name: 'Soja', value: 40, color: '#10B981' },
                    { name: 'Milho', value: 35, color: '#F59E0B' }
                ]);

            } catch (error) {
                console.error("Erro ao carregar Dashboard do Agrônomo:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="animate-fade-in pb-12">
            
            {/* CABEÇALHO HERO */}
            <div className="relative rounded-3xl overflow-hidden mb-8 border border-[var(--color-border)] shadow-xl group">
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105">
                    <img src="/hero_agrogb.png" alt="Futuristic Agro Dashboard" className="w-full h-full object-cover opacity-80 dark:opacity-60 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/80 to-transparent" />
                </div>
                <div className="relative z-10 p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4 backdrop-blur-md">
                            <Users className="w-4 h-4" /> Visão Agronômica
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-[var(--color-foreground)] tracking-tight drop-shadow-sm">
                            Dashboard Central
                        </h1>
                        <p className="text-[var(--color-muted)] font-medium mt-3 max-w-xl text-lg drop-shadow-sm">
                            Sincronização em tempo real da sua carteira de clientes, safras acompanhadas e fluxo de recomendações.
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/agronomo/recomendacoes')}
                        className="bg-[var(--color-primary)] hover:brightness-110 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-[var(--color-primary)]/30 transition-all duration-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary)] focus:ring-offset-[var(--color-background)] active:scale-95 hover:shadow-xl hover:-translate-y-1"
                    >
                        <span>Nova Recomendação</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                
                <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-5 h-5 text-green-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Clientes Ativos</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : kpis.clientesAtivos}
                        </span>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-yellow-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Recomendações Pendentes</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : kpis.recomendacoesPendentes}
                        </span>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group border-b-4 border-green-500">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <CalendarCheck className="w-5 h-5 text-blue-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Visitas (Essa semana)</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : kpis.visitasSemana}
                        </span>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-green-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Recomendações Aprovadas</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : kpis.recomendacoesAprovadas}
                        </span>
                    </div>
                </div>

            </div>

            {/* SEÇÕES INFERIORES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Alertas Importantes */}
                <div className="glass p-6 rounded-2xl flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6">Alertas Importantes</h3>
                    <div className="flex-1 flex flex-col gap-4">
                        {loading ? (
                            <div className="text-[var(--color-muted)]">Carregando...</div>
                        ) : alertas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center flex-1 py-8 text-[var(--color-muted)]">
                                <p>Tudo tranquilo. Sem alertas no momento.</p>
                            </div>
                        ) : (
                            alertas.map(alerta => (
                                <div key={alerta.id} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-white/5">
                                        <div className={`w-2.5 h-2.5 rounded-full ${alerta.tipo === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'}`} />
                                    </div>
                                    <div className="flex-1 flex items-center h-10">
                                        <h4 className="text-white font-bold text-sm">{alerta.msg}</h4>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Gráfico Recomendações por Cultura */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Recomendações por Cultura</h3>
                    <div className="h-72 w-full flex items-center justify-center">
                        {loading ? (
                            <div className="text-[var(--color-muted)]">Carregando gráfico...</div>
                        ) : pieData.length === 0 ? (
                            <div className="text-[var(--color-muted)] text-sm">Sem dados suficientes para o gráfico</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#152336', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        formatter={(val) => `${val}%`}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
