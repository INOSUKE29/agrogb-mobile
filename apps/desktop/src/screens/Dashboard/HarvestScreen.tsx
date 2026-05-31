import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Download, Filter, Sprout, Loader2 } from 'lucide-react';

export default function HarvestScreen() {
    const [colheitas, setColheitas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCultura, setFilterCultura] = useState('TODAS');

    // Mapeamento único de culturas para o Select de filtro
    const culturasUnicas = ['TODAS', ...Array.from(new Set(colheitas.map(c => c.cultura)))];

    const fetchColheitas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('colheitas')
                .select('*')
                .eq('is_deleted', 0)
                .order('data', { ascending: false });

            if (error) throw error;
            setColheitas(data || []);
        } catch (error) {
            console.error('Erro ao buscar colheitas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColheitas();
    }, []);

    // Filter Logic
    const filteredData = colheitas.filter(c => {
        const matchSearch = 
            (c.produto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
            (c.cultura?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (c.observacao?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        const matchCultura = filterCultura === 'TODAS' || c.cultura === filterCultura;
        return matchSearch && matchCultura;
    });

    // Export CSV
    const exportCSV = () => {
        if (filteredData.length === 0) return;
        
        const headers = ['Data', 'Cultura', 'Produto', 'Quantidade (Kg)', 'Observação', 'Status Sincronização'];
        const rows = filteredData.map(c => [
            format(parseISO(c.data), 'dd/MM/yyyy'),
            c.cultura,
            c.produto,
            c.quantidade,
            c.observacao || '',
            c.sync_status === 1 ? 'Sincronizado' : 'Pendente'
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Relatorio_Colheitas_${format(new Date(), 'dd-MM-yyyy')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="animate-fade-in pb-12">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Sprout className="w-8 h-8 text-[var(--color-primary)]" />
                        Gestão de Colheitas
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Histórico completo de produção registrada pelos agrônomos em campo.
                    </p>
                </div>
                
                <button 
                    onClick={exportCSV}
                    className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-[var(--color-primary)]/20 transition-all flex items-center justify-center gap-2"
                >
                    <Download className="w-5 h-5" />
                    <span>Exportar CSV</span>
                </button>
            </div>

            {/* Filter Bar */}
            <div className="glass p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <input 
                        type="text" 
                        placeholder="Buscar por produto, cultura ou observação..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
                    />
                </div>
                
                <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-muted)]" />
                    <select 
                        value={filterCultura}
                        onChange={(e) => setFilterCultura(e.target.value)}
                        className="w-full bg-[var(--color-background)]/50 border border-[var(--color-border)] rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[var(--color-primary)] transition-all appearance-none cursor-pointer"
                    >
                        {culturasUnicas.map(cultura => (
                            <option key={cultura} value={cultura} className="bg-[var(--color-card)]">{cultura}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table Area */}
            <div className="glass rounded-2xl overflow-hidden border border-[var(--color-border)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--color-background)]/80 border-b border-[var(--color-border)]">
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Data</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Cultura / Produto</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Volume (Kg)</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider">Observação</th>
                                <th className="p-4 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-[var(--color-muted)]">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[var(--color-primary)]" />
                                        Carregando registros da nuvem...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-[var(--color-muted)]">
                                        Nenhum registro de colheita encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row) => (
                                    <tr key={row.id || row.uuid} className="border-b border-[var(--color-border)] hover:bg-[var(--color-primary)]/5 transition-colors">
                                        <td className="p-4 text-sm font-medium text-white whitespace-nowrap">
                                            {format(parseISO(row.data), 'dd MMM yyyy', { locale: ptBR })}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <p className="font-bold text-white">{row.produto}</p>
                                            <p className="text-xs text-[var(--color-muted)]">{row.cultura}</p>
                                        </td>
                                        <td className="p-4 text-sm font-black text-[var(--color-primary)]">
                                            {row.quantidade?.toLocaleString('pt-BR')} kg
                                        </td>
                                        <td className="p-4 text-sm text-[var(--color-muted)] max-w-xs truncate">
                                            {row.observacao || '-'}
                                        </td>
                                        <td className="p-4 text-sm text-right">
                                            {row.sync_status === 1 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    Sincronizado
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                                                    Nuvem Direta
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
