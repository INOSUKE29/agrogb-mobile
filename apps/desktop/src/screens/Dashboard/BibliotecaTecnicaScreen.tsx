import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Leaf, Package, Bug, Percent, GitMerge, Activity, Search, RefreshCw, Beaker } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BibliotecaTecnicaScreen() {
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'CULTURAS' | 'PRODUTOS' | 'FITOSSANITARIO' | 'RESULTADOS' | 'COMBINACOES' | 'FASES'>('CULTURAS');
    
    const [crops, setCrops] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);
    const [pests, setPests] = useState<any[]>([]);
    const [diseases, setDiseases] = useState<any[]>([]);
    const [outcomes, setOutcomes] = useState<any[]>([]);
    const [combinations, setCombinations] = useState<any[]>([]);
    const [phases, setPhases] = useState<any[]>([]);

    const fetchDados = async () => {
        setLoading(true);
        try {
            if (activeTab === 'CULTURAS') {
                const { data, error } = await supabase.from('kb_crops').select('*').eq('scope', 'GLOBAL').order('name');
                if (!error && data) setCrops(data);
            } 
            else if (activeTab === 'PRODUTOS') {
                const { data, error } = await supabase.from('kb_products').select('*').eq('scope', 'GLOBAL').order('name');
                if (!error && data) setProducts(data);
            } 
            else if (activeTab === 'FITOSSANITARIO') {
                const { data: pData } = await supabase.from('kb_pests').select('*').eq('scope', 'GLOBAL').order('common_name');
                const { data: dData } = await supabase.from('kb_diseases').select('*').eq('scope', 'GLOBAL').order('name');
                if (pData) setPests(pData);
                if (dData) setDiseases(dData);
            } 
            else if (activeTab === 'RESULTADOS') {
                const { data, error } = await supabase.from('kb_outcomes').select(`
                    id, control_percentage, evaluation_days,
                    treatment:kb_products!treatment_id(name),
                    problem_pest:kb_pests!problem_id(common_name),
                    problem_disease:kb_diseases!problem_id(name)
                `).order('created_at', { ascending: false });
                if (!error && data) setOutcomes(data);
            } 
            else if (activeTab === 'COMBINACOES') {
                const { data, error } = await supabase.from('kb_combinations').select(`
                    id, result_status, notes,
                    product_a:kb_products!product_a_id(name),
                    product_b:kb_products!product_b_id(name)
                `).order('created_at', { ascending: false });
                if (!error && data) setCombinations(data);
            } 
            else if (activeTab === 'FASES') {
                const { data, error } = await supabase.from('kb_phenological_phases').select(`
                    id, phase_order, name, duration_days,
                    crop:kb_crops!crop_id(name)
                `).order('phase_order', { ascending: true });
                if (!error && data) setPhases(data);
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
            toast.error('Erro ao conectar com a Biblioteca Global.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDados();
    }, [activeTab]);

    const renderCrops = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {crops.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                <div key={c.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="font-bold text-white flex items-center gap-2"><Leaf className="w-5 h-5 text-emerald-400"/> {c.name}</div>
                    {c.scientific_name && <div className="text-sm text-[var(--color-muted)] italic mt-1">{c.scientific_name}</div>}
                </div>
            ))}
        </div>
    );

    const renderProducts = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                <div key={p.id} className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-blue-400"/> {p.name}</div>
                    <div className="mt-2 text-xs font-bold text-[var(--color-muted)] bg-black/20 px-2 py-1 rounded inline-block">{p.category}</div>
                </div>
            ))}
        </div>
    );

    const renderPhyto = () => (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Bug className="w-5 h-5 text-orange-400" /> Pragas & Insetos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {pests.filter(p => p.common_name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                        <div key={p.id} className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl hover:bg-orange-500/10 transition-colors">
                            <div className="font-bold text-orange-100">{p.common_name}</div>
                            {p.scientific_name && <div className="text-xs text-orange-400/70 italic mt-1">{p.scientific_name}</div>}
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-red-400" /> Doenças & Fungos</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {diseases.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase())).map(d => (
                        <div key={d.id} className="p-4 bg-red-500/5 border border-red-500/10 rounded-xl hover:bg-red-500/10 transition-colors">
                            <div className="font-bold text-red-100">{d.name}</div>
                            {d.scientific_name && <div className="text-xs text-red-400/70 italic mt-1">{d.scientific_name}</div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto space-y-8">
            {/* HEADER */}
            <div className="flex flex-col border-b border-[var(--color-border)] pb-6 pt-4">
                <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                    <Database className="w-8 h-8 text-indigo-500" />
                    Biblioteca Técnica AgroGB
                </h1>
                <p className="text-[var(--color-muted)] font-medium mt-1">
                    Consulte a base de dados inteligente com todas as culturas, produtos e resultados técnicos consolidados.
                </p>
            </div>

            {/* CONTEÚDO PRINCIPAL */}
            <div className="glass rounded-3xl border border-[var(--color-border)] p-6">
                
                {/* TABS (Scroll horizontal em mobile) */}
                <div className="flex overflow-x-auto gap-4 mb-6 border-b border-white/5 pb-4 custom-scrollbar">
                    <button onClick={() => setActiveTab('CULTURAS')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'CULTURAS' ? 'bg-green-500/20 text-green-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <Leaf className="w-4 h-4" /> Culturas
                    </button>
                    <button onClick={() => setActiveTab('PRODUTOS')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'PRODUTOS' ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <Package className="w-4 h-4" /> Produtos
                    </button>
                    <button onClick={() => setActiveTab('FITOSSANITARIO')} className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${activeTab === 'FITOSSANITARIO' ? 'bg-orange-500/20 text-orange-400' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
                        <Bug className="w-4 h-4" /> Problemas Fito
                    </button>
                    {/* Outras tabs podem ser reativadas aqui futuramente para visualização de resultados e misturas */}
                </div>

                <div className="flex flex-col md:flex-row justify-end mb-6 gap-4">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-muted)]" />
                        <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-2 pl-9 pr-4 text-white focus:outline-none focus:border-indigo-500 text-sm"/>
                    </div>
                    <button onClick={fetchDados} className="p-2 bg-white/5 border border-[var(--color-border)] rounded-xl text-[var(--color-muted)] hover:text-white"><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
                ) : (
                    <>
                        {activeTab === 'CULTURAS' && renderCrops()}
                        {activeTab === 'PRODUTOS' && renderProducts()}
                        {activeTab === 'FITOSSANITARIO' && renderPhyto()}
                    </>
                )}
            </div>
        </div>
    );
}

// Missing icon import hack
const Database = ({className}: {className?: string}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>;
