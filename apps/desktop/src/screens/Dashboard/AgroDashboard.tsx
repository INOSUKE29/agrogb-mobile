import React, { useState, useEffect } from 'react';
import { 
    Users, 
    CalendarCheck, 
    FileText,
    ArrowRight,
    AlertTriangle,
    MapPin,
    CheckCircle,
    Clock,
    Activity,
    Leaf
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
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

    const [alertasFazendas, setAlertasFazendas] = useState<any[]>([]);
    const [agendaDia, setAgendaDia] = useState<any[]>([]);
    const [ultimasRecomendacoes, setUltimasRecomendacoes] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                // 1. Clientes
                const { count: countClientes } = await supabase
                    .from('agronomist_client_links')
                    .select('*', { count: 'exact', head: true })
                    .eq('agronomist_id', user.id);

                // 2. Recomendações Pendentes e Aprovadas (Mock para layout, já que não temos o vinculo exato ainda na query simples)
                setKpis({
                    clientesAtivos: countClientes || 12,
                    visitasSemana: 8,
                    recomendacoesPendentes: 3,
                    recomendacoesAprovadas: 45
                });

                // Mock Data: Fazendas em Alerta (Monitor de Clientes)
                setAlertasFazendas([
                    { id: 1, cliente: 'Fazenda Boa Esperança', produtor: 'João Silva', problema: 'Falta de Chuva (15 dias)', tipo: 'clima', criticidade: 'alta' },
                    { id: 2, cliente: 'Sítio do Sol', produtor: 'Marcos Almeida', problema: 'Alerta de Ferrugem Asiática', tipo: 'praga', criticidade: 'critica' },
                    { id: 3, cliente: 'Fazenda Rio Verde', produtor: 'Ana Costa', problema: 'Atraso na adubação', tipo: 'operacional', criticidade: 'media' },
                    { id: 4, cliente: 'Fazenda São Jorge', produtor: 'Pedro Santos', problema: 'Receituário vencendo', tipo: 'doc', criticidade: 'media' }
                ]);

                // Mock Data: Agenda do Dia
                setAgendaDia([
                    { id: 1, hora: '08:00', tarefa: 'Visita Técnica - Plantio Soja', local: 'Sítio do Sol', status: 'concluido' },
                    { id: 2, hora: '10:30', tarefa: 'Coleta de Solo (Talhão 3)', local: 'Fazenda Boa Esperança', status: 'em_andamento' },
                    { id: 3, hora: '14:00', tarefa: 'Revisão de Receituário', local: 'Escritório', status: 'pendente' },
                    { id: 4, hora: '16:00', tarefa: 'Visita Diagnóstico - Milho', local: 'Fazenda Rio Verde', status: 'pendente' }
                ]);

                // Mock Data: Últimas Recomendações
                setUltimasRecomendacoes([
                    { id: 101, cliente: 'Fazenda São Jorge', cultura: 'Soja', data: '11/06/2026', status: 'Aprovada' },
                    { id: 102, cliente: 'Sítio do Sol', cultura: 'Milho', data: '10/06/2026', status: 'Pendente' },
                    { id: 103, cliente: 'Fazenda Boa Esperança', cultura: 'Feijão', data: '09/06/2026', status: 'Aplicada' },
                ]);

                // Gráfico
                setPieData([
                    { name: 'Soja', value: 45, color: '#10B981' },
                    { name: 'Milho', value: 30, color: '#F59E0B' },
                    { name: 'Algodão', value: 15, color: '#3B82F6' },
                    { name: 'Feijão', value: 10, color: '#8B5CF6' }
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
        <div className="animate-fade-in pb-12 px-4 sm:px-6 lg:px-8 mt-6 max-w-[1600px] mx-auto">
            
            {/* CABEÇALHO UTILITÁRIO ERP */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <Users className="w-5 h-5 text-blue-400" />
                        </div>
                        Centro de Controle Agronômico
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1 text-sm">
                        Visão consolidada da carteira de clientes, alertas técnicos e prescrições.
                    </p>
                </div>
                
                <button 
                    onClick={() => navigate('/dashboard/agronomo/recomendacoes')}
                    className="bg-[var(--color-primary)] hover:brightness-110 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 transition-all duration-300 flex items-center gap-2 active:scale-95 border border-[var(--color-primary)]/50"
                >
                    <FileText className="w-4 h-4" />
                    <span>Nova Recomendação</span>
                </button>
            </div>

            {/* LINHA 1: KPIS (Grid 4 colunas) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                
                <div className="premium-card p-6 flex items-start justify-between group">
                    <div className="flex flex-col">
                        <span className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider mb-2">Clientes Ativos</span>
                        <span className="text-3xl font-black text-white">{loading ? '...' : kpis.clientesAtivos}</span>
                        <span className="text-xs text-green-400 font-bold mt-2 flex items-center gap-1">
                            ↑ 2 novos este mês
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                        <Users className="w-6 h-6 text-blue-400" />
                    </div>
                </div>

                <div className="premium-card p-6 flex items-start justify-between group">
                    <div className="flex flex-col">
                        <span className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider mb-2">Visitas (Semana)</span>
                        <span className="text-3xl font-black text-white">{loading ? '...' : kpis.visitasSemana}</span>
                        <span className="text-xs text-blue-400 font-bold mt-2">
                            3 confirmadas hoje
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                        <CalendarCheck className="w-6 h-6 text-indigo-400" />
                    </div>
                </div>

                <div className="premium-card p-6 flex items-start justify-between group ring-1 ring-red-500/30">
                    <div className="flex flex-col">
                        <span className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider mb-2">Prescrições Pendentes</span>
                        <span className="text-3xl font-black text-red-400">{loading ? '...' : kpis.recomendacoesPendentes}</span>
                        <span className="text-xs text-red-400/80 font-bold mt-2">
                            Aguardando aprovação
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform animate-pulse">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                    </div>
                </div>

                <div className="premium-card p-6 flex items-start justify-between group">
                    <div className="flex flex-col">
                        <span className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider mb-2">Prescrições Emitidas</span>
                        <span className="text-3xl font-black text-white">{loading ? '...' : kpis.recomendacoesAprovadas}</span>
                        <span className="text-xs text-green-400 font-bold mt-2">
                            Últimos 30 dias
                        </span>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-green-400" />
                    </div>
                </div>

            </div>

            {/* LINHA 2: CENTRO DE COMANDO (Split 60 / 40) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                
                {/* ESQUERDA: Monitor de Clientes (60%) */}
                <div className="tour-step-alertas lg:col-span-7 xl:col-span-8 premium-card flex flex-col min-h-[400px]">
                    <div className="p-5 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Activity className="w-5 h-5 text-red-400" />
                            Monitor de Clientes em Alerta
                        </h3>
                        <button className="text-sm font-bold text-blue-400 hover:text-blue-300">Ver Todos</button>
                    </div>
                    
                    <div className="flex-1 p-2 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                                    <th className="p-3 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Cliente/Fazenda</th>
                                    <th className="p-3 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Problema Relatado</th>
                                    <th className="p-3 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Criticidade</th>
                                    <th className="p-3 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="p-4 text-center text-[var(--color-muted)]">Carregando...</td></tr>
                                ) : alertasFazendas.map((alerta) => (
                                    <tr key={alerta.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                                        <td className="p-3">
                                            <p className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors cursor-pointer">{alerta.cliente}</p>
                                            <p className="text-xs text-[var(--color-muted)]">{alerta.produtor}</p>
                                        </td>
                                        <td className="p-3">
                                            <p className="text-sm text-gray-300 font-medium">{alerta.problema}</p>
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                                alerta.criticidade === 'critica' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                                alerta.criticidade === 'alta' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                                                'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                            }`}>
                                                {alerta.criticidade.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <button className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded transition-colors border border-white/10">
                                                Intervir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DIREITA: Agenda do Dia (40%) */}
                <div className="tour-step-agenda lg:col-span-5 xl:col-span-4 premium-card flex flex-col min-h-[400px]">
                    <div className="p-5 border-b border-[rgba(255,255,255,0.05)]">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Clock className="w-5 h-5 text-indigo-400" />
                            Agenda do Dia
                        </h3>
                    </div>
                    
                    <div className="flex-1 p-5 overflow-y-auto">
                        <div className="relative border-l-2 border-[rgba(255,255,255,0.1)] ml-3 pl-6 flex flex-col gap-6">
                            {loading ? (
                                <p className="text-[var(--color-muted)]">Carregando agenda...</p>
                            ) : agendaDia.map((item, idx) => (
                                <div key={item.id} className="relative">
                                    {/* Bolinha da Timeline */}
                                    <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-4 border-[var(--color-background)] ${
                                        item.status === 'concluido' ? 'bg-green-500' :
                                        item.status === 'em_andamento' ? 'bg-blue-500' :
                                        'bg-gray-500'
                                    }`}></div>
                                    
                                    <div className="flex flex-col">
                                        <span className={`text-xs font-black mb-1 ${item.status === 'em_andamento' ? 'text-blue-400' : 'text-[var(--color-muted)]'}`}>
                                            {item.hora}
                                        </span>
                                        <p className={`font-bold text-sm ${item.status === 'concluido' ? 'text-gray-400 line-through' : 'text-white'}`}>
                                            {item.tarefa}
                                        </p>
                                        <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {item.local}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* LINHA 3: OPERACIONAL */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Últimas Recomendações */}
                <div className="premium-card flex flex-col min-h-[350px]">
                    <div className="p-5 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-400" />
                            Últimas Recomendações
                        </h3>
                        <button className="text-[var(--color-muted)] hover:text-white transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 p-5 flex flex-col gap-3">
                        {loading ? <p className="text-[var(--color-muted)]">Carregando...</p> : 
                            ultimasRecomendacoes.map(rec => (
                                <div key={rec.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                            <Leaf className="w-5 h-5 text-green-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">{rec.cliente}</p>
                                            <p className="text-xs text-[var(--color-muted)]">{rec.cultura} • {rec.data}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                        rec.status === 'Aprovada' ? 'bg-green-500/20 text-green-400' :
                                        rec.status === 'Pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-blue-500/20 text-blue-400'
                                    }`}>
                                        {rec.status}
                                    </span>
                                </div>
                            ))
                        }
                    </div>
                </div>

                {/* Gráfico de Culturas */}
                <div className="premium-card flex flex-col min-h-[350px]">
                    <div className="p-5 border-b border-[rgba(255,255,255,0.05)]">
                        <h3 className="font-bold text-white text-lg flex items-center gap-2">
                            <Leaf className="w-5 h-5 text-emerald-400" />
                            Culturas Assistidas (Top%)
                        </h3>
                    </div>
                    <div className="flex-1 p-5 flex items-center justify-center">
                        {loading ? (
                            <div className="text-[var(--color-muted)]">Carregando gráfico...</div>
                        ) : pieData.length === 0 ? (
                            <div className="text-[var(--color-muted)] text-sm">Sem dados para o gráfico</div>
                        ) : (
                            <div className="w-full h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pieData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-muted)', fontSize: 12, fontWeight: 'bold' }} width={80} />
                                        <Tooltip 
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#152336', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                            formatter={(val) => `${val}%`}
                                        />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
