import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Package, Search, ArrowDownCircle, ArrowUpCircle, Filter, Activity, Box, Tag, Layers, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import DraggableModal from '../../components/common/DraggableModal';
import { useAuth } from '../../contexts/AuthContext';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function EstoqueScreen() {
    const { clientOverrideId } = useAuth();
    const [estoque, setEstoque] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');

    // Formulário do Modal
    const [produtos, setProdutos] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [produtoId, setProdutoId] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [origem, setOrigem] = useState('COMPRA'); // ou VENDA, ADUBAÇÃO, etc

    const fetchEstoque = async () => {
        try {
            setLoading(true);
            setError(false);
            // v2_estoque_atual query without explicit join to avoid PGRST200
            const { data, error } = await supabase
                .from('v2_estoque_atual')
                .select('*')
                .order('last_updated', { ascending: false });

            // Fetch produtos separately
            let produtosData: Record<string, string | number | boolean | null>[] = [];
            if (!error) {
                const prodResponse = await supabase.from('v2_produtos').select('*').order('nome');
                produtosData = prodResponse.data || [];
                setProdutos(produtosData);
            }

            if (error) {
                // If it fails, fallback to old estoque table just in case
                const fallback = await supabase.from('estoque').select('*').order('created_at', { ascending: false });
                if (fallback.error) {
                    throw error;
                } else {
                    setEstoque(fallback.data || []);
                    return;
                }
            }
            
            // Normalize data to expected format
            const normalizedData = (data || []).map(item => {
                const prod = produtosData.find(p => p.id === item.produto_id) || {};
                return {
                    uuid: item.id || item.uuid,
                    produto: prod.nome || item.produto || 'Produto Desconhecido',
                    categoria: prod.categoria || 'Insumo',
                    unidade: prod.unidade_medida || 'UN',
                    quantidade: item.quantidade,
                    last_updated: item.last_updated || item.created_at
                };
            });

            setEstoque(normalizedData);
        } catch (error: unknown) {
            console.error('Erro ao buscar estoque:', error);
            setError(true);
            toast.error('Não foi possível carregar o estoque. Verifique sua conexão.', { id: 'fetch-estoque' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEstoque();
    }, []);

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        const qtdNum = parseFloat(quantidade);
        if (!produtoId || isNaN(qtdNum) || qtdNum <= 0) {
            toast.error('Preencha os campos corretamente.', { id: 'form-error' });
            return;
        }

        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData.user?.id;

            // Find if stock already exists for this produto_id
            // Note: The normalized estoque has uuid as the v2_estoque_atual.id
            // We need to find the raw v2_estoque_atual record for this produto_id
            const { data: existingStock, error: stockCheckErr } = await supabase
                .from('v2_estoque_atual')
                .select('*')
                .eq('produto_id', produtoId)
                .single();

            let itemUuid = existingStock?.id;
            let novaQuantidade = modalType === 'ENTRADA' ? qtdNum : -qtdNum;

            if (existingStock) {
                novaQuantidade = Number(existingStock.quantidade) + novaQuantidade;
                if (novaQuantidade < 0) {
                    toast.error('Saldo em estoque insuficiente para esta saída!', { id: 'stock-error' });
                    return;
                }
                
                // Try v2 update
                const { error: updError } = await supabase
                    .from('v2_estoque_atual')
                    .update({ quantidade: novaQuantidade, last_updated: new Date().toISOString() })
                    .eq('id', itemUuid);
                
                if (updError) throw updError;

            } else {
                if (modalType === 'SAIDA') {
                    toast.error('Produto não encontrado no estoque para realizar a saída!', { id: 'stock-error' });
                    return;
                }
                
                // Insert into v2_estoque_atual
                const { data: newStock, error: insError } = await supabase
                    .from('v2_estoque_atual')
                    .insert([{ 
                        produto_id: produtoId, 
                        quantidade: novaQuantidade, 
                        user_id: userId,
                        last_updated: new Date().toISOString()
                    }])
                    .select()
                    .single();
                
                if (insError) throw insError;
                itemUuid = newStock?.id;
            }

            // Registrar na tabela de Movimentações
            await supabase
                .from('v2_movimentacoes_estoque')
                .insert([{
                    user_id: userId,
                    tipo: modalType,
                    quantidade: qtdNum,
                    origem: origem,
                    data: new Date().toISOString(),
                    produto_uuid: itemUuid
                }]);

            toast.success(`Movimentação de ${modalType} registrada com sucesso!`, { id: 'success' });
            setShowModal(false);
            setProdutoId('');
            setQuantidade('');
            fetchEstoque();

        } catch (error: unknown) {
            const err = error as Error | { message: string };
            console.error('Erro na transação:', error);
            toast.error(err.message || 'Falha ao processar movimentação.', { id: 'error' });
        }
    };

    const filteredEstoque = estoque.filter(item => 
        item.produto?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalItens = estoque.length;
    const valorEstimado = estoque.reduce((acc, item) => acc + (Number(item.quantidade) * (Number(item.preco_venda) || 0)), 0);

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* HERO CABEÇALHO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <Box className="w-4 h-4" /> Gestão de Ativos
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Estoque e Insumos
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Controle de produtos, fertilizantes, defensivos e movimentações com rastreabilidade completa.
                        </p>
                    </div>
                    {!clientOverrideId && (
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={() => { setModalType('SAIDA'); setShowModal(true); }}
                                className="px-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold transition-all"
                            >
                                <ArrowUpCircle className="w-5 h-5" />
                                Nova Saída
                            </button>
                            <button 
                                onClick={() => { setModalType('ENTRADA'); setShowModal(true); }}
                                className="px-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold shadow-lg shadow-green-500/20 transition-all"
                            >
                                <ArrowDownCircle className="w-5 h-5" />
                                Nova Entrada
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center justify-between group">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Total de Itens</p>
                        <h3 className="text-3xl font-black text-white">{totalItens}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Layers className="w-7 h-7 text-blue-500" />
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center justify-between group">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Status do Estoque</p>
                        <h3 className="text-xl font-black text-green-400 flex items-center gap-2">
                            <Activity className="w-5 h-5" /> Saudável
                        </h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <RefreshCw className="w-7 h-7 text-green-500" />
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center justify-between group">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Valor Estimado</p>
                        <h3 className="text-3xl font-black text-white">R$ {valorEstimado.toLocaleString('pt-BR')}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Tag className="w-7 h-7 text-yellow-500" />
                    </div>
                </div>
            </div>

            {/* BARRA DE PESQUISA E FILTROS */}
            <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between border border-[var(--color-border)]">
                <div className="relative w-full md:w-96">
                    <Search className="w-5 h-5 text-[var(--color-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Buscar produto por nome..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                    />
                </div>
                <button className="w-full md:w-auto px-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold transition-all">
                    <Filter className="w-4 h-4" />
                    Filtros Avançados
                </button>
            </div>

            {/* GRID DENSO DE ESTOQUE */}
            {loading ? (
                <div className="glass-card p-16 flex flex-col items-center justify-center text-[var(--color-muted)]">
                    <div className="w-10 h-10 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
                    <p className="font-medium text-lg">Sincronizando inventário...</p>
                </div>
            ) : error ? (
                <div className="glass-card p-16 text-center text-[var(--color-muted)] flex flex-col items-center">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Erro ao carregar estoque</h3>
                    <p className="text-lg max-w-md mx-auto mb-6">Não foi possível conectar com o banco de dados. Verifique sua conexão e tente novamente.</p>
                    <button onClick={fetchEstoque} className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold">Tentar Novamente</button>
                </div>
            ) : filteredEstoque.length === 0 ? (
                <div className="glass-card p-16 text-center text-[var(--color-muted)] flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Box className="w-10 h-10 opacity-50" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Nenhum produto encontrado</h3>
                    <p className="text-lg max-w-md mx-auto">Cadastre uma nova entrada para começar a gerenciar seu estoque e acompanhar seu inventário.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEstoque.map(item => (
                        <div key={item.uuid} className="glass-card p-6 flex flex-col group relative overflow-hidden hover:border-[var(--color-primary)]/50 transition-colors">
                            <div className="absolute -right-12 -top-12 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-3xl group-hover:bg-[var(--color-primary)]/20 transition-all"></div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div className="p-3 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-primary)]/5 rounded-2xl text-[var(--color-primary)] border border-[var(--color-primary)]/10 shadow-inner">
                                    <Package className="w-6 h-6" />
                                </div>
                                <span className={`text-xs font-black tracking-wider px-3 py-1 rounded-full ${Number(item.quantidade) > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                    {Number(item.quantidade) > 0 ? 'EM ESTOQUE' : 'FALTA'}
                                </span>
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black text-white mb-1 truncate" title={String(item.produto)}>{item.produto}</h3>
                                <p className="text-sm font-medium text-[var(--color-primary)] mb-6">{item.categoria}</p>
                            </div>
                            
                            <div className="mt-auto flex items-end justify-between border-t border-[var(--color-border)] pt-5 relative z-10">
                                <div>
                                    <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider mb-1">Saldo Atual</p>
                                    <div className="flex items-baseline gap-1">
                                        <p className="text-4xl font-black text-white">{Number(item.quantidade).toLocaleString('pt-BR')}</p>
                                        <span className="text-sm font-bold text-[var(--color-muted)]">{item.unidade}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider mb-1">Atualizado</p>
                                    <p className="text-sm font-medium text-white">{new Date(item.last_updated as string).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DE ENTRADA/SAÍDA */}
            <DraggableModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        {modalType === 'ENTRADA' ? <ArrowDownCircle className="text-green-500 w-8 h-8" /> : <ArrowUpCircle className="text-red-500 w-8 h-8" />}
                        {modalType === 'ENTRADA' ? 'Nova Entrada de Produto' : 'Nova Saída de Produto'}
                    </h2>
                }
            >
                <div className={`h-2 w-full absolute top-0 left-0 right-0 ${modalType === 'ENTRADA' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div className="p-6 overflow-y-auto mt-2 custom-scrollbar">
                            <form id="estoqueForm" onSubmit={handleTransaction} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Produto</label>
                                    <div className="relative">
                                        <SearchableSelect 
                                            value={produtoId}
                                            onChange={(val) => setProdutoId(val)}
                                            options={produtos.map(p => ({
                                                label: `${p.nome} (${p.unidade_medida || 'UN'})`,
                                                value: String(p.id || p.uuid)
                                            }))}
                                            allowCustom={false}
                                            placeholder="Selecione do Catálogo..."
                                        />
                                        <div className="text-right mt-1">
                                            <a href="#/dashboard/cliente/cadastro" className="text-xs text-[var(--color-primary)] hover:underline opacity-80">+ Novo Produto no Catálogo</a>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Quantidade</label>
                                        <input 
                                            type="number" 
                                            required
                                            step="0.01"
                                            value={quantidade}
                                            onChange={(e) => setQuantidade(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Origem/Destino</label>
                                        <SearchableSelect 
                                            value={origem}
                                            onChange={(val) => setOrigem(val)}
                                            options={modalType === 'ENTRADA' ? [
                                                { label: 'Compra Direta', value: 'COMPRA' },
                                                { label: 'Devolução do Campo', value: 'DEVOLUÇÃO' },
                                                { label: 'Ajuste de Inventário', value: 'AJUSTE' }
                                            ] : [
                                                { label: 'Aplicação no Talhão', value: 'APLICAÇÃO' },
                                                { label: 'Venda', value: 'VENDA' },
                                                { label: 'Perda/Descarte', value: 'PERDA' },
                                                { label: 'Ajuste de Inventário', value: 'AJUSTE' }
                                            ]}
                                            allowCustom={false}
                                            placeholder="Selecione a origem/destino"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] bg-white/[0.02] flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-[var(--color-muted)] hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                form="estoqueForm"
                                className={`flex-1 py-3.5 font-black rounded-xl text-white shadow-lg transition-transform active:scale-95 ${modalType === 'ENTRADA' ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20' : 'bg-red-600 hover:bg-red-500 shadow-red-500/20'}`}
                            >
                                Confirmar {modalType === 'ENTRADA' ? 'Entrada' : 'Saída'}
                            </button>
                        </div>
            </DraggableModal>
        </div>
    );
}
