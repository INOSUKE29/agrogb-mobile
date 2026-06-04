-- ==========================================
-- SCRIPT: 14_B_agrogb_memoria_tecnica.sql
-- FASE: 4 (Inteligência Artificial)
-- OBJETIVO: Expandir a Biblioteca Global para ser uma "Memória Técnica Acumulada"
-- ==========================================

-- LIMPEZA
DROP TABLE IF EXISTS public.kb_outcomes CASCADE;
DROP TABLE IF EXISTS public.kb_combinations CASCADE;
DROP TABLE IF EXISTS public.kb_fertigation_protocols CASCADE;
DROP TABLE IF EXISTS public.kb_foliar_protocols CASCADE;
DROP TABLE IF EXISTS public.kb_phenological_phases CASCADE;
DROP TABLE IF EXISTS public.kb_symptoms CASCADE;
DROP TABLE IF EXISTS public.kb_images CASCADE;
DROP TABLE IF EXISTS public.kb_articles CASCADE;
DROP TABLE IF EXISTS public.kb_decisions CASCADE;
DROP TABLE IF EXISTS public.kb_experiences CASCADE;
DROP TABLE IF EXISTS public.kb_indicators CASCADE;

-- ==========================================
-- 1. MOTOR DE APRENDIZADO (FEEDBACK DE CAMPO)
-- ==========================================

-- 1.1 Biblioteca de Resultados Reais (A IA aprende aqui)
CREATE TABLE public.kb_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'AGRONOMO',
    owner_id UUID NOT NULL, -- Agrônomo que relatou o resultado
    crop_id UUID REFERENCES public.kb_crops(id) ON DELETE CASCADE,
    problem_entity TEXT, -- Ex: 'kb_pests', 'kb_diseases'
    problem_id UUID,     -- ID do Ácaro Rajado
    treatment_entity TEXT, -- Ex: 'kb_products', 'kb_recipes'
    treatment_id UUID,     -- ID da Abamectina
    control_percentage NUMERIC, -- Ex: 92.5
    evaluation_days INT, -- Ex: 15 dias após aplicação
    context_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Biblioteca de Decisões (Raciocínio Técnico)
CREATE TABLE public.kb_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'AGRONOMO',
    owner_id UUID NOT NULL,
    trigger_condition TEXT NOT NULL, -- Ex: 'Baixo Ca na Análise Foliar'
    action_taken TEXT NOT NULL,      -- Ex: 'Entrar com Calcinit'
    technical_reason TEXT NOT NULL,  -- Ex: 'Aumentar firmeza dos frutos na frutificação'
    outcome_id UUID REFERENCES public.kb_outcomes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.3 Biblioteca de Experiências Pessoais
CREATE TABLE public.kb_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'AGRONOMO',
    owner_id UUID NOT NULL,
    title TEXT NOT NULL, -- Ex: 'Teste Power Rootz Pós-poda'
    hypothesis TEXT,
    methodology TEXT,
    results TEXT,
    conclusion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. ESPECIFICIDADE AGRONÔMICA E MANEJO
-- ==========================================

-- 2.1 Fases Fenológicas
CREATE TABLE public.kb_phenological_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id UUID NOT NULL REFERENCES public.kb_crops(id) ON DELETE CASCADE,
    phase_order INT NOT NULL,
    name TEXT NOT NULL, -- Ex: 'Vegetativo', 'Pré-florada'
    duration_days INT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Protocolos de Fertirrigação
CREATE TABLE public.kb_fertigation_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'EMPRESA',
    owner_id UUID,
    crop_id UUID NOT NULL REFERENCES public.kb_crops(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES public.kb_phenological_phases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    recipe_json JSONB NOT NULL, -- Matriz de fertilizantes e caldas
    water_volume_ha NUMERIC,
    ec_target NUMERIC,
    ph_target NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Protocolos de Aplicação Foliar
CREATE TABLE public.kb_foliar_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'EMPRESA',
    owner_id UUID,
    crop_id UUID NOT NULL REFERENCES public.kb_crops(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES public.kb_phenological_phases(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    recipe_json JSONB NOT NULL,
    water_volume_ha NUMERIC,
    application_timing TEXT, -- Ex: 'Final da tarde'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Biblioteca de Combinações e Misturas (Compatibilidade)
CREATE TABLE public.kb_combinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    product_a_id UUID NOT NULL REFERENCES public.kb_products(id) ON DELETE CASCADE,
    product_b_id UUID NOT NULL REFERENCES public.kb_products(id) ON DELETE CASCADE,
    result_status TEXT NOT NULL, -- 'COMPATIVEL', 'INCOMPATIVEL', 'FITOTOXIDADE'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_a_id, product_b_id)
);

-- 2.5 Indicadores de Sucesso (Metas)
CREATE TABLE public.kb_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    crop_id UUID NOT NULL REFERENCES public.kb_crops(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL, -- Ex: 'Produção Ideal', 'Brix Ideal'
    target_value TEXT NOT NULL, -- Ex: '40 t/ha', '8-12'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. DICIONÁRIO VISUAL E CIENTÍFICO (Base para IA)
-- ==========================================

-- 3.1 Biblioteca de Sintomas (Sintoma Isolado)
CREATE TABLE public.kb_symptoms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    name TEXT NOT NULL UNIQUE, -- Ex: 'Borda Queimada', 'Folha Enrolada'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Repositório Central de Imagens Etiquetadas
CREATE TABLE public.kb_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    url TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'kb_pests', 'kb_symptoms', 'kb_deficiencies'
    entity_id UUID NOT NULL,
    ai_confidence_score NUMERIC, -- Opcional, gerado pela IA ao analisar
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Biblioteca de Artigos (Ciência Pura)
CREATE TABLE public.kb_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    title TEXT NOT NULL,
    authors TEXT,
    publication_year INT,
    source_url TEXT,
    pdf_url TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. SEGURANÇA E RLS (PADRÃO GLOBAL)
-- ==========================================

ALTER TABLE public.kb_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_phenological_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_fertigation_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_foliar_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

-- Política Genérica: Tudo usa a função public.can_read_kb criada no 14_A
CREATE POLICY "Leitura Universal ou Própria - 14_B" 
ON public.kb_outcomes FOR SELECT USING (public.can_read_kb(scope, owner_id));

CREATE POLICY "Escrita - Agronomo (Dono) 14_B" 
ON public.kb_outcomes FOR ALL USING (scope = 'AGRONOMO' AND owner_id = auth.uid());

-- Repetimos RLS para as outras...
CREATE POLICY "Leitura Universal ou Própria" ON public.kb_decisions FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Leitura Universal ou Própria" ON public.kb_experiences FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Leitura Universal ou Própria" ON public.kb_combinations FOR SELECT USING (public.can_read_kb(scope, owner_id));

-- ==========================================
-- CONCLUÍDO - MEMÓRIA TÉCNICA ACUMULADA INSTALADA
-- ==========================================
