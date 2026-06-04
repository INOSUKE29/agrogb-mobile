import React, { useState, useEffect } from 'react';
import { 
    RefreshCw,
    Search,
    Trash2,
    Globe,
    Plus,
    Leaf,
    Bug,
    Package,
    ShieldCheck,
    X
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';

export default function AdminCatalogScreen() {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'CULTURAS' | 'PRODUTOS' | 'FITOSSANITARIO'>('CULTURAS');
    
    // Listas
    const [crops, setCrops] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [pests, setPests] = useState<any[]>([]);
    const [diseases, setDiseases] = useState<any[]>([]);

    // Estado do Modal de Criação
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItemName, setNewItemName] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('');

    const fetchDados = async () => {
        setLoading(true);
        try {
            if (activeTab === 'CULTURAS') {
                const { data, error } = await supabase.from('kb_crops').select('*').eq('scope', 'GLOBAL').order('name');
                if (!error && data) setCrops(data);
            } else if (activeTab === 'PRODUTOS') {
                const { data, error } = await supabase.from('kb_products').select('*').eq('scope', 'GLOBAL').order('name');
                if (!error && data) setProducts(data);
            } else if (activeTab === 'FITOSSANITARIO') {
                const { data: pData, error: pError } = await supabase.from('kb_pests').select('*').eq('scope', 'GLOBAL').order('common_name');
                const { data: dData, error: dError } = await supabase.from('kb_diseases').select('*').eq('scope', 'GLOBAL').order('name');
                if (!pError && pData) setPests(pData);
                if (!dError && dData) setDiseases(dData);
            }
        } catch (error) {
            console.error('Erro ao buscar biblioteca:', error);
            toast.error('Erro ao conectar com o Grafo de Conhecimento.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDados();
    }, [activeTab]);

    const handleAddItem = async () => {
        if (!newItemName.trim()) {
            toast.error('Nome é obrigatório.');
            return;
        }

        try {
            if (activeTab === 'CULTURAS') {
                await supabase.from('kb_crops').insert([{ name: newItemName, scope: 'GLOBAL' }]);
                toast.success('Cultura global adicionada!');
            } else if (activeTab === 'PRODUTOS') {
                await supabase.from('kb_products').insert([{ name: newItemName, category: newItemCategory || 'GERAL', scope: 'GLOBAL' }]);
                toast.success('Produto global adicionado!');
            } else if (activeTab === 'FITOSSANITARIO') {
                if (newItemCategory === 'PRAGA') {
                    await supabase.from('kb_pests').insert([{ common_name: newItemName, scope: 'GLOBAL' }]);
                } else {
                    await supabase.from('kb_diseases').insert([{ name: newItemName, scope: 'GLOBAL' }]);
                }
                toast.success('Item fitossanitário global adicionado!');
            }
            
            setIsAddModalOpen(false);
            setNewItemName('');
            setNewItemCategory('');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao criar item.');
            console.error(error);
        }
    };

    const handleDeleteItem = async (table: string, id: string) => {
        if (!window.confirm("Apagar este item removerá ele do catálogo global para todos os produtores. Tem certeza?")) return;
        
        try {
            await supabase.from(table).delete().eq('id', id);
            toast.success('Item apagado.');
            fetchDados();
        } catch (error) {
            toast.error('Erro ao apagar item.');
        }
    };

    const renderCrops = () => {
        const filtered = crops.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Nome da Cultura</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-white flex items-center gap-2"><Leaf className="w-4 h-4 text-green-400"/> {item.name}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteItem('kb_crops', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderProducts = () => {
        const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Nome Comercial</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Categoria</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-white flex items-center gap-2"><Package className="w-4 h-4 text-blue-400"/> {item.name}</td>
                                <td className="p-4 text-xs text-[var(--color-muted)]"><span className="px-2 py-1 bg-white/10 rounded">{item.category}</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteItem('kb_products', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderPhyto = () => {
        const pFiltered = pests.filter(p => p.common_name.toLowerCase().includes(searchTerm.toLowerCase()));
        const dFiltered = diseases.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="overflow-x-auto rounded-xl border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5">
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Problema Fitossanitário</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase">Tipo</th>
                            <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pFiltered.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-white flex items-center gap-2"><Bug className="w-4 h-4 text-orange-400"/> {item.common_name}</td>
                                <td className="p-4 text-xs text-[var(--color-muted)]"><span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded">PRAGA</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteItem('kb_pests', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                        {dFiltered.map(item => (
                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                                <td className="p-4 font-bold text-white flex items-center gap-2"><Bug className="w-4 h-4 text-purple-400"/> {item.name}</td>
                                <td className="p-4 text-xs text-[var(--color-muted)]"><span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">DOENÇA</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteItem('kb_diseases', item.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto space-y-8">
            
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Globe className="w-8 h-8 text-indigo-500" />
                        Biblioteca Global AgroGB
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Gerencie o Cérebro Técnico e o Grafo de Conhecimento que alimenta toda a plataforma.
                    </p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all"
                >
                    <Plus className="w-5 h-5" /> Adicionar ao Catálogo
                </button>
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="glass rounded-3xl border border-[var(--color-border)] p-6">
                
                {/* TABS */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 border-b border-white/5 pb-4">
                    <button 
                        onClick={() => setActiveTab('CULTURAS')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'CULTURAS' ? 'bg-green-500/20 text-green-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}
                    >
                        <Leaf className="w-5 h-5" /> Culturas
                    </button>
                    <button 
                        onClick={() => setActiveTab('PRODUTOS')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'PRODUTOS' ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}
                    >
                        <Package className="w-5 h-5" /> Produtos Comerciais
                    </button>
                    <button 
                        onClick={() => setActiveTab('FITOSSANITARIO')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'FITOSSANITARIO' ? 'bg-orange-500/20 text-orange-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}
                    >
                        <Bug className="w-5 h-5" /> Pragas e Doenças
                    </button>

                    <div className="flex-1"></div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                        <input 
                            type="text" 
                            placeholder="Buscar na biblioteca..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-2 pl-9 pr-4 text-white focus:outline-none focus:border-indigo-500 transition-all text-sm"
                        />
                    </div>
                    <button onClick={fetchDados} className="p-2 bg-white/5 border border-[var(--color-border)] rounded-xl text-[var(--color-muted)] hover:text-white transition-all">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* AREA DE RENDERIZAÇÃO */}
                {loading ? (
                    <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
                ) : (
                    <>
                        {activeTab === 'CULTURAS' && renderCrops()}
                        {activeTab === 'PRODUTOS' && renderProducts()}
                        {activeTab === 'FITOSSANITARIO' && renderPhyto()}
                    </>
                )}
            </div>

            {/* MODAL ADICIONAR ITEM */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}>
                    <div className="glass w-full max-w-md rounded-3xl p-8 border border-[var(--color-border)] animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-white">Novo Item Global</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-[var(--color-muted)] hover:text-white"><X className="w-6 h-6"/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Tipo de Inserção</label>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-white font-bold text-sm">
                                    Adicionando em: <span className="text-indigo-400">{activeTab}</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Nome Oficial</label>
                                <input 
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="Ex: Milho, Calcinit, Lagarta do Cartucho..."
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 font-bold"
                                />
                            </div>

                            {activeTab === 'PRODUTOS' && (
                                <div>
                                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Categoria do Produto</label>
                                    <select 
                                        value={newItemCategory}
                                        onChange={(e) => setNewItemCategory(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 font-bold"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="FERTILIZANTE">Fertilizante</option>
                                        <option value="DEFENSIVO">Defensivo</option>
                                        <option value="ADJUVANTE">Adjuvante</option>
                                    </select>
                                </div>
                            )}

                            {activeTab === 'FITOSSANITARIO' && (
                                <div>
                                    <label className="text-xs font-bold text-[var(--color-muted)] uppercase mb-1 block">Classificação</label>
                                    <select 
                                        value={newItemCategory}
                                        onChange={(e) => setNewItemCategory(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:border-indigo-500 font-bold"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="PRAGA">Praga</option>
                                        <option value="DOENCA">Doença</option>
                                    </select>
                                </div>
                            )}

                            <button 
                                onClick={handleAddItem}
                                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl shadow-lg transition-all"
                            >
                                Salvar no Grafo de Conhecimento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
