-- ==========================================
-- SCRIPT DE CORREÇÃO SUPABASE AUTH -> PROFILES
-- ==========================================
-- Objetivo: Criar automaticamente um registro em public.profiles
-- quando um novo usuário se cadastrar pelo Auth do Supabase.

-- 1. Certifique-se de ter uma tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  role text default 'CLIENTE',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS e criar política de segurança
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfis visíveis por si mesmos e admins" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Usuários podem editar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Criar a função que será disparada pela Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- Insere na tabela public.profiles o novo ID e o email como nome temporário
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (new.id, new.email, 'CLIENTE');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar a Trigger que escuta auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================
-- COMO LIMPAR USUÁRIOS QUEBRADOS (RODE APENAS SE TIVER CERTEZA)
-- ==============================================================
-- DELETE FROM auth.users WHERE email NOT IN ('seu-email-admin@agrogb.com');
