import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { subDays, format, isAfter, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Sprout, ShieldCheck, DollarSign, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';

export default function OverviewScreen() {
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

                {/* Chart 2: Assinaturas por Plano */}
                <div className="glass p-6 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-6">Assinaturas por Plano</h3>
                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">Carregando gráfico...</div>
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
