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

interface Cultura {
    id: string;
    nome: string;
    variedade: string;
    area_ha: number;
    data_plantio: string;
    status: string;
    producao_total_kg: number;
}

export default function CulturasScreen() {
    const [culturas, setCulturas] = useState<Cultura[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<Cultura | null>(null);
    const [saving, setSaving] = useState(false);

    // Form
    const [form, setForm] = useState({
        nome: '',
        variedade: '',
        area_ha: '',
        data_plantio: '',
        status: 'EM CRESCIMENTO'
    });

    const fetchCulturas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('culturas')
                .select('*')
                .eq('is_deleted', 0)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCulturas(data || []);
        } catch (error) {
            console.error('Erro ao buscar culturas:', error);
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
                area_ha: String(cultura.area_ha || ''),
                data_plantio: cultura.data_plantio || '',
                status: cultura.status || 'EM CRESCIMENTO'
            });
        } else {
            setEditItem(null);
            setForm({ nome: '', variedade: '', area_ha: '', data_plantio: '', status: 'PREPARO DE SOLO' });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            nome: form.nome,
            variedade: form.variedade,
            area_ha: parseFloat(form.area_ha) || 0,
            data_plantio: form.data_plantio || null,
            status: form.status
        };

        try {
            if (editItem) {
                await supabase.from('culturas').update(payload).eq('id', editItem.id);
            } else {
                await supabase.from('culturas').insert([payload]);
            }
            setIsModalOpen(false);
            fetchCulturas();
        } catch (error) {
            console.error('Erro ao salvar cultura:', error);
            alert('Falha ao salvar');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, nome: string) => {
        if (!window.confirm(`Excluir a cultura de ${nome}?`)) return;
        try {
            await supabase.from('culturas').update({ is_deleted: 1 }).eq('id', id);
            fetchCulturas();
        } catch (error) {
            console.error(error);
        }
    };

    const filtered = culturas.filter(c => 
        (c.nome?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (c.variedade?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COLHIDO': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'EM CRESCIMENTO': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'PREPARO DE SOLO': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'PRAGA/DOENÇA': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Leaf className="w-8 h-8 text-green-500" />
                        Gestão de Culturas e Safras
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Acompanhe o que está plantado, status de crescimento e expectativas de colheita.
                    </p>
                </div>
                
                <button 
                    onClick={() => openModal()}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Nova Cultura
                </button>
            </div>

            {/* BARRA DE PESQUISA */}
            <div className="glass p-4 rounded-2xl mb-8 flex items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <input 
                        type="text" 
                        placeholder="Buscar cultura ou variedade..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-[var(--color-muted)] focus:outline-none focus:border-green-500 transition-all"
                    />
                </div>
            </div>

            {/* LISTA EM CARDS */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-[var(--color-muted)]">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-green-500" />
                    <p className="font-bold">Buscando plantações...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-[var(--color-muted)] border border-[var(--color-border)]">
                    <Sprout className="w-16 h-16 mb-4 text-gray-600" />
                    <p className="font-bold text-white text-xl mb-2">Nenhuma cultura encontrada</p>
                    <p className="text-sm">Cadastre o que você está plantando agora.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(c => (
                        <div key={c.id} className="glass rounded-3xl border border-[var(--color-border)] overflow-hidden group hover:-translate-y-1 transition-all">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-white leading-tight">{c.nome}</h3>
                                        <p className="text-sm font-bold text-green-400 mt-1">{c.variedade || 'Variedade não informada'}</p>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(c)} className="p-2 bg-white/5 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(c.id, c.nome)} className="p-2 bg-white/5 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                                            <Scale className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider">Área Plantada</p>
                                            <p className="text-white font-bold">{c.area_ha} hectares</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <CalendarDays className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider">Data do Plantio</p>
                                            <p className="text-white font-bold">{c.data_plantio ? new Date(c.data_plantio).toLocaleDateString('pt-BR') : 'Não definida'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-black/20 p-4 border-t border-[var(--color-border)] flex justify-between items-center">
                                <span className="text-xs text-[var(--color-muted)] font-bold uppercase">Status Atual:</span>
                                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${getStatusColor(c.status)}`}>
                                    {c.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
                    <div className="bg-[#121212] border border-[var(--color-border)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-[var(--color-border)] bg-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Leaf className="w-5 h-5 text-green-500" />
                                {editItem ? 'Editar Cultura' : 'Nova Cultura'}
                            </h2>
                        </div>
                        
                        <div className="p-6">
                            <form id="culturaForm" onSubmit={handleSave} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Nome da Cultura *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={form.nome}
                                        onChange={(e) => setForm({...form, nome: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-green-500 p-3"
                                        placeholder="Ex: Soja, Milho, Feijão"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Variedade</label>
                                    <input 
                                        type="text" 
                                        value={form.variedade}
                                        onChange={(e) => setForm({...form, variedade: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-green-500 p-3"
                                        placeholder="Ex: M8349 IPRO"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Área (ha) *</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            required
                                            value={form.area_ha}
                                            onChange={(e) => setForm({...form, area_ha: e.target.value})}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-green-500 p-3"
                                            placeholder="Ex: 100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Data do Plantio</label>
                                        <input 
                                            type="date" 
                                            value={form.data_plantio}
                                            onChange={(e) => setForm({...form, data_plantio: e.target.value})}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-green-500 p-3"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Status da Cultura</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({...form, status: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-green-500 p-3"
                                    >
                                        <option value="PREPARO DE SOLO">Preparo de Solo</option>
                                        <option value="EM CRESCIMENTO">Em Crescimento</option>
                                        <option value="PRAGA/DOENÇA">Alerta: Praga/Doença</option>
                                        <option value="PRONTO PARA COLHEITA">Pronto para Colheita</option>
                                        <option value="COLHIDO">Já Colhido</option>
                                    </select>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3 bg-white/5">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-[var(--color-muted)] hover:text-white hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                form="culturaForm"
                                disabled={saving}
                                className="px-6 py-3 rounded-xl font-bold text-white bg-green-600 hover:bg-green-500 transition-all flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                Salvar Cultura
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
