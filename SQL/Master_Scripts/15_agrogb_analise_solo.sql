-- ==============================================================================
-- 🚀 SCRIPT: HISTÓRICO DE ANÁLISE DE SOLO
-- Cria a tabela para armazenar os laudos laboratoriais de solo por talhão.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.v2_analise_solo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talhao_id UUID NOT NULL REFERENCES public.talhoes(id) ON DELETE CASCADE,
    data_analise DATE NOT NULL,
    laboratorio TEXT,
    
    -- Macros e Micronutrientes
    ph NUMERIC(5, 2),
    materia_organica NUMERIC(10, 2),
    fosforo NUMERIC(10, 2),
    potassio NUMERIC(10, 2),
    calcio NUMERIC(10, 2),
    magnesio NUMERIC(10, 2),
    aluminio NUMERIC(10, 2),
    ctc NUMERIC(10, 2),
    saturacao_bases NUMERIC(5, 2),
    
    observacoes TEXT,
    
    -- Sincronização e Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- ==============================================================================
-- 🔒 POLÍTICAS DE SEGURANÇA (RLS)
-- ==============================================================================

ALTER TABLE public.v2_analise_solo ENABLE ROW LEVEL SECURITY;

-- 1. Admin pode ver tudo
CREATE POLICY "Admin All - Analise Solo" ON public.v2_analise_solo FOR ALL USING (public.is_admin());

-- 2. Visualização: O dono da fazenda (cliente) ou o Agrônomo vinculado podem ver.
CREATE POLICY "View Analise Solo (Dono ou Agronomo)" ON public.v2_analise_solo FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.talhoes t 
        JOIN public.propriedades p ON t.propriedade_id = p.id
        WHERE t.id = public.v2_analise_solo.talhao_id AND (
            p.cliente_id = auth.uid() OR public.is_agronomo_of_client(p.cliente_id)
        )
    )
);

-- 3. Inserção: Dono ou Agrônomo
CREATE POLICY "Insert Analise Solo" ON public.v2_analise_solo FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.talhoes t 
        JOIN public.propriedades p ON t.propriedade_id = p.id
        WHERE t.id = public.v2_analise_solo.talhao_id AND (
            p.cliente_id = auth.uid() OR public.is_agronomo_of_client(p.cliente_id)
        )
    )
);

-- 4. Atualização/Deleção: Dono ou Agrônomo
CREATE POLICY "Update/Delete Analise Solo" ON public.v2_analise_solo FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.talhoes t 
        JOIN public.propriedades p ON t.propriedade_id = p.id
        WHERE t.id = public.v2_analise_solo.talhao_id AND (
            p.cliente_id = auth.uid() OR public.is_agronomo_of_client(p.cliente_id)
        )
    )
);
