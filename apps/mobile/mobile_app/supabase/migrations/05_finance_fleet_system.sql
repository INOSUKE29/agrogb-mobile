-- 05_finance_fleet_system.sql
-- AGROGB DIAMOND PRO - Módulo 05: Financeiro, Frota e Sistema

-- 1. VENDAS (Receitas)
CREATE TABLE IF NOT EXISTS public.vendas (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS cliente_uuid UUID REFERENCES public.clientes(uuid);
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS cliente_nome TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS produto_nome TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS quantidade REAL DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS valor REAL DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS valor_recebido REAL DEFAULT 0;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS status_pagamento TEXT DEFAULT 'A_RECEBER';
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS data_venda TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;
ALTER TABLE public.vendas ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();

-- 2. CUSTOS (Despesas e Investimentos)
CREATE TABLE IF NOT EXISTS public.custos (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS produto TEXT NOT NULL DEFAULT 'Despesa';
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS tipo TEXT; -- (INSUMO, SERVIÇO, MÁQUINA, PESSOAL)
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS quantidade REAL DEFAULT 1;
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS valor_total REAL DEFAULT 0;
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS data TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE public.custos ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();

-- 3. FROTA (Maquinário Agrícola)
CREATE TABLE IF NOT EXISTS public.farm_machines (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.farm_machines ADD COLUMN IF NOT EXISTS user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id);
ALTER TABLE public.farm_machines ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL;
ALTER TABLE public.farm_machines ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.farm_machines ADD COLUMN IF NOT EXISTS placa TEXT;
ALTER TABLE public.farm_machines ADD COLUMN IF NOT EXISTS horimetro REAL DEFAULT 0;
ALTER TABLE public.farm_machines ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ATIVO';

-- 4. APP SETTINGS (Configurações da Fazenda)
CREATE TABLE IF NOT EXISTS public.app_settings (id UUID PRIMARY KEY DEFAULT auth.uid());
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS fazenda_nome TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS fazenda_produtor TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#059669';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'system';
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. BASE DE CONHECIMENTO PRO (Biblioteca Técnica)
CREATE TABLE IF NOT EXISTS public.base_conhecimento_pro (uuid UUID PRIMARY KEY DEFAULT gen_random_uuid());
ALTER TABLE public.base_conhecimento_pro ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.base_conhecimento_pro ADD COLUMN IF NOT EXISTS titulo TEXT NOT NULL;
ALTER TABLE public.base_conhecimento_pro ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.base_conhecimento_pro ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();

-- RLS
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.base_conhecimento_pro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Manage own sales" ON public.vendas;
DROP POLICY IF EXISTS "Manage own costs" ON public.custos;
DROP POLICY IF EXISTS "Manage own fleet" ON public.farm_machines;
DROP POLICY IF EXISTS "Manage own settings" ON public.app_settings;
DROP POLICY IF EXISTS "View knowledge base" ON public.base_conhecimento_pro;

CREATE POLICY "Manage own sales" ON public.vendas FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own costs" ON public.custos FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own fleet" ON public.farm_machines FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Manage own settings" ON public.app_settings FOR ALL USING (auth.uid() = id);
CREATE POLICY "View knowledge base" ON public.base_conhecimento_pro FOR SELECT USING (true);
