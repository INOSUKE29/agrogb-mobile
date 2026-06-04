-- ============================================================================
-- SCRIPT: 13_tabela_vendas_agrogb.sql
-- OBJETIVO: Criar a tabela de Vendas e Faturamento para o módulo comercial.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.v2_vendas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    cliente_id UUID REFERENCES public.v2_clientes(id) ON DELETE SET NULL,
    cliente_nome TEXT,
    produto_id UUID REFERENCES public.v2_estoque_atual(id) ON DELETE SET NULL,
    produto_nome TEXT,
    quantidade DECIMAL NOT NULL,
    valor_unitario DECIMAL NOT NULL,
    valor_total DECIMAL NOT NULL,
    data_venda DATE,
    observacao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissões
ALTER TABLE public.v2_vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total as vendas" ON public.v2_vendas
    FOR ALL USING (true) WITH CHECK (true);
