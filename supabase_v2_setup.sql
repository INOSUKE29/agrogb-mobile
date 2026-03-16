
-- AGROGB MASTER BACKEND SETUP V2 (CONSOLIDADO IDEMPOTENTE)
-- Propósito: Configuração Completa, Segurança RLS e Evolução ERP V2.
-- Esse script funde a base sólida atual com a nova arquitetura de 41 tabelas.

BEGIN;

-- 1) Extensões Essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Funções Auxiliares (Blindadas)
CREATE OR REPLACE FUNCTION public.try_text_to_uuid(text) RETURNS uuid AS $$
DECLARE
  v uuid;
BEGIN
  BEGIN
    v := $1::uuid;
    RETURN v;
  EXCEPTION WHEN others THEN
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public;

-- 3) TABELAS NÚCLEO V2 (PRODUTORES & FAZENDAS)
-- Estas tabelas agora são o centro da autenticação e organização.

CREATE TABLE IF NOT EXISTS public.v2_produtores (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text NOT NULL,
    email text UNIQUE,
    telefone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    device_id text,
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.v2_fazendas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    produtor_id uuid REFERENCES public.v2_produtores(id),
    nome text NOT NULL,
    area_total numeric,
    cidade text,
    estado text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.v2_talhoes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    fazenda_id uuid REFERENCES public.v2_fazendas(id),
    nome text NOT NULL,
    area numeric,
    tipo_solo text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    is_deleted integer DEFAULT 0
);

-- 4) TABELAS DE PRODUÇÃO V2 (EVOLUÍDAS)
CREATE TABLE IF NOT EXISTS public.v2_colheitas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plantio_id UUID, -- Referência futura
    data_colheita TIMESTAMP WITH TIME ZONE,
    quantidade_total DECIMAL,
    unidade TEXT DEFAULT 'KG',
    qualidade TEXT,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- FASE V3: INTELIGÊNCIA E SOLO
CREATE TABLE IF NOT EXISTS public.v2_analise_solo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talhao_id UUID REFERENCES public.v2_talhoes(id),
    data_analise DATE,
    laboratorio TEXT,
    ph DECIMAL,
    materia_organica DECIMAL,
    fosforo DECIMAL,
    potassio DECIMAL,
    calcio DECIMAL,
    magnesio DECIMAL,
    aluminio DECIMAL,
    ctc DECIMAL,
    saturacao_bases DECIMAL,
    observacoes TEXT,
    usuario_id UUID REFERENCES public.v2_produtores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.v2_recomendacoes_tecnicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talhao_id UUID REFERENCES public.v2_talhoes(id),
    tipo TEXT,
    status TEXT DEFAULT 'Pendente',
    titulo TEXT,
    descricao TEXT,
    dose_sugerida TEXT,
    produto_sugerido TEXT,
    baseado_em TEXT,
    usuario_id UUID REFERENCES public.v2_produtores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5) REPARO E COMPATIBILIDADE (Tabelas Legadas V1)
-- Mantemos as tabelas V1 para que a "Ponte de Dados" funcione sem erros.

CREATE TABLE IF NOT EXISTS public.colheitas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    cultura text,
    produto text,
    quantidade numeric,
    data text,
    last_updated timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vendas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    cliente text,
    produto text,
    quantidade numeric,
    valor numeric,
    data text,
    last_updated timestamp DEFAULT now()
);

-- 6) SINCRONIZAÇÃO E LOGS
CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    data timestamp with time zone DEFAULT now(),
    tela text,
    erro text,
    stack text,
    usuario_id uuid
);

-- 7) NORMALIZAÇÃO AUTOMÁTICA (INDUSTRIAL)
-- Esse loop garante que qualquer tabela nova ou antiga tenha os campos de segurança.

DO $$
DECLARE
  t text;
  -- Lista de tabelas que exigem usuario_id para segurança RLS
  owner_tables text[] := ARRAY[
    'v2_produtores', 'v2_fazendas', 'v2_talhoes', 'v2_colheitas',
    'v2_analise_solo', 'v2_recomendacoes_tecnicas',
    'colheitas', 'vendas', 'error_logs'
  ];
BEGIN
  FOREACH t IN ARRAY owner_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = t) THEN
      
      -- Garantir id e uuid
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'usuario_id') THEN
        IF t <> 'v2_produtores' THEN -- Produtor não tem usuario_id (ele é o id)
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN usuario_id uuid;', t);
        END IF;
      END IF;

      -- Habilitar RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      
    END IF;
  END LOOP;
END $$;

-- 8) POLÍTICAS DE SEGURANÇA (OWNER-LEVEL)
-- Garante que cada produtor só veja seus próprios dados.

DO $$
DECLARE
  t text;
  owner_tables text[] := ARRAY[
    'v2_fazendas', 'v2_talhoes', 'v2_colheitas', 'v2_analise_solo', 
    'v2_recomendacoes_tecnicas', 'error_logs', 'colheitas', 'vendas'
  ];
BEGIN
  FOREACH t IN ARRAY owner_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
      EXECUTE format('DROP POLICY IF EXISTS owner_full_access ON public.%I;', t);
      EXECUTE format(
        'CREATE POLICY owner_full_access ON public.%I FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());'
        , t
      );
    END IF;
  END LOOP;

  -- Especial para Produtores
  DROP POLICY IF EXISTS owner_produtor_access ON public.v2_produtores;
  CREATE POLICY owner_produtor_access ON public.v2_produtores FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
END $$;

-- 9) STORAGE
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agro-media', 'agro-media', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
