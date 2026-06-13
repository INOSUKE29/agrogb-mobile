-- ==============================================================================
-- AGROGB - MASTER SCRIPT 13: TECHNICAL VISITS E RPC DE CONVITE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0) FUNÇÃO DE TRIGGER (corrigido: garantir que existe antes do trigger)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Atualiza apenas o campo de auditoria de "última modificação"
  NEW.last_updated := timezone('utc'::text, now());
  RETURN NEW;
END;
$$;


-- 1. TABELA DE VISITAS TÉCNICAS (PADRÃO ENTITIES V2)
CREATE TABLE IF NOT EXISTS public.technical_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    agronomist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING'
      CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED')),
    source_platform TEXT NOT NULL DEFAULT 'desktop'
      CHECK (source_platform IN ('mobile', 'desktop', 'api', 'system')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sync_status INT NOT NULL DEFAULT 1
);

ALTER TABLE public.technical_visits ENABLE ROW LEVEL SECURITY;

-- As Políticas RLS foram transferidas para 04_agrogb_rls_policies.sql 
-- para respeitar a centralização e otimização de performance (initPlan cache).

DROP TRIGGER IF EXISTS set_timestamp_technical_visits ON public.technical_visits;
CREATE TRIGGER set_timestamp_technical_visits
    BEFORE UPDATE ON public.technical_visits
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();


-- 2. FUNÇÃO RPC PARA ACEITE DE CONVITE (LADO SERVIDOR BLINDADO)
CREATE OR REPLACE FUNCTION public.accept_agronomist_invite(invite_code_input TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agronomist_id UUID;
    v_client_role TEXT;
BEGIN
    -- Validar se quem chama é CLIENTE (Lendo claim customizada otimizada)
    v_client_role := current_setting('request.jwt.claim.user_role', true);
    IF v_client_role IS NULL THEN
        -- Fallback seguro caso o setting falhe (Supabase context)
        v_client_role := (select auth.jwt())->> 'user_role';
    END IF;

    IF v_client_role != 'CLIENTE' THEN
        RAISE EXCEPTION 'Apenas contas do tipo CLIENTE podem aceitar convites.';
    END IF;

    -- Encontrar o agrônomo pelo código
    SELECT agronomist_id INTO v_agronomist_id
    FROM public.agronomist_codes
    WHERE invite_code = invite_code_input;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Código de consultor inválido ou inexistente.';
    END IF;

    -- Criar ou Reativar o Vínculo 
    INSERT INTO public.agronomist_client_links (
        agronomist_id, client_id, status, approved_at, sync_status, created_at, last_updated
    ) VALUES (
        v_agronomist_id, (select auth.uid()), 'ACTIVE', timezone('utc'::text, now()), 0, timezone('utc'::text, now()), timezone('utc'::text, now())
    ) ON CONFLICT (agronomist_id, client_id) DO UPDATE SET 
        status = 'ACTIVE',
        approved_at = timezone('utc'::text, now()),
        last_updated = timezone('utc'::text, now()),
        sync_status = 0; 

    RETURN true;
END;
$$;