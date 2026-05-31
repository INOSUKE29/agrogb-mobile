-- ========================================================
-- AGROGB DIAMOND PRO - MASTER SUPABASE SCRIPT (FINAL VERSION)
-- Versão: 1.3.0
-- Este arquivo é a união dos 5 módulos de migração.
-- ========================================================

-- 00. SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 01. AUTH & PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (id UUID PRIMARY KEY DEFAULT auth.uid(), email TEXT UNIQUE, name TEXT, role TEXT DEFAULT 'USUARIO', last_updated TIMESTAMPTZ DEFAULT now());
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);

-- 02. FARM STRUCTURE
CREATE TABLE IF NOT EXISTS public.areas (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage own areas" ON public.areas;
CREATE POLICY "Manage own areas" ON public.areas FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.clientes (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.culturas (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.culturas ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.culturas ENABLE ROW LEVEL SECURITY;

-- 03. INVENTORY & STOCK
CREATE TABLE IF NOT EXISTS public.cadastro (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.cadastro ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.cadastro ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.estoque (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

-- 04. PRODUCTION
CREATE TABLE IF NOT EXISTS public.plantio (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.plantio ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.plantio ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.planos_adubacao (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.planos_adubacao ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.planos_adubacao ENABLE ROW LEVEL SECURITY;

-- 05. FINANCE & SYSTEM
CREATE TABLE IF NOT EXISTS public.vendas (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.custos (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.app_settings (id UUID PRIMARY KEY DEFAULT auth.uid());
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ... (Nota: Arquivos separados na pasta /supabase/migrations contêm todos os detalhes de colunas)
