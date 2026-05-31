-- ==============================================================================
-- AGROGB - MASTER SCRIPT 01: CORE SCHEMA
-- Função: Criar as fundações do sistema (Extensões, Organizações e Perfis).
-- Compatibilidade: Mobile e Desktop
-- ==============================================================================

-- 1. EXTENSOES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA extensions;

-- 2. FUNCAO AUXILIAR PARA ATUALIZAR TIMESTAMP UPDATED_AT
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. ORGANIZACOES (Multi-Tenant Base)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'producer' CHECK (type IN ('producer', 'agronomy_consulting', 'cooperative', 'reseller', 'agrogb')),
    owner_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_organizations ON public.organizations;
CREATE TRIGGER set_timestamp_organizations
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 4. PERFIS DE USUARIOS (Profiles Unificados)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    nome_completo TEXT NOT NULL,
    telefone TEXT,
    -- Role unificada aceita tanto as nomenclaturas antigas (Mobile) quanto as novas (Desktop)
    role TEXT NOT NULL DEFAULT 'AGRICULTOR' CHECK (role IN ('ADMIN', 'AGRONOMO', 'AGRICULTOR', 'CLIENTE', 'STAFF', 'PENDENTE')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_plan TEXT NOT NULL DEFAULT 'FREE',
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- 5. ATUALIZAR REFERENCIA CIRCULAR DA ORGANIZACAO
-- Como owner_user_id depende do profile, e o profile depende da organizacao, 
-- adicionamos a chave estrangeira apenas apos as duas tabelas existirem.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_owner_user' AND table_name = 'organizations'
    ) THEN
        ALTER TABLE public.organizations 
        ADD CONSTRAINT fk_owner_user FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;
