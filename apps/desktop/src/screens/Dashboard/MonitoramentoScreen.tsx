import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
    Activity, 
    Plus, 
    Search, 
    Bug, 
    AlertTriangle, 
    CheckCircle2,
    Loader2
} from 'lucide-react';

interface Monitoramento {
    id: string;
    data_registro: string;
    tipo: string;
    nivel_infeccao: string;
    observacao: string;
    talhao_nome?: string;
}

export default function MonitoramentoScreen() {
    const [registros, setRegistros] = useState<Monitoramento[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form
    const [form, setForm] = useState({
        data_registro: new Date().toISOString().split('T')[0],
        tipo: 'PRAGA',
        nivel_infeccao: 'BAIXO',
        observacao: '',
        talhao_nome: ''
    });

    const fetchRegistros = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('monitoramento')
                .select('*')
                .order('data_registro', { ascending: false });

            if (error) {
                // If table doesn't exist yet, just ignore for now
                console.log('Tabela monitoramento pode não existir ainda:', error);
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
            data_registro: new Date().toISOString().split('T')[0],
            tipo: 'PRAGA',
            nivel_infeccao: 'BAIXO',
            observacao: '',
            talhao_nome: ''
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            data_registro: form.data_registro,
            tipo: form.tipo,
            nivel_infeccao: form.nivel_infeccao,
            observacao: form.observacao,
            talhao_nome: form.talhao_nome
        };

        try {
            const { error } = await supabase.from('monitoramento').insert([payload]);
            if (error) {
                alert('Aviso: A tabela "monitoramento" ainda não foi criada no banco de dados. Os dados são apenas visuais por enquanto.');
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
        (r.observacao?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (r.talhao_nome?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getNivelColor = (nivel: string) => {
        switch (nivel) {
            case 'BAIXO': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'MÉDIO': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
            case 'ALTO': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'CRÍTICO': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Activity className="w-8 h-8 text-orange-500" />
                        Monitoramento de Pragas
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Check-in de pragas e doenças identificadas no campo.
                    </p>
                </div>
                
                <button 
                    onClick={openModal}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Novo Check-in
                </button>
            </div>

            <div className="glass p-4 rounded-2xl mb-8 flex items-center">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <input 
                        type="text" 
                        placeholder="Buscar por talhão ou observação..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-[var(--color-muted)] focus:outline-none focus:border-orange-500 transition-all"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-[var(--color-muted)]">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-orange-500" />
                    <p className="font-bold">Buscando registros...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-[var(--color-muted)] border border-[var(--color-border)]">
                    <CheckCircle2 className="w-16 h-16 mb-4 text-green-500/50" />
                    <p className="font-bold text-white text-xl mb-2">Área Limpa!</p>
                    <p className="text-sm">Nenhum registro de praga ou doença foi reportado recentemente.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((r, index) => (
                        <div key={r.id || index} className="glass rounded-3xl border border-[var(--color-border)] overflow-hidden group hover:-translate-y-1 transition-all">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${r.tipo === 'PRAGA' ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {r.tipo === 'PRAGA' ? <Bug className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-white leading-tight">{r.tipo}</h3>
                                            <p className="text-sm text-[var(--color-muted)] mt-1">{new Date(r.data_registro).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider mb-1">Local / Talhão</p>
                                        <p className="text-white font-bold">{r.talhao_nome || 'Local não especificado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--color-muted)] font-bold uppercase tracking-wider mb-1">Observações</p>
                                        <p className="text-white text-sm">{r.observacao}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-black/20 p-4 border-t border-[var(--color-border)] flex justify-between items-center">
                                <span className="text-xs text-[var(--color-muted)] font-bold uppercase">Nível de Infecção:</span>
                                <span className={`text-xs font-bold px-3 py-1 rounded-lg border ${getNivelColor(r.nivel_infeccao)}`}>
                                    {r.nivel_infeccao}
                                </span>
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
                                Registrar Monitoramento
                            </h2>
                        </div>
                        
                        <div className="p-6">
                            <form id="monitoramentoForm" onSubmit={handleSave} className="flex flex-col gap-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Data *</label>
                                        <input 
                                            type="date" 
                                            required
                                            value={form.data_registro}
                                            onChange={(e) => setForm({...form, data_registro: e.target.value})}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-orange-500 p-3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Tipo *</label>
                                        <select
                                            value={form.tipo}
                                            onChange={(e) => setForm({...form, tipo: e.target.value})}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-orange-500 p-3"
                                        >
                                            <option value="PRAGA">Praga (Insetos)</option>
                                            <option value="DOENÇA">Doença (Fungo/Vírus)</option>
                                            <option value="ERVA DANINHA">Erva Daninha</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Nível de Infecção *</label>
                                    <select
                                        value={form.nivel_infeccao}
                                        onChange={(e) => setForm({...form, nivel_infeccao: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-orange-500 p-3"
                                    >
                                        <option value="BAIXO">Baixo (Controle preventivo)</option>
                                        <option value="MÉDIO">Médio (Atenção necessária)</option>
                                        <option value="ALTO">Alto (Ação imediata recomendada)</option>
                                        <option value="CRÍTICO">Crítico (Danos severos)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Local/Talhão Afetado</label>
                                    <input 
                                        type="text" 
                                        value={form.talhao_nome}
                                        onChange={(e) => setForm({...form, talhao_nome: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-orange-500 p-3"
                                        placeholder="Ex: Talhão 01, Lote B"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2">Observações / Detalhes</label>
                                    <textarea 
                                        rows={3}
                                        value={form.observacao}
                                        onChange={(e) => setForm({...form, observacao: e.target.value})}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl focus:ring-2 focus:ring-orange-500 p-3 resize-none"
                                        placeholder="Descreva o que foi encontrado (ex: Mosca Branca, Ferrugem Asiática)..."
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
                                Salvar Check-in
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
