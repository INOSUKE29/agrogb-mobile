import React, { useState, useEffect } from 'react';
import { 
    Sprout, 
    Map, 
    Calendar, 
    Leaf, 
    Plus, 
    Trash2,
    RefreshCw
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import DraggableModal from '../../components/common/DraggableModal';

export default function PlantioScreen() {
    const [loading, setLoading] = useState(true);
    const [plantios, setPlantios] = useState<Record<string, string | number | boolean | null>[]>([]);
    const { clientOverrideId, user } = useAuth();
    
    // Selects
    const [talhoes, setTalhoes] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [culturas, setCulturas] = useState<Record<string, string | number | boolean | null>[]>([]);

    // Form
    const [showModal, setShowModal] = useState(false);
    const [talhaoId, setTalhaoId] = useState('');
    const [culturaId, setCulturaId] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [dataPlantio, setDataPlantio] = useState(new Date().toISOString().split('T')[0]);
    const [previsaoColheita, setPrevisaoColheita] = useState('');
    const [observacao, setObservacao] = useState('');

    const fetchDados = async () => {
        setLoading(true);
        try {
            const currentUserId = clientOverrideId || user?.id;

            // Load Talhoes
            let qTalhoes = supabase.from('v2_talhoes').select('*');
            if (currentUserId) qTalhoes = qTalhoes.eq('user_id', currentUserId);
            const { data: dataTalhoes } = await qTalhoes;
            
            // Load Culturas
            let qCulturas = supabase.from('v2_culturas').select('*');
            if (currentUserId) qCulturas = qCulturas.eq('user_id', currentUserId);
            const responseCulturas = await qCulturas;
            
            let dataCulturas = responseCulturas.data;
            if (responseCulturas.error) {
                let qFallbackCulturas = supabase.from('culturas').select('*').eq('is_deleted', 0);
                if (currentUserId) qFallbackCulturas = qFallbackCulturas.eq('propriedade_id', currentUserId);
                const fallback = await qFallbackCulturas;
                dataCulturas = fallback.data;
            }
            
            setTalhoes(dataTalhoes || []);
            setCulturas(dataCulturas || []);

            // Load Plantios
            let qPlantios = supabase.from('v2_plantios').select('*');
            if (currentUserId) qPlantios = qPlantios.eq('user_id', currentUserId);
            const { data: dataPlantios, error } = await qPlantios.order('created_at', { ascending: false });

            if (error && error.code === '42P01') {
                // Mock se não existir a tabela
                setPlantios([
                    {
                        id: 'mock-plantio-1',
                        talhao_nome: 'Gleba Sul 01',
                        cultura_nome: 'Soja',
                        quantidade_pes: 15000,
                        data_plantio: '2026-05-10',
                        previsao_colheita: 'OUTUBRO/2026',
                        observacao: 'Tratamento com fungicida preventivo.',
                        created_at: new Date().toISOString()
                    }
                ]);
            } else {
                setPlantios(dataPlantios || []);
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

        if (!talhaoId || !culturaId || !quantidade) {
            return toast.error("Área, Cultura e Quantidade são obrigatórios.");
        }

        const talhaoSelec = talhoes.find(t => t.id === talhaoId);
        const culturaSelec = culturas.find(c => (c.id || c.uuid) === culturaId);

        const currentUserId = clientOverrideId || user?.id;
        const payload = {
            talhao_id: talhaoId,
            talhao_nome: talhaoSelec?.nome || 'Talhão',
            cultura_id: culturaId,
            cultura_nome: culturaSelec?.nome || 'Cultura',
            quantidade_pes: parseInt(quantidade),
            data_plantio: dataPlantio,
            previsao_colheita: previsaoColheita,
            observacao: observacao,
            user_id: currentUserId
        };

        try {
            const { error } = await supabase.from('v2_plantios').insert([payload]);

            if (error && error.code === '42P01') {
                // Mock behavior
                setPlantios([{ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...plantios]);
            } else if (error) throw error;

            toast.success('Plantio registrado com sucesso!');
            setShowModal(false);
            setTalhaoId('');
            setCulturaId('');
            setQuantidade('');
            setPrevisaoColheita('');
            setObservacao('');
            fetchDados();
        } catch (error: unknown) {
            const err = error as Error | { message: string };
            toast.error('Erro ao salvar: ' + err.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Deseja realmente apagar este registro de plantio?")) return;

        try {
            const { error } = await supabase.from('v2_plantios').delete().eq('id', id);
            if (error && error.code === '42P01') {
                setPlantios(plantios.filter(p => p.id !== id));
                toast.success('Registro apagado (Modo Local)');
                return;
            } else if (error) throw error;

            toast.success('Registro apagado!');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao excluir registro.');
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-5xl mx-auto space-y-8">
            
            {/* HERO / HEADER */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-bold mb-4">
                            <Sprout className="w-4 h-4" /> Gestão Agronômica
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Ciclo de Plantio
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Registro e controle de novas culturas em campo, associando áreas produtivas (talhões) às variedades.
                        </p>
                    </div>
                    {!clientOverrideId && (
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Registrar Plantio
                        </button>
                    )}
                </div>
            </div>

            {/* LISTAGEM DE HISTÓRICO */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest">Histórico Recente</h2>
                    <button onClick={fetchDados} className="text-[var(--color-muted)] hover:text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>
                ) : plantios.length === 0 ? (
                    <div className="glass p-12 rounded-3xl text-center border border-dashed border-white/10">
                        <Leaf className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum plantio registrado</h3>
                        <p className="text-[var(--color-muted)]">O ciclo da sua lavoura começa aqui. Clique em "Registrar Plantio".</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plantios.map(item => (
                            <div key={item.id} className="glass p-6 rounded-2xl border border-[var(--color-border)] hover:border-emerald-500/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                            <Sprout className="w-6 h-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-white">{item.cultura_nome}</h3>
                                            <p className="text-[var(--color-muted)] text-sm flex items-center gap-1 font-medium mt-0.5">
                                                <Map className="w-3.5 h-3.5" /> {item.talhao_nome}
                                            </p>
                                        </div>
                                    </div>
                                    {!clientOverrideId && (
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            className="text-[var(--color-muted)] hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 space-y-2 border border-white/5">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-muted)] font-medium">Data Plantio:</span>
                                        <span className="text-white font-bold">{item.data_plantio ? new Date(item.data_plantio).toLocaleDateString('pt-BR') : '--'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--color-muted)] font-medium">Previsão Colheita:</span>
                                        <span className="text-emerald-400 font-bold">{item.previsao_colheita || '--'}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                                        <span className="text-[var(--color-muted)] font-medium">Quantidade (Pés/Sementes):</span>
                                        <span className="text-white font-black">{item.quantidade_pes?.toLocaleString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL REGISTRO */}
            <DraggableModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={
                    <div>
                        <h2 className="text-2xl font-black text-white">Registrar Plantio</h2>
                        <p className="text-emerald-400 text-xs font-bold tracking-widest mt-1">NOVO CICLO EM CAMPO</p>
                    </div>
                }
            >
                <div className="p-2 space-y-6">
                    <form id="plantioForm" onSubmit={handleSalvar} className="space-y-6">
                                
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        <Map className="w-4 h-4 text-emerald-400" /> Área de Plantio (Onde?) *
                                    </label>
                                    <select 
                                        required value={talhaoId} onChange={e => setTalhaoId(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="" disabled>Selecione um Talhão...</option>
                                        {talhoes.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        <Leaf className="w-4 h-4 text-emerald-400" /> Cultura (O Que?) *
                                    </label>
                                    <select 
                                        required value={culturaId} onChange={e => setCulturaId(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="" disabled>Selecione a cultura / variedade...</option>
                                        {culturas.map(c => <option key={c.id || c.uuid} value={c.id || c.uuid}>{c.nome} {c.variedade ? `- ${c.variedade}` : ''}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            QTD (Pés/Unid.) *
                                        </label>
                                        <input 
                                            required type="number" min="1" value={quantidade} onChange={e => setQuantidade(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="Ex: 1000"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Data do Plantio
                                        </label>
                                        <input 
                                            type="date" value={dataPlantio} onChange={e => setDataPlantio(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 outline-none [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        <Calendar className="w-4 h-4 text-slate-400" /> Previsão de Colheita
                                    </label>
                                    <input 
                                        type="text" value={previsaoColheita} onChange={e => setPrevisaoColheita(e.target.value.toUpperCase())}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="MÊS/ANO"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        Observações Relevantes
                                    </label>
                                    <textarea 
                                        rows={2} value={observacao} onChange={e => setObservacao(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 outline-none resize-none"
                                        placeholder="Detalhes sobre sementes, tratamentos..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] bg-white/[0.02] flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[var(--color-muted)] font-bold hover:bg-white/5 rounded-xl transition-all">Cancelar</button>
                            <button 
                                type="submit" form="plantioForm"
                                className="flex-1 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 rounded-xl text-white font-black shadow-lg shadow-emerald-500/20 transition-all"
                            >
                                Registrar Plantio
                            </button>
                        </div>
            </DraggableModal>

        </div>
    );
}
