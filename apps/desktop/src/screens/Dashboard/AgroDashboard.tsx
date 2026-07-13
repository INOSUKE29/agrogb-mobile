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
    Leaf,
    Bell,
    Calendar as CalendarIcon,
    CheckCircle2,
    ChevronRight,
    Cloud,
    CloudDrizzle,
    CloudLightning,
    Droplets,
    Search,
    Sprout,
    Wind,
    Package,
    ShieldCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '../../services/supabase';
import { WeatherService, type DadosClima, type Recomendacao } from '../../services/WeatherService';
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
                
                // 1. Clientes (Real)
                const { count: countClientes } = await supabase
                    .from('agronomist_client_links')
                    .select('*', { count: 'exact', head: true })
                    .eq('agronomist_id', user.id)
                    .eq('status', 'ACTIVE');

                // 2. Visitas da Semana (Real)
                const startOfWeek = new Date();
                startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                
                const { count: countVisitas } = await supabase
                    .from('technical_visits')
                    .select('*', { count: 'exact', head: true })
                    .eq('agronomist_id', user.id)
                    .gte('visit_date', startOfWeek.toISOString())
                    .lte('visit_date', endOfWeek.toISOString());

                // 3. Recomendações (Real)
                const { count: countRecPendentes } = await supabase
                    .from('recommendations')
                    .select('*', { count: 'exact', head: true })
                    .eq('agronomist_id', user.id)
                    .eq('status', 'PENDING');

                const { count: countRecAprovadas } = await supabase
                    .from('recommendations')
                    .select('*', { count: 'exact', head: true })
                    .eq('agronomist_id', user.id)
                    .eq('status', 'APPROVED');

                setKpis({
                    clientesAtivos: countClientes || 0,
                    visitasSemana: countVisitas || 0,
                    recomendacoesPendentes: countRecPendentes || 0,
                    recomendacoesAprovadas: countRecAprovadas || 0
                });

                // 4. Fazendas em Alerta (Monitor) - Real
                const { data: clientesData } = await supabase
                    .from('profiles')
                    .select('id, full_name, farm_name')
                    .eq('role', 'CLIENTE')
                    .limit(5);

                if (clientesData) {
                    const alertas: any[] = [];
                    for (const cli of clientesData) {
                        try {
                            const clima = await WeatherService.fetchHyperlocalWeather(0, 0); // Coordenadas mockadas localmente pelo serviço
                            const recs = WeatherService.gerarRecomendacoesAgro(clima);
                            const recsAlerta = recs.filter(r => ['AVISO', 'ALERTA', 'CRITICO', 'PERIGO_GEADA'].includes(r.tipo));
                            
                            if (recsAlerta.length > 0) {
                                recsAlerta.forEach((rec, idx) => {
                                    alertas.push({
                                        id: `${cli.id}-${idx}`,
                                        cliente: cli.farm_name || 'Fazenda Não Nomeada',
                                        produtor: cli.full_name || 'Produtor',
                                        problema: rec.mensagem,
                                        criticidade: rec.tipo === 'CRITICO' || rec.tipo === 'PERIGO_GEADA' ? 'critica' : rec.tipo === 'ALERTA' ? 'alta' : 'media'
                                    });
                                });
                            }
                        } catch (e) {
                            console.error('Erro ao buscar clima para cliente:', e);
                        }
                    }
                    setAlertasFazendas(alertas);
                } else {
                    setAlertasFazendas([]);
                }

                // 5. Agenda do Dia (Real)
                const today = new Date().toISOString().split('T')[0];
                const { data: agendaReal } = await supabase
                    .from('v2_tarefas')
                    .select('*')
                    .eq('responsavel_id', user.id)
                    .eq('data_agendada', today)
                    .order('data_agendada', { ascending: true });
                
                if (agendaReal) {
                    setAgendaDia(agendaReal.map(t => ({
                        id: t.id,
                        hora: t.data_agendada ? new Date(t.data_agendada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : '--:--',
                        tarefa: t.titulo,
                        local: t.fazenda_id || 'Não especificado',
                        status: t.status === 'CONCLUIDA' ? 'concluido' : t.status === 'EM_ANDAMENTO' ? 'em_andamento' : 'pendente'
                    })));
                } else {
                    setAgendaDia([]);
                }

                // 6. Últimas Recomendações (Real)
                const { data: ultimasRec } = await supabase
                    .from('recommendations')
                    .select(`
                        id,
                        status,
                        created_at,
                        profiles!recommendations_client_id_fkey ( nome )
                    `)
                    .eq('agronomist_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (ultimasRec) {
                    setUltimasRecomendacoes(ultimasRec.map((r: any) => ({
                        id: r.id,
                        cliente: r.profiles?.nome || 'Cliente Desconhecido',
                        cultura: 'Geral', // Será ajustado quando houver link com cultura
                        data: new Date(r.created_at).toLocaleDateString('pt-BR'),
                        status: r.status === 'APPROVED' ? 'Aprovada' : r.status === 'PENDING' ? 'Pendente' : r.status
                    })));
                } else {
                    setUltimasRecomendacoes([]);
                }

                // 7. Gráfico de Culturas Assistidas (Real)
                // Busca os vínculos para pegar os client_ids
                const { data: links } = await supabase
                    .from('agronomist_client_links')
                    .select('client_id')
                    .eq('agronomist_id', user.id)
                    .eq('status', 'ACTIVE');
                
                if (links && links.length > 0) {
                    const clientIds = links.map(l => l.client_id);
                    const { data: culturasData } = await supabase
                        .from('v2_culturas')
                        .select('nome, quantidade')
                        .in('user_id', clientIds);
                    
                    if (culturasData && culturasData.length > 0) {
                        const agg: Record<string, number> = {};
                        culturasData.forEach(c => {
                            const name = c.nome.toUpperCase();
                            agg[name] = (agg[name] || 0) + (c.quantidade || 1);
                        });
                        
                        const colors = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];
                        const pie = Object.keys(agg).map((key, idx) => ({
                            name: key,
                            value: agg[key],
                            color: colors[idx % colors.length]
                        })).sort((a, b) => b.value - a.value);
                        
                        setPieData(pie);
                    } else {
                        setPieData([]);
                    }
                } else {
                    setPieData([]);
                }

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
                            Clientes vinculados
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
                            Agendadas para esta semana
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
                            Aguardando revisão
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
                            Prescrições validadas
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
                                ) : alertasFazendas.length === 0 ? (
                                    <tr><td colSpan={4} className="p-8 text-center text-[var(--color-muted)] font-bold">Nenhum alerta crítico ativo no momento.</td></tr>
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
                                            <button 
                                                onClick={() => navigate('/dashboard/agronomo/recomendacoes')}
                                                className="text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded transition-colors border border-white/10"
                                            >
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
                            ) : agendaDia.length === 0 ? (
                                <p className="text-[var(--color-muted)] font-bold text-sm py-4">Sua agenda para hoje está livre.</p>
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
                            ultimasRecomendacoes.length === 0 ? (
                                <p className="text-[var(--color-muted)] font-bold py-4">Nenhuma recomendação recente.</p>
                            ) : ultimasRecomendacoes.map(rec => (
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
