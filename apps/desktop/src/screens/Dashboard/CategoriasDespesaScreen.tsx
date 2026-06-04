import React, { useState, useEffect } from 'react';
import { 
    Tags,
    Plus,
    Trash2,
    RefreshCw,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function CategoriasDespesaScreen() {
    const [loading, setLoading] = useState(true);
    const [categorias, setCategorias] = useState<any[]>([]);

    // Form
    const [showModal, setShowModal] = useState(false);
    const [nome, setNome] = useState('');
    const [tipo, setTipo] = useState('DESPESA');
    const [descricao, setDescricao] = useState('');

    const fetchDados = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('v2_categorias_despesa')
                .select('*')
                .order('tipo', { ascending: true })
                .order('nome', { ascending: true });

            if (error && error.code === '42P01') {
                // Mock behavior se não existir
                setCategorias([
                    { id: '1', nome: 'Insumos Agrícolas', tipo: 'DESPESA', descricao: 'Sementes, Adubos, Defensivos' },
                    { id: '2', nome: 'Manutenção de Frota', tipo: 'DESPESA', descricao: 'Peças e serviços para tratores' },
                    { id: '3', nome: 'Mão de Obra Diarista', tipo: 'DESPESA', descricao: 'Pagamento de safristas' },
                    { id: '4', nome: 'Combustível', tipo: 'DESPESA', descricao: 'Diesel, Etanol, Gasolina' },
                    { id: '5', nome: 'Venda de Colheita', tipo: 'RECEITA', descricao: 'Recebimentos de safra' },
                    { id: '6', nome: 'Aluguel de Máquina', tipo: 'RECEITA', descricao: 'Locação para vizinhos' }
                ]);
            } else {
                setCategorias(data || []);
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

        if (!nome) {
            return toast.error("Preencha o nome da categoria.");
        }

        const payload = {
            nome: nome.toUpperCase(),
            tipo: tipo,
            descricao: descricao
        };

        try {
            const { error } = await supabase.from('v2_categorias_despesa').insert([payload]);

            if (error && error.code === '42P01') {
                // Mock behavior
                setCategorias([...categorias, { ...payload, id: Math.random().toString() }]);
            } else if (error) throw error;

            toast.success('Categoria criada com sucesso!');
            setShowModal(false);
            setNome('');
            setTipo('DESPESA');
            setDescricao('');
            fetchDados();
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Deseja apagar esta categoria?")) return;

        try {
            const { error } = await supabase.from('v2_categorias_despesa').delete().eq('id', id);
            if (error && error.code === '42P01') {
                setCategorias(categorias.filter(c => c.id !== id));
                toast.success('Apagado (Modo Local)');
                return;
            } else if (error) throw error;

            toast.success('Categoria apagada!');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao excluir categoria.');
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-5xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Tags className="w-8 h-8 text-blue-500" />
                        Categorias Financeiras
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Plano de contas e classificação de entradas/saídas.
                    </p>
                </div>
                
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Nova Categoria
                </button>
            </div>

            {/* LISTAGEM */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest">Plano de Contas Atual</h2>
                    <button onClick={fetchDados} className="text-[var(--color-muted)] hover:text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
                ) : categorias.length === 0 ? (
                    <div className="glass p-12 rounded-3xl text-center border border-dashed border-white/10">
                        <Tags className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhuma categoria configurada</h3>
                        <p className="text-[var(--color-muted)]">Crie categorias para classificar suas despesas e receitas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categorias.map(item => (
                            <div key={item.id} className="glass p-5 rounded-2xl border border-[var(--color-border)] hover:border-blue-500/30 transition-all group relative">
                                <div className={`absolute top-0 left-0 w-1 h-full opacity-50 group-hover:opacity-100 transition-opacity ${item.tipo === 'RECEITA' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.tipo === 'RECEITA' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                        {item.tipo === 'RECEITA' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="text-[var(--color-muted)] hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-4">
                                    <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded-md ${item.tipo === 'RECEITA' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {item.tipo}
                                    </span>
                                    <h3 className="text-lg font-bold text-white mt-2">{item.nome}</h3>
                                    <p className="text-[var(--color-muted)] text-xs mt-1 h-8 line-clamp-2">
                                        {item.descricao || 'Sem descrição.'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL REGISTRO */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="glass border border-blue-500/30 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 flex flex-col">
                        
                        <div className="p-6 border-b border-[var(--color-border)] bg-blue-500/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-white">Nova Categoria</h2>
                                <p className="text-blue-400 text-xs font-bold tracking-widest mt-1">CONFIGURAÇÃO DE SISTEMA</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-[var(--color-muted)] hover:text-white w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">&times;</button>
                        </div>

                        <div className="p-6 space-y-6">
                            <form id="catForm" onSubmit={handleSalvar} className="space-y-6">
                                
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        Nome da Categoria *
                                    </label>
                                    <input 
                                        required type="text" value={nome} onChange={e => setNome(e.target.value.toUpperCase())}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Ex: MANUTENÇÃO PREVENTIVA"
                                    />
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        Tipo Contábil *
                                    </label>
                                    <select 
                                        required value={tipo} onChange={e => setTipo(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="DESPESA">Saída (Despesa / Custo)</option>
                                        <option value="RECEITA">Entrada (Receita / Venda)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        Descrição Breve
                                    </label>
                                    <textarea 
                                        rows={2} value={descricao} onChange={e => setDescricao(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 outline-none resize-none"
                                        placeholder="Para que serve essa categoria?"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] bg-white/[0.02] flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[var(--color-muted)] font-bold hover:bg-white/5 rounded-xl transition-all">Cancelar</button>
                            <button 
                                type="submit" form="catForm"
                                className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 rounded-xl text-white font-black shadow-lg shadow-blue-500/20 transition-all"
                            >
                                Salvar Categoria
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
