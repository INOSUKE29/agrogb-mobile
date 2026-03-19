-- ========================================================
-- AGROGB MASTER CONSOLIDATED SETUP (SENIOR VERSION V10.3)
-- Propósito: Setup DEFINITIVO, COMPLETO e ABSOLUTO do Backend.
-- Destaque: Funções de Alta Performance + RLS Dinâmico V2 + Auditoria.
-- ========================================================

BEGIN;

-- 1) PREPARAÇÃO: EXTENSÕES E FUNÇÕES AUXILIARES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Função para converter texto em UUID de forma segura (evita erros de cast)
CREATE OR REPLACE FUNCTION public.try_text_to_uuid(text) 
RETURNS uuid AS $$
DECLARE v uuid;
BEGIN
  BEGIN v := $1::uuid; RETURN v; EXCEPTION WHEN others THEN RETURN NULL; END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = pg_catalog, public;

-- 2) TABELAS NÚCLEO (IDENTIDADE E ACESSO)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    nivel TEXT DEFAULT 'USUARIO',
    email TEXT,
    nome_completo TEXT,
    telefone TEXT,
    endereco TEXT,
    avatar TEXT,
    provider TEXT DEFAULT 'local',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0,
    sync_status INTEGER DEFAULT 0
);

-- Tabela Legada V2 (Produtores)
CREATE TABLE IF NOT EXISTS public.v2_produtores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    email TEXT UNIQUE,
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

-- 3) REGISTROS DE BASE (ESTRUTURA DA FAZENDA)
CREATE TABLE IF NOT EXISTS public.clientes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    telefone TEXT,
    cidade TEXT,
    estado TEXT,
    endereco TEXT,
    cpf_cnpj TEXT,
    observacoes TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.culturas (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    observacao TEXT,
    peso_medio_caixa DECIMAL DEFAULT 1,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.cadastro (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    unidade TEXT,
    tipo TEXT,
    observacao TEXT,
    estocavel INTEGER DEFAULT 1,
    vendavel INTEGER DEFAULT 1,
    fator_conversao DECIMAL DEFAULT 1,
    preco_venda DECIMAL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.areas (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    descricao TEXT,
    metragem DECIMAL,
    peso_medio_caixa DECIMAL DEFAULT 1,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

-- 4) PRODUÇÃO AVANÇADA V2/V3
CREATE TABLE IF NOT EXISTS public.v2_fazendas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    area_total DECIMAL,
    cidade TEXT,
    estado TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.v2_talhoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fazenda_id UUID REFERENCES public.v2_fazendas(id),
    usuario_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    area DECIMAL,
    tipo_solo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.v2_analise_solo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talhao_id UUID REFERENCES public.v2_talhoes(id),
    usuario_id UUID REFERENCES auth.users(id),
    ph DECIMAL,
    fosforo DECIMAL,
    potassio DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5) OPERAÇÕES DO ERP (PRODUÇÃO E FINANÇAS)
CREATE TABLE IF NOT EXISTS public.colheitas (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    area_id UUID REFERENCES public.areas(uuid),
    cultura TEXT NOT NULL,
    produto TEXT NOT NULL,
    quantidade DECIMAL NOT NULL,
    congelado DECIMAL DEFAULT 0,
    data_colheita TEXT,
    data TEXT NOT NULL,
    observacao TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.plantio (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    cultura TEXT NOT NULL,
    quantidade_pes INTEGER NOT NULL,
    tipo_plantio TEXT,
    data TEXT NOT NULL,
    observacao TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.descarte (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    produto TEXT NOT NULL,
    quantidade_kg DECIMAL NOT NULL,
    motivo TEXT,
    data TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.vendas (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    cliente_id UUID REFERENCES public.clientes(uuid),
    cliente TEXT NOT NULL,
    produto TEXT NOT NULL,
    quantidade DECIMAL NOT NULL,
    valor DECIMAL NOT NULL,
    valor_recebido DECIMAL,
    status_pagamento TEXT DEFAULT 'A_RECEBER',
    data TEXT NOT NULL,
    forma_pagamento TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.compras (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    item TEXT NOT NULL,
    quantidade DECIMAL NOT NULL,
    valor DECIMAL NOT NULL,
    data TEXT NOT NULL,
    observacao TEXT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.custos (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    produto TEXT NOT NULL,
    tipo TEXT,
    quantidade DECIMAL NOT NULL,
    valor_total DECIMAL NOT NULL,
    data TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

-- 6) GESTÃO DE FROTA E ENCOMENDAS
CREATE TABLE IF NOT EXISTS public.maquinas (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    placa TEXT,
    horimetro_atual DECIMAL DEFAULT 0,
    intervalo_revisao DECIMAL DEFAULT 10000,
    status TEXT DEFAULT 'OK',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.manutencao_frota (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    maquina_uuid UUID REFERENCES public.maquinas(uuid),
    data TEXT NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    cliente_id UUID REFERENCES public.clientes(uuid),
    produto_id UUID REFERENCES public.cadastro(uuid),
    unidade TEXT NOT NULL,
    quantidade_total DECIMAL NOT NULL,
    quantidade_restante DECIMAL NOT NULL,
    valor_unitario DECIMAL,
    data_prevista TEXT,
    status TEXT DEFAULT 'PENDENTE',
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

-- 7) MONITORAMENTO INTELIGENTE (IA)
CREATE TABLE IF NOT EXISTS public.monitoramento_entidade (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    area_id UUID REFERENCES public.areas(uuid),
    data TEXT NOT NULL,
    observacao_usuario TEXT,
    severidade TEXT DEFAULT 'BAIXA',
    categoria TEXT DEFAULT 'OUTROS',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.monitoramento_media (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoramento_uuid UUID REFERENCES public.monitoramento_entidade(uuid),
    usuario_id UUID REFERENCES auth.users(id),
    tipo TEXT NOT NULL, -- IMAGEM / PDF
    caminho_arquivo TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analise_ia (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitoramento_uuid UUID REFERENCES public.monitoramento_entidade(uuid),
    usuario_id UUID REFERENCES auth.users(id),
    classificacao_principal TEXT,
    sintomas TEXT,
    causa_provavel TEXT,
    sugestao_controle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8) OUTRAS OPERACIONAIS E SINCRONISMO
CREATE TABLE IF NOT EXISTS public.v2_sync_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    table_name TEXT NOT NULL,
    record_uuid UUID NOT NULL,
    local_data JSONB,
    remote_data JSONB,
    status TEXT DEFAULT 'Pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.caderno_notas (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    observacao TEXT NOT NULL,
    data TEXT NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.cost_categories (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    type TEXT,
    is_default INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.costs (
    id SERIAL PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users(id),
    category_id INTEGER REFERENCES public.cost_categories(id),
    total_value DECIMAL NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_deleted INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.error_logs (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES auth.users(id),
    data TIMESTAMP WITH TIME ZONE DEFAULT now(),
    tela TEXT,
    erro TEXT,
    stack TEXT
);

-- 9) SEGURANÇA FINAL (RLS DINÂMICO V2)
DO $$
DECLARE
  t text;
  all_tables text[] := ARRAY[
    'usuarios', 'clientes', 'culturas', 'cadastro', 'areas', 
    'colheitas', 'plantio', 'descarte', 'vendas', 'compras', 
    'custos', 'maquinas', 'manutencao_frota', 'orders', 
    'caderno_notas', 'monitoramento_entidade', 'monitoramento_media', 
    'analise_ia', 'cost_categories', 'costs', 'error_logs', 
    'v2_sync_conflicts', 'v2_fazendas', 'v2_talhoes', 
    'v2_produtores', 'v2_analise_solo'
  ];
  has_usuario_id boolean;
  has_id boolean;
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Owner Access" ON public.%I;', t);
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'usuario_id'
    ) INTO has_usuario_id;
    
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'id'
    ) INTO has_id;

    IF has_usuario_id THEN
      EXECUTE format('CREATE POLICY "Owner Access" ON public.%I FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());', t);
    ELSIF has_id THEN
      EXECUTE format('CREATE POLICY "Owner Access" ON public.%I FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());', t);
    ELSE
      RAISE NOTICE 'Skipping public.% (no identity column found)', t;
    END IF;
  END LOOP;
END $$;

COMMIT;
