import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ShoppingCart, Store, FileText, Plus, Search, Building2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ComprasScreen() {
    const [fornecedores, setFornecedores] = useState<any[]>([]);
    const [cotacoes, setCotacoes] = useState<any[]>([]);
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

    useEffect(() => {
        fetchDados();
    }, []);

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
        } catch (error: any) {
            console.error('Erro ao buscar compras:', error);
            // toast.error('Não foi possível carregar os dados.');
        } finally {
            setLoading(false);
        }
    };

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
                return <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded"><CheckCircle className="w-3 h-3" /> APROVADA</span>;
            case 'REJEITADA':
                return <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded"><XCircle className="w-3 h-3" /> REJEITADA</span>;
            default:
                return <span className="flex items-center gap-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded"><AlertCircle className="w-3 h-3" /> ABERTA</span>;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in">
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-[var(--color-primary)]" />
                        Compras e Cotações
                    </h1>
                    <p className="text-[var(--color-muted)] mt-1">Gestão de fornecedores e aprovação de orçamentos</p>
                </div>
            </div>

            {/* SPLIT VIEW (Duas Colunas) */}
            <div className="flex flex-col xl:flex-row gap-6 flex-1 overflow-hidden">
                
                {/* LADO ESQUERDO: FORNECEDORES */}
                <div className="xl:w-1/3 flex flex-col gap-4">
                    <div className="glass-card p-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Store className="w-5 h-5 text-[var(--color-primary)]" />
                            Fornecedores
                        </h2>
                        <button 
                            onClick={() => setShowFornecedorModal(true)}
                            className="bg-white/5 hover:bg-white/10 p-2 rounded-xl text-white transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="glass-card flex-1 overflow-y-auto p-4 space-y-3">
                        {loading ? (
                            <div className="text-center text-[var(--color-muted)] py-8 animate-pulse">Carregando...</div>
                        ) : fornecedores.length === 0 ? (
                            <div className="text-center text-[var(--color-muted)] py-8">Nenhum fornecedor cadastrado.</div>
                        ) : (
                            fornecedores.map(f => (
                                <div key={f.uuid} className="bg-[#121212] border border-[var(--color-border)] p-4 rounded-xl flex items-center gap-4 hover:border-[var(--color-primary)] transition-colors group cursor-pointer">
                                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-[var(--color-primary)] shrink-0 group-hover:scale-110 transition-transform">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-bold truncate">{f.nome_fantasia}</h3>
                                        <p className="text-sm text-[var(--color-muted)] truncate">{f.email || 'Sem email'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* LADO DIREITO: COTAÇÕES */}
                <div className="xl:w-2/3 flex flex-col gap-4">
                    <div className="glass-card p-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-[var(--color-primary)]" />
                            Cotações
                        </h2>
                        <button 
                            onClick={() => setShowCotacaoModal(true)}
                            className="bg-[var(--color-primary)] hover:opacity-90 px-4 py-2 rounded-xl text-white font-bold transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Plus className="w-5 h-5" />
                            Nova Cotação
                        </button>
                    </div>

                    <div className="glass-card flex-1 overflow-y-auto p-4">
                        {loading ? (
                            <div className="text-center text-[var(--color-muted)] py-8 animate-pulse">Carregando...</div>
                        ) : cotacoes.length === 0 ? (
                            <div className="text-center text-[var(--color-muted)] py-12 flex flex-col items-center">
                                <FileText className="w-12 h-12 mb-4 opacity-30" />
                                <p className="text-lg text-white font-medium">Nenhuma cotação em aberto</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {cotacoes.map(c => (
                                    <div key={c.uuid} className="bg-[#121212] border border-[var(--color-border)] p-5 rounded-xl flex flex-col md:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold text-white">{c.item_nome}</h3>
                                                {renderStatusBadge(c.status)}
                                            </div>
                                            <p className="text-sm text-[var(--color-muted)] mb-1">
                                                Fornecedor: <span className="text-white">{c.fornecedor?.nome_fantasia || 'Desconhecido'}</span>
                                            </p>
                                            <p className="text-sm text-[var(--color-muted)]">
                                                Quantidade: <span className="text-white">{c.quantidade} {c.unidade}</span>
                                            </p>
                                        </div>

                                        <div className="flex flex-col justify-between items-end gap-4 md:border-l border-[var(--color-border)] md:pl-6">
                                            <div className="text-right">
                                                <p className="text-xs text-[var(--color-muted)] uppercase tracking-wider mb-1">Valor Total</p>
                                                <p className="text-2xl font-black text-white">R$ {c.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                            
                                            {c.status === 'ABERTA' && (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => atualizarStatusCotacao(c.uuid, 'REJEITADA')}
                                                        className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 font-medium text-sm transition-colors"
                                                    >
                                                        Rejeitar
                                                    </button>
                                                    <button 
                                                        onClick={() => atualizarStatusCotacao(c.uuid, 'APROVADA')}
                                                        className="px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/40 font-bold text-sm transition-colors"
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

            {/* MODAL NOVO FORNECEDOR */}
            {showFornecedorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowFornecedorModal(false)}>
                    <div className="glass border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4">Novo Fornecedor</h2>
                        <form onSubmit={handleSaveFornecedor} className="space-y-4">
                            <input 
                                type="text" required placeholder="Nome Fantasia" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)}
                                className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            />
                            <input 
                                type="text" placeholder="Telefone" value={telefone} onChange={e => setTelefone(e.target.value)}
                                className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            />
                            <input 
                                type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
                                className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            />
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowFornecedorModal(false)} className="flex-1 py-2 text-[var(--color-muted)] hover:text-white font-semibold">Cancelar</button>
                                <button type="submit" className="flex-1 py-2 bg-[var(--color-primary)] rounded-xl text-white font-bold">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL NOVA COTAÇÃO */}
            {showCotacaoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowCotacaoModal(false)}>
                    <div className="glass border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4">Nova Cotação</h2>
                        <form onSubmit={handleSaveCotacao} className="space-y-4">
                            <select 
                                required value={fornecedorSelecionado} onChange={e => setFornecedorSelecionado(e.target.value)}
                                className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            >
                                <option value="">Selecione um Fornecedor</option>
                                {fornecedores.map(f => <option key={f.uuid} value={f.uuid}>{f.nome_fantasia}</option>)}
                            </select>
                            
                            <input 
                                type="text" required placeholder="Item/Produto cotado" value={itemNome} onChange={e => setItemNome(e.target.value)}
                                className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="number" step="0.01" required placeholder="Quantidade" value={quantidade} onChange={e => setQuantidade(e.target.value)}
                                    className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                                <input 
                                    type="number" step="0.01" required placeholder="Valor Unitário (R$)" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)}
                                    className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setShowCotacaoModal(false)} className="flex-1 py-3 text-[var(--color-muted)] hover:text-white font-semibold">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-[var(--color-primary)] rounded-xl text-white font-bold active:scale-95 transition-transform">Registrar Cotação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
