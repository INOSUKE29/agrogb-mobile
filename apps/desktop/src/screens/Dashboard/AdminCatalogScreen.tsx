import React, { useState, useEffect } from 'react';
import { 
    CheckCircle,
    XCircle,
    RefreshCw,
    Search,
    Trash2,
    Globe,
    Clock,
    User,
    ShieldCheck
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function AdminCatalogScreen() {
    const [loading, setLoading] = useState(true);
    const [itemsGlobais, setItemsGlobais] = useState<any[]>([]);
    const [itensPendentes, setItensPendentes] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'PENDENTES' | 'GLOBAIS'>('PENDENTES');
    const [editingItem, setEditingItem] = useState<any | null>(null);

    const fetchDados = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('v2_produtos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                // Mock behavior
                const mockData = [
                    { id: '1', nome: 'UREIA AGRÍCOLA 46%', categoria: 'FERTILIZANTE', unidade_medida: 'KG', is_global: true, status_aprovacao: 'APROVADO' },
                    { id: '2', nome: 'GLIFOSATO 480', categoria: 'DEFENSIVO', unidade_medida: 'LT', is_global: true, status_aprovacao: 'APROVADO' },
                    { id: '3', nome: 'SEMENTE MILHO PIONEER 30F53', categoria: 'SEMENTE', unidade_medida: 'KG', observacao: 'Sugerido por João (Produtor)', is_global: false, status_aprovacao: 'PENDENTE_GLOBAL', user_id: 'user-xyz' },
                    { id: '4', nome: 'FUNGICIDA PRIORI XTRA', categoria: 'DEFENSIVO', unidade_medida: 'LT', observacao: 'Fungicida sistêmico', is_global: false, status_aprovacao: 'PENDENTE_GLOBAL', user_id: 'user-abc' },
                ];
                setItemsGlobais(mockData.filter(i => i.is_global));
                setItensPendentes(mockData.filter(i => i.status_aprovacao === 'PENDENTE_GLOBAL'));
            } else {
                const allData = data || [];
                setItemsGlobais(allData.filter(i => i.is_global));
                setItensPendentes(allData.filter(i => i.status_aprovacao === 'PENDENTE_GLOBAL'));
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



    const handleAprovarEditado = async () => {
        if (!editingItem) return;
        try {
            const { error } = await supabase.from('v2_produtos').update({
                nome: editingItem.nome.toUpperCase(),
                categoria: editingItem.categoria,
                unidade_medida: editingItem.unidade_medida,
                is_global: true,
                status_aprovacao: 'APROVADO'
            }).eq('id', editingItem.id);

            if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                setItensPendentes(itensPendentes.filter(i => i.id !== editingItem.id));
                setItemsGlobais([{...editingItem, is_global: true, status_aprovacao: 'APROVADO'}, ...itemsGlobais]);
            } else if (error) throw error;

            toast.success('Insumo aprovado e padronizado na Biblioteca Global!');
            setEditingItem(null);
            fetchDados();
        } catch (error) {
            toast.error('Erro ao aprovar insumo.');
        }
    };

    const handleRejeitar = async (id: string) => {
        if (!window.confirm("Deseja rejeitar este insumo? Ele continuará existindo apenas para o produtor que o cadastrou, mas não será global.")) return;

        try {
            const { error } = await supabase.from('v2_produtos').update({
                is_global: false,
                status_aprovacao: 'REJEITADO' // Ou 'LOCAL'
            }).eq('id', id);

            if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                setItensPendentes(itensPendentes.filter(i => i.id !== id));
            } else if (error) throw error;

            toast.success('Insumo rejeitado. Ele permanecerá apenas no catálogo local do produtor.');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao rejeitar insumo.');
        }
    };

    const handleDeleteGlobal = async (id: string) => {
        if (!window.confirm("ATENÇÃO: Apagar este item global removerá ele para todos os produtores do sistema. Tem certeza?")) return;

        try {
            const { error } = await supabase.from('v2_produtos').delete().eq('id', id);
            if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                setItemsGlobais(itemsGlobais.filter(i => i.id !== id));
            } else if (error) throw error;

            toast.success('Insumo global apagado do sistema.');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao apagar insumo global.');
        }
    };

    const filteredPendentes = itensPendentes.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredGlobais = itemsGlobais.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-indigo-500" />
                        Moderação do Catálogo Global
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Aprove insumos enviados por produtores para torná-los padrão no AgroGB.
                    </p>
                </div>
            </div>

            {/* TABELA E CONTEÚDO */}
            <div className="glass rounded-3xl border border-[var(--color-border)] p-6">
                
                {/* TABS */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 border-b border-white/5 pb-4">
                    <button 
                        onClick={() => setActiveTab('PENDENTES')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'PENDENTES' ? 'bg-yellow-500/20 text-yellow-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}
                    >
                        <Clock className="w-5 h-5" />
                        Fila de Moderação ({itensPendentes.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('GLOBAIS')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'GLOBAIS' ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}
                    >
                        <Globe className="w-5 h-5" />
                        Biblioteca Global Ativa ({itemsGlobais.length})
                    </button>

                    <div className="flex-1"></div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                        <input 
                            type="text" 
                            placeholder="Buscar insumo..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-2 pl-9 pr-4 text-white placeholder-[var(--color-muted)] focus:outline-none focus:border-indigo-500 transition-all text-sm"
                        />
                    </div>
                    <button onClick={fetchDados} className="p-2 bg-white/5 border border-[var(--color-border)] rounded-xl text-[var(--color-muted)] hover:text-white transition-all tooltip" title="Atualizar">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {/* CONTEÚDO */}
                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
                ) : activeTab === 'PENDENTES' ? (
                    filteredPendentes.length === 0 ? (
                        <div className="py-12 text-center">
                            <ShieldCheck className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                            <h3 className="text-xl font-bold text-white mb-2">Fila de moderação vazia</h3>
                            <p className="text-[var(--color-muted)]">Nenhum produtor sugeriu novos itens para a biblioteca global.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-white/5">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Item Sugerido</th>
                                        <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Categoria / Medida</th>
                                        <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Observações do Produtor</th>
                                        <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-right">Ação do Administrador</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPendentes.map(item => (
                                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <p className="font-bold text-white">{item.nome}</p>
                                                <div className="flex items-center gap-1 mt-1 text-[10px] text-[var(--color-muted)] font-bold">
                                                    <User className="w-3 h-3" /> Enviado por UserID: {item.user_id?.substring(0,8) || 'Desconhecido'}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-md text-white">{item.categoria}</span>
                                                    <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded-md text-[var(--color-muted)] border border-white/10">{item.unidade_medida}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-[var(--color-muted)] max-w-xs truncate">
                                                {item.observacao || '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => setEditingItem(item)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors font-bold text-xs border border-blue-500/30"
                                                    >
                                                        <Search className="w-4 h-4" /> Editar e Aprovar
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRejeitar(item.id)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors font-bold text-xs border border-red-500/20"
                                                    >
                                                        <XCircle className="w-4 h-4" /> Rejeitar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : (
                    filteredGlobais.length === 0 ? (
                        <div className="py-12 text-center">
                            <Globe className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                            <h3 className="text-xl font-bold text-white mb-2">Biblioteca Vazia</h3>
                            <p className="text-[var(--color-muted)]">A base de dados global do AgroGB está vazia.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-white/5">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Item Global</th>
                                        <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Categoria</th>
                                        <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGlobais.map(item => (
                                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-blue-500" />
                                                    <p className="font-bold text-white">{item.nome}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold px-2 py-1 bg-white/10 rounded-md text-white">{item.categoria}</span>
                                                    <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded-md text-[var(--color-muted)] border border-white/10">{item.unidade_medida}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDeleteGlobal(item.id)}
                                                    className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors tooltip"
                                                    title="Apagar do Sistema Global"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </div>

            {/* MODAL EDIÇÃO */}
            {editingItem && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={(e) => { if(e.target === e.currentTarget) setEditingItem(null); }}
                >
                    <div className="glass w-full max-w-lg rounded-3xl p-8 border border-[var(--color-border)] animate-fade-in-up">
                        <h2 className="text-2xl font-black text-white mb-6">Padronizar Insumo</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Nome do Produto</label>
                                <input 
                                    type="text"
                                    value={editingItem.nome}
                                    onChange={(e) => setEditingItem({...editingItem, nome: e.target.value})}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white uppercase focus:outline-none focus:border-indigo-500 transition-all font-bold"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Categoria</label>
                                    <select 
                                        value={editingItem.categoria}
                                        onChange={(e) => setEditingItem({...editingItem, categoria: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                                    >
                                        <option value="DEFENSIVO">Defensivo</option>
                                        <option value="FERTILIZANTE">Fertilizante</option>
                                        <option value="SEMENTE">Semente</option>
                                        <option value="ADJUVANTE">Adjuvante</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1 block">Und. Medida</label>
                                    <select 
                                        value={editingItem.unidade_medida}
                                        onChange={(e) => setEditingItem({...editingItem, unidade_medida: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-bold"
                                    >
                                        <option value="LT">Litro (LT)</option>
                                        <option value="KG">Quilo (KG)</option>
                                        <option value="SC">Saco (SC)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-8 flex gap-3 justify-end pt-4 border-t border-[var(--color-border)]">
                                <button 
                                    onClick={() => setEditingItem(null)}
                                    className="px-6 py-3 rounded-xl border border-[var(--color-border)] text-white hover:bg-white/5 font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleAprovarEditado}
                                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    Salvar e Aprovar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
