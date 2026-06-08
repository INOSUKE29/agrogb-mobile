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
import DraggableModal from '../../components/common/DraggableModal';

export default function CadastroBasicoScreen() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Form
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('INSUMO');
    const [unidade, setUnidade] = useState('KG');
    const [observacao, setObservacao] = useState('');
    const [fabricante, setFabricante] = useState('');
    const [modoAplicacao, setModoAplicacao] = useState('');
    const [composicaoNpk, setComposicaoNpk] = useState('');
    const [principioAtivo, setPrincipioAtivo] = useState('');
    const [doseRecomendada, setDoseRecomendada] = useState('');
    const [sugerirGlobal, setSugerirGlobal] = useState(false);
    const [viewingItem, setViewingItem] = useState<any>(null);

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
            fabricante: fabricante.toUpperCase(),
            modo_aplicacao: modoAplicacao,
            composicao_npk: composicaoNpk,
            principio_ativo: principioAtivo.toUpperCase(),
            dose_recomendada: doseRecomendada,
            observacao: observacao,
            user_id: userId,
            is_global: false,
            status_aprovacao: sugerirGlobal ? 'PENDENTE_GLOBAL' : 'LOCAL'
        };

        try {
            let produtoId = editingId;
            if (editingId) {
                const { error } = await supabase.from('v2_produtos').update(payload).eq('id', editingId);
                if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                    setItems(items.map(i => i.id === editingId ? { ...i, ...payload } : i));
                } else if (error) throw error;
                toast.success('Item atualizado com sucesso!');
            } else {
                const { data, error } = await supabase.from('v2_produtos').insert([payload]).select();
                if (error && (error.code === '42P01' || error.message?.includes('Could not find the table'))) {
                    produtoId = crypto.randomUUID();
                    setItems([...items, { ...payload, id: produtoId }]);
                } else if (error) {
                    throw error;
                } else if (data && data.length > 0) {
                    produtoId = data[0].id;
                }
                toast.success(sugerirGlobal ? 'Item salvo e enviado para moderação!' : 'Item local cadastrado com sucesso!');
            }
            
            if (sugerirGlobal && produtoId && !editingId) {
                // Ao sugerir, envia para a fila de aprovação
                const { error: subErr } = await supabase.from('global_library_submissions').insert([{
                    user_id: userId,
                    produto_id: produtoId,
                    nome: payload.nome,
                    categoria: payload.categoria,
                    unidade_medida: payload.unidade_medida,
                    fabricante: payload.fabricante,
                    modo_aplicacao: payload.modo_aplicacao,
                    composicao_npk: payload.composicao_npk,
                    principio_ativo: payload.principio_ativo,
                    dose_recomendada: payload.dose_recomendada,
                    observacao: payload.observacao,
                    status: 'PENDENTE_GLOBAL'
                }]);
                if (subErr) {
                    console.error('Erro na submissão:', subErr);
                    toast.error('O item foi salvo localmente, mas houve um erro ao enviar para aprovação: ' + subErr.message);
                }
            }
            
            closeModal();
            fetchDados();
        } catch (error: unknown) {
            const err = error as Error | { message: string };
            toast.error('Erro ao salvar: ' + err.message);
        }
    };

    const handleDelete = async (item: Record<string, string | number | boolean | null>) => {
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

    const openEditModal = (item: Record<string, string | number | boolean | null>) => {
        if (item.is_global) return toast.error("Itens Globais não podem ser editados, apenas pelo ADM.");
        setEditingId(item.id);
        setNome(item.nome);
        setCategoria(item.categoria || 'INSUMO');
        setUnidade(item.unidade_medida || 'KG');
        setFabricante(item.fabricante || '');
        setModoAplicacao(item.modo_aplicacao || '');
        setComposicaoNpk(item.composicao_npk || '');
        setPrincipioAtivo(item.principio_ativo || '');
        setDoseRecomendada(item.dose_recomendada || '');
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
        setFabricante('');
        setModoAplicacao('');
        setComposicaoNpk('');
        setPrincipioAtivo('');
        setDoseRecomendada('');
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
                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-center">Cat.</th>
                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Medida</th>
                                    <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => {
                                    const isGlobal = item.is_global;
                                    const isPendente = item.status_aprovacao === 'PENDENTE_GLOBAL';

                                    return (
                                        <tr key={item.id} onDoubleClick={() => setViewingItem(item)} title="Duplo clique para ver detalhes" className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${isGlobal ? 'bg-blue-500/[0.02]' : ''}`}>
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
                                            <td className="p-4 min-w-[250px] max-w-[350px]">
                                                <p 
                                                    className="font-bold text-white truncate cursor-help"
                                                    title={`RESUMO DO PRODUTO\n------------------\nNome: ${item.nome}\nCategoria: ${item.categoria}\nFabricante: ${item.fabricante || 'Não informado'}\nPrincípio Ativo: ${item.principio_ativo || 'Não informado'}\nDose Recomendada: ${item.dose_recomendada || 'Não informada'}`}
                                                >
                                                    {item.nome}
                                                </p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div 
                                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border cursor-help transition-transform hover:scale-110 ${getColorForCategory(item.categoria)}`}
                                                    title={`Categoria: ${item.categoria}`}
                                                >
                                                    {getIconForCategory(item.categoria)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/10 text-[var(--color-muted)] text-xs font-bold">
                                                    <Scale className="w-3 h-3" /> {item.unidade_medida}
                                                </div>
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
            <DraggableModal
                isOpen={showModal}
                onClose={closeModal}
                title={
                    <div>
                        <h2 className="text-2xl font-black text-white">{editingId ? 'Editar Item' : 'Novo Item Local'}</h2>
                        <p className="text-indigo-400 text-xs font-bold tracking-widest mt-1">CATÁLOGO</p>
                    </div>
                }
            >
                <div className="p-2 space-y-6">
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Fabricante / Marca
                                        </label>
                                        <input 
                                            type="text" value={fabricante} onChange={e => setFabricante(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: Yara, Syngenta..."
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Princípio Ativo (Defensivos)
                                        </label>
                                        <input 
                                            type="text" value={principioAtivo} onChange={e => setPrincipioAtivo(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: Glifosato, Imidacloprido..."
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Modo Aplicação
                                        </label>
                                        <select 
                                            value={modoAplicacao} onChange={e => setModoAplicacao(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="FOLIAR">Foliar</option>
                                            <option value="SOLO">Via Solo</option>
                                            <option value="FERTIRRIGACAO">Fertirrigação</option>
                                            <option value="SEMENTE">Trat. Semente</option>
                                            <option value="OUTROS">Outros</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Composição (NPK)
                                        </label>
                                        <input 
                                            type="text" value={composicaoNpk} onChange={e => setComposicaoNpk(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: 04-14-08"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Dose Recomendada
                                        </label>
                                        <input 
                                            type="text" value={doseRecomendada} onChange={e => setDoseRecomendada(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="Ex: 2L/ha"
                                        />
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
            </DraggableModal>

            {/* MODAL DE VISUALIZAÇÃO DE DETALHES */}
            {viewingItem && (
                <DraggableModal
                    isOpen={!!viewingItem}
                    onClose={() => setViewingItem(null)}
                    title={<h2 className="text-2xl font-black text-white flex items-center gap-3">Ficha do Produto</h2>}
                >
                    <div className="p-2 space-y-6 custom-scrollbar">
                                <div>
                                    <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">Nome do Produto</p>
                                    <p className="text-3xl font-black text-white">{viewingItem.nome}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">Categoria</p>
                                        <p className="text-lg font-bold text-white">{viewingItem.categoria}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">Medida</p>
                                        <p className="text-lg font-bold text-white">{viewingItem.unidade_medida}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">Origem</p>
                                        <p className="text-lg font-bold text-white">{viewingItem.is_global ? 'Padrão Global' : viewingItem.status_aprovacao === 'PENDENTE_GLOBAL' ? 'Pendente' : 'Local'}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">Fabricante</p>
                                        <p className="text-base font-medium text-white">{viewingItem.fabricante || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">Princípio Ativo</p>
                                        <p className="text-base font-medium text-white">{viewingItem.principio_ativo || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">Modo de Aplicação</p>
                                        <p className="text-base font-medium text-white">{viewingItem.modo_aplicacao || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-1">Dose Recomendada</p>
                                        <p className="text-base font-medium text-white">{viewingItem.dose_recomendada || 'Não informada'}</p>
                                    </div>
                                </div>

                                {viewingItem.observacao && (
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mt-4">
                                        <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Observações Adicionais</p>
                                        <p className="text-base text-white/90 leading-relaxed">{viewingItem.observacao}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 border-t border-[var(--color-border)] bg-white/[0.02] flex justify-end">
                                <button onClick={() => setViewingItem(null)} className="px-8 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/80 rounded-xl text-white font-black shadow-lg transition-all">
                                    Fechar
                                </button>
                            </div>
                </DraggableModal>
            )}

        </div>
    );
}
