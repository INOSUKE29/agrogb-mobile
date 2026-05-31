-- ==============================================================================
-- AGROGB - AUTH HOOKS & JWT HELPERS (CORRIGIDO)
-- ==============================================================================

-- 1) Helpers para RLS (agora em public, sem depender do schema auth)
CREATE OR REPLACE FUNCTION public.jwt_role()
RETURNS TEXT 
SET search_path = ''
AS $$
  SELECT NULLIF(
    (current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->>'role',
    ''
  )::TEXT;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.jwt_org()
RETURNS UUID 
SET search_path = ''
AS $$
  SELECT NULLIF(
    (current_setting('request.jwt.claims', true)::jsonb)->'app_metadata'->>'organization_id',
    ''
  )::UUID;
$$ LANGUAGE SQL STABLE;

-- 2) Hook Custom Access Token (injeta claims no app_metadata)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  claims jsonb;
  user_role text;
  user_org_id uuid;
  user_id uuid;
BEGIN
  -- user_id vindo do evento
  user_id := (event->>'user_id')::uuid;

  -- Busca dados oficiais no seu perfil
  -- (ajuste as colunas se o seu schema diferir)
  SELECT p.role, p.organization_id
    INTO user_role, user_org_id
  FROM public.profiles p
  WHERE p.id = user_id;

  claims := event->'claims';

  -- Se app_metadata não existir, cria
  IF jsonb_typeof(claims->'app_metadata') IS NULL THEN
    claims := jsonb_set(claims, '{app_metadata}', '{}', true);
  END IF;

  -- Injeta ROLE
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata,role}', to_jsonb(user_role), true);
  END IF;

  -- Injeta organization_id
  IF user_org_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_metadata,organization_id}', to_jsonb(user_org_id), true);
  END IF;

  -- Atualiza event
  event := jsonb_set(event, '{claims}', claims, true);
  RETURN event;
END;
$$;

-- 3) Permissões para o hook (conforme docs: apenas supabase_auth_admin pode executar)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

GRANT SELECT ON public.profiles TO supabase_auth_admin;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) FROM authenticated, anon, public;

-- (Opcional, mas comum) não deixar roles comuns executarem seus helpers
REVOKE EXECUTE ON FUNCTION public.jwt_role() FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.jwt_org() FROM authenticated, anon, public;