import React, { useState, useEffect } from 'react';
import { 
    Map, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    MoreVertical, 
    AlertCircle,
    CheckCircle2,
    Maximize,
    Leaf
} from 'lucide-react';
import { supabase } from '../../services/supabase';

// Tipo de dados baseado no banco do celular
interface Talhao {
    uuid: string;
    nome: string;
    area_ha: number;
    observacao: string;
    is_deleted: boolean;
    last_updated: string;
}

export default function TalhoesScreen() {
    const [talhoes, setTalhoes] = useState<Talhao[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<Talhao | null>(null);
    const [form, setForm] = useState({ nome: '', area_ha: '', observacao: '' });

    useEffect(() => {
        fetchTalhoes();
    }, []);

    const fetchTalhoes = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('talhoes')
                .select('*')
                .eq('is_deleted', false)
                .order('nome', { ascending: true });
                
            if (error) {
                console.error("Erro ao buscar talhões do Supabase:", error);
            } else {
                setTalhoes(data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nome || !form.area_ha) return alert('Preencha os campos obrigatórios');

        const payload = {
            nome: form.nome.toUpperCase(),
            area_ha: parseFloat(form.area_ha),
            observacao: form.observacao.toUpperCase(),
            last_updated: new Date().toISOString(),
            is_deleted: false
        };

        try {
            if (editItem) {
                // UPDATE
                await supabase
                    .from('talhoes')
                    .update(payload)
                    .eq('uuid', editItem.uuid);
            } else {
                // INSERT
                const { data: { user } } = await supabase.auth.getUser();
                await supabase
                    .from('talhoes')
                    .insert([{ 
                        ...payload, 
                        uuid: crypto.randomUUID(),
                        user_id: user?.id 
                    }]);
            }
            closeModal();
            fetchTalhoes();
        } catch (err) {
            console.error('Erro ao salvar talhão', err);
        }
    };

    const handleDelete = async (uuid: string, nome: string) => {
        if (window.confirm(`Atenção: Deseja realmente excluir o talhão ${nome}?`)) {
            try {
                // Soft Delete
                await supabase
                    .from('talhoes')
                    .update({ is_deleted: true, last_updated: new Date().toISOString() })
                    .eq('uuid', uuid);
                
                fetchTalhoes();
            } catch (err) {
                console.error('Erro ao excluir talhão', err);
            }
        }
    };

    const openModal = (talhao?: Talhao) => {
        if (talhao) {
            setEditItem(talhao);
            setForm({ nome: talhao.nome, area_ha: String(talhao.area_ha), observacao: talhao.observacao || '' });
        } else {
            setEditItem(null);
            setForm({ nome: '', area_ha: '', observacao: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditItem(null);
    };

    const filteredTalhoes = talhoes.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalArea = talhoes.reduce((acc, curr) => acc + (curr.area_ha || 0), 0);

    return (
        <div className="animate-fade-in pb-12">
            
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Map className="w-8 h-8 text-blue-500" />
                        Gestão de Talhões
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Gerencie as áreas de plantio da sua fazenda. Totalmente sincronizado com o aplicativo mobile.
                    </p>
                </div>
                
                <button 
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Novo Talhão
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                <div className="glass p-6 rounded-2xl flex items-center justify-between group">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm mb-1">Total de Talhões</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-white break-words">{talhoes.length}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Map className="w-6 h-6 text-blue-500" />
                    </div>
                </div>
                <div className="glass p-6 rounded-2xl flex items-center justify-between group border-b-4 border-blue-500">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm mb-1">Área Total Plantada</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-white break-words">{totalArea.toFixed(2)} <span className="text-lg text-[var(--color-muted)] font-medium">ha</span></h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Maximize className="w-6 h-6 text-green-500" />
                    </div>
                </div>
                <div className="glass p-6 rounded-2xl flex items-center justify-between group">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm mb-1">Status Sincronização</p>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            Em dia
                        </h3>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-[var(--color-muted)]" />
                    </div>
                </div>
            </div>

            {/* TABELA DE DADOS */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col border border-[var(--color-border)]">
                {/* Table Header/Toolbar */}
                <div className="p-4 border-b border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-white">Relação de Áreas</h2>
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-[var(--color-muted)]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar talhão..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5 transition-colors"
                        />
                    </div>
                </div>

                {/* Table Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[var(--color-muted)]">
                        <thead className="text-xs uppercase bg-white/[0.02] border-b border-[var(--color-border)] text-[var(--color-muted)]">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold">Identificação do Talhão</th>
                                <th scope="col" className="px-6 py-4 font-bold">Área (Hectares)</th>
                                <th scope="col" className="px-6 py-4 font-bold">Observações / Status</th>
                                <th scope="col" className="px-6 py-4 font-bold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[var(--color-muted)] font-medium">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                            Buscando dados na nuvem...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTalhoes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <AlertCircle className="w-12 h-12 text-[var(--color-muted)] mb-4" />
                                            <p className="text-white font-bold text-lg">Nenhum talhão encontrado</p>
                                            <p className="text-[var(--color-muted)]">Crie seu primeiro talhão para começar o controle.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTalhoes.map((talhao) => (
                                    <tr key={talhao.uuid} className="bg-transparent border-b border-[var(--color-border)] hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                    <Map className="w-5 h-5 text-blue-500" />
                                                </div>
                                                <span className="font-bold text-white text-base">{talhao.nome}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-bold text-white">{talhao.area_ha}</span> <span className="text-xs">ha</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs">{talhao.observacao || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => openModal(talhao)}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(talhao.uuid, talhao.nome)}
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CADASTRAR/EDITAR */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-white/[0.02] rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Map className="w-5 h-5 text-blue-500" />
                                {editItem ? 'Editar Talhão' : 'Novo Talhão'}
                            </h2>
                            <button onClick={closeModal} className="text-[var(--color-muted)] hover:text-white p-1">
                                &times;
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="talhaoForm" onSubmit={handleSave} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                                        Identificação do Talhão *
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={form.nome}
                                        onChange={(e) => setForm({...form, nome: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-3 transition-all"
                                        placeholder="Ex: Talhão 01 - Soja"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                                        Área em Hectares (ha) *
                                    </label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required
                                        value={form.area_ha}
                                        onChange={(e) => setForm({...form, area_ha: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-3 transition-all"
                                        placeholder="Ex: 15.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                                        Observações
                                    </label>
                                    <textarea 
                                        rows={3}
                                        value={form.observacao}
                                        onChange={(e) => setForm({...form, observacao: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block p-3 transition-all resize-none"
                                        placeholder="Notas adicionais sobre o preparo, solo, etc."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3 bg-white/[0.02] rounded-b-2xl">
                            <button 
                                type="button"
                                onClick={closeModal}
                                className="px-6 py-2.5 rounded-xl font-bold text-[var(--color-muted)] hover:text-white hover:bg-white/5 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                form="talhaoForm"
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20 transition-all"
                            >
                                Salvar Talhão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
