-- ==============================================================================
-- AGROGB - MASTER SCRIPT 05: SEED DATA & ADMIN
-- Função: Preencher o banco com dados iniciais necessários (Planos, Permissões).
-- Compatibilidade: Mobile e Desktop
-- ==============================================================================

-- 1. INSERIR PLANOS DE ASSINATURA BASE (Se ainda não existirem)
-- Necessário caso crie a tabela subscription_plans no futuro ou use a default.
-- Como ela não está no Core para simplificar, se for adicionada, os dados entram aqui.
-- INSERT INTO public.subscription_plans (name, price, billing_cycle)
-- VALUES ('FREE', 0, 'monthly'), ('PRO', 99.90, 'monthly') ON CONFLICT DO NOTHING;

-- 2. GARANTIR ACESSO ADMIN PARA O BRUNO
-- Esse bloco varre o banco e promove o usuário bruno@agrogb.com para ADMIN automaticamente.
DO $$
BEGIN
    UPDATE public.profiles 
    SET role = 'ADMIN', status = 'active'
    WHERE email ILIKE 'bruno@agrogb.com';
    
    -- Confirma o email no sistema de autenticação para pular a etapa de caixa de entrada
    UPDATE auth.users 
    SET email_confirmed_at = now() 
    WHERE email ILIKE 'bruno@agrogb.com';
END $$;
