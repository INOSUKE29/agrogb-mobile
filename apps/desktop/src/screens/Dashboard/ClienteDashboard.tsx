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
    DollarSign,
    Package,
    ShoppingCart,
    Store,
    Truck,
    Car,
    ListTodo,
    CloudRain,
    Sprout,
    Users
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
                        setStockAlerts([]);
                    }

                    // Sem mock de dados financeiros (Regra de Ouro #8)
                    setFinancialData([
                        { name: 'Mês Atual', Receitas: 0, Custos: 0 }
                    ]);

                    setExpensesData([
                        { name: 'Sem registros', value: 0 }
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
        <div className="animate-fade-in pb-12 px-4 sm:px-6 lg:px-8 mt-6 max-w-[1600px] mx-auto">
            
            {/* CABEÇALHO BOAS-VINDAS E CLIMA */}
            <div className="premium-card p-6 flex flex-col lg:flex-row lg:items-center justify-between mb-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#19B34A]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white tracking-tight">Olá, Bruno! 👋</h2>
                    <p className="text-[var(--color-muted)] text-sm font-medium mt-1">Bem-vindo ao ERP Operacional AgroGB. Aqui está o resumo da sua fazenda.</p>
                </div>
                <div className="mt-4 lg:mt-0 relative z-10 flex items-center gap-6 bg-[#0B1522] rounded-2xl px-6 py-3 border border-[rgba(255,255,255,0.05)] shadow-inner">
                    <div className="flex items-center gap-3 border-r border-[rgba(255,255,255,0.1)] pr-6">
                        <ThermometerSun className="w-6 h-6 text-yellow-500" />
                        <div>
                            <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider font-bold">Temperatura</p>
                            <p className="text-white font-black text-lg leading-none">{realWeather ? `${Math.round(realWeather.current.temperature)}°C` : '24°C'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Droplet className="w-6 h-6 text-blue-500" />
                        <div>
                            <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider font-bold">Umidade</p>
                            <p className="text-white font-black text-lg leading-none">{realWeather ? `${Math.round(realWeather.current.humidity)}%` : '65%'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ACESSO RÁPIDO (Estilo Mobile, Adaptado para Desktop) */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest">Acesso Rápido</h3>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(25, 179, 74, 0.3) transparent' }}>
                    {[
                        { name: 'Consultor', icon: Users, color: 'text-indigo-400', path: '/dashboard/cliente/consultor' },
                        { name: 'Recomendações', icon: FileText, color: 'text-emerald-400', path: '/dashboard/cliente/recomendacoes' },
                        { name: 'Caderno', icon: FileText, color: 'text-[#19B34A]', path: '/dashboard/cliente/caderno' },
                        { name: 'Manejo', icon: ListTodo, color: 'text-[#19B34A]', path: '/dashboard/cliente/manejo' },
                        { name: 'Colheita', icon: Sprout, color: 'text-[#19B34A]', path: '/dashboard/cliente/colheita' },
                        { name: 'Vendas', icon: Store, color: 'text-[#19B34A]', path: '/dashboard/cliente/vendas' },
                        { name: 'Encomendas', icon: ShoppingCart, color: 'text-purple-400', path: '/dashboard/cliente/encomendas' },
                        { name: 'Monitorar', icon: MapIcon, color: 'text-blue-500', path: '/dashboard/cliente/areas' },
                    ].map((item, i) => (
                        <button 
                            key={i}
                            onClick={() => navigate(item.path)}
                            className="premium-card min-w-[100px] h-[100px] flex-shrink-0 flex flex-col items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg hover:border-[#19B34A]/30 transition-all group"
                        >
                            <div className="icon-circle w-10 h-10 group-hover:scale-110">
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                            </div>
                            <span className="text-[10px] font-bold text-white tracking-wider truncate w-full px-1">{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* LINHA 1: KPIs (Grid 4 colunas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                
                {/* Área Total */}
                <div className="premium-card p-6 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider">Área Total</h3>
                        <div className="w-10 h-10 rounded-xl bg-[#19B34A]/10 flex items-center justify-center border border-[#19B34A]/20">
                            <MapIcon className="w-5 h-5 text-[#19B34A]" />
                        </div>
                    </div>
                    <span className="text-3xl font-black text-white">{kpis.areaTotal} ha</span>
                    <p className="text-[#19B34A] text-xs font-bold mt-3 flex items-center gap-1">
                        Cadastrada no sistema
                    </p>
                </div>

                {/* Talhões Ativos */}
                <div className="premium-card p-6 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider">Talhões Ativos</h3>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <Maximize className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                    <span className="text-3xl font-black text-white">{kpis.talhoesAtivos}</span>
                    <p className="text-blue-500 text-xs font-bold mt-3 flex items-center gap-1">
                        Monitorados
                    </p>
                </div>

                {/* Culturas */}
                <div className="premium-card p-6 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider">Culturas Ativas</h3>
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                            <Sprout className="w-5 h-5 text-yellow-500" />
                        </div>
                    </div>
                    <span className="text-3xl font-black text-white">{kpis.culturas}</span>
                    <p className="text-yellow-500 text-xs font-bold mt-3 flex items-center gap-1">
                        Variedades plantadas
                    </p>
                </div>

                {/* Atividades em Andamento */}
                <div className="premium-card p-6 relative overflow-hidden group border-b-4 border-orange-500">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <h3 className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider">Em Andamento</h3>
                        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)]">
                            <ListTodo className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <span className="text-3xl font-black text-white relative z-10">{kpis.atividadesAndamento}</span>
                    <p className="text-orange-400 text-xs font-bold mt-3 flex items-center gap-1 relative z-10">
                        Atividades operacionais
                    </p>
                </div>
            </div>

            {/* LINHA 2: O Coração do ERP (60/40 Split) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                
                {/* Gráfico Financeiro (Ocupa 2 Colunas) */}
                <div className="xl:col-span-2 premium-card p-6 flex flex-col shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black text-white">Fluxo de Caixa Consolidado</h3>
                            <p className="text-sm text-[var(--color-muted)]">Receitas x Despesas nos últimos 6 meses</p>
                        </div>
                        <button onClick={() => navigate('/dashboard/cliente/financeiro')} className="text-xs font-bold text-[#19B34A] hover:text-white bg-[#19B34A]/10 hover:bg-[#19B34A] px-4 py-2 rounded-lg transition-colors border border-[#19B34A]/20">
                            Acessar Financeiro completo
                        </button>
                    </div>
                    <div className="flex-1 min-h-[300px] w-full relative">
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
                                    <Bar dataKey="Receitas" fill="#19B34A" radius={[4, 4, 0, 0]} barSize={30} />
                                    <Bar dataKey="Custos" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={30} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Atividades e Tarefas (Ocupa 1 Coluna) */}
                <div className="xl:col-span-1 premium-card p-6 flex flex-col shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black text-white">Operações no Campo</h3>
                        <div className="p-2 bg-[#19B34A]/10 rounded-lg">
                            <ListTodo className="w-5 h-5 text-[#19B34A]" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                        {loading ? (
                            <div className="text-[var(--color-muted)] flex justify-center py-8">Buscando operações...</div>
                        ) : atividadesPendentes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)] py-12">
                                <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                <p className="text-sm">Nenhuma atividade programada para hoje.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {atividadesPendentes.map(ativ => (
                                    <div key={ativ.id} className="flex flex-col p-4 rounded-xl bg-[#0B1522] border border-[rgba(255,255,255,0.05)] hover:border-[#19B34A]/30 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-[#19B34A]/20 text-[#19B34A] text-[10px] font-bold px-2 py-1 rounded uppercase">{ativ.tipo}</span>
                                            <span className="text-[var(--color-muted)] text-xs font-bold">{ativ.data}</span>
                                        </div>
                                        <h4 className="text-white font-bold text-sm mb-1">{ativ.talhao}</h4>
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)]">
                                            <span className="text-[var(--color-muted)] text-xs flex items-center gap-1"><Truck className="w-3 h-3"/> {ativ.responsavel}</span>
                                            <button className="text-[#19B34A] hover:text-white transition-colors"><ArrowRight className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => navigate('/dashboard/cliente/caderno')}
                        className="w-full mt-4 py-3 bg-[#19B34A] hover:bg-[#159a3f] rounded-xl text-white font-black text-sm shadow-[0_4px_15px_rgba(25,179,74,0.3)] transition-all flex items-center justify-center gap-2"
                    >
                        Nova Atividade <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* LINHA 3: Operação e Logística (50/50 Split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Alertas de Estoque */}
                <div className="premium-card p-6 flex flex-col shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                        <Package className="w-5 h-5 text-orange-500" />
                        <h3 className="text-lg font-black text-white">Estoque Nível Crítico</h3>
                    </div>
                    
                    {stockAlerts.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 text-[var(--color-muted)]">
                            <Package className="w-12 h-12 mb-3 opacity-20" />
                            <p>Estoque saudável no momento.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[rgba(255,255,255,0.1)] text-[var(--color-muted)] text-xs uppercase tracking-wider">
                                        <th className="pb-3 font-bold">Produto</th>
                                        <th className="pb-3 font-bold text-center">Quantidade</th>
                                        <th className="pb-3 font-bold text-center">Status</th>
                                        <th className="pb-3 font-bold text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stockAlerts.map(item => (
                                        <tr key={item.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-white/5 transition-colors">
                                            <td className="py-4 text-sm font-bold text-white">{item.nome}</td>
                                            <td className="py-4 text-sm text-center text-white">{item.quantidade} <span className="text-[var(--color-muted)]">{item.unidade}</span></td>
                                            <td className="py-4 text-center">
                                                <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                                                    <AlertTriangle className="w-3 h-3" /> Crítico
                                                </span>
                                            </td>
                                            <td className="py-4 text-right">
                                                <button onClick={() => navigate('/dashboard/cliente/compras')} className="text-orange-500 hover:text-orange-400 text-xs font-bold underline underline-offset-2">Solicitar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Previsão do Clima */}
                <div className="premium-card p-6 flex flex-col shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <CloudRain className="w-5 h-5 text-blue-400" />
                            <h3 className="text-lg font-black text-white">Previsão e Condições</h3>
                        </div>
                        <span className="text-xs text-[var(--color-muted)] font-bold">Próximas 12h</span>
                    </div>
                    <div className="h-[250px] w-full">
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
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
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
                                    <Area yAxisId="left" type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" name="Temperatura (°C)" />
                                    <Area yAxisId="right" type="monotone" dataKey="chuva" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorChuva)" name="Prob. Chuva (%)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>

        </div>
    );
}
