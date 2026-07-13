-- ==============================================================================
-- AGROGB - MASTER SCRIPT 03: AUTHENTICATION TRIGGERS
-- Função: Gerenciar criação e auto-vinculação de perfis na plataforma.
-- Compatibilidade: Mobile e Desktop
-- ==============================================================================

-- 1. FUNCAO: HANDLE NEW USER (SUPER FIX)
-- Cria o perfil public.profiles automaticamente quando a conta é criada no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  full_name TEXT;
BEGIN
  -- 1. Tentar pegar o nome (usado pelo app Desktop na criacao manual)
  -- Fallback para o nome do Mobile ou um padrao caso venha vazio
  full_name := COALESCE(new.raw_user_meta_data->>'nome_completo', new.raw_user_meta_data->>'full_name', 'Usuário AgroGB');
  
  -- 2. Tentar pegar a permissao (role) 
  -- O App Desktop manda 'AGRICULTOR', 'AGRONOMO', 'ADMIN'. 
  -- O Mobile mandava 'CLIENTE' ou 'PENDENTE'.
  user_role := COALESCE(new.raw_user_meta_data->>'role', 'AGRICULTOR');
  
  -- Se por acaso a role for a antiga do mobile, normalizamos.
  IF user_role = 'CLIENTE' THEN
      user_role := 'AGRICULTOR';
  END IF;
  
  -- 3. Inserir o perfil
  INSERT INTO public.profiles (
    id, 
    email, 
    username, 
    nome_completo, 
    role, 
    status, 
    subscription_plan
  )
  VALUES (
    new.id,
    new.email,
    SPLIT_PART(new.email, '@', 1),
    full_name,
    user_role,
    'active',
    'FREE'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
END;
$$;

-- 2. RECRIAR O GATILHO (Garante que só há 1 e sem duplicidade)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
