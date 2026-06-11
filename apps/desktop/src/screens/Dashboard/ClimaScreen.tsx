import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Wind, Droplets, ThermometerSun, AlertTriangle, CloudLightning, MapPin, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Dados Fictícios de Previsão para o Gráfico
const forecastData = [
    { time: '06:00', temp: 18, rain: 0 },
    { time: '09:00', temp: 22, rain: 10 },
    { time: '12:00', temp: 28, rain: 30 },
    { time: '15:00', temp: 31, rain: 60 },
    { time: '18:00', temp: 26, rain: 20 },
    { time: '21:00', temp: 21, rain: 0 },
];

export default function ClimaScreen() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulando carregamento de API externa de clima
        const timer = setTimeout(() => {
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--color-muted)] hover:text-white transition-colors mb-4 font-bold text-sm uppercase tracking-wider">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <CloudRain className="w-8 h-8 text-blue-400" />
                        Estação Meteorológica
                    </h1>
                    <p className="text-[var(--color-muted)] mt-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Fazenda Principal - Atualizado agora
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="glass-card p-12 text-center text-[var(--color-muted)] animate-pulse">Sincronizando com satélites...</div>
            ) : (
                <>
                    {/* DESTAQUE DO CLIMA ATUAL */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Painel Principal */}
                        <div className="lg:col-span-2 glass-card p-8 flex flex-col md:flex-row items-center justify-between relative overflow-hidden group">
                            <div className="absolute -right-20 -top-20 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl group-hover:bg-yellow-500/30 transition-all"></div>
                            
                            <div className="flex items-center gap-6 relative z-10">
                                <Sun className="w-24 h-24 text-yellow-400 animate-[spin_10s_linear_infinite]" />
                                <div>
                                    <h2 className="text-6xl font-black text-white">28°C</h2>
                                    <p className="text-xl text-yellow-400 font-medium">Ensolarado com nuvens esparsas</p>
                                    <p className="text-[var(--color-muted)]">Sensação Térmica: 30°C</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 mt-6 md:mt-0 relative z-10 w-full md:w-auto">
                                <div className="bg-[#121212] p-4 rounded-xl border border-[var(--color-border)] flex items-center gap-4">
                                    <Droplets className="w-6 h-6 text-blue-400" />
                                    <div>
                                        <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-bold">Umidade do Ar</p>
                                        <p className="text-xl font-bold text-white">65%</p>
                                    </div>
                                </div>
                                <div className="bg-[#121212] p-4 rounded-xl border border-[var(--color-border)] flex items-center gap-4">
                                    <Wind className="w-6 h-6 text-gray-400" />
                                    <div>
                                        <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-bold">Vento (Rajadas)</p>
                                        <p className="text-xl font-bold text-white">12 km/h NE</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Alertas Agronômicos */}
                        <div className="glass-card p-6 flex flex-col gap-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                                <AlertTriangle className="text-yellow-400" />
                                Alertas Agronômicos
                            </h3>
                            
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                                <h4 className="text-red-400 font-bold flex items-center gap-2 mb-1">
                                    <CloudLightning className="w-4 h-4" /> Risco de Tempestade
                                </h4>
                                <p className="text-sm text-red-300/80">Alta probabilidade de chuva forte com granizo entre 15:00 e 17:00.</p>
                            </div>

                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl mt-auto">
                                <h4 className="text-green-400 font-bold flex items-center gap-2 mb-1">
                                    <ThermometerSun className="w-4 h-4" /> Janela de Pulverização
                                </h4>
                                <p className="text-sm text-green-300/80">Condições ideais de vento e umidade até as 11:30 da manhã.</p>
                            </div>
                        </div>
                    </div>

                    {/* GRÁFICO DE PREVISÃO */}
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-bold text-white mb-6">Previsão (Próximas 24 horas)</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="time" stroke="#6B7280" tick={{ fill: '#6B7280' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" stroke="#FACC15" tick={{ fill: '#FACC15' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#60A5FA" tick={{ fill: '#60A5FA' }} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#121212', borderColor: '#333', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="temp" name="Temperatura (°C)" stroke="#FACC15" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                                    <Area yAxisId="right" type="monotone" dataKey="rain" name="Chuva (%)" stroke="#60A5FA" strokeWidth={3} fillOpacity={1} fill="url(#colorRain)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* PREVISÃO ESTENDIDA */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia, i) => (
                            <div key={dia} className="glass-card p-4 flex flex-col items-center justify-center text-center hover:border-[var(--color-primary)] transition-colors cursor-pointer group">
                                <p className="text-[var(--color-muted)] font-medium mb-3">{dia}</p>
                                {i % 2 === 0 ? <Sun className="w-8 h-8 text-yellow-400 mb-3 group-hover:scale-110 transition-transform" /> : <CloudRain className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" />}
                                <div className="flex gap-2 text-sm">
                                    <span className="font-bold text-white">31°</span>
                                    <span className="text-[var(--color-muted)]">18°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
