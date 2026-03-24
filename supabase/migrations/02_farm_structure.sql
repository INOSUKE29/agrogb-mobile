-- 02_farm_structure.sql
-- AGROGB DIAMOND PRO - Módulo 02: Estrutura da Fazenda (Áreas, Clientes, Culturas)

-- 1. ÁREAS / TALHÕES
CREATE TABLE IF NOT EXISTS public.areas (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT 'Nova Área';
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS metragem REAL DEFAULT 0;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS peso_medio_caixa REAL DEFAULT 1;
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.areas ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 2. CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT 'Novo Cliente';
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS estado TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 3. CULTURAS
CREATE TABLE IF NOT EXISTS public.culturas (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.culturas ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.culturas ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT 'Nova Cultura';
ALTER TABLE public.culturas ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.culturas ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();

-- RLS (Row Level Security)
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.culturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own areas" ON public.areas;
DROP POLICY IF EXISTS "Manage own clientes" ON public.clientes;
DROP POLICY IF EXISTS "Manage own culturas" ON public.culturas;

CREATE POLICY "Manage own areas" ON public.areas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own clientes" ON public.clientes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own culturas" ON public.culturas FOR ALL USING (auth.uid() = user_id);
