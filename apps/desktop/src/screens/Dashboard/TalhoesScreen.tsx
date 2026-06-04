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
    MapPin,
    AlertTriangle
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Skeleton } from '../../components/ui/Skeleton';
import { Modal } from '../../components/ui/Modal';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/TableBase';

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
    
    // Deletion Modal State
    const [itemToDelete, setItemToDelete] = useState<Talhao | null>(null);

    const fetchTalhoes = async () => {
        setLoading(true);
        try {
            // Tenta buscar da v2 primeiro
            const response = await supabase
                .from('v2_talhoes')
                .select('*')
                .order('nome', { ascending: true });
            
            let data = response.data;
            const error = response.error;
                
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

    useEffect(() => {
        fetchTalhoes();
    }, []);

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

    const [undoToast, setUndoToast] = useState<{ id: string, name: string, timer: NodeJS.Timeout } | null>(null);

    const handleDeleteClick = (item: Talhao) => {
        // Optimistic UI: Remove from view instantly
        setTalhoes(prev => prev.filter(t => t.uuid !== item.uuid));
        
        if (undoToast?.timer) clearTimeout(undoToast.timer);
        
        const timer = setTimeout(async () => {
            try {
                const idField = item.tableUsed === 'v2_talhoes' ? 'id' : 'uuid';
                if (item.tableUsed === 'v2_talhoes') {
                    await supabase.from('v2_talhoes').delete().eq(idField, item.uuid);
                } else {
                    await supabase.from('talhoes').update({ is_deleted: true, last_updated: new Date().toISOString() }).eq(idField, item.uuid);
                }
                setUndoToast(null);
            } catch (err) {
                console.error('Erro ao excluir talhão', err);
                toast.error('Falha ao sincronizar exclusão.');
                fetchTalhoes(); // rollback UI on error
            }
        }, 4000);

        setUndoToast({ id: item.uuid, name: item.nome, timer });
    };

    const handleUndoDelete = () => {
        if (!undoToast) return;
        clearTimeout(undoToast.timer);
        setUndoToast(null);
        fetchTalhoes(); // Restores the item
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
        <div className="animate-fade-in pb-12 space-y-8 relative">
            
            {/* TOAST DE DESFAZER (Optimistic UI) */}
            {undoToast && (
                <div className="fixed bottom-8 right-8 z-50 animate-fade-in">
                    <div className="glass bg-[var(--color-card)]/95 border border-[var(--color-border)] shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-md">
                        <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[var(--color-foreground)] font-bold text-sm">Talhão excluído.</p>
                            <p className="text-[var(--color-muted)] text-xs">{undoToast.name}</p>
                        </div>
                        <button 
                            onClick={handleUndoDelete}
                            className="px-4 py-2 bg-[var(--color-foreground)]/10 hover:bg-[var(--color-foreground)]/20 text-[var(--color-foreground)] text-sm font-bold rounded-xl transition-colors whitespace-nowrap active:scale-95"
                        >
                            Desfazer
                        </button>
                    </div>
                </div>
            )}

            {/* CABEÇALHO HERO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <MapPin className="w-4 h-4" /> Inteligência Geoespacial
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
                            Gestão de Talhões
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Mapeie suas áreas de plantio, acompanhe a área produtiva e registre as características do solo.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => openModal()}
                        className="px-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-gray-900 dark:text-white font-bold shadow-lg shadow-[var(--color-primary)]/20 transition-all group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Novo Talhão
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass p-6 rounded-3xl flex items-center justify-between group bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 shadow-xl shadow-slate-200/60 dark:shadow-none hover:border-white/10 hover:-translate-y-1 transition-all overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Total de Áreas</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{talhoes.length} <span className="text-sm text-[var(--color-muted)] font-medium">talhões mapeados</span></h3>
                    </div>
                    <div className="relative z-10 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-[var(--color-primary)]/10 transition-colors">
                        <Map className="w-5 h-5 text-gray-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors" />
                    </div>
                </div>
                <div className="glass p-6 rounded-3xl flex items-center justify-between group bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 shadow-xl shadow-slate-200/60 dark:shadow-none hover:border-[var(--color-primary)]/30 hover:-translate-y-1 transition-all overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Área Produtiva Total</p>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white">{totalArea.toFixed(2)} <span className="text-xl text-[var(--color-muted)] font-black">ha</span></h3>
                    </div>
                    <div className="relative z-10 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-[var(--color-primary)]/10 transition-colors">
                        <Maximize className="w-5 h-5 text-gray-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors" />
                    </div>
                </div>
                <div className="glass p-6 rounded-3xl flex items-center justify-between group bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/5 shadow-xl shadow-slate-200/60 dark:shadow-none hover:border-white/10 hover:-translate-y-1 transition-all overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Status Base de Dados</p>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)]" />
                            Sincronizado
                        </h3>
                    </div>
                    <div className="relative z-10 w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-[var(--color-primary)]/10 transition-colors">
                        <Leaf className="w-5 h-5 text-gray-900 dark:text-white group-hover:text-[var(--color-primary)] transition-colors" />
                    </div>
                </div>
            </div>

            {/* TABELA DE DADOS PREMIUM */}
            <Card className="flex flex-col p-0">
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-slate-50 to-transparent dark:from-white/[0.02]">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">Relação de Talhões</h2>
                    <div className="relative w-full sm:w-80">
                        <Input 
                            placeholder="Pesquisar por nome ou área..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            leftIcon={<Search className="h-5 w-5" />}
                            className="bg-white dark:bg-[#111111]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto p-4 pt-0">
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Identificação / Nome</Th>
                                <Th>Extensão (ha)</Th>
                                <Th>Detalhes do Solo / Obs.</Th>
                                <Th className="text-right">Ações</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <Tr key={`skel-${i}`}>
                                        <Td><Skeleton className="h-12 w-full" /></Td>
                                        <Td><Skeleton className="h-8 w-24" /></Td>
                                        <Td><Skeleton className="h-6 w-48" /></Td>
                                        <Td>
                                            <div className="flex justify-end gap-2">
                                                <Skeleton className="h-10 w-10" />
                                                <Skeleton className="h-10 w-10" />
                                            </div>
                                        </Td>
                                    </Tr>
                                ))
                            ) : filteredTalhoes.length === 0 ? (
                                <Tr>
                                    <Td colSpan={4} className="py-12">
                                        <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-white/[0.02] border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-12 max-w-2xl mx-auto relative overflow-hidden group hover:border-[var(--color-primary)]/50 transition-colors">
                                            <div className="w-24 h-24 bg-[var(--color-primary)]/10 rounded-full flex items-center justify-center mb-6 relative z-10 border border-[var(--color-primary)]/20 shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.2)]">
                                                <MapPin className="w-12 h-12 text-[var(--color-primary)]" />
                                            </div>
                                            <p className="text-gray-900 dark:text-white font-black text-2xl mb-3 relative z-10">Nenhuma área demarcada</p>
                                            <p className="text-slate-500 dark:text-[var(--color-muted)] text-lg mb-8 text-center max-w-md relative z-10">
                                                Inicie mapeando seu primeiro talhão para habilitar as funções de plantio e monitoramento.
                                            </p>
                                            <Button onClick={() => openModal()} size="lg" leftIcon={<Plus className="w-5 h-5" />}>
                                                Cadastrar Primeiro Talhão
                                            </Button>
                                        </div>
                                    </Td>
                                </Tr>
                            ) : (
                                filteredTalhoes.map((talhao) => (
                                    <Tr key={talhao.uuid} className="group">
                                        <Td>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-[var(--color-primary)]/10 flex items-center justify-center border border-[var(--color-primary)]/20 group-hover:scale-110 transition-transform">
                                                    <Map className="w-6 h-6 text-[var(--color-primary)]" />
                                                </div>
                                                <span className="font-black text-gray-900 dark:text-white text-lg">{talhao.nome}</span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <div className="inline-flex items-baseline gap-1 bg-emerald-50 dark:bg-green-500/10 px-3 py-1 rounded-lg border border-emerald-200 dark:border-green-500/20">
                                                <span className="font-black text-[var(--color-primary)] dark:text-green-400 text-lg">{talhao.area_ha.toLocaleString('pt-BR')}</span> 
                                                <span className="text-xs font-bold text-emerald-600 dark:text-green-500 uppercase">Hectares</span>
                                            </div>
                                        </Td>
                                        <Td>
                                            <span className="text-sm font-medium">{talhao.observacao || 'Nenhum detalhe informado'}</span>
                                        </Td>
                                        <Td className="text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="secondary" size="sm" onClick={() => openModal(talhao)}>
                                                    <Edit2 className="w-4 h-4" />
                                                </Button>
                                                <Button variant="danger" size="sm" onClick={() => handleDeleteClick(talhao)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </Td>
                                    </Tr>
                                ))
                            )}
                        </Tbody>
                    </Table>
                </div>
            </Card>

            {/* MODAL CADASTRAR/EDITAR */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editItem ? 'Editar Talhão' : 'Demarcar Novo Talhão'}
                maxWidth="md"
            >
                <form id="talhaoForm" onSubmit={handleSave} className="space-y-5">
                    <Input 
                        label="Identificação do Talhão *"
                        required
                        value={form.nome}
                        onChange={(e) => setForm({...form, nome: e.target.value})}
                        placeholder="Ex: T-01 SOJA"
                        className="uppercase"
                    />
                    
                    <Input 
                        label="Extensão Produtiva em Hectares (ha) *"
                        type="number"
                        step="0.01"
                        required
                        value={form.area_ha}
                        onChange={(e) => setForm({...form, area_ha: e.target.value})}
                        placeholder="Ex: 15.5"
                    />

                    <div>
                        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
                            Características do Solo / Observações
                        </label>
                        <textarea 
                            rows={4}
                            value={form.observacao}
                            onChange={(e) => setForm({...form, observacao: e.target.value})}
                            className="w-full bg-slate-50 dark:bg-[var(--color-background)] border border-slate-200 dark:border-[var(--color-border)] text-gray-900 dark:text-white text-sm rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all resize-none"
                            placeholder="Solo arenoso, curva de nível, etc."
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-white/5 mt-6">
                        <Button type="button" variant="ghost" onClick={closeModal} fullWidth>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" fullWidth>
                            {editItem ? 'Salvar Alterações' : 'Confirmar Demarcação'}
                        </Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
}
