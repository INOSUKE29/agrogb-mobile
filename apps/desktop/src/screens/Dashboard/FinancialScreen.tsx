import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { format, parseISO } from 'date-fns';
import { 
    DollarSign, 
    Search, 
    CheckCircle, 
    XCircle, 
    ArrowUpRight, 
    ArrowDownRight, 
    Loader2,
    TrendingUp,
    TrendingDown,
    Wallet
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinancialScreen() {
    const [transacoes, setTransacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('TODOS');
    
    // KPIs
    const [totalReceitas, setTotalReceitas] = useState(0);
    const [totalDespesas, setTotalDespesas] = useState(0);
    const [saldo, setSaldo] = useState(0);

    // Mock Chart Data for cash flow visualization
    const chartData = [
        { name: 'Jan', receitas: 14000, despesas: 8000 },
        { name: 'Fev', receitas: 18000, despesas: 9500 },
        { name: 'Mar', receitas: 22000, despesas: 11000 },
        { name: 'Abr', receitas: 17500, despesas: 13000 },
        { name: 'Mai', receitas: 28000, despesas: 12000 },
        { name: 'Jun', receitas: 32000, despesas: 15000 },
    ];

    const fetchFinanceiro = async () => {
        setLoading(true);
        try {
            // Updated to use the correct 'contas' table as defined in Supabase schema
            const { data, error } = await supabase
                .from('contas')
                .select('*')
                .eq('is_deleted', 0)
                .order('data_vencimento', { ascending: true });

            if (error) throw error;
            
            const records = data || [];
            setTransacoes(records);

            // Calculate KPIs for current month / total
            let rec = 0;
            let des = 0;
            records.forEach((r: any) => {
                if (r.status !== 'CANCELADO') {
                    if (r.tipo === 'RECEITA' || r.tipo === 'RECEBER') rec += Number(r.valor) || 0;
                    else if (r.tipo === 'DESPESA' || r.tipo === 'PAGAR') des += Number(r.valor) || 0;
                }
            });
            setTotalReceitas(rec);
            setTotalDespesas(des);
            setSaldo(rec - des);

        } catch (error) {
            console.error('Erro ao buscar financeiro:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinanceiro();
    }, []);

    const baixarConta = async (id: string) => {
        if (!window.confirm("Deseja marcar esta conta como PAGA?")) return;
        
        try {
            const { error } = await supabase
                .from('contas')
                .update({ 
                    status: 'PAGO'
                })
                .eq('id', id);

            if (error) throw error;
            fetchFinanceiro(); // Recarregar
        } catch (error) {
            console.error('Erro ao baixar conta:', error);
            alert('Falha ao atualizar conta.');
        }
    };

    const cancelarConta = async (id: string) => {
        if (!window.confirm("Deseja CANCELAR esta conta permanentemente?")) return;
        
        try {
            const { error } = await supabase
                .from('contas')
                .update({ status: 'CANCELADO' })
                .eq('id', id);

            if (error) throw error;
            fetchFinanceiro(); // Recarregar
        } catch (error) {
            console.error('Erro ao cancelar conta:', error);
            alert('Falha ao cancelar conta.');
        }
    };

    const filteredData = transacoes.filter(t => {
        const matchSearch = (t.descricao?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        let matchTipo = true;
        if (filterTipo === 'RECEBER') matchTipo = (t.tipo === 'RECEITA' || t.tipo === 'RECEBER');
        if (filterTipo === 'PAGAR') matchTipo = (t.tipo === 'DESPESA' || t.tipo === 'PAGAR');
        
        return matchSearch && matchTipo;
    });

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="flex flex-col mb-8 gap-1">
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-[var(--color-primary)]" />
                    Gestão Financeira Global
                </h1>
                <p className="text-[var(--color-muted)] font-medium mt-1">
                    Acompanhe o fluxo de caixa, saúde financeira e contas a pagar/receber.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="glass p-6 rounded-3xl flex flex-col justify-between group hover:-translate-y-1 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">Entradas</span>
                    </div>
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm mb-1">Total Receitas</p>
                        <h2 className="text-3xl font-black text-white">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl flex flex-col justify-between group hover:-translate-y-1 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">Saídas</span>
                    </div>
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm mb-1">Total Despesas</p>
                        <h2 className="text-3xl font-black text-white">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </div>

                <div className="glass p-6 rounded-3xl flex flex-col justify-between group hover:-translate-y-1 transition-all border-b-4 border-green-500">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-lg">Líquido</span>
                    </div>
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm mb-1">Saldo em Caixa</p>
                        <h2 className="text-3xl font-black text-white">R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                {/* Gráfico de Fluxo */}
                <div className="xl:col-span-2 glass p-6 rounded-3xl">
                    <h3 className="text-lg font-bold text-white mb-6">Projeção de Fluxo de Caixa (Mensal)</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorDes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9CA3AF" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#152336', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                                    formatter={(value: number) => [`R$ ${value}`, '']}
                                />
                                <Area type="monotone" dataKey="receitas" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" name="Receitas" />
                                <Area type="monotone" dataKey="despesas" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDes)" name="Despesas" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Resumo Rápido */}
                <div className="xl:col-span-1 glass p-6 rounded-3xl flex flex-col gap-4">
                    <h3 className="text-lg font-bold text-white mb-2">Alertas Financeiros</h3>
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                            <h4 className="text-red-400 font-bold text-sm mb-1">Contas em Atraso</h4>
                            <p className="text-white text-xl font-black">2 Títulos</p>
                            <p className="text-[var(--color-muted)] text-xs mt-1">Soma de R$ 3.500,00</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                            <h4 className="text-blue-400 font-bold text-sm mb-1">A Receber esta Semana</h4>
                            <p className="text-white text-xl font-black">R$ 14.800,00</p>
                            <p className="text-[var(--color-muted)] text-xs mt-1">4 Títulos pendentes</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Contas */}
            <div className="glass rounded-3xl overflow-hidden border border-[var(--color-border)] p-6">
                
                {/* Filter Bar */}
                <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
                    <h3 className="text-lg font-bold text-white whitespace-nowrap">Lançamentos</h3>
                    <div className="relative flex-1 w-full mx-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-2 pl-10 pr-4 text-white placeholder-[var(--color-muted)] focus:outline-none focus:border-blue-500 transition-all text-sm"
                        />
                    </div>
                    
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setFilterTipo('TODOS')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterTipo === 'TODOS' ? 'bg-white/10 text-white' : 'text-[var(--color-muted)] hover:bg-white/5'}`}
                        >
                            Todos
                        </button>
                        <button 
                            onClick={() => setFilterTipo('RECEBER')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${filterTipo === 'RECEBER' ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--color-muted)] hover:bg-blue-500/10'}`}
                        >
                            <ArrowUpRight className="w-4 h-4" /> A Receber
                        </button>
                        <button 
                            onClick={() => setFilterTipo('PAGAR')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${filterTipo === 'PAGAR' ? 'bg-red-500/20 text-red-400' : 'text-[var(--color-muted)] hover:bg-red-500/10'}`}
                        >
                            <ArrowDownRight className="w-4 h-4" /> A Pagar
                        </button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="overflow-x-auto rounded-xl border border-white/5">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5">
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Tipo</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Descrição</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Valor (R$)</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Vencimento</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-center">Status</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-[var(--color-muted)]">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[var(--color-primary)]" />
                                        Processando dados financeiros...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-[var(--color-muted)]">
                                        Nenhuma transação encontrada no período.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => {
                                    const isReceber = (row.tipo === 'RECEITA' || row.tipo === 'RECEBER');
                                    const Icon = isReceber ? ArrowUpRight : ArrowDownRight;
                                    const isPago = row.status === 'PAGO';
                                    const isCancelado = row.status === 'CANCELADO';

                                    return (
                                        <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isReceber ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm">
                                                <p className="font-bold text-white">{row.descricao}</p>
                                                <p className="text-xs text-[var(--color-muted)] mt-0.5">{row.forma_pagamento ? `Via ${row.forma_pagamento}` : ''}</p>
                                            </td>
                                            <td className={`p-4 text-sm font-black ${isReceber ? 'text-blue-400' : 'text-red-400'}`}>
                                                R$ {Number(row.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 text-sm text-[var(--color-muted)] font-medium">
                                                {row.data_vencimento ? format(parseISO(row.data_vencimento), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td className="p-4 text-center">
                                                {isPago ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400">
                                                        PAGO
                                                    </span>
                                                ) : isCancelado ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-white/10 text-[var(--color-muted)]">
                                                        CANCELADO
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400">
                                                        PENDENTE
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                {!isPago && !isCancelado && (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => baixarConta(row.id)}
                                                            className="p-2.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition-colors tooltip"
                                                            title="Baixar como Pago"
                                                        >
                                                            <CheckCircle className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => cancelarConta(row.id)}
                                                            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors tooltip"
                                                            title="Cancelar Título"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
