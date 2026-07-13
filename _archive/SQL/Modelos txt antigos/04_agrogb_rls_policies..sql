-- ==============================================================================
-- AGROGB - MASTER SCRIPT 04: RLS POLICIES (Row-Level Security)
-- Função: Blindar o banco de dados e garantir que cada usuário só veja o que deve.
-- Compatibilidade: Mobile e Desktop
-- ==============================================================================

-- LIMPEZA DAS POLÍTICAS ANTIGAS (Para evitar erros de duplicação)
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 1. PROFILES (Perfis)
CREATE POLICY "Profiles - Leituras permitidas (Dono, Admin, ou Mesma Org)"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN' OR
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Profiles - Escrita permitida (Dono ou Admin)"
    ON public.profiles FOR UPDATE
    USING (
        auth.uid() = id OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

-- 2. FARMS (Propriedades)
CREATE POLICY "Farms - Leitura permitida (Dono, Agronomo Vinculado, Admin)"
    ON public.farms FOR SELECT
    USING (
        owner_id = auth.uid() OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN' OR
        EXISTS (
            SELECT 1 FROM public.agronomist_client_links
            WHERE agronomist_id = auth.uid() AND client_id = owner_id AND status = 'ACTIVE'
        )
    );

CREATE POLICY "Farms - Escrita permitida (Dono, Admin)"
    ON public.farms FOR ALL
    USING (
        owner_id = auth.uid() OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

-- 3. FIELDS (Talhões)
CREATE POLICY "Fields - Leitura permitida"
    ON public.fields FOR SELECT
    USING (
        farm_uuid IN (
            SELECT uuid FROM public.farms WHERE owner_id = auth.uid()
            UNION
            SELECT uuid FROM public.farms WHERE owner_id IN (
                SELECT client_id FROM public.agronomist_client_links WHERE agronomist_id = auth.uid() AND status = 'ACTIVE'
            )
        ) OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

CREATE POLICY "Fields - Escrita permitida"
    ON public.fields FOR ALL
    USING (
        farm_uuid IN (SELECT uuid FROM public.farms WHERE owner_id = auth.uid()) OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

-- 4. PLANTINGS (Plantios)
CREATE POLICY "Plantings - Leitura permitida"
    ON public.plantings FOR SELECT
    USING (
        field_uuid IN (SELECT uuid FROM public.fields WHERE farm_uuid IN (SELECT uuid FROM public.farms WHERE owner_id = auth.uid())) OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

CREATE POLICY "Plantings - Escrita permitida"
    ON public.plantings FOR ALL
    USING (
        field_uuid IN (SELECT uuid FROM public.fields WHERE farm_uuid IN (SELECT uuid FROM public.farms WHERE owner_id = auth.uid())) OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

-- 5. RECOMMENDATIONS (Recomendações Agronômicas)
CREATE POLICY "Recommendations - Leitura"
    ON public.recommendations FOR SELECT
    USING (
        client_id = auth.uid() OR
        agronomist_id = auth.uid() OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

CREATE POLICY "Recommendations - Escrita Agronomos e Admins"
    ON public.recommendations FOR ALL
    USING (
        agronomist_id = auth.uid() OR
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );

-- 6. PRODUCTS (Insumos)
CREATE POLICY "Products - Leitura Global"
    ON public.products FOR SELECT
    USING (true);

CREATE POLICY "Products - Escrita Admins"
    ON public.products FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN' OR
        owner_id = auth.uid()
    );
