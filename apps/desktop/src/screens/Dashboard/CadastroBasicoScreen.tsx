import React, { useState, useEffect } from 'react';
import { 
    Database,
    Plus,
    Trash2,
    RefreshCw,
    Search,
    Edit2,
    Tag,
    Archive,
    Scale,
    Droplets,
    Leaf,
    Globe,
    Lock,
    Clock
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function CadastroBasicoScreen() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Form
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('INSUMO');
    const [unidade, setUnidade] = useState('KG');
    const [observacao, setObservacao] = useState('');
    const [sugerirGlobal, setSugerirGlobal] = useState(false);

    const fetchDados = async () => {
        setLoading(true);
        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData.user?.id || 'mock-user-id';

            const { data, error } = await supabase
                .from('v2_produtos')
                .select('*')
                .order('categoria', { ascending: true })
                .order('nome', { ascending: true });

            if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                // Mock behavior se a tabela não existir ainda
                setItems([
                    { id: '1', nome: 'UREIA AGRÍCOLA 46%', categoria: 'FERTILIZANTE', unidade_medida: 'KG', observacao: 'Adubação padrão AgroGB', is_global: true, status_aprovacao: 'APROVADO' },
                    { id: '2', nome: 'GLIFOSATO 480', categoria: 'DEFENSIVO', unidade_medida: 'LT', observacao: 'Herbicida', is_global: true, status_aprovacao: 'APROVADO' },
                    { id: '5', nome: 'ADUBO NPK 04-14-08', categoria: 'FERTILIZANTE', unidade_medida: 'KG', observacao: 'Adubo de Plantio Global', is_global: true, status_aprovacao: 'APROVADO' },
                    { id: '6', nome: 'ADUBO FOLIAR (ZINCO)', categoria: 'FERTILIZANTE', unidade_medida: 'LT', observacao: 'Micronutrientes', is_global: true, status_aprovacao: 'APROVADO' },
                    { id: '3', nome: 'SEMENTE MILHO (TESTE)', categoria: 'SEMENTE', unidade_medida: 'KG', observacao: 'Meu milho', is_global: false, status_aprovacao: 'PENDENTE_GLOBAL', user_id: userId },
                    { id: '4', nome: 'SOJA EM GRÃO (SAFRA)', categoria: 'PRODUTO_FINAL', unidade_medida: 'SC', observacao: 'Produto para venda', is_global: false, status_aprovacao: 'LOCAL', user_id: userId },
                ]);
            } else {
                setItems(data || []);
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

        if (!nome) {
            return toast.error("Preencha o nome do item.");
        }

        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id || 'mock-user-id';

        const payload = {
            nome: nome.toUpperCase(),
            categoria: categoria,
            unidade_medida: unidade,
            observacao: observacao,
            user_id: userId,
            is_global: false, // Só o ADM aprova para virar true
            status_aprovacao: sugerirGlobal ? 'PENDENTE_GLOBAL' : 'LOCAL'
        };

        try {
            if (editingId) {
                const { error } = await supabase.from('v2_produtos').update(payload).eq('id', editingId);
                if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                    setItems(items.map(i => i.id === editingId ? { ...i, ...payload } : i));
                } else if (error) throw error;
                toast.success('Item atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('v2_produtos').insert([payload]);
                if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                    setItems([...items, { ...payload, id: crypto.randomUUID() }]);
                } else if (error) throw error;
                toast.success(sugerirGlobal ? 'Item salvo e enviado para moderação!' : 'Item local cadastrado com sucesso!');
            }
            
            closeModal();
            fetchDados();
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message);
        }
    };

    const handleDelete = async (item: any) => {
        if (item.is_global) return toast.error("Você não pode apagar um item da Biblioteca Global.");
        if (!window.confirm("Deseja apagar este cadastro?")) return;

        try {
            const { error } = await supabase.from('v2_produtos').delete().eq('id', item.id);
            if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                setItems(items.filter(c => c.id !== item.id));
                toast.success('Apagado (Modo Local)');
                return;
            } else if (error) throw error;

            toast.success('Cadastro apagado!');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao excluir item.');
        }
    };

    const openEditModal = (item: any) => {
        if (item.is_global) return toast.error("Itens Globais não podem ser editados, apenas pelo ADM.");
        setEditingId(item.id);
        setNome(item.nome);
        setCategoria(item.categoria || 'INSUMO');
        setUnidade(item.unidade_medida || 'KG');
        setObservacao(item.observacao || '');
        setSugerirGlobal(item.status_aprovacao === 'PENDENTE_GLOBAL');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingId(null);
        setNome('');
        setCategoria('INSUMO');
        setUnidade('KG');
        setObservacao('');
        setSugerirGlobal(false);
    };

    const filteredItems = items.filter(item => 
        item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getIconForCategory = (cat: string) => {
        switch (cat) {
            case 'FERTILIZANTE': return <Leaf className="w-5 h-5" />;
            case 'DEFENSIVO': return <Droplets className="w-5 h-5" />;
            case 'SEMENTE': return <Leaf className="w-5 h-5" />;
            case 'PRODUTO_FINAL': return <Archive className="w-5 h-5" />;
            default: return <Tag className="w-5 h-5" />;
        }
    };

    const getColorForCategory = (cat: string) => {
        switch (cat) {
            case 'FERTILIZANTE': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'DEFENSIVO': return 'text-red-400 bg-red-500/10 border-red-500/20';
            case 'SEMENTE': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'PRODUTO_FINAL': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Database className="w-8 h-8 text-indigo-500" />
                        Catálogo Geral
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1 flex items-center gap-2">
                        <span>Gerencie seus insumos e navegue pela</span>
                        <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md text-xs font-bold border border-blue-500/20">
                            <Globe className="w-3 h-3" /> Biblioteca Global
                        </span>
                    </p>
                </div>
                
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Novo Cadastro Local
                </button>
            </div>

            {/* BARRA DE PESQUISA E LISTAGEM */}
            <div className="glass rounded-3xl border border-[var(--color-border)] p-6">
                
                <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome ou categoria..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-3 pl-10 pr-4 text-white placeholder-[var(--color-muted)] focus:outline-none focus:border-indigo-500 transition-all text-sm"
                        />
                    </div>
                    <button onClick={fetchDados} className="p-3 bg-white/5 border border-[var(--color-border)] rounded-xl text-[var(--color-muted)] hover:text-white transition-all tooltip" title="Atualizar">
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
                ) : filteredItems.length === 0 ? (
                    <div className="py-12 text-center">
                        <Database className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum item encontrado</h3>
                        <p className="text-[var(--color-muted)]">Nenhum registro corresponde à sua busca ou o catálogo está vazio.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/5">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/5">
                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Origem</th>
                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Nome do Item</th>
                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Categoria</th>
                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Medida</th>
                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Observações</th>
                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => {
                                    const isGlobal = item.is_global;
                                    const isPendente = item.status_aprovacao === 'PENDENTE_GLOBAL';

                                    return (
                                        <tr key={item.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isGlobal ? 'bg-blue-500/[0.02]' : ''}`}>
                                            <td className="p-4">
                                                {isGlobal ? (
                                                    <div className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md text-[10px] font-black tracking-widest border border-blue-500/20 tooltip" title="Este item pertence ao Padrão Global do AgroGB. É válido para todos.">
                                                        <Globe className="w-3 h-3" /> GLOBAL
                                                    </div>
                                                ) : isPendente ? (
                                                    <div className="inline-flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-md text-[10px] font-black tracking-widest border border-yellow-500/20 tooltip" title="Aguardando aprovação do ADM para virar Global.">
                                                        <Clock className="w-3 h-3" /> PENDENTE
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-1 text-[var(--color-muted)] bg-white/5 px-2 py-1 rounded-md text-[10px] font-black tracking-widest border border-white/10 tooltip" title="Apenas você pode ver este item.">
                                                        <Archive className="w-3 h-3" /> LOCAL
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold text-white">{item.nome}</p>
                                            </td>
                                            <td className="p-4">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getColorForCategory(item.categoria)}`}>
                                                    {getIconForCategory(item.categoria)}
                                                    <span className="text-xs font-bold tracking-wider">{item.categoria}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[var(--color-muted)] text-xs font-bold">
                                                    <Scale className="w-3 h-3" /> {item.unidade_medida}
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-[var(--color-muted)] max-w-xs truncate">
                                                {item.observacao || '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                {isGlobal ? (
                                                    <div className="flex items-center justify-end">
                                                        <button disabled className="p-2 text-white/20 rounded-lg cursor-not-allowed tooltip" title="Apenas o ADM pode editar a Biblioteca Global">
                                                            <Lock className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => openEditModal(item)}
                                                            className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors tooltip"
                                                            title="Editar Cadastro"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item)}
                                                            className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors tooltip"
                                                            title="Apagar Cadastro"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL REGISTRO */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
                    <div className="glass border border-indigo-500/30 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col">
                        
                        <div className="p-6 border-b border-[var(--color-border)] bg-indigo-500/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-white">{editingId ? 'Editar Item' : 'Novo Item Local'}</h2>
                                <p className="text-indigo-400 text-xs font-bold tracking-widest mt-1">CATÁLOGO</p>
                            </div>
                            <button onClick={closeModal} className="text-[var(--color-muted)] hover:text-white w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">&times;</button>
                        </div>

                        <div className="p-6 space-y-6">
                            <form id="cadForm" onSubmit={handleSalvar} className="space-y-6">
                                
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        Nome do Item *
                                    </label>
                                    <input 
                                        required type="text" value={nome} onChange={e => setNome(e.target.value.toUpperCase())}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Ex: UREIA AGRÍCOLA 46%"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Categoria *
                                        </label>
                                        <select 
                                            required value={categoria} onChange={e => setCategoria(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                        >
                                            <option value="INSUMO">Insumo Geral</option>
                                            <option value="FERTILIZANTE">Fertilizante / Adubo</option>
                                            <option value="DEFENSIVO">Defensivo Agrícola</option>
                                            <option value="SEMENTE">Semente / Muda</option>
                                            <option value="PRODUTO_FINAL">Produto Final (Venda)</option>
                                            <option value="EMBALAGEM">Embalagem</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Unid. de Medida *
                                        </label>
                                        <select 
                                            required value={unidade} onChange={e => setUnidade(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                        >
                                            <option value="KG">KG (Quilogramas)</option>
                                            <option value="LT">LT (Litros)</option>
                                            <option value="SC">SC (Sacas)</option>
                                            <option value="CX">CX (Caixas)</option>
                                            <option value="TON">TON (Toneladas)</option>
                                            <option value="UN">UN (Unidade)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        Observações Técnicas
                                    </label>
                                    <textarea 
                                        rows={3} value={observacao} onChange={e => setObservacao(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 outline-none resize-none"
                                        placeholder="Dosagem recomendada, princípio ativo, etc."
                                    />
                                </div>

                                {/* CHEKBOX BIBLIOTECA GLOBAL */}
                                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={sugerirGlobal}
                                            onChange={(e) => setSugerirGlobal(e.target.checked)}
                                            className="mt-1 w-5 h-5 rounded border-blue-500/50 bg-[var(--color-background)] text-blue-500 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="block font-bold text-white">Sugerir para a Biblioteca Global</span>
                                            <span className="block text-xs text-[var(--color-muted)] mt-1 leading-relaxed">
                                                Ao marcar esta opção, o ADM do AgroGB receberá uma notificação para validar e adicionar este insumo ao Catálogo Padrão. Assim, todos os outros usuários também poderão utilizá-lo.
                                            </span>
                                        </div>
                                    </label>
                                </div>

                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] bg-white/[0.02] flex gap-3">
                            <button onClick={closeModal} className="flex-1 py-4 text-[var(--color-muted)] font-bold hover:bg-white/5 rounded-xl transition-all">Cancelar</button>
                            <button 
                                type="submit" form="cadForm"
                                className="flex-1 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 rounded-xl text-white font-black shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                Salvar Cadastro
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
