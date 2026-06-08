import React, { useState, useEffect } from 'react';
import { 
    BookOpen, 
    Plus, 
    Leaf, 
    TrendingDown, 
    ShoppingCart, 
    Activity, 
    FileText,
    DollarSign,
    Search,
    Calendar as CalendarIcon
} from 'lucide-react';
import { supabase } from '../../services/supabase';

interface TimelineItem {
    id: string;
    tipo: 'COLHEITA' | 'VENDA' | 'CUSTO' | 'COMPRA' | 'PLANTIO' | 'ADUBAÇÃO' | 'ANOTAÇÃO';
    data: string;
    descricao: string;
    observacao?: string;
    icon: Record<string, string | number | boolean | null>;
    colorClass: string;
    bgClass: string;
}

export default function CadernoAgricolaScreen() {
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [novaNota, setNovaNota] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchTimeline = async () => {
        setLoading(true);
        try {
            // Buscando dados de múltiplas tabelas do Supabase simultaneamente
            const [
                resColheitas,
                resVendas,
                resCustos,
                resCompras,
                resPlantio,
                resNotas,
                resAdubacao
            ] = await Promise.allSettled([
                supabase.from('colheitas').select('*').eq('is_deleted', false),
                supabase.from('vendas').select('*').eq('is_deleted', false),
                supabase.from('custos').select('*').eq('is_deleted', false),
                supabase.from('compras').select('*').eq('is_deleted', false),
                supabase.from('plantio').select('*').eq('is_deleted', false),
                supabase.from('caderno_notas').select('*').eq('is_deleted', false),
                supabase.from('planos_adubacao').select('*').eq('is_deleted', false)
            ]);

            const allItems: TimelineItem[] = [];

            // Processar Colheitas
            if (resColheitas.status === 'fulfilled' && resColheitas.value.data) {
                resColheitas.value.data.forEach((row: Record<string, string | number | boolean | null>) => {
                    allItems.push({
                        id: row.uuid || Math.random().toString(),
                        tipo: 'COLHEITA',
                        data: row.data,
                        descricao: `${row.cultura} - ${row.produto} (${row.quantidade}kg)`,
                        observacao: row.observacao,
                        icon: Leaf,
                        colorClass: 'text-green-500',
                        bgClass: 'bg-green-500/10'
                    });
                });
            }

            // Processar Vendas
            if (resVendas.status === 'fulfilled' && resVendas.value.data) {
                resVendas.value.data.forEach((row: Record<string, string | number | boolean | null>) => {
                    allItems.push({
                        id: row.uuid || Math.random().toString(),
                        tipo: 'VENDA',
                        data: row.data,
                        descricao: `${row.cliente} - ${row.produto} (R$ ${row.valor})`,
                        observacao: row.observacao,
                        icon: DollarSign,
                        colorClass: 'text-blue-500',
                        bgClass: 'bg-blue-500/10'
                    });
                });
            }

            // Processar Custos
            if (resCustos.status === 'fulfilled' && resCustos.value.data) {
                resCustos.value.data.forEach((row: Record<string, string | number | boolean | null>) => {
                    allItems.push({
                        id: row.uuid || Math.random().toString(),
                        tipo: 'CUSTO',
                        data: row.data,
                        descricao: `${row.tipo} - ${row.produto} (R$ ${row.valor_total})`,
                        observacao: row.observacao,
                        icon: TrendingDown,
                        colorClass: 'text-red-500',
                        bgClass: 'bg-red-500/10'
                    });
                });
            }

            // Processar Compras
            if (resCompras.status === 'fulfilled' && resCompras.value.data) {
                resCompras.value.data.forEach((row: Record<string, string | number | boolean | null>) => {
                    allItems.push({
                        id: row.uuid || Math.random().toString(),
                        tipo: 'COMPRA',
                        data: row.data,
                        descricao: `${row.item} (R$ ${row.valor})`,
                        observacao: row.observacao,
                        icon: ShoppingCart,
                        colorClass: 'text-yellow-500',
                        bgClass: 'bg-yellow-500/10'
                    });
                });
            }

            // Processar Plantio
            if (resPlantio.status === 'fulfilled' && resPlantio.value.data) {
                resPlantio.value.data.forEach((row: Record<string, string | number | boolean | null>) => {
                    allItems.push({
                        id: row.uuid || Math.random().toString(),
                        tipo: 'PLANTIO',
                        data: row.data,
                        descricao: `${row.cultura} (${row.quantidade_pes} mudas/sementes)`,
                        observacao: row.observacao,
                        icon: Activity,
                        colorClass: 'text-purple-500',
                        bgClass: 'bg-purple-500/10'
                    });
                });
            }

            // Processar Adubação / Aplicações
            if (resAdubacao.status === 'fulfilled' && resAdubacao.value.data) {
                resAdubacao.value.data.forEach((row: Record<string, string | number | boolean | null>) => {
                    allItems.push({
                        id: row.uuid || Math.random().toString(),
                        tipo: 'ADUBAÇÃO',
                        data: row.data_aplicacao || row.data_criacao || new Date().toISOString(),
                        descricao: `${row.nome_plano} - ${row.cultura} (${row.tipo_aplicacao})`,
                        observacao: `Status: ${row.status} | Área: ${row.area_local || 'N/A'}`,
                        icon: Leaf,
                        colorClass: 'text-green-500',
                        bgClass: 'bg-green-500/10'
                    });
                });
            }


            // Processar Anotações do Caderno
            if (resNotas.status === 'fulfilled' && resNotas.value.data) {
                resNotas.value.data.forEach((row: Record<string, string | number | boolean | null>) => {
                    let tipo: Record<string, string | number | boolean | null> = 'ANOTAÇÃO';
                    let icon = FileText;
                    let colorClass = 'text-gray-400';
                    let bgClass = 'bg-gray-500/10';

                    if (row.observacao?.toUpperCase().startsWith('[ADUBAÇÃO]')) {
                        tipo = 'ADUBAÇÃO';
                        icon = Leaf;
                        colorClass = 'text-green-500';
                        bgClass = 'bg-green-500/10';
                    }

                    allItems.push({
                        id: row.uuid || Math.random().toString(),
                        tipo,
                        data: row.data || new Date().toISOString(),
                        descricao: 'Nota do Produtor',
                        observacao: row.observacao,
                        icon,
                        colorClass,
                        bgClass
                    });
                });
            }

            // Ordenar de forma descendente (mais recente primeiro)
            allItems.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

            setTimeline(allItems);
        } catch (err) {
            console.error('Erro ao montar a timeline', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeline();
    }, []);



    const handleSaveNota = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novaNota.trim()) return alert('Escreva alguma anotação antes de salvar.');

        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await supabase.from('caderno_notas').insert([{
                uuid: crypto.randomUUID(),
                user_id: user?.id,
                observacao: novaNota.trim(),
                data: new Date().toISOString(),
                is_deleted: false,
                last_updated: new Date().toISOString()
            }]);
            
            setNovaNota('');
            setIsModalOpen(false);
            fetchTimeline();
        } catch (err) {
            console.error('Erro ao salvar nota', err);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredTimeline = timeline.filter(t => 
        t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.observacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tipo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in pb-12 max-w-5xl mx-auto">
            
            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6 sticky top-0 bg-[var(--color-background)] z-10 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-blue-500" />
                        Caderno Agrícola Diário
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Histórico cronológico unificado de todas as atividades da propriedade.
                    </p>
                </div>
                
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-primary)] hover:brightness-110 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.5)] transition-all duration-300 shrink-0 hover:-translate-y-0.5 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Nova Anotação
                </button>
            </div>

            {/* BARRA DE BUSCA E FILTRO */}
            <div className="mb-8">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-[var(--color-muted)]" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por tipo de atividade, data, cultura ou observação..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-card)] border border-[var(--color-border)] text-white text-base rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block pl-12 p-4 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* TIMELINE */}
            <div className="relative">
                {/* Linha Vertical da Timeline */}
                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-[var(--color-border)] hidden sm:block"></div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-[var(--color-muted)] font-bold">Folheando o caderno...</p>
                    </div>
                ) : filteredTimeline.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl border border-[var(--color-border)] shadow-xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-duration-700"></div>
                        <div className="relative z-10 w-24 h-24 bg-[var(--color-background)]/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-[var(--color-border)]">
                            <BookOpen className="w-10 h-10 text-[var(--color-muted)]" />
                        </div>
                        <h3 className="relative z-10 text-2xl font-black text-white mb-3">Páginas em branco</h3>
                        <p className="relative z-10 text-[var(--color-muted)] text-center max-w-md text-lg mb-8">
                            Inicie seu caderno de campo agora mesmo. Suas observações diárias viram inteligência de dados amanhã.
                        </p>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="relative z-10 px-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)] hover:text-white transition-all duration-300 active:scale-95 hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            Começar a Escrever
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {filteredTimeline.map((item, index) => {
                            const dateObj = new Date(item.data);
                            const formattedDate = dateObj.toLocaleDateString('pt-BR');
                            const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                            const IconComponent = item.icon;

                            return (
                                <div key={item.id + index} className="relative flex flex-col sm:flex-row gap-6 group">
                                    
                                    {/* Indicador de Timeline (Desktop) */}
                                    <div className="hidden sm:flex flex-col items-center z-10 w-16 shrink-0 mt-2">
                                        <div className={`w-12 h-12 rounded-full ${item.bgClass} border-4 border-[var(--color-background)] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <IconComponent className={`w-5 h-5 ${item.colorClass}`} />
                                        </div>
                                    </div>

                                    {/* Cartão de Conteúdo */}
                                    <div className="flex-1 glass rounded-2xl p-6 border-l-4 hover:-translate-y-1 transition-all duration-300" style={{ borderLeftColor: `var(--color-${item.colorClass.split('-')[1]}-500)` }}>
                                        
                                        {/* Cabeçalho do Cartão */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                {/* Indicador Mobile */}
                                                <div className={`sm:hidden w-8 h-8 rounded-full ${item.bgClass} flex items-center justify-center`}>
                                                    <IconComponent className={`w-4 h-4 ${item.colorClass}`} />
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wider ${item.bgClass} ${item.colorClass}`}>
                                                    {item.tipo}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[var(--color-muted)] text-sm font-bold">
                                                <CalendarIcon className="w-4 h-4" />
                                                {formattedDate} <span className="opacity-50 font-normal">às</span> {formattedTime}
                                            </div>
                                        </div>

                                        {/* Conteúdo Principal */}
                                        <h3 className="text-xl font-bold text-white mb-2">{item.descricao}</h3>
                                        
                                        {/* Observação (se existir) */}
                                        {item.observacao && (
                                            <div className="mt-3 bg-black/20 p-4 rounded-xl border border-white/5">
                                                <p className="text-[var(--color-muted)] text-sm italic">
                                                    "{item.observacao}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL NOVA ANOTAÇÃO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-[var(--color-card)] border border-[var(--color-border)] w-full max-w-lg rounded-2xl shadow-2xl flex flex-col">
                        <div className="p-6 border-b border-[var(--color-border)] flex justify-between items-center bg-white/[0.02] rounded-t-2xl">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-500" />
                                Nova Anotação no Caderno
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-muted)] hover:text-white p-1">
                                &times;
                            </button>
                        </div>
                        
                        <div className="p-6">
                            <form id="notaForm" onSubmit={handleSaveNota}>
                                <label className="block text-sm font-bold text-[var(--color-muted)] mb-3">
                                    O que aconteceu hoje na propriedade?
                                </label>
                                <textarea 
                                    rows={5}
                                    required
                                    value={novaNota}
                                    onChange={(e) => setNovaNota(e.target.value)}
                                    className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent outline-none ring-offset-2 ring-offset-[var(--color-card)] block p-4 transition-all resize-none shadow-inner"
                                    placeholder="Ex: Pulverização realizada no Talhão 02 devido à praga identificada. Dia muito quente."
                                />
                            </form>
                        </div>

                        <div className="p-6 border-t border-[var(--color-border)] flex justify-end gap-3 bg-white/[0.02] rounded-b-2xl">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 rounded-xl font-bold text-[var(--color-muted)] hover:text-white hover:bg-white/10 transition-all active:scale-95"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                form="notaForm"
                                disabled={isSaving}
                                className="px-6 py-3 rounded-xl font-bold text-white bg-[var(--color-primary)] hover:brightness-110 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.4)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:scale-95"
                            >
                                {isSaving ? 'Gravando...' : 'Registrar Nota'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
