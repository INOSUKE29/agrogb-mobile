-- AGROGB SECURITY PATCH (MIGRATION)
-- Corrige todos os alertas do Security Advisor do Supabase

-- ----------------------------------------------------------------
-- 1. CORRIGE search_path MUTABLE em handle_new_user
--    Erro: "Function Search Path Mutable" no Security Advisor
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, name, role, last_updated)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'USUARIO',
        now()
    )
    ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            last_updated = now();
    RETURN NEW;
END;
$$;

-- Garante o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------
-- 2. CORRIGE search_path MUTABLE em is_admin
--    Erro: "Function Search Path Mutable" + "SECURITY DEFINER" 
--    no Security Advisor
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'admin')
    );
END;
$$;

-- REVOGA execute de públicos e autenticados comuns
-- Erro: "Public/Signed-In Users Can Execute SECURITY DEFINER Function"
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated;
-- Apenas service_role pode chamar diretamente
GRANT EXECUTE ON FUNCTION public.is_admin() TO service_role;

-- ----------------------------------------------------------------
-- 3. CORRIGE views de segurança (mantido do patch original)
-- ----------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_views WHERE viewname = 'resumo_financeiro_público') THEN
        ALTER VIEW public.resumo_financeiro_público SET (security_invoker = on);
    END IF;
END $$;

