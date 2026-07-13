import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Truck, Search, Plus, Filter, Wrench, AlertTriangle, CheckCircle, Clock, PenTool } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from '../../components/common/SearchableSelect';

export default function FrotaScreen() {
    const [frota, setFrota] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Formulário do Modal
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('TRATOR');
    const [placa, setPlaca] = useState('');
    const [horimetro, setHorimetro] = useState('');

    const fetchFrota = async () => {
        try {
            setLoading(true);
            const response = await supabase
                .from('v2_maquinas')
                .select('*')
                .order('nome', { ascending: true });
            
            let data = response.data;
            const error = response.error;

            if (error) {
                const fallback = await supabase.from('farm_machines').select('*').order('nome', { ascending: true });
                if (fallback.error) {
                    throw fallback.error;
                } else {
                    data = fallback.data;
                }
            }

            const normalizedData = (data || []).map(item => ({
                uuid: item.id || item.uuid,
                nome: item.nome,
                tipo: item.tipo,
                placa: item.placa,
                horimetro: item.horimetro_atual || item.horimetro || 0,
                status: item.status || 'ATIVO',
                tableUsed: item.id ? 'v2_maquinas' : 'farm_machines'
            }));

            setFrota(normalizedData);
        } catch (error: unknown) {
            const _err = error as Error;
            console.error('Erro ao buscar frota:', error);
            toast.error('Não foi possível carregar as máquinas. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFrota();
    }, []);

    const handleSaveMachine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome) {
            toast.error('O nome da máquina é obrigatório.');
            return;
        }

        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData.user?.id;

            // Try to insert in v2_maquinas first
            const { error } = await supabase
                .from('v2_maquinas')
                .insert([{
                    user_id: userId,
                    nome: nome,
                    tipo: tipo,
                    placa: placa,
                    horimetro_atual: parseFloat(horimetro) || 0,
                    status: 'ATIVO'
                }]);
            
            if (error) {
                // Fallback
                const { error: fallbackError } = await supabase
                    .from('farm_machines')
                    .insert([{
                        user_id: userId,
                        nome: nome,
                        tipo: tipo,
                        placa: placa,
                        horimetro: parseFloat(horimetro) || 0,
                        status: 'ATIVO'
                    }]);
                if (fallbackError) throw fallbackError;
            }

            toast.success('Máquina cadastrada com sucesso!');
            setShowModal(false);
            setNome('');
            setPlaca('');
            setHorimetro('');
            fetchFrota();

        } catch (error: unknown) {
            const err = error as Error | { message: string };
            console.error('Erro ao cadastrar:', error);
            toast.error(err.message || 'Falha ao cadastrar máquina.');
        }
    };

    const toggleStatus = async (uuid: string, currentStatus: string, tableUsed: string) => {
        const novoStatus = currentStatus === 'ATIVO' ? 'MANUTENÇÃO' : 'ATIVO';
        try {
            const idField = tableUsed === 'v2_maquinas' ? 'id' : 'uuid';
            const { error } = await supabase
                .from(tableUsed)
                .update({ status: novoStatus })
                .eq(idField, uuid);

            if (error) throw error;
            toast.success(`Status alterado para ${novoStatus}`);
            fetchFrota();
        } catch (error: unknown) {
            const _err = error as Error;
            toast.error('Erro ao atualizar status.');
        }
    };

    const filteredFrota = frota.filter(item => 
        item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.placa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const ativos = frota.filter(f => f.status === 'ATIVO').length;
    const manutencao = frota.filter(f => f.status === 'MANUTENÇÃO').length;

    const getStatusIcon = (status: string) => {
        if (status === 'ATIVO') return <CheckCircle className="w-6 h-6 text-green-400" />;
        if (status === 'MANUTENÇÃO') return <Wrench className="w-6 h-6 text-orange-400" />;
        return <AlertTriangle className="w-6 h-6 text-red-400" />;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* CABEÇALHO HERO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <PenTool className="w-4 h-4" /> Gestão de Ativos
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Gestão de Frota
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Controle de maquinários, manutenção preventiva e monitoramento de horímetros.
                        </p>
                    </div>
                    <button 
                        onClick={() => setShowModal(true)}
                        className="px-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-[var(--color-primary)] hover:opacity-90 text-white font-bold shadow-lg shadow-[var(--color-primary)]/20 transition-all group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        Nova Máquina
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 flex items-center justify-between group">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Total da Frota</p>
                        <h3 className="text-3xl font-black text-white">{frota.length}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Truck className="w-7 h-7 text-blue-500" />
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center justify-between group">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Operacional</p>
                        <h3 className="text-3xl font-black text-green-400">{ativos}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-7 h-7 text-green-500" />
                    </div>
                </div>
                <div className="glass-card p-6 flex items-center justify-between group border-b-4 border-orange-500">
                    <div>
                        <p className="text-[var(--color-muted)] font-bold text-sm uppercase tracking-wider mb-1">Em Manutenção</p>
                        <h3 className="text-3xl font-black text-orange-400">{manutencao}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Wrench className="w-7 h-7 text-orange-500" />
                    </div>
                </div>
            </div>

            {/* BARRA DE PESQUISA E FILTROS */}
            <div className="glass p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between border border-[var(--color-border)]">
                <div className="relative w-full md:w-96">
                    <Search className="w-5 h-5 text-[var(--color-muted)] absolute left-4 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou placa..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none transition-all"
                    />
                </div>
                <button className="w-full md:w-auto px-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold transition-all">
                    <Filter className="w-4 h-4" />
                    Filtros Avançados
                </button>
            </div>

            {/* GRID DE MÁQUINAS */}
            {loading ? (
                <div className="glass-card p-16 flex flex-col items-center justify-center text-[var(--color-muted)]">
                    <div className="w-10 h-10 border-4 border-[var(--color-primary)]/30 border-t-[var(--color-primary)] rounded-full animate-spin mb-4"></div>
                    <p className="font-medium text-lg">Sincronizando frota...</p>
                </div>
            ) : filteredFrota.length === 0 ? (
                <div className="glass-card p-16 text-center text-[var(--color-muted)] flex flex-col items-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Truck className="w-10 h-10 opacity-50" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Nenhuma máquina encontrada</h3>
                    <p className="text-lg max-w-md mx-auto">Cadastre seu primeiro maquinário para começar a rastrear horas e manutenções.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFrota.map(item => (
                        <div key={item.uuid} className={`glass-card p-6 flex flex-col relative overflow-hidden group transition-all hover:-translate-y-1 ${item.status === 'MANUTENÇÃO' ? 'border-orange-500/30' : ''}`}>
                            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all ${item.status === 'ATIVO' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <div>
                                    <h3 className="text-2xl font-black text-white mb-1 truncate" title={item.nome}>{item.nome}</h3>
                                    <div className="inline-block bg-[var(--color-background)] border border-[var(--color-border)] px-3 py-1 rounded-lg text-sm font-bold text-[var(--color-primary)]">
                                        {item.tipo}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleStatus(item.uuid, item.status, item.tableUsed)}
                                    className={`p-3 rounded-2xl transition-all shadow-lg ${item.status === 'ATIVO' ? 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20' : 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20'}`}
                                    title="Clique para alternar o status"
                                >
                                    {getStatusIcon(item.status)}
                                </button>
                            </div>
                            
                            <div className="space-y-3 mt-auto relative z-10">
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider">Placa/Identificação</span>
                                    <span className="text-base font-black text-white">{item.placa || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <span className="text-sm font-bold text-[var(--color-muted)] uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Horímetro
                                    </span>
                                    <span className="text-xl font-black text-[var(--color-primary)]">{item.horimetro} <span className="text-sm font-bold text-[var(--color-muted)]">h</span></span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DE NOVA MÁQUINA */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
                    <div className="glass border border-[var(--color-border)] rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 animate-fade-in flex flex-col max-h-[90vh]">
                        <div className="h-2 w-full bg-[var(--color-primary)]"></div>
                        
                        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-white/[0.02]">
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <Plus className="text-[var(--color-primary)] w-8 h-8 bg-[var(--color-primary)]/10 rounded-lg p-1" />
                                Cadastrar Máquina
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-[var(--color-muted)] hover:text-white p-2 bg-white/5 rounded-full transition-colors">
                                &times;
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <form id="frotaForm" onSubmit={handleSaveMachine} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Nome/Modelo *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                                        placeholder="Ex: Trator John Deere 6100J"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Categoria / Tipo *</label>
                                    <SearchableSelect 
                                        value={tipo}
                                        onChange={(val) => setTipo(val)}
                                        options={[
                                            { label: 'Trator', value: 'TRATOR' },
                                            { label: 'Colheitadeira', value: 'COLHEITADEIRA' },
                                            { label: 'Pulverizador', value: 'PULVERIZADOR' },
                                            { label: 'Caminhão / Veículo Pesado', value: 'CAMINHÃO' },
                                            { label: 'Caminhonete / Veículo Leve', value: 'VEÍCULO LEVE' },
                                            { label: 'Implemento Agrícola', value: 'IMPLEMENTO' },
                                            { label: 'Outros Equipamentos', value: 'OUTROS' }
                                        ]}
                                        allowCustom={false}
                                        placeholder="Selecione a Categoria"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Placa/Identificação</label>
                                        <input 
                                            type="text" 
                                            value={placa}
                                            onChange={(e) => setPlaca(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all uppercase"
                                            placeholder="ABC-1234"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-[var(--color-muted)] mb-2 uppercase tracking-wider">Horímetro / KM Inicial</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            value={horimetro}
                                            onChange={(e) => setHorimetro(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-lg rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                                            placeholder="0.0"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] bg-white/[0.02] flex gap-3">
                            <button 
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3.5 rounded-xl font-bold text-[var(--color-muted)] hover:text-white hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                form="frotaForm"
                                className="flex-1 py-3.5 font-black rounded-xl text-white bg-[var(--color-primary)] hover:opacity-90 shadow-lg shadow-[var(--color-primary)]/20 transition-transform active:scale-95"
                            >
                                Salvar Máquina
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
