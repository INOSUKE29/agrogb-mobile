-- ==============================================================================
-- 20 - AGROGB - TABELAS V2 CULTURAS (SAFRAS) E V2 PLANTIOS
-- DATA: Junho 2026
-- ==============================================================================

BEGIN;

-- Garante gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. TABELA V2_CULTURAS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.v2_culturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    variedade TEXT,
    area_ha DECIMAL(10, 3) DEFAULT 0,
    data_plantio DATE,
    status TEXT DEFAULT 'PREPARO DE SOLO',
    producao_total_kg DECIMAL(10, 3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Se a tabela já existia, adiciona user_id (e FK) caso falte
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'v2_culturas'
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.v2_culturas
        ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.v2_culturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura_v2_culturas" ON public.v2_culturas;
CREATE POLICY "Leitura_v2_culturas" ON public.v2_culturas
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Escrita_v2_culturas" ON public.v2_culturas;
CREATE POLICY "Escrita_v2_culturas" ON public.v2_culturas
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Atualizacao_v2_culturas" ON public.v2_culturas;
CREATE POLICY "Atualizacao_v2_culturas" ON public.v2_culturas
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_admin())
WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Exclusao_v2_culturas" ON public.v2_culturas;
CREATE POLICY "Exclusao_v2_culturas" ON public.v2_culturas
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_admin());


-- ------------------------------------------------------------------------------
-- 2. TABELA V2_PLANTIOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.v2_plantios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talhao_id UUID REFERENCES public.v2_talhoes(id) ON DELETE SET NULL,
    talhao_nome TEXT,
    cultura_id UUID REFERENCES public.v2_culturas(id) ON DELETE SET NULL,
    cultura_nome TEXT,
    quantidade_pes INTEGER DEFAULT 0,
    data_plantio DATE,
    previsao_colheita TEXT,
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Força a adição das colunas estruturais caso a tabela v2_plantios já existisse como um "rascunho" incompleto
ALTER TABLE public.v2_plantios ADD COLUMN IF NOT EXISTS talhao_id UUID REFERENCES public.v2_talhoes(id) ON DELETE SET NULL;
ALTER TABLE public.v2_plantios ADD COLUMN IF NOT EXISTS talhao_nome TEXT;
ALTER TABLE public.v2_plantios ADD COLUMN IF NOT EXISTS cultura_id UUID REFERENCES public.v2_culturas(id) ON DELETE SET NULL;
ALTER TABLE public.v2_plantios ADD COLUMN IF NOT EXISTS cultura_nome TEXT;
ALTER TABLE public.v2_plantios ADD COLUMN IF NOT EXISTS quantidade_pes INTEGER DEFAULT 0;
ALTER TABLE public.v2_plantios ADD COLUMN IF NOT EXISTS data_plantio DATE;
ALTER TABLE public.v2_plantios ADD COLUMN IF NOT EXISTS previsao_colheita TEXT;
ALTER TABLE public.v2_plantios ADD COLUMN IF NOT EXISTS observacao TEXT;

-- Se a tabela já existia, adiciona user_id (e FK) caso falte
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'v2_plantios'
          AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.v2_plantios
        ADD COLUMN user_id UUID NOT NULL DEFAULT auth.uid()
        REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.v2_plantios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura_v2_plantios" ON public.v2_plantios;
CREATE POLICY "Leitura_v2_plantios" ON public.v2_plantios
FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Escrita_v2_plantios" ON public.v2_plantios;
CREATE POLICY "Escrita_v2_plantios" ON public.v2_plantios
FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Atualizacao_v2_plantios" ON public.v2_plantios;
CREATE POLICY "Atualizacao_v2_plantios" ON public.v2_plantios
FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_admin())
WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "Exclusao_v2_plantios" ON public.v2_plantios;
CREATE POLICY "Exclusao_v2_plantios" ON public.v2_plantios
FOR DELETE TO authenticated
USING (user_id = (SELECT auth.uid()) OR public.is_admin());

COMMIT;
