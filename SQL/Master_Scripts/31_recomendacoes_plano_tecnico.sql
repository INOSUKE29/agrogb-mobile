-- =========================================================================================
-- ARQUIVO: 31_recomendacoes_plano_tecnico.sql
-- OBJETIVO: Expandir o schema para suportar o Plano Técnico de Aplicação
-- DATA: 14 de Junho de 2026
-- =========================================================================================

-- ═══════════════════════════════════════════════════════════════════════
-- 1. EXPANDIR receitas_adubacao com novos campos do Plano Técnico
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS agronomist_id UUID REFERENCES auth.users(id);

-- Classificação e Diagnóstico
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS classificacao TEXT;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS prioridade TEXT DEFAULT 'media';
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS metodo_aplicacao TEXT;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS objetivo_tecnico TEXT;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS problema_identificado TEXT;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS fase_cultura TEXT;

-- Programa de Aplicação
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS programa_tipo TEXT DEFAULT 'unica';
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS aplicacao_numero INTEGER DEFAULT 1;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS aplicacao_total INTEGER DEFAULT 1;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS programa_pai_id UUID REFERENCES receitas_adubacao(id);

-- Datas e Intervalos
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS data_aplicar DATE;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS prazo_maximo DATE;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS intervalo_dias INTEGER;

-- Janela Climática
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS temp_maxima NUMERIC;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS umidade_minima NUMERIC;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS vento_maximo NUMERIC;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS sem_chuva_horas NUMERIC;

-- Assinatura Técnica (Nome + CREA)
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS assinatura_nome TEXT;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS assinatura_crea TEXT;
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS assinatura_data TIMESTAMPTZ;

-- Metadados
ALTER TABLE receitas_adubacao ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ═══════════════════════════════════════════════════════════════════════
-- 2. EXPANDIR receita_insumos (tabela existe mas estava sem uso)
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE receita_insumos ADD COLUMN IF NOT EXISTS dose NUMERIC;
ALTER TABLE receita_insumos ADD COLUMN IF NOT EXISTS unidade TEXT;
ALTER TABLE receita_insumos ADD COLUMN IF NOT EXISTS calibrador_qty NUMERIC;
ALTER TABLE receita_insumos ADD COLUMN IF NOT EXISTS calibrador_unidade TEXT;
ALTER TABLE receita_insumos ADD COLUMN IF NOT EXISTS produto_id UUID;
ALTER TABLE receita_insumos ADD COLUMN IF NOT EXISTS ordem_mistura INTEGER DEFAULT 1;
ALTER TABLE receita_insumos ADD COLUMN IF NOT EXISTS observacao TEXT;


-- ═══════════════════════════════════════════════════════════════════════
-- 3. TABELA DE HISTÓRICO DE VERSÕES
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS recomendacao_historico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recomendacao_id UUID REFERENCES receitas_adubacao(id) ON DELETE CASCADE,
    versao INTEGER NOT NULL DEFAULT 1,
    alterado_por UUID REFERENCES auth.users(id),
    motivo TEXT,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida por recomendação
CREATE INDEX IF NOT EXISTS idx_recomendacao_historico_rec_id 
    ON recomendacao_historico(recomendacao_id);


-- ═══════════════════════════════════════════════════════════════════════
-- 4. ÍNDICES DE PERFORMANCE
-- ═══════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_receitas_adubacao_agronomist 
    ON receitas_adubacao(agronomist_id) WHERE agronomist_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receitas_adubacao_cliente 
    ON receitas_adubacao(cliente_id) WHERE cliente_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receitas_adubacao_status 
    ON receitas_adubacao(status);

CREATE INDEX IF NOT EXISTS idx_receitas_adubacao_classificacao 
    ON receitas_adubacao(classificacao) WHERE classificacao IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_receitas_adubacao_prioridade 
    ON receitas_adubacao(prioridade) WHERE prioridade IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════════════
-- 5. RLS (Row Level Security) para as novas tabelas
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE recomendacao_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history of their recommendations"
    ON recomendacao_historico FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM receitas_adubacao r
            WHERE r.id = recomendacao_historico.recomendacao_id
            AND (r.agronomist_id = auth.uid() OR r.cliente_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert history for their recommendations"
    ON recomendacao_historico FOR INSERT
    WITH CHECK (alterado_por = auth.uid());


-- ═══════════════════════════════════════════════════════════════════════
-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ═══════════════════════════════════════════════════════════════════════

COMMENT ON COLUMN receitas_adubacao.classificacao IS 'nutricao_rotina, correcao_nutricional, preventiva, curativa, fitossanitario, pragas, doencas, plantas_daninhas, bioestimulante, regulador_crescimento, outro';
COMMENT ON COLUMN receitas_adubacao.prioridade IS 'baixa, media, alta, urgente';
COMMENT ON COLUMN receitas_adubacao.metodo_aplicacao IS 'gotejo, foliar, pulv_costal, pulv_tratorizada, drench, solo, sulco_plantio, cobertura, irrigacao';
COMMENT ON COLUMN receitas_adubacao.status IS 'rascunho, agendada, enviada, visualizada, aceita, em_execucao, concluida, cancelada';
COMMENT ON COLUMN receitas_adubacao.programa_tipo IS 'unica, sequencial, ciclo_completo';
COMMENT ON COLUMN receitas_adubacao.fase_cultura IS 'vegetativo, florescimento, frutificacao, colheita';
COMMENT ON COLUMN receitas_adubacao.problema_identificado IS 'deficiencia_nutricional, praga, doenca, estresse, manejo, preventivo, rotina, outro';
COMMENT ON TABLE recomendacao_historico IS 'Histórico de versões das recomendações técnicas, com snapshot JSON completo';
