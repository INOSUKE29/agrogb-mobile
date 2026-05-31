-- ==============================================================================
-- AGROGB - MASTER DATABASE RESET SCRIPT
-- OBJETIVO: Limpar dados de teste, recriar perfis, permissões e Triggers automáticas.
-- AVISO: Este script apaga usuários e dados. Rode apenas em ambiente de setup/dev.
-- ==============================================================================

-- 1. LIMPAR DADOS EXISTENTES (Cuidado!)
-- Exclui todos os perfis e, por cascata, apaga tudo vinculado a eles.
-- Caso queira manter um Admin específico, altere a query abaixo ou não rode esta linha.
DELETE FROM auth.users WHERE email != 'SEU_EMAIL_ADMIN_AQUI@agrogb.com'; 

-- 2. RECRIAR TABELA PROFILES (O Motor Principal do AgroGB)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    nome_completo TEXT,
    role TEXT DEFAULT 'PENDENTE' CHECK (role IN ('CLIENTE', 'AGRONOMO', 'ADMIN', 'PENDENTE')),
    telefone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES (Regras de Segurança de Acesso)
-- Um usuário só pode ler seu próprio perfil (a menos que seja Admin)
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING ( auth.uid() = id );

-- Um usuário só pode atualizar seu próprio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );

-- *IMPORTANTE*: A inserção agora será feita EXCLUSIVAMENTE pelo Supabase (Trigger),
-- por isso não damos permissão de INSERT para usuários externos.

-- 5. TRIGGER AUTOMÁTICO (O CORAÇÃO DA SOLUÇÃO DO BUG DE CADASTRO)
-- Esta função é executada DENTRO do Supabase no exato milissegundo em que 
-- uma conta é criada no auth.users, garantindo que o profile nasça junto sem conflitos.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, nome_completo, role)
  VALUES (
    new.id, 
    new.email, 
    SPLIT_PART(new.email, '@', 1), -- Pega a primeira parte do email como username
    'NOVO USUÁRIO AGROGB', 
    COALESCE(new.raw_user_meta_data->>'role', 'PENDENTE') -- Se passou role na criação, usa, senão pendente
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. VINCULAR A TRIGGER AO AUTH.USERS
-- Se a trigger já existir, apagamos antes para recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- FIM DO SCRIPT
-- ==============================================================================
