import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { subDays, format, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import { Users, Sprout, ShieldCheck, DollarSign, Calendar as CalendarIcon, ArrowRight, Activity, FileText, Settings, Database, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OverviewScreen() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    });
    
    // KPI States (Admin Dashboard)
    const [totalUsuarios, setTotalUsuarios] = useState(0);
    const [clientesAtivos, setClientesAtivos] = useState(0);
    const [agronomosAtivos, setAgronomosAtivos] = useState(0);
    const [receitaMes, setReceitaMes] = useState(0);

    // Chart Data States
    const [chartData, setChartData] = useState<any[]>([]);
    const [pieData, setPieData] = useState<any[]>([]);
    const [activityData, setActivityData] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Profiles para contagem
            const { data: profiles, error: profError } = await supabase
                .from('profiles')
                .select('role');
            
            if (profError) throw profError;

            const total = profiles?.length || 0;
            const clientes = profiles?.filter(p => p.role === 'CLIENTE').length || 0;
            const agronomos = profiles?.filter(p => p.role === 'AGRONOMO').length || 0;

            setTotalUsuarios(total);
            setClientesAtivos(clientes);
            setAgronomosAtivos(agronomos);

            // Dados Fakes para os Gráficos (Para simular o Mockup visualmente por enquanto)
            setReceitaMes(124530.00);

            setChartData([
                { name: 'Dez', receita: 45000 },
                { name: 'Jan', receita: 52000 },
                { name: 'Fev', receita: 48000 },
                { name: 'Mar', receita: 61000 },
                { name: 'Abr', receita: 85000 },
                { name: 'Mai', receita: 124530 }
            ]);

            setPieData([
                { name: 'Básico', value: 45, color: '#10B981' },
                { name: 'Intermediário', value: 30, color: '#3B82F6' },
                { name: 'Profissional', value: 25, color: '#8B5CF6' }
            ]);

            setActivityData([
                { name: 'Semana 1', receitas: 120, visitas: 45 },
                { name: 'Semana 2', receitas: 150, visitas: 60 },
                { name: 'Semana 3', receitas: 180, visitas: 75 },
                { name: 'Semana 4', receitas: 220, visitas: 90 },
            ]);

        } catch (error) {
            console.error('Erro ao buscar dados do dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    return (
        <div className="animate-fade-in pb-12">
            
            {/* CABEÇALHO DA TELA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Dashboard Administrativo</h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Visão global da plataforma AgroGB, usuários e assinaturas.
                    </p>
                </div>
                
                <div className="glass flex items-center gap-2 p-1 rounded-xl">
                    <div className="flex items-center px-3 py-2 bg-[var(--color-background)]/50 rounded-lg">
                        <CalendarIcon className="w-4 h-4 text-[var(--color-muted)] mr-2" />
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={e => setDateRange({...dateRange, start: e.target.value})}
                            className="bg-transparent text-sm text-white focus:outline-none"
                        />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--color-muted)]" />
                    <div className="flex items-center px-3 py-2 bg-[var(--color-background)]/50 rounded-lg">
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={e => setDateRange({...dateRange, end: e.target.value})}
                            className="bg-transparent text-sm text-white focus:outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* KPI CARDS (ADMIN MOCKUP) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                
                <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Total Usuários</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : totalUsuarios}
                        </span>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <Sprout className="w-5 h-5 text-blue-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Clientes Ativos</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : clientesAtivos}
                        </span>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-5 h-5 text-green-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Agrônomos Ativos</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : agronomosAtivos}
                        </span>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group border-b-4 border-green-500">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-5 h-5 text-green-500" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Receita (Mês)</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitaMes)}
                        </span>
                    </div>
                </div>

            </div>

            {/* QUICK ACTIONS (ATALHOS GERENCIAIS) */}
            <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[var(--color-primary)]" /> Atalhos Táticos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => navigate('/admin/users')} className="glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                <Users className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-bold text-sm">Gerenciar Equipes</p>
                                <p className="text-[var(--color-muted)] text-xs">Acessos e Vínculos</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-white transition-colors" />
                    </button>

                    <button onClick={() => navigate('/admin/catalog')} className="glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                                <Database className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-bold text-sm">Biblioteca de Insumos</p>
                                <p className="text-[var(--color-muted)] text-xs">Aprovar Produtos</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-white transition-colors" />
                    </button>

                    <button onClick={() => navigate('/admin/financial')} className="glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                                <FolderKanban className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-white font-bold text-sm">Saúde Financeira</p>
                                <p className="text-[var(--color-muted)] text-xs">Exportar Balanço</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[var(--color-muted)] group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>

            {/* CHARTS AREA */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Receita 6 Meses */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Receita dos Últimos 6 Meses</h3>
                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">Carregando gráfico...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} barSize={30}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(255,255,255,0.02)'}}
                                        contentStyle={{ backgroundColor: '#152336', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        formatter={(value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)}
                                    />
                                    <Bar dataKey="receita" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Chart 2: Fluxo de Atividade (Receitas e Visitas) */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Atividade da Plataforma (Mês Atual)</h3>
                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">Carregando gráfico...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#152336', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    <Line type="monotone" dataKey="receitas" name="Prescrições Emitidas" stroke="#10B981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                    <Line type="monotone" dataKey="visitas" name="Visitas a Campo" stroke="#3B82F6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
