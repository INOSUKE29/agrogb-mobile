import React, { useState, useEffect } from 'react';
import { 
    ShoppingCart, 
    User, 
    Leaf, 
    DollarSign, 
    CheckCircle2,
    Calendar,
    FileText,
    ArrowRight,
    TrendingUp,
    Scale,
    CreditCard
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function VendasScreen() {
    const [loading, setLoading] = useState(false);
    const [clientes, setClientes] = useState<any[]>([]);
    
    // Formulário de Venda
    const [selectedClient, setSelectedClient] = useState('');
    const [cultura, setCultura] = useState('');
    const [quantidadeKg, setQuantidadeKg] = useState('');
    const [precoKg, setPrecoKg] = useState('');
    const [formaPagamento, setFormaPagamento] = useState('PIX');
    const [integrarFinanceiro, setIntegrarFinanceiro] = useState(true);
    
    // Lista de vendas recentes
    const [vendasRecentes, setVendasRecentes] = useState<any[]>([]);

    useEffect(() => {
        fetchClientes();
        fetchVendas();
    }, []);

    const fetchClientes = async () => {
        try {
            const { data, error } = await supabase.from('v2_clientes').select('*').order('nome', { ascending: true });
            if (error) {
                // Fallback mock or old table if needed
                setClientes([
                    { id: 'cli-1', nome: 'João Batista (Fazenda Boa Esperança)' },
                    { id: 'cli-2', nome: 'Carlos Mendes (Sítio São José)' },
                    { id: 'cli-3', nome: 'Supermercado Central' }
                ]);
            } else {
                setClientes(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchVendas = async () => {
        try {
            // Trying old table because v2_vendas lacks product details in schema_v10.js (maybe they use observacao)
            const { data, error } = await supabase
                .from('vendas')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (data) setVendasRecentes(data);
        } catch (err) {
            console.error('Erro ao buscar vendas:', err);
        }
    };

    const valorTotal = (parseFloat(quantidadeKg) || 0) * (parseFloat(precoKg) || 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !cultura || !quantidadeKg || !precoKg) {
            return toast.error('Preencha todos os campos obrigatórios.');
        }

        setLoading(true);
        try {
            const clienteNome = clientes.find(c => c.id === selectedClient)?.nome || 'Cliente Desconhecido';
            
            // Salvar na tabela de vendas
            const payload = {
                cliente_id: selectedClient,
                cliente_nome: clienteNome,
                cultura,
                quantidade_kg: parseFloat(quantidadeKg),
                preco_kg: parseFloat(precoKg),
                valor_total: valorTotal,
                forma_pagamento: formaPagamento,
                status: 'Concluída'
            };

            const { data: vendaData, error: vendaError } = await supabase
                .from('vendas')
                .insert([payload])
                .select()
                .single();

            if (vendaError) throw vendaError;

            // Integração com Financeiro (Contas a Receber)
            if (integrarFinanceiro && vendaData) {
                const payloadConta = {
                    tipo: 'RECEITA',
                    descricao: `Venda de ${cultura} - ${quantidadeKg}kg (${clienteNome})`,
                    valor: valorTotal,
                    data_vencimento: new Date().toISOString().split('T')[0], // Hoje
                    status: formaPagamento === 'A Prazo' ? 'PENDENTE' : 'PAGO',
                    forma_pagamento: formaPagamento,
                    venda_id: vendaData.id
                };
                const { error: contaError } = await supabase.from('contas').insert([payloadConta]);
                if (contaError) {
                    console.error('Erro ao integrar financeiro mas a venda foi salva', contaError);
                    toast.error('Venda registrada, mas falha ao integrar com o financeiro.');
                }
            }

            toast.success('Venda registrada e faturada com sucesso!');
            
            // Resetar form
            setCultura('');
            setQuantidadeKg('');
            setPrecoKg('');
            fetchVendas();
            
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Erro ao registrar venda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12 space-y-8">
            {/* CABEÇALHO HERO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <TrendingUp className="w-4 h-4" /> Comercialização
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Nova Venda / Faturamento
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Registre a venda da sua produção e integre automaticamente com o módulo de Contas a Receber.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FORMULÁRIO */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl flex flex-col gap-8">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <User className="w-4 h-4 text-[var(--color-primary)]" /> Cliente / Comprador *
                                </label>
                                <select 
                                    required
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none appearance-none p-3.5 transition-all"
                                >
                                    <option value="" disabled>Selecione o Cliente</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <Leaf className="w-4 h-4 text-green-500" /> Cultura / Produto *
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Ex: Milho Safrinha, Soja GM..."
                                    value={cultura}
                                    onChange={(e) => setCultura(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none p-3.5 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/[0.02] p-6 rounded-2xl border border-[var(--color-border)]">
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <Scale className="w-3.5 h-3.5" /> Quantidade (KG)
                                </label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="Ex: 50"
                                    value={quantidadeKg}
                                    onChange={(e) => setQuantidadeKg(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-xl font-bold rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none p-3.5 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5" /> Preço por KG
                                </label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="Ex: 38.50"
                                    value={precoKg}
                                    onChange={(e) => setPrecoKg(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-xl font-bold rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none p-3.5 transition-all"
                                />
                            </div>
                            <div className="flex flex-col justify-end">
                                <label className="block text-xs font-bold text-[var(--color-primary)] mb-2 uppercase tracking-wider">
                                    Valor Total
                                </label>
                                <div className="h-[58px] bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-xl flex items-center px-4 text-2xl font-black text-[var(--color-primary)]">
                                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-[var(--color-primary)]" /> Forma de Pagamento
                                </label>
                                <select 
                                    value={formaPagamento}
                                    onChange={(e) => setFormaPagamento(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] outline-none appearance-none p-3.5 transition-all"
                                >
                                    <option value="PIX">PIX</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Cartão">Cartão</option>
                                    <option value="A Prazo">A Prazo (Boleto)</option>
                                    <option value="Permuta">Permuta</option>
                                </select>
                            </div>

                            <div 
                                className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all border ${integrarFinanceiro ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`} 
                                onClick={() => setIntegrarFinanceiro(!integrarFinanceiro)}
                            >
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${integrarFinanceiro ? 'bg-[var(--color-primary)] text-white' : 'bg-black/30 border border-white/20'}`}>
                                    {integrarFinanceiro && <CheckCircle2 className="w-4 h-4" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className={`font-bold ${integrarFinanceiro ? 'text-[var(--color-primary)]' : 'text-white'}`}>Integração Financeira</span>
                                    <span className="text-xs text-[var(--color-muted)]">Lançar no Contas a Receber</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-[var(--color-border)]">
                            <button 
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[var(--color-primary)] hover:opacity-90 text-white font-black text-lg rounded-xl shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {loading ? 'Processando Faturamento...' : 'Confirmar e Faturar Venda'}
                                {!loading && <ArrowRight className="w-6 h-6" />}
                            </button>
                        </div>
                    </form>
                </div>

                {/* SIDEBAR - ÚLTIMAS VENDAS */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="glass-card p-6 rounded-3xl h-full flex flex-col">
                        <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                            Últimos Faturamentos
                        </h3>
                        
                        <div className="flex flex-col gap-4 flex-1">
                            {vendasRecentes.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)] py-12">
                                    <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                                    <p className="text-sm font-bold text-center">Nenhuma venda registrada.</p>
                                </div>
                            ) : (
                                vendasRecentes.map((v) => (
                                    <div key={v.id} className="p-4 rounded-2xl bg-white/[0.02] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 transition-colors group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                                                    <Leaf className="w-4 h-4 text-[var(--color-primary)]" />
                                                </div>
                                                <span className="font-bold text-white text-lg">{v.cultura}</span>
                                            </div>
                                            <span className="text-sm font-black text-green-400">
                                                R$ {Number(v.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--color-muted)] font-medium mb-2">{v.cliente_nome}</p>
                                        <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
                                            <span className="flex items-center gap-1"><Scale className="w-3 h-3" /> {v.quantidade_kg} kg</span>
                                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {v.preco_kg}/kg</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-3xl relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-[var(--color-primary)]/20 rounded-full blur-3xl"></div>
                        <h3 className="font-black text-white mb-2 relative z-10 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
                            Dica do Sistema
                        </h3>
                        <p className="text-sm text-[var(--color-muted)] leading-relaxed relative z-10 font-medium">
                            Ao manter a <strong>Integração Financeira</strong> ativada, a venda vira imediatamente uma "Conta a Receber", poupando tempo de redigitação no módulo financeiro.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
