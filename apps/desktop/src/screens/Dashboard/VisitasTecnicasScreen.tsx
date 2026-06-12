import React, { useState, useEffect } from 'react';
import { 
    Calendar, 
    MapPin, 
    Clock, 
    Plus, 
    CheckCircle, 
    AlertCircle,
    MoreVertical,
    FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../services/supabase';
import { AgronomistService, TechnicalVisit, LinkedClient } from '../../../../../packages/services/src/agronomistService';

export default function VisitasTecnicasScreen() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [visitas, setVisitas] = useState<TechnicalVisit[]>([]);
    const [clientes, setClientes] = useState<LinkedClient[]>([]);

    // Form states
    const [formData, setFormData] = useState({
        data: '',
        hora: '',
        cliente_id: '',
        motivo: '',
        local: ''
    });

    const agronomistService = new AgronomistService(supabase);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [fetchedVisitas, fetchedClientes] = await Promise.all([
                agronomistService.getTechnicalVisits(),
                agronomistService.getLinkedClients()
            ]);
            setVisitas(fetchedVisitas);
            setClientes(fetchedClientes);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar visitas.');
        }
    };

    const handleAgendar = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dataHora = new Date(`${formData.data}T${formData.hora}:00`);
            
            await agronomistService.scheduleTechnicalVisit({
                client_id: formData.cliente_id,
                visit_date: dataHora.toISOString(),
                reason: formData.motivo,
                location: formData.local,
                status: 'PENDING'
            });

            toast.success('Visita agendada com sucesso!');
            setShowModal(false);
            setFormData({ data: '', hora: '', cliente_id: '', motivo: '', local: '' });
            await loadData();
        } catch (error) {
            console.error('Erro ao agendar visita:', error);
            toast.error('Não foi possível agendar a visita.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in pb-12 px-4 sm:px-6 lg:px-8 mt-6 max-w-[1400px] mx-auto relative">
            
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight drop-shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                            <Calendar className="w-5 h-5 text-indigo-400" />
                        </div>
                        Agenda de Visitas
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1 text-sm">
                        Planeje seu roteiro de visitas técnicas nas fazendas vinculadas.
                    </p>
                </div>
                
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 flex items-center gap-2 active:scale-95"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nova Visita</span>
                </button>
            </div>

            {/* TABELA DE VISITAS */}
            <div className="premium-card rounded-2xl overflow-hidden mt-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[rgba(255,255,255,0.05)] bg-white/5">
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Data / Hora</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Produtor (Fazenda)</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Motivo</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Local</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitas.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-[var(--color-muted)]">Nenhuma visita agendada.</td>
                                </tr>
                            ) : visitas.map((visita) => {
                                const dataObj = new Date(visita.visit_date);
                                const dataStr = dataObj.toLocaleDateString('pt-BR');
                                const horaStr = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                                const clienteEncontrado = clientes.find(c => c.client_id === visita.client_id);
                                
                                return (
                                <tr key={visita.id} className="border-b border-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-indigo-400" />
                                            <span className="font-bold text-white text-sm">{dataStr}, {horaStr}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-sm text-white">{clienteEncontrado ? clienteEncontrado.nome_completo : 'Produtor Desconhecido'}</p>
                                        <p className="text-xs text-[var(--color-muted)]">{clienteEncontrado ? clienteEncontrado.email : ''}</p>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-gray-300 font-medium">{visita.reason}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-sm text-gray-400">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {visita.location || 'Sede'}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                            visita.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                            visita.status === 'PENDING' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        }`}>
                                            {visita.status === 'COMPLETED' && <CheckCircle className="w-3.5 h-3.5" />}
                                            {visita.status === 'PENDING' && <AlertCircle className="w-3.5 h-3.5" />}
                                            {visita.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {visita.status !== 'COMPLETED' && (
                                                <button className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors border border-green-500/20" title="Marcar como Concluída">
                                                    <CheckCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button className="p-2 bg-white/5 hover:bg-white/10 text-[var(--color-muted)] rounded-lg transition-colors border border-white/10">
                                                <FileText className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL NOVA VISITA */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--color-background)] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        
                        <div className="p-6 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center bg-white/5">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                Agendar Visita
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-[var(--color-muted)] hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAgendar} className="p-6 space-y-5">
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Data</label>
                                    <input 
                                        type="date" 
                                        value={formData.data}
                                        onChange={(e) => setFormData({...formData, data: e.target.value})}
                                        className="w-full bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Hora</label>
                                    <input 
                                        type="time" 
                                        value={formData.hora}
                                        onChange={(e) => setFormData({...formData, hora: e.target.value})}
                                        className="w-full bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Cliente Vinculado</label>
                                <select 
                                    className="w-full bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors" 
                                    required
                                    value={formData.cliente_id}
                                    onChange={(e) => setFormData({...formData, cliente_id: e.target.value})}
                                >
                                    <option value="">Selecione o produtor...</option>
                                    {clientes.map(c => (
                                        <option key={c.client_id} value={c.client_id}>{c.nome_completo} ({c.email})</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Motivo da Visita</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Monitoramento de Pragas"
                                    value={formData.motivo}
                                    onChange={(e) => setFormData({...formData, motivo: e.target.value})}
                                    className="w-full bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wide">Talhão / Local</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Talhão 3"
                                    value={formData.local}
                                    onChange={(e) => setFormData({...formData, local: e.target.value})}
                                    className="w-full bg-[#1A1A1A] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-[rgba(255,255,255,0.1)]"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-50"
                                >
                                    {loading ? 'Agendando...' : 'Salvar Visita'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
