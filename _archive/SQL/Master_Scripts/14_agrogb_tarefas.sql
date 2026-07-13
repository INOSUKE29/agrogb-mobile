-- ==============================================================================
-- 🚀 SCRIPT: SISTEMA DE TAREFAS E GESTÃO DE VISITAS
-- Cria a estrutura para agendamentos, delegação de tarefas e visitas técnicas.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.v2_tarefas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    tipo TEXT NOT NULL DEFAULT 'OPERACAO_CAMPO', -- VISITA_TECNICA, OPERACAO_CAMPO, MANUTENCAO, OUTROS
    status TEXT NOT NULL DEFAULT 'PENDENTE', -- PENDENTE, EM_ANDAMENTO, CONCLUIDO, CANCELADO
    prioridade TEXT NOT NULL DEFAULT 'MEDIA', -- BAIXA, MEDIA, ALTA, URGENTE
    data_agendada DATE,
    talhao_id UUID REFERENCES public.talhoes(id) ON DELETE SET NULL,
    fazenda_id UUID REFERENCES public.propriedades(id) ON DELETE CASCADE,
    
    -- Quem mandou fazer
    criador_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Quem tem que fazer (pode ser null se for "para qualquer um na fazenda")
    responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Sincronização e Auditoria
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status TEXT DEFAULT 'synced'
);

-- ==============================================================================
-- 🔒 POLÍTICAS DE SEGURANÇA (RLS)
-- ==============================================================================

ALTER TABLE public.v2_tarefas ENABLE ROW LEVEL SECURITY;

-- 1. Admin pode ver tudo
CREATE POLICY "Admin All - Tarefas" ON public.v2_tarefas FOR ALL USING (public.is_admin());

-- 2. Usuário logado pode ver as tarefas se:
--    a) Ele for o criador (ex: Agrônomo que delegou).
--    b) Ele for o responsável (ex: Tratorista que vai executar).
--    c) Ele for o dono da fazenda vinculada (Produtor vê tudo da sua fazenda).
CREATE POLICY "Acesso Tarefas (Criador/Responsável/Dono)" ON public.v2_tarefas FOR SELECT USING (
    criador_id = auth.uid() OR 
    responsavel_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.propriedades p WHERE p.id = fazenda_id AND p.cliente_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.propriedades p WHERE p.id = fazenda_id AND public.is_agronomo_of_client(p.cliente_id))
);

-- 3. Inserção
CREATE POLICY "Inserir Tarefas" ON public.v2_tarefas FOR INSERT WITH CHECK (
    -- O criador deve ser o próprio usuário logado
    criador_id = auth.uid()
);

-- 4. Atualização
CREATE POLICY "Atualizar Tarefas" ON public.v2_tarefas FOR UPDATE USING (
    criador_id = auth.uid() OR 
    responsavel_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.propriedades p WHERE p.id = fazenda_id AND p.cliente_id = auth.uid())
);

-- 5. Deleção (Apenas o criador ou o dono da fazenda podem excluir)
CREATE POLICY "Deletar Tarefas" ON public.v2_tarefas FOR DELETE USING (
    criador_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.propriedades p WHERE p.id = fazenda_id AND p.cliente_id = auth.uid())
);
