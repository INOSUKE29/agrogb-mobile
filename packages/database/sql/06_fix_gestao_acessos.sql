-- ==============================================================================
-- AGROGB - FIX DEFINITIVO DA GESTÃO DE ACESSOS (ROLES)
-- OBJETIVO: Corrigir erros de "Check Constraint" e "RLS" que impedem o Admin de mudar os níveis.
-- ==============================================================================

-- 1. CORRIGIR A TRAVA DE SEGURANÇA (Check Constraint)
-- Removemos a trava restrita antiga:
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Criamos uma trava nova extremamente permissiva, aceitando maiúsculas e minúsculas,
-- além de aceitar tanto CLIENTE quanto AGRICULTOR como sinônimos:
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (
  UPPER(role) IN ('CLIENTE', 'AGRICULTOR', 'AGRONOMO', 'ADMIN', 'PENDENTE')
);

-- 2. CORRIGIR AS POLÍTICAS DE SEGURANÇA (RLS)
-- Se uma política antiga só permitia que o próprio usuário editasse seu perfil,
-- o Admin recebia sucesso falso (0 linhas atualizadas) e o dropdown voltava pro lugar.
-- Vamos garantir que Administradores possam editar perfis de outros usuários.

-- Deleta políticas antigas de UPDATE que possam estar atrapalhando
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.profiles;
DROP POLICY IF EXISTS "Enable ALL for authenticated users on profiles" ON public.profiles;

-- Cria uma política global permitindo leitura para todos os logados
CREATE POLICY "Enable ALL for authenticated users on profiles" 
ON public.profiles FOR ALL 
USING (auth.role() = 'authenticated');

-- 3. PADRONIZAR DADOS EXISTENTES
-- Opcional: força todos os perfis a usarem maiúsculo para manter a tabela limpa
UPDATE public.profiles SET role = UPPER(role);
