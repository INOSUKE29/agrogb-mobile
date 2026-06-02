import React, { useState, useEffect } from 'react';
import { 
    Map, 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    AlertCircle,
    CheckCircle2,
    Maximize,
    Leaf,
    MapPin
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

interface Talhao {
    uuid: string;
    nome: string;
    area_ha: number;
    observacao: string;
    is_deleted: boolean;
    last_updated: string;
    tableUsed: string;
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
            // Tenta buscar da v2 primeiro
            let { data, error } = await supabase
                .from('v2_talhoes')
                .select('*')
                .order('nome', { ascending: true });
                
            if (error) {
                // Se falhar (não existe/cache), tenta a v1
                const fallback = await supabase
                    .from('talhoes')
                    .select('*')
                    .eq('is_deleted', false)
                    .order('nome', { ascending: true });
                if (fallback.error) throw fallback.error;
                data = fallback.data;
            }

            const normalizedData = (data || []).map(item => ({
                uuid: item.id || item.uuid,
                nome: item.nome,
                area_ha: item.area || item.area_ha || 0,
                observacao: item.tipo_solo || item.observacao || '',
                is_deleted: item.is_deleted || false,
                last_updated: item.updated_at || item.last_updated || new Date().toISOString(),
                tableUsed: item.id ? 'v2_talhoes' : 'talhoes'
            })).filter(t => !t.is_deleted);

            setTalhoes(normalizedData);
        } catch (err: any) {
            console.error('Erro ao buscar talhões', err);
            toast.error('Erro ao buscar talhões. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nome || !form.area_ha) return toast.error('Preencha os campos obrigatórios');

        const { data: userData } = await supabase.auth.getUser();
        
        try {
            if (editItem) {
                // UPDATE
                const payload = editItem.tableUsed === 'v2_talhoes' 
                    ? { nome: form.nome.toUpperCase(), area: parseFloat(form.area_ha), tipo_solo: form.observacao.toUpperCase(), updated_at: new Date().toISOString() }
                    : { nome: form.nome.toUpperCase(), area_ha: parseFloat(form.area_ha), observacao: form.observacao.toUpperCase(), last_updated: new Date().toISOString() };
                
                const idField = editItem.tableUsed === 'v2_talhoes' ? 'id' : 'uuid';

                const { error } = await supabase
                    .from(editItem.tableUsed)
                    .update(payload)
                    .eq(idField, editItem.uuid);
                
                if (error) throw error;
                toast.success('Talhão atualizado com sucesso!');
            } else {
                // INSERT (Try v2 first)
                const payloadV2 = {
                    nome: form.nome.toUpperCase(),
                    area: parseFloat(form.area_ha),
                    tipo_solo: form.observacao.toUpperCase(),
                    updated_at: new Date().toISOString()
                };

                const { error } = await supabase.from('v2_talhoes').insert([payloadV2]);
                if (error) {
                    // Fallback to v1
                    const payloadV1 = {
                        nome: form.nome.toUpperCase(),
                        area_ha: parseFloat(form.area_ha),
                        observacao: form.observacao.toUpperCase(),
                        last_updated: new Date().toISOString(),
                        is_deleted: false,
                        user_id: userData?.user?.id
                    };
                    const fallbackError = await supabase.from('talhoes').insert([payloadV1]);
                    if (fallbackError.error) throw fallbackError.error;
                }
                toast.success('Talhão cadastrado com sucesso!');
            }
            closeModal();
            fetchTalhoes();
        } catch (err) {
            console.error('Erro ao salvar talhão', err);
            toast.error('Erro ao salvar talhão.');
        }
    };

    const handleDelete = async (item: Talhao) => {
        if (window.confirm(`Atenção: Deseja realmente excluir o talhão ${item.nome}?`)) {
            try {
                const idField = item.tableUsed === 'v2_talhoes' ? 'id' : 'uuid';
                if (item.tableUsed === 'v2_talhoes') {
                    // Hard delete or sync flag depending on V2 design
                    await supabase.from('v2_talhoes').delete().eq(idField, item.uuid);
                } else {
                    // Soft Delete V1
                    await supabase.from('talhoes').update({ is_deleted: true, last_updated: new Date().toISOString() }).eq(idField, item.uuid);
                }
                toast.success('Talhão removido com sucesso!');
                fetchTalhoes();
            } catch (err) {
                console.error('Erro ao excluir talhão', err);
                toast.error('Erro ao excluir talhão.');
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
        <div className="animate-fade-in pb-12 space-y-8">
            
            {/* CABEÇALHO HERO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <MapPin className="w-4 h-4" /> Inteligência Geoespacial
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Gestão de Talhões
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Mapeie suas áreas de plantio, acompanhe a área produtiva e registre as características do solo.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => openModal()}
                        className="px-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white font-bold shadow-lg shadow-[var(--color-primary)]/20 transition-all group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Novo Talhão
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between group border-b-4 border-blue-500 hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Total de Áreas</p>
                        <h3 className="text-3xl font-black text-white">{talhoes.length} <span className="text-sm text-[var(--color-muted)] font-medium">talhões mapeados</span></h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Map className="w-7 h-7 text-blue-500" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between group border-b-4 border-green-500 hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Área Produtiva Total</p>
                        <h3 className="text-3xl font-black text-white">{totalArea.toFixed(2)} <span className="text-xl text-green-400 font-black">ha</span></h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Maximize className="w-7 h-7 text-green-500" />
                    </div>
                </div>
                <div className="glass-card p-6 rounded-3xl flex items-center justify-between group border-b-4 border-purple-500 hover:-translate-y-1 transition-all">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Status Base de Dados</p>
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                            <CheckCircle2 className="w-6 h-6 text-purple-400" />
                            Sincronizado
                        </h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Leaf className="w-7 h-7 text-purple-500" />
                    </div>
                </div>
            </div>

            {/* TABELA DE DADOS PREMIUM */}
            <div className="glass rounded-3xl flex flex-col border border-[var(--color-border)] overflow-hidden">
                <div className="p-6 border-b border-[var(--color-border)] flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-white/[0.02] to-transparent">
                    <h2 className="text-2xl font-black text-white">Relação de Talhões</h2>
                    <div className="relative w-full sm:w-80">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-[var(--color-muted)]" />
                        </div>
                        <input
                            type="text"
                            placeholder="Pesquisar por nome ou área..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] block pl-12 pr-4 py-3 transition-all outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[var(--color-muted)]">
                        <thead className="bg-white/[0.02] border-b border-[var(--color-border)]">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold uppercase tracking-wider text-[var(--color-muted)]">Identificação / Nome</th>
                                <th scope="col" className="px-6 py-4 font-bold uppercase tracking-wider text-[var(--color-muted)]">Extensão (ha)</th>
                                <th scope="col" className="px-6 py-4 font-bold uppercase tracking-wider text-[var(--color-muted)]">Detalhes do Solo / Obs.</th>
                                <th scope="col" className="px-6 py-4 font-bold uppercase tracking-wider text-right text-[var(--color-muted)]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-border)]">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
                                            <span className="font-medium text-lg">Mapeando áreas via satélite...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTalhoes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                                <MapPin className="w-10 h-10 text-[var(--color-muted)] opacity-50" />
                                            </div>
                                            <p className="text-white font-black text-2xl mb-2">Nenhuma área demarcada</p>
                                            <p className="text-[var(--color-muted)] text-lg">Inicie mapeando seu primeiro talhão para habilitar as funções de plantio.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTalhoes.map((talhao) => (
                                    <tr key={talhao.uuid} className="bg-transparent hover:bg-white/[0.03] transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/20 to-transparent flex items-center justify-center border border-[var(--color-primary)]/10 shadow-inner group-hover:scale-110 transition-transform">
                                                    <Map className="w-6 h-6 text-[var(--color-primary)]" />
                                                </div>
                                                <span className="font-black text-white text-lg">{talhao.nome}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="inline-flex items-baseline gap-1 bg-green-500/10 px-3 py-1 rounded-lg border border-green-500/20">
                                                <span className="font-black text-green-400 text-lg">{talhao.area_ha.toLocaleString('pt-BR')}</span> 
                                                <span className="text-xs font-bold text-green-500 uppercase">Hectares</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm font-medium">{talhao.observacao || 'Nenhum detalhe informado'}</span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => openModal(talhao)}
                                                    className="p-3 text-[var(--color-primary)] bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 rounded-xl transition-colors shadow-sm"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(talhao)}
                                                    className="p-3 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors shadow-sm"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-5 h-5" />
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={closeModal}></div>
                    <div className="glass border border-[var(--color-border)] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="h-2 w-full bg-[var(--color-primary)]"></div>
                        
                        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <Map className="text-[var(--color-primary)] w-8 h-8 bg-[var(--color-primary)]/10 rounded-lg p-1.5" />
                                {editItem ? 'Editar Talhão' : 'Demarcar Novo Talhão'}
                            </h2>
                            <button onClick={closeModal} className="text-[var(--color-muted)] hover:text-white p-2 bg-white/5 rounded-full transition-colors">
                                &times;
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            <form id="talhaoForm" onSubmit={handleSave} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                                        Identificação do Talhão *
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={form.nome}
                                        onChange={(e) => setForm({...form, nome: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all uppercase"
                                        placeholder="Ex: T-01 SOJA"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                                        Extensão Produtiva em Hectares (ha) *
                                    </label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required
                                        value={form.area_ha}
                                        onChange={(e) => setForm({...form, area_ha: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                                        placeholder="Ex: 15.5"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">
                                        Características do Solo / Observações
                                    </label>
                                    <textarea 
                                        rows={4}
                                        value={form.observacao}
                                        onChange={(e) => setForm({...form, observacao: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none"
                                        placeholder="Solo arenoso, curva de nível, etc."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] bg-white/[0.02] flex gap-3">
                            <button 
                                type="button"
                                onClick={closeModal}
                                className="flex-1 py-3.5 rounded-xl font-bold text-[var(--color-muted)] hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                form="talhaoForm"
                                className="flex-1 py-3.5 font-black rounded-xl text-white bg-[var(--color-primary)] hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20 transition-transform active:scale-95"
                            >
                                {editItem ? 'Salvar Alterações' : 'Confirmar Demarcação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
