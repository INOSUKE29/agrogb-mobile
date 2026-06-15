// ══════════════════════════════════════════════════════════════════════
// CONSTANTES DO MÓDULO DE RECOMENDAÇÕES TÉCNICAS — AgroGB
// Labels, cores, ícones e mapas de configuração
// ══════════════════════════════════════════════════════════════════════

import type {
  ClassificacaoRecomendacao,
  Prioridade,
  MetodoAplicacao,
  FaseCultura,
  ProblemaIdentificado,
  ProgramaTipo,
  StatusRecomendacao,
} from '../types/recomendacao';

// ── Classificação ───────────────────────────────────────────────────

export interface ConfigItem {
  label: string;
  cor: string;
  icon: string;
  descricao?: string;
}

export const CLASSIFICACAO_CONFIG: Record<ClassificacaoRecomendacao, ConfigItem> = {
  nutricao_rotina:      { label: 'Nutrição de Rotina',       cor: '#10B981', icon: 'Leaf',            descricao: 'Adubação programada de manutenção' },
  correcao_nutricional: { label: 'Correção Nutricional',     cor: '#F59E0B', icon: 'AlertTriangle',   descricao: 'Correção de deficiência detectada' },
  preventiva:           { label: 'Aplicação Preventiva',     cor: '#3B82F6', icon: 'Shield',          descricao: 'Prevenção antes do aparecimento' },
  curativa:             { label: 'Aplicação Curativa',       cor: '#EF4444', icon: 'Heart',           descricao: 'Tratamento de problema existente' },
  fitossanitario:       { label: 'Manejo Fitossanitário',    cor: '#8B5CF6', icon: 'Microscope',      descricao: 'Controle integrado de pragas e doenças' },
  pragas:               { label: 'Controle de Pragas',       cor: '#EF4444', icon: 'Bug',             descricao: 'Ação contra insetos ou ácaros' },
  doencas:              { label: 'Controle de Doenças',      cor: '#DC2626', icon: 'Virus',           descricao: 'Fungicida, bactericida, etc.' },
  plantas_daninhas:     { label: 'Controle de Plantas Daninhas', cor: '#78716C', icon: 'Sprout',      descricao: 'Herbicida ou manejo mecânico' },
  bioestimulante:       { label: 'Bioestimulante',           cor: '#06B6D4', icon: 'Sparkles',        descricao: 'Aminoácidos, húmicos, etc.' },
  regulador_crescimento:{ label: 'Regulador de Crescimento', cor: '#A855F7', icon: 'TrendingUp',     descricao: 'Hormônios vegetais e reguladores' },
  outro:                { label: 'Outro',                    cor: '#6B7280', icon: 'MoreHorizontal', descricao: 'Classificação personalizada' },
};

// ── Prioridade ──────────────────────────────────────────────────────

export const PRIORIDADE_CONFIG: Record<Prioridade, ConfigItem & { emoji: string }> = {
  baixa:   { label: 'Baixa',   cor: '#10B981', icon: 'CircleDot',      emoji: '🟢' },
  media:   { label: 'Média',   cor: '#F59E0B', icon: 'CircleDot',      emoji: '🟡' },
  alta:    { label: 'Alta',    cor: '#F97316', icon: 'AlertCircle',     emoji: '🟠' },
  urgente: { label: 'Urgente', cor: '#EF4444', icon: 'AlertOctagon',    emoji: '🔴' },
};

// ── Método de Aplicação ─────────────────────────────────────────────

export const METODO_CONFIG: Record<MetodoAplicacao, ConfigItem> = {
  gotejo:           { label: 'Gotejo / Fertirrigação', cor: '#3B82F6', icon: 'Droplet' },
  foliar:           { label: 'Aplicação Foliar',       cor: '#10B981', icon: 'Leaf' },
  pulv_costal:      { label: 'Pulverização Costal',    cor: '#F59E0B', icon: 'Crosshair' },
  pulv_tratorizada: { label: 'Pulverização Tratorizada', cor: '#8B5CF6', icon: 'Tractor' },
  drench:           { label: 'Drench',                 cor: '#06B6D4', icon: 'Waves' },
  solo:             { label: 'Aplicação no Solo',      cor: '#78716C', icon: 'Mountain' },
  sulco_plantio:    { label: 'Sulco de Plantio',       cor: '#A16207', icon: 'ArrowDownToLine' },
  cobertura:        { label: 'Cobertura',              cor: '#059669', icon: 'Layers' },
  irrigacao:        { label: 'Via Irrigação',          cor: '#2563EB', icon: 'CloudRain' },
};

// ── Fase da Cultura ─────────────────────────────────────────────────

export const FASE_CONFIG: Record<FaseCultura, ConfigItem> = {
  vegetativo:    { label: 'Vegetativo',    cor: '#10B981', icon: 'Sprout' },
  florescimento: { label: 'Florescimento', cor: '#EC4899', icon: 'Flower2' },
  frutificacao:  { label: 'Frutificação',  cor: '#F97316', icon: 'Apple' },
  colheita:      { label: 'Colheita',      cor: '#EAB308', icon: 'Scissors' },
};

// ── Problema Identificado ───────────────────────────────────────────

export const PROBLEMA_CONFIG: Record<ProblemaIdentificado, ConfigItem> = {
  deficiencia_nutricional: { label: 'Deficiência Nutricional', cor: '#F59E0B', icon: 'AlertTriangle' },
  praga:                   { label: 'Praga',                   cor: '#EF4444', icon: 'Bug' },
  doenca:                  { label: 'Doença',                  cor: '#DC2626', icon: 'Virus' },
  estresse:                { label: 'Estresse',                cor: '#F97316', icon: 'Thermometer' },
  manejo:                  { label: 'Manejo',                  cor: '#8B5CF6', icon: 'Settings' },
  preventivo:              { label: 'Preventivo',              cor: '#3B82F6', icon: 'Shield' },
  rotina:                  { label: 'Rotina',                  cor: '#10B981', icon: 'Calendar' },
  outro:                   { label: 'Outro',                   cor: '#6B7280', icon: 'MoreHorizontal' },
};

// ── Programa ────────────────────────────────────────────────────────

export const PROGRAMA_CONFIG: Record<ProgramaTipo, ConfigItem & { descricao: string }> = {
  unica:           { label: 'Aplicação Única',      cor: '#10B981', icon: 'Target',     descricao: 'Uma única aplicação pontual' },
  sequencial:      { label: 'Programa Sequencial',  cor: '#3B82F6', icon: 'ListOrdered', descricao: 'Série de aplicações A, B, C...' },
  ciclo_completo:  { label: 'Ciclo Completo',       cor: '#8B5CF6', icon: 'RefreshCw',  descricao: 'Programa com intervalo fixo (ex: Dia 0, 7, 14, 21)' },
};

// ── Status ──────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<StatusRecomendacao, ConfigItem> = {
  rascunho:    { label: 'Rascunho',     cor: '#6B7280', icon: 'FileEdit' },
  agendada:    { label: 'Agendada',     cor: '#3B82F6', icon: 'CalendarClock' },
  enviada:     { label: 'Enviada',      cor: '#F59E0B', icon: 'Send' },
  visualizada: { label: 'Visualizada',  cor: '#06B6D4', icon: 'Eye' },
  aceita:      { label: 'Aceita',       cor: '#10B981', icon: 'CheckCircle2' },
  em_execucao: { label: 'Em Execução',  cor: '#8B5CF6', icon: 'Play' },
  concluida:   { label: 'Concluída',    cor: '#059669', icon: 'CheckCheck' },
  cancelada:   { label: 'Cancelada',    cor: '#EF4444', icon: 'XCircle' },
};

// ── Unidades ────────────────────────────────────────────────────────

export const UNIDADES_DOSE = [
  { value: 'KG', label: 'KG' },
  { value: 'GR', label: 'GR' },
  { value: 'LT', label: 'LT' },
  { value: 'ML', label: 'ML' },
];

export const UNIDADES_CALIBRADOR = [
  { value: 'L',       label: 'Lts de Água' },
  { value: 'HA',      label: 'Hectare (ha)' },
  { value: 'PLANTAS', label: 'Plantas (Pés)' },
];

// ── Ordem de Mistura Padrão ─────────────────────────────────────────

export const ORDEM_MISTURA_PADRAO = [
  { ordem: 1, label: 'Água' },
  { ordem: 2, label: 'Corretores de pH' },
  { ordem: 3, label: 'Fertilizantes' },
  { ordem: 4, label: 'Bioestimulantes' },
  { ordem: 5, label: 'Defensivos' },
  { ordem: 6, label: 'Espalhante / Adjuvante' },
  { ordem: 7, label: 'Completar tanque' },
];

// ── Steps do Wizard ─────────────────────────────────────────────────

export const WIZARD_STEPS = [
  { id: 1, label: 'Identificação',   icon: 'User',       shortLabel: 'ID' },
  { id: 2, label: 'Diagnóstico',     icon: 'Stethoscope', shortLabel: 'Diag' },
  { id: 3, label: 'Programa',        icon: 'Calendar',    shortLabel: 'Prog' },
  { id: 4, label: 'Método',          icon: 'Beaker',      shortLabel: 'Mét' },
  { id: 5, label: 'Formulação',      icon: 'Flask',       shortLabel: 'Form' },
  { id: 6, label: 'Revisão',         icon: 'ClipboardCheck', shortLabel: 'Rev' },
];
