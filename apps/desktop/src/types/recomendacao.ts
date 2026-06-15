// ══════════════════════════════════════════════════════════════════════
// TIPOS DO MÓDULO DE RECOMENDAÇÕES TÉCNICAS — AgroGB
// ══════════════════════════════════════════════════════════════════════

// ── Enums como union types ──────────────────────────────────────────

export type ClassificacaoRecomendacao =
  | 'nutricao_rotina'
  | 'correcao_nutricional'
  | 'preventiva'
  | 'curativa'
  | 'fitossanitario'
  | 'pragas'
  | 'doencas'
  | 'plantas_daninhas'
  | 'bioestimulante'
  | 'regulador_crescimento'
  | 'outro';

export type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente';

export type MetodoAplicacao =
  | 'gotejo'
  | 'foliar'
  | 'pulv_costal'
  | 'pulv_tratorizada'
  | 'drench'
  | 'solo'
  | 'sulco_plantio'
  | 'cobertura'
  | 'irrigacao';

export type FaseCultura = 'vegetativo' | 'florescimento' | 'frutificacao' | 'colheita';

export type ProblemaIdentificado =
  | 'deficiencia_nutricional'
  | 'praga'
  | 'doenca'
  | 'estresse'
  | 'manejo'
  | 'preventivo'
  | 'rotina'
  | 'outro';

export type ProgramaTipo = 'unica' | 'sequencial' | 'ciclo_completo';

export type StatusRecomendacao =
  | 'rascunho'
  | 'agendada'
  | 'enviada'
  | 'visualizada'
  | 'aceita'
  | 'em_execucao'
  | 'concluida'
  | 'cancelada';

// ── Interfaces de sub-objetos ───────────────────────────────────────

export interface InsumoRecomendacao {
  id: string;
  produto_id?: string;
  insumo_nome: string;
  dose: number | string;
  unidade: string;              // KG, GR, LT, ML
  calibrador_qty: number | string;
  calibrador_unidade: string;   // L, HA, PLANTAS
  ordem_mistura: number;
  observacao?: string;
  isConfirmed?: boolean;
}

export interface JanelaClimatica {
  temp_maxima?: number | string;
  umidade_minima?: number | string;
  vento_maximo?: number | string;
  sem_chuva_horas?: number | string;
}

export interface AssinaturaTecnica {
  nome: string;
  crea: string;
  data: string;
}

// ── Interface principal ─────────────────────────────────────────────

export interface RecomendacaoTecnica {
  // Identificação
  id?: string;
  agronomist_id?: string;
  cliente_id: string;
  cliente_nome?: string;
  talhao_id?: string;
  talhao_label?: string;
  cultura?: string;

  // Diagnóstico
  classificacao: ClassificacaoRecomendacao;
  prioridade: Prioridade;
  problema_identificado: ProblemaIdentificado;
  objetivo_tecnico: string;
  fase_cultura?: FaseCultura;

  // Programa
  programa_tipo: ProgramaTipo;
  aplicacao_numero: number;
  aplicacao_total: number;
  programa_pai_id?: string;

  // Método e Condições
  metodo_aplicacao: MetodoAplicacao;
  janela_climatica: JanelaClimatica;

  // Formulação
  insumos: InsumoRecomendacao[];

  // Datas e Intervalos
  data_emissao?: string;
  data_aplicar?: string;
  prazo_maximo?: string;
  intervalo_dias?: number | string;

  // Observações
  instrucoes?: string;

  // Status
  status: StatusRecomendacao;

  // Assinatura
  assinatura?: AssinaturaTecnica;

  // Metadados
  created_at?: string;
  updated_at?: string;
}

// ── Estado default para novo formulário ─────────────────────────────

export const DEFAULT_RECOMENDACAO: RecomendacaoTecnica = {
  cliente_id: '',
  classificacao: 'nutricao_rotina',
  prioridade: 'media',
  problema_identificado: 'rotina',
  objetivo_tecnico: '',
  programa_tipo: 'unica',
  aplicacao_numero: 1,
  aplicacao_total: 1,
  metodo_aplicacao: 'gotejo',
  janela_climatica: {},
  insumos: [
    {
      id: '1',
      insumo_nome: '',
      dose: '',
      unidade: 'ML',
      calibrador_qty: '100',
      calibrador_unidade: 'L',
      ordem_mistura: 1,
      isConfirmed: false,
    },
  ],
  status: 'rascunho',
};
