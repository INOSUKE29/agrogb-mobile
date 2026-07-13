-- 06_tarefas_kanban.sql
-- AGROGB DIAMOND PRO - Módulo 06: Gestão de Tarefas (Kanban)

CREATE TABLE IF NOT EXISTS public.tarefas (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'A FAZER' CHECK (status IN ('A FAZER', 'EM ANDAMENTO', 'CONCLUÍDO')),
    prioridade TEXT DEFAULT 'MÉDIA' CHECK (prioridade IN ('BAIXA', 'MÉDIA', 'ALTA')),
    data_vencimento TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage own tasks" ON public.tarefas;
CREATE POLICY "Manage own tasks" ON public.tarefas FOR ALL USING (auth.uid() = user_id);
