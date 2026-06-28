import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
    Leaf, 
    Plus, 
    Search, 
    Sprout, 
    CalendarDays, 
    Scale,
    Edit2,
    Trash2,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import DraggableModal from '../../components/common/DraggableModal';
import SearchableSelect from '../../components/common/SearchableSelect';

interface Cultura {
    id: string;
    nome: string;
    variedade: string;
    quantidade: number;
    unidade_medida: string;
    data_plantio: string;
    status: string;
    producao_total_kg: number;
    tableUsed: string;
}

export default function CulturasScreen() {
    const [culturas, setCulturas] = useState<Cultura[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<Cultura | null>(null);
    const [saving, setSaving] = useState(false);
    const { clientOverrideId, user } = useAuth();

    // Form
    const [form, setForm] = useState({
        nome: '',
        variedade: '',
        quantidade: '',
        unidade_medida: 'HA',
        data_plantio: '',
        status: 'EM CRESCIMENTO'
    });

    const fetchCulturas = async () => {
        setLoading(true);
        try {
            const currentUserId = clientOverrideId || user?.id;

            // Tenta v2 primeiro
            let queryV2 = supabase.from('v2_culturas').select('*');
            if (currentUserId) queryV2 = queryV2.eq('user_id', currentUserId);
            
            const response = await queryV2.order('created_at', { ascending: false });
            
            let data = response.data;
            const error = response.error;

            if (error) {
                // Fallback para tabela v1
                let fallbackQuery = supabase.from('culturas').select('*').eq('is_deleted', 0);
                if (currentUserId) fallbackQuery = fallbackQuery.eq('propriedade_id', currentUserId); // Simplificação de filtro na v1
                
                const fallback = await fallbackQuery.order('created_at', { ascending: false });
                if (fallback.error) throw fallback.error;
                data = fallback.data;
            }

            const normalizedData = (data || []).map(item => ({
                id: item.id || item.uuid,
                nome: item.nome,
                variedade: item.variedade || '',
                quantidade: item.quantidade || item.area_ha || 0,
                unidade_medida: item.unidade_medida || 'HA',
                data_plantio: item.data_plantio || '',
                status: item.status || 'EM CRESCIMENTO',
                producao_total_kg: item.producao_total_kg || 0,
                tableUsed: item.id ? 'v2_culturas' : 'culturas'
            }));

            setCulturas(normalizedData);
        } catch (error) {
            console.error('Erro ao buscar culturas:', error);
            toast.error('Erro ao carregar culturas da base de dados.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCulturas();
    }, []);

    const openModal = (cultura?: Cultura) => {
        if (cultura) {
            setEditItem(cultura);
            setForm({
                nome: cultura.nome || '',
                variedade: cultura.variedade || '',
                quantidade: String(cultura.quantidade || ''),
                unidade_medida: cultura.unidade_medida || 'HA',
                data_plantio: cultura.data_plantio || '',
                status: cultura.status || 'EM CRESCIMENTO'
            });
        } else {
            setEditItem(null);
            setForm({ nome: '', variedade: '', quantidade: '', unidade_medida: 'HA', data_plantio: '', status: 'PREPARO DE SOLO' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            nome: form.nome,
            variedade: form.variedade,
            quantidade: parseFloat(form.quantidade) || 0,
            unidade_medida: form.unidade_medida,
            data_plantio: form.data_plantio || null,
            status: form.status
        };

        try {
            const currentUserId = clientOverrideId || user?.id;
            if (editItem) {
                await supabase.from(editItem.tableUsed).update(payload).eq('id', editItem.id);
            } else {
                // Tenta inserir na v2 primeiro
                const { error } = await supabase.from('v2_culturas').insert([{ ...payload, user_id: currentUserId }]);
                if (error) {
                    // Fallback para v1
                    await supabase.from('culturas').insert([{ ...payload, is_deleted: 0 }]);
                }
            }
            setIsModalOpen(false);
            toast.success(editItem ? 'Cultura atualizada!' : 'Cultura cadastrada!');
            fetchCulturas();
        } catch (error) {
            console.error('Erro ao salvar cultura:', error);
            toast.error('Falha ao salvar cultura');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item: Cultura) => {
        if (!window.confirm(`Excluir a cultura de ${item.nome}?`)) return;
        try {
            if (item.tableUsed === 'v2_culturas') {
                await supabase.from('v2_culturas').delete().eq('id', item.id);
            } else {
                await supabase.from('culturas').update({ is_deleted: 1 }).eq('id', item.id);
            }
            toast.success('Cultura removida!');
            fetchCulturas();
        } catch (error) {
            console.error(error);
            toast.error('Falha ao excluir cultura');
        }
    };

    const filtered = culturas.filter(c => 
        (c.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.variedade?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COLHIDO': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'EM CRESCIMENTO': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'PREPARO DE SOLO': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'PRAGA/DOENÇA': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto space-y-8">
            
            {/* HERO CABEÇALHO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <Sprout className="w-4 h-4" /> Gestão Agrícola
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Culturas e Safras
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Acompanhe o que está plantado, o status de crescimento e prepare-se para a colheita.
                        </p>
                    </div>
                    {!clientOverrideId && (
                        <button 
                            onClick={() => openModal()}
                            className="px-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-500/20 transition-all group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            Nova Cultura
                        </button>
                    )}
                </div>
            </div>

            {/* BARRA DE PESQUISA E FILTROS */}
            <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between border border-[var(--color-border)]">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <input 
                        type="text" 
                        placeholder="Buscar cultura ou variedade..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 pl-12 pr-4 text-white placeholder-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                </div>
            </div>

            {/* LISTA EM CARDS */}
            {loading ? (
                <div className="glass-card p-16 flex flex-col items-center justify-center text-[var(--color-muted)]">
                    <Loader2 className="w-12 h-12 animate-spin mb-4 text-green-500" />
                    <p className="font-bold text-lg">Buscando banco de culturas...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-card p-16 rounded-3xl flex flex-col items-center justify-center text-[var(--color-muted)] border border-[var(--color-border)]">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Sprout className="w-10 h-10 text-[var(--color-muted)] opacity-50" />
                    </div>
                    <p className="font-black text-white text-2xl mb-2">Nenhuma cultura encontrada</p>
                    <p className="text-lg max-w-md text-center">Cadastre o que você está plantando agora para monitorar a safra.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(c => (
                        <div key={c.id} className="glass-card rounded-3xl overflow-hidden group hover:-translate-y-1 transition-all">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-white leading-tight mb-1">{c.nome}</h3>
                                        <div className="inline-block bg-[var(--color-background)] border border-[var(--color-border)] px-3 py-1 rounded-lg text-sm font-bold text-green-400">
                                            {c.variedade || 'Variedade Genérica'}
                                        </div>
                                    </div>
                                    {!clientOverrideId && (
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openModal(c)} className="p-2.5 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] rounded-xl transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(c)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 shadow-inner">
                                            <Scale className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider mb-1">QTD / Área Plantada</p>
                                            <p className="text-xl font-black text-white">{c.quantidade} <span className="text-sm font-bold text-[var(--color-muted)]">{c.unidade_medida}</span></p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-inner">
                                            <CalendarDays className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider mb-1">Data do Plantio</p>
                                            <p className="text-lg font-bold text-white">{c.data_plantio ? new Date(c.data_plantio).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-black/30 p-5 border-t border-[var(--color-border)] flex justify-between items-center">
                                <span className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider">Fase Atual</span>
                                <span className={`text-xs font-black tracking-wider uppercase px-3 py-1.5 rounded-lg border shadow-sm ${getStatusColor(c.status)}`}>
                                    {c.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            <DraggableModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <div className="flex items-center gap-3">
                        <Leaf className="w-6 h-6 text-green-500 bg-green-500/10 rounded-lg p-1" />
                        {editItem ? 'Editar Cultura' : 'Cadastrar Cultura'}
                    </div>
                }
            >
                <div className="p-2 overflow-y-auto">
                            <form id="culturaForm" onSubmit={handleSave} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Nome da Cultura *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={form.nome}
                                        onChange={(e) => setForm({...form, nome: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl focus:ring-2 focus:ring-green-500 p-3 transition-all"
                                        placeholder="Ex: Soja, Milho, Feijão"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Variedade / Híbrido</label>
                                    <input 
                                        type="text" 
                                        value={form.variedade}
                                        onChange={(e) => setForm({...form, variedade: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl focus:ring-2 focus:ring-green-500 p-3 transition-all"
                                        placeholder="Ex: M8349 IPRO"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Quantidade / Área *</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                required
                                                value={form.quantidade}
                                                onChange={(e) => setForm({...form, quantidade: e.target.value})}
                                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl focus:ring-2 focus:ring-green-500 p-3 transition-all"
                                                placeholder="Ex: 100"
                                            />
                                            <div className="w-1/3">
                                                <SearchableSelect
                                                    value={form.unidade_medida}
                                                    onChange={(val) => setForm({...form, unidade_medida: val})}
                                                    options={[
                                                        { label: 'HA', value: 'HA' },
                                                        { label: 'PÉS', value: 'PÉS' },
                                                        { label: 'M²', value: 'M²' },
                                                        { label: 'ESTUFAS', value: 'ESTUFAS' }
                                                    ]}
                                                    allowCustom={false}
                                                    placeholder="Unidade"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Data do Plantio</label>
                                        <input 
                                            type="date" 
                                            value={form.data_plantio}
                                            onChange={(e) => setForm({...form, data_plantio: e.target.value})}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl focus:ring-2 focus:ring-green-500 p-3 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Fase / Status</label>
                                    <SearchableSelect
                                        value={form.status}
                                        onChange={(val) => setForm({...form, status: val})}
                                        options={[
                                            { label: 'Preparo de Solo', value: 'PREPARO DE SOLO' },
                                            { label: 'Em Crescimento', value: 'EM CRESCIMENTO' },
                                            { label: 'Alerta: Praga/Doença', value: 'PRAGA/DOENÇA' },
                                            { label: 'Pronto para Colheita', value: 'PRONTO PARA COLHEITA' },
                                            { label: 'Já Colhido', value: 'COLHIDO' }
                                        ]}
                                        allowCustom={false}
                                        placeholder="Selecione a fase..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3 bg-white/[0.02]">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-[var(--color-muted)] hover:text-white hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                form="culturaForm"
                                disabled={saving}
                                className="flex-1 py-3.5 rounded-xl font-black text-white bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                Salvar Cultura
                            </button>
                        </div>
            </DraggableModal>
        </div>
    );
}
