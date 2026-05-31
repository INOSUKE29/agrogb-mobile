-- ==============================================================================
-- AGROGB - MASTER SCRIPT 02: ENTITIES SCHEMA
-- Função: Criar tabelas operacionais (Fazendas, Insumos, Plantios, etc).
-- Compatibilidade: Mobile e Desktop
-- ==============================================================================

-- 1. PROPRIEDADES (Farms)
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

-- 2. TALHOES (Fields)
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

-- 3. PLANTIOS (Plantings)
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

-- 4. CODIGOS DE CONVITE & VINCULOS
CREATE TABLE IF NOT EXISTS public.agronomist_codes (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agronomist_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.agronomist_codes ENABLE ROW LEVEL SECURITY;

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

-- 5. PRODUTOS / INSUMOS
CREATE TABLE IF NOT EXISTS public.products (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    fabricante TEXT NOT NULL,
    categoria TEXT NOT NULL,
    tags TEXT,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    curation_status TEXT NOT NULL DEFAULT 'approved' CHECK (curation_status IN ('approved', 'pending', 'duplicate', 'rejected', 'archived')),
    source_platform TEXT NOT NULL DEFAULT 'mobile' CHECK (source_platform IN ('mobile', 'desktop', 'api', 'system')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 6. RECOMENDACOES AGRONOMICAS
CREATE TABLE IF NOT EXISTS public.recommendations (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agronomist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_uuid UUID REFERENCES public.farms(uuid) ON DELETE CASCADE,
    field_uuid UUID REFERENCES public.fields(uuid) ON DELETE CASCADE,
    planting_uuid UUID REFERENCES public.plantings(uuid) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    recipe_type TEXT NOT NULL DEFAULT 'GOTEJO' CHECK (recipe_type IN ('GOTEJO', 'FOLIAR', 'OUTRO')),
    recipe_data JSONB NOT NULL,
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

-- 7. AUDITORIA
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
