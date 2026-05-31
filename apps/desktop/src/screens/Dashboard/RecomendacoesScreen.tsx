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
    ArrowLeft
} from 'lucide-react';
import { supabase } from '../../services/supabase';

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
    const [receitasList, setReceitasList] = useState<any[]>([]);

    useEffect(() => {
        if (viewMode === 'list') {
            loadReceitas();
        } else {
            fetchMocks();
        }
    }, [viewMode, statusTab]);

    const loadReceitas = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('receitas_adubacao')
                .select('*')
                .eq('status', statusTab)
                .order('created_at', { ascending: false });
            
            if (data) setReceitasList(data);
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
        const clientName = clientes.find(c => c.id === selectedClient)?.nome || 'Não informado';
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
        if (!selectedClient) return alert('Selecione o produtor destinatário.');
        
        const invalidRow = recipeRows.find(r => !r.product.trim() || !r.dosage.trim());
        if (invalidRow) return alert('Verifique se todos os itens possuem Produto e Dose preenchidos.');

        setSubmitting(true);
        try {
            // Aqui enviariamos para a tabela de 'recommendations' via Supabase
            const { error } = await supabase.from('receitas_adubacao').insert({
                nome: `Receita ${selectedClient.substring(0, 4)}`,
                tipo: activeTab === 'FOLIAR' ? 'Foliar' : 'Fertirrigação',
                status: 'Pendente', // Pending approval from client
                instrucoes: notes
            });
            
            if (error) throw error;
            
            alert('Prescrição salva com sucesso no banco de dados!');
            setViewMode('list');
            setStatusTab('Pendente');
        } catch (err) {
            console.error(err);
            alert('Erro ao salvar no Supabase.');
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
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Nova Recomendação
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
                <div className="grid grid-cols-1 gap-4">
                    {loading ? (
                        <div className="text-center py-12 text-[var(--color-muted)]">Carregando...</div>
                    ) : receitasList.length === 0 ? (
                        <div className="text-center py-24 glass rounded-3xl">
                            <FileText className="w-12 h-12 mx-auto text-[var(--color-muted)] mb-4 opacity-30" />
                            <h3 className="text-xl font-bold text-white mb-2">Nenhuma recomendação {statusTab.toLowerCase()}</h3>
                            <p className="text-[var(--color-muted)]">Crie uma nova receita para ela aparecer aqui.</p>
                        </div>
                    ) : (
                        receitasList.map(rec => (
                            <div key={rec.id} className="glass p-6 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                        statusTab === 'Aprovada' ? 'bg-green-500/20 text-green-400' :
                                        statusTab === 'Pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-white/10 text-[var(--color-muted)]'
                                    }`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">{rec.nome || 'Recomendação sem título'}</h4>
                                        <p className="text-[var(--color-muted)] text-sm">
                                            Via {rec.tipo} • Criada em {new Date(rec.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg border border-[var(--color-border)] transition-all text-sm">
                                        Ver Detalhes
                                    </button>
                                </div>
                            </div>
                        ))
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
                        <FileText className="w-8 h-8 text-green-500" />
                        Emissão de Receituário
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Elabore prescrições técnicas e receitas de adubação para seus clientes.
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
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                        {submitting ? 'Enviando...' : 'Salvar no Supabase'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                
                {/* 1. SELEÇÃO DE CLIENTE E TALHÃO */}
                <div className="glass p-6 rounded-2xl flex flex-col gap-6">
                    <h2 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest border-b border-[var(--color-border)] pb-2 mb-2">
                        1. Identificação
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-green-500" /> Produtor Destinatário *
                            </label>
                            <select 
                                required
                                value={selectedClient}
                                onChange={(e) => setSelectedClient(e.target.value)}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent block p-3 transition-all"
                            >
                                <option value="" disabled>Selecione o Cliente</option>
                                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Leaf className="w-4 h-4 text-green-500" /> Talhão / Cultura (Opcional)
                            </label>
                            <select 
                                value={selectedPlanting}
                                onChange={(e) => setSelectedPlanting(e.target.value)}
                                disabled={!selectedClient}
                                className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent block p-3 transition-all disabled:opacity-50"
                            >
                                <option value="">Geral (Sem vínculo a talhão)</option>
                                {plantios.map(p => <option key={p.uuid} value={p.uuid}>{p.cultura} ({p.tipo_plantio})</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. MÉTODO DE APLICAÇÃO */}
                <div className="glass p-6 rounded-2xl flex flex-col gap-4">
                    <h2 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest border-b border-[var(--color-border)] pb-2 mb-2">
                        2. Método de Aplicação
                    </h2>
                    
                    <div className="flex flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveTab('GOTEJO')}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-bold transition-all ${
                                activeTab === 'GOTEJO' 
                                    ? 'border-green-500 bg-green-500/10 text-green-400' 
                                    : 'border-[var(--color-border)] bg-transparent text-[var(--color-muted)] hover:border-white/20'
                            }`}
                        >
                            <Droplet className="w-5 h-5" />
                            VIA GOTEJO / FERTIRRIGAÇÃO
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setActiveTab('FOLIAR')}
                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl border-2 font-bold transition-all ${
                                activeTab === 'FOLIAR' 
                                    ? 'border-green-500 bg-green-500/10 text-green-400' 
                                    : 'border-[var(--color-border)] bg-transparent text-[var(--color-muted)] hover:border-white/20'
                            }`}
                        >
                            <Leaf className="w-5 h-5" />
                            APLICAÇÃO FOLIAR
                        </button>
                    </div>
                </div>

                {/* 3. PRODUTOS E DOSAGEM */}
                <div className="glass p-6 rounded-2xl flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-[var(--color-border)] pb-4 mb-2">
                        <h2 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest">
                            3. Formulação e Dosagem
                        </h2>
                        <button 
                            type="button"
                            onClick={handleAddRow}
                            className="flex items-center gap-2 text-sm font-bold text-green-400 hover:text-green-300 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> ADICIONAR INSUMO
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {recipeRows.map((row, index) => (
                            <div key={row.id} className="flex flex-col md:flex-row gap-4 items-start md:items-center bg-white/5 p-4 rounded-xl border border-[var(--color-border)]">
                                
                                <div className="w-full md:w-1/2">
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Insumo #{index + 1}</label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Nome do produto (ex: Uréia)"
                                        value={row.product}
                                        onChange={(e) => handleRowChange(row.id, 'product', e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-sm rounded-lg focus:ring-2 focus:ring-green-500 block p-2.5 transition-all"
                                        list="produtos-list"
                                    />
                                    <datalist id="produtos-list">
                                        {COMMON_PRODUCTS.map(p => <option key={p} value={p} />)}
                                    </datalist>
                                </div>

                                <div className="w-full md:w-1/4">
                                    <label className="block text-xs font-bold text-[var(--color-muted)] mb-1">Dose Recomendada</label>
                                    <div className="flex">
                                        <input 
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="Ex: 10"
                                            value={row.dosage}
                                            onChange={(e) => handleRowChange(row.id, 'dosage', e.target.value)}
                                            className="w-1/2 bg-[var(--color-background)] border border-[var(--color-border)] text-white text-sm rounded-l-lg focus:ring-2 focus:ring-green-500 block p-2.5 transition-all"
                                        />
                                        <select
                                            value={row.unit}
                                            onChange={(e) => handleRowChange(row.id, 'unit', e.target.value)}
                                            className="w-1/2 bg-[var(--color-border)] border-y border-r border-[var(--color-border)] text-white text-sm rounded-r-lg focus:ring-2 focus:ring-green-500 block p-2.5 transition-all"
                                        >
                                            <option value="KG">KG</option>
                                            <option value="GR">GR</option>
                                            <option value="LT">LT</option>
                                            <option value="ML">ML</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="hidden md:flex items-center text-[var(--color-muted)] font-black px-1 mt-4">
                                    /
                                </div>

                                <div className="w-full md:w-1/4">
                                    <label className="block text-xs font-bold text-green-400 mb-1">Para cada (Base)</label>
                                    <div className="flex">
                                        <input 
                                            type="number"
                                            step="0.01"
                                            required
                                            placeholder="Ex: 100"
                                            value={row.baseQty}
                                            onChange={(e) => handleRowChange(row.id, 'baseQty', e.target.value)}
                                            className="w-1/2 bg-green-500/10 border border-green-500/30 text-white text-sm rounded-l-lg focus:ring-2 focus:ring-green-500 block p-2.5 transition-all"
                                        />
                                        <select
                                            value={row.baseUnit}
                                            onChange={(e) => handleRowChange(row.id, 'baseUnit', e.target.value)}
                                            className="w-1/2 bg-green-500/20 border-y border-r border-green-500/30 text-white text-sm font-bold rounded-r-lg focus:ring-2 focus:ring-green-500 block p-2.5 transition-all"
                                        >
                                            <option value="L">L (Água)</option>
                                            <option value="HA">Hectare</option>
                                            <option value="PLANTAS">Pés</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="w-full md:w-auto md:ml-auto mt-2 md:mt-0 flex justify-end">
                                    {recipeRows.length > 1 && (
                                        <button 
                                            type="button"
                                            onClick={() => handleRemoveRow(row.id)}
                                            className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                            title="Remover linha"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>

                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. OBSERVAÇÕES */}
                <div className="glass p-6 rounded-2xl flex flex-col gap-4">
                    <h2 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest border-b border-[var(--color-border)] pb-2 mb-2">
                        4. Observações Técnicas (Opcional)
                    </h2>
                    
                    <textarea 
                        rows={4}
                        placeholder="Recomendações extras, avisos sobre diluição, condições climáticas, etc."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] text-white text-base rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent block p-4 transition-all resize-none"
                    />
                </div>

            </form>
        </div>
    );
}
