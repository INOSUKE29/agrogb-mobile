import React, { useState, useEffect } from 'react';
import {
    FileText,
    Plus,
    Clock,
    CheckCircle2,
    FileEdit,
    ArrowLeft,
    Leaf,
    Droplet,
    AlertCircle,
    Send,
    Eye,
    Play,
    XCircle,
    CalendarClock,
    CheckCheck,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import RecomendacaoWizard from '../../components/recomendacoes/RecomendacaoWizard';
import {
    CLASSIFICACAO_CONFIG,
    PRIORIDADE_CONFIG,
    STATUS_CONFIG,
    METODO_CONFIG,
} from '../../constants/recomendacao';
import type { StatusRecomendacao } from '../../types/recomendacao';

// ═══════════════════════════════════════════════════════════════════
// Ícones para os status na lista
// ═══════════════════════════════════════════════════════════════════
const STATUS_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
    FileEdit, CalendarClock, Send, Eye, CheckCircle2, Play, CheckCheck, XCircle,
};

// ═══════════════════════════════════════════════════════════════════
// Componente Principal
// ═══════════════════════════════════════════════════════════════════
export default function RecomendacoesScreen() {
    const location = useLocation();
    const isAgronomo = location.pathname.includes('agronomo');

    // ── State ────────────────────────────────────────────────────
    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [statusTab, setStatusTab] = useState<string>('enviada');
    const [receitasList, setReceitasList] = useState<Record<string, any>[]>([]);

    // ── Tabs de status disponíveis ───────────────────────────────
    const STATUS_TABS = [
        { key: 'rascunho',    label: 'Rascunhos',     icon: 'FileEdit',      color: '#6B7280' },
        { key: 'enviada',     label: 'Enviadas',      icon: 'Send',          color: '#F59E0B' },
        { key: 'aceita',      label: 'Aceitas',       icon: 'CheckCircle2',  color: '#10B981' },
        { key: 'em_execucao', label: 'Em Execução',   icon: 'Play',          color: '#8B5CF6' },
        { key: 'concluida',   label: 'Concluídas',    icon: 'CheckCheck',    color: '#059669' },
    ];

    // ── Carregar receitas ────────────────────────────────────────
    const loadReceitas = async () => {
        setLoading(true);
        try {
            if (isAgronomo) {
                const { data, error } = await supabase
                    .from('receitas_adubacao')
                    .select('*')
                    .eq('status', statusTab)
                    .eq('is_deleted', 0)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Erro ao carregar receitas:', error);
                    toast.error('Erro ao carregar recomendações.', { id: 'load-err' });
                }
                if (data) setReceitasList(data);
            } else {
                // Produtor: lê do localStorage (legado) + Supabase
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

    useEffect(() => {
        if (viewMode === 'list') {
            loadReceitas();
        }
    }, [viewMode, statusTab]);

    // ── Helpers de renderização ──────────────────────────────────
    const getClassificacaoConfig = (classificacao: string) => {
        return CLASSIFICACAO_CONFIG[classificacao as keyof typeof CLASSIFICACAO_CONFIG]
            || { label: classificacao || '—', cor: '#6B7280', icon: 'FileText' };
    };

    const getPrioridadeConfig = (prioridade: string) => {
        return PRIORIDADE_CONFIG[prioridade as keyof typeof PRIORIDADE_CONFIG]
            || { label: prioridade || 'Média', cor: '#F59E0B', emoji: '🟡' };
    };

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]
            || { label: status || '—', cor: '#6B7280', icon: 'FileText' };
    };

    // ═══════════════════════════════════════════════════════════════
    // VIEW: WIZARD (Criação de Nova Recomendação)
    // ═══════════════════════════════════════════════════════════════
    if (viewMode === 'form') {
        return (
            <div className="animate-fade-in h-full flex flex-col">
                {/* Header do Wizard */}
                <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-[rgba(255,255,255,0.05)]">
                    <button
                        onClick={() => setViewMode('list')}
                        className="flex items-center gap-2 text-sm font-bold text-[var(--color-muted)] hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar à Lista
                    </button>
                    <h2 className="text-lg font-black text-white tracking-tight">
                        Novo Plano Técnico de Aplicação
                    </h2>
                    <div className="w-24" /> {/* Spacer */}
                </div>

                {/* Wizard */}
                <RecomendacaoWizard
                    isAgronomo={isAgronomo}
                    onComplete={() => {
                        setViewMode('list');
                        setStatusTab('enviada');
                    }}
                    onCancel={() => setViewMode('list')}
                />
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════
    // VIEW: LISTA DE RECOMENDAÇÕES
    // ═══════════════════════════════════════════════════════════════
    return (
        <div className="animate-fade-in pb-12 max-w-6xl mx-auto">

            {/* CABEÇALHO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 border-b border-[var(--color-border)] pb-6 pt-4">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <FileText className="w-8 h-8 text-green-500" />
                        Planos Técnicos de Aplicação
                    </h1>
                    <p className="text-[var(--color-muted)] font-medium mt-1">
                        Prescrições agronômicas completas com rastreabilidade técnica.
                    </p>
                </div>

                <button
                    onClick={() => setViewMode('form')}
                    className={`flex items-center justify-center gap-2 px-6 py-3 font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 text-white ${
                        isAgronomo
                            ? 'bg-green-600 hover:bg-green-500 shadow-green-500/20'
                            : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
                    }`}
                >
                    <Plus className="w-5 h-5" />
                    Nova Recomendação
                </button>
            </div>

            {/* ABAS DE STATUS */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-1 hide-scrollbar">
                {STATUS_TABS.map((tab) => {
                    const isActive = statusTab === tab.key;
                    const Icon = STATUS_ICON_MAP[tab.icon];
                    return (
                        <button
                            key={tab.key}
                            onClick={() => setStatusTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 font-bold rounded-xl border-b-4 transition-all whitespace-nowrap text-sm ${
                                isActive
                                    ? 'bg-white/10 text-white'
                                    : 'bg-transparent border-transparent text-[var(--color-muted)] hover:bg-white/5'
                            }`}
                            style={{ borderBottomColor: isActive ? tab.color : 'transparent' }}
                        >
                            {Icon && <Icon className="w-4 h-4" style={{ color: isActive ? tab.color : undefined }} />}
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* LISTA */}
            <div className="premium-card rounded-2xl overflow-hidden mt-4">
                {loading ? (
                    <div className="text-center py-12 text-[var(--color-muted)] font-bold">
                        <div className="w-6 h-6 border-2 border-[var(--color-muted)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        Carregando prescrições...
                    </div>
                ) : receitasList.length === 0 ? (
                    <div className="text-center py-24">
                        <FileText className="w-12 h-12 mx-auto text-[var(--color-muted)] mb-4 opacity-30" />
                        <h3 className="text-xl font-bold text-white mb-2">
                            Nenhuma recomendação com status "{STATUS_TABS.find(t => t.key === statusTab)?.label}"
                        </h3>
                        <p className="text-[var(--color-muted)]">
                            Crie um novo plano técnico para ele aparecer aqui.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)]">
                                    <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider w-16">Tipo</th>
                                    <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider">Identificação</th>
                                    <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider hidden lg:table-cell">Prioridade</th>
                                    <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider hidden md:table-cell">Data</th>
                                    <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-black text-[var(--color-muted)] uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(255,255,255,0.02)]">
                                {receitasList.map(rec => {
                                    const classConfig = getClassificacaoConfig(rec.classificacao as string);
                                    const prioConfig = getPrioridadeConfig(rec.prioridade as string);
                                    const statusConfig = getStatusConfig(rec.status as string);

                                    return (
                                        <tr key={rec.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                                            {/* Tipo / Classificação */}
                                            <td className="p-4">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
                                                    style={{
                                                        background: `${classConfig.cor}15`,
                                                        borderColor: `${classConfig.cor}30`,
                                                        color: classConfig.cor,
                                                    }}
                                                >
                                                    {rec.classificacao?.includes('praga') || rec.classificacao?.includes('doenca')
                                                        ? <AlertCircle className="w-5 h-5" />
                                                        : rec.classificacao?.includes('nutri') || rec.classificacao?.includes('bio')
                                                            ? <Leaf className="w-5 h-5" />
                                                            : <Droplet className="w-5 h-5" />
                                                    }
                                                </div>
                                            </td>

                                            {/* Identificação */}
                                            <td className="p-4">
                                                <h4 className="text-white font-bold text-base">{rec.nome || 'Sem título'}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span
                                                        className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                                        style={{
                                                            color: classConfig.cor,
                                                            background: `${classConfig.cor}15`,
                                                        }}
                                                    >
                                                        {classConfig.label}
                                                    </span>
                                                    {rec.metodo_aplicacao && (
                                                        <span className="text-[10px] text-[var(--color-muted)] uppercase">
                                                            • {METODO_CONFIG[rec.metodo_aplicacao as keyof typeof METODO_CONFIG]?.label || rec.metodo_aplicacao}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Prioridade */}
                                            <td className="p-4 hidden lg:table-cell">
                                                <span className="text-sm font-bold" style={{ color: prioConfig.cor }}>
                                                    {prioConfig.emoji} {prioConfig.label}
                                                </span>
                                            </td>

                                            {/* Data */}
                                            <td className="p-4 hidden md:table-cell text-[var(--color-muted)] text-sm">
                                                {rec.created_at
                                                    ? new Date(rec.created_at as string).toLocaleDateString('pt-BR')
                                                    : '—'
                                                }
                                            </td>

                                            {/* Status */}
                                            <td className="p-4">
                                                <span
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                                                    style={{
                                                        color: statusConfig.cor,
                                                        background: `${statusConfig.cor}15`,
                                                        borderColor: `${statusConfig.cor}30`,
                                                    }}
                                                >
                                                    {statusTab === 'enviada' && (
                                                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: statusConfig.cor }} />
                                                    )}
                                                    {statusConfig.label.toUpperCase()}
                                                </span>
                                            </td>

                                            {/* Ações */}
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        toast.success('Detalhes da prescrição em breve!', { id: 'open-rec' });
                                                    }}
                                                    className="bg-transparent hover:bg-[rgba(255,255,255,0.05)] text-white font-bold py-2 px-4 rounded-lg border border-[rgba(255,255,255,0.1)] transition-all text-sm opacity-70 group-hover:opacity-100"
                                                >
                                                    Abrir Plano
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
