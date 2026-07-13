-- ==============================================================================
-- AGROGB - PATCH SCRIPT 04_A: CORREÇÃO RLS PROFILES
-- Resolve o problema de tela vazia na "Gestão de Usuários"
-- ==============================================================================

-- 1. Remove a política antiga que estava bloqueando a leitura
DROP POLICY IF EXISTS "Profiles - Leitura (prio ou ADMIN)" ON public.profiles;

-- 2. Cria a nova política permitindo leitura geral para usuários logados
CREATE POLICY "Profiles - Leitura (prio ou ADMIN)"
ON public.profiles
FOR SELECT
USING (
  auth.role() = 'authenticated'
);
