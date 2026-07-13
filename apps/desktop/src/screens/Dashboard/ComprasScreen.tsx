import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ShoppingCart, Store, FileText, Plus, Building2, CheckCircle, XCircle, AlertCircle, TrendingUp, Package, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function ComprasScreen() {
    const [fornecedores, setFornecedores] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [produtos, setProdutos] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [cotacoes, setCotacoes] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [loading, setLoading] = useState(true);

    // Modais
    const [showFornecedorModal, setShowFornecedorModal] = useState(false);
    const [showCompraModal, setShowCompraModal] = useState(false);

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
            
            const { data: prodData } = await supabase.from('v2_produtos').select('*').order('nome', { ascending: true });

            const { data: cotData, error: cotError } = await supabase
                .from('v2_cotacoes')
                .select('*, fornecedor:fornecedor_id(nome_fantasia)')
                .eq('status', 'COMPRADA')
                .order('data_cotacao', { ascending: false });

            if (cotError && cotError.code !== '42P01') throw cotError;

            setFornecedores(fornData || []);
            setProdutos(prodData || []);
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

    const handleSaveCompra = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fornecedorSelecionado || !itemNome || !quantidade || !valorUnitario) return;

        try {
            setLoading(true);
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData.user?.id;
            const qtdNum = parseFloat(quantidade);

            // 1. Salvar no histórico como 'COMPRADA'
            const { error: compraError } = await supabase
                .from('v2_cotacoes')
                .insert([{
                    user_id: userId,
                    fornecedor_id: fornecedorSelecionado,
                    item_nome: itemNome,
                    quantidade: qtdNum,
                    valor_unitario: parseFloat(valorUnitario),
                    status: 'COMPRADA'
                }]);
            
            if (compraError) throw compraError;

            // 2. Dar entrada no Estoque
            const { data: estoqueAtual } = await supabase.from('v2_estoque_atual').select('*');
            let itemEstoque = (estoqueAtual || []).find(item => item.produto?.toLowerCase() === itemNome.toLowerCase());
            let itemUuid = itemEstoque?.id || itemEstoque?.uuid;

            if (itemEstoque) {
                await supabase
                    .from('v2_estoque_atual')
                    .update({ quantidade: (itemEstoque.quantidade || 0) + qtdNum, last_updated: new Date().toISOString() })
                    .eq('id', itemUuid);
            } else {
                const { data: newStock, error: insError } = await supabase
                    .from('estoque')
                    .insert([{ produto: itemNome, quantidade: qtdNum, user_id: userId }])
                    .select().single();
                if (!insError) itemUuid = newStock?.uuid;
            }

            // 3. Registrar Movimentação
            if (itemUuid) {
                await supabase
                    .from('v2_movimentacoes_estoque')
                    .insert([{
                        user_id: userId,
                        tipo: 'ENTRADA',
                        quantidade: qtdNum,
                        origem: 'COMPRA',
                        data: new Date().toISOString(),
                        produto_uuid: itemUuid
                    }]);
            }

            // 4. Integrar com o Financeiro
            const { error: errorContas } = await supabase.from('v2_transacoes_financeiras').insert([{
                conta_id: userId, // Assuming user's primary account, or fallback
                tipo: 'SAIDA',
                descricao: `Compra de Insumos: ${itemNome}`,
                valor: parseFloat(valorUnitario) * qtdNum,
                data: new Date().toISOString().split('T')[0],
                sync_status: 'synced'
            }]);

            if (errorContas) {
                console.error('Erro ao inserir conta:', errorContas);
                throw errorContas;
            }

            toast.success('Compra confirmada! Estoque e Financeiro atualizados.', { icon: '🔄' });
            setShowCompraModal(false);
            setItemNome('');
            setQuantidade('');
            setValorUnitario('');
            fetchDados();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao registrar compra.');
        } finally {
            setLoading(false);
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

    const totalCotacoesAbertas = cotacoes.length;
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
                            <ShoppingCart className="w-4 h-4" /> Compras e Estoque
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Compras (Estoque)
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Ordens de compra reais. Confirme suas compras para gerar entrada automática no estoque.
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
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Ordens de Compra</p>
                        <h3 className="text-3xl font-black text-amber-400">{totalCotacoesAbertas}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <FileText className="w-7 h-7 text-amber-500" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between group border-b-4 border-green-500 hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Capital Investido</p>
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
                                Painel de Compras
                            </h2>
                            <button 
                                onClick={() => setShowCompraModal(true)}
                                className="bg-[var(--color-primary)] hover:opacity-90 px-5 py-2.5 rounded-xl text-white font-bold transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-[var(--color-primary)]/20"
                            >
                                <Plus className="w-5 h-5" />
                                Nova Compra Real
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
                                    <p className="text-xl text-white font-black mb-2">Nenhuma compra no momento</p>
                                    <p className="max-w-xs text-center">Inicie uma nova compra oficial para dar entrada automática no seu estoque.</p>
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
                                                
                                                {/* Rejeitar/Aprovar removidos pois já é uma Compra confirmada */}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            {/* MODAL NOVA COMPRA */}
            {showCompraModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowCompraModal(false)}></div>
                    <div className="glass border border-[var(--color-border)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in flex flex-col">
                        <div className="h-2 w-full bg-[var(--color-primary)]"></div>
                        <div className="p-6 border-b border-[var(--color-border)] bg-white/[0.02] flex justify-between items-center">
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                <ShoppingCart className="text-[var(--color-primary)] w-6 h-6" />
                                Confirmar Compra e Estoque
                            </h2>
                            <button onClick={() => setShowCompraModal(false)} className="text-[var(--color-muted)] hover:text-white transition-colors">&times;</button>
                        </div>
                        <form onSubmit={handleSaveCompra} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Fornecedor *</label>
                                <div className="relative z-[60]">
                                    <SearchableSelect 
                                        options={fornecedores.map(f => ({ value: f.uuid as string, label: f.nome_fantasia as string }))}
                                        value={fornecedorSelecionado}
                                        onChange={(val) => setFornecedorSelecionado(val || '')}
                                        placeholder="Selecione um Fornecedor"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Produto Comprado *</label>
                                <div className="relative z-[50]">
                                    <SearchableSelect 
                                        options={produtos.map(p => ({ value: p.nome as string, label: `${p.nome} (${p.unidade_medida || 'UN'})` }))}
                                        value={itemNome}
                                        onChange={(val) => setItemNome(val || '')}
                                        placeholder="Selecione do Catálogo..."
                                    />
                                    <div className="text-right mt-1">
                                        <a href="#/dashboard/cliente/cadastro" className="text-xs text-[var(--color-primary)] hover:underline opacity-80">+ Novo Produto no Catálogo</a>
                                    </div>
                                </div>
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
                                <button type="button" onClick={() => setShowCompraModal(false)} className="flex-1 py-3 text-[var(--color-muted)] hover:bg-white/5 rounded-xl font-bold transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-[var(--color-primary)] hover:opacity-90 rounded-xl text-white font-black shadow-lg shadow-[var(--color-primary)]/20 active:scale-95 transition-all">Confirmar e Estoque</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
