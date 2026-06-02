import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { LayoutList, Plus, AlertCircle, Clock, CheckCircle2, GripVertical, Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Tarefa {
    uuid: string;
    titulo: string;
    descricao: string;
    status: 'A FAZER' | 'EM ANDAMENTO' | 'CONCLUÍDO';
    prioridade: 'BAIXA' | 'MÉDIA' | 'ALTA';
    data_vencimento: string;
}

export default function TarefasScreen() {
    const [tarefas, setTarefas] = useState<Tarefa[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Formulário
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [prioridade, setPrioridade] = useState<'BAIXA' | 'MÉDIA' | 'ALTA'>('MÉDIA');
    const [dataVencimento, setDataVencimento] = useState('');

    const fetchTarefas = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('tarefas')
                .select('*')
                .order('prioridade', { ascending: false });

            if (error) {
                // Se a tabela não existir ainda, apenas ignora para não quebrar a UI
                if (error.code === '42P01') {
                    console.log('Tabela tarefas não existe ainda.');
                    return;
                }
                throw error;
            }
            setTarefas(data || []);
        } catch (error: any) {
            console.error('Erro ao buscar tarefas:', error);
            // toast.error('Não foi possível carregar as tarefas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTarefas();
    }, []);

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!titulo) return;

        try {
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData.user?.id;

            const novaTarefa = {
                user_id: userId,
                titulo,
                descricao,
                prioridade,
                data_vencimento: dataVencimento ? new Date(dataVencimento).toISOString() : null,
                status: 'A FAZER'
            };

            const { data, error } = await supabase
                .from('tarefas')
                .insert([novaTarefa])
                .select();
            
            if (error) throw error;

            toast.success('Tarefa criada com sucesso!');
            setShowModal(false);
            setTitulo('');
            setDescricao('');
            setPrioridade('MÉDIA');
            setDataVencimento('');
            fetchTarefas();

        } catch (error: any) {
            console.error('Erro ao criar tarefa:', error);
            toast.error(error.message || 'Falha ao criar tarefa.');
        }
    };

    const deleteTarefa = async (uuid: string) => {
        try {
            const { error } = await supabase.from('tarefas').delete().eq('uuid', uuid);
            if (error) throw error;
            toast.success('Tarefa excluída!');
            setTarefas(tarefas.filter(t => t.uuid !== uuid));
        } catch (error) {
            toast.error('Erro ao excluir tarefa.');
        }
    };

    const updateTaskStatus = async (uuid: string, newStatus: string) => {
        // Atualização Otimista
        setTarefas(prev => prev.map(t => t.uuid === uuid ? { ...t, status: newStatus as any } : t));
        
        try {
            const { error } = await supabase
                .from('tarefas')
                .update({ status: newStatus })
                .eq('uuid', uuid);

            if (error) throw error;
        } catch (error) {
            toast.error('Erro ao mover tarefa.');
            fetchTarefas(); // Reverter
        }
    };

    // --- LOGICA DE DRAG AND DROP ---
    const handleDragStart = (e: React.DragEvent, uuid: string) => {
        e.dataTransfer.setData('taskUuid', uuid);
        e.currentTarget.classList.add('opacity-50'); // Feedback visual ao arrastar
    };

    const handleDragEnd = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('opacity-50');
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessário para permitir o drop
        e.currentTarget.classList.add('bg-white/5');
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-white/5');
    };

    const handleDrop = (e: React.DragEvent, status: string) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-white/5');
        const uuid = e.dataTransfer.getData('taskUuid');
        if (uuid) {
            updateTaskStatus(uuid, status);
        }
    };

    const renderColumn = (title: string, status: string, icon: React.ReactNode, colColor: string) => {
        const columnTasks = tarefas.filter(t => t.status === status);

        return (
            <div 
                className={`glass-card p-4 flex flex-col h-full min-h-[60vh] border-t-4 transition-colors`}
                style={{ borderTopColor: colColor }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status)}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        {icon}
                        {title}
                    </h3>
                    <span className="bg-[#121212] text-[var(--color-muted)] px-3 py-1 rounded-full text-sm font-bold border border-[var(--color-border)]">
                        {columnTasks.length}
                    </span>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-4">
                    {columnTasks.map(task => (
                        <div 
                            key={task.uuid}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.uuid)}
                            onDragEnd={handleDragEnd}
                            className="bg-[#121212]/80 backdrop-blur-md border border-[var(--color-border)] p-4 rounded-xl cursor-grab active:cursor-grabbing hover:border-[var(--color-primary)] transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider
                                        ${task.prioridade === 'ALTA' ? 'bg-red-500/20 text-red-400' : 
                                          task.prioridade === 'MÉDIA' ? 'bg-yellow-500/20 text-yellow-400' : 
                                          'bg-blue-500/20 text-blue-400'}`}>
                                        {task.prioridade}
                                    </span>
                                </div>
                                <button onClick={() => deleteTarefa(task.uuid)} className="text-[var(--color-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            
                            <h4 className="font-bold text-white mb-2">{task.titulo}</h4>
                            {task.descricao && <p className="text-sm text-[var(--color-muted)] mb-4 line-clamp-2">{task.descricao}</p>}
                            
                            {task.data_vencimento && (
                                <div className="flex items-center gap-1 text-xs text-[var(--color-muted)] bg-white/5 inline-flex px-2 py-1 rounded-md">
                                    <CalendarIcon className="w-3 h-3" />
                                    {new Date(task.data_vencimento).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    ))}

                    {columnTasks.length === 0 && (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-xl opacity-50">
                            <p className="text-sm text-[var(--color-muted)] text-center px-4">Arraste tarefas para cá</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col space-y-6 animate-fade-in overflow-hidden">
            {/* CABEÇALHO */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <LayoutList className="w-8 h-8 text-[var(--color-primary)]" />
                        Operações e Tarefas
                    </h1>
                    <p className="text-[var(--color-muted)] mt-1">Quadro Kanban de rotinas agrícolas (Arraste os cards para mover)</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="glass-card px-4 py-2 flex items-center gap-2 text-[var(--color-primary)] hover:text-white font-semibold group"
                >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                    Nova Tarefa
                </button>
            </div>

            {/* KANBAN BOARD */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-w-[900px]">
                    {renderColumn('A Fazer', 'A FAZER', <AlertCircle className="w-5 h-5 text-[var(--color-muted)]" />, '#4B5563')}
                    {renderColumn('Em Andamento', 'EM ANDAMENTO', <Clock className="w-5 h-5 text-yellow-400" />, '#FACC15')}
                    {renderColumn('Concluído', 'CONCLUÍDO', <CheckCircle2 className="w-5 h-5 text-green-400" />, '#4ADE80')}
                </div>
            </div>

            {/* MODAL NOVA TAREFA */}
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
                                Adicionar Tarefa
                            </h2>

                            <form onSubmit={handleSaveTask} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Título</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={titulo}
                                        onChange={(e) => setTitulo(e.target.value)}
                                        className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
                                        placeholder="Ex: Pulverizar Talhão 2"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Descrição</label>
                                    <textarea 
                                        value={descricao}
                                        onChange={(e) => setDescricao(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none resize-none"
                                        placeholder="Detalhes adicionais..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Prioridade</label>
                                        <select 
                                            value={prioridade}
                                            onChange={(e) => setPrioridade(e.target.value as any)}
                                            className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none appearance-none"
                                        >
                                            <option value="BAIXA">Baixa</option>
                                            <option value="MÉDIA">Média</option>
                                            <option value="ALTA">Alta</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[var(--color-muted)] mb-1">Vencimento (Opcional)</label>
                                        <input 
                                            type="date" 
                                            value={dataVencimento}
                                            onChange={(e) => setDataVencimento(e.target.value)}
                                            className="w-full bg-[#121212] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
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
                                        Adicionar
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
