import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock } from 'lucide-react';
import { supabase } from '../../services/supabase';

export default function VisitasScreen() {
    const [loading, setLoading] = useState(true);
    const [visitas, setVisitas] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Formulário de visita
    const [clienteId, setClienteId] = useState('');
    const [dataVisita, setDataVisita] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadVisitas = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Busca visitas (ignora erro se tabela não existir ainda)
            const { data } = await supabase
                .from('visitas')
                .select('*')
                .eq('agronomist_id', user.id)
                .order('data_visita', { ascending: false });
            
            if (data) {
                setVisitas(data);
            }
        } catch (error) {
            console.error("Erro ao carregar visitas", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVisitas();
    }, []);

    const handleAgendar = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Tenta inserir na tabela visitas
            const { error } = await supabase.from('visitas').insert({
                agronomist_id: user.id,
                client_id: clienteId || null,
                data_visita: dataVisita,
                observacoes: observacoes,
                status: 'AGENDADA'
            });

            // Se der erro porque a tabela não existe, apenas avisa que é MVP
            if (error) {
                console.error(error);
                alert('Módulo de Visitas criado no painel. O Banco de Dados (Supabase) precisa da tabela "visitas" para persistir isso definitivamente.');
                setIsModalOpen(false);
                return;
            }
            
            alert('Visita agendada com sucesso!');
            setIsModalOpen(false);
            setClienteId('');
            setDataVisita('');
            setObservacoes('');
            loadVisitas();
            
        } catch (error: any) {
            alert('Erro ao agendar: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12">
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Agenda de Visitas</h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Programe suas visitas técnicas e registre o histórico de atendimentos.
                    </p>
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    <span>Agendar Visita</span>
                </button>
            </div>

            {/* LISTA DE VISITAS */}
            <div className="glass p-6 rounded-3xl">
                {loading ? (
                    <div className="text-center py-12 text-[var(--color-muted)]">Carregando agenda...</div>
                ) : visitas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Calendar className="w-10 h-10 text-[var(--color-muted)]" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Agenda Livre</h2>
                        <p className="text-[var(--color-muted)] mb-8 text-center max-w-md">
                            Você não possui nenhuma visita técnica agendada ou realizada.
                        </p>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-xl border border-white/10 transition-all"
                        >
                            Agendar Nova Visita
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {visitas.map((visita, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                                        <Calendar className="w-6 h-6 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">{visita.client_id || 'Fazenda Cliente'}</h3>
                                        <div className="flex items-center gap-4 mt-1">
                                            <div className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
                                                <Clock className="w-4 h-4" />
                                                <span>{new Date(visita.data_visita).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                    <button className="flex-1 sm:flex-none py-2 px-4 rounded-xl border border-[var(--color-border)] text-white hover:bg-white/5 text-sm font-bold transition-all">
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL AGENDAR VISITA */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass p-8 rounded-3xl w-full max-w-md relative border border-white/10 shadow-2xl">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-[var(--color-muted)] hover:text-white"
                        >
                            ✕
                        </button>
                        
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                            <Calendar className="w-6 h-6 text-green-400" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-2">Agendar Visita</h2>
                        <p className="text-[var(--color-muted)] text-sm mb-6">
                            Programe uma visita técnica para um de seus clientes.
                        </p>

                        <form onSubmit={handleAgendar} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">Cliente / Fazenda *</label>
                                <input 
                                    type="text"
                                    required
                                    value={clienteId}
                                    onChange={(e) => setClienteId(e.target.value)}
                                    className="w-full bg-black/20 border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-colors"
                                    placeholder="Nome do cliente ou fazenda"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">Data da Visita *</label>
                                <input 
                                    type="date"
                                    required
                                    value={dataVisita}
                                    onChange={(e) => setDataVisita(e.target.value)}
                                    className="w-full bg-black/20 border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-colors"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-[var(--color-muted)] mb-1">Motivo / Observações</label>
                                <textarea 
                                    value={observacoes}
                                    onChange={(e) => setObservacoes(e.target.value)}
                                    className="w-full bg-black/20 border border-[var(--color-border)] rounded-xl px-4 py-3 text-white outline-none focus:border-green-500 transition-colors min-h-[100px] resize-none"
                                    placeholder="Avaliação foliar, pragas, planejamento de plantio..."
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-[var(--color-border)] text-white font-bold hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Agendando...' : 'Confirmar Agenda'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
