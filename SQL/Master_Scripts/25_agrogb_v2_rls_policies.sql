-- ============================================================================== 
-- AGROGB - MASTER SCRIPT 25: V2 RLS POLICIES (MULTI-TENANT)
-- Substitui as "Auto Policies" do Supabase por políticas reais baseadas no 
-- organization_id injetado no JWT do usuário.
-- ==============================================================================

-- 1. LIMPEZA DAS POLÍTICAS TEMPORÁRIAS DO SUPABASE AI
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
          AND policyname LIKE 'Auto RLS authenticated ALL - %'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;


-- 2. FUNÇÃO AUXILIAR PARA APLICAR POLÍTICAS (Para tabelas que usam user_id)
-- Esta função iterará sobre todas as tabelas V2 e aplicará o Tenant Isolation
DO $$
DECLARE
  t text;
  has_user_id boolean;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'v2_analise_solo', 'v2_custos', 'v2_estoque_atual', 'v2_estoque_movimentacoes',
        'v2_fazendas', 'v2_plantios', 'v2_produtores', 'v2_recomendacoes_tecnicas', 
        'v2_sync_conflicts', 'v2_talhoes', 'v2_vendas', 'v2_culturas', 'v2_fichas_tecnicas',
        'v2_produtos', 'v2_fornecedores', 'v2_cotacoes', 'v2_categorias_despesa', 
        'v2_custos_agricolas', 'v2_maquinas', 'v2_tarefas',
        'orders', 'subscriptions'
      )
  LOOP
    -- Verifica se a tabela possui a coluna user_id
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id'
    ) INTO has_user_id;

    IF has_user_id THEN
        -- Se tiver user_id, isola baseado na organização do usuário dono do registro
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'MultiTenant Isolation', t);
        EXECUTE format(
          'CREATE POLICY "MultiTenant Isolation" ON public.%I FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = %I.user_id
                AND p.organization_id = (((select auth.jwt())->> ''organization_id''))::uuid
            )
            OR public.is_admin()
          ) WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = %I.user_id
                AND p.organization_id = (((select auth.jwt())->> ''organization_id''))::uuid
            )
            OR public.is_admin()
          );',
          t, t, t
        );
    ELSE
        -- Se a tabela NÃO tiver user_id, usa apenas acesso administrativo como fallback provisório de segurança
        -- As tabelas que se encaixarem aqui precisam de foreign keys revisadas no futuro (ex: v2_analise_solo tem talhao_id).
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Admin Only Isolation', t);
        EXECUTE format(
          'CREATE POLICY "Admin Only Isolation" ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());',
          t
        );
    END IF;
    
    -- Garante que RLS está habilitado
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
  END LOOP;
END $$;


-- 3. AJUSTES ESPECÍFICOS PARA TIMESCALEDB / SENSORES E PARTIÇÕES
-- Sensores geralmente são escritos por backend (Service Role - Bypass RLS),
-- mas a leitura deve ser permitida para todos do Tenant correspondente se houver farm_id ou device_id.
-- Como sensor_data_default usa dados brutos, podemos deixar liberado para leitura autenticada ou Admin.
DO $$
DECLARE
  row record;
BEGIN
  FOR row IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND (tablename LIKE 'sensor_data_p%' OR tablename IN ('sensor_data_default', 'part_config', 'part_config_sub'))
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', row.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Leitura Sensores Autenticada" ON public.%I;', row.tablename);
    EXECUTE format('CREATE POLICY "Leitura Sensores Autenticada" ON public.%I FOR SELECT TO authenticated USING (true);', row.tablename);
  END LOOP;
END $$;
