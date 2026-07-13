-- ============================================================================== 
-- AGROGB - MASTER SCRIPT 28: SECURITY FIXES (SUPABASE LINTER)
-- ==============================================================================
-- 1. Corrige RLS Always True em v2_fichas_tecnicas e v2_vendas
-- 2. Adiciona suporte a MultiTenant Nestas Tabelas
-- 3. Protege funções SECURITY DEFINER de injeção e acesso anônimo

-- ----------------------------------------------------------------------------
-- v2_fichas_tecnicas
-- ----------------------------------------------------------------------------
ALTER TABLE public.v2_fichas_tecnicas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

DROP POLICY IF EXISTS "Usuários autenticados podem ver fichas" ON public.v2_fichas_tecnicas;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir fichas" ON public.v2_fichas_tecnicas;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar fichas" ON public.v2_fichas_tecnicas;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar fichas" ON public.v2_fichas_tecnicas;
DROP POLICY IF EXISTS "MultiTenant Isolation" ON public.v2_fichas_tecnicas;

CREATE POLICY "MultiTenant Isolation" ON public.v2_fichas_tecnicas FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v2_fichas_tecnicas.user_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR public.is_admin()
    OR (
        ((select auth.jwt())->> 'user_role') = 'AGRONOMO'
        AND EXISTS (
        SELECT 1 FROM public.agronomist_client_links l
        WHERE l.client_id = v2_fichas_tecnicas.user_id
            AND l.agronomist_id = auth.uid()
            AND l.status = 'ACTIVE'
        )
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v2_fichas_tecnicas.user_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR public.is_admin()
    OR (
        ((select auth.jwt())->> 'user_role') = 'AGRONOMO'
        AND EXISTS (
        SELECT 1 FROM public.agronomist_client_links l
        WHERE l.client_id = v2_fichas_tecnicas.user_id
            AND l.agronomist_id = auth.uid()
            AND l.status = 'ACTIVE'
        )
    )
);

-- ----------------------------------------------------------------------------
-- v2_vendas
-- ----------------------------------------------------------------------------
ALTER TABLE public.v2_vendas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

DROP POLICY IF EXISTS "Acesso total as vendas" ON public.v2_vendas;
DROP POLICY IF EXISTS "MultiTenant Isolation" ON public.v2_vendas;

CREATE POLICY "MultiTenant Isolation" ON public.v2_vendas FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v2_vendas.user_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR public.is_admin()
    OR (
        ((select auth.jwt())->> 'user_role') = 'AGRONOMO'
        AND EXISTS (
        SELECT 1 FROM public.agronomist_client_links l
        WHERE l.client_id = v2_vendas.user_id
            AND l.agronomist_id = auth.uid()
            AND l.status = 'ACTIVE'
        )
    )
) WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v2_vendas.user_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR public.is_admin()
    OR (
        ((select auth.jwt())->> 'user_role') = 'AGRONOMO'
        AND EXISTS (
        SELECT 1 FROM public.agronomist_client_links l
        WHERE l.client_id = v2_vendas.user_id
            AND l.agronomist_id = auth.uid()
            AND l.status = 'ACTIVE'
        )
    )
);

-- ----------------------------------------------------------------------------
-- FUNÇÕES SECURITY DEFINER (Proteção contra PUBLIC e Injection)
-- ----------------------------------------------------------------------------
-- public.accept_agronomist_invite(TEXT)
REVOKE EXECUTE ON FUNCTION public.accept_agronomist_invite(TEXT) FROM PUBLIC;
ALTER FUNCTION public.accept_agronomist_invite(TEXT) SET search_path = public;

-- public.can_read_kb(public.kb_scope, uuid)
REVOKE EXECUTE ON FUNCTION public.can_read_kb(public.kb_scope, uuid) FROM PUBLIC;
ALTER FUNCTION public.can_read_kb(public.kb_scope, uuid) SET search_path = public;

-- public.is_agronomo_of_client(uuid)
REVOKE EXECUTE ON FUNCTION public.is_agronomo_of_client(uuid) FROM PUBLIC;
ALTER FUNCTION public.is_agronomo_of_client(uuid) SET search_path = public;
