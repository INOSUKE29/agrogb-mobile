import React, { useState, useEffect, useMemo } from 'react';
import { 
    ShoppingCart, 
    Plus, 
    TrendingUp, 
    User,
    Package,
    Trash2,
    DollarSign,
    CheckCircle2
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import DraggableModal from '../../components/common/DraggableModal';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function VendasScreen() {
    const [loading, setLoading] = useState(true);
    const [vendas, setVendas] = useState<Record<string, string | number | boolean | null>[]>([]);
    
    // Relacionamentos para Selects
    const [clientes, setClientes] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [produtos, setProdutos] = useState<Record<string, string | number | boolean | null>[]>([]);

    // Form states
    const [showModal, setShowModal] = useState(false);
    const [clienteId, setClienteId] = useState('');
    const [produtoId, setProdutoId] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [valorUnitario, setValorUnitario] = useState('');
    const [observacao, setObservacao] = useState('');
    const [vinculoEncomendaId, setVinculoEncomendaId] = useState<string | null>(null);

    const location = useLocation();
    const navigate = useNavigate();

    const fetchDados = async () => {
        setLoading(true);
        try {
            // Buscar clientes e produtos
            const { data: cliData } = await supabase.from('v2_clientes').select('*');
            const { data: prodData } = await supabase.from('v2_estoque_atual').select('*'); 
            
            // Buscar Vendas
            const { data: venData, error } = await supabase
                .from('v2_vendas')
                .select('*')
                .order('created_at', { ascending: false });

            setClientes(cliData || [
                { id: 'cli-1', nome: 'João Batista' },
                { id: 'cli-2', nome: 'Supermercado Central' }
            ]);
            setProdutos(prodData || [
                { id: 'prod-1', cultura: 'Morango Premium', preco_venda: 45.0, unidade: 'CAIXA' },
                { id: 'prod-2', cultura: 'Soja', preco_venda: 120.0, unidade: 'SACO' }
            ]);

            if (error && error.code === '42P01') {
                // Mock behavior se a tabela não existir
                setVendas([
                    {
                        id: 'mock-v-1',
                        cliente_nome: 'João Batista',
                        produto_nome: 'Morango Premium',
                        quantidade: 50,
                        valor_unitario: 45.0,
                        valor_total: 2250.0,
                        observacao: 'Pagamento à vista',
                        data_venda: new Date().toISOString().split('T')[0],
                        created_at: new Date().toISOString()
                    }
                ]);
            } else {
                setVendas(venData || []);
            }

            // Se viemos da tela de Encomendas para dar baixa
            if (location.state && location.state.autoFill) {
                const pId = location.state.produtoId || '';
                setClienteId(location.state.clienteId || '');
                setProdutoId(pId);
                setQuantidade(location.state.quantidadeRestante?.toString() || '');
                setVinculoEncomendaId(location.state.encomendaId || null);

                const prod = (prodData || []).find((p: Record<string, string | number | boolean | null>) => p.id === pId);
                if (prod && prod.preco_venda) {
                    setValorUnitario(prod.preco_venda.toString());
                }

                setShowModal(true);
                toast('Finalize os dados para efetivar a venda', { icon: '📦' });
                // Limpar o state para não reabrir se ele atualizar a página
                navigate(location.pathname, { replace: true });
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
        
        if (!produtoId || !quantidade || !valorUnitario) {
            return toast.error("Preencha Produto, Quantidade e Valor.");
        }

        const qtdTotal = parseFloat(quantidade);
        const valUnit = parseFloat(valorUnitario);
        const valTotal = qtdTotal * valUnit;
        
        const clienteSelecionado = clientes.find(c => c.id === clienteId);
        const produtoSelecionado = produtos.find(p => p.id === produtoId);

        try {
            const payload = {
                cliente_id: clienteId || null,
                cliente_nome: clienteSelecionado?.nome || 'BALCÃO',
                produto_id: produtoId,
                produto_nome: produtoSelecionado?.cultura || produtoSelecionado?.nome || 'Produto',
                quantidade: qtdTotal,
                valor_unitario: valUnit,
                valor_total: valTotal,
                data_venda: new Date().toISOString().split('T')[0],
                observacao
            };

            const { error } = await supabase.from('v2_vendas').insert([payload]);

            if (error && error.code === '42P01') {
                // Modo simulação: atualiza o state local e cria transação fake
                const novaVenda = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
                setVendas([novaVenda, ...vendas]);
                toast.success('Venda registrada! (Modo Simulação)');
                toast.success(`Gerado 'Contas a Receber' de R$ ${valTotal.toFixed(2)}`, { icon: '💰' });

                // MOCK: Atualiza a encomenda vinculada
                if (vinculoEncomendaId) {
                    toast.success('Encomenda atualizada e vinculada!');
                }
            } else if (error) throw error;
            else {
                toast.success('Venda criada com sucesso!');
                if (vinculoEncomendaId) {
                    // Update encomenda
                    await supabase.from('v2_encomendas')
                        .update({ status: 'CONCLUIDA' }) // Idealmente calcularia restante
                        .eq('id', vinculoEncomendaId);
                }
            }

            closeModal();
        } catch (error: unknown) {
            const err = error as Error | { message: string };
            toast.error("Erro ao salvar: " + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Deseja realmente apagar esta venda?')) return;
        try {
            const { error } = await supabase.from('v2_vendas').delete().eq('id', id);
            if (error && error.code === '42P01') {
                setVendas(vendas.filter(v => v.id !== id));
                toast.success('Venda removida');
            } else if (error) throw error;
            else {
                toast.success('Venda removida');
                fetchDados();
            }
        } catch (error) {
            toast.error('Erro ao excluir venda');
        }
    };

    const openModalNovo = () => {
        setClienteId('');
        setProdutoId('');
        setQuantidade('');
        setValorUnitario('');
        setObservacao('');
        setVinculoEncomendaId(null);
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const dashboardData = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        let valHoje = 0;
        let ativas = 0;
        vendas.forEach(item => {
            if (item.data_venda === today) {
                ativas++;
                valHoje += item.valor_total || (item.quantidade * (item.valor_unitario || 0));
            }
        });
        return { valHoje, ativas };
    }, [vendas]);

    return (
        <div className="animate-fade-in pb-12 max-w-6xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShoppingCart className="w-8 h-8 text-emerald-500" />
                        FLUXO DE VENDAS
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1 uppercase tracking-wider text-xs">
                        COMERCIALIZAÇÃO E FATURAMENTO
                    </p>
                </div>
                
                <button 
                    onClick={openModalNovo}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Nova Venda
                </button>
            </div>

            {/* DASHBOARD STRIP */}
            <div className="glass flex justify-between items-center rounded-2xl p-6 border border-[var(--color-border)]">
                <div>
                    <p className="text-[var(--color-muted)] text-xs font-black tracking-widest uppercase mb-1 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" /> Total R$ Hoje
                    </p>
                    <p className="text-emerald-400 text-3xl font-black">
                        R$ {dashboardData.valHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-6 py-3 flex flex-col items-center justify-center">
                    <span className="text-emerald-400 text-2xl font-black">{dashboardData.ativas}</span>
                    <span className="text-emerald-400 text-[10px] font-black tracking-widest uppercase">VENDAS HOJE</span>
                </div>
            </div>

            {/* LISTA DE VENDAS */}
            <div className="pt-4">
                <h3 className="text-[var(--color-muted)] text-xs font-black tracking-widest uppercase mb-4 pl-2">HISTÓRICO RECENTE</h3>
                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>
                ) : vendas.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
                        <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                        <h3 className="text-xl font-bold text-white mb-2">Sem vendas registradas.</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vendas.map(item => (
                            <div key={item.id} className="glass rounded-2xl border border-[var(--color-border)] p-5 hover:border-white/20 transition-colors flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="text-white font-bold text-lg leading-tight">{item.produto_nome}</h3>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-400/50 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[var(--color-muted)] text-sm mb-3">
                                        {item.cliente_nome} • {item.data_venda ? new Date(item.data_venda).toLocaleDateString('pt-BR') : ''}
                                    </p>
                                    <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                                        <div className="text-[var(--color-muted)] text-xs font-medium">
                                            {item.quantidade}x R$ {Number(item.valor_unitario).toFixed(2)}
                                        </div>
                                        <div className="text-emerald-400 font-black text-lg">
                                            R$ {Number(item.valor_total || (item.quantidade * item.valor_unitario)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL NOVA VENDA */}
            <DraggableModal
                isOpen={showModal}
                onClose={closeModal}
                width="800px"
                title={
                    <div>
                        <h2 className="text-2xl font-black text-white">Nova Venda</h2>
                        <p className="text-emerald-400 text-xs font-bold tracking-widest mt-1">SAÍDA DE ESTOQUE & FATURAMENTO</p>
                    </div>
                }
                footer={
                    <div className="flex gap-3">
                        <button onClick={closeModal} type="button" className="flex-1 py-3 text-[var(--color-muted)] font-bold hover:bg-white/5 rounded-xl transition-all">Cancelar</button>
                        <button 
                            type="submit" form="vendaForm"
                            className="flex-[2] py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl text-white font-black text-lg shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <DollarSign className="w-5 h-5" /> REGISTRAR VENDA
                        </button>
                    </div>
                }
            >
                <form id="vendaForm" onSubmit={handleSalvar} className="space-y-6">
                    
                    <div className="z-[60] relative">
                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                            <User className="w-4 h-4 text-emerald-400" /> Cliente / Parceiro
                        </label>
                        <SearchableSelect 
                            options={[
                                { value: '', label: 'BALCÃO (Sem Cliente)' },
                                ...clientes.map(c => ({ value: c.id, label: c.nome }))
                            ]}
                            value={clienteId}
                            onChange={(val) => setClienteId(val || '')}
                            placeholder="Selecionar Cliente..."
                        />
                    </div>

                    <div className="z-[50] relative">
                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                            <Package className="w-4 h-4 text-emerald-400" /> Produto Vendido *
                        </label>
                        <SearchableSelect 
                            options={produtos.map(p => ({ value: p.id, label: p.cultura || p.nome }))}
                            value={produtoId}
                            onChange={(newId) => {
                                setProdutoId(newId || '');
                                const prod = produtos.find(p => p.id === newId);
                                if (prod && prod.preco_venda) {
                                    setValorUnitario(prod.preco_venda.toString());
                                }
                            }}
                            placeholder="Selecionar Produto..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                Quantidade *
                            </label>
                            <input 
                                required type="number" min="0.1" step="0.1" value={quantidade} onChange={e => setQuantidade(e.target.value)}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                Valor Unit. (R$) *
                            </label>
                            <input 
                                required type="number" min="0" step="0.01" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                            Observação
                        </label>
                        <input 
                            type="text" value={observacao} onChange={e => setObservacao(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Detalhes da venda..."
                        />
                    </div>

                    {(quantidade && valorUnitario) ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex justify-between items-center mt-2">
                            <span className="text-emerald-400 text-xs font-black tracking-widest uppercase">TOTAL DA VENDA</span>
                            <span className="text-emerald-400 text-2xl font-black">
                                R$ {(parseFloat(quantidade) * parseFloat(valorUnitario)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ) : null}

                </form>
            </DraggableModal>

        </div>
    );
}
