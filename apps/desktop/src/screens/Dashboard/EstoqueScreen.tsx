import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Package, Search, Plus, ArrowDownCircle, ArrowUpCircle, Filter, Activity, Box } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EstoqueScreen() {
    const [estoque, setEstoque] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');

    // Formulário do Modal
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [origem, setOrigem] = useState('COMPRA'); // ou VENDA, ADUBAÇÃO, etc

    useEffect(() => {
        fetchEstoque();
    }, []);

    const fetchEstoque = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('estoque')
                .select('*')
                .order('last_updated', { ascending: false });

            if (error) throw error;
            setEstoque(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar estoque:', error);
            toast.error('Não foi possível carregar o estoque.');
        } finally {
            setLoading(false);
        }
    };

    const handleTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        const qtdNum = parseFloat(quantidade);
        if (!produto || isNaN(qtdNum) || qtdNum <= 0) {
            toast.error('Preencha os campos corretamente.');
            return;
        }

        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData.user?.id;

            // 1. Procurar se já existe no estoque (por nome para simplificar a busca legado)
            let currentItem = estoque.find(item => item.produto?.toLowerCase() === produto.toLowerCase());
            let itemUuid = currentItem?.uuid;
            let novaQuantidade = modalType === 'ENTRADA' ? qtdNum : -qtdNum;

            if (currentItem) {
                novaQuantidade = currentItem.quantidade + novaQuantidade;
                if (novaQuantidade < 0) {
                    toast.error('Saldo em estoque insuficiente para esta saída!');
                    return;
                }
                
                // Atualiza o estoque existente
                const { error: updError } = await supabase
                    .from('estoque')
                    .update({ quantidade: novaQuantidade, last_updated: new Date() })
                    .eq('uuid', itemUuid);
                if (updError) throw updError;

            } else {
                if (modalType === 'SAIDA') {
                    toast.error('Produto não encontrado no estoque para realizar a saída!');
                    return;
                }
                // Cria um novo registro de estoque se não existir
                const { data: newStock, error: insError } = await supabase
                    .from('estoque')
                    .insert([{ produto: produto, quantidade: novaQuantidade, user_id: userId }])
                    .select()
                    .single();
                if (insError) throw insError;
                itemUuid = newStock.uuid;
            }

            // 2. Registrar na tabela de Movimentações
            const { error: movError } = await supabase
                .from('v2_movimentacoes_estoque')
                .insert([{
                    user_id: userId,
                    tipo: modalType,
                    quantidade: qtdNum,
                    origem: origem,
                    data: new Date()
                }]);
            
            if (movError) throw movError;

            toast.success(`Movimentação de ${modalType} registrada com sucesso!`);
            setShowModal(false);
            setProduto('');
            setQuantidade('');
            fetchEstoque();

        } catch (error: any) {
            console.error('Erro na transação:', error);
            toast.error(error.message || 'Falha ao processar movimentação.');
        }
    };

    const filteredEstoque = estoque.filter(item => 
        item.produto?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Package className="w-8 h-8 text-[var(--color-primary)]" />
                        Estoque e Insumos
                    </h1>
                    <p className="text-[var(--color-muted)] mt-1">Gestão de produtos, sementes e movimentações</p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => { setModalType('SAIDA'); setShowModal(true); }}
                        className="glass-card px-4 py-2 flex items-center gap-2 text-red-400 hover:text-red-300 font-semibold"
                    >
                        <ArrowUpCircle className="w-5 h-5" />
                        Nova Saída
                    </button>
                    <button 
                        onClick={() => { setModalType('ENTRADA'); setShowModal(true); }}
                        className="glass-card px-4 py-2 flex items-center gap-2 text-green-400 hover:text-green-300 font-semibold"
                    >
                        <ArrowDownCircle className="w-5 h-5" />
                        Nova Entrada
                    </button>
                </div>
            </div>

            {/* BARRA DE PESQUISA E FILTROS */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome do produto..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                    />
                </div>
                <button className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-[var(--color-muted)] hover:text-white transition-colors">
                    <Filter className="w-4 h-4" />
                    Filtros Avançados
                </button>
            </div>

            {/* GRID DENSO DE ESTOQUE */}
            {loading ? (
                <div className="glass-card p-12 text-center text-[var(--color-muted)] animate-pulse">Carregando inventário...</div>
            ) : filteredEstoque.length === 0 ? (
                <div className="glass-card p-12 text-center text-[var(--color-muted)] flex flex-col items-center">
                    <Box className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium text-white">Nenhum produto encontrado</p>
                    <p className="mt-1">Cadastre uma nova entrada para começar a gerenciar seu estoque.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredEstoque.map(item => (
                        <div key={item.uuid} className="glass-card p-6 flex flex-col group relative overflow-hidden">
                            <div className="absolute -right-6 -top-6 w-24 h-24 bg-[var(--color-primary)]/10 rounded-full blur-2xl group-hover:bg-[var(--color-primary)]/20 transition-all"></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-white/5 rounded-xl text-[var(--color-primary)] border border-white/5">
                                    <Box className="w-6 h-6" />
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.quantidade > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    {item.quantidade > 0 ? 'EM ESTOQUE' : 'FALTA'}
                                </span>
                            </div>
                            
                            <h3 className="text-xl font-bold text-white mb-1 truncate">{item.produto || 'Produto Sem Nome'}</h3>
                            <p className="text-sm text-[var(--color-muted)] mb-6">Última atualização: {new Date(item.last_updated).toLocaleDateString()}</p>
                            
                            <div className="mt-auto flex items-end justify-between border-t border-[var(--color-border)] pt-4">
                                <div>
                                    <p className="text-xs text-[var(--color-muted)] font-medium uppercase tracking-wider mb-1">Saldo Atual</p>
                                    <p className="text-3xl font-black text-white">{item.quantidade.toLocaleString('pt-BR')}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DE ENTRADA/SAÍDA */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowModal(false)}>
                    <div 
                        className="glass border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`h-1 w-full ${modalType === 'ENTRADA' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="p-6">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-6">
                                {modalType === 'ENTRADA' ? <ArrowDownCircle className="text-green-500" /> : <ArrowUpCircle className="text-red-500" />}
                                {modalType === 'ENTRADA' ? 'Nova Entrada' : 'Nova Saída'}
                            </h2>

                            <form onSubmit={handleTransaction} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Nome do Produto</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={produto}
                                        onChange={(e) => setProduto(e.target.value)}
                                        className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                        placeholder="Ex: Ureia, Semente de Soja..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Quantidade</label>
                                        <input 
                                            type="number" 
                                            required
                                            step="0.01"
                                            value={quantidade}
                                            onChange={(e) => setQuantidade(e.target.value)}
                                            className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Origem/Destino</label>
                                        <select 
                                            value={origem}
                                            onChange={(e) => setOrigem(e.target.value)}
                                            className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none appearance-none"
                                        >
                                            {modalType === 'ENTRADA' ? (
                                                <>
                                                    <option value="COMPRA">Compra</option>
                                                    <option value="DEVOLUÇÃO">Devolução</option>
                                                    <option value="AJUSTE">Ajuste de Estoque</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="APLICAÇÃO">Aplicação no Campo</option>
                                                    <option value="VENDA">Venda</option>
                                                    <option value="PERDA">Perda/Descarte</option>
                                                    <option value="AJUSTE">Ajuste de Estoque</option>
                                                </>
                                            )}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 text-[var(--color-muted)] hover:text-white font-semibold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className={`flex-1 py-3 font-bold rounded-xl text-white transition-transform active:scale-95 ${modalType === 'ENTRADA' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
