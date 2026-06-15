-- ============================================================================== 
-- AGROGB - MASTER SCRIPT 29: REAL-TIME NOTIFICATIONS
-- ==============================================================================
-- Cria a tabela de notificações e configura replicação Realtime para os apps.

CREATE TABLE IF NOT EXISTS public.v2_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'success', 'error', 'warning', 'info'
    is_read BOOLEAN DEFAULT FALSE,
    link TEXT, -- Opcional, link para redirecionar ao clicar
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.v2_notifications ENABLE ROW LEVEL SECURITY;

-- Política de RLS: O próprio usuário pode ler, inserir e atualizar suas notificações
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'v2_notifications'
      AND policyname = 'Usuários podem acessar suas próprias notificações'
  ) THEN
    CREATE POLICY "Usuários podem acessar suas próprias notificações"
    ON public.v2_notifications
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;

-- Índices para performance (consultas frequentes de "não lidas")
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_unread 
ON public.v2_notifications(user_id) WHERE is_read = FALSE;

-- Ativar Realtime para a tabela de notificações (Garante que pub/sub funcione)
ALTER PUBLICATION supabase_realtime ADD TABLE public.v2_notifications;
