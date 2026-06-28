import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ShoppingCart, Store, FileText, Plus, Building2, CheckCircle, XCircle, AlertCircle, TrendingUp, Package, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function CotacoesScreen() {
    const [fornecedores, setFornecedores] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [cotacoes, setCotacoes] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [loading, setLoading] = useState(true);

    // Modais
    const [showFornecedorModal, setShowFornecedorModal] = useState(false);
    const [showCotacaoModal, setShowCotacaoModal] = useState(false);

    // Formulário Fornecedor
    const [nomeFantasia, setNomeFantasia] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');

    // Formulário Cotação
    const [fornecedorSelecionado, setFornecedorSelecionado] = useState('');
    const [itemNome, setItemNome] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valorUnitario, setValorUnitario] = useState('');

    const fetchDados = async () => {
        try {
            setLoading(true);
            const { data: fornData, error: fornError } = await supabase
                .from('v2_fornecedores')
                .select('*')
                .order('nome_fantasia', { ascending: true });

            if (fornError && fornError.code !== '42P01') throw fornError;
            
            const { data: cotData, error: cotError } = await supabase
                .from('v2_cotacoes')
                .select('*, fornecedor:fornecedor_id(nome_fantasia)')
                .order('data_cotacao', { ascending: false });

            if (cotError && cotError.code !== '42P01') throw cotError;

            setFornecedores(fornData || []);
            setCotacoes(cotData || []);
        } catch (error: unknown) {
            const _err = error as Error;
            console.error('Erro ao buscar compras:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDados();
    }, []);



    const handleSaveFornecedor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nomeFantasia) return;

        try {
            const { data: userData } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('v2_fornecedores')
                .insert([{
                    user_id: userData.user?.id,
                    nome_fantasia: nomeFantasia,
                    telefone,
                    email
                }]);
            
            if (error) throw error;

            toast.success('Fornecedor cadastrado!');
            setShowFornecedorModal(false);
            setNomeFantasia('');
            setTelefone('');
            setEmail('');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao salvar fornecedor.');
        }
    };

    const handleSaveCotacao = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fornecedorSelecionado || !itemNome || !quantidade || !valorUnitario) return;

        try {
            const { data: userData } = await supabase.auth.getUser();
            const { error } = await supabase
                .from('v2_cotacoes')
                .insert([{
                    user_id: userData.user?.id,
                    fornecedor_id: fornecedorSelecionado,
                    item_nome: itemNome,
                    quantidade: parseFloat(quantidade),
                    valor_unitario: parseFloat(valorUnitario)
                }]);
            
            if (error) throw error;

            toast.success('Cotação registrada!');
            setShowCotacaoModal(false);
            setItemNome('');
            setQuantidade('');
            setValorUnitario('');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao registrar cotação.');
        }
    };

    const atualizarStatusCotacao = async (uuid: string, novoStatus: string) => {
        try {
            const { error } = await supabase
                .from('v2_cotacoes')
                .update({ status: novoStatus })
                .eq('uuid', uuid);

            if (error) throw error;
            toast.success(`Cotação ${novoStatus.toLowerCase()}!`);
            fetchDados();
        } catch (error) {
            toast.error('Erro ao atualizar cotação.');
        }
    };

    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'APROVADA':
                return <span className="flex items-center gap-1.5 text-xs font-black tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full"><CheckCircle className="w-3.5 h-3.5" /> APROVADA</span>;
            case 'REJEITADA':
                return <span className="flex items-center gap-1.5 text-xs font-black tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full"><XCircle className="w-3.5 h-3.5" /> REJEITADA</span>;
            default:
                return <span className="flex items-center gap-1.5 text-xs font-black tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full"><AlertCircle className="w-3.5 h-3.5" /> ABERTA</span>;
        }
    };

    const totalCotacoesAbertas = cotacoes.filter(c => c.status !== 'APROVADA' && c.status !== 'REJEITADA').length;
    const valorTotalAprovado = cotacoes.filter(c => c.status === 'APROVADA').reduce((acc, curr) => acc + (curr.valor_total || 0), 0);

    return (
        <div className="animate-fade-in pb-12 space-y-8">
            {/* HERO CABEÇALHO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <ShoppingCart className="w-4 h-4" /> Suprimentos e Orçamentos
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Compras
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Pesquisa de mercado e planejamento de compras (sem afetar estoque).
                        </p>
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between group border-b-4 border-blue-500 hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Fornecedores Ativos</p>
                        <h3 className="text-3xl font-black text-white">{fornecedores.length}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Store className="w-7 h-7 text-blue-500" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between group border-b-4 border-amber-500 hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Cotações Abertas</p>
                        <h3 className="text-3xl font-black text-amber-400">{totalCotacoesAbertas}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-7 h-7 text-amber-500" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between group border-b-4 border-green-500 hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Volume Aprovado</p>
                        <h3 className="text-2xl font-black text-green-400">R$ {valorTotalAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-7 h-7 text-green-500" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6 w-full mt-6">
                    <div className="glass-card rounded-3xl overflow-hidden flex flex-col h-[600px]">
                        <div className="p-6 border-b border-[var(--color-border)] flex items-center justify-between bg-white/[0.02]">
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <FileText className="w-6 h-6 text-[var(--color-primary)]" />
                                Painel de Cotações
                            </h2>
                            <button 
                                onClick={() => setShowCotacaoModal(true)}
                                className="bg-[var(--color-primary)] hover:opacity-90 px-5 py-2.5 rounded-xl text-white font-bold transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-[var(--color-primary)]/20"
                            >
                                <Plus className="w-5 h-5" />
                                Nova Cotação
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 bg-white/[0.01] custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full text-[var(--color-muted)]">
                                    <div className="w-8 h-8 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
                                </div>
                            ) : cotacoes.length === 0 ? (
                                <div className="text-center text-[var(--color-muted)] flex flex-col items-center justify-center h-full">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        <FileText className="w-10 h-10 opacity-30" />
                                    </div>
                                    <p className="text-xl text-white font-black mb-2">Nenhuma cotação no momento</p>
                                    <p className="max-w-xs text-center">Inicie um orçamento para compra de insumos, sementes ou defensivos.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {cotacoes.map(c => (
                                        <div key={c.uuid} className="bg-[var(--color-background)] border border-[var(--color-border)] p-5 rounded-2xl flex flex-col md:flex-row justify-between gap-6 hover:border-[var(--color-primary)]/30 transition-colors relative overflow-hidden group">
                                            {/* Accent Line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.status === 'APROVADA' ? 'bg-green-500' : c.status === 'REJEITADA' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                            
                                            <div className="flex-1 pl-2">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                                                            <Package className="w-5 h-5 text-[var(--color-muted)]" />
                                                        </div>
                                                        <h3 className="text-xl font-black text-white">{c.item_nome}</h3>
                                                    </div>
                                                    {renderStatusBadge(c.status)}
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-bold mb-1">Fornecedor</p>
                                                        <p className="text-sm font-bold text-white flex items-center gap-2">
                                                            <Store className="w-4 h-4 text-[var(--color-primary)]" />
                                                            {c.fornecedor?.nome_fantasia || 'Desconhecido'}
                                                        </p>
                                                    </div>
                                                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                                        <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-bold mb-1">Volume</p>
                                                        <p className="text-sm font-bold text-white flex items-center gap-2">
                                                            <Box className="w-4 h-4 text-blue-400" />
                                                            {c.quantidade} {c.unidade}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col justify-between items-end gap-4 md:border-l border-[var(--color-border)] md:pl-6 min-w-[200px]">
                                                <div className="text-right w-full bg-white/5 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border md:border-none border-white/5">
                                                    <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider font-bold mb-1">Valor Total</p>
                                                    <p className="text-2xl font-black text-white">R$ {c.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                    <p className="text-xs text-[var(--color-muted)] font-medium mt-1">R$ {c.valor_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / un</p>
                                                </div>
                                                
                                                {c.status !== 'APROVADA' && c.status !== 'REJEITADA' && (
                                                    <div className="flex gap-2 w-full mt-auto">
                                                        <button 
                                                            onClick={() => atualizarStatusCotacao(c.uuid, 'REJEITADA')}
                                                            className="flex-1 py-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 font-bold text-sm transition-colors border border-red-500/20"
                                                        >
                                                            Rejeitar
                                                        </button>
                                                        <button 
                                                            onClick={() => atualizarStatusCotacao(c.uuid, 'APROVADA')}
                                                            className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 font-black text-sm transition-colors border border-green-500/30"
                                                        >
                                                            Aprovar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            {/* MODAL NOVA COTAÇÃO */}
            {showCotacaoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCotacaoModal(false)}></div>
                    <div className="glass border border-[var(--color-border)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in flex flex-col">
                        <div className="h-2 w-full bg-blue-500"></div>
                        <div className="p-6 border-b border-[var(--color-border)] bg-white/[0.02] flex justify-between items-center">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <FileText className="text-blue-500 w-6 h-6" />
                                Abrir Nova Cotação
                            </h2>
                            <button onClick={() => setShowCotacaoModal(false)} className="text-[var(--color-muted)] hover:text-white transition-colors">&times;</button>
                        </div>
                        <form onSubmit={handleSaveCotacao} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Fornecedor *</label>
                                <SearchableSelect 
                                    value={fornecedorSelecionado}
                                    onChange={(val) => setFornecedorSelecionado(val)}
                                    options={fornecedores.map(f => ({
                                        label: f.nome_fantasia,
                                        value: f.uuid
                                    }))}
                                    allowCustom={false}
                                    placeholder="Selecione um Fornecedor"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Produto Cotado *</label>
                                <input 
                                    type="text" required value={itemNome} onChange={e => setItemNome(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ex: Ureia 46%, Semente Milho..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Quantidade</label>
                                    <input 
                                        type="number" step="0.01" required value={quantidade} onChange={e => setQuantidade(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Preço Unit. (R$)</label>
                                    <input 
                                        type="number" step="0.01" required value={valorUnitario} onChange={e => setValorUnitario(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mt-4">
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Previsão do Valor Total</p>
                                <p className="text-2xl font-black text-white">
                                    R$ {((parseFloat(quantidade) || 0) * (parseFloat(valorUnitario) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-[var(--color-border)]">
                                <button type="button" onClick={() => setShowCotacaoModal(false)} className="flex-1 py-3 text-[var(--color-muted)] hover:bg-white/5 rounded-xl font-bold transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all">Lançar Cotação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
