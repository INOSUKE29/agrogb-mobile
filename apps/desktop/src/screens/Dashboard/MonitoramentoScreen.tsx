import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
    Activity, 
    Plus, 
    Search, 
    Bug, 
    AlertTriangle, 
    CheckCircle2,
    Loader2,
    MapPin,
    Camera
} from 'lucide-react';
import SearchableSelect from '../../components/common/SearchableSelect';
import { v4 as uuidv4 } from 'uuid';

interface MonitoramentoMidia {
    caminho_arquivo: string;
    tipo: string;
}

interface Monitoramento {
    uuid: string;
    criado_em: string;
    tipo: string;
    observacao_usuario: string;
    nivel_confianca: string;
    status: string;
    geoloc?: string;
    v2_monitoramentos_midia?: MonitoramentoMidia[];
}

export default function MonitoramentoScreen() {
    const [registros, setRegistros] = useState<Monitoramento[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form Mock
    const [form, setForm] = useState({
        tipo: 'PRAGA',
        nivel_confianca: 'TÉCNICO',
        observacao_usuario: '',
    });

    const fetchRegistros = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('v2_monitoramentos')
                .select(`
                    *,
                    v2_monitoramentos_midia ( caminho_arquivo, tipo )
                `)
                .order('criado_em', { ascending: false });

            if (error) {
                console.log('Tabela v2_monitoramentos pode não existir ainda:', error);
                setRegistros([]);
            } else {
                setRegistros(data || []);
            }
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRegistros();
    }, []);

    const openModal = () => {
        setForm({
            tipo: 'PRAGA',
            nivel_confianca: 'TÉCNICO',
            observacao_usuario: '',
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            uuid: uuidv4(),
            criado_em: new Date().toISOString(),
            tipo: form.tipo,
            nivel_confianca: form.nivel_confianca,
            observacao_usuario: form.observacao_usuario,
            status: 'ABERTO',
            geoloc: '-15.7801,-47.9292', // Mock GPS
            sync_status: 1
        };

        try {
            const { error } = await supabase.from('v2_monitoramentos').insert([payload]);
            if (error) {
                alert('Erro ao salvar em v2_monitoramentos. Verifique o banco.');
            } else {
                fetchRegistros();
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const filtered = registros.filter(r => 
        (r.observacao_usuario?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (r.tipo?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-orange-500" />
                        Monitoramento V2 (Galeria de Campo)
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Laudos agronômicos e fotos de pragas diretamente do aplicativo móvel.
                    </p>
                </div>
                
                <button 
                    onClick={openModal}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Simular Check-in
                </button>
            </div>

            <div className="glass p-4 rounded-2xl mb-8 flex items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <input 
                        type="text" 
                        placeholder="Buscar por observação ou praga..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-[var(--color-muted)] focus:outline-none focus:border-orange-500 transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-[var(--color-muted)]">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-500" />
                    <p className="font-bold">Sincronizando com o campo...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-[var(--color-muted)] border border-[var(--color-border)]">
                    <CheckCircle2 className="w-16 h-16 mb-4 text-green-500/50" />
                    <p className="font-bold text-white text-xl mb-2">Área Limpa!</p>
                    <p className="text-sm">Nenhum registro de praga ou doença foi enviado pelo aplicativo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((r, index) => (
                        <div key={r.uuid || index} className="glass rounded-3xl border border-[var(--color-border)] overflow-hidden group hover:-translate-y-1 transition-all flex flex-col">
                            {/* Galeria de Fotos */}
                            {r.v2_monitoramentos_midia && r.v2_monitoramentos_midia.length > 0 ? (
                                <div className="h-48 w-full bg-black/40 relative overflow-hidden">
                                    <img 
                                        src={r.v2_monitoramentos_midia[0].caminho_arquivo} 
                                        alt="Evidência de campo" 
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                    />
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                                        <Camera className="w-3.5 h-3.5 text-white" />
                                        <span className="text-xs text-white font-bold">{r.v2_monitoramentos_midia.length}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-24 w-full bg-gradient-to-br from-[#1E1E1E] to-black relative overflow-hidden flex items-center justify-center border-b border-[var(--color-border)]">
                                    <span className="text-[var(--color-muted)] text-sm flex items-center gap-2">
                                        <Camera className="w-4 h-4" /> Sem foto anexada
                                    </span>
                                </div>
                            )}

                            <div className="p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.tipo === 'PRAGA' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {r.tipo === 'PRAGA' ? <Bug className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-white leading-tight">{r.tipo || 'Desconhecido'}</h3>
                                                <p className="text-xs text-[var(--color-muted)] mt-1">{new Date(r.criado_em).toLocaleDateString('pt-BR')} às {new Date(r.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-4">
                                        <div>
                                            <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider mb-1">Laudo / Observações</p>
                                            <p className="text-white text-sm line-clamp-3">{r.observacao_usuario || 'Nenhum detalhe informado.'}</p>
                                        </div>
                                        {r.geoloc && (
                                            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold bg-blue-500/10 self-start px-2 py-1 rounded border border-blue-500/20 w-fit">
                                                <MapPin className="w-3.5 h-3.5" />
                                                GPS: {r.geoloc}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex justify-between items-center">
                                    <span className="text-xs text-[var(--color-muted)] font-bold uppercase">Status / Confiança:</span>
                                    <span className="text-xs font-bold px-3 py-1 rounded-lg border bg-green-500/20 text-green-400 border-green-500/30">
                                        {r.status} - {r.nivel_confianca}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[#121212] border border-[var(--color-border)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-[var(--color-border)] bg-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Activity className="w-5 h-5 text-orange-500" />
                                Registrar Monitoramento V2
                            </h2>
                        </div>
                        
                        <div className="p-6">
                            <form id="monitoramentoForm" onSubmit={handleSave} className="flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Tipo *</label>
                                        <SearchableSelect
                                            value={form.tipo}
                                            onChange={(val) => setForm({...form, tipo: val})}
                                            options={[
                                                { label: 'Praga (Insetos)', value: 'PRAGA' },
                                                { label: 'Doença (Fungo/Vírus)', value: 'DOENÇA' },
                                                { label: 'Erva Daninha', value: 'DANINHA' }
                                            ]}
                                            allowCustom={false}
                                            placeholder="Selecione o Tipo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Confiança *</label>
                                        <SearchableSelect
                                            value={form.nivel_confianca}
                                            onChange={(val) => setForm({...form, nivel_confianca: val})}
                                            options={[
                                                { label: 'Informativo', value: 'INFORMATIVO' },
                                                { label: 'Técnico', value: 'TÉCNICO' },
                                                { label: 'Validado', value: 'VALIDADO' }
                                            ]}
                                            allowCustom={false}
                                            placeholder="Confiança"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Observações (Laudo)</label>
                                    <textarea 
                                        rows={4}
                                        value={form.observacao_usuario}
                                        onChange={(e) => setForm({...form, observacao_usuario: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-orange-500 p-3 resize-none"
                                        placeholder="Ex: Identificado foco de ferrugem asiática..."
                                    />
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
                                form="monitoramentoForm"
                                disabled={saving}
                                className="px-6 py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-500 transition-all flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                                Salvar V2
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
