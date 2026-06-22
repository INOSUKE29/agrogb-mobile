-- ==============================================================================
-- 33 - AGROGB - POLÍTICAS DE SEGURANÇA (RLS) PARA A BIBLIOTECA GLOBAL
-- Função: Permite leitura e escrita nas tabelas do Grafo de Conhecimento (kb_*)
-- ==============================================================================

-- Aplica para Cultura
CREATE POLICY "Leitura Universal ou Propria - Culturas" ON public.kb_crops FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Escrita Admin ou Dono - Culturas" ON public.kb_crops FOR ALL USING ((scope = 'GLOBAL' AND public.is_admin()) OR (scope = 'AGRONOMO' AND owner_id = auth.uid()));

-- Aplica para Pragas
CREATE POLICY "Leitura Universal ou Propria - Pragas" ON public.kb_pests FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Escrita Admin ou Dono - Pragas" ON public.kb_pests FOR ALL USING ((scope = 'GLOBAL' AND public.is_admin()) OR (scope = 'AGRONOMO' AND owner_id = auth.uid()));

-- Aplica para Doenças
CREATE POLICY "Leitura Universal ou Propria - Doencas" ON public.kb_diseases FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Escrita Admin ou Dono - Doencas" ON public.kb_diseases FOR ALL USING ((scope = 'GLOBAL' AND public.is_admin()) OR (scope = 'AGRONOMO' AND owner_id = auth.uid()));

-- Aplica para Deficiências
CREATE POLICY "Leitura Universal ou Propria - Deficiencias" ON public.kb_deficiencies FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Escrita Admin ou Dono - Deficiencias" ON public.kb_deficiencies FOR ALL USING ((scope = 'GLOBAL' AND public.is_admin()) OR (scope = 'AGRONOMO' AND owner_id = auth.uid()));

-- Aplica para Protocolos
CREATE POLICY "Leitura Universal ou Propria - Protocolos" ON public.kb_protocols FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Escrita Admin ou Dono - Protocolos" ON public.kb_protocols FOR ALL USING ((scope = 'GLOBAL' AND public.is_admin()) OR (scope = 'AGRONOMO' AND owner_id = auth.uid()));

-- Aplica para Receitas
CREATE POLICY "Leitura Universal ou Propria - Receitas" ON public.kb_recipes FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Escrita Admin ou Dono - Receitas" ON public.kb_recipes FOR ALL USING ((scope = 'GLOBAL' AND public.is_admin()) OR (scope = 'AGRONOMO' AND owner_id = auth.uid()));

-- Aplica para Resultados (Memória Técnica)
ALTER TABLE public.kb_outcomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Universal ou Propria - Resultados" ON public.kb_outcomes FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Escrita Admin ou Dono - Resultados" ON public.kb_outcomes FOR ALL USING ((scope = 'GLOBAL' AND public.is_admin()) OR (scope = 'AGRONOMO' AND owner_id = auth.uid()));

-- Aplica para Combinações (Memória Técnica)
ALTER TABLE public.kb_combinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Universal ou Propria - Combinacoes" ON public.kb_combinations FOR SELECT USING (public.can_read_kb(scope, owner_id));
CREATE POLICY "Escrita Admin ou Dono - Combinacoes" ON public.kb_combinations FOR ALL USING ((scope = 'GLOBAL' AND public.is_admin()) OR (scope = 'AGRONOMO' AND owner_id = auth.uid()));

-- Aplica para Fases Fenológicas (Memória Técnica)
ALTER TABLE public.kb_phenological_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura Universal" ON public.kb_phenological_phases FOR SELECT USING (true);
CREATE POLICY "Escrita Admin" ON public.kb_phenological_phases FOR ALL USING (public.is_admin());
