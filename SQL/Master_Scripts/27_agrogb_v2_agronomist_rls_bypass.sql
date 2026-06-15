-- ============================================================================== 
-- AGROGB - MASTER SCRIPT 27: V2 RLS AGRONOMIST BYPASS
-- Atualiza as políticas MultiTenant das tabelas V2 para permitir que Agrônomos
-- com vínculo ativo (agronomist_client_links) possam visualizar e editar os dados
-- operacionais dos seus clientes.
-- ==============================================================================

DO $$
DECLARE
  t text;
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
        'v2_custos_agricolas', 'v2_maquinas', 'v2_tarefas'
      )
  LOOP
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id'
    ) THEN
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'MultiTenant Isolation', t);
        EXECUTE format(
          'CREATE POLICY "MultiTenant Isolation" ON public.%I FOR ALL TO authenticated USING (
            EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = %I.user_id
                AND p.organization_id = (((select auth.jwt())->> ''organization_id''))::uuid
            )
            OR public.is_admin()
            OR (
              ((select auth.jwt())->> ''user_role'') = ''AGRONOMO''
              AND EXISTS (
                SELECT 1 FROM public.agronomist_client_links l
                WHERE l.client_id = %I.user_id
                  AND l.agronomist_id = auth.uid()
                  AND l.status = ''ACTIVE''
              )
            )
          ) WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.profiles p
              WHERE p.id = %I.user_id
                AND p.organization_id = (((select auth.jwt())->> ''organization_id''))::uuid
            )
            OR public.is_admin()
            OR (
              ((select auth.jwt())->> ''user_role'') = ''AGRONOMO''
              AND EXISTS (
                SELECT 1 FROM public.agronomist_client_links l
                WHERE l.client_id = %I.user_id
                  AND l.agronomist_id = auth.uid()
                  AND l.status = ''ACTIVE''
              )
            )
          );',
          t, t, t, t, t
        );
    END IF;
  END LOOP;
END $$;
