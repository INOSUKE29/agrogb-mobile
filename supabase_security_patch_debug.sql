-- AGROGB SQL DEBUG & FIX
-- 1. DESCOBERTA (Rode isto primeiro para ver o nome exato se der erro)
SELECT table_schema, table_name, table_type 
FROM information_schema.tables 
WHERE table_name ILIKE '%resumo%';

-- 2. CORREÇÃO DINÂMICA
-- Este bloco tenta aplicar a correção de segurança protegendo o nome com aspas duplas
DO $$ 
BEGIN
    -- Tenta aplicar na versão com acento
    IF EXISTS (SELECT FROM pg_views WHERE viewname = 'resumo_financeiro_público') THEN
        ALTER VIEW "resumo_financeiro_público" SET (security_invoker = on);
        RAISE NOTICE 'Segurança aplicada na view: resumo_financeiro_público';
    END IF;

    -- Tenta aplicar na versão sem acento (por precaução)
    IF EXISTS (SELECT FROM pg_views WHERE viewname = 'resumo_financeiro_publico') THEN
        ALTER VIEW "resumo_financeiro_publico" SET (security_invoker = on);
        RAISE NOTICE 'Segurança aplicada na view: resumo_financeiro_publico';
    END IF;
END $$;

-- 3. PADRONIZAÇÃO (Opcional - Recomendado para evitar erros futuros no app)
-- Se quiser renomear para remover o acento (melhor prática):
-- ALTER VIEW IF EXISTS "resumo_financeiro_público" RENAME TO resumo_financeiro_publico;
