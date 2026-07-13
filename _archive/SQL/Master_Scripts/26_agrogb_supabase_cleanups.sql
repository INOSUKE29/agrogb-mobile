-- ==============================================================================
-- AGROGB - MASTER SCRIPT 26: SUPABASE SECURITY CLEANUPS
-- Script limpo e seguro extraído das recomendações do Supabase Security Advisor.
-- Todos os comandos destrutivos (DROPs, alterações perigosas de RLS) foram removidos.
-- ==============================================================================

-- 1. PROTEGER A MATERIALIZED VIEW DO AGROMARKETING
-- Impede que usuários anônimos ou autenticados consigam baixar os dados
-- resumidos diretamente pela API, forçando o acesso via funções seguras se necessário.
REVOKE ALL ON TABLE public.mv_dashboard_agromarketing FROM anon, authenticated;

-- 2. BLINDAR FUNÇÕES "SECURITY DEFINER" (IMPEDIR EXECUÇÃO PÚBLICA DIRETA)
-- Por padrão, funções criadas no PostgreSQL ficam disponíveis ao "PUBLIC".
-- Para funções de alto privilégio (SECURITY DEFINER), removemos esse acesso genérico.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.mobile_sync_process_pending(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mobile_sync_process_pending(integer) FROM anon, authenticated;

-- 3. AJUSTAR SEARCH PATH PARA PREVENIR INJEÇÃO EM FUNÇÕES ELEVADAS
-- Melhora a segurança forçando a função a especificar os schemas (ex: public.profiles).
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Se você tiver essas funções auxiliares de JWT, protege o search path delas também:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'jwt_org') THEN
    ALTER FUNCTION public.jwt_org() SET search_path = '';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'jwt_role') THEN
    ALTER FUNCTION public.jwt_role() SET search_path = '';
  END IF;
END $$;

-- 4. AJUSTAR POLÍTICA DO BUCKET DE ARMAZENAMENTO (AVATARS)
-- Garante que a listagem de arquivos de avatares só retorne nomes válidos de arquivos.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'objects'
      AND schemaname = 'storage'
      AND cmd = 'SELECT'
      AND qual = '(bucket_id = ''avatars''::text)'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects;', pol.policyname);
    EXECUTE format(
      'CREATE POLICY %I ON storage.objects FOR SELECT
       USING (bucket_id = ''avatars''::text AND name IS NOT NULL);',
      pol.policyname
    );
  END LOOP;
END $$;

-- NOTA DE SEGURANÇA (O QUE FOI REMOVIDO DESTE SCRIPT):
-- 1. ALTER EXTENSION pg_partman SET SCHEMA -> Removido (dava erro 0A000).
-- 2. CREATE POLICY "Always True" -> Removido. Nós já criamos RLS Multi-Tenant no Script 25 e 04.
-- 3. DROP FUNCTION / DROP TABLE CASCADE -> Removidos. Eram altamente destrutivos para a arquitetura atual.
