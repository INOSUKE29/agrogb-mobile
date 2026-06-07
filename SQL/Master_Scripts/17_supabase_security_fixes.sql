-- =====================================================================================
-- SCRIPT DE CORREÇÃO DE SEGURANÇA (SECURITY ADVISOR SUPABASE)
-- Idempotente: pode ser executado múltiplas vezes sem falhar por “policy already exists”.
-- =====================================================================================

-- 1. CORRIGIR "FUNCTION SEARCH PATH MUTABLE"
ALTER FUNCTION public.is_agronomo_of_client SET search_path = public;
ALTER FUNCTION public.can_read_kb SET search_path = public;
ALTER FUNCTION public.is_admin SET search_path = public;

-- 2. CORRIGIR "MATERIALIZED VIEW IN API"
REVOKE ALL ON public.mv_dashboard_agromarketing FROM anon;

-- 3. CORRIGIR "RLS POLICY ALWAYS TRUE" (todas as policies antigas relevantes são removidas)

-- agronomist_client_links
DROP POLICY IF EXISTS "Public access" ON public.agronomist_client_links;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agronomist_client_links;
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.agronomist_client_links;

CREATE POLICY "Acesso Autenticado"
ON public.agronomist_client_links
FOR ALL
USING (auth.role() = 'authenticated');

-- agronomist_codes
DROP POLICY IF EXISTS "Public access" ON public.agronomist_codes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agronomist_codes;
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.agronomist_codes;

CREATE POLICY "Acesso Autenticado"
ON public.agronomist_codes
FOR ALL
USING (auth.role() = 'authenticated');

-- v2_vendas
DROP POLICY IF EXISTS "Public access" ON public.v2_vendas;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.v2_vendas;
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.v2_vendas;

CREATE POLICY "Acesso Autenticado"
ON public.v2_vendas
FOR ALL
USING (auth.role() = 'authenticated');

-- 4. CORRIGIR "RLS ENABLED NO POLICY" (As sugestões verdes)
-- Para ficar idempotente, removemos a policy "Acesso Autenticado" antes de recriar.

-- aplicacoes
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.aplicacoes;
CREATE POLICY "Acesso Autenticado" ON public.aplicacoes FOR ALL USING (auth.role() = 'authenticated');

-- compras
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.compras;
CREATE POLICY "Acesso Autenticado" ON public.compras FOR ALL USING (auth.role() = 'authenticated');

-- contas
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.contas;
CREATE POLICY "Acesso Autenticado" ON public.contas FOR ALL USING (auth.role() = 'authenticated');

-- cost_categories
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.cost_categories;
CREATE POLICY "Acesso Autenticado" ON public.cost_categories FOR ALL USING (auth.role() = 'authenticated');

-- costs
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.costs;
CREATE POLICY "Acesso Autenticado" ON public.costs FOR ALL USING (auth.role() = 'authenticated');

-- custos
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.custos;
CREATE POLICY "Acesso Autenticado" ON public.custos FOR ALL USING (auth.role() = 'authenticated');

-- descarte
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.descarte;
CREATE POLICY "Acesso Autenticado" ON public.descarte FOR ALL USING (auth.role() = 'authenticated');

-- error_logs
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.error_logs;
CREATE POLICY "Acesso Autenticado" ON public.error_logs FOR ALL USING (auth.role() = 'authenticated');

-- estoque
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.estoque;
CREATE POLICY "Acesso Autenticado" ON public.estoque FOR ALL USING (auth.role() = 'authenticated');

-- fertilization_applications
DROP POLICY IF EXISTS "Acesso Autenticado" ON public.fertilization_applications;
CREATE POLICY "Acesso Autenticado" ON public.fertilization_applications FOR ALL USING (auth.role() = 'authenticated');

-- 5. NOTAS EXTRAS (mantidas)
-- O aviso "Extension in Public (pg_partman)" é normal caso você use particionamento.
-- O aviso "Public Bucket Allows Listing" precisa ser tratado pelas policies do Storage.
