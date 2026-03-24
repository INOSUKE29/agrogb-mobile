-- database/migrations/01_all_tables.sql
-- AGROGB DIAMOND PRO - Estrutura Base V10.5 (Resiliência Total) 🏗️
SET search_path TO public;

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PADRONIZAÇÃO DE COLUNAS (Auto-Correção de Schema Legado)
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND (column_name = 'usuario_id' OR column_name = 'user_uuid')
          AND table_name IN ('areas', 'vendas', 'custos', 'estoque', 'plantio', 'planos_adubacao', 'cadastro')
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO user_id', r.table_name, r.column_name);
        RAISE NOTICE 'Coluna padronizada em %: % -> user_id', r.table_name, r.column_name;
    END LOOP;
END $$;

-- 3. CRIAÇÃO DE TABELAS (Garante que tudo existe com colunas certas)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY, 
    email TEXT, 
    name TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES auth.users(id), 
    nome TEXT, 
    tamanho REAL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE TABLE IF NOT EXISTS public.cadastro (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES auth.users(id), 
    nome TEXT NOT NULL, 
    unidade TEXT, 
    categoria TEXT, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Garantia Sênior: Se a tabela já existia, garante que a coluna categoria também exista
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS categoria TEXT;

CREATE TABLE IF NOT EXISTS public.estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES auth.users(id), 
    produto_uuid UUID REFERENCES public.cadastro(uuid), 
    produto TEXT, -- fallback por nome
    quantidade REAL DEFAULT 0, 
    unidade TEXT, 
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS produto_uuid UUID;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE TABLE IF NOT EXISTS public.vendas (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES auth.users(id), 
    cliente_uuid UUID, 
    quantidade REAL, 
    valor REAL, 
    data_venda DATE DEFAULT now(), 
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE TABLE IF NOT EXISTS public.custos (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES auth.users(id), 
    categoria TEXT, 
    valor_total REAL, 
    data_custo DATE DEFAULT now(), 
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE TABLE IF NOT EXISTS public.plantio (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES auth.users(id), 
    cultura TEXT, 
    quantidade_pes REAL, 
    area_uuid UUID REFERENCES public.areas(id), 
    data_plantio DATE DEFAULT now(), 
    status TEXT DEFAULT 'EM CRESCIMENTO'
);
ALTER TABLE public.plantio ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE TABLE IF NOT EXISTS public.planos_adubacao (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID REFERENCES auth.users(id), 
    nome_plano TEXT, 
    status TEXT DEFAULT 'PENDENTE', 
    data_aplicacao TIMESTAMP WITH TIME ZONE, 
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE TABLE IF NOT EXISTS public.production_fertilization_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID, 
    plano_uuid UUID REFERENCES public.planos_adubacao(uuid), 
    produto_id TEXT, 
    quantidade REAL
);

CREATE TABLE IF NOT EXISTS public.v2_movimentacoes_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), 
    user_id UUID, 
    produto_uuid UUID, 
    tipo TEXT, 
    quantidade REAL, 
    origem TEXT, 
    data TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.v2_movimentacoes_estoque ADD COLUMN IF NOT EXISTS produto_uuid UUID;
ALTER TABLE public.v2_movimentacoes_estoque ADD COLUMN IF NOT EXISTS user_id UUID;

CREATE TABLE IF NOT EXISTS public.app_settings (
    id UUID PRIMARY KEY REFERENCES auth.users(id), 
    theme TEXT DEFAULT 'light', 
    notifications_enabled BOOLEAN DEFAULT true
);
