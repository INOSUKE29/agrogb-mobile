import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Users, 
    Leaf, 
    Droplet, 
    Plus, 
    Trash2, 
    Printer, 
    Send,
    CheckCircle2,
    Clock,
    FileEdit,
    ArrowLeft,
    Save
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useLocation } from 'react-router-dom';

const COMMON_PRODUCTS = [
    'NITRATO DE CÁLCIO', 'MAP (FOSFATO MONOAMÔNICO)', 'SULFATO DE MAGNÉSIO', 
    'CLORETO DE POTÁSSIO', 'URÉIA', 'ÁCIDO FOSFÓRICO', 'BORO (SULFATO DE BORO)', 
    'SULFATO DE ZINCO', 'NITRATO DE POTÁSSIO', 'QUELATO DE FERRO'
];

interface Cliente {
    id: string;
    nome: string;
}

interface Plantio {
    uuid: string;
    cultura: string;
    tipo_plantio: string;
}

interface ReceitaItem {
    id: string;
    product: string;
    dosage: string;
    unit: string;
    baseQty: string;
    baseUnit: string;
}

export default function RecomendacoesScreen() {
    const location = useLocation();
    const isAgronomo = location.pathname.includes('agronomo');
    const [loading, setLoading] = useState(false);
    
    // Data sources
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [plantios, setPlantios] = useState<Plantio[]>([]);
    
    // Selections
    const [selectedClient, setSelectedClient] = useState('');
    const [selectedPlanting, setSelectedPlanting] = useState('');
    const [activeTab, setActiveTab] = useState<'GOTEJO' | 'FOLIAR'>('GOTEJO');
    
    // Form
    const [recipeRows, setRecipeRows] = useState<ReceitaItem[]>([
        { id: '1', product: '', dosage: '', unit: 'ML', baseQty: '100', baseUnit: 'L' }
    ]);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Views
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [statusTab, setStatusTab] = useState<'Rascunho' | 'Pendente' | 'Aprovada'>('Pendente');
    const [receitasList, setReceitasList] = useState<Record<string, string | number | boolean | null>[]>([]);

    const loadReceitas = async () => {
        setLoading(true);
        try {
            if (isAgronomo) {
                const { data, error } = await supabase
                    .from('receitas_adubacao')
                    .select('*')
                    .eq('status', statusTab)
                    .order('created_at', { ascending: false });
                
                if (data) setReceitasList(data);
            } else {
                // Produtor: carregar apenas as locais (localStorage)
                const localData = localStorage.getItem('receitas_produtor');
                if (localData) {
                    const parsed = JSON.parse(localData);
                    setReceitasList(parsed.filter((r: any) => r.status === statusTab));
                } else {
                    setReceitasList([]);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMocks = async () => {
        // Simulando busca de clientes vinculados
        setClientes([
            { id: 'cli-1', nome: 'João Batista (Fazenda Boa Esperança)' },
            { id: 'cli-2', nome: 'Carlos Mendes (Sítio São José)' }
        ]);

        // Se conectarmos de verdade, seria algo como:
        // const { data } = await supabase.from('agronomist_client_links').select('client_name, client_id');
    };

    useEffect(() => {
        if (viewMode === 'list') {
            loadReceitas();
        } else {
            fetchMocks();
        }
    }, [viewMode, statusTab]);

    useEffect(() => {
        if (selectedClient) {
            // Buscar plantios (simulado)
            setPlantios([
                { uuid: 'p-1', cultura: 'SOJA', tipo_plantio: 'SEQUEIRO' },
                { uuid: 'p-2', cultura: 'MILHO', tipo_plantio: 'IRRIGADO' }
            ]);
        } else {
            setPlantios([]);
        }
    }, [selectedClient]);

    const handleAddRow = () => {
        const newId = crypto.randomUUID();
        setRecipeRows([...recipeRows, { id: newId, product: '', dosage: '', unit: 'ML', baseQty: '100', baseUnit: 'L' }]);
    };

    const handleRemoveRow = (id: string) => {
        if (recipeRows.length === 1) return;
        setRecipeRows(recipeRows.filter(r => r.id !== id));
    };

    const handleRowChange = (id: string, field: keyof ReceitaItem, value: string) => {
        setRecipeRows(recipeRows.map(row => {
            if (row.id === id) {
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const generateHTMLContent = () => {
        const clientName = isAgronomo 
            ? (clientes.find(c => c.id === selectedClient)?.nome || 'Não informado')
            : 'Própria Fazenda (Uso Interno)';
            
        const plantingName = plantios.find(p => p.uuid === selectedPlanting);
        const plantingLabel = plantingName ? `${plantingName.cultura} (${plantingName.tipo_plantio})` : 'Não informado';

        return `
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 30px; }
                    .title { color: #064E3B; font-size: 28px; font-weight: bold; margin: 0; }
                    .subtitle { color: #666; font-size: 16px; margin-top: 5px; }
                    .info-section { display: flex; justify-content: space-between; margin-bottom: 30px; background: #F3F4F6; padding: 20px; border-radius: 8px; }
                    .info-block p { margin: 8px 0; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    th { background-color: #10B981; color: white; text-align: left; padding: 15px; font-size: 14px; }
                    td { padding: 15px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
                    tr:nth-child(even) { background-color: #F9FAFB; }
                    .notes { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; font-size: 14px; margin-bottom: 60px; }
                    .footer { margin-top: 80px; text-align: center; }
                    .signature-line { width: 300px; border-top: 1px solid #333; margin: 0 auto 10px auto; }
                    .footer-text { font-size: 14px; color: #666; }
                    .watermark { font-size: 10px; color: #9CA3AF; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="title">RECEITUÁRIO AGRONÔMICO</h1>
                    <p class="subtitle">Prescrição Técnica Oficial</p>
                </div>
                
                <div class="info-section">
                    <div class="info-block">
                        <p><strong>Produtor:</strong> ${clientName}</p>
                        <p><strong>Talhão/Cultura:</strong> ${plantingLabel}</p>
                        <p><strong>Data de Emissão:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div class="info-block">
                        <p><strong>Resp. Técnico:</strong> Engenheiro Agrônomo</p>
                        <p><strong>Método de Aplicação:</strong> Via ${activeTab}</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Produto (Insumo)</th>
                            <th>Dose Recomendada</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recipeRows.map((r, index) => `
                            <tr>
                                <td>#${index + 1}</td>
                                <td><strong>${r.product.toUpperCase()}</strong></td>
                                <td>${r.dosage} ${r.unit} <span style="color:#666; font-size:12px;">para cada ${r.baseQty} ${r.baseUnit}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="notes">
                    <strong>Observações Técnicas:</strong><br/>
                    ${notes.trim() ? notes.replace(/\n/g, '<br/>') : 'Nenhuma observação adicional.'}
                </div>

                <div class="footer">
                    <div class="signature-line"></div>
                    <p class="footer-text"><strong>Engenheiro Agrônomo Responsável</strong></p>
                    <p class="footer-text">Assinatura do Profissional</p>
                    <p class="watermark">Gerado digitalmente pelo sistema AgroGB Enterprise Desktop</p>
                </div>
                
                <script>
                    window.onload = function() { window.print(); window.close(); }
                </script>
            </body>
            </html>
        `;
    };

    const handlePrint = () => {
        if (!selectedClient) return alert('Selecione um cliente para imprimir.');
        const invalidRow = recipeRows.find(r => !r.product.trim() || !r.dosage.trim());
        if (invalidRow) return alert('Preencha os produtos e dosagens antes de imprimir.');

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(generateHTMLContent());
            printWindow.document.close();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isAgronomo && !selectedClient) return alert('Selecione o produtor destinatário.');
        
        const invalidRow = recipeRows.find(r => !r.product.trim() || !r.dosage.trim());
        if (invalidRow) return alert('Verifique se todos os itens possuem Produto e Dose preenchidos.');

        setSubmitting(true);
        try {
            if (isAgronomo) {
                // Agrônomo: Salva na biblioteca global / Supabase
                const { error } = await supabase.from('receitas_adubacao').insert({
                    nome: `Receita ${selectedClient.substring(0, 4)}`,
                    tipo: activeTab === 'FOLIAR' ? 'Foliar' : 'Fertirrigação',
                    status: 'Pendente', // Pending approval from client
                    instrucoes: notes
                });
                
                if (error) throw error;
                alert('Prescrição salva com sucesso no banco de dados!');
            } else {
                // Produtor: Salva localmente (apenas para uso próprio)
                const novaReceitaLocal = {
                    id: crypto.randomUUID(),
                    nome: `Receita Própria (${new Date().toLocaleDateString()})`,
                    tipo: activeTab === 'FOLIAR' ? 'Foliar' : 'Fertirrigação',
                    status: 'Pendente',
                    instrucoes: notes,
                    created_at: new Date().toISOString()
                };

                const existing = JSON.parse(localStorage.getItem('receitas_produtor') || '[]');
                existing.push(novaReceitaLocal);
                localStorage.setItem('receitas_produtor', JSON.stringify(existing));
                
                alert('Receita salva localmente com sucesso!');
            }
            
            setViewMode('list');
            setStatusTab('Pendente');
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar.');
        } finally {
            setSubmitting(false);
        }
    };

    if (viewMode === 'list') {
        return (
            <div className="animate-fade-in pb-12 max-w-6xl mx-auto">
                {/* CABEÇALHO LISTA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6 pt-4">
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            <FileText className="w-8 h-8 text-green-500" />
                            Recomendações Agronômicas
                        </h1>
                        <p className="text-[var(--color-muted)] font-medium mt-1">
                            Acompanhe prescrições enviadas, rascunhos e aprovações dos produtores.
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => setViewMode('form')}
                        className={`flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl shadow-lg transition-all text-white ${isAgronomo ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
                    >
                        <Plus className="w-5 h-5" />
                        {isAgronomo ? 'Nova Recomendação' : 'Nova Receita Interna'}
                    </button>
                </div>

                {/* ABAS */}
                <div className="flex gap-4 mb-8">
                    {['Rascunho', 'Pendente', 'Aprovada'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setStatusTab(tab as any)}
                            className={`flex-1 py-3 font-bold rounded-xl border-b-4 transition-all ${
                                statusTab === tab 
                                    ? 'bg-white/10 border-green-500 text-white' 
                                    : 'bg-transparent border-transparent text-[var(--color-muted)] hover:bg-white/5'
                            }`}
                        >
                            {tab === 'Rascunho' && <FileEdit className="w-4 h-4 inline mr-2 mb-1" />}
                            {tab === 'Pendente' && <Clock className="w-4 h-4 inline mr-2 mb-1 text-yellow-400" />}
                            {tab === 'Aprovada' && <CheckCircle2 className="w-4 h-4 inline mr-2 mb-1 text-green-400" />}
                            {tab === 'Pendente' ? 'Enviadas (Aguardando)' : tab + 's'}
                        </button>
                    ))}
                </div>

                {/* LISTA */}
                <div className="premium-card rounded-2xl overflow-hidden mt-4">
                    {loading ? (
                        <div className="text-center py-12 text-[var(--color-muted)] font-bold">Carregando prescrições...</div>
                    ) : receitasList.length === 0 ? (
                        <div className="text-center py-24">
                            <FileText className="w-12 h-12 mx-auto text-[var(--color-muted)] mb-4 opacity-30" />
                            <h3 className="text-xl font-bold text-white mb-2">Nenhuma recomendação {statusTab.toLowerCase()}</h3>
                            <p className="text-[var(--color-muted)]">Crie uma nova prescrição técnica para ela aparecer nesta tabela.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)]">
                                        <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider w-16">Tipo</th>
                                        <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider">Identificação</th>
                                        <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider hidden md:table-cell">Data de Emissão</th>
                                        <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider">Status</th>
                                        <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(255,255,255,0.02)]">
                                    {receitasList.map(rec => (
                                        <tr key={rec.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                                            <td className="p-4">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                                                    rec.tipo === 'Foliar' ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' :
                                                    'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                }`}>
                                                    {rec.tipo === 'Foliar' ? <Leaf className="w-5 h-5" /> : <Droplet className="w-5 h-5" />}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <h4 className="text-white font-bold text-base">{rec.nome || 'Receituário Sem Título'}</h4>
                                                <p className="text-[var(--color-muted)] text-xs mt-1">Aplicação: {rec.tipo}</p>
                                            </td>
                                            <td className="p-4 hidden md:table-cell text-[var(--color-muted)] text-sm">
                                                {new Date(rec.created_at as string).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                                    statusTab === 'Aprovada' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    statusTab === 'Pendente' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                    'bg-white/5 text-[var(--color-muted)] border-white/10'
                                                }`}>
                                                    {statusTab === 'Pendente' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>}
                                                    {statusTab === 'Aprovada' ? 'APLICADA' : statusTab.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button className="bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-white font-bold py-2 px-4 rounded-lg border border-[rgba(255,255,255,0.1)] transition-all text-sm">
                                                    Abrir Prescrição
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-12 max-w-4xl mx-auto">
            
            {/* CABEÇALHO FORM */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <button 
                        onClick={() => setViewMode('list')}
                        className="text-[var(--color-muted)] hover:text-white mb-2 flex items-center gap-2 transition-colors font-bold text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" /> Voltar para lista
                    </button>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <FileText className={`w-8 h-8 ${isAgronomo ? 'text-green-500' : 'text-blue-500'}`} />
                        {isAgronomo ? 'Emissão de Receituário' : 'Criação de Receita Interna'}
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        {isAgronomo 
                            ? 'Elabore prescrições técnicas e receitas de adubação para seus clientes.' 
                            : 'Crie suas próprias caldas e misturas para uso na fazenda (Salvo Localmente).'}
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl border border-[var(--color-border)] transition-all"
                    >
                        <Printer className="w-5 h-5" />
                        Imprimir PDF
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`flex items-center justify-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 ${isAgronomo ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'}`}
                    >
                        {isAgronomo ? <Send className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {submitting ? 'Salvando...' : (isAgronomo ? 'Salvar no Supabase' : 'Salvar Localmente')}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                
                {/* 1. SELEÇÃO DE CLIENTE E TALHÃO */}
                <div className="premium-card p-6 rounded-2xl flex flex-col gap-6">
                    <h2 className="text-xs font-black text-[var(--color-muted)] uppercase tracking-widest border-b border-[rgba(255,255,255,0.05)] pb-3 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] text-white flex items-center justify-center">1</span> 
                        Identificação e Destino
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {isAgronomo && (
                            <div>
                                <label className="block text-xs font-black uppercase text-[var(--color-muted)] tracking-wider mb-2">
                                    Produtor Destinatário *
                                </label>
                                <select 
                                    required
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                    className="w-full bg-[#0a192f] border border-[rgba(255,255,255,0.1)] text-white text-base rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent block p-3.5 transition-all font-medium"
                                >
                                    <option value="" disabled>Selecione o Cliente</option>
                                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                </select>
                            </div>
                        )}

                        <div className={!isAgronomo ? "md:col-span-2" : ""}>
                            <label className="block text-xs font-black uppercase text-[var(--color-muted)] tracking-wider mb-2">
                                Talhão / Cultura Alvo
                            </label>
                            <select 
                                value={selectedPlanting}
                                onChange={(e) => setSelectedPlanting(e.target.value)}
                                disabled={!selectedClient}
                                className="w-full bg-[#0a192f] border border-[rgba(255,255,255,0.1)] text-white text-base rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent block p-3.5 transition-all disabled:opacity-50 font-medium"
                            >
                                <option value="">Geral (Nenhum talhão específico)</option>
                                {plantios.map(p => <option key={p.uuid} value={p.uuid}>{p.cultura} ({p.tipo_plantio})</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. MÉTODO DE APLICAÇÃO */}
                <div className="premium-card p-6 rounded-2xl flex flex-col gap-6">
                    <h2 className="text-xs font-black text-[var(--color-muted)] uppercase tracking-widest border-b border-[rgba(255,255,255,0.05)] pb-3 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] text-white flex items-center justify-center">2</span> 
                        Método de Aplicação
                    </h2>
                    
                    <div className="flex flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab('GOTEJO')}
                            className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl border-2 font-bold transition-all ${
                                activeTab === 'GOTEJO' 
                                    ? 'border-green-500 bg-green-500/10 text-green-400' 
                                    : 'border-[rgba(255,255,255,0.05)] bg-[#0a192f] text-[var(--color-muted)] hover:border-[rgba(255,255,255,0.1)]'
                            }`}
                        >
                            <Droplet className="w-5 h-5" />
                            VIA GOTEJO / FERTIRRIGAÇÃO
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setActiveTab('FOLIAR')}
                            className={`flex-1 flex items-center justify-center gap-3 py-5 rounded-xl border-2 font-bold transition-all ${
                                activeTab === 'FOLIAR' 
                                    ? 'border-green-500 bg-green-500/10 text-green-400' 
                                    : 'border-[rgba(255,255,255,0.05)] bg-[#0a192f] text-[var(--color-muted)] hover:border-[rgba(255,255,255,0.1)]'
                            }`}
                        >
                            <Leaf className="w-5 h-5" />
                            APLICAÇÃO FOLIAR
                        </button>
                    </div>
                </div>

                {/* 3. PRODUTOS E DOSAGEM */}
                <div className="premium-card p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.05)] pb-4 mb-2">
                        <h2 className="text-xs font-black text-[var(--color-muted)] uppercase tracking-widest flex items-center gap-2">
                            <span className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] text-white flex items-center justify-center">3</span> 
                            Formulação da Receita
                        </h2>
                        <button 
                            type="button"
                            onClick={handleAddRow}
                            className="flex items-center gap-2 text-xs font-black bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 px-4 py-2 rounded-lg transition-all uppercase"
                        >
                            <Plus className="w-4 h-4" /> Add Linha de Insumo
                        </button>
                    </div>

                    <div className="flex flex-col gap-3">
                        {recipeRows.map((row, index) => (
                            <div key={row.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-[#0a192f] p-3 rounded-xl border border-[rgba(255,255,255,0.05)]">
                                
                                <div className="w-full md:w-5/12 flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[rgba(255,255,255,0.05)] flex items-center justify-center text-[var(--color-muted)] text-xs font-bold shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="w-full">
                                        <label className="block text-[10px] font-black text-[var(--color-muted)] uppercase tracking-widest mb-1">Insumo</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="Ex: Nitrato de Cálcio"
                                            value={row.product}
                                            onChange={(e) => handleRowChange(row.id, 'product', e.target.value)}
                                            className="w-full bg-transparent border-b border-[rgba(255,255,255,0.1)] text-white text-sm focus:border-green-500 outline-none pb-1 font-bold"
                                            list="produtos-list"
                                        />
                                    </div>
                                </div>

                                <div className="w-full md:w-3/12">
                                    <label className="block text-[10px] font-black text-[var(--color-muted)] uppercase tracking-widest mb-1">Volume/Dose</label>
                                    <div className="flex">
                                        <input 
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="Ex: 10"
                                            value={row.dosage}
                                            onChange={(e) => handleRowChange(row.id, 'dosage', e.target.value)}
                                            className="w-1/2 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.1)] text-white text-sm rounded-l-lg focus:ring-2 focus:ring-green-500 block p-2 transition-all font-mono"
                                        />
                                        <select
                                            value={row.unit}
                                            onChange={(e) => handleRowChange(row.id, 'unit', e.target.value)}
                                            className="w-1/2 bg-[rgba(255,255,255,0.05)] border-y border-r border-[rgba(255,255,255,0.1)] text-white text-sm font-bold rounded-r-lg focus:ring-2 focus:ring-green-500 block p-2 transition-all"
                                        >
                                            <option value="KG">KG</option>
                                            <option value="GR">GR</option>
                                            <option value="LT">LT</option>
                                            <option value="ML">ML</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="w-full md:w-3/12">
                                    <label className="block text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Calibrador Base</label>
                                    <div className="flex">
                                        <input 
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="Ex: 100"
                                            value={row.baseQty}
                                            onChange={(e) => handleRowChange(row.id, 'baseQty', e.target.value)}
                                            className="w-1/2 bg-green-500/5 border border-green-500/20 text-white text-sm rounded-l-lg focus:ring-2 focus:ring-green-500 block p-2 transition-all font-mono"
                                        />
                                        <select
                                            value={row.baseUnit}
                                            onChange={(e) => handleRowChange(row.id, 'baseUnit', e.target.value)}
                                            className="w-1/2 bg-green-500/10 border-y border-r border-green-500/20 text-green-400 text-sm font-bold rounded-r-lg focus:ring-2 focus:ring-green-500 block p-2 transition-all"
                                        >
                                            <option value="L">Lts de Água</option>
                                            <option value="HA">Hectare (ha)</option>
                                            <option value="PLANTAS">Plantas (Pés)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="w-full md:w-1/12 mt-4 md:mt-0 flex justify-end">
                                    {recipeRows.length > 1 ? (
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveRow(row.id)}
                                            className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                            title="Excluir"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <div className="w-9"></div>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. OBSERVAÇÕES */}
                <div className="premium-card p-6 rounded-2xl flex flex-col gap-4">
                    <h2 className="text-xs font-black text-[var(--color-muted)] uppercase tracking-widest border-b border-[rgba(255,255,255,0.05)] pb-3 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-[rgba(255,255,255,0.05)] text-white flex items-center justify-center">4</span> 
                        Parâmetros Adicionais & Observações
                    </h2>
                    
                    <textarea 
                        rows={3}
                        placeholder="Observações sobre mistura, tanque, PH da água ou horários de aplicação..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-[#0a192f] border border-[rgba(255,255,255,0.1)] text-white text-sm rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent block p-4 transition-all resize-none"
                    />
                </div>

            </form>
        </div>
    );
}
