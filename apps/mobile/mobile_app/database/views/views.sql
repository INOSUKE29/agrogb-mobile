-- database/views/all_views.sql
-- AGROGB DIAMOND PRO - Camada de BI (Views) V10.5 📊
SET search_path TO public;

DO $$ 
DECLARE 
    v_name TEXT;
    views_to_recreate TEXT[] := ARRAY['view_financeiro_resumo', 'view_estoque_critico', 'view_culturas_resumo'];
BEGIN
    -- Limpeza total com CASCADE para remover metadados antigos (como o erro de nomes de coluna)
    FOREACH v_name IN ARRAY views_to_recreate LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', v_name);
    END LOOP;

    -- Recriação com SECURITY INVOKER EXPLICITO (Ganha do robô do Supabase!)
    
    -- View 1: Financeiro
    EXECUTE 'CREATE VIEW public.view_financeiro_resumo WITH (security_invoker = true) AS
    SELECT 
        v.user_id,
        COALESCE(SUM(v.valor), 0) AS total_vendas,
        COALESCE(c.total_custos, 0) AS total_custos,
        COALESCE(SUM(v.valor), 0) - COALESCE(c.total_custos, 0) AS lucro_liquido
    FROM public.vendas v
    LEFT JOIN (
        SELECT user_id, SUM(valor_total) AS total_custos 
        FROM public.custos GROUP BY user_id
    ) c ON c.user_id = v.user_id
    GROUP BY v.user_id, c.total_custos';

    -- View 2: Estoque
    EXECUTE 'CREATE VIEW public.view_estoque_critico WITH (security_invoker = true) AS
    SELECT 
        e.user_id, 
        c.nome AS produto, 
        e.quantidade, 
        c.unidade
    FROM public.estoque e
    JOIN public.cadastro c ON e.produto_uuid = c.uuid
    WHERE e.quantidade <= 0';

    -- View 3: Culturas
    EXECUTE 'CREATE VIEW public.view_culturas_resumo WITH (security_invoker = true) AS
    SELECT 
        user_id,
        cultura,
        COUNT(*) as total_plantios,
        SUM(quantidade_pes) as total_pes
    FROM public.plantio
    GROUP BY user_id, cultura';

    RAISE NOTICE 'Views BI instanciadas com Segurança Invoker. 📊🛡️';
END $$;
