-- ==============================================================================
-- 21 - AGROGB - ALTERAÇÃO V2 CULTURAS (UNIDADES DE MEDIDA)
-- DATA: Junho 2026
-- ==============================================================================

BEGIN;

-- 1. Renomeia a coluna area_ha para quantidade, pois agora pode ser qualquer unidade
DO $$
BEGIN
  IF EXISTS(
    SELECT * FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='v2_culturas' AND column_name='area_ha'
  ) THEN
      ALTER TABLE public.v2_culturas RENAME COLUMN area_ha TO quantidade;
  END IF;
END $$;

-- 2. Adiciona a coluna de unidade de medida (Hectares, Pés, Estufas, m²)
ALTER TABLE public.v2_culturas ADD COLUMN IF NOT EXISTS unidade_medida TEXT DEFAULT 'HA';

COMMIT;
