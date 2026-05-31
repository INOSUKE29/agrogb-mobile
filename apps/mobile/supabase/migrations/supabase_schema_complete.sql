-- ==========================================
-- AgroGB Database Schema - Complete Unified Migration
-- Compatibilidade Total: Mobile v7.0 & Desktop Admin/Agronomist
-- ==========================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNÇÃO AUXILIAR PARA ATUALIZAR TIMESTAMP UPDATED_AT
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. ORGANIZAÇÕES (Multi-Tenant)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'producer' CHECK (type IN ('producer', 'agronomy_consulting', 'cooperative', 'reseller', 'agrogb')),
    owner_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_timestamp_organizations
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4. PERFIS DE USUÁRIOS (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    role TEXT NOT NULL DEFAULT 'CLIENTE' CHECK (role IN ('ADMIN', 'AGRONOMO', 'CLIENTE', 'STAFF')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_plan TEXT NOT NULL DEFAULT 'FREE',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Atualizar referência circular de owner em organizations
ALTER TABLE public.organizations ADD CONSTRAINT fk_owner_user FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. PROPRIEDADES (Farms)
CREATE TABLE IF NOT EXISTS public.farms (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cidade TEXT,
    estado TEXT,
    area_total NUMERIC DEFAULT 0,
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api', 'system')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- 6. TALHÕES (Fields)
CREATE TABLE IF NOT EXISTS public.fields (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_uuid UUID NOT NULL REFERENCES public.farms(uuid) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    area NUMERIC DEFAULT 0,
    plant_count INT DEFAULT 0,
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api', 'system')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- 7. PLANTIOS (Plantings)
CREATE TABLE IF NOT EXISTS public.plantings (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_uuid UUID NOT NULL REFERENCES public.fields(uuid) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety_name TEXT NOT NULL,
    planting_date DATE NOT NULL,
    expected_yield NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'FINALIZADO')),
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api', 'system')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.plantings ENABLE ROW LEVEL SECURITY;

-- 8. CÓDIGOS DE CONVITE (Agronomist Codes)
CREATE TABLE IF NOT EXISTS public.agronomist_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agronomist_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.agronomist_codes ENABLE ROW LEVEL SECURITY;

-- 9. VÍNCULOS CLIENTE X AGRÔNOMO
CREATE TABLE IF NOT EXISTS public.agronomist_client_links (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agronomist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'REVOKED')),
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1,
    CONSTRAINT unique_active_link UNIQUE (agronomist_id, client_id)
);

ALTER TABLE public.agronomist_client_links ENABLE ROW LEVEL SECURITY;

-- 10. BIBLIOTECA DE PRODUTOS / INSUMOS
CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    fabricante TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tags TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- NULL = GLOBAL
    curation_status TEXT NOT NULL DEFAULT 'approved' CHECK (curation_status IN ('approved', 'pending', 'duplicate', 'rejected', 'archived')),
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api', 'system')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 11. RECOMENDAÇÕES AGRONÔMICAS
CREATE TABLE IF NOT EXISTS public.recommendations (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agronomist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_uuid UUID REFERENCES public.farms(uuid) ON DELETE CASCADE,
    field_uuid UUID REFERENCES public.fields(uuid) ON DELETE CASCADE,
    planting_uuid UUID REFERENCES public.plantings(uuid) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipe_type TEXT NOT NULL DEFAULT 'GOTEJO' CHECK (recipe_type IN ('GOTEJO', 'FOLIAR', 'OUTRO')),
    recipe_data JSONB NOT NULL, -- [{"product": "X", "dosage": 10, "unit": "kg"}]
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPLIED', 'CANCELLED')),
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api', 'system')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- 12. PERMISSÕES POR CARGO
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'AGRONOMO', 'CLIENTE', 'STAFF')),
    permission_key TEXT NOT NULL,
    is_allowed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_role_permission UNIQUE (role, permission_key)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 13. MONETIZAÇÃO & ASSINATURAS
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'overdue', 'canceled', 'expired')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_timestamp_subscriptions
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TABLE IF NOT EXISTS public.billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BRL',
    status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending')),
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- 14. AUDITORIA GERAL (Audit Logs)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 15. NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('recommendation_received', 'recommendation_approved', 'subscription_expiring', 'product_approved')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 16. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- A. Perfis
CREATE POLICY "Leitura livre de perfis autenticados" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Gerência do próprio perfil" ON public.profiles FOR ALL USING (auth.uid() = id);

-- B. Organizações
CREATE POLICY "Usuário acessa sua organização" ON public.organizations FOR SELECT USING (
    id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR owner_user_id = auth.uid()
);
CREATE POLICY "Donos gerenciam organização" ON public.organizations FOR UPDATE USING (owner_user_id = auth.uid());

-- C. Farms (Propriedades)
CREATE POLICY "Clientes gerenciam suas fazendas" ON public.farms FOR ALL USING (
    owner_id = auth.uid() OR organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);
CREATE POLICY "Agrônomos leem fazendas de clientes vinculados" ON public.farms FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.agronomist_client_links
        WHERE agronomist_id = auth.uid() AND client_id = farms.owner_id AND status = 'ACTIVE'
    )
);

-- D. Fields (Talhões)
CREATE POLICY "Clientes gerenciam seus talhões" ON public.fields FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.farms WHERE uuid = fields.farm_uuid AND (owner_id = auth.uid() OR organization_id = fields.organization_id)
    )
);
CREATE POLICY "Agrônomos leem talhões de clientes vinculados" ON public.fields FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.farms f
        JOIN public.agronomist_client_links l ON l.client_id = f.owner_id
        WHERE f.uuid = fields.farm_uuid AND l.agronomist_id = auth.uid() AND l.status = 'ACTIVE'
    )
);

-- E. Plantings (Plantios)
CREATE POLICY "Clientes gerenciam seus plantios" ON public.plantings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.fields f
        JOIN public.farms fm ON fm.uuid = f.farm_uuid
        WHERE f.uuid = plantings.field_uuid AND (fm.owner_id = auth.uid() OR fm.organization_id = plantings.organization_id)
    )
);
CREATE POLICY "Agrônomos leem plantios de clientes vinculados" ON public.plantings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.fields f
        JOIN public.farms fm ON fm.uuid = f.farm_uuid
        JOIN public.agronomist_client_links l ON l.client_id = fm.owner_id
        WHERE f.uuid = plantings.field_uuid AND l.agronomist_id = auth.uid() AND l.status = 'ACTIVE'
    )
);

-- F. Códigos de Convite
CREATE POLICY "Agrônomos gerenciam seu próprio código" ON public.agronomist_codes FOR ALL USING (auth.uid() = agronomist_id);
CREATE POLICY "Qualquer autenticado lê convites" ON public.agronomist_codes FOR SELECT USING (auth.role() = 'authenticated');

-- G. Vínculos
CREATE POLICY "Acesso bilateral a vínculos" ON public.agronomist_client_links FOR SELECT USING (auth.uid() = client_id OR auth.uid() = agronomist_id);
CREATE POLICY "Clientes gerenciam vínculos" ON public.agronomist_client_links FOR ALL USING (auth.uid() = client_id);

-- H. Insumos (Products)
CREATE POLICY "Acesso global ou pessoal" ON public.products FOR SELECT USING (owner_id IS NULL OR owner_id = auth.uid());
CREATE POLICY "Inserção local" ON public.products FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Gerência local" ON public.products FOR UPDATE USING (owner_id = auth.uid());

-- I. Recomendações
CREATE POLICY "Clientes acessam suas recomendações" ON public.recommendations FOR ALL USING (client_id = auth.uid());
CREATE POLICY "Agrônomos criam e leem suas recomendações" ON public.recommendations FOR ALL USING (agronomist_id = auth.uid());

-- J. Auditoria
CREATE POLICY "Admin lê auditoria" ON public.audit_logs FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
);

-- ==========================================
-- 17. AUTOMATIC PROCEDURES & TRIGGERS (Triggers)
-- ==========================================

-- Trigger pós-cadastro para criar Organização e Perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    user_role TEXT;
    full_name TEXT;
BEGIN
    full_name := COALESCE(new.raw_user_meta_data->>'nome_completo', 'Usuário AgroGB');
    user_role := COALESCE(new.raw_user_meta_data->>'role', 'CLIENTE');

    -- 1. Criar Organização Primária (com owner_user_id NULL temporariamente para evitar erro de Chave Estrangeira)
    INSERT INTO public.organizations (name, type, owner_user_id)
    VALUES (
        COALESCE(new.raw_user_meta_data->>'organization_name', 'Fazenda ' || full_name),
        CASE WHEN user_role = 'AGRONOMO' THEN 'agronomy_consulting'::text ELSE 'producer'::text END,
        NULL
    )
    RETURNING id INTO new_org_id;

    -- 2. Criar Perfil de Usuário
    INSERT INTO public.profiles (id, nome_completo, email, telefone, role, status, subscription_plan, organization_id)
    VALUES (
        new.id,
        full_name,
        new.email,
        new.raw_user_meta_data->>'telefone',
        user_role,
        'active',
        'FREE',
        new_org_id
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Atualizar owner_user_id de volta na organização
    UPDATE public.organizations SET owner_user_id = new.id WHERE id = new_org_id;

    -- 4. Se for agrônomo, gerar código de convite único automaticamente
    IF user_role = 'AGRONOMO' THEN
        INSERT INTO public.agronomist_codes (agronomist_id, invite_code)
        VALUES (
            new.id,
            'AGRO-' || upper(substring(md5(random()::text) from 1 for 4))
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger de Auditoria Universal
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    current_uid UUID;
BEGIN
    BEGIN
        current_uid := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        current_uid := NULL;
    END;

    IF (TG_OP = 'UPDATE') THEN
        old_val := to_jsonb(OLD);
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'INSERT') THEN
        new_val := to_jsonb(NEW);
    ELSIF (TG_OP = 'DELETE') THEN
        old_val := to_jsonb(OLD);
    END IF;

    INSERT INTO public.audit_logs(user_id, action, table_name, record_id, old_data, new_data, source_platform)
    VALUES (
        current_uid,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE((new_val->>'uuid')::uuid, (old_val->>'uuid')::uuid, (new_val->>'id')::uuid, (old_val->>'id')::uuid),
        old_val,
        new_val,
        COALESCE(new_val->>'source_platform', old_val->>'source_platform', 'system')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger de auditoria nas tabelas operacionais
CREATE OR REPLACE TRIGGER audit_farms AFTER INSERT OR UPDATE OR DELETE ON public.farms FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_fields AFTER INSERT OR UPDATE OR DELETE ON public.fields FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_plantings AFTER INSERT OR UPDATE OR DELETE ON public.plantings FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
CREATE OR REPLACE TRIGGER audit_recommendations AFTER INSERT OR UPDATE OR DELETE ON public.recommendations FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- ==========================================
-- 18. CRIAÇÃO DE ÍNDICES DE ALTO DESEMPENHO
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_profiles_org ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_farms_owner ON public.farms(owner_id);
CREATE INDEX IF NOT EXISTS idx_farms_org ON public.farms(organization_id);
CREATE INDEX IF NOT EXISTS idx_fields_farm ON public.fields(farm_uuid);
CREATE INDEX IF NOT EXISTS idx_fields_org ON public.fields(organization_id);
CREATE INDEX IF NOT EXISTS idx_plantings_field ON public.plantings(field_uuid);
CREATE INDEX IF NOT EXISTS idx_plantings_org ON public.plantings(organization_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_client ON public.recommendations(client_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_agronomist ON public.recommendations(agronomist_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs(record_id);
