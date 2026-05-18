-- ==========================================
-- AgroGB Database Schema - Part 1
-- Migração Unificada: Mobile & Desktop Compatibility
-- ==========================================

-- 1. EXTENSÕES & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS DE USUÁRIOS (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome_completo TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefone TEXT,
    role TEXT NOT NULL DEFAULT 'CLIENTE' CHECK (role IN ('ADMIN', 'AGRONOMO', 'CLIENTE', 'STAFF')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS em profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. PROPRIEDADES (Farms)
CREATE TABLE IF NOT EXISTS public.farms (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cidade TEXT,
    estado TEXT,
    area_total NUMERIC DEFAULT 0,
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1 -- 1 = Sincronizado, 0 = Pendente Local
);

ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- 4. TALHÕES (Fields)
CREATE TABLE IF NOT EXISTS public.fields (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_uuid UUID NOT NULL REFERENCES public.farms(uuid) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    area NUMERIC DEFAULT 0,
    plant_count INT DEFAULT 0,
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;

-- 5. PLANTIOS (Plantings)
CREATE TABLE IF NOT EXISTS public.plantings (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_uuid UUID NOT NULL REFERENCES public.fields(uuid) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety_name TEXT NOT NULL,
    planting_date DATE NOT NULL,
    expected_yield NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'FINALIZADO')),
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.plantings ENABLE ROW LEVEL SECURITY;

-- 6. CÓDIGOS DE CONVITE DE AGRÔNOMOS (Agronomist Codes)
CREATE TABLE IF NOT EXISTS public.agronomist_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agronomist_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.agronomist_codes ENABLE ROW LEVEL SECURITY;

-- 7. VÍNCULOS CLIENTE X AGRÔNOMO (Assessoria)
CREATE TABLE IF NOT EXISTS public.agronomist_client_links (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agronomist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACTIVE', 'REVOKED')),
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1,
    CONSTRAINT unique_active_link UNIQUE (agronomist_id, client_id)
);

ALTER TABLE public.agronomist_client_links ENABLE ROW LEVEL SECURITY;

-- 8. BIBLIOTECA DE PRODUTOS/INSUMOS (Global & Local)
CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    fabricante TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tags TEXT,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Se NULL, o item é GLOBAL
    curation_status TEXT NOT NULL DEFAULT 'approved' CHECK (curation_status IN ('approved', 'pending', 'duplicate', 'rejected', 'archived')),
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 9. RECOMENDAÇÕES AGRONÔMICAS (Prescrições Técnicas)
CREATE TABLE IF NOT EXISTS public.recommendations (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agronomist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    farm_uuid UUID NOT NULL REFERENCES public.farms(uuid) ON DELETE CASCADE,
    field_uuid UUID NOT NULL REFERENCES public.fields(uuid) ON DELETE CASCADE,
    planting_uuid UUID REFERENCES public.plantings(uuid) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    application_type TEXT NOT NULL CHECK (application_type IN ('GOTEJO', 'FOLIAR', 'OUTRO')),
    recipe_data JSONB NOT NULL, -- Estrutura de insumos e dosagens: [{"produto": "X", "quantidade": 10, "unidade": "kg"}]
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'EXECUTED', 'CANCELLED')),
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- 10. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==========================================

-- A. Políticas de Perfis (Profiles)
CREATE POLICY "Qualquer usuário logado pode ler perfis" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuário gerencia o próprio perfil" ON public.profiles
    FOR ALL USING (auth.uid() = id);

-- B. Políticas de Propriedades (Farms)
CREATE POLICY "Clientes gerenciam suas fazendas" ON public.farms
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Agrônomos leem fazendas de clientes vinculados" ON public.farms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.agronomist_client_links
            WHERE agronomist_id = auth.uid() AND client_id = farms.owner_id AND status = 'ACTIVE'
        )
    );

-- C. Políticas de Talhões (Fields)
CREATE POLICY "Clientes gerenciam seus talhões" ON public.fields
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.farms
            WHERE uuid = fields.farm_uuid AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Agrônomos leem talhões de clientes vinculados" ON public.fields
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.farms f
            JOIN public.agronomist_client_links l ON l.client_id = f.owner_id
            WHERE f.uuid = fields.farm_uuid AND l.agronomist_id = auth.uid() AND l.status = 'ACTIVE'
        )
    );

-- D. Políticas de Plantios (Plantings)
CREATE POLICY "Clientes gerenciam seus plantios" ON public.plantings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.fields f
            JOIN public.farms fm ON fm.uuid = f.farm_uuid
            WHERE f.uuid = plantings.field_uuid AND fm.owner_id = auth.uid()
        )
    );

CREATE POLICY "Agrônomos leem plantios de clientes vinculados" ON public.plantings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.fields f
            JOIN public.farms fm ON fm.uuid = f.farm_uuid
            JOIN public.agronomist_client_links l ON l.client_id = fm.owner_id
            WHERE f.uuid = plantings.field_uuid AND l.agronomist_id = auth.uid() AND l.status = 'ACTIVE'
        )
    );

-- E. Políticas de Códigos de Convite (Agronomist Codes)
CREATE POLICY "Agrônomos gerenciam seu próprio código" ON public.agronomist_codes
    FOR ALL USING (auth.uid() = agronomist_id);

CREATE POLICY "Qualquer cliente logado pode ler códigos de convite" ON public.agronomist_codes
    FOR SELECT USING (auth.role() = 'authenticated');

-- F. Políticas de Vínculos (Agronomist Client Links)
CREATE POLICY "Usuários leem seus próprios vínculos" ON public.agronomist_client_links
    FOR SELECT USING (auth.uid() = client_id OR auth.uid() = agronomist_id);

CREATE POLICY "Clientes criam e atualizam vínculos" ON public.agronomist_client_links
    FOR ALL USING (auth.uid() = client_id);

-- G. Políticas de Biblioteca de Insumos (Products)
CREATE POLICY "Insumos globais ou locais do próprio dono" ON public.products
    FOR SELECT USING (owner_id IS NULL OR owner_id = auth.uid());

CREATE POLICY "Insumos criados localmente por qualquer usuário" ON public.products
    FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Usuário gerencia seus insumos locais" ON public.products
    FOR UPDATE USING (owner_id = auth.uid());

-- H. Políticas de Recomendações
CREATE POLICY "Clientes leem e aplicam recomendações" ON public.recommendations
    FOR ALL USING (client_id = auth.uid());

CREATE POLICY "Agrônomos criam e gerenciam recomendações" ON public.recommendations
    FOR ALL USING (agronomist_id = auth.uid());


-- ==========================================
-- 11. TRIGGERS & PROCEDIMENTOS AUTOMÁTICOS
-- ==========================================

-- Trigger para criar perfil de usuário remoto automaticamente no Supabase Auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, nome_completo, email, telefone, role, is_active)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'nome_completo', 'Usuário AgroGB'),
        new.email,
        new.raw_user_meta_data->>'telefone',
        COALESCE(new.raw_user_meta_data->>'role', 'CLIENTE'),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Se o papel do usuário for AGRONOMO, gerar automaticamente seu código de convite único
    IF COALESCE(new.raw_user_meta_data->>'role', 'CLIENTE') = 'AGRONOMO' THEN
        INSERT INTO public.agronomist_codes (agronomist_id, invite_code)
        VALUES (
            new.id,
            'AGRO-' || upper(substring(md5(random()::text) from 1 for 4))
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Associar trigger à tabela auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
