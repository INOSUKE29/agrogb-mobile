-- 07_compras_fornecedores.sql
-- AGROGB DIAMOND PRO - Módulo 07: Gestão de Compras e Fornecedores

CREATE TABLE IF NOT EXISTS public.v2_fornecedores (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    telefone TEXT,
    email TEXT,
    categoria TEXT DEFAULT 'GERAL',
    status TEXT DEFAULT 'ATIVO',
    rating INT DEFAULT 5,
    last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.v2_cotacoes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    fornecedor_id UUID REFERENCES public.v2_fornecedores(uuid) ON DELETE CASCADE,
    item_nome TEXT NOT NULL,
    quantidade REAL NOT NULL,
    unidade TEXT DEFAULT 'UN',
    valor_unitario REAL NOT NULL,
    valor_total REAL GENERATED ALWAYS AS (quantidade * valor_unitario) STORED,
    status TEXT DEFAULT 'ABERTA' CHECK (status IN ('ABERTA', 'APROVADA', 'REJEITADA')),
    data_cotacao TIMESTAMPTZ DEFAULT now(),
    last_updated TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.v2_fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_cotacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own suppliers" ON public.v2_fornecedores;
DROP POLICY IF EXISTS "Manage own quotes" ON public.v2_cotacoes;

CREATE POLICY "Manage own suppliers" ON public.v2_fornecedores FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own quotes" ON public.v2_cotacoes FOR ALL USING (auth.uid() = user_id);
