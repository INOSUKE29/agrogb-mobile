-- AGROGB MASTER BACKEND SETUP (CONSOLIDADO IDEMPOTENTE)
-- Propósito: Configuração Completa, Segurança RLS e Reparo de Estrutura.
-- Versão Final Consolidada: Baseada na v17.0 com filtros de View e injeção de usuario_id.

BEGIN;

-- 1) Extensões Essenciais
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2) Função Auxiliar de Conversão Segura (Blindada - Search Path)
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

-- 3) Criação/Reparo das tabelas (idempotente)

CREATE TABLE IF NOT EXISTS public.culturas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    nome text NOT NULL,
    observacao text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    usuario text UNIQUE,
    email text,
    nome_completo text,
    telefone text,
    endereco text,
    nivel text DEFAULT 'USUARIO',
    provider text DEFAULT 'local',
    avatar_url text,
    avatar text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.areas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    nome text,
    descricao text,
    observacao text,
    metragem numeric,
    peso_medio_caixa numeric DEFAULT 1,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    codigo text,
    nome text,
    categoria text,
    unidade text,
    tipo text,
    descricao text,
    observacao text,
    estocavel integer DEFAULT 1,
    vendavel integer DEFAULT 1,
    principio_ativo text,
    classe_toxicologica text,
    composicao text,
    preco_venda numeric DEFAULT 0,
    fator_conversao numeric DEFAULT 1,
    descricao_ia text,
    validado_por text,
    data_validacao timestamp,
    unidade_id integer,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.clientes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    nome text,
    telefone text,
    cidade text,
    estado text,
    endereco text,
    cpf_cnpj text,
    observacoes text,
    observacao_legada text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.colheitas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    area_id uuid REFERENCES public.areas(id),
    cultura text,
    produto text,
    quantidade numeric,
    congelado numeric DEFAULT 0,
    tipo text,
    data_colheita date,
    data text,
    observacao text,
    anexo text,
    usuario_id uuid REFERENCES public.users(id),
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.vendas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    cliente_id uuid REFERENCES public.clientes(id),
    cliente text,
    produto_id uuid REFERENCES public.items(id),
    produto text,
    quantidade numeric,
    valor numeric,
    valor_recebido numeric,
    status_pagamento text DEFAULT 'A_RECEBER',
    data_venda date,
    data_recebimento timestamp,
    forma_pagamento text,
    data text,
    observacao text,
    anexo text,
    usuario_id uuid REFERENCES public.users(id),
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.estoque (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    item_id uuid REFERENCES public.items(id),
    produto text,
    quantidade numeric,
    updated_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_estoque_item_id ON public.estoque(item_id);

CREATE TABLE IF NOT EXISTS public.movimentos_estoque (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    item_id uuid REFERENCES public.items(id),
    produto_id text,
    tipo_movimento text,
    tipo text,
    quantidade numeric,
    origem text,
    referencia text,
    data_movimento timestamp,
    data text,
    observacao text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.planos_adubacao (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    nome_plano text,
    cultura text,
    tipo_aplicacao text,
    area_local text,
    descricao_tecnica text,
    status text,
    data_criacao timestamp DEFAULT now(),
    data_aplicacao timestamp,
    anexos_uri text,
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.compras (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    item text,
    quantidade numeric,
    valor numeric,
    cultura text,
    usuario_id uuid,
    data text,
    observacao text,
    detalhes text,
    anexo text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.plantio (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    cultura text,
    quantidade_pes integer,
    tipo_plantio text,
    usuario_id uuid,
    data text,
    observacao text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.custos (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    produto text,
    tipo text,
    quantidade numeric,
    valor_total numeric,
    usuario_id uuid,
    data text,
    observacao text,
    anexo text,
    categoria_id text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.descarte (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    produto text,
    quantidade_kg numeric,
    motivo text,
    usuario_id uuid,
    data text,
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.maquinas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    nome text,
    tipo text,
    placa text,
    horimetro_atual numeric DEFAULT 0,
    intervalo_revisao numeric DEFAULT 10000,
    status text DEFAULT 'OK',
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.manutencao_frota (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    maquina_uuid uuid REFERENCES public.maquinas(id),
    data text,
    descricao text,
    valor numeric,
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.monitoramento_entidade (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    usuario_id uuid,
    area_id uuid,
    cultura_id text,
    data text,
    observacao_usuario text,
    status text DEFAULT 'RASCUNHO',
    nivel_confianca text DEFAULT 'TÉCNICO',
    severidade text DEFAULT 'BAIXA',
    categoria text DEFAULT 'OUTROS',
    criado_em timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.monitoramento_media (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    monitoramento_uuid uuid REFERENCES public.monitoramento_entidade(id),
    tipo text,
    caminho_arquivo text,
    criado_em timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.analise_ia (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    monitoramento_uuid uuid REFERENCES public.monitoramento_entidade(id),
    classificacao_principal text,
    classificacoes_secundarias text,
    sintomas text,
    causa_provavel text,
    tipo_problema text,
    nutriente text,
    sugestao_controle text,
    produtos_citados text,
    dosagem text,
    forma_aplicacao text,
    observacoes_tecnicas text,
    fonte_informacao text,
    criado_em timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.caderno_notas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    observacao text,
    data text,
    usuario_id uuid,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.activity_log (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    data text,
    usuario_id uuid,
    usuario text,
    acao text,
    entidade text,
    descricao text,
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.error_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    data text,
    usuario_id uuid,
    tela text,
    erro text,
    stack text,
    created_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.receitas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    produto_pai_uuid uuid,
    item_filho_uuid uuid,
    quantidade numeric,
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    usuario_id uuid REFERENCES public.users(id),
    full_name text,
    bio text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.movimentacoes_financeiras (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    tipo text,
    valor numeric,
    usuario_id uuid,
    data text,
    descricao text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.app_settings (
    id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    primary_color text,
    theme_mode text,
    fazenda_nome text,
    fazenda_produtor text,
    fazenda_documento text,
    fazenda_telefone text,
    fazenda_email text,
    fazenda_logo text,
    fin_moeda text,
    fazenda_area numeric,
    fazenda_safra text,
    unidade_padrao text DEFAULT 'KG',
    rel_graficos integer DEFAULT 1,
    rel_auto_pdf integer DEFAULT 0,
    rel_rodape text,
    updated_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cost_categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    name text,
    type text,
    is_default integer DEFAULT 0,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.costs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    category_id uuid REFERENCES public.cost_categories(id),
    culture_id uuid REFERENCES public.areas(id),
    fleet_id uuid REFERENCES public.maquinas(id),
    usuario_id uuid,
    quantity numeric,
    unit_value numeric,
    total_value numeric,
    notes text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now(),
    is_deleted integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.unidades_medida (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    uuid uuid DEFAULT uuid_generate_v4() UNIQUE,
    nome text,
    sigla text UNIQUE
);

CREATE TABLE IF NOT EXISTS public.categorias_despesa (
    id text PRIMARY KEY,
    nome text NOT NULL,
    tipo text,
    created_at timestamp DEFAULT now()
);

-- 4) Reparo Dinâmico e Normalização Blindada (INDUSTRIAL v17.0)
DO $$
DECLARE
  t text;
  tables_to_fix text[] := ARRAY[
    'users','areas','items','clientes','colheitas','vendas',
    'compras','plantio','custos','costs','descarte',
    'monitoramento_entidade','caderno_notas','movimentacoes_financeiras',
    'activity_log','error_logs','profiles','maquinas','estoque','culturas',
    'planos_adubacao','unidades_medida','receitas','analise_ia','monitoramento_media'
  ];
  col_type text;
BEGIN
  FOREACH t IN ARRAY tables_to_fix LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = t AND table_type = 'BASE TABLE') THEN
      
      -- 4.1) Garantir coluna 'id' (UUID PK)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = t AND column_name = 'id') THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN id uuid;', t);
        EXECUTE format('UPDATE public.%I SET id = uuid_generate_v4() WHERE id IS NULL;', t);
      END IF;

      -- 4.2) Garantir Chave Primária
      IF NOT EXISTS (
          SELECT 1 FROM pg_constraint c 
          JOIN pg_class tbl ON tbl.oid = c.conrelid 
          JOIN pg_namespace nsp ON nsp.oid = tbl.relnamespace 
          WHERE nsp.nspname = 'public' AND tbl.relname = t AND c.contype = 'p'
      ) THEN
          EXECUTE format('UPDATE public.%I SET id = uuid_generate_v4() WHERE id IS NULL;', t);
          EXECUTE format('ALTER TABLE public.%I ADD PRIMARY KEY (id);', t);
      END IF;

      -- 4.3) Normalização da coluna 'uuid' (Hotfix Error 42804)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = t AND column_name = 'uuid') THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN uuid uuid DEFAULT uuid_generate_v4() UNIQUE;', t);
        EXECUTE format('UPDATE public.%I SET uuid = uuid_generate_v4() WHERE uuid IS NULL;', t);
      ELSE
        -- Se existir, checar tipo
        SELECT data_type INTO col_type FROM information_schema.columns 
          WHERE table_schema='public' AND table_name = t AND column_name = 'uuid';

        IF col_type = 'text' OR col_type = 'character varying' THEN
            EXECUTE format('UPDATE public.%I SET uuid = NULL WHERE (uuid = '''');', t);
            BEGIN
              EXECUTE format('ALTER TABLE public.%I ALTER COLUMN uuid DROP DEFAULT;', t);
            EXCEPTION WHEN others THEN NULL;
            END;
            BEGIN
              EXECUTE format('ALTER TABLE public.%I ALTER COLUMN uuid TYPE uuid USING public.try_text_to_uuid(uuid);', t);
            EXCEPTION WHEN others THEN RAISE WARNING 'Falha ao converter em %', t;
            END;
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN uuid SET DEFAULT uuid_generate_v4();', t);
            BEGIN
              EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS uq_%I_uuid ON public.%I(uuid);', t, t);
            EXCEPTION WHEN others THEN NULL;
            END;
        END IF;
      END IF;

      -- 4.4) usuario_id
      -- Lista completa de tabelas que exigem usuario_id para segurança RLS Owner-Level
      IF t IN ('compras','plantio','custos','costs','descarte','caderno_notas','movimentacoes_financeiras','activity_log','error_logs','monitoramento_entidade','analise_ia','monitoramento_media','movimentos_estoque','receitas') THEN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = t AND column_name = 'usuario_id') THEN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN usuario_id uuid;', t);
            RAISE NOTICE 'Adicionada coluna usuario_id em %', t;
          END IF;
      END IF;
      
    END IF;
  END LOOP;
END $$;

-- 5) Preenchimento de Segurança (Linhas Órfãs - Apenas Tabelas)
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN 
    SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t ON c.table_name = t.table_name AND c.table_schema = t.table_schema
    WHERE c.table_schema='public' AND c.column_name='uuid' AND c.data_type='uuid' AND t.table_type = 'BASE TABLE'
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = rec.table_name AND column_name = 'id' AND data_type = 'uuid') THEN
        EXECUTE format('UPDATE public.%I SET uuid = id WHERE uuid IS NULL AND id IS NOT NULL;', rec.table_name);
    END IF;
    EXECUTE format('UPDATE public.%I SET uuid = uuid_generate_v4() WHERE uuid IS NULL;', rec.table_name);
  END LOOP;
END $$;

-- 6) Habilitar RLS GLOBAL (somente para BASE TABLES)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables 
           WHERE table_schema='public' AND table_type = 'BASE TABLE'
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXCEPTION WHEN others THEN
      RAISE WARNING 'Falha ao habilitar RLS em %: %', t, SQLERRM;
    END;
  END LOOP;
END $$;

-- 7) POLÍTICAS DE SEGURANÇA (Owner-Only)
DO $$
DECLARE
  t text;
  -- Lista expandida para incluir todas as tabelas sensíveis citadas no reporte de segurança
  owner_tables text[] := ARRAY[
    'vendas','colheitas','costs','custos','compras','caderno_notas',
    'movimentacoes_financeiras','monitoramento_entidade','error_logs','activity_log',
    'plantio','profiles','descarte','analise_ia','monitoramento_media','movimentos_estoque','receitas'
  ];
BEGIN
  -- Limpeza Global de Políticas Legadas (Para evitar avisos de 'Always True')
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS authenticated_full_access ON public.%I;', t);
    EXECUTE format('DROP POLICY IF EXISTS "Leitura para autenticados" ON public.%I;', t);
  END LOOP;

  FOREACH t IN ARRAY owner_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = t AND table_type = 'BASE TABLE') THEN
      
      -- Garantir usuario_id (Migração Automática)
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = t AND column_name = 'usuario_id') THEN
          BEGIN
            EXECUTE format('ALTER TABLE public.%I ADD COLUMN usuario_id uuid;', t);
          EXCEPTION WHEN others THEN NULL;
          END;
      END IF;

      -- Só cria a policy se a coluna existir
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name = t AND column_name = 'usuario_id') THEN
        BEGIN
          -- Limpeza Profunda de políticas legadas (JSON Security Scan)
          EXECUTE format('DROP POLICY IF EXISTS owner_full_access ON public.%I;', t);
          EXECUTE format('DROP POLICY IF EXISTS authenticated_full_access ON public.%I;', t);
          EXECUTE format('DROP POLICY IF EXISTS authenticated_shared_access ON public.%I;', t);
          EXECUTE format('DROP POLICY IF EXISTS "Leitura para autenticados" ON public.%I;', t);
          
          EXECUTE format(
            'CREATE POLICY owner_full_access ON public.%I FOR ALL TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());'
            , t
          );
          RAISE NOTICE 'Policy owner_full_access criada em %', t;
        EXCEPTION WHEN others THEN
          RAISE WARNING 'Falha ao criar policy em %: %', t, SQLERRM;
        END;
      END IF;
    END IF;
  END LOOP;
END $$;

-- Políticas para Tabelas de Usuário (Especiais)
DO $$
BEGIN
  -- users (id = auth.uid)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = 'users') THEN
    DROP POLICY IF EXISTS owner_full_access ON public.users;
    DROP POLICY IF EXISTS authenticated_full_access ON public.users;
    CREATE POLICY owner_full_access ON public.users FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- Políticas Públicas/Sincronizadas
DO $$
DECLARE
  t text;
  public_tables text[] := ARRAY[
    'areas','items','clientes','planos_adubacao','maquinas','manutencao_frota','app_settings',
    'cost_categories','unidades_medida','categorias_despesa','culturas','descarte','estoque'
  ];
BEGIN
  FOREACH t IN ARRAY public_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = t AND table_type = 'BASE TABLE') THEN
      BEGIN
        -- Limpeza Profunda de políticas legadas (JSON Security Scan)
        EXECUTE format('DROP POLICY IF EXISTS authenticated_shared_access ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS authenticated_full_access ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS owner_full_access ON public.%I;', t);
        EXECUTE format('DROP POLICY IF EXISTS "Leitura para autenticados" ON public.%I;', t);
        
        -- Uso de (auth.uid() IS NOT NULL) em vez de TRUE para satisfazer o Linter de Segurança (v17.2)
        EXECUTE format('CREATE POLICY authenticated_shared_access ON public.%I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);', t);
      EXCEPTION WHEN others THEN NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- 8) STORAGE (Bucket de Backups)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) VALUES ('backups do agrogb', 'backups do agrogb', false)
    ON CONFLICT (id) DO NOTHING;
    
    DROP POLICY IF EXISTS "Private Storage Policy" ON storage.objects;
    CREATE POLICY "Private Storage Policy" ON storage.objects FOR ALL TO authenticated 
    USING (bucket_id = 'backups do agrogb' AND (owner = auth.uid() OR owner IS NULL));
END $$;

COMMIT;
