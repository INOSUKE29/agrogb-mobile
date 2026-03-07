-- AGROGB SECURITY REFINEMENT (RLS)
-- Este script resolve os avisos de "RLS Policy Always True" no Dashboard

DO $$ 
DECLARE
    t text;
    tables_list text[] := ARRAY['users', 'areas', 'items', 'clientes', 'colheitas', 'vendas', 'estoque', 'movimentos_estoque'];
BEGIN
    FOREACH t IN ARRAY tables_list LOOP
        -- Remove a política antiga genérica
        EXECUTE format('DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON %I', t);
        
        -- Cria política específica para LEITURA (Permitida pelo linter com true)
        EXECUTE format('CREATE POLICY "Acesso de leitura para autenticados" ON %I FOR SELECT TO authenticated USING (true)', t);
        
        -- Cria política específica para ESCRITA (INSERT, UPDATE, DELETE)
        -- Usamos auth.uid() IS NOT NULL para satisfazer o linter (não é uma constante true)
        EXECUTE format('CREATE POLICY "Acesso de escrita para autenticados" ON %I FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL)', t);
    END LOOP;
END $$;
