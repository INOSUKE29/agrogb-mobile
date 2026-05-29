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

-- ----------------------------------------------------------------
-- TRIGGER: Auto-create profile on auth.users insert
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_val public.user_role;
  fname TEXT;
  role_text TEXT;
BEGIN
  -- 1. Extract data from metadata
  fname := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'nome_completo', 'Usuário AgroGB');
  role_text := COALESCE(new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'nivel', 'CLIENTE');
  
  -- 2. Map string to enum
  IF UPPER(role_text) IN ('ADMIN', 'AGRONOMO', 'CLIENTE') THEN
    user_role_val := UPPER(role_text)::public.user_role;
  ELSE
    user_role_val := 'CLIENTE'::public.user_role;
  END IF;

  -- 3. Insert into the new profiles table
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, fname, user_role_val)
  ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          full_name = EXCLUDED.full_name,
          role = EXCLUDED.role;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
