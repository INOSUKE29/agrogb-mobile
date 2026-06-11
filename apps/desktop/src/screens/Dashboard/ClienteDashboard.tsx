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
    Sprout
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
        <div className="animate-fade-in pb-12 px-4 sm:px-6 lg:px-8 mt-6">
            
            {/* CABEÇALHO BOAS-VINDAS */}
            <div className="premium-card p-6 flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Olá, Bruno! 👋</h2>
                    <p className="text-[var(--color-muted)] text-sm font-medium mt-1">Bem-vindo ao seu painel.</p>
                </div>
                <div className="mt-4 sm:mt-0 flex items-center gap-3 bg-[rgba(0,0,0,0.2)] rounded-full px-4 py-2 border border-[rgba(255,255,255,0.05)]">
                    <ThermometerSun className="w-5 h-5 text-yellow-500" />
                    <div>
                        <p className="text-white font-bold text-sm leading-none">{realWeather ? `${Math.round(realWeather.current.temperature)}°C` : '24°C'}</p>
                        <p className="text-[var(--color-muted)] text-[10px] uppercase tracking-wider">Ribeirão Verde - GO</p>
                    </div>
                </div>
            </div>

            {/* KPI CARDS (3 superiores) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                
                {/* Colheita */}
                <div className="premium-card-kpi p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider">Colheita (Hoje)</h3>
                        <div className="icon-circle w-8 h-8">
                            <Sprout className="w-4 h-4 text-[#19B34A]" />
                        </div>
                    </div>
                    <div className="flex items-end gap-3 mt-4">
                        <span className="text-2xl lg:text-3xl font-black text-white">1.250 kg</span>
                    </div>
                    <p className="text-[#19B34A] text-xs font-bold mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +12% vs ontem
                    </p>
                </div>

                {/* Vendas */}
                <div className="premium-card-kpi p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider">Vendas (Hoje)</h3>
                        <div className="icon-circle w-8 h-8">
                            <Store className="w-4 h-4 text-[#19B34A]" />
                        </div>
                    </div>
                    <div className="flex items-end gap-3 mt-4">
                        <span className="text-2xl lg:text-3xl font-black text-white">R$ 8.450,00</span>
                    </div>
                    <p className="text-[#19B34A] text-xs font-bold mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +8% vs ontem
                    </p>
                </div>

                {/* Resultado */}
                <div className="premium-card-kpi p-5 relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-[var(--color-muted)] font-bold text-xs uppercase tracking-wider">Resultado (Mês)</h3>
                        <div className="icon-circle w-8 h-8">
                            <TrendingUp className="w-4 h-4 text-[#19B34A]" />
                        </div>
                    </div>
                    <div className="flex items-end gap-3 mt-4">
                        <span className="text-2xl lg:text-3xl font-black text-white">R$ 24.680,00</span>
                    </div>
                    <p className="text-[#19B34A] text-xs font-bold mt-2 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +15% vs mês ant.
                    </p>
                </div>
            </div>

            {/* ALERTAS INTELIGENTES */}
            <div className="mb-8">
                <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest mb-3">Alertas Inteligentes</h3>
                <div className="bg-[#0f172a] border border-blue-500/30 rounded-[16px] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_20px_rgba(59,130,246,0.1)]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                            <Droplet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h4 className="text-blue-400 font-bold text-sm uppercase tracking-wider">Irrigação Diária</h4>
                            <p className="text-white text-sm font-medium">Nenhum turno de irrigação registrado hoje.</p>
                        </div>
                    </div>
                    <button className="text-blue-400 hover:text-blue-300 font-bold text-sm flex items-center gap-1 group">
                        Ver detalhes <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* MENU ACESSO RÁPIDO - V8 (Grid 4 colunas) */}
            <div className="mb-12">
                <h3 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-widest mb-3">Acesso Rápido</h3>
                <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                    {[
                        { name: 'Caderno', icon: FileText, color: 'text-[#19B34A]', path: '/dashboard/cliente/caderno' },
                        { name: 'Colheita', icon: Sprout, color: 'text-[#19B34A]', path: '/dashboard/cliente/colheita' },
                        { name: 'Vendas', icon: Store, color: 'text-[#19B34A]', path: '/dashboard/cliente/vendas' },
                        { name: 'Estoque', icon: Package, color: 'text-gray-400', path: '/dashboard/cliente/estoque' },
                        { name: 'Monitorar', icon: MapIcon, color: 'text-blue-500', path: '/dashboard/cliente/areas' },
                        { name: 'Manejo', icon: ListTodo, color: 'text-[#19B34A]', path: '/dashboard/cliente/manejo' },
                        { name: 'Compras', icon: ShoppingCart, color: 'text-orange-500', path: '/dashboard/cliente/compras' },
                        { name: 'Plantio', icon: Sprout, color: 'text-[#19B34A]', path: '/dashboard/cliente/plantio' },
                        { name: 'Custos', icon: DollarSign, color: 'text-red-500', path: '/dashboard/cliente/financeiro' },
                        { name: 'Descarte', icon: AlertTriangle, color: 'text-red-500', path: '/dashboard/cliente/descarte' },
                        { name: 'Frota', icon: Car, color: 'text-gray-400', path: '/dashboard/cliente/frota' },
                        { name: 'Relatórios', icon: FileText, color: 'text-gray-300', path: '/dashboard/cliente/relatorios' },
                        { name: 'Cadastros', icon: Store, color: 'text-gray-400', path: '/dashboard/cliente/cadastros' },
                        { name: 'Clientes', icon: Store, color: 'text-gray-400', path: '/dashboard/cliente/clientes' },
                        { name: 'Áreas', icon: MapIcon, color: 'text-gray-400', path: '/dashboard/cliente/areas' },
                        { name: 'Sync', icon: CloudRain, color: 'text-blue-400', path: '/dashboard/cliente/sync' },
                    ].map((item, i) => (
                        <button 
                            key={i}
                            onClick={() => navigate(item.path)}
                            className="premium-card h-24 sm:h-28 flex flex-col items-center justify-center gap-2 hover:translate-y-[-2px] hover:shadow-lg transition-all group"
                        >
                            <div className="icon-circle w-10 h-10 sm:w-12 sm:h-12 group-hover:scale-110">
                                <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color}`} />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-white tracking-wider truncate w-full px-1">{item.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Gráficos V8 Integrados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="premium-card p-6">
                    <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Produção - Últimos 7 Dias (kg)</h3>
                    <div className="h-64 w-full relative">
                        <div className="absolute inset-0 bg-[#19B34A]/5 rounded-xl blur-2xl z-0"></div>
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-muted)]">Carregando...</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                                <AreaChart data={financialData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#19B34A" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#19B34A" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `${val/1000}k`} />
                                    <RechartsTooltip 
                                        contentStyle={{ backgroundColor: '#152336', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="Receitas" stroke="#19B34A" strokeWidth={3} fillOpacity={1} fill="url(#colorProd)" activeDot={{ r: 6, fill: '#fff', stroke: '#19B34A' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
