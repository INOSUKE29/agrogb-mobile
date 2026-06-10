-- Tabela de Ficha Técnica (Bill of Materials) para conversão e consumo na colheita
CREATE TABLE IF NOT EXISTS public.v2_fichas_tecnicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_final_id UUID REFERENCES public.v2_produtos(id) ON DELETE CASCADE,
    insumo_id UUID REFERENCES public.v2_produtos(id) ON DELETE RESTRICT,
    quantidade NUMERIC(10,3) NOT NULL,
    unidade VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.v2_fichas_tecnicas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Usuários autenticados podem ver fichas" 
ON public.v2_fichas_tecnicas FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem inserir fichas" 
ON public.v2_fichas_tecnicas FOR INSERT 
TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar fichas" 
ON public.v2_fichas_tecnicas FOR UPDATE 
TO authenticated USING (true);

CREATE POLICY "Usuários autenticados podem deletar fichas" 
ON public.v2_fichas_tecnicas FOR DELETE 
TO authenticated USING (true);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_fichas_tecnicas_produto_final ON public.v2_fichas_tecnicas(produto_final_id);
