-- Migration 1: Enums e Perfis
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'AGRONOMO', 'CLIENTE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE link_status AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role user_role DEFAULT 'CLIENTE',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN full_name TEXT; EXCEPTION WHEN duplicate_column THEN null; END $$;
DO $$ BEGIN ALTER TABLE public.profiles ADD COLUMN role user_role DEFAULT 'CLIENTE'; EXCEPTION WHEN duplicate_column THEN null; END $$;
