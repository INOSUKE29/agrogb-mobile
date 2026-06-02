-- ============================================================================== 
-- AGROGB - MASTER SCRIPT 04: RLS POLICIES (Row-Level Security V2)
-- Tenant: organization_id (claim custom)
-- Role: user_role (claim custom) => ADMIN / AGRONOMO / AGRICULTOR / ...
--
-- Ajuste de performance (cache initPlan):
--   auth.uid()  -> (select auth.uid())
--   auth.jwt()  -> (select auth.jwt())
-- ==============================================================================

DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- =============================================================================
-- 0) Habilitar RLS
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 1) PROFILES (possui organization_id)
-- =============================================================================
CREATE POLICY "Profiles - Leitura (prio ou ADMIN)"
ON public.profiles
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

CREATE POLICY "Profiles - Escrita (somente o próprio ou ADMIN)"
ON public.profiles
FOR UPDATE
USING (
  (select auth.uid()) = id
  OR ((select auth.jwt())->> 'user_role') = 'ADMIN'
)
WITH CHECK (
  (select auth.uid()) = id
  OR ((select auth.jwt())->> 'user_role') = 'ADMIN'
);

CREATE POLICY "Profiles - Delete (somente o próprio ou ADMIN)"
ON public.profiles
FOR DELETE
USING (
  (select auth.uid()) = id
  OR ((select auth.jwt())->> 'user_role') = 'ADMIN'
);

CREATE POLICY "Profiles - Insert (somente ADMIN)"
ON public.profiles
FOR INSERT
WITH CHECK (
  ((select auth.jwt())->> 'user_role') = 'ADMIN'
);

-- =============================================================================
-- 2) FARMS (não tem organization_id; deriva via farms.owner_id -> profiles.organization_id)
-- =============================================================================
CREATE POLICY "Farms - Tenant isolation (todas operações)"
ON public.farms
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = farms.owner_id
      AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
  )
  AND ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRONOMO','AGRICULTOR')
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = farms.owner_id
      AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
  )
  AND ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRONOMO','AGRICULTOR')
);

-- =============================================================================
-- 3) FIELDS (não tem organization_id; deriva via fields.farm_id -> farms.owner_id -> profiles.organization_id)
-- =============================================================================
CREATE POLICY "Fields - Tenant isolation (todas operações)"
ON public.fields
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.farms f
    JOIN public.profiles p ON p.id = f.owner_id
    WHERE f.id = fields.farm_id
      AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
  )
  AND ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRONOMO','AGRICULTOR')
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.farms f
    JOIN public.profiles p ON p.id = f.owner_id
    WHERE f.id = fields.farm_id
      AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
  )
  AND ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRONOMO','AGRICULTOR')
);

-- =============================================================================
-- 4) PLANTINGS (não tem organization_id; deriva via plantings.field_id -> fields.farm_id -> profiles.organization_id)
-- =============================================================================
CREATE POLICY "Plantings - Tenant isolation (todas operações)"
ON public.plantings
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.fields fi
    JOIN public.farms f ON f.id = fi.farm_id
    JOIN public.profiles p ON p.id = f.owner_id
    WHERE fi.id = plantings.field_id
      AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
  )
  AND ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRONOMO','AGRICULTOR')
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.fields fi
    JOIN public.farms f ON f.id = fi.farm_id
    JOIN public.profiles p ON p.id = f.owner_id
    WHERE fi.id = plantings.field_id
      AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
  )
  AND ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRONOMO','AGRICULTOR')
);

-- =============================================================================
-- 5) RECOMMENDATIONS
-- =============================================================================
CREATE POLICY "Recommendations - Leitura (ADMIN/AGRONOMO/AGRICULTOR + tenant)"
ON public.recommendations
FOR SELECT
USING (
  ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRONOMO','AGRICULTOR')
  AND (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = recommendations.client_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = recommendations.agronomist_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.farms f
      JOIN public.profiles p ON p.id = f.owner_id
      WHERE f.id = recommendations.farm_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
  )
);

CREATE POLICY "Recommendations - Escrita (AGRONOMO ou ADMIN + tenant)"
ON public.recommendations
FOR ALL
USING (
  ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRONOMO')
  AND (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = recommendations.agronomist_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.farms f
      JOIN public.profiles p ON p.id = f.owner_id
      WHERE f.id = recommendations.farm_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
  )
)
WITH CHECK (
  ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRONOMO')
  AND (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = recommendations.agronomist_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.farms f
      JOIN public.profiles p ON p.id = f.owner_id
      WHERE f.id = recommendations.farm_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
  )
);

-- =============================================================================
-- 6) PRODUCTS (deriva tenant via profiles.owner_id / created_by / updated_by)
-- =============================================================================
CREATE POLICY "Products - Leitura (tenant via owner/created_by/updated_by ou ADMIN)"
ON public.products
FOR SELECT
USING (
  ((select auth.jwt())->> 'user_role') = 'ADMIN'
  OR (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = products.owner_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = products.created_by
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = products.updated_by
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
  )
);

CREATE POLICY "Products - Escrita (ADMIN ou AGRICULTOR + tenant via owner/created_by/updated_by)"
ON public.products
FOR ALL
USING (
  ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRICULTOR')
  AND (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = products.owner_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = products.created_by
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = products.updated_by
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
  )
)
WITH CHECK (
  ((select auth.jwt())->> 'user_role') IN ('ADMIN','AGRICULTOR')
  AND (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = products.owner_id
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = products.created_by
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = products.updated_by
        AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
    )
  )
);

-- =============================================================================
-- 7) AUDIT LOGS (somente ADMIN + tenant via user_id -> profiles.organization_id)
-- =============================================================================
CREATE POLICY "Audit Logs - Somente ADMIN + tenant"
ON public.audit_logs
FOR SELECT
USING (
  ((select auth.jwt())->> 'user_role') = 'ADMIN'
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = audit_logs.user_id
      AND p.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
  )
);