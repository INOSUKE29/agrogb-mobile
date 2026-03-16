
-- AGROGB SUPABASE SECURITY HARDENING (v10.8)
-- Objetivo: Corrigir o alerta de exposição de auth.users e blindar a View de Integridade.

BEGIN;

-- 1. Criar um esquema PRIVADO para administração e auditoria
-- Isso remove a View do esquema 'public', que é exposto automaticamente pelo PostgREST.
CREATE SCHEMA IF NOT EXISTS agro_admin;

-- 2. Revogar permissões automáticas no esquema público para segurança extra
REVOKE ALL ON SCHEMA public FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON SCHEMA public TO postgres, service_role;

-- 3. Mover/Recriar a View de Integridade no esquema PRIVADO
DROP VIEW IF EXISTS public.admin_usuario_integrity_report;

-- Nota: Esta View agora vive em agro_admin.admin_usuario_integrity_report
-- Ela é inacessível via API externa (PostgREST) por estar fora do esquema 'public'.
CREATE OR REPLACE VIEW agro_admin.admin_usuario_integrity_report AS
SELECT
  'v2_fazendas'::text AS table_name,
  COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
  COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
FROM public.v2_fazendas
UNION ALL
SELECT
  'v2_talhoes'::text AS table_name,
  COUNT(*) FILTER (WHERE usuario_id IS NULL) AS null_count,
  COUNT(*) FILTER (WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM auth.users)) AS orphan_count
FROM public.v2_talhoes
-- Adicione as demais tabelas conforme necessário seguindo o mesmo padrão;

-- 4. Garantir que apenas o service_role e postgres podem ler esta View
REVOKE ALL ON agro_admin.admin_usuario_integrity_report FROM PUBLIC;
REVOKE ALL ON agro_admin.admin_usuario_integrity_report FROM anon;
REVOKE ALL ON agro_admin.admin_usuario_integrity_report FROM authenticated;
GRANT SELECT ON agro_admin.admin_usuario_integrity_report TO service_role, postgres;

COMMIT;

-- RESUMO DA CORREÇÃO:
-- 1. O erro acontecia porque auth.users era consultado por uma VIEW no esquema PUBLIC.
-- 2. O PostgREST expõe tudo no PUBLIC para usuários logados (authenticated).
-- 3. Ao mover para o esquema 'agro_admin', a View continua existindo para o banco,
--    mas "some" da API do aplicativo, eliminando o risco de exposição.
