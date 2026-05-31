-- 03_inventory_stock.sql
-- AGROGB DIAMOND PRO - Módulo 03: Inventário e Estoque (Produtos, Insumos, Sementes)

-- 1. CADASTRO DE PRODUTOS/INSUMOS/SERVIÇOS
CREATE TABLE IF NOT EXISTS public.cadastro (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT 'Novo Produto';
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS unidade TEXT DEFAULT 'UN';
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'INSUMO'; -- (PRODUTO, INSUMO, SERVIÇO, SEMENTE)
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS estocavel BOOLEAN DEFAULT true;
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS vendavel BOOLEAN DEFAULT true;
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS preco_venda REAL DEFAULT 0;
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();

-- 2. SALDO EM ESTOQUE (Realtime)
CREATE TABLE IF NOT EXISTS public.estoque (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS produto_uuid UUID REFERENCES public.cadastro(uuid);
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS produto TEXT; -- Backup por nome para sync legado
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS quantidade REAL DEFAULT 0;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();

-- 3. MOVIMENTAÇÕES DE ESTOQUE (Log Completo)
CREATE TABLE IF NOT EXISTS public.v2_movimentacoes_estoque (id UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.v2_movimentacoes_estoque ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.v2_movimentacoes_estoque ADD COLUMN IF NOT EXISTS produto_uuid UUID REFERENCES public.cadastro(uuid);
ALTER TABLE public.v2_movimentacoes_estoque ADD COLUMN IF NOT EXISTS tipo TEXT; -- (ENTRADA, SAÍDA, AJUSTE)
ALTER TABLE public.v2_movimentacoes_estoque ADD COLUMN IF NOT EXISTS quantidade REAL;
ALTER TABLE public.v2_movimentacoes_estoque ADD COLUMN IF NOT EXISTS origem TEXT; -- (VENDA, COMPRA, PLANTIO, ADUBAÇÃO)
ALTER TABLE public.v2_movimentacoes_estoque ADD COLUMN IF NOT EXISTS data TIMESTAMPTZ DEFAULT now();

-- RLS
ALTER TABLE public.cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_movimentacoes_estoque ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own inventory" ON public.cadastro;
DROP POLICY IF EXISTS "Manage own stock" ON public.estoque;
DROP POLICY IF EXISTS "Manage own movements" ON public.v2_movimentacoes_estoque;

CREATE POLICY "Manage own inventory" ON public.cadastro FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own stock" ON public.estoque FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own movements" ON public.v2_movimentacoes_estoque FOR ALL USING (auth.uid() = user_id);
