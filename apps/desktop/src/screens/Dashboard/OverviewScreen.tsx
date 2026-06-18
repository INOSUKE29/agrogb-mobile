import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { subDays, format } from 'date-fns';
import { Users, Sprout, ShieldCheck, FileText, Calendar as CalendarIcon, ArrowRight, Activity, Database, FolderKanban } from 'lucide-react';
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
    const [prescricoesEmitidas, setPrescricoesEmitidas] = useState(0);

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

            // Fetch Prescrições (Receitas)
            const { count: prescricoesCount, error: recError } = await supabase
                .from('receitas_adubacao')
                .select('*', { count: 'exact', head: true });
            
            if (recError && recError.code !== 'PGRST116') {
                console.error('Erro prescricoes', recError);
            }

            setTotalUsuarios(total);
            setClientesAtivos(clientes);
            setAgronomosAtivos(agronomos);
            setPrescricoesEmitidas(prescricoesCount || 0);

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
                            <FileText className="w-5 h-5 text-green-500" />
                            <h3 className="text-[var(--color-muted)] font-bold text-sm">Prescrições Emitidas</h3>
                        </div>
                        <span className="text-2xl lg:text-3xl font-black text-white break-words">
                            {loading ? '...' : prescricoesEmitidas}
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
                    <button onClick={() => navigate('/dashboard/admin/usuarios')} className="glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all group">
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

                    <button onClick={() => navigate('/dashboard/admin/biblioteca')} className="glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all group">
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

                    <button onClick={() => navigate('/dashboard/admin/financeiro')} className="glass p-4 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all group">
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

            {/* CHARTS AREA REMOVIDA - Não temos dados financeiros reais na V1 ainda */}
            <div className="mt-12 text-center text-[var(--color-muted)] p-8 border border-dashed border-[rgba(255,255,255,0.05)] rounded-2xl">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <h3 className="text-lg font-bold text-white mb-2">Gráficos em Breve</h3>
                <p className="text-sm max-w-md mx-auto">
                    Os painéis visuais de faturamento e fluxo de atividade estarão disponíveis após a adoção massiva das rotinas operacionais no campo.
                </p>
            </div>

        </div>
    );
}
