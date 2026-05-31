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
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
  full_name TEXT;
BEGIN
  -- 1. Tentar pegar o nome (usado pelo app Desktop na criacao manual)
  -- Fallback para o nome do Mobile ou um padrao caso venha vazio
  full_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'nome_completo', 'Usuário AgroGB');
  
  -- 2. Tentar pegar a permissao (role) 
  user_role := COALESCE(new.raw_user_meta_data->>'role', new.raw_user_meta_data->>'nivel', 'CLIENTE');
  
  -- Normaliza nomes antigos/minúsculos para o padrão UPPERCASE
  IF UPPER(user_role) IN ('ADMIN', 'AGRONOMO', 'CLIENTE', 'AGRICULTOR') THEN
      user_role := UPPER(user_role);
      IF user_role = 'AGRICULTOR' THEN
          user_role := 'CLIENTE'; -- Normaliza internamente para a role CLIENTE
      END IF;
  ELSE
      user_role := 'CLIENTE';
  END IF;
  
  -- 3. Inserir o perfil. Adaptado para as colunas reais da tabela 'profiles' atual.
  -- Usamos o CAST (::public.user_role) porque a coluna no banco é do tipo ENUM customizado.
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role
  )
  VALUES (
    new.id,
    new.email,
    full_name,
    user_role::public.user_role
  )
  ON CONFLICT (id) DO UPDATE 
    SET 
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role;
  
  RETURN new;
END;
$$;

-- 2. RECRIAR O GATILHO (Garante que só há 1 e sem duplicidade)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
