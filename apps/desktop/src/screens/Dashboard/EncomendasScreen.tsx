import React, { useState, useEffect, useMemo } from 'react';
import { 
    Package, 
    Calendar, 
    CheckCircle2, 
    XCircle,
    Clock,
    RefreshCw,
    Plus,
    User,
    FileText,
    ArrowRight
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function EncomendasScreen() {
    const [loading, setLoading] = useState(true);
    const [encomendas, setEncomendas] = useState<Record<string, string | number | boolean | null>[]>([]);
    
    // Filtros
    const [filter, setFilter] = useState('TODOS');
    
    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Relacionamentos para Selects
    const [clientes, setClientes] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [produtos, setProdutos] = useState<Record<string, string | number | boolean | null>[]>([]);

    // Form states
    const [clienteId, setClienteId] = useState('');
    const [produtoId, setProdutoId] = useState('');
    const [unidade, setUnidade] = useState('CAIXA');
    const [quantidadeTotal, setQuantidadeTotal] = useState('');
    const [valorUnitario, setValorUnitario] = useState('');
    const [dataPrevista, setDataPrevista] = useState('');
    const [observacao, setObservacao] = useState('');

    const navigate = useNavigate();

    const fetchDados = async () => {
        setLoading(true);
        try {
            // Buscar clientes e produtos para os selects
            const { data: cliData } = await supabase.from('v2_clientes').select('*');
            const { data: prodData } = await supabase.from('v2_estoque_atual').select('*'); // ou tabela de produtos se existir
            
            // Buscar Encomendas (Orders)
            const { data: encData, error } = await supabase
                .from('v2_encomendas')
                .select('*')
                .order('created_at', { ascending: false });

            setClientes(cliData || []);
            setProdutos(prodData || []);

            if (error && error.code === '42P01') {
                // Mock behavior se a tabela não existir ainda no Supabase
                setEncomendas([
                    {
                        id: 'mock-1',
                        cliente_nome: 'João Batista',
                        produto_nome: 'Morango Premium',
                        unidade: 'CAIXA',
                        quantidade_total: 100,
                        quantidade_restante: 100,
                        valor_unitario: 45.0,
                        data_prevista: '2026-06-15',
                        status: 'PENDENTE',
                        observacao: 'Entregar de manhã.',
                        created_at: new Date().toISOString()
                    }
                ]);
            } else {
                setEncomendas(encData || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDados();
    }, []);

    const handleSalvar = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!clienteId || !produtoId || !quantidadeTotal) {
            return toast.error("Preencha Cliente, Produto e Quantidade.");
        }

        const qtdTotal = parseFloat(quantidadeTotal);
        const valUnit = valorUnitario ? parseFloat(valorUnitario) : 0;
        
        const clienteSelecionado = clientes.find(c => c.id === clienteId);
        const produtoSelecionado = produtos.find(p => p.id === produtoId);

        try {
            if (editingId) {
                // Modo Edição (MVP)
                const payload = {
                    cliente_id: clienteId,
                    cliente_nome: clienteSelecionado?.nome || 'Cliente',
                    produto_id: produtoId,
                    produto_nome: produtoSelecionado?.cultura || produtoSelecionado?.nome || 'Produto',
                    unidade,
                    quantidade_total: qtdTotal,
                    valor_unitario: valUnit,
                    data_prevista: dataPrevista,
                    observacao
                };

                const { error } = await supabase.from('v2_encomendas').update(payload).eq('id', editingId);
                
                if (error && error.code === '42P01') {
                    setEncomendas(encomendas.map(e_local => e_local.id === editingId ? { ...e_local, ...payload } : e_local));
                } else if (error) throw error;
                
                toast.success('Encomenda atualizada!');
            } else {
                // Modo Inserção
                const payload = {
                    cliente_id: clienteId,
                    cliente_nome: clienteSelecionado?.nome || 'Cliente',
                    produto_id: produtoId,
                    produto_nome: produtoSelecionado?.cultura || produtoSelecionado?.nome || 'Produto',
                    unidade,
                    quantidade_total: qtdTotal,
                    quantidade_restante: qtdTotal,
                    valor_unitario: valUnit,
                    data_prevista: dataPrevista,
                    observacao,
                    status: 'PENDENTE'
                };

                const { error } = await supabase.from('v2_encomendas').insert([payload]);

                if (error && error.code === '42P01') {
                    setEncomendas([{ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...encomendas]);
                } else if (error) throw error;

                toast.success('Encomenda criada com sucesso!');
            }

            closeModal();
            fetchDados();
        } catch (error: unknown) {
            const err = error as Error | { message: string };
            toast.error("Erro ao salvar: " + err.message);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase.from('v2_encomendas').update({ status: newStatus }).eq('id', id);
            
            if (error && error.code === '42P01') {
                setEncomendas(encomendas.map(e => e.id === id ? { ...e, status: newStatus } : e));
                toast.success('Status atualizado!');
                return;
            } else if (error) throw error;

            toast.success('Status atualizado!');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleEfetivarVenda = (item: Record<string, string | number | boolean | null>) => {
        // Redirecionar para a tela de Vendas com os dados da encomenda
        navigate('/dashboard/cliente/vendas', {
            state: {
                autoFill: true,
                encomendaId: item.id,
                clienteId: item.cliente_id,
                clienteNome: item.cliente_nome,
                produtoId: item.produto_id,
                produtoNome: item.produto_nome,
                quantidadeRestante: item.quantidade_restante || item.quantidade_total
            }
        });
    };

    const openModalNovo = () => {
        setEditingId(null);
        setClienteId('');
        setProdutoId('');
        setUnidade('CAIXA');
        setQuantidadeTotal('');
        setValorUnitario('');
        setDataPrevista('');
        setObservacao('');
        setShowModal(true);
    };

    const openModalEditar = (enc: Record<string, string | number | boolean | null>) => {
        setEditingId(enc.id);
        setClienteId(enc.cliente_id || '');
        setProdutoId(enc.produto_id || '');
        setUnidade(enc.unidade || 'CAIXA');
        setQuantidadeTotal(enc.quantidade_total?.toString() || '');
        setValorUnitario(enc.valor_unitario?.toString() || '');
        setDataPrevista(enc.data_prevista || '');
        setObservacao(enc.observacao || '');
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    // Filtro e Computados
    const filteredData = useMemo(() => {
        let list = encomendas;
        if (filter === 'PENDENTE') list = list.filter(e => e.status === 'PENDENTE' || e.status === 'PARCIAL');
        else if (filter === 'ENTREGUE') list = list.filter(e => e.status === 'CONCLUIDA');
        else if (filter === 'CANCELADA') list = list.filter(e => e.status === 'CANCELADA');
        
        return list.sort((a, b) => {
            if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
            if (a.status !== 'PENDENTE' && b.status === 'PENDENTE') return 1;
            return 0;
        });
    }, [encomendas, filter]);

    const dashboardData = useMemo(() => {
        let totalVal = 0;
        let ativas = 0;
        encomendas.forEach(item => {
            if (item.status === 'PENDENTE' || item.status === 'PARCIAL') {
                ativas++;
                totalVal += (item.quantidade_total * (item.valor_unitario || 0));
            }
        });
        return { totalVal, ativas };
    }, [encomendas]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'PENDENTE': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: Clock, label: 'PENDENTE' };
            case 'PARCIAL': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: RefreshCw, label: 'PARCIAL' };
            case 'CONCLUIDA': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'ENTREGUE' };
            case 'CANCELADA': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'CANCELADA' };
            default: return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Clock, label: 'N/A' };
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-6xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Package className="w-8 h-8 text-emerald-500" />
                        Encomendas
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1 uppercase tracking-wider text-xs">
                        LOGÍSTICA & ENTREGAS (PEDIDOS)
                    </p>
                </div>
                
                <button 
                    onClick={openModalNovo}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Nova Encomenda
                </button>
            </div>

            {/* DASHBOARD STRIP */}
            <div className="glass flex justify-between items-center rounded-2xl p-6 border border-[var(--color-border)]">
                <div>
                    <p className="text-[var(--color-muted)] text-xs font-black tracking-widest uppercase mb-1">Em Aberto</p>
                    <p className="text-emerald-400 text-3xl font-black">
                        R$ {dashboardData.totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-6 py-3 flex flex-col items-center justify-center">
                    <span className="text-emerald-400 text-2xl font-black">{dashboardData.ativas}</span>
                    <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase">ATIVAS</span>
                </div>
            </div>

            {/* FILTER CHIPS */}
            <div className="flex flex-wrap gap-2">
                {['TODOS', 'PENDENTE', 'ENTREGUE', 'CANCELADA'].map(chip => (
                    <button
                        key={chip}
                        onClick={() => setFilter(chip)}
                        className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider transition-all ${filter === chip ? 'bg-white/10 text-white border border-white/20' : 'bg-transparent text-[var(--color-muted)] hover:bg-white/5 border border-transparent'}`}
                    >
                        {chip === 'ENTREGUE' ? 'ENTREGUES' : chip === 'CANCELADA' ? 'CANCELADAS' : chip}
                    </button>
                ))}
            </div>

            {/* LISTA */}
            {loading ? (
                <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>
            ) : filteredData.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                    <Package className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                    <h3 className="text-xl font-bold text-white mb-2">Sem encomendas aqui.</h3>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredData.map(item => {
                        const { color, bg, border, icon: StatusIcon, label } = getStatusInfo(item.status);
                        const total = item.quantidade_total * (item.valor_unitario || 0);

                        return (
                            <div key={item.id} className="glass rounded-2xl border border-[var(--color-border)] overflow-hidden flex flex-col hover:border-white/20 transition-colors">
                                <div className="flex flex-row">
                                    <div className={`w-1.5 ${color.replace('text', 'bg')} opacity-80`}></div>
                                    <div className="flex-1 p-5">
                                        
                                        {/* Header do Card */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-white font-bold text-lg">{item.cliente_nome || 'Cliente não informado'}</h3>
                                                <p className="text-[var(--color-muted)] text-xs font-medium flex items-center gap-1 mt-1">
                                                    <Calendar className="w-3 h-3" /> 
                                                    {item.data_prevista ? new Date(item.data_prevista).toLocaleDateString('pt-BR') : 'Sem data definida'}
                                                </p>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest ${bg} ${color} border ${border}`}>
                                                <StatusIcon className="w-3.5 h-3.5" /> {label}
                                            </div>
                                        </div>

                                        <div className="h-px w-full bg-[var(--color-border)] mb-4"></div>

                                        {/* Detalhes do Card */}
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold text-sm">{item.produto_nome || 'Produto'}</p>
                                                    <p className="text-[var(--color-muted)] text-xs mt-0.5">{item.quantidade_total} {item.unidade || 'UN'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[var(--color-muted)] text-[9px] font-black tracking-widest mb-0.5">VALOR TOTAL</p>
                                                <p className="text-white font-black text-lg">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                            </div>
                                        </div>

                                        {/* Ações */}
                                        <div className="flex justify-end items-center gap-3 mt-4">
                                            <button 
                                                onClick={() => openModalEditar(item)}
                                                className="text-[var(--color-muted)] text-xs font-bold hover:text-white px-3 py-2 transition-colors"
                                            >
                                                Editar Pedido
                                            </button>

                                            {(item.status === 'PENDENTE' || item.status === 'PARCIAL') && (
                                                <button 
                                                    onClick={() => handleEfetivarVenda(item)}
                                                    className="bg-emerald-500 hover:bg-emerald-400 text-white flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                                                >
                                                    Efetivar Venda <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL NOVA / EDITAR ENCOMENDA */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="glass border border-[var(--color-border)] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]">
                        
                        <div className="p-6 border-b border-[var(--color-border)] bg-white/[0.02] flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-white">{editingId ? 'Editar Encomenda' : 'Nova Encomenda'}</h2>
                                <p className="text-emerald-400 text-xs font-bold tracking-widest mt-1">SETUP DE OPERAÇÃO LOGÍSTICA</p>
                            </div>
                            <button onClick={closeModal} className="text-[var(--color-muted)] hover:text-white w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">&times;</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <form id="encomendaForm" onSubmit={handleSalvar} className="space-y-6">
                                
                                {/* Clientes e Produtos */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            <User className="w-4 h-4 text-emerald-400" /> Cliente Destino *
                                        </label>
                                        <select 
                                            required value={clienteId} onChange={e => setClienteId(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        >
                                            <option value="" disabled>Selecione o cliente...</option>
                                            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            <Package className="w-4 h-4 text-emerald-400" /> Produto/Carga *
                                        </label>
                                        <select 
                                            required value={produtoId} onChange={e => setProdutoId(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        >
                                            <option value="" disabled>O que vamos entregar?</option>
                                            {produtos.map(p => <option key={p.id} value={p.id}>{p.cultura || p.nome}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Unidade e Quantidade */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Unidade
                                        </label>
                                        <select 
                                            value={unidade} onChange={e => setUnidade(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 outline-none"
                                        >
                                            <option value="CAIXA">CAIXA (CX)</option>
                                            <option value="KG">QUILO (KG)</option>
                                            <option value="LITRO">LITRO (LT)</option>
                                            <option value="UNIDADE">UNIDADE (UN)</option>
                                            <option value="SACO">SACO (SC)</option>
                                            <option value="TONELADA">TONELADA (TON)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Quantidade *
                                        </label>
                                        <div className="relative">
                                            <input 
                                                required type="number" min="0.1" step="0.1" value={quantidadeTotal} onChange={e => setQuantidadeTotal(e.target.value)}
                                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                placeholder="0"
                                            />
                                            <span className="absolute right-4 top-3 text-[var(--color-muted)] font-bold text-sm">{unidade === 'CAIXA' ? 'CX' : unidade}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Valor e Data */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Valor Unit. (R$)
                                        </label>
                                        <input 
                                            type="number" min="0" step="0.01" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="0,00"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Previsto Para
                                        </label>
                                        <input 
                                            type="date" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 outline-none [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                {/* Obs */}
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        <FileText className="w-4 h-4 text-slate-400" /> Instruções Relevantes
                                    </label>
                                    <textarea 
                                        rows={3} value={observacao} onChange={e => setObservacao(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 outline-none resize-none"
                                        placeholder="Informações para a transportadora ou motorista..."
                                    />
                                </div>

                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] bg-white/[0.02]">
                            <button 
                                type="submit" form="encomendaForm"
                                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl text-white font-black text-lg shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                            >
                                {editingId ? 'ATUALIZAR DADOS' : 'LANÇAR ENCOMENDA'}
                            </button>

                            {editingId && (
                                <button 
                                    onClick={() => handleUpdateStatus(editingId, 'CANCELADA')}
                                    className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-red-400 font-bold hover:bg-red-500/10 rounded-xl transition-all"
                                >
                                    <XCircle className="w-4 h-4" /> Cancelar Pedido
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
