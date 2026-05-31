import React, { useState, useEffect } from 'react';
import { 
    ShoppingCart, 
    User, 
    Leaf, 
    Calculator, 
    DollarSign, 
    CheckCircle2,
    Calendar,
    FileText,
    ArrowRight
} from 'lucide-react';
import { supabase } from '../../services/supabase';

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
    
    // Lista de vendas recentes (mock para UI)
    const [vendasRecentes, setVendasRecentes] = useState<any[]>([]);

    useEffect(() => {
        // Simulação de clientes
        setClientes([
            { id: 'cli-1', nome: 'João Batista (Fazenda Boa Esperança)' },
            { id: 'cli-2', nome: 'Carlos Mendes (Sítio São José)' },
            { id: 'cli-3', nome: 'Supermercado Central' }
        ]);

        fetchVendas();
    }, []);

    const fetchVendas = async () => {
        try {
            const { data } = await supabase
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
            return alert('Preencha todos os campos obrigatórios.');
        }

        setLoading(true);
        try {
            const clienteNome = clientes.find(c => c.id === selectedClient)?.nome || 'Cliente Desconhecido';
            
            // 1. Salvar na tabela de vendas
            const { data: vendaData, error: vendaError } = await supabase
                .from('vendas')
                .insert({
                    cliente_id: selectedClient,
                    cliente_nome: clienteNome,
                    cultura,
                    quantidade_kg: parseFloat(quantidadeKg),
                    preco_kg: parseFloat(precoKg),
                    valor_total: valorTotal,
                    forma_pagamento: formaPagamento,
                    status: 'Concluída'
                })
                .select()
                .single();

            if (vendaError) throw vendaError;

            // 2. Integração com Financeiro (Contas a Receber)
            if (integrarFinanceiro && vendaData) {
                const { error: contaError } = await supabase
                    .from('contas')
                    .insert({
                        tipo: 'RECEITA',
                        descricao: `Venda de ${cultura} - ${quantidadeKg}kg (${clienteNome})`,
                        valor: valorTotal,
                        data_vencimento: new Date().toISOString().split('T')[0], // Hoje
                        status: formaPagamento === 'A Prazo' ? 'PENDENTE' : 'PAGO',
                        forma_pagamento: formaPagamento,
                        venda_id: vendaData.id
                    });
                
                if (contaError) throw contaError;
            }

            alert('Venda registrada com sucesso!');
            
            // Resetar form
            setCultura('');
            setQuantidadeKg('');
            setPrecoKg('');
            fetchVendas();
            
        } catch (err) {
            console.error(err);
            alert('Erro ao registrar venda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-6xl mx-auto">
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-blue-500" />
                        Nova Venda / Faturamento
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Registre a venda da sua produção e integre automaticamente com o Contas a Receber.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FORMULÁRIO */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="glass p-8 rounded-3xl flex flex-col gap-8">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-500" /> Cliente / Comprador *
                                </label>
                                <select 
                                    required
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-3.5 transition-all"
                                >
                                    <option value="" disabled>Selecione o Cliente</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <Leaf className="w-4 h-4 text-blue-500" /> Cultura (Produto) *
                                </label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Ex: Morango, Soja, Milho..."
                                    value={cultura}
                                    onChange={(e) => setCultura(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-blue-500 block p-3.5 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white/5 p-6 rounded-2xl border border-[var(--color-border)]">
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                                    Quantidade (KG)
                                </label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="Ex: 50"
                                    value={quantidadeKg}
                                    onChange={(e) => setQuantidadeKg(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-xl font-bold rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                                    Preço por KG (R$)
                                </label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    required
                                    placeholder="Ex: 38.50"
                                    value={precoKg}
                                    onChange={(e) => setPrecoKg(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-xl font-bold rounded-xl focus:ring-2 focus:ring-blue-500 block p-3 transition-all"
                                />
                            </div>
                            <div className="flex flex-col justify-end">
                                <label className="block text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider">
                                    Valor Total
                                </label>
                                <div className="h-[52px] bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center px-4 text-2xl font-black text-blue-400">
                                    R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <div>
                                <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4 text-blue-500" /> Forma de Pagamento
                                </label>
                                <select 
                                    value={formaPagamento}
                                    onChange={(e) => setFormaPagamento(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-3 transition-all"
                                >
                                    <option value="PIX">PIX</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                    <option value="Cartão">Cartão</option>
                                    <option value="A Prazo">A Prazo (Boleto)</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 bg-[var(--color-background)] border border-[var(--color-border)] p-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setIntegrarFinanceiro(!integrarFinanceiro)}>
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${integrarFinanceiro ? 'bg-blue-500 text-white' : 'bg-white/10 text-transparent'}`}>
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-white">Lançar no Financeiro</span>
                                    <span className="text-xs text-[var(--color-muted)]">Cria Contas a Receber automático</span>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-lg rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Processando...' : 'Confirmar Venda'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                {/* SIDEBAR - ÚLTIMAS VENDAS */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <div className="glass p-6 rounded-3xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[var(--color-muted)]" />
                            Últimas Vendas
                        </h3>
                        
                        <div className="flex flex-col gap-4">
                            {vendasRecentes.length === 0 ? (
                                <p className="text-[var(--color-muted)] text-sm text-center py-4">Nenhuma venda recente.</p>
                            ) : (
                                vendasRecentes.map((v) => (
                                    <div key={v.id} className="p-4 rounded-2xl bg-white/5 border border-[var(--color-border)] hover:bg-white/10 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-white">{v.cultura}</span>
                                            <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md">
                                                R$ {Number(v.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--color-muted)] mb-1">{v.cliente_nome}</p>
                                        <p className="text-xs text-[var(--color-muted)] flex items-center gap-1">
                                            <FileText className="w-3 h-3" /> {v.quantidade_kg} kg a R$ {v.preco_kg}/kg
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                        <h3 className="font-bold text-white mb-2">Dica do Sistema</h3>
                        <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                            Ao manter o <strong>Lançamento Automático</strong> ativado, sua venda vira imediatamente uma "Conta a Receber" no Módulo Financeiro, poupando tempo de redigitação e evitando erros.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
