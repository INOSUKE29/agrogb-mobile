-- database/rls/policies.sql
-- AGROGB DIAMOND PRO - Camada de Segurança Super-Resiliente V10.5.2 🛡️
SET search_path TO public;

DO $$ 
DECLARE 
    t TEXT;
    c_col TEXT;
    c_type TEXT;
    col_candidates TEXT[] := ARRAY['user_id', 'owner_id', 'id'];
    tables TEXT[] := ARRAY[
        'user_profiles', 'areas', 'clientes', 'culturas', 
        'cadastro', 'estoque', 'plantio', 'planos_adubacao', 
        'production_fertilization_items', 'vendas', 'custos', 
        'app_settings', 'v2_movimentacoes_estoque', 'itens_de_fertilizacao_publicos'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            -- Limpeza profunda
            FOR c_col IN (SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public') LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', c_col, t);
            END LOOP;

            -- DESCOBERTA INTELIGENTE DE COLUNA E TIPO
            c_col := NULL;
            SELECT column_name, data_type INTO c_col, c_type
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = t 
              AND column_name = ANY(col_candidates)
              AND (data_type = 'uuid' OR data_type = 'text')
            ORDER BY array_position(col_candidates, column_name)
            LIMIT 1;

            IF c_col IS NOT NULL THEN
                EXECUTE format('CREATE POLICY "Manage own %s" ON public.%I FOR ALL USING (auth.uid() = %I::uuid)', t, t, c_col);
                RAISE NOTICE 'Segurança aplicada em % via % (%) como UUID', t, c_col, c_type;
            ELSE
                -- CASO DE EMERGÊNCIA: Se for INTEIRO (ex: app_settings), aplica política de fallback segura (Bloqueio Total)
                -- O Senior resolve o problema técnico sem dar erro de sintaxe.
                EXECUTE format('CREATE POLICY "Manage own %s" ON public.%I FOR ALL USING (false)', t, t);
                RAISE NOTICE 'AVISO: % não tem coluna UUID/TEXT. Aplicado bloqueio preventivo.', t;
            END IF;
        END IF;
    END LOOP;
END $$;
