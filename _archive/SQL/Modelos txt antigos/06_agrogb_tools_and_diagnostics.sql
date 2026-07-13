-- ==============================================================================
-- AGROGB - MASTER SCRIPT 06: DIAGNÓSTICO E MANUTENÇÃO (TOOLS)
-- Função: Ferramentas úteis para o Administrador resolver bugs e forçar ações.
-- Compatibilidade: Uso Exclusivo no SQL Editor do Supabase (Admin)
-- ==============================================================================

-- ==============================================================================
-- FERRAMENTA A: FORÇAR CONFIRMAÇÃO DE E-MAIL
-- Use isto se um usuário tentar logar e der o erro "Email not confirmed".
-- Substitua 'bruno@agrogb.com' pelo e-mail desejado.
-- ==============================================================================
-- UPDATE auth.users 
-- SET email_confirmed_at = now() 
-- WHERE email ILIKE 'bruno@agrogb.com';


-- ==============================================================================
-- FERRAMENTA B: DIAGNÓSTICO DE GATILHO DE CADASTRO (O CAÇA-BUGS)
-- Se o erro "Database error saving new user" voltar a aparecer no Desktop, 
-- selecione o bloco abaixo e aperte RUN. Ele vai simular um cadastro fantasma
-- e revelar a verdadeira mensagem de erro do Postgres (a que fica escondida).
-- ==============================================================================
/*
DO $$
DECLARE
    test_id UUID := gen_random_uuid();
    err_msg TEXT;
BEGIN
    INSERT INTO auth.users (instance_id, id, aud, role, email)
    VALUES (
      '00000000-0000-0000-0000-000000000000', 
      test_id, 
      'authenticated', 
      'authenticated', 
      'bug_hunter@agrogb.com'
    );
    
    RAISE NOTICE '✅ SUCESSO ABSOLUTO! O gatilho funcionou perfeitamente. O erro não está no banco.';
    DELETE FROM auth.users WHERE id = test_id;
EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS err_msg = MESSAGE_TEXT;
    RAISE EXCEPTION '❌ ERRO ENCONTRADO NO GATILHO: %', err_msg;
END;
$$;
*/
