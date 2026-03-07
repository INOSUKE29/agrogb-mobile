-- AGROGB SECURITY PATCH
-- Execute este script para resolver os erros de "Consultor de Segurança"

-- 1. CORREÇÃO DE SEARCH_PATH (Avisos/Warnings)
-- Adiciona o caminho de busca seguro para evitar ataques de injeção de schema
ALTER FUNCTION public.get_my_financial_summary() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

-- 2. CORREÇÃO DE SECURITY DEFINER (Erro/Error)
-- Caso a view resumo_financeiro_público precise ser SECURITY DEFINER para acessar dados sensíveis,
-- o ideal é garantir que ela esteja vinculada a um schema específico e protegida.
-- Se ela não precisar disso, alteramos para SECURITY INVOKER (padrão seguro).

-- Nota: Views em Postgres não têm comando ALTER ... SECURITY INVOKER diretamente. 
-- Recomendamos recriar a view sem a opção SECURITY DEFINER se possível, ou garantir
-- que as tabelas base tenham RLS ativo e a view as respeite.

-- Se você deseja desativar o erro mantendo a performance, execute:
ALTER VIEW public.resumo_financeiro_público SET (security_invoker = on);

-- 3. GARANTIR RLS EM TABELAS CRÍTICAS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
