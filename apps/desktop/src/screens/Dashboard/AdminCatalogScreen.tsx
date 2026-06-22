import React, { useState, useEffect } from 'react';
import { 
    RefreshCw, Search, Trash2, Globe, Plus, Leaf, Bug, Package, ShieldCheck, X, Activity, Beaker, GitMerge, Percent, Clock, Edit2
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import DraggableModal from '../../components/common/DraggableModal';

export default function AdminCatalogScreen() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'CULTURAS' | 'PRODUTOS' | 'FITOSSANITARIO' | 'RESULTADOS' | 'COMBINACOES' | 'FASES' | 'APROVACOES'>('CULTURAS');
    
    // Listas Principais
    const [approvals, setApprovals] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [crops, setCrops] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [products, setProducts] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [pests, setPests] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [diseases, setDiseases] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [outcomes, setOutcomes] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [combinations, setCombinations] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [phases, setPhases] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [editingApproval, setEditingApproval] = useState<Record<string, string | number | boolean | null> | null>(null);

    // Estado do Modal de Criação
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('');
    const [newItemFabricante, setNewItemFabricante] = useState('');
    const [newItemPrincipio, setNewItemPrincipio] = useState('');
    
    // Campos Específicos para Relacionamentos
    const [selectedCropId, setSelectedCropId] = useState('');
    const [selectedProductA, setSelectedProductA] = useState('');
    const [selectedProductB, setSelectedProductB] = useState('');
    const [selectedProblem, setSelectedProblem] = useState('');
    const [resultStatus, setResultStatus] = useState('');
    const [controlPercentage, setControlPercentage] = useState('');
    const [phaseOrder, setPhaseOrder] = useState('');
    const [durationDays, setDurationDays] = useState('');

    const fetchDados = async () => {
        setLoading(true);
        try {
            // SEMPRE busca aprovações pendentes para exibir o contador corretamente na aba
            const { data: approvalsData } = await supabase.from('v2_produtos').select('*').eq('status_aprovacao', 'PENDENTE').order('created_at', { ascending: false });
            if (approvalsData) setApprovals(approvalsData);

            if (activeTab === 'CULTURAS') {
                const { data, error } = await supabase.from('kb_crops').select('*').eq('scope', 'GLOBAL').order('name');
                if (!error && data) setCrops(data);
            } 
            else if (activeTab === 'PRODUTOS') {
                const { data, error } = await supabase.from('kb_products').select('*').eq('scope', 'GLOBAL').order('name');
                if (!error && data) setProducts(data);
            } 
            else if (activeTab === 'FITOSSANITARIO') {
                const { data: pData } = await supabase.from('kb_pests').select('*').eq('scope', 'GLOBAL').order('common_name');
                const { data: dData } = await supabase.from('kb_diseases').select('*').eq('scope', 'GLOBAL').order('name');
                if (pData) setPests(pData);
                if (dData) setDiseases(dData);
            } 
            else if (activeTab === 'RESULTADOS') {
                // Traz os resultados e os nomes dos tratamentos e problemas via Foreign Key
                const { data, error } = await supabase.from('kb_outcomes').select(`
                    id, control_percentage, evaluation_days,
                    treatment:kb_products!treatment_id(name),
                    problem_pest:kb_pests!problem_id(common_name),
                    problem_disease:kb_diseases!problem_id(name)
                `).order('created_at', { ascending: false });
                if (!error && data) setOutcomes(data);

                // Carrega opções para o Modal
                const { data: prData } = await supabase.from('kb_products').select('id, name');
                if (prData) setProducts(prData);
                const { data: peData } = await supabase.from('kb_pests').select('id, common_name');
                if (peData) setPests(peData);
                const { data: diData } = await supabase.from('kb_diseases').select('id, name');
                if (diData) setDiseases(diData);
            } 
            else if (activeTab === 'COMBINACOES') {
                const { data, error } = await supabase.from('kb_combinations').select(`
                    id, result_status, notes,
                    product_a:kb_products!product_a_id(name),
                    product_b:kb_products!product_b_id(name)
                `).order('created_at', { ascending: false });
                if (!error && data) setCombinations(data);

                // Carrega opções para o Modal
                const { data: prData } = await supabase.from('kb_products').select('id, name');
                if (prData) setProducts(prData);
            } 
            else if (activeTab === 'FASES') {
                const { data, error } = await supabase.from('kb_phenological_phases').select(`
                    id, phase_order, name, duration_days,
                    crop:kb_crops!crop_id(name)
                `).order('phase_order', { ascending: true });
                if (!error && data) setPhases(data);

                const { data: crData } = await supabase.from('kb_crops').select('id, name');
                if (crData) setCrops(crData);
            } 
            else if (activeTab === 'APROVACOES') {
                // A busca já foi feita no início da função
            }
        } catch (error) {
            console.error('Erro ao buscar biblioteca:', error);
            toast.error('Erro ao conectar com o Grafo de Conhecimento.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDados();
    }, [activeTab]);

    const resetModal = () => {
        setIsAddModalOpen(false);
        setNewItemName('');
        setNewItemCategory('');
        setNewItemFabricante('');
        setNewItemPrincipio('');
        setSelectedCropId('');
        setSelectedProductA('');
        setSelectedProductB('');
        setSelectedProblem('');
        setResultStatus('');
        setControlPercentage('');
        setPhaseOrder('');
        setDurationDays('');
    };

    const handleAddItem = async () => {
        try {
            if (activeTab === 'CULTURAS') {
                if (!newItemName) return toast.error('Nome obrigatório');
                const { error } = await supabase.from('kb_crops').insert([{ name: newItemName, scope: 'GLOBAL' }]);
                if (error) throw error;
                toast.success('Cultura global adicionada!');
            } 
            else if (activeTab === 'PRODUTOS' || activeTab === 'APROVACOES') {
                if (!newItemName) return toast.error('Nome obrigatório');
                
                const { data: v2Data } = await supabase.from('v2_produtos').insert([{ 
                    nome: newItemName, 
                    categoria: newItemCategory || 'INSUMO', 
                    fabricante: newItemFabricante,
                    principio_ativo: newItemPrincipio,
                    is_global: true, 
                    status_aprovacao: 'APROVADO' 
                }]).select();

                const { error: error2 } = await supabase.from('kb_products').insert([{ 
                    name: newItemName, 
                    category: newItemCategory || 'INSUMO', 
                    scope: 'GLOBAL' 
                }]);
                if (error2) throw error2;

                toast.success('Produto global inserido e liberado!');
            } 
            else if (activeTab === 'FITOSSANITARIO') {
                if (!newItemName) return toast.error('Nome obrigatório');
                if (newItemCategory === 'PRAGA') {
                    const { error } = await supabase.from('kb_pests').insert([{ common_name: newItemName, scope: 'GLOBAL' }]);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('kb_diseases').insert([{ name: newItemName, scope: 'GLOBAL' }]);
                    if (error) throw error;
                }
                toast.success('Item fitossanitário adicionado!');
            } 
            else if (activeTab === 'RESULTADOS') {
                if (!selectedProductA || !selectedProblem || !controlPercentage) return toast.error('Preencha os campos!');
                const { error } = await supabase.from('kb_outcomes').insert([{ 
                    treatment_id: selectedProductA,
                    problem_id: selectedProblem,
                    control_percentage: Number(controlPercentage),
                    owner_id: user?.id,
                    scope: 'GLOBAL' // Global como teste, mas poderia ser AGRONOMO
                }]);
                if (error) throw error;
                toast.success('Resultado registrado na Memória Técnica!');
            } 
            else if (activeTab === 'COMBINACOES') {
                if (!selectedProductA || !selectedProductB || !resultStatus) return toast.error('Preencha os campos!');
                const { error } = await supabase.from('kb_combinations').insert([{ 
                    product_a_id: selectedProductA,
                    product_b_id: selectedProductB,
                    result_status: resultStatus,
                    scope: 'GLOBAL'
                }]);
                if (error) throw error;
                toast.success('Combinação de Tanque registrada!');
            } 
            else if (activeTab === 'FASES') {
                if (!selectedCropId || !newItemName || !phaseOrder) return toast.error('Preencha os campos obrigatórios!');
                const { error } = await supabase.from('kb_phenological_phases').insert([{ 
                    crop_id: selectedCropId,
                    name: newItemName,
                    phase_order: Number(phaseOrder),
                    duration_days: Number(durationDays)
                }]);
                if (error) throw error;
                toast.success('Fase Fenológica adicionada!');
            }
            
            resetModal();
            fetchDados();
        } catch (error) {
            console.error(error);
            toast.error(error?.message || 'Erro desconhecido ao salvar no banco.');
        }
    };

    const handleDeleteItem = async (table: string, id: string) => {
        if (!window.confirm("Esta ação é definitiva. Confirma?")) return;
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            toast.success('Item apagado.');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao apagar item.');
        }
    };

    const handleApprove = async (item: Record<string, string | number | boolean | null>) => {
        try {
            await supabase.from('v2_produtos').update({ status_aprovacao: 'APROVADO' }).eq('id', item.id);
            
            // Inserir na Biblioteca Global kb_products
            await supabase.from('kb_products').insert([{ 
                name: item.nome, 
                category: item.categoria || 'INSUMO', 
                scope: 'GLOBAL' 
            }]);

            toast.success('Produto aprovado e inserido na Biblioteca Global!');
            fetchDados();
        } catch (_e) {
            toast.error('Erro ao aprovar produto.');
        }
    };

    const handleReject = async (item: Record<string, string | number | boolean | null>) => {
        try {
            await supabase.from('v2_produtos').update({ status_aprovacao: 'REJEITADO' }).eq('id', item.id);
            toast.success('Produto rejeitado.');
            fetchDados();
        } catch (_e) {
            toast.error('Erro ao rejeitar produto.');
        }
    };

    // ========== RENDERIZAÇÃO DAS TABELAS ========== //

    const renderCrops = () => {
        const filtered = crops.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Cultura</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-white flex items-center gap-2"><Leaf className="w-4 h-4 text-green-400"/> {item.name}</td>
                                <td className="p-4 text-right"><button onClick={() => handleDeleteItem('kb_crops', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderProducts = () => {
        const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Produto Comercial</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Categoria</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-white flex items-center gap-2"><Package className="w-4 h-4 text-blue-400"/> {item.name}</td>
                                <td className="p-4 text-xs text-[var(--color-muted)]"><span className="px-2 py-1 bg-white/10 rounded">{item.category}</span></td>
                                <td className="p-4 text-right"><button onClick={() => handleDeleteItem('kb_products', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderPhyto = () => {
        const pFiltered = pests.filter(p => p.common_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const dFiltered = diseases.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Problema</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Tipo</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pFiltered.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-white flex items-center gap-2"><Bug className="w-4 h-4 text-orange-400"/> {item.common_name}</td>
                                <td className="p-4 text-xs"><span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">PRAGA</span></td>
                                <td className="p-4 text-right"><button onClick={() => handleDeleteItem('kb_pests', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                        {dFiltered.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-white flex items-center gap-2"><Bug className="w-4 h-4 text-purple-400"/> {item.name}</td>
                                <td className="p-4 text-xs"><span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">DOENÇA</span></td>
                                <td className="p-4 text-right"><button onClick={() => handleDeleteItem('kb_diseases', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderOutcomes = () => {
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Tratamento</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Problema Alvo</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Eficiência Obtida</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {outcomes.map(item => {
                            const problemName = item.problem_pest?.common_name || item.problem_disease?.name || 'Problema Desconhecido';
                            return (
                                <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                    <td className="p-4 font-bold text-white flex items-center gap-2"><Beaker className="w-4 h-4 text-indigo-400"/> {item.treatment?.name || 'Desconhecido'}</td>
                                    <td className="p-4 text-white"><span className="px-2 py-1 bg-white/5 rounded border border-white/10 text-xs">{problemName}</span></td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div className={`h-full ${item.control_percentage > 80 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${item.control_percentage}%` }}></div>
                                            </div>
                                            <span className="font-bold text-white text-sm">{item.control_percentage}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right"><button onClick={() => handleDeleteItem('kb_outcomes', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderCombinations = () => {
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Mistura no Tanque</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Status / Risco</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {combinations.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-white flex items-center gap-3">
                                    <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">{item.product_a?.name || 'A'}</span>
                                    <Plus className="w-4 h-4 text-[var(--color-muted)]" />
                                    <span className="px-3 py-1 bg-white/5 rounded-lg border border-white/10">{item.product_b?.name || 'B'}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${item.result_status === 'COMPATIVEL' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {item.result_status}
                                    </span>
                                </td>
                                <td className="p-4 text-right"><button onClick={() => handleDeleteItem('kb_combinations', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderPhases = () => {
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Cultura Alvo</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Ordem / Estágio</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Fase Fenológica</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Duração (Dias)</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {phases.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-[var(--color-muted)] text-sm">{item.crop?.name}</td>
                                <td className="p-4 font-black text-indigo-400">#{item.phase_order}</td>
                                <td className="p-4 font-bold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400"/> {item.name}</td>
                                <td className="p-4 text-sm text-[var(--color-muted)]"><Clock className="w-4 h-4 inline mr-1" /> {item.duration_days} dias</td>
                                <td className="p-4 text-right"><button onClick={() => handleDeleteItem('kb_phenological_phases', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderApprovals = () => {
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Produto / Insumo</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Detalhes da Bula</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvals.length === 0 ? (
                            <tr><td colSpan={3} className="p-8 text-center text-[var(--color-muted)] font-bold">Nenhuma aprovação pendente no momento.</td></tr>
                        ) : approvals.map(item => (
                            <tr key={String(item.id)} className="border-b border-white/5 hover:bg-white/5 align-top">
                                <td className="p-4">
                                    <div className="font-bold text-white text-lg">{item.nome}</div>
                                    <div className="flex gap-2 mt-2">
                                        <span className="px-2 py-1 bg-white/10 text-[var(--color-muted)] text-xs rounded">{item.categoria || 'INDEFINIDO'}</span>
                                        {item.fabricante && <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded font-bold">🏭 {item.fabricante}</span>}
                                    </div>
                                    <div className="mt-2 text-xs text-[var(--color-muted)]">
                                        <strong>Princípio:</strong> {item.principio_ativo || '-'}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-[var(--color-muted)]">
                                    <div className="mt-2 p-2 bg-white/5 rounded border border-white/5 text-xs italic">
                                        Produto cadastrado rapidamente pelo usuário via sistema local. 
                                        Aprove para adicionar à Biblioteca Global ou Rejeite.
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex flex-col gap-2 items-end">
                                        <button onClick={() => handleApprove(item)} className="px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg font-bold flex items-center gap-2 w-full justify-center border border-green-500/30 transition-colors">
                                            <ShieldCheck className="w-4 h-4" /> Aprovar
                                        </button>
                                        <button onClick={() => setEditingApproval(item)} className="px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg font-bold flex items-center gap-2 w-full justify-center border border-blue-500/30 transition-colors">
                                            <Edit2 className="w-4 h-4" /> Editar Bula
                                        </button>
                                        <button onClick={() => handleReject(item)} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-bold flex items-center gap-2 w-full justify-center border border-red-500/30 transition-colors">
                                            <X className="w-4 h-4" /> Rejeitar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Globe className="w-8 h-8 text-indigo-500" />
                        Biblioteca Global AgroGB
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Gerencie o Cérebro Técnico e a Memória Acumulada que alimenta a Inteligência Artificial.
                    </p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                    <Plus className="w-5 h-5" /> Inserir Conhecimento
                </button>
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="glass rounded-3xl border border-[var(--color-border)] p-6">
                
                {/* TABS (Scroll horizontal em mobile) */}
                <div className="flex overflow-x-auto gap-4 mb-6 border-b border-white/5 pb-4 custom-scrollbar">
                    <button onClick={() => setActiveTab('CULTURAS')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'CULTURAS' ? 'bg-green-500/20 text-green-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <Leaf className="w-4 h-4" /> Culturas
                    </button>
                    <button onClick={() => setActiveTab('PRODUTOS')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'PRODUTOS' ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <Package className="w-4 h-4" /> Produtos
                    </button>
                    <button onClick={() => setActiveTab('APROVACOES')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'APROVACOES' ? 'bg-yellow-500/20 text-yellow-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <ShieldCheck className="w-4 h-4" /> Aprovações Pendentes
                        {approvals.length > 0 && <span className="ml-2 bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">{approvals.length}</span>}
                    </button>
                    <button onClick={() => setActiveTab('FITOSSANITARIO')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'FITOSSANITARIO' ? 'bg-orange-500/20 text-orange-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <Bug className="w-4 h-4" /> Problemas Fito
                    </button>
                    <button onClick={() => setActiveTab('RESULTADOS')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'RESULTADOS' ? 'bg-indigo-500/20 text-indigo-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <Percent className="w-4 h-4" /> Resultados Reais
                    </button>
                    <button onClick={() => setActiveTab('COMBINACOES')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'COMBINACOES' ? 'bg-red-500/20 text-red-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <GitMerge className="w-4 h-4" /> Misturas & Tanque
                    </button>
                    <button onClick={() => setActiveTab('FASES')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'FASES' ? 'bg-emerald-500/20 text-emerald-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <Activity className="w-4 h-4" /> Fases Fenológicas
                    </button>
                </div>

                <div className="flex flex-col md:flex-row justify-end mb-6 gap-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                        <input type="text" placeholder="Filtrar tabela..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-2 pl-9 pr-4 text-white focus:outline-none focus:border-indigo-500 text-sm"/>
                    </div>
                    <button onClick={fetchDados} className="p-2 bg-white/5 border border-[var(--color-border)] rounded-xl text-[var(--color-muted)] hover:text-white"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
                ) : (
                    <>
                        {activeTab === 'CULTURAS' && renderCrops()}
                        {activeTab === 'PRODUTOS' && renderProducts()}
                        {activeTab === 'FITOSSANITARIO' && renderPhyto()}
                        {activeTab === 'RESULTADOS' && renderOutcomes()}
                        {activeTab === 'COMBINACOES' && renderCombinations()}
                        {activeTab === 'FASES' && renderPhases()}
                        {activeTab === 'APROVACOES' && renderApprovals()}
                    </>
                )}
            </div>

            {/* MODAL GLOBAL DE INSERÇÃO */}
            <DraggableModal
                isOpen={isAddModalOpen}
                onClose={resetModal}
                title={`Adicionar ${activeTab.charAt(0) + activeTab.slice(1).toLowerCase()}`}
            >
                <div className="space-y-4">
                            
                            {/* Campos Padrão (Culturas, Produtos, Fito) */}
                            {['CULTURAS', 'PRODUTOS', 'APROVACOES', 'FITOSSANITARIO'].includes(activeTab) && (
                                <div>
                                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Nome Oficial</label>
                                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value.toUpperCase())} placeholder="Ex: Milho, Calcinit, Mosca Branca" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 font-bold" />
                                </div>
                            )}

                            {['PRODUTOS', 'APROVACOES'].includes(activeTab) && (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Categoria do Produto</label>
                                        <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500">
                                            <option value="">Selecione...</option>
                                            <option value="INSUMO">Insumo Geral</option>
                                            <option value="FERTILIZANTE">Fertilizante</option>
                                            <option value="DEFENSIVO">Defensivo</option>
                                            <option value="SEMENTE">Semente / Muda</option>
                                            <option value="ADJUVANTE">Adjuvante</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Fabricante</label>
                                            <input type="text" value={newItemFabricante} onChange={(e) => setNewItemFabricante(e.target.value)} placeholder="Ex: Bayer" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Princípio Ativo</label>
                                            <input type="text" value={newItemPrincipio} onChange={(e) => setNewItemPrincipio(e.target.value)} placeholder="Ex: Glifosato" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500" />
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'FITOSSANITARIO' && (
                                <div>
                                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Classificação</label>
                                    <select value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500">
                                        <option value="">Selecione...</option>
                                        <option value="PRAGA">Praga</option>
                                        <option value="DOENCA">Doença</option>
                                    </select>
                                </div>
                            )}

                            {/* Campos para RESULTADOS */}
                            {activeTab === 'RESULTADOS' && (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Produto (Tratamento)</label>
                                        <select value={selectedProductA} onChange={(e) => setSelectedProductA(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white">
                                            <option value="">Selecione o produto...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Problema Fitossanitário</label>
                                        <select value={selectedProblem} onChange={(e) => setSelectedProblem(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white">
                                            <option value="">Selecione o alvo...</option>
                                            <optgroup label="Pragas">{pests.map(p => <option key={p.id} value={p.id}>{p.common_name}</option>)}</optgroup>
                                            <optgroup label="Doenças">{diseases.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</optgroup>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Eficiência de Controle (%)</label>
                                        <input type="number" min="0" max="100" value={controlPercentage} onChange={(e) => setControlPercentage(e.target.value)} placeholder="Ex: 95" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white" />
                                    </div>
                                </>
                            )}

                            {/* Campos para COMBINACOES */}
                            {activeTab === 'COMBINACOES' && (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Produto A</label>
                                        <select value={selectedProductA} onChange={(e) => setSelectedProductA(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white">
                                            <option value="">Selecione o produto...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Produto B (Mistura)</label>
                                        <select value={selectedProductB} onChange={(e) => setSelectedProductB(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white">
                                            <option value="">Selecione o produto...</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Status do Tanque</label>
                                        <select value={resultStatus} onChange={(e) => setResultStatus(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white font-bold">
                                            <option value="">Selecione...</option>
                                            <option value="COMPATIVEL" className="text-green-500">Compatível (Seguro)</option>
                                            <option value="INCOMPATIVEL" className="text-red-500">Incompatível (Não Misturar)</option>
                                            <option value="FITOTOXICO" className="text-orange-500">Gera Fitotoxidade na Planta</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Campos para FASES FENOLÓGICAS */}
                            {activeTab === 'FASES' && (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Cultura Vinculada</label>
                                        <select value={selectedCropId} onChange={(e) => setSelectedCropId(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white">
                                            <option value="">Selecione a cultura...</option>
                                            {crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Estágio (Ordem)</label>
                                            <input type="number" value={phaseOrder} onChange={(e) => setPhaseOrder(e.target.value)} placeholder="Ex: 1" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Duração (Dias)</label>
                                            <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="Ex: 15" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Nome da Fase</label>
                                        <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Ex: Floração, Enchimento de Grãos" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white font-bold" />
                                    </div>
                                </>
                            )}

                            <button onClick={handleAddItem} className="w-full mt-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg transition-all flex justify-center items-center gap-2">
                                <Globe className="w-5 h-5"/> Consolidar no Grafo
                            </button>
                        </div>
            </DraggableModal>
            <DraggableModal
                isOpen={!!editingApproval}
                onClose={() => setEditingApproval(null)}
                title="Revisar Sugestão"
            >
                {editingApproval && (
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-[var(--color-muted)] font-bold uppercase">Nome do Produto</label>
                            <input type="text" value={String(editingApproval.nome || '')} onChange={e => setEditingApproval({...editingApproval, nome: e.target.value.toUpperCase()})} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-[var(--color-muted)] font-bold uppercase">Categoria</label>
                                    <select value={String(editingApproval.categoria || '')} onChange={e => setEditingApproval({...editingApproval, categoria: e.target.value})} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none">
                                        <option value="INSUMO">Insumo Geral</option>
                                        <option value="FERTILIZANTE">Fertilizante / Adubo</option>
                                        <option value="DEFENSIVO">Defensivo Agrícola</option>
                                        <option value="SEMENTE">Semente / Muda</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-[var(--color-muted)] font-bold uppercase">Fabricante</label>
                                    <input type="text" value={String(editingApproval.fabricante || '')} onChange={e => setEditingApproval({...editingApproval, fabricante: e.target.value})} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-[var(--color-muted)] font-bold uppercase">Princípio Ativo / Composição</label>
                                <input type="text" value={String(editingApproval.principio_ativo || '')} onChange={e => setEditingApproval({...editingApproval, principio_ativo: e.target.value})} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-2 mt-1 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Glifosato, Cálcio Solúvel..." />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--color-muted)] font-bold uppercase">Observações Extras</label>
                                <textarea value={String(editingApproval.observacao || '')} onChange={e => setEditingApproval({...editingApproval, observacao: e.target.value})} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-2 mt-1 resize-none focus:ring-2 focus:ring-indigo-500 outline-none" rows={3}></textarea>
                            </div>
                            <div className="flex justify-end gap-3 mt-8 border-t border-[var(--color-border)] pt-4">
                                <button onClick={() => setEditingApproval(null)} className="px-4 py-2 text-[var(--color-muted)] hover:text-white font-bold">Cancelar</button>
                                <button 
                                    onClick={async () => {
                                        try {
                                            await supabase.from('global_library_submissions').update({
                                                nome: editingApproval.nome,
                                                categoria: editingApproval.categoria,
                                                fabricante: editingApproval.fabricante,
                                                principio_ativo: editingApproval.principio_ativo,
                                                observacao: editingApproval.observacao
                                            }).eq('id', editingApproval.id);
                                            
                                            if (editingApproval.produto_id) {
                                                await supabase.from('v2_produtos').update({
                                                    nome: editingApproval.nome,
                                                    categoria: editingApproval.categoria,
                                                    fabricante: editingApproval.fabricante,
                                                    principio_ativo: editingApproval.principio_ativo,
                                                    observacao: editingApproval.observacao
                                                }).eq('id', editingApproval.produto_id);
                                            }
                                            
                                            toast.success('Sugestão ajustada! Você já pode aprová-la.');
                                            setEditingApproval(null);
                                            fetchDados();
                                        } catch(e) {
                                            toast.error('Erro ao salvar edição.');
                                        }
                                    }}
                                    className="px-6 py-2 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 shadow-lg shadow-indigo-500/20"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                    </div>
                )}
            </DraggableModal>
        </div>
    );
}
