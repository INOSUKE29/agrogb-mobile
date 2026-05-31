import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Truck, Search, Plus, Filter, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FrotaScreen() {
    const [frota, setFrota] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Formulário do Modal
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('TRATOR');
    const [placa, setPlaca] = useState('');
    const [horimetro, setHorimetro] = useState('');

    useEffect(() => {
        fetchFrota();
    }, []);

    const fetchFrota = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('farm_machines')
                .select('*')
                .order('nome', { ascending: true });

            if (error) throw error;
            setFrota(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar frota:', error);
            toast.error('Não foi possível carregar as máquinas.');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMachine = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nome) {
            toast.error('O nome da máquina é obrigatório.');
            return;
        }

        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData.user?.id;

            const { error } = await supabase
                .from('farm_machines')
                .insert([{
                    user_id: userId,
                    nome: nome,
                    tipo: tipo,
                    placa: placa,
                    horimetro: parseFloat(horimetro) || 0,
                    status: 'ATIVO'
                }]);
            
            if (error) throw error;

            toast.success('Máquina cadastrada com sucesso!');
            setShowModal(false);
            setNome('');
            setPlaca('');
            setHorimetro('');
            fetchFrota();

        } catch (error: any) {
            console.error('Erro ao cadastrar:', error);
            toast.error(error.message || 'Falha ao cadastrar máquina.');
        }
    };

    const toggleStatus = async (uuid: string, currentStatus: string) => {
        const novoStatus = currentStatus === 'ATIVO' ? 'MANUTENÇÃO' : 'ATIVO';
        try {
            const { error } = await supabase
                .from('farm_machines')
                .update({ status: novoStatus })
                .eq('uuid', uuid);

            if (error) throw error;
            toast.success(`Status alterado para ${novoStatus}`);
            fetchFrota();
        } catch (error: any) {
            toast.error('Erro ao atualizar status.');
        }
    };

    const filteredFrota = frota.filter(item => 
        item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.placa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusIcon = (status: string) => {
        if (status === 'ATIVO') return <CheckCircle className="w-5 h-5 text-green-400" />;
        if (status === 'MANUTENÇÃO') return <Wrench className="w-5 h-5 text-red-400" />;
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <Truck className="w-8 h-8 text-[var(--color-primary)]" />
                        Gestão de Frota
                    </h1>
                    <p className="text-[var(--color-muted)] mt-1">Controle de maquinários, manutenções e horímetro</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="glass-card px-4 py-2 flex items-center gap-2 text-[var(--color-primary)] hover:text-white font-semibold group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Nova Máquina
                </button>
            </div>

            {/* BARRA DE PESQUISA E FILTROS */}
            <div className="glass-card p-4 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou placa..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-[var(--color-primary)] outline-none transition-all"
                    />
                </div>
                <button className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-[var(--color-muted)] hover:text-white transition-colors">
                    <Filter className="w-4 h-4" />
                    Filtros
                </button>
            </div>

            {/* GRID DE MÁQUINAS */}
            {loading ? (
                <div className="glass-card p-12 text-center text-[var(--color-muted)] animate-pulse">Carregando frota...</div>
            ) : filteredFrota.length === 0 ? (
                <div className="glass-card p-12 text-center text-[var(--color-muted)] flex flex-col items-center">
                    <Truck className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium text-white">Nenhuma máquina cadastrada</p>
                    <p className="mt-1">Cadastre seu primeiro maquinário para começar o controle.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFrota.map(item => (
                        <div key={item.uuid} className="glass-card p-6 flex flex-col relative overflow-hidden group">
                            {/* Glow de fundo baseado no status */}
                            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all ${item.status === 'ATIVO' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-1 truncate">{item.nome}</h3>
                                    <p className="text-sm font-medium text-[var(--color-muted)] bg-white/5 inline-block px-2 py-0.5 rounded-md border border-white/5">{item.tipo}</p>
                                </div>
                                <button 
                                    onClick={() => toggleStatus(item.uuid, item.status)}
                                    className={`p-2 rounded-xl transition-all ${item.status === 'ATIVO' ? 'bg-green-500/10 hover:bg-green-500/20' : 'bg-red-500/10 hover:bg-red-500/20'}`}
                                    title="Clique para alternar o status"
                                >
                                    {getStatusIcon(item.status)}
                                </button>
                            </div>
                            
                            <div className="space-y-3 mb-6 relative z-10">
                                <div className="flex justify-between items-center bg-[#121212] p-3 rounded-lg border border-[var(--color-border)]">
                                    <span className="text-sm text-[var(--color-muted)]">Placa/Identificação</span>
                                    <span className="text-sm font-bold text-white">{item.placa || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center bg-[#121212] p-3 rounded-lg border border-[var(--color-border)]">
                                    <span className="text-sm text-[var(--color-muted)] flex items-center gap-2"><Clock className="w-4 h-4" /> Horímetro/KM</span>
                                    <span className="text-sm font-bold text-[var(--color-primary)]">{item.horimetro}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DE NOVA MÁQUINA */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowModal(false)}>
                    <div 
                        className="glass border border-[var(--color-border)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="h-1 w-full bg-[var(--color-primary)]"></div>
                        <div className="p-6">
                            <h2 className="text-2xl font-black text-white flex items-center gap-2 mb-6">
                                <Plus className="text-[var(--color-primary)]" />
                                Cadastrar Máquina
                            </h2>

                            <form onSubmit={handleSaveMachine} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Nome/Modelo</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                        placeholder="Ex: Trator John Deere 6100J"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Tipo</label>
                                    <select 
                                        value={tipo}
                                        onChange={(e) => setTipo(e.target.value)}
                                        className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none appearance-none"
                                    >
                                        <option value="TRATOR">Trator</option>
                                        <option value="COLHEITADEIRA">Colheitadeira</option>
                                        <option value="PULVERIZADOR">Pulverizador</option>
                                        <option value="CAMINHÃO">Caminhão</option>
                                        <option value="VEÍCULO LEVE">Veículo Leve</option>
                                        <option value="IMPLEMENTO">Implemento Agrícola</option>
                                        <option value="OUTROS">Outros</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Placa/Chassi</label>
                                        <input 
                                            type="text" 
                                            value={placa}
                                            onChange={(e) => setPlaca(e.target.value)}
                                            className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                            placeholder="ABC-1234"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Horímetro Inicial</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            value={horimetro}
                                            onChange={(e) => setHorimetro(e.target.value)}
                                            className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                            placeholder="0.0"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 text-[var(--color-muted)] hover:text-white font-semibold transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 py-3 font-bold rounded-xl text-white bg-[var(--color-primary)] hover:opacity-90 transition-all active:scale-95"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
