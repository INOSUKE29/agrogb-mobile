-- =======================================================
-- AgroGB Recreate Base RLS Policies & Enable Password Verification
-- =======================================================

-- A. Organizações (organizations)
DROP POLICY IF EXISTS "Usuário acessa sua organização" ON public.organizations;
CREATE POLICY "Usuário acessa sua organização" ON public.organizations 
    FOR SELECT USING (
        id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR owner_user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Donos gerenciam organização" ON public.organizations;
CREATE POLICY "Donos gerenciam organização" ON public.organizations 
    FOR UPDATE USING (owner_user_id = auth.uid());


-- B. Códigos de Convite (agronomist_codes)
DROP POLICY IF EXISTS "Agrônomos gerenciam seu próprio código" ON public.agronomist_codes;
CREATE POLICY "Agrônomos gerenciam seu próprio código" ON public.agronomist_codes 
    FOR ALL USING (auth.uid() = agronomist_id);

DROP POLICY IF EXISTS "Qualquer autenticado lê convites" ON public.agronomist_codes;
CREATE POLICY "Qualquer autenticado lê convites" ON public.agronomist_codes 
    FOR SELECT USING (auth.role() = 'authenticated');


-- C. Vínculos Cliente x Agrônomo (agronomist_client_links)
DROP POLICY IF EXISTS "Acesso bilateral a vínculos" ON public.agronomist_client_links;
CREATE POLICY "Acesso bilateral a vínculos" ON public.agronomist_client_links 
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = agronomist_id);

DROP POLICY IF EXISTS "Clientes gerenciam vínculos" ON public.agronomist_client_links;
CREATE POLICY "Clientes gerenciam vínculos" ON public.agronomist_client_links 
    FOR ALL USING (auth.uid() = client_id);


-- D. Auditoria Geral (audit_logs)
DROP POLICY IF EXISTS "Admin lê auditoria" ON public.audit_logs;
CREATE POLICY "Admin lê auditoria" ON public.audit_logs 
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
    );
