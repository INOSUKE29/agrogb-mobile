-- ==============================================================================
-- AGROGB - MASTER SCHEMA CREATION SCRIPT
-- OBJETIVO: Criar todas as tabelas e regras necessárias no Supabase do zero.
-- ==============================================================================

-- 1. TABELA DE PERFIS (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    nome_completo TEXT,
    role TEXT DEFAULT 'CLIENTE' CHECK (role IN ('CLIENTE', 'AGRONOMO', 'ADMIN', 'PENDENTE')),
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE COLHEITAS
CREATE TABLE IF NOT EXISTS public.colheitas (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data TIMESTAMP WITH TIME ZONE NOT NULL,
    cultura TEXT NOT NULL,
    produto TEXT NOT NULL,
    quantidade NUMERIC NOT NULL,
    observacao TEXT,
    agronomo_id UUID REFERENCES public.profiles(id),
    sync_status INTEGER DEFAULT 1,
    is_deleted INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA FINANCEIRO
CREATE TABLE IF NOT EXISTS public.financeiro_transacoes (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT CHECK (tipo IN ('RECEBER', 'PAGAR')),
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    vencimento TIMESTAMP WITH TIME ZONE,
    data_pagamento TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'CANCELADO')),
    entidade_nome TEXT,
    user_id UUID REFERENCES public.profiles(id),
    sync_status INTEGER DEFAULT 1,
    is_deleted INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TRIGGER PARA CRIAR PERFIL AUTOMATICAMENTE
-- (Resolve o erro "Database error creating new user")
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, nome_completo, role)
  VALUES (
    new.id, 
    new.email, 
    SPLIT_PART(new.email, '@', 1), 
    'NOVO USUÁRIO', 
    'CLIENTE'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. SEGURANÇA (RLS) - Liberar TUDO para teste inicial
-- Aviso: Em produção, você apertará essas regras.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colheitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro_transacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL for authenticated users on profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Enable ALL for authenticated users on colheitas" ON public.colheitas FOR ALL USING (true);
CREATE POLICY "Enable ALL for authenticated users on financeiro" ON public.financeiro_transacoes FOR ALL USING (true);
