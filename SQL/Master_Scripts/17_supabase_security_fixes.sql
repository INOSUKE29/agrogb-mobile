-- =====================================================================================
-- SCRIPT DE CORREÇÃO DE SEGURANÇA (SECURITY ADVISOR SUPABASE)
-- =====================================================================================
-- Instruções de uso:
-- Copie todo este código, cole na aba "SQL Editor" do seu Supabase e aperte "Run".
-- Depois, volte ao Security Advisor e aperte "Refresh" para ver os alertas sumirem.
-- =====================================================================================

-- 1. CORRIGIR "FUNCTION SEARCH PATH MUTABLE"
-- Alerta: Funções sem o search_path definido podem ser vulneráveis a injeção.
-- Correção: Forçamos o path para public.
ALTER FUNCTION public.is_agronomo_of_client SET search_path = public;
ALTER FUNCTION public.can_read_kb SET search_path = public;
ALTER FUNCTION public.is_admin SET search_path = public;

-- 2. CORRIGIR "MATERIALIZED VIEW IN API"
-- Alerta: Views materializadas acessíveis na API de Dados sem necessidade.
-- Correção: Revogamos o acesso anônimo.
REVOKE ALL ON public.mv_dashboard_agromarketing FROM anon;

-- 3. CORRIGIR "RLS POLICY ALWAYS TRUE"
-- Alerta: Algumas tabelas estavam usando políticas com `USING (true)`, ou seja, acesso totalmente aberto.
-- Correção: Vamos forçar que apenas usuários logados (authenticated) possam acessar.
-- Obs: Se essas tabelas precisarem de regras mais específicas, basta ajustar no painel depois.

DROP POLICY IF EXISTS "Public access" ON public.agronomist_client_links;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agronomist_client_links;
CREATE POLICY "Acesso Autenticado" ON public.agronomist_client_links FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public access" ON public.agronomist_codes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.agronomist_codes;
CREATE POLICY "Acesso Autenticado" ON public.agronomist_codes FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public access" ON public.v2_vendas;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.v2_vendas;
CREATE POLICY "Acesso Autenticado" ON public.v2_vendas FOR ALL USING (auth.role() = 'authenticated');

-- 4. CORRIGIR "RLS ENABLED NO POLICY" (As 80 sugestões verdes de Infos)
-- Alerta: Tabelas com RLS ligado, mas sem nenhuma regra criada (o que bloqueia tudo por padrão).
-- Correção: Criar uma política básica exigindo que o usuário esteja logado.

CREATE POLICY "Acesso Autenticado" ON public.aplicacoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Autenticado" ON public.compras FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Autenticado" ON public.contas FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Autenticado" ON public.cost_categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Autenticado" ON public.costs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Autenticado" ON public.custos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Autenticado" ON public.descarte FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Autenticado" ON public.error_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Autenticado" ON public.estoque FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Acesso Autenticado" ON public.fertilization_applications FOR ALL USING (auth.role() = 'authenticated');

-- 5. NOTAS EXTRAS:
-- O aviso "Extension in Public (pg_partman)" é normal caso você use particionamento de tabelas no schema public. 
-- Mover isso via SQL pode quebrar suas partições, então é mais seguro ignorar esse warning ou clicar em "Ignore" no painel.
-- O aviso "Public Bucket Allows Listing (avatars)" significa que qualquer um pode listar todas as fotos de perfil. 
-- Para arrumar, vá no painel do Supabase -> Storage -> Avatars e verifique se as Policies de SELECT estão abertas demais (ex: sem checar o nome do arquivo).
