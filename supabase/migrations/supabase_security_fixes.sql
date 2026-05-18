-- =======================================================
-- AgroGB Database Security Fixes & Unused Table Clean Up
-- =======================================================

-- 1. CORREÇÃO DAS FUNÇÕES DE TRICK / SEARCH PATH (Resolve Warning 1)
-- Define explicitamente o search_path para evitar injeções de esquema mutable.
ALTER FUNCTION public.trigger_set_timestamp() SET search_path = pg_catalog, public;
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public;
ALTER FUNCTION public.audit_trigger_func() SET search_path = pg_catalog, public;


-- 2. LIMPEZA DE TABELAS DO BANCO DE DADOS NÃO UTILIZADAS (Limpeza do Banco)
-- Remove tabelas antigas e legadas para deixar o banco limpo e enxuto.
DROP TABLE IF EXISTS public.cadastro CASCADE;
DROP TABLE IF EXISTS public.devices CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;


-- 3. POLÍTICAS DE SEGURANÇA (RLS) PARA AS TABELAS RESTANTES (Resolve 12 Suggestions)
-- Garante que todas as tabelas operacionais modernas possuam políticas ativas.

-- A. Notificações (notifications)
DROP POLICY IF EXISTS "Leitura de notificações próprias" ON public.notifications;
CREATE POLICY "Leitura de notificações próprias" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Inserção pelo próprio usuário ou sistema" ON public.notifications;
CREATE POLICY "Inserção pelo próprio usuário ou sistema" ON public.notifications
    FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');

-- B. Permissões de Cargo (role_permissions)
DROP POLICY IF EXISTS "Leitura livre de permissões de cargo" ON public.role_permissions;
CREATE POLICY "Leitura livre de permissões de cargo" ON public.role_permissions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admins alteram permissões de cargo" ON public.role_permissions;
CREATE POLICY "Apenas admins alteram permissões de cargo" ON public.role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );

-- C. Planos de Assinatura (subscription_plans)
DROP POLICY IF EXISTS "Leitura livre de planos de assinatura" ON public.subscription_plans;
CREATE POLICY "Leitura livre de planos de assinatura" ON public.subscription_plans
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Apenas admins alteram planos de assinatura" ON public.subscription_plans;
CREATE POLICY "Apenas admins alteram planos de assinatura" ON public.subscription_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'ADMIN'
        )
    );

-- D. Assinaturas (subscriptions)
DROP POLICY IF EXISTS "Leitura de assinaturas da organização do usuário" ON public.subscriptions;
CREATE POLICY "Leitura de assinaturas da organização do usuário" ON public.subscriptions
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- E. Eventos de Faturamento (billing_events)
DROP POLICY IF EXISTS "Leitura de histórico de faturamento próprio" ON public.billing_events;
CREATE POLICY "Leitura de histórico de faturamento próprio" ON public.billing_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.subscriptions s
            JOIN public.profiles p ON p.organization_id = s.organization_id
            WHERE s.id = billing_events.subscription_id AND p.id = auth.uid()
        )
    );
