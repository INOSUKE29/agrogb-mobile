import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Save, Leaf, Droplet, Clock, ListTodo, Map, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import SearchableSelect from '../../../components/common/SearchableSelect';

export default function ProgramasScreen() {
    const navigate = useNavigate();
    const [nomePrograma, setNomePrograma] = useState('');
    const [talhao, setTalhao] = useState('');
    const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
    
    // Lista de atividades do programa
    const [atividades, setAtividades] = useState<any[]>([]);
    
    const [isAdding, setIsAdding] = useState(false);
    const [novaAtiv, setNovaAtiv] = useState({ codigo: 'F1', tipo: 'Foliar', diasAposInicio: 0, objetivo: '', volumeCalda: '200' });

    const handleAddAtiv = () => {
        if (!novaAtiv.objetivo) return toast.error('Preencha o objetivo da aplicação.');
        setAtividades([...atividades, { ...novaAtiv, id: Date.now() }]);
        setIsAdding(false);
        setNovaAtiv({ codigo: `F${atividades.length + 2}`, tipo: 'Foliar', diasAposInicio: novaAtiv.diasAposInicio + 7, objetivo: '', volumeCalda: '200' });
    };

    const handleSalvarPrograma = () => {
        if (!nomePrograma) return toast.error('Dê um nome ao programa.');
        if (atividades.length === 0) return toast.error('Adicione pelo menos uma atividade.');
        
        toast.success('Programa salvo com sucesso! A agenda foi gerada.');
        setTimeout(() => navigate('/dashboard/cliente/manejo'), 1500);
    };

    const calcularDataPrevista = (dias: number) => {
        const d = new Date(dataInicio);
        d.setDate(d.getDate() + dias);
        return d.toLocaleDateString('pt-BR');
    };

    return (
        <div className="animate-fade-in pb-12 space-y-6">
            {/* HERO CABEÇALHO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[var(--color-muted)] hover:text-white transition-colors mb-4 font-bold text-sm uppercase tracking-wider">
                        <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                        <ListTodo className="w-4 h-4" /> Centro Operacional
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        Criador de Programas
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Defina a sequência de aplicações e o AgroGB gerará o calendário automático.
                    </p>
                </div>
                <div>
                    <button 
                        onClick={handleSalvarPrograma}
                        className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl shadow-lg transition-all flex items-center gap-2"
                    >
                        <Save className="w-5 h-5" /> Salvar Programa
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CONFIGURAÇÃO GERAL */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass p-6 rounded-3xl border border-[var(--color-border)]">
                        <h2 className="text-xl font-bold text-white mb-6">Configuração Geral</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase mb-2">Nome do Programa *</label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Programa Morango 2026"
                                    value={nomePrograma}
                                    onChange={e => setNomePrograma(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase mb-2">Talhão Vinculado</label>
                                <SearchableSelect 
                                    value={talhao}
                                    onChange={(val) => setTalhao(val)}
                                    options={[
                                        { label: 'Geral (Aplicável a vários)', value: '' },
                                        { label: 'Gleba A (Tomate)', value: 'Gleba A' },
                                        { label: 'Gleba B (Morango)', value: 'Gleba B' }
                                    ]}
                                    allowCustom={false}
                                    placeholder="Selecione o Talhão"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--color-muted)] uppercase mb-2">Data de Início Base *</label>
                                <input 
                                    type="date" 
                                    value={dataInicio}
                                    onChange={e => setDataInicio(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* TIMELINE DE ATIVIDADES */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass p-6 rounded-3xl border border-[var(--color-border)]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[var(--color-primary)]" />
                                Linha do Tempo
                            </h2>
                            {!isAdding && (
                                <button onClick={() => setIsAdding(true)} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-sm">
                                    <Plus className="w-4 h-4" /> Adicionar Etapa
                                </button>
                            )}
                        </div>

                        {/* FORM ADICIONAR ETAPA */}
                        {isAdding && (
                            <div className="bg-white/5 border border-[var(--color-primary)]/50 p-6 rounded-2xl mb-6 animate-fade-in-up">
                                <h3 className="font-bold text-white mb-4">Nova Etapa do Programa</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase mb-1">Cód</label>
                                        <input type="text" value={novaAtiv.codigo} onChange={e => setNovaAtiv({...novaAtiv, codigo: e.target.value})} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-white text-sm" />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase mb-1">Dias</label>
                                        <input type="number" value={novaAtiv.diasAposInicio} onChange={e => setNovaAtiv({...novaAtiv, diasAposInicio: parseInt(e.target.value) || 0})} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-white text-sm" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase mb-1">Via</label>
                                        <SearchableSelect 
                                            value={novaAtiv.tipo} 
                                            onChange={(val) => setNovaAtiv({...novaAtiv, tipo: val})}
                                            options={[
                                                { label: 'Foliar', value: 'Foliar' },
                                                { label: 'Via Gotejo (Fertirrigação)', value: 'Gotejo' },
                                                { label: 'Fitossanitário', value: 'Fitossanitario' }
                                            ]}
                                            allowCustom={false}
                                            placeholder="Selecione a Via"
                                        />
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-[var(--color-muted)] uppercase mb-1">Objetivo / Fase</label>
                                    <input type="text" placeholder="Ex: Crescimento Inicial" value={novaAtiv.objetivo} onChange={e => setNovaAtiv({...novaAtiv, objetivo: e.target.value})} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-white text-sm" />
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button onClick={() => setIsAdding(false)} className="px-4 py-2 bg-transparent text-[var(--color-muted)] font-bold rounded-lg hover:text-white">Cancelar</button>
                                    <button onClick={handleAddAtiv} className="px-4 py-2 bg-[var(--color-primary)] text-white font-bold rounded-lg">Incluir Etapa</button>
                                </div>
                            </div>
                        )}

                        {/* LISTA DE ETAPAS */}
                        <div className="space-y-4">
                            {atividades.length === 0 && !isAdding && (
                                <div className="text-center py-8 text-[var(--color-muted)] border border-dashed border-white/10 rounded-2xl">
                                    Nenhuma etapa adicionada. Crie a primeira!
                                </div>
                            )}
                            {atividades.map((ativ, index) => (
                                <div key={ativ.id} className="relative pl-8 pb-4">
                                    {/* Timeline line */}
                                    {index !== atividades.length - 1 && <div className="absolute left-3 top-8 bottom-[-16px] w-[2px] bg-white/10"></div>}
                                    
                                    {/* Timeline dot */}
                                    <div className="absolute left-0 top-3 w-6 h-6 rounded-full flex items-center justify-center border-4 border-[var(--color-background)] bg-[var(--color-primary)]"></div>
                                    
                                    <div className="bg-white/5 border border-[var(--color-border)] p-4 rounded-2xl hover:border-[var(--color-primary)]/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="font-black text-lg text-white">{ativ.codigo}</span>
                                                <span className="text-sm font-bold bg-white/10 px-2 py-0.5 rounded text-[var(--color-muted)]">{ativ.tipo}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-[var(--color-primary)]">Dia {ativ.diasAposInicio}</div>
                                                <div className="text-xs text-[var(--color-muted)]">{calcularDataPrevista(ativ.diasAposInicio)}</div>
                                            </div>
                                        </div>
                                        <p className="text-white font-medium">{ativ.objetivo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
