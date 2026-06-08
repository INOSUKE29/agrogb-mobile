import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { 
    Sprout, 
    Leaf, 
    Snowflake, 
    Trash2, 
    PlusCircle,
    Save,
    History,
    Calendar,
    Activity
} from 'lucide-react';
import toast from 'react-hot-toast';
import DraggableModal from '../../components/common/DraggableModal';

export default function HarvestScreen() {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'COLHEITA' | 'CONGELAMENTO' | 'DESCARTE' | 'HISTORICO'>('COLHEITA');
    
    // Data Sources
    const [talhoes, setTalhoes] = useState<Record<string, any>[]>([]);
    const [culturas, setCulturas] = useState<Record<string, any>[]>([]);
    const [history, setHistory] = useState<Record<string, any>[]>([]);

    // Form States - Colheita
    const [talhao, setTalhao] = useState('');
    const [produto, setProduto] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [qtdCaixas, setQtdCaixas] = useState('');
    const [fatorAtual, setFatorAtual] = useState(1);
    const [observacao, setObservacao] = useState('');
    
    // Multiple items to save
    const [harvestItems, setHarvestItems] = useState<any[]>([]);

    // Form States - Congelamento
    const [congTalhao, setCongTalhao] = useState('');
    const [congProduto, setCongProduto] = useState('');
    const [congQtd, setCongQtd] = useState('');
    const [congObs, setCongObs] = useState('');

    // Form States - Descarte
    const [descProduto, setDescProduto] = useState('');
    const [descQtd, setDescQtd] = useState('');
    const [descMotivo, setDescMotivo] = useState('');
    const [descObs, setDescObs] = useState('');

    const fetchDados = async () => {
        setLoading(true);
        try {
            // Talhões
            const { data: tData } = await supabase.from('v2_talhoes').select('*').order('nome');
            setTalhoes(tData || []);

            // Culturas/Produtos (Tentando v2_culturas, ou pegando v2_produtos)
            // No mobile pegava de cadastros tipo PRODUTO
            const { data: cData } = await supabase.from('v2_produtos').select('*').in('categoria', ['INSUMO', 'SEMENTE']).order('nome');
            const fallback = await supabase.from('culturas').select('*').eq('is_deleted', 0).order('nome');
            const mergedProducts = [...(cData || []), ...(fallback.data || [])];
            // Remove duplicates by name
            const unique = mergedProducts.filter((v, i, a) => a.findIndex(t => (t.nome === v.nome)) === i);
            setCulturas(unique);

            // History
            const { data: hData } = await supabase.from('colheitas').select('*').order('data', { ascending: false }).limit(50);
            setHistory(hData || []);

        } catch (error) {
            console.error(error);
            toast.error('Erro ao carregar dados básicos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDados();
    }, []);

    // --- COLHEITA LOGIC ---
    const handleCaixasChange = (txt: string) => {
        setQtdCaixas(txt);
        const boxes = parseFloat(txt) || 0;
        if (boxes > 0) {
            setQuantidade((boxes * fatorAtual).toFixed(2));
        } else {
            setQuantidade('');
        }
    };

    const handleProdutoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const prodName = e.target.value;
        setProduto(prodName);
        // Mobile factor logic (mocking 1 for desktop unless configured)
        setFatorAtual(1); 
        if (qtdCaixas) {
            setQuantidade((parseFloat(qtdCaixas) * 1).toFixed(2));
        }
    };

    const addHarvestItem = () => {
        if (!produto || !quantidade || parseFloat(quantidade) <= 0) {
            return toast.error('Selecione o produto e informe uma quantidade válida.');
        }
        setHarvestItems([...harvestItems, {
            id: Date.now().toString(),
            produto: produto.toUpperCase(),
            quantidade: parseFloat(quantidade),
            qtdCaixas: parseFloat(qtdCaixas) || 0,
            fator: fatorAtual
        }]);
        setProduto(''); setQuantidade(''); setQtdCaixas('');
    };

    const removeHarvestItem = (id: string) => {
        setHarvestItems(harvestItems.filter(i => i.id !== id));
    };

    const updateStock = async (prod: string, qty: number, isAddition = true) => {
        try {
            const { data: check } = await supabase.from('estoque').select('*').eq('produto', prod).single();
            if (check) {
                const current = check.quantidade || 0;
                const newQty = isAddition ? (current + qty) : Math.max(0, current - qty);
                await supabase.from('estoque').update({ quantidade: newQty, last_updated: new Date().toISOString() }).eq('produto', prod);
            } else if (isAddition) {
                await supabase.from('estoque').insert([{ produto: prod, quantidade: qty, last_updated: new Date().toISOString() }]);
            }
        } catch (e) {
            console.error('Falha estoque:', e);
        }
    };

    const salvarColheita = async () => {
        if (!talhao || harvestItems.length === 0) {
            return toast.error('Preencha o local e adicione pelo menos um item.');
        }

        if (window.confirm('Deseja enviar estes itens colhidos diretamente para o controle de estoque?')) {
            await processSaveColheita(true);
        } else {
            await processSaveColheita(false);
        }
    };

    const processSaveColheita = async (sendToStock: boolean) => {
        try {
            for (const item of harvestItems) {
                await supabase.from('colheitas').insert([{
                    cultura: talhao.toUpperCase(),
                    produto: item.produto,
                    quantidade: item.quantidade,
                    congelado: 0,
                    observacao: observacao.toUpperCase(),
                    data: new Date().toISOString().split('T')[0]
                }]);
                if (sendToStock) await updateStock(item.produto, item.quantidade, true);
            }
            toast.success('Colheita registrada com sucesso!');
            setHarvestItems([]); setObservacao(''); setTalhao(''); fetchDados();
            setActiveTab('HISTORICO');
        } catch (e) {
            toast.error('Não conseguimos salvar a colheita.');
        }
    };

    // --- CONGELAMENTO LOGIC ---
    const salvarCongelamento = async () => {
        if (!congTalhao || !congProduto || !congQtd) return toast.error('Preencha os campos obrigatórios.');
        
        const deduct = window.confirm('Deseja abater este valor do seu estoque de produtos frescos e registrar como congelado?');
        try {
            const qty = parseFloat(congQtd);
            await supabase.from('colheitas').insert([{
                cultura: congTalhao.toUpperCase(),
                produto: congProduto.toUpperCase(),
                quantidade: 0,
                congelado: qty,
                observacao: `[CONGELAMENTO] ${congObs.toUpperCase()}`,
                data: new Date().toISOString().split('T')[0]
            }]);
            if (deduct) await updateStock(congProduto.toUpperCase(), qty, false);
            toast.success('Congelamento registrado!');
            setCongTalhao(''); setCongProduto(''); setCongQtd(''); setCongObs(''); fetchDados();
        } catch (e) {
            toast.error('Falha ao registrar congelamento.');
        }
    };

    // --- DESCARTE LOGIC ---
    const salvarDescarte = async () => {
        if (!descProduto || !descQtd || !descMotivo) return toast.error('Preencha os campos obrigatórios.');
        
        const deduct = window.confirm('Deseja abater a quantidade descartada do seu estoque atual?');
        try {
            const qty = parseFloat(descQtd);
            // Salvar na tabela descarte ou similar, aqui vou adaptar para a logica atual. Se descarte n existir, uso colheitas com obs.
            const { error } = await supabase.from('descarte').insert([{
                produto: descProduto.toUpperCase(),
                quantidade_kg: qty,
                motivo: `${descMotivo.toUpperCase()} - ${descObs.toUpperCase()}`,
                data: new Date().toISOString().split('T')[0]
            }]);
            
            // Fallback se n tiver tabela descarte
            if (error && error.code === '42P01') {
                 await supabase.from('colheitas').insert([{
                    cultura: 'DESCARTE',
                    produto: descProduto.toUpperCase(),
                    quantidade: 0,
                    congelado: 0,
                    observacao: `[DESCARTE] ${descMotivo.toUpperCase()} - ${descObs.toUpperCase()}`,
                    data: new Date().toISOString().split('T')[0]
                }]);
            }

            if (deduct) await updateStock(descProduto.toUpperCase(), qty, false);
            toast.success('Descarte salvo com sucesso.');
            setDescProduto(''); setDescQtd(''); setDescMotivo(''); setDescObs(''); fetchDados();
        } catch (e) {
            toast.error('Falha ao registrar descarte.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Confirmar exclusão deste registro?')) {
            await supabase.from('colheitas').delete().eq('id', id);
            toast.success('Apagado com sucesso!');
            fetchDados();
        }
    };

    return (
        <div className="animate-fade-in pb-12 max-w-5xl mx-auto space-y-6">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Sprout className="w-8 h-8 text-green-500" />
                        Apontamentos (Colheita)
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Gerencie as colheitas, congelamentos e descartes da produção.
                    </p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-4 border-b border-white/5 pb-4 overflow-x-auto custom-scrollbar">
                <button onClick={() => setActiveTab('COLHEITA')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'COLHEITA' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'bg-white/5 text-[var(--color-muted)] hover:bg-white/10'}`}>
                    <Leaf className="w-4 h-4" /> Registrar Colheita
                </button>
                <button onClick={() => setActiveTab('CONGELAMENTO')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'CONGELAMENTO' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-[var(--color-muted)] hover:bg-white/10'}`}>
                    <Snowflake className="w-4 h-4" /> Congelar
                </button>
                <button onClick={() => setActiveTab('DESCARTE')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'DESCARTE' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 text-[var(--color-muted)] hover:bg-white/10'}`}>
                    <Trash2 className="w-4 h-4" /> Descarte
                </button>
                <button onClick={() => setActiveTab('HISTORICO')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === 'HISTORICO' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-[var(--color-muted)] hover:bg-white/10'}`}>
                    <History className="w-4 h-4" /> Histórico Geral
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full"></div></div>
            ) : (
                <div className="glass rounded-3xl border border-[var(--color-border)] p-6 md:p-8">
                    
                    {/* COLHEITA TAB */}
                    {activeTab === 'COLHEITA' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div>
                                <h3 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">1. Onde? (Localização)</h3>
                                <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Local / Área *</label>
                                <select value={talhao} onChange={e => setTalhao(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-green-500">
                                    <option value="">Selecione o talhão...</option>
                                    {talhoes.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                </select>
                            </div>

                            <div>
                                <h3 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">2. O Que? (Produto e Quantidade)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Variedade / Produto *</label>
                                        <select value={produto} onChange={handleProdutoSelect} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-green-500">
                                            <option value="">Selecione o produto...</option>
                                            {culturas.map(c => <option key={c.id || c.uuid} value={c.nome}>{c.nome}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Volumes (CX)</label>
                                            <input type="number" value={qtdCaixas} onChange={e => handleCaixasChange(e.target.value)} placeholder="0" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-green-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Total (Kg) *</label>
                                            <input type="number" value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="0.00" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-green-500" />
                                        </div>
                                    </div>
                                </div>
                                
                                <button onClick={addHarvestItem} className="w-full md:w-auto px-6 py-3 border-2 border-dashed border-green-500/50 hover:border-green-500 bg-green-500/5 text-green-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                                    <PlusCircle className="w-5 h-5" /> Adicionar à Lista
                                </button>
                            </div>

                            {harvestItems.length > 0 && (
                                <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                                    <h4 className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Itens Aguardando Salvamento ({harvestItems.length})</h4>
                                    {harvestItems.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
                                            <div>
                                                <p className="font-bold text-white">{item.produto}</p>
                                                <p className="text-xs text-[var(--color-muted)]">{item.quantidade} kg {item.qtdCaixas > 0 ? `(${item.qtdCaixas} cx)` : ''}</p>
                                            </div>
                                            <button onClick={() => removeHarvestItem(item.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-wider mb-4 border-b border-white/5 pb-2">3. Observações Finais</h3>
                                <textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Detalhes técnicos da colheita..." className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-green-500 resize-none h-24" />
                            </div>

                            <button onClick={salvarColheita} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all">
                                <Save className="w-5 h-5" /> Salvar Apontamento
                            </button>
                        </div>
                    )}

                    {/* CONGELAMENTO TAB */}
                    {activeTab === 'CONGELAMENTO' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h3 className="text-lg font-black text-white border-b border-white/5 pb-2">Congelar Produtos Frescos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Localização / Talhão *</label>
                                    <select value={congTalhao} onChange={e => setCongTalhao(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-blue-500">
                                        <option value="">Selecione...</option>
                                        {talhoes.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Produto *</label>
                                    <select value={congProduto} onChange={e => setCongProduto(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-blue-500">
                                        <option value="">Selecione...</option>
                                        {culturas.map(c => <option key={c.id || c.uuid} value={c.nome}>{c.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Quantidade a Congelar (Kg) *</label>
                                    <input type="number" value={congQtd} onChange={e => setCongQtd(e.target.value)} placeholder="0.00" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Observações</label>
                                    <input type="text" value={congObs} onChange={e => setCongObs(e.target.value)} placeholder="Câmara Fria 2" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500" />
                                </div>
                            </div>
                            <button onClick={salvarCongelamento} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all">
                                <Snowflake className="w-5 h-5" /> Registrar Congelamento
                            </button>
                        </div>
                    )}

                    {/* DESCARTE TAB */}
                    {activeTab === 'DESCARTE' && (
                        <div className="space-y-6 animate-fade-in-up">
                            <h3 className="text-lg font-black text-white border-b border-white/5 pb-2">Lançar Perda / Descarte</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Produto *</label>
                                    <select value={descProduto} onChange={e => setDescProduto(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-red-500">
                                        <option value="">Selecione...</option>
                                        {culturas.map(c => <option key={c.id || c.uuid} value={c.nome}>{c.nome}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Qtd Descartada (Kg) *</label>
                                    <input type="number" value={descQtd} onChange={e => setDescQtd(e.target.value)} placeholder="0.00" className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-red-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Motivo *</label>
                                    <input type="text" value={descMotivo} onChange={e => setDescMotivo(e.target.value)} placeholder="Pragas, passou do ponto..." className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-red-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1 uppercase">Observações</label>
                                    <input type="text" value={descObs} onChange={e => setDescObs(e.target.value)} placeholder="Detalhes extras..." className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white outline-none focus:border-red-500" />
                                </div>
                            </div>
                            <button onClick={salvarDescarte} className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl flex justify-center items-center gap-2 shadow-lg transition-all">
                                <Trash2 className="w-5 h-5" /> Registrar Descarte
                            </button>
                        </div>
                    )}

                    {/* HISTORICO TAB */}
                    {activeTab === 'HISTORICO' && (
                        <div className="animate-fade-in-up">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10 text-[var(--color-muted)] text-xs uppercase tracking-wider">
                                            <th className="p-3">Data</th>
                                            <th className="p-3">Local</th>
                                            <th className="p-3">Produto</th>
                                            <th className="p-3">Quantidade</th>
                                            <th className="p-3 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.length === 0 ? (
                                            <tr><td colSpan={5} className="p-6 text-center text-gray-500">Nenhum registro encontrado.</td></tr>
                                        ) : history.map(h => (
                                            <tr key={h.id} className="border-b border-white/5 hover:bg-white/5">
                                                <td className="p-3 text-sm text-[var(--color-muted)]">
                                                    <Calendar className="w-3 h-3 inline mr-1" />
                                                    {h.data ? h.data.split('-').reverse().join('/') : '-'}
                                                </td>
                                                <td className="p-3 font-medium text-white">{h.cultura}</td>
                                                <td className="p-3 font-bold text-[var(--color-primary)]">{h.produto}</td>
                                                <td className="p-3 text-sm">
                                                    {h.quantidade > 0 && <span className="text-green-400 font-bold">{h.quantidade} kg Colhido</span>}
                                                    {h.congelado > 0 && <span className="text-blue-400 font-bold">{h.congelado} kg Congelado</span>}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => handleDelete(h.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
