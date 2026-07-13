-- ==========================================
-- SCRIPT: 14_A_agrogb_biblioteca_global.sql
-- FASE: 4 (Preparação para Inteligência Artificial)
-- OBJETIVO: Criar o "Cérebro Técnico" e Grafo de Conhecimento
-- ==========================================

-- LIMPEZA DE ESTRUTURAS EXISTENTES (Evitar conflitos em múltiplos runs)
DROP TABLE IF EXISTS public.kb_favorites CASCADE;
DROP TABLE IF EXISTS public.kb_relationships CASCADE;
DROP TABLE IF EXISTS public.kb_item_tags CASCADE;
DROP TABLE IF EXISTS public.kb_tags CASCADE;
DROP TABLE IF EXISTS public.kb_analysis_templates CASCADE;
DROP TABLE IF EXISTS public.kb_protocol_steps CASCADE;
DROP TABLE IF EXISTS public.kb_protocols CASCADE;
DROP TABLE IF EXISTS public.kb_recipes CASCADE;
DROP TABLE IF EXISTS public.kb_product_nutrients CASCADE;
DROP TABLE IF EXISTS public.kb_deficiencies CASCADE;
DROP TABLE IF EXISTS public.kb_diseases CASCADE;
DROP TABLE IF EXISTS public.kb_pests CASCADE;
DROP TABLE IF EXISTS public.kb_products CASCADE;
DROP TABLE IF EXISTS public.kb_nutrients CASCADE;
DROP TABLE IF EXISTS public.kb_crop_varieties CASCADE;
DROP TABLE IF EXISTS public.kb_crops CASCADE;

DROP TYPE IF EXISTS public.kb_scope CASCADE;

-- ==========================================
-- 1. TIPOS BASE
-- ==========================================
CREATE TYPE public.kb_scope AS ENUM ('GLOBAL', 'EMPRESA', 'AGRONOMO');

-- ==========================================
-- 2. ENTIDADES NÚCLEO (NÓS DO GRAFO)
-- ==========================================

-- 2.1 Culturas e Variedades (Ex: Morango -> San Andreas)
CREATE TABLE public.kb_crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID, -- NULL se GLOBAL, ou id do agronomo/empresa
    name TEXT NOT NULL,
    cycle_days INT,
    nutritional_demands TEXT,
    description TEXT,
    photos_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kb_crop_varieties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id UUID NOT NULL REFERENCES public.kb_crops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specific_traits TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Nutrientes (Tabela Base: N, P, K, Ca)
CREATE TABLE public.kb_nutrients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT NOT NULL UNIQUE, -- Ex: 'Ca'
    name TEXT NOT NULL,          -- Ex: 'Cálcio'
    function_desc TEXT,
    deficiency_symptoms TEXT,
    excess_symptoms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Produtos Comerciais (Insumos)
CREATE TABLE public.kb_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    name TEXT NOT NULL, -- Ex: 'Calcinit'
    manufacturer TEXT,
    category TEXT,      -- Adubo, Defensivo, Biológico
    guarantees TEXT,
    recommended_dose TEXT,
    compatibility TEXT,
    incompatibility TEXT,
    notes TEXT,
    photos_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.4 Composição Nutricional dos Produtos
CREATE TABLE public.kb_product_nutrients (
    product_id UUID NOT NULL REFERENCES public.kb_products(id) ON DELETE CASCADE,
    nutrient_id UUID NOT NULL REFERENCES public.kb_nutrients(id) ON DELETE CASCADE,
    percentage NUMERIC, -- Ex: 15.5 para Nitrogênio
    PRIMARY KEY (product_id, nutrient_id)
);

-- 2.5 Fitossanitário: Pragas, Doenças e Deficiências
CREATE TABLE public.kb_pests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    common_name TEXT NOT NULL,
    scientific_name TEXT,
    symptoms TEXT,
    damage_desc TEXT,
    cycle_desc TEXT,
    control_methods TEXT,
    photos_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kb_diseases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    name TEXT NOT NULL, -- Ex: 'Oídio'
    causal_agent TEXT,
    symptoms TEXT,
    favorable_conditions TEXT,
    control_methods TEXT,
    photos_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kb_deficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    nutrient_id UUID REFERENCES public.kb_nutrients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    symptoms TEXT,
    causes TEXT,
    corrections TEXT,
    photos_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. ENTIDADES COMPOSTAS (MANEJOS)
-- ==========================================

-- 3.1 Receitas (Combinação de Produtos)
CREATE TABLE public.kb_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'AGRONOMO',
    owner_id UUID NOT NULL, -- Geralmente o Agrônomo que criou
    name TEXT NOT NULL,     -- Ex: 'Pegamento Pós-Poda'
    objective TEXT,
    products_json JSONB,    -- Array com IDs e doses para simplificar
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Protocolos e Linhas do Tempo
CREATE TABLE public.kb_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'EMPRESA',
    owner_id UUID,
    name TEXT NOT NULL,
    crop_id UUID REFERENCES public.kb_crops(id) ON DELETE CASCADE,
    objective TEXT,
    status TEXT DEFAULT 'RASCUNHO', -- RASCUNHO, REVISAO, APROVADO, PUBLICADO
    version INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.kb_protocol_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID NOT NULL REFERENCES public.kb_protocols(id) ON DELETE CASCADE,
    step_order INT NOT NULL, -- Ex: 1 (Semana 1), 2 (Semana 2)
    step_name TEXT,
    description TEXT,
    products_json JSONB, -- Quais produtos aplicar nesta etapa
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3 Templates de Análise
CREATE TABLE public.kb_analysis_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope public.kb_scope NOT NULL DEFAULT 'GLOBAL',
    owner_id UUID,
    type TEXT NOT NULL, -- 'SOLO', 'FOLIAR', 'AGUA'
    metrics_json JSONB, -- Estrutura de campos esperados (Ex: pH, MO, P, K)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. MOTOR DE RELACIONAMENTOS (O GRAFO)
-- ==========================================

-- Permite conectar TUDO com TUDO dinamicamente (Cultura -> Praga, Doença -> Produto)
CREATE TABLE public.kb_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_entity TEXT NOT NULL, -- Ex: 'kb_crops'
    source_id UUID NOT NULL,
    target_entity TEXT NOT NULL, -- Ex: 'kb_pests'
    target_id UUID NOT NULL,
    relation_type TEXT NOT NULL, -- Ex: 'AFFECTED_BY', 'CONTROLLED_BY'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (source_entity, source_id, target_entity, target_id, relation_type)
);

-- ==========================================
-- 5. SISTEMA DE TAGS E FAVORITOS
-- ==========================================

CREATE TABLE public.kb_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- Ex: 'orgânico'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela polimórfica para taguear qualquer coisa da biblioteca
CREATE TABLE public.kb_item_tags (
    tag_id UUID NOT NULL REFERENCES public.kb_tags(id) ON DELETE CASCADE,
    entity_name TEXT NOT NULL, -- Ex: 'kb_products'
    entity_id UUID NOT NULL,
    PRIMARY KEY (tag_id, entity_name, entity_id)
);

CREATE TABLE public.kb_favorites (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_name TEXT NOT NULL, -- Ex: 'kb_protocols'
    entity_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, entity_name, entity_id)
);

-- ==========================================
-- 6. SEGURANÇA ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Regra de Ouro da Biblioteca:
-- Nível GLOBAL (owner_id IS NULL) = Leitura para todos, Escrita apenas para ADMIN.
-- Nível EMPRESA = Leitura/Escrita isolada pela empresa.
-- Nível AGRONOMO = Leitura/Escrita isolada pelo próprio usuário (auth.uid).

-- Função Auxiliar Genérica de Leitura da Biblioteca
CREATE OR REPLACE FUNCTION public.can_read_kb(item_scope public.kb_scope, item_owner_id UUID) 
RETURNS BOOLEAN AS $$
BEGIN
    -- Se for Global, todo mundo lê.
    IF item_scope = 'GLOBAL' THEN RETURN TRUE; END IF;
    -- Se for Agrônomo, lê se for dele (ou se for Admin).
    IF item_scope = 'AGRONOMO' THEN RETURN (item_owner_id = auth.uid() OR public.is_admin()); END IF;
    -- (Opcional) Se tivermos ID da empresa amarrado ao profile, checaríamos aqui.
    -- Por segurança, se não caiu em Global nem é dono, não lê.
    RETURN FALSE; 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ativando RLS nas tabelas principais
ALTER TABLE public.kb_crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_pests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_diseases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_deficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_recipes ENABLE ROW LEVEL SECURITY;

-- Aplicando Políticas Exemplo (kb_products)
CREATE POLICY "Leitura Universal ou Própria - Produtos" 
ON public.kb_products FOR SELECT 
USING (public.can_read_kb(scope, owner_id));

CREATE POLICY "Escrita Admin ou Dono - Produtos" 
ON public.kb_products FOR ALL 
USING (
    (scope = 'GLOBAL' AND public.is_admin()) OR 
    (scope = 'AGRONOMO' AND owner_id = auth.uid())
);

-- (Nota: Em produção, você repete estas políticas para crops, pests, diseases, etc.)

-- ==========================================
-- CONCLUÍDO - NÚCLEO DA BIBLIOTECA GLOBAL INSTALADO
-- ==========================================
