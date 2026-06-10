import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, XCircle, User, Calendar, Droplet, Leaf, Eye, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../services/supabase';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';

export default function ReceituarioAgronomicoScreen() {
    const [receitas, setReceitas] = useState<Record<string, string | number | boolean | null>[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReceita, setSelectedReceita] = useState<any | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Formulario Agronomo
    const [formTitle, setFormTitle] = useState('');
    const [formInstrucoes, setFormInstrucoes] = useState('');
    const [formTipo, setFormTipo] = useState('Foliar');
    const [formCliente, setFormCliente] = useState('João (Fazenda Ouro Verde)');
    
    // Novos campos do Motor de Receitas
    const [formVolumeCalda, setFormVolumeCalda] = useState('200'); // L/ha
    const [formCapacidadeTanque, setFormCapacidadeTanque] = useState('600'); // L
    const [formProdutos, setFormProdutos] = useState([
        { id: Date.now(), nome: '', funcao: '', dose: '', unidade: 'L' }
    ]);

    const fetchReceitas = async () => {
        setLoading(true);
        try {
            // No mundo real buscaria filtrando pelo user_id do produtor logado
            const { data, error } = await supabase
                .from('receitas_adubacao')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setReceitas(data);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao buscar receituários.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceitas();
    }, []);

    const handleAprovar = async (id: string) => {
        try {
            const { error } = await supabase
                .from('receitas_adubacao')
                .update({ status: 'Aprovada' })
                .eq('id', id);

            if (error) throw error;
            toast.success("Receita aprovada! Seu Agrônomo será notificado.");
            setSelectedReceita(null);
            fetchReceitas();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao aprovar a receita.");
        }
    };

    const handleRejeitar = async (id: string) => {
        try {
            const { error } = await supabase
                .from('receitas_adubacao')
                .update({ status: 'Rejeitada' }) // ou Volta pra rascunho
                .eq('id', id);

            if (error) throw error;
            toast.success("Receita rejeitada.");
            setSelectedReceita(null);
            fetchReceitas();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao rejeitar a receita.");
        }
    };

    const handleCreatePrescricao = async () => {
        if (!formTitle.trim()) {
            toast.error("Dê um título para a receita.");
            return;
        }

        // Optimistic UI
        const nova = {
            id: 'temp-' + Date.now(),
            nome: formTitle,
            tipo: formTipo,
            instrucoes: formInstrucoes,
            status: 'Pendente',
            created_at: new Date().toISOString(),
            volume_calda: formVolumeCalda,
            capacidade_tanque: formCapacidadeTanque,
            produtos: JSON.stringify(formProdutos)
        };

        setReceitas([nova, ...receitas]);
        setIsCreating(false);
        setFormTitle('');
        setFormInstrucoes('');
        setFormProdutos([{ id: Date.now(), nome: '', funcao: '', dose: '', unidade: 'L' }]);
        toast.success("Prescrição enviada ao produtor com sucesso!");

        try {
            await supabase.from('receitas_adubacao').insert([{
                nome: formTitle,
                tipo: formTipo,
                instrucoes: formInstrucoes,
                status: 'Pendente',
                // Simulando salvamento de JSON
                // No db precisaria adicionar estas colunas jsonb, usaremos text para o MVP
            }]);
            fetchReceitas(); // Fetch the real ID back
        } catch (error) {
            console.error(error);
        }
    };

    const addProduto = () => {
        setFormProdutos([...formProdutos, { id: Date.now(), nome: '', funcao: '', dose: '', unidade: 'L' }]);
    };
    
    const removeProduto = (id: number) => {
        setFormProdutos(formProdutos.filter(p => p.id !== id));
    };

    const updateProduto = (id: number, field: string, value: string) => {
        setFormProdutos(formProdutos.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleExportPDF = () => {
        if (!selectedReceita) return;
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text(`Receituario Agronomico AgroGB`, 20, 20);
        doc.setFontSize(14);
        doc.text(`Prescricao: ${selectedReceita.nome}`, 20, 35);
        doc.text(`Via de Aplicacao: ${selectedReceita.tipo}`, 20, 45);
        doc.text(`Data: ${new Date(selectedReceita.created_at).toLocaleDateString()}`, 20, 55);
        
        doc.setFontSize(12);
        doc.text('Instrucoes Tecnicas:', 20, 75);
        const splitText = doc.splitTextToSize(selectedReceita.instrucoes || 'Sem instrucoes.', 170);
        doc.text(splitText, 20, 85);
        
        doc.save(`Receita_${selectedReceita.id}.pdf`);
        toast.success("PDF gerado com sucesso!");
    };

    const handleWhatsAppShare = () => {
        if (!selectedReceita) return;
        
        let text = `*🚜 RECEITA DE APLICAÇÃO: ${selectedReceita.tipo.toUpperCase()}*\n`;
        text += `*Objetivo:* ${selectedReceita.nome}\n`;
        if (selectedReceita.capacidade_tanque) {
            text += `*Equipamento:* Tanque de ${selectedReceita.capacidade_tanque} Litros\n`;
        }
        text += `\n*🧪 O que colocar no tanque (Mistura):*\n`;
        
        // Se tiver produtos estruturados
        if (selectedReceita.produtos) {
            try {
                const prods = JSON.parse(selectedReceita.produtos);
                let passo = 1;
                prods.forEach((p: any) => {
                    const dose_ha = parseFloat(p.dose) || 0;
                    const calda = parseFloat(selectedReceita.volume_calda) || 200;
                    const tanque = parseFloat(selectedReceita.capacidade_tanque) || 600;
                    
                    // Cálculo da Quantidade por Tanque = (Dose / Calda) * Tanque
                    const qtd_tanque = ((dose_ha / calda) * tanque).toFixed(2);
                    
                    text += `${passo}. *${p.nome.toUpperCase()}*: Adicione ${qtd_tanque} ${p.unidade} por tanque. _(${p.funcao})_\n`;
                    passo++;
                });
            } catch(e) {}
        } else {
            text += `Consulte as instruções abaixo ou o PDF anexo.\n`;
        }

        text += `\n*⏱️ Instruções Técnicas:*\n${selectedReceita.instrucoes || ''}`;
        
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const renderStatusBadge = (status: string) => {
        if (status === 'Aprovada') return <span className="flex items-center gap-1.5 text-xs font-black tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> APROVADA</span>;
        if (status === 'Rejeitada') return <span className="flex items-center gap-1.5 text-xs font-black tracking-wider text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full"><XCircle className="w-3.5 h-3.5" /> REJEITADA</span>;
        return <span className="flex items-center gap-1.5 text-xs font-black tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /> AGUARDANDO APROVAÇÃO</span>;
    };

    return (
        <div className="animate-fade-in pb-12 space-y-8">
            {/* HERO */}
            <div className="relative rounded-3xl overflow-hidden glass border border-[var(--color-border)] p-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-bold mb-4">
                            <FileText className="w-4 h-4" /> Ecossistema Agro
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
                            Prescrições Agronômicas
                        </h1>
                        <p className="text-[var(--color-muted)] text-lg max-w-xl">
                            Acesse, revise e aprove as recomendações de aplicação. Agrônomos podem emitir novas receitas técnicas.
                        </p>
                    </div>
                    <div>
                        <button 
                            onClick={() => { setIsCreating(true); setSelectedReceita(null); }}
                            className="px-6 py-4 rounded-2xl font-black text-white shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center gap-3 transition-all hover:scale-95 active:scale-90"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary), #047857)' }}
                        >
                            <FileText className="w-5 h-5" /> Nova Prescrição
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LISTA */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">Caixa de Entrada</h3>
                    
                    {loading ? (
                        <div className="text-center py-12 text-[var(--color-muted)]">Carregando...</div>
                    ) : receitas.length === 0 ? (
                        <div className="glass p-8 rounded-3xl text-center">
                            <FileText className="w-12 h-12 text-[var(--color-muted)] mx-auto mb-4 opacity-30" />
                            <p className="font-bold text-white mb-1">Nenhuma prescrição</p>
                            <p className="text-sm text-[var(--color-muted)]">Seu agrônomo ainda não enviou receitas.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {receitas.map((rec) => (
                                <div 
                                    key={rec.id} 
                                    onClick={() => setSelectedReceita(rec)}
                                    className={`glass p-5 rounded-2xl cursor-pointer transition-all border ${selectedReceita?.id === rec.id ? 'border-[var(--color-primary)] bg-white/5' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 hover:bg-white/[0.02]'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white truncate max-w-[70%]">{rec.nome || 'Receituário'}</h4>
                                        {rec.status === 'Pendente' && <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]"></span>}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mb-3">
                                        <User className="w-3.5 h-3.5" /> Agrônomo Responsável
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs bg-white/5 px-2 py-1 rounded-md text-[var(--color-muted)] font-medium">Via {rec.tipo || 'Foliar'}</span>
                                        <span className="text-xs font-bold text-white">{new Date(rec.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* DETALHES */}
                <div className="lg:col-span-2">
                    {isCreating ? (
                        <div className="glass h-full rounded-3xl flex flex-col border border-[var(--color-border)] animate-fade-in-up">
                            <div className="p-8 border-b border-[var(--color-border)]">
                                <h2 className="text-3xl font-black text-white">Emitir Receituário</h2>
                                <p className="text-[var(--color-muted)] mt-1">Preencha os dados técnicos. O produtor será notificado para aprovação.</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Produtor / Fazenda</label>
                                        <select 
                                            value={formCliente}
                                            onChange={e => setFormCliente(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-primary)] transition-all font-bold"
                                        >
                                            <option>João (Fazenda Ouro Verde)</option>
                                            <option>Maria (Sítio das Flores)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Via de Aplicação</label>
                                        <select 
                                            value={formTipo}
                                            onChange={e => setFormTipo(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-primary)] transition-all font-bold"
                                        >
                                            <option value="Foliar">Foliar</option>
                                            <option value="Solo">Solo (Via Fertirrigação)</option>
                                            <option value="Semente">Tratamento de Sementes</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Título da Prescrição</label>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: Pulverização Preventiva - Ferrugem"
                                        value={formTitle}
                                        onChange={e => setFormTitle(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-primary)] transition-all font-bold"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Volume de Calda (L/ha)</label>
                                        <input 
                                            type="number" 
                                            value={formVolumeCalda}
                                            onChange={e => setFormVolumeCalda(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-primary)] transition-all font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Capacidade Tanque (L)</label>
                                        <input 
                                            type="number" 
                                            value={formCapacidadeTanque}
                                            onChange={e => setFormCapacidadeTanque(e.target.value)}
                                            className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-primary)] transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                <div className="p-5 border border-white/10 bg-white/5 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Produtos e Insumos</h3>
                                        <button onClick={addProduto} className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 hover:text-emerald-400">
                                            <Plus className="w-4 h-4" /> ADICIONAR
                                        </button>
                                    </div>
                                    {formProdutos.map((prod, index) => (
                                        <div key={prod.id} className="grid grid-cols-12 gap-3 items-end bg-black/20 p-3 rounded-xl border border-white/5">
                                            <div className="col-span-12 md:col-span-4">
                                                <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">Produto Comercial</label>
                                                <input type="text" placeholder="Ex: Masterins" value={prod.nome} onChange={e => updateProduto(prod.id, 'nome', e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-white text-sm" />
                                            </div>
                                            <div className="col-span-12 md:col-span-3">
                                                <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">Função</label>
                                                <input type="text" placeholder="Inseticida" value={prod.funcao} onChange={e => updateProduto(prod.id, 'funcao', e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-white text-sm" />
                                            </div>
                                            <div className="col-span-8 md:col-span-3">
                                                <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">Dose / Hectare</label>
                                                <input type="number" placeholder="150" value={prod.dose} onChange={e => updateProduto(prod.id, 'dose', e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg py-2 px-3 text-white text-sm" />
                                            </div>
                                            <div className="col-span-3 md:col-span-1">
                                                <label className="block text-[10px] font-bold text-[var(--color-muted)] uppercase mb-1">Un</label>
                                                <select value={prod.unidade} onChange={e => updateProduto(prod.id, 'unidade', e.target.value)} className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-lg py-2 px-1 text-white text-sm">
                                                    <option value="L">L</option><option value="mL">mL</option><option value="Kg">Kg</option><option value="g">g</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1 flex justify-center pb-2">
                                                <button onClick={() => removeProduto(prod.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Instruções Técnicas e Modo de Aplicação</label>
                                    <textarea 
                                        rows={4}
                                        placeholder="Descreva as dosagens por hectare, horário recomendado..."
                                        value={formInstrucoes}
                                        onChange={e => setFormInstrucoes(e.target.value)}
                                        className="w-full bg-[var(--color-background)] border border-[var(--color-border)] rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-[var(--color-primary)] transition-all font-bold resize-none"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="p-8 border-t border-[var(--color-border)] flex justify-end gap-4">
                                <button onClick={() => setIsCreating(false)} className="px-6 py-3 rounded-xl border border-[var(--color-border)] font-bold text-white hover:bg-white/5 transition-all">
                                    Cancelar
                                </button>
                                <button onClick={handleCreatePrescricao} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-white shadow-lg shadow-indigo-500/20 transition-all">
                                    Assinar e Enviar Receita
                                </button>
                            </div>
                        </div>
                    ) : !selectedReceita ? (
                        <div className="glass h-full min-h-[500px] rounded-3xl flex flex-col items-center justify-center p-8 text-center border border-[var(--color-border)] border-dashed">
                            <Eye className="w-16 h-16 text-[var(--color-muted)] mb-4 opacity-20" />
                            <h3 className="text-2xl font-black text-white mb-2">Selecione uma Prescrição</h3>
                            <p className="text-[var(--color-muted)] max-w-sm">
                                Clique em um dos receituários na lista ao lado para visualizar os detalhes, dosagens e dar o aceite técnico.
                            </p>
                        </div>
                    ) : (
                        <div className="glass rounded-3xl overflow-hidden flex flex-col border border-[var(--color-border)] animate-fade-in-up">
                            {/* HEADER RECEITA */}
                            <div className="p-8 border-b border-[var(--color-border)] relative">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary)]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        {renderStatusBadge(selectedReceita.status || 'Pendente')}
                                        <h2 className="text-3xl font-black text-white mt-4 mb-2">{selectedReceita.nome || 'Receituário'}</h2>
                                        <div className="flex gap-4 text-sm font-medium text-[var(--color-muted)]">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(selectedReceita.created_at).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-1.5">
                                                {selectedReceita.tipo === 'Foliar' ? <Leaf className="w-4 h-4 text-green-400" /> : <Droplet className="w-4 h-4 text-blue-400" />}
                                                Via {selectedReceita.tipo || 'Não informada'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 ml-auto">
                                            <FileText className="w-8 h-8 text-white" />
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button 
                                                onClick={handleExportPDF}
                                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/10 transition-all flex items-center gap-1"
                                            >
                                                <FileText className="w-3.5 h-3.5" /> PDF
                                            </button>
                                            <button 
                                                onClick={handleWhatsAppShare}
                                                className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-xl text-xs font-bold border border-green-500/20 transition-all flex items-center gap-1"
                                            >
                                                Compartilhar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* BODY RECEITA */}
                            <div className="p-8 space-y-8 bg-white/[0.01]">
                                
                                <div>
                                    <h3 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest mb-4">Itens Prescritos (Simulação do PDF)</h3>
                                    <div className="bg-[var(--color-background)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                                        <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--color-border)] bg-white/5 font-bold text-xs uppercase tracking-wider text-[var(--color-muted)]">
                                            <div className="col-span-6">Produto / Insumo</div>
                                            <div className="col-span-6 text-right">Dose Recomendada</div>
                                        </div>
                                        {(() => {
                                            if (selectedReceita.produtos) {
                                                try {
                                                    const prods = JSON.parse(selectedReceita.produtos);
                                                    const calda = parseFloat(selectedReceita.volume_calda) || 200;
                                                    const tanque = parseFloat(selectedReceita.capacidade_tanque) || 600;
                                                    
                                                    return prods.map((p: any, idx: number) => {
                                                        const dose_ha = parseFloat(p.dose) || 0;
                                                        const qtd_tanque = ((dose_ha / calda) * tanque).toFixed(2);
                                                        
                                                        return (
                                                            <div key={idx} className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--color-border)] text-sm items-center hover:bg-white/[0.02]">
                                                                <div className="col-span-6">
                                                                    <div className="font-bold text-white">{p.nome.toUpperCase()}</div>
                                                                    <div className="text-[10px] text-[var(--color-primary)] uppercase font-black tracking-widest">{p.funcao}</div>
                                                                </div>
                                                                <div className="col-span-6 text-right">
                                                                    <div className="font-black text-emerald-400 text-lg">{qtd_tanque} {p.unidade}</div>
                                                                    <div className="text-[10px] text-[var(--color-muted)] uppercase tracking-widest">por tanque de {tanque}L</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    });
                                                } catch(e) {}
                                            }
                                            return (
                                                <>
                                                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--color-border)] text-sm items-center">
                                                        <div className="col-span-6 font-bold text-white">URÉIA 46%</div>
                                                        <div className="col-span-6 text-right font-medium text-white">10 KG <span className="text-[var(--color-muted)]">/ 100L Água</span></div>
                                                    </div>
                                                    <div className="grid grid-cols-12 gap-4 p-4 text-sm items-center">
                                                        <div className="col-span-6 font-bold text-white">SULFATO DE POTÁSSIO</div>
                                                        <div className="col-span-6 text-right font-medium text-white">5 KG <span className="text-[var(--color-muted)]">/ 100L Água</span></div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-black text-[var(--color-muted)] uppercase tracking-widest mb-4">Instruções do Agrônomo</h3>
                                    <div className="bg-amber-500/10 border-l-4 border-amber-500 p-5 rounded-r-2xl">
                                        <p className="text-amber-200 text-sm leading-relaxed whitespace-pre-wrap">
                                            {selectedReceita.instrucoes || 'Nenhuma instrução especial foi adicionada.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* ACTIONS */}
                            {selectedReceita.status === 'Pendente' || !selectedReceita.status ? (
                                <div className="p-8 border-t border-[var(--color-border)] bg-white/[0.02] flex flex-col sm:flex-row gap-4 items-center justify-end">
                                    <button 
                                        onClick={() => handleRejeitar(selectedReceita.id)}
                                        className="w-full sm:w-auto px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold transition-all"
                                    >
                                        Rejeitar / Solicitar Revisão
                                    </button>
                                    <button 
                                        onClick={() => handleAprovar(selectedReceita.id)}
                                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" /> Aprovar Execução
                                    </button>
                                </div>
                            ) : (
                                <div className="p-8 border-t border-[var(--color-border)] bg-white/[0.02]">
                                    <div className={`w-full py-4 rounded-xl text-center font-bold border ${
                                        selectedReceita.status === 'Aprovada' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                                    }`}>
                                        Esta recomendação já foi {selectedReceita.status?.toLowerCase()}.
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
