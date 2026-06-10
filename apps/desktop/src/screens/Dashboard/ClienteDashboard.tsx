import React, { useState, useEffect } from 'react';
import { 
    Map as MapIcon, 
    Maximize, 
    Calendar, 
    FileText, 
    ArrowRight,
    Droplet,
    ThermometerSun,
    Wind,
    AlertTriangle,
    TrendingUp,
    DollarSign
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { fetchRealWeather } from '../../services/weather';
import type { WeatherData } from '../../services/weather';

export default function ClienteDashboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [kpis, setKpis] = useState({
        talhoesAtivos: 0,
        areaTotal: 0,
        culturas: 0,
        atividadesAndamento: 0
    });

    const [atividadesPendentes, setAtividadesPendentes] = useState<Record<string, string | number | boolean | null>[]>([]);
    
    // Novas métricas financeiras e alertas
    const [financialData, setFinancialData] = useState<any[]>([]);
    const [expensesData, setExpensesData] = useState<any[]>([]);
    const [stockAlerts, setStockAlerts] = useState<any[]>([]);
    
    // Estado do Clima Real
    const [realWeather, setRealWeather] = useState<WeatherData | null>(null);
    const [chartData, setChartData] = useState<Record<string, string | number | boolean | null>[]>([]);
    
    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

    const loadWeather = async () => {
        try {
            // Posição Padrão (Sorriso/MT) caso usuário negue localização
            const lat = -12.73;
            const lon = -56.32;

            // Tenta pegar a localização do navegador se possível
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const data = await fetchRealWeather(position.coords.latitude, position.coords.longitude);
                        updateWeatherState(data);
                    },
                    async () => {
                        const data = await fetchRealWeather(lat, lon);
                        updateWeatherState(data);
                    }
                );
            } else {
                const data = await fetchRealWeather(lat, lon);
                updateWeatherState(data);
            }
        } catch (error) {
            console.error("Erro ao buscar clima:", error);
        }
    };

    const updateWeatherState = (data: WeatherData) => {
        setRealWeather(data);
        
        // Pega as próximas 12 horas para o gráfico
        const nowIndex = data.hourly.time.findIndex(t => new Date(t) >= new Date());
        const startIndex = nowIndex !== -1 ? nowIndex : 0;
        
        const nextHours = [];
        for (let i = 0; i < 6; i++) { // 6 pontos pulando de 2 em 2 horas
            const idx = startIndex + (i * 2);
            if (idx < data.hourly.time.length) {
                const date = new Date(data.hourly.time[idx]);
                nextHours.push({
                    time: `${date.getHours().toString().padStart(2, '0')}:00`,
                    temp: data.hourly.temperature_2m[idx],
                    chuva: data.hourly.precipitation_probability[idx]
                });
            }
        }
        setChartData(nextHours);
    };

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            loadWeather(); // Chama em paralelo

            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. Buscar Talhões para contar área e culturas
                const { data: talhoes, error: _e1 } = await supabase
                    .from('talhoes')
                    .select('id, tamanho, cultura_principal')
                    .eq('user_id', user.id);

                let areaTotal = 0;
                const culturasUnicas = new Set();
                
                if (talhoes && talhoes.length > 0) {
                    talhoes.forEach(t => {
                        areaTotal += Number(t.tamanho) || 0;
                        if (t.cultura_principal) culturasUnicas.add(t.cultura_principal);
                    });
                }

                // 2. Buscar Atividades em andamento
                const { count: atividadesCount, error: _e2 } = await supabase
                    .from('plantio')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id)
                    .eq('status', 'EM ANDAMENTO');

                setKpis({
                    talhoesAtivos: talhoes?.length || 0,
                    areaTotal: areaTotal,
                    culturas: culturasUnicas.size,
                    atividadesAndamento: atividadesCount || 0
                });

                // Zera atividades pendentes para iniciar limpo
                setAtividadesPendentes([]);

                // 3. Mock/Fetch Dados Financeiros e de Estoque
                try {
                    // Tenta buscar da tabela real
                    const { data: estData } = await supabase.from('v2_estoque_atual').select('*').limit(10);
                    if (estData && estData.length > 0) {
                        setStockAlerts(estData.filter((e: any) => e.quantidade < 50));
                    } else {
                        // Mock
                        setStockAlerts([
                            { id: 1, nome: 'Ureia Agrícola', quantidade: 15, unidade: 'Sacos' },
                            { id: 2, nome: 'Glifosato', quantidade: 5, unidade: 'Litros' }
                        ]);
                    }

                    // Mock Dados Financeiros
                    setFinancialData([
                        { name: 'Jan', Receitas: 4000, Custos: 2400 },
                        { name: 'Fev', Receitas: 3000, Custos: 1398 },
                        { name: 'Mar', Receitas: 2000, Custos: 9800 },
                        { name: 'Abr', Receitas: 2780, Custos: 3908 },
                        { name: 'Mai', Receitas: 1890, Custos: 4800 },
                        { name: 'Jun', Receitas: 2390, Custos: 3800 },
                    ]);

                    setExpensesData([
                        { name: 'Insumos', value: 4500 },
                        { name: 'Mão de Obra', value: 3000 },
                        { name: 'Combustível', value: 2000 },
                        { name: 'Manutenção', value: 1500 },
                    ]);
                } catch(e) {
                    console.log('Using fallback financial data');
                }

            } catch (error) {
                console.error("Erro ao carregar Dashboard do Produtor:", error);
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
                <div className="relative z-10 p-8 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4 backdrop-blur-md">
                            <MapIcon className="w-4 h-4" /> Visão Produtor
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-[var(--color-foreground)] tracking-tight drop-shadow-sm">
                            Dashboard da Propriedade
                        </h1>
                        <p className="text-[var(--color-muted)] font-medium mt-3 text-lg drop-shadow-sm">
                            Acompanhamento em tempo real das condições climáticas, ocupação de talhões e andamento da safra atual.
                        </p>
                    </div>
                    
                    {/* Clima Resumo Header (Glassmorphism) */}
                    <div className="bg-[var(--color-card)]/80 backdrop-blur-xl flex flex-wrap items-center gap-6 px-8 py-4 rounded-2xl border border-[var(--color-border)] shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <ThermometerSun className="w-6 h-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Temp</p>
                                <p className="text-[var(--color-foreground)] font-black text-xl">
                                    {realWeather ? `${Math.round(realWeather.current.temperature)}°C` : '...'}
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-[var(--color-border)]"></div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Droplet className="w-6 h-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Umidade</p>
                                <p className="text-[var(--color-foreground)] font-black text-xl">
                                    {realWeather ? `${Math.round(realWeather.current.humidity)}%` : '...'}
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:block w-px h-10 bg-[var(--color-border)]"></div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-500/10 rounded-lg">
                                <Wind className="w-6 h-6 text-teal-500" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Vento</p>
                                <p className="text-[var(--color-foreground)] font-black text-xl">
                                    {realWeather ? `${Math.round(realWeather.current.wind_speed)} km/h` : '...'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                
                <div className="glass p-6 rounded-2xl relative overflow-hidden group bg-white/5 border border-white/10 shadow-lg hover:shadow-emerald-500/10 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <div className="flex flex-col relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <MapIcon className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Talhões</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : kpis.talhoesAtivos}
                        </span>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group bg-white/5 border border-white/10 shadow-lg hover:shadow-emerald-500/10 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <div className="flex flex-col relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Maximize className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Área Total (ha)</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : kpis.areaTotal.toFixed(1)}
                        </span>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group bg-white/5 border border-white/10 shadow-lg hover:shadow-emerald-500/10 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <div className="flex flex-col relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-emerald-400" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Culturas</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : kpis.culturas}
                        </span>
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group border-b-4 border-emerald-500 bg-white/5 shadow-lg hover:shadow-emerald-500/20 transition-all">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
                    <div className="flex flex-col relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <FileText className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Ativ. em Andamento</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : kpis.atividadesAndamento}
                        </span>
                    </div>
                </div>

            </div>

            {/* ALERTAS DE ESTOQUE */}
            {stockAlerts.length > 0 && (
                <div className="mb-8 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0" />
                        <div>
                            <h4 className="text-orange-500 font-bold">Atenção ao Estoque</h4>
                            <p className="text-sm text-orange-400/80">Você possui {stockAlerts.length} item(s) com nível crítico.</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/cliente/estoque')}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm transition-colors"
                    >
                        Ver Estoque
                    </button>
                </div>
            )}

            {/* DASHBOARDS FINANCEIROS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="glass p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-bold text-white">Fluxo de Caixa (6 Meses)</h3>
                    </div>
                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">Carregando...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#152336', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ fontWeight: 'bold' }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="Custos" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <DollarSign className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">Despesas por Categoria</h3>
                    </div>
                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">Carregando...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expensesData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {expensesData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#152336', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                        formatter={(value: any) => `R$ ${value}`}
                                    />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* SEÇÕES INFERIORES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Próximas Atividades */}
                <div className="glass p-6 rounded-2xl flex flex-col bg-white/5 border border-white/10 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Atividades Recentes</h3>
                        <button 
                            onClick={() => navigate('/dashboard/cliente/caderno')}
                            className="text-sm text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
                        >
                            Ver Caderno
                        </button>
                    </div>
                    <div className="flex flex-col gap-4 flex-1">
                        {loading ? (
                            <div className="text-[var(--color-muted)]">Carregando...</div>
                        ) : atividadesPendentes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center flex-1 py-8 text-[var(--color-muted)]">
                                <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                <p>Nenhuma atividade encontrada no sistema.</p>
                            </div>
                        ) : (
                            atividadesPendentes.map(ativ => (
                                <div key={ativ.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${ativ.bg}`}>
                                            <Calendar className={`w-5 h-5 ${ativ.cor}`} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm">{ativ.tipo}</h4>
                                            <p className="text-[var(--color-muted)] text-xs mt-1">{ativ.talhao}</p>
                                        </div>
                                    </div>
                                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                                        <span className="text-white text-sm font-bold">{ativ.data}</span>
                                        <span className="text-[var(--color-muted)] text-xs">{ativ.responsavel}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/cliente/caderno')}
                        className="w-full mt-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl text-white font-black text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        Nova Atividade
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Previsão do Clima */}
                <div className="glass p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                    <h3 className="text-lg font-bold text-white mb-6">Previsão Diária (Chuva vs Temperatura)</h3>
                    <div className="h-72 w-full">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">Carregando gráfico...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorChuva" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}°C`} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#152336', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                        itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" name="Temperatura" />
                                    <Area yAxisId="right" type="monotone" dataKey="chuva" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorChuva)" name="Prob. Chuva" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
