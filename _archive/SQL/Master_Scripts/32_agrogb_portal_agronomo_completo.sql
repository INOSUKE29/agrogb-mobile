-- =========================================================================================
-- ARQUIVO: 32_agrogb_portal_agronomo_completo.sql
-- OBJETIVO: Schema para Análises, Biblioteca Técnica e Notificações (Portal Agrônomo)
-- =========================================================================================

-- 1. Tabela de Análises Laboratoriais
CREATE TABLE IF NOT EXISTS analises_laboratoriais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES auth.users(id),
    talhao_id UUID,
    agronomist_id UUID REFERENCES auth.users(id),
    tipo TEXT NOT NULL, -- 'solo', 'foliar', 'agua', 'substrato'
    data_coleta DATE,
    data_resultado DATE,
    laboratorio TEXT,
    
    -- Resultados JSON (flexível para os diferentes tipos)
    resultados JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Metadados
    laudo_pdf_url TEXT,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analises_cliente ON analises_laboratoriais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_analises_tipo ON analises_laboratoriais(tipo);

-- 2. Tabelas da Biblioteca Técnica
CREATE TABLE IF NOT EXISTS biblioteca_pragas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_comum TEXT NOT NULL,
    nome_cientifico TEXT,
    culturas TEXT[],
    sintomas TEXT,
    ciclo_vida TEXT,
    danos TEXT,
    metodos_controle TEXT,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biblioteca_doencas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_comum TEXT NOT NULL,
    agente_causal TEXT,
    culturas TEXT[],
    sintomas TEXT,
    condicoes_favoraveis TEXT,
    metodos_controle TEXT,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biblioteca_deficiencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nutriente TEXT NOT NULL, -- N, P, K, Ca, Mg, B, etc.
    mobilidade TEXT,
    culturas TEXT[],
    sintomas_visuais TEXT,
    fase_critica TEXT,
    acoes_corretivas TEXT,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biblioteca_compatibilidade (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_a TEXT NOT NULL,
    produto_b TEXT NOT NULL,
    status TEXT NOT NULL, -- 'compativel', 'incompativel', 'atencao'
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS biblioteca_artigos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo TEXT NOT NULL,
    categoria TEXT NOT NULL, -- 'pdf', 'manual', 'pesquisa', 'video', 'boletim'
    url TEXT NOT NULL,
    resumo TEXT,
    autor TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
