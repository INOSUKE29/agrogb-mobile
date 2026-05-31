-- 04_production.sql
-- AGROGB DIAMOND PRO - Módulo 04: Produção (Plantio, Colheita, Adubação Inteligente)

-- 1. PLANTIO (Ciclos de Cultura)
CREATE TABLE IF NOT EXISTS public.plantio (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.plantio ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.plantio ADD COLUMN IF NOT EXISTS cultura TEXT NOT NULL;
ALTER TABLE public.plantio ADD COLUMN IF NOT EXISTS quantidade_pes INTEGER DEFAULT 0;
ALTER TABLE public.plantio ADD COLUMN IF NOT EXISTS tipo_plantio TEXT; -- Geralmente Area ID ou Nome
ALTER TABLE public.plantio ADD COLUMN IF NOT EXISTS data TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.plantio ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.plantio ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();

-- 2. PLANOS DE ADUBAÇÃO (Receitas e Aplicações)
CREATE TABLE IF NOT EXISTS public.planos_adubacao (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS nome_plano TEXT NOT NULL;
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS cultura TEXT;
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS tipo_aplicacao TEXT;
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS area_local TEXT;
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PLANEJADO'; -- (PLANEJADO, CONCLUIDO)
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS data_criacao TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS data_aplicacao TIMESTAMPTZ;
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();

-- 3. ITENS DA ADUBAÇÃO (Vínculo Pro com Estoque)
CREATE TABLE IF NOT EXISTS public.production_fertilization_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.production_fertilization_items ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.production_fertilization_items ADD COLUMN IF NOT EXISTS plano_uuid UUID REFERENCES public.planos_adubacao(uuid) ON DELETE CASCADE;
ALTER TABLE public.production_fertilization_items ADD COLUMN IF NOT EXISTS produto_id TEXT;
ALTER TABLE public.production_fertilization_items ADD COLUMN IF NOT EXISTS quantidade REAL;
ALTER TABLE public.production_fertilization_items ADD COLUMN IF NOT EXISTS unidade TEXT;
ALTER TABLE public.production_fertilization_items ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT now();

-- 4. COLHEITAS (Resultados Finais)
CREATE TABLE IF NOT EXISTS public.v2_colheitas (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.v2_colheitas ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.v2_colheitas ADD COLUMN IF NOT EXISTS plantio_id UUID REFERENCES public.plantio(uuid);
ALTER TABLE public.v2_colheitas ADD COLUMN IF NOT EXISTS data_colheita TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.v2_colheitas ADD COLUMN IF NOT EXISTS quantidade_total REAL DEFAULT 0;
ALTER TABLE public.v2_colheitas ADD COLUMN IF NOT EXISTS unidade TEXT DEFAULT 'KG';
ALTER TABLE public.v2_colheitas ADD COLUMN IF NOT EXISTS observacao TEXT;

-- RLS
ALTER TABLE public.plantio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_adubacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_fertilization_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_colheitas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own production" ON public.plantio;
DROP POLICY IF EXISTS "Manage own plans" ON public.planos_adubacao;
DROP POLICY IF EXISTS "Manage own plan items" ON public.production_fertilization_items;
DROP POLICY IF EXISTS "Manage own harvests" ON public.v2_colheitas;

CREATE POLICY "Manage own production" ON public.plantio FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own plans" ON public.planos_adubacao FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own plan items" ON public.production_fertilization_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own harvests" ON public.v2_colheitas FOR ALL USING (auth.uid() = user_id);
