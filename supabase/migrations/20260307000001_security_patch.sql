-- AGROGB SECURITY PATCH (MIGRATION)
-- 1. CORREÇÃO DE SEARCH_PATH
ALTER FUNCTION IF EXISTS get_my_financial_summary() SET search_path = public, pg_temp;
ALTER FUNCTION IF EXISTS handle_new_user() SET search_path = public, pg_temp;

-- 2. CORREÇÃO DE SEGURANÇA EM VIEWS
-- Garante que views usem as permissões do usuário que as consulta (INVOKER)
-- Isso resolve o erro de "Security Definer" no Dashboard do Supabase.
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_views WHERE viewname = 'resumo_financeiro_público') THEN
        ALTER VIEW public.resumo_financeiro_público SET (security_invoker = on);
    END IF;
END $$;
