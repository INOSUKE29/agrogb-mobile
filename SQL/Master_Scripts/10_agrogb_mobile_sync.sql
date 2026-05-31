-- ==============================================================================
-- AGROGB - MASTER SCRIPT 10: MOBILE SYNC (OFFLINE-FIRST)
-- Função: Tabela para receber eventos em fila do aplicativo móvel (Lie-Fi).
-- Compatibilidade: Mobile App (Supabase JS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.mobile_sync_events (
    id UUID PRIMARY KEY, -- O UUID gerado no SQLite local do celular
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    tipo_evento TEXT NOT NULL, -- Ex: 'CONSUMO_ESTOQUE', 'NOVA_FOTO_LAUDO'
    payload JSONB NOT NULL,
    sync_status TEXT DEFAULT 'PROCESSED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mobile_sync_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eventos - Leitura/Escrita Mobile"
    ON public.mobile_sync_events FOR ALL
    USING (
        organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    );
