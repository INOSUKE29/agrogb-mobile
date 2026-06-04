import React, { useState, useEffect, useMemo } from 'react';
import { 
    DollarSign, 
    TrendingDown, 
    Calendar, 
    FileText, 
    Plus, 
    List, 
    Trash2,
    RefreshCw
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function CustosScreen() {
    const [loading, setLoading] = useState(true);
    const [custos, setCustos] = useState<any[]>([]);
    const [categorias, setCategorias] = useState<any[]>([]);

    // Form
    const [showModal, setShowModal] = useState(false);
    const [categoriaId, setCategoriaId] = useState('');
    const [quantidade, setQuantidade] = useState('1');
    const [valorUnitario, setValorUnitario] = useState('');
    const [observacao, setObservacao] = useState('');

    const fetchDados = async () => {
        setLoading(true);
        try {
            // Load Categories
            const { data: dataCat, error: errCat } = await supabase.from('v2_categorias_despesa').select('*');
            if (errCat && errCat.code === '42P01') {
                setCategorias([
                    { id: '1', nome: 'Insumos Agrícolas', tipo: 'DESPESA' },
                    { id: '2', nome: 'Manutenção de Frota', tipo: 'DESPESA' },
                    { id: '3', nome: 'Mão de Obra', tipo: 'DESPESA' },
                    { id: '4', nome: 'Combustível', tipo: 'DESPESA' },
                ]);
            } else {
                setCategorias(dataCat || []);
            }

            // Load Costs
            const { data: dataCustos, error } = await supabase
                .from('v2_custos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error && error.code === '42P01') {
                setCustos([
                    {
                        id: 'mock-1',
                        categoria_nome: 'Combustível',
                        quantidade: 100,
                        valor_unitario: 5.99,
                        valor_total: 599.00,
                        observacao: 'Abastecimento Trator JD',
                        created_at: new Date().toISOString()
                    }
                ]);
            } else {
                setCustos(dataCustos || []);
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

        if (!categoriaId || !quantidade || !valorUnitario) {
            return toast.error("Preencha categoria, quantidade e valor unitário.");
        }

        const qtd = parseFloat(quantidade);
        const vUnit = parseFloat(valorUnitario);
        const vTotal = qtd * vUnit;
        
        const catSelecionada = categorias.find(c => c.id === categoriaId);

        const payload = {
            categoria_id: categoriaId,
            categoria_nome: catSelecionada?.nome || 'Geral',
            quantidade: qtd,
            valor_unitario: vUnit,
            valor_total: vTotal,
            observacao: observacao.toUpperCase(),
        };

        try {
            const { error } = await supabase.from('v2_custos').insert([payload]);

            if (error && error.code === '42P01') {
                // Mock behavior
                setCustos([{ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...custos]);
            } else if (error) throw error;

            toast.success('Despesa registrada com sucesso!');
            setShowModal(false);
            setCategoriaId('');
            setQuantidade('1');
            setValorUnitario('');
            setObservacao('');
            fetchDados();
        } catch (error: any) {
            toast.error('Erro ao salvar: ' + error.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Deseja realmente apagar esta despesa?")) return;

        try {
            const { error } = await supabase.from('v2_custos').delete().eq('id', id);
            if (error && error.code === '42P01') {
                setCustos(custos.filter(c => c.id !== id));
                toast.success('Despesa apagada (Modo Local)');
                return;
            } else if (error) throw error;

            toast.success('Despesa apagada!');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao excluir despesa.');
        }
    };

    const totalMes = useMemo(() => {
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();
        return custos
            .filter(c => {
                const d = new Date(c.created_at);
                return d.getMonth() === month && d.getFullYear() === year;
            })
            .reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
    }, [custos]);

    return (
        <div className="animate-fade-in pb-12 max-w-5xl mx-auto space-y-8">
            
            {/* HERO / HEADER */}
            <div className="relative rounded-3xl overflow-hidden glass border border-red-500/20 p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-sm font-bold mb-4">
                            <TrendingDown className="w-4 h-4" /> Gestão Financeira
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Controle de Custos
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Apropriação de despesas operacionais da fazenda.
                        </p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-4">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 text-right">
                            <p className="text-red-400 text-xs font-black tracking-widest uppercase mb-1">CUSTOS NESTE MÊS</p>
                            <p className="text-white text-3xl font-black">R$ {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Lançar Despesa
                        </button>
                    </div>
                </div>
            </div>

            {/* LISTAGEM DE HISTÓRICO */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest">Histórico de Lançamentos</h2>
                    <button onClick={fetchDados} className="text-[var(--color-muted)] hover:text-white transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full"></div></div>
                ) : custos.length === 0 ? (
                    <div className="glass p-12 rounded-3xl text-center border border-dashed border-white/10">
                        <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-20 text-white" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum custo registrado</h3>
                        <p className="text-[var(--color-muted)]">Comece a apropriar as despesas clicando em "Lançar Despesa".</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {custos.map(item => (
                            <div key={item.id} className="glass p-5 rounded-2xl border border-[var(--color-border)] hover:border-red-500/30 transition-all group relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                                        <TrendingDown className="w-6 h-6 text-red-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{item.categoria_nome}</h3>
                                        <p className="text-[var(--color-muted)] text-xs flex items-center gap-2 mt-1">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString('pt-BR')}</span>
                                            {item.observacao && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {item.observacao}</span>}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-[var(--color-border)] md:border-0">
                                    <div className="text-left md:text-right">
                                        <p className="text-[var(--color-muted)] text-[10px] font-black tracking-widest uppercase mb-0.5">QTD: {item.quantidade}x</p>
                                        <p className="text-white font-black text-xl">R$ {item.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(item.id)}
                                        className="text-[var(--color-muted)] hover:text-red-400 p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
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
                    <div className="glass border border-red-500/30 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden relative z-10 flex flex-col">
                        
                        <div className="p-6 border-b border-[var(--color-border)] bg-red-500/5 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-white">Lançar Despesa</h2>
                                <p className="text-red-400 text-xs font-bold tracking-widest mt-1">APROPRIAÇÃO DE CUSTO</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-[var(--color-muted)] hover:text-white w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">&times;</button>
                        </div>

                        <div className="p-6 space-y-6">
                            <form id="custoForm" onSubmit={handleSalvar} className="space-y-6">
                                
                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        <List className="w-4 h-4 text-red-400" /> Categoria da Despesa *
                                    </label>
                                    <select 
                                        required value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                                    >
                                        <option value="" disabled>Selecione uma Categoria...</option>
                                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            QTD *
                                        </label>
                                        <input 
                                            required type="number" min="0.1" step="0.1" value={quantidade} onChange={e => setQuantidade(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="Ex: 1"
                                        />
                                    </div>
                                    <div>
                                        <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                            Valor Unit. (R$) *
                                        </label>
                                        <input 
                                            required type="number" min="0" step="0.01" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>

                                {/* TOTAL PREVIEW */}
                                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                                    <p className="text-red-400 text-[10px] font-black tracking-widest uppercase mb-1">TOTAL DO LANÇAMENTO</p>
                                    <p className="text-white text-2xl font-black">
                                        R$ {((parseFloat(quantidade) || 0) * (parseFloat(valorUnitario) || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">
                                        <FileText className="w-4 h-4 text-slate-400" /> Notas / Observação
                                    </label>
                                    <textarea 
                                        rows={2} value={observacao} onChange={e => setObservacao(e.target.value.toUpperCase())}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white rounded-xl px-4 py-3 outline-none resize-none"
                                        placeholder="Detalhes da despesa..."
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] bg-white/[0.02] flex gap-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-4 text-[var(--color-muted)] font-bold hover:bg-white/5 rounded-xl transition-all">Cancelar</button>
                            <button 
                                type="submit" form="custoForm"
                                className="flex-1 py-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 rounded-xl text-white font-black shadow-lg shadow-red-500/20 transition-all"
                            >
                                Salvar Registro
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
