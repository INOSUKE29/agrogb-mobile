-- ==============================================================================
-- AGROGB - MASTER SCRIPT 24: TRIGGER FIX
-- Função: Separar funções de trigger para evitar conflitos entre `updated_at` e `last_updated`
-- ==============================================================================

-- 1. Função exclusiva para tabelas com "updated_at" (ex: profiles, organizations)
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 2. Função exclusiva para tabelas com "last_updated" (ex: technical_visits)
CREATE OR REPLACE FUNCTION public.trigger_set_last_updated()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_updated := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- 3. Reaplicar triggers corretamente para as organizações (updated_at)
DROP TRIGGER IF EXISTS set_timestamp_organizations ON public.organizations;
CREATE TRIGGER set_timestamp_organizations
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 4. Reaplicar triggers corretamente para os perfis (updated_at)
DROP TRIGGER IF EXISTS set_timestamp_profiles ON public.profiles;
CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- 5. Reaplicar triggers corretamente para as visitas técnicas (last_updated)
DROP TRIGGER IF EXISTS set_timestamp_technical_visits ON public.technical_visits;
CREATE TRIGGER set_timestamp_technical_visits
    BEFORE UPDATE ON public.technical_visits
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_last_updated();
