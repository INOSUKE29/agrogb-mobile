
-- ==========================================================
-- AGROGB MASTER CONSOLIDATED SETUP (V2 + V3 + LEGACY + SECURITY)
-- Versão 10.9.11 - "O Script Mestre Definitivo e de Alta Performance"
-- ==========================================================
-- Este script realiza:
-- 1. Setup de Extensões e Funções Blindadas (Search Path fixo)
-- 2. Criação do Schema V2/V3 (Produtores, Fazendas, Solo, Inteligência)
-- 3. Criação das Tabelas Legadas V1
-- 4. Sistema de Auditoria (Activity Log) e Erros (Error Logs)
-- 5. Limpeza de Constraints e Índices Duplicados (activity_log)
-- 6. Quarentena e Limpeza de Dados Órfãos
-- 7. Otimização RLS Global (High Performance - (SELECT auth.uid()))
-- 8. Consolidação de Políticas Redundantes (Vendas e Activity Log)
-- 9. Segurança Avançada (Esquema Privado agro_admin)
-- ==========================================================

BEGIN;

-- 1) EXTENSÕES ESSENCIAIS E ESQUEMAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS agro_admin;

-- 2) FUNÇÕES AUXILIARES BLINDADAS (Search Path fixo)
CREATE OR REPLACE FUNCTION public.try_text_to_uuid(text) 
RETURNS uuid AS $$
DECLARE v uuid;
BEGIN
  BEGIN v := $1::uuid; RETURN v; EXCEPTION WHEN others THEN RETURN NULL; END;
END;
$$ LANGUAGE plpgsql IMMUTABLE SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.get_table_pkey_cols(p_table text)
RETURNS text LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
  SELECT string_agg(attname, ',') FROM (
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    JOIN pg_class c ON c.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE i.indrelid = format('public.%s', p_table)::regclass
      AND i.indisprimary
    ORDER BY a.attnum
  ) s;
$$;

-- 3) TABELAS NÚCLEO V2 (PRODUTORES, FAZENDAS, TALHÕES)
CREATE TABLE IF NOT EXISTS public.v2_produtores (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text NOT NULL,
    email text UNIQUE,
    telefone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
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

-- 4) PRODUÇÃO E INTELIGÊNCIA V3
CREATE TABLE IF NOT EXISTS public.v2_analise_solo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talhao_id UUID REFERENCES public.v2_talhoes(id),
    ph DECIMAL,
    fosforo DECIMAL,
    potassio DECIMAL,
    usuario_id UUID REFERENCES public.v2_produtores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.v2_recomendacoes_tecnicas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talhao_id UUID REFERENCES public.v2_talhoes(id),
    tipo TEXT,
    titulo TEXT,
    descricao TEXT,
    usuario_id UUID REFERENCES public.v2_produtores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5) TABELAS ESSENCIAIS V1
CREATE TABLE IF NOT EXISTS public.areas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    nome text,
    metragem numeric,
    last_updated timestamp DEFAULT now(),
    usuario_id uuid
);

CREATE TABLE IF NOT EXISTS public.items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    nome text,
    categoria text,
    unidade text,
    last_updated timestamp DEFAULT now(),
    usuario_id uuid
);

-- 6) AUDITORIA E LOGS (Correção de PERFORMANCE e CONSTRAINTS)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4(),
    usuario_id uuid,
    acao text,
    entidade text,
    descricao text,
    created_at timestamp DEFAULT now()
);

-- RESOLUÇÃO DE ÍNDICE DUPLICADO E CONSTRAINT
-- O PostgreSQL não permite apagar o índice se ele estiver vinculado a uma UNIQUE CONSTRAINT.
ALTER TABLE public.activity_log DROP CONSTRAINT IF EXISTS activity_log_uuid_key;
DROP INDEX IF EXISTS public.activity_log_uuid_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_activity_log_uuid ON public.activity_log(uuid);

CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id uuid,
    tela text,
    erro text,
    stack text,
    created_at timestamp DEFAULT now()
);

-- 6.1) TABELA DE CONFLITOS DE SINCRONISMO (V2.1)
CREATE TABLE IF NOT EXISTS public.v2_sync_conflicts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name text NOT NULL,
    record_uuid uuid NOT NULL,
    local_data jsonb,
    remote_data jsonb,
    status text DEFAULT 'Pendente', -- 'Pendente', 'Resolvido'
    created_at timestamp with time zone DEFAULT now()
);

-- 7) QUARENTENA E LIMPEZA DE DADOS ÓRFÃOS
CREATE TABLE IF NOT EXISTS public.usuario_id_quarantine (
  id serial PRIMARY KEY,
  run_ts timestamptz DEFAULT now(),
  source_table text NOT NULL,
  usuario_id uuid,
  row_data jsonb,
  note text
);

DO $$
DECLARE rec record;
BEGIN
  FOR rec IN SELECT table_name FROM information_schema.columns WHERE table_schema = 'public' AND column_name = 'usuario_id' LOOP
    EXECUTE format('INSERT INTO public.usuario_id_quarantine (source_table, usuario_id, row_data, note)
      SELECT %L, usuario_id, to_jsonb(t.*), ''orphan_detected'' FROM public.%I t 
      WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)', rec.table_name, rec.table_name);
    
    EXECUTE format('UPDATE public.%I SET usuario_id = NULL WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)', rec.table_name);
  END LOOP;
END $$;

-- 8) BLINDAGEM DE SEGURANÇA E VIEWS PRIVADAS (agro_admin)
DROP VIEW IF EXISTS public.admin_usuario_integrity_report;
CREATE OR REPLACE VIEW agro_admin.admin_usuario_integrity_report AS
SELECT 'v2_fazendas'::text AS table_name, COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count FROM public.v2_fazendas
UNION ALL
SELECT 'v2_talhoes'::text AS table_name, COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count FROM public.v2_talhoes;

-- 9) POLÍTICAS RLS OTIMIZADAS (High Performance e Consolidação)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type = 'BASE TABLE' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'usuario_id') THEN
      
      -- Consolidar múltiplas políticas permissivas (Caso 'vendas')
      IF t = 'vendas' THEN
        EXECUTE format('DROP POLICY IF EXISTS "Atualização para autenticados" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_access_vendas ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_full_access ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_update ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_select ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS vendas_admin_read ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS vendas_owner_full_access ON public.%I;', t);
      END IF;

      -- Consolidar múltiplas políticas permissivas (Caso 'activity_log')
      IF t = 'activity_log' THEN
        EXECUTE format('DROP POLICY IF EXISTS "Exclusão para autenticados" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Inserção para autenticados" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS activity_log_owner_full_access ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_delete ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_insert ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_select ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_full_access ON public.%I;', t);
      END IF;

      -- Consolidar múltiplas políticas permissivas (Caso 'analise_ia')
      IF t = 'analise_ia' THEN
        EXECUTE format('DROP POLICY IF EXISTS "Exclusão para autenticados" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS analise_ia_owner_full_access ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_delete ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_full_access ON public.%I;', t);
      END IF;

      -- Consolidar múltiplas políticas permissivas (Caso 'custos')
      IF t = 'custos' THEN
        EXECUTE format('DROP POLICY IF EXISTS "Exclusão para autenticados" ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS custos_owner_full_access ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_full_access ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS public_delete ON public.%I;', t);
      END IF;

      EXECUTE format('DROP POLICY IF EXISTS owner_full_access ON public.%I;', t);
      -- Otimização: Uso de (SELECT auth.uid()) para evitar reavaliação por linha
      EXECUTE format('CREATE POLICY owner_full_access ON public.%I FOR ALL TO authenticated USING (usuario_id = (SELECT auth.uid())) WITH CHECK (usuario_id = (SELECT auth.uid()));', t);
    END IF;
  END LOOP;
END $$;

-- Especial para Produtores (Otimizado)
DROP POLICY IF EXISTS owner_produtor_access ON public.v2_produtores;
CREATE POLICY owner_produtor_access ON public.v2_produtores FOR ALL TO authenticated USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));

-- 10) PERMISSÕES FINAIS E STORAGE
REVOKE ALL ON SCHEMA agro_admin FROM PUBLIC;
GRANT USAGE ON SCHEMA agro_admin TO service_role, postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA agro_admin TO service_role, postgres;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('agro-media', 'agro-media', false) ON CONFLICT (id) DO NOTHING;

COMMIT;
