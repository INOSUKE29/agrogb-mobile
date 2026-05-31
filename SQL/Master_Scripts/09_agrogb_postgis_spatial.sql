-- ==============================================================================
-- AGROGB - MASTER SCRIPT 09: SPATIAL ARCHITECTURE & POSTGIS
-- Função: Inteligência Geoespacial, Auto-cura de Polígonos, Cálculo de Área e Renderização MVT.
-- Compatibilidade: Supabase + PostGIS 3.0+
-- ==============================================================================

-- 1. GEOMETRY VALIDATION TRIGGER WORKFLOW
-- Auto-cura de geometrias defeituosas desenhadas offline e garantia de RFC 7946 (CCW)
CREATE OR REPLACE FUNCTION public.clean_and_validate_spatial_input()
RETURNS TRIGGER
SET search_path = ''
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.boundary IS NOT NULL THEN
    -- Repair invalid geometries before saving
    IF NOT extensions.ST_IsValid(NEW.boundary) THEN
      NEW.boundary := extensions.ST_MakeValid(NEW.boundary, 'method=structure');
    END IF;
    
    -- Force right-hand rule (Counter-Clockwise) for GeoJSON/Frontend compatibility
    NEW.boundary := extensions.ST_ForcePolygonCCW(NEW.boundary);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_and_repair_fields ON public.fields;
CREATE TRIGGER check_and_repair_fields
BEFORE INSERT OR UPDATE ON public.fields
FOR EACH ROW
EXECUTE FUNCTION public.clean_and_validate_spatial_input();

-- 2. GEODESIC AREA CALCULATION (CÁLCULO DE ÁREA EXATA)
-- Calcula a área do talhão baseada no elipsoide terrestre (em metros quadrados e hectares)
CREATE OR REPLACE FUNCTION public.calculate_field_area_geodesic(field_id UUID)
RETURNS TABLE (
    area_sq_meters DOUBLE PRECISION,
    area_hectares DOUBLE PRECISION
)
SET search_path = ''
LANGUAGE sql
STABLE
AS $$
  SELECT 
    extensions.ST_Area(boundary::extensions.geography, true) as area_sq_meters,
    (extensions.ST_Area(boundary::extensions.geography, true) / 10000.0) as area_hectares
  FROM public.fields
  WHERE id = field_id;
$$;

-- 3. GEOJSON FEATURE COLLECTION RPC
-- Extração direta e otimizada de GeoJSON nativo pelo Postgres
CREATE OR REPLACE FUNCTION public.get_fields_geojson(farm_id UUID)
RETURNS JSONB
SET search_path = ''
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'type', 'FeatureCollection',
    'features', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'type', 'Feature',
          'id', f_row.id,
          'geometry', extensions.ST_AsGeoJSON(f_row.boundary)::JSONB,
          'properties', to_jsonb(f_row) - 'id' - 'boundary' - 'organization_id'
        )
      ), 
      '[]'::JSONB
    )
  )
  FROM (
    SELECT id, nome, area, plant_count, sync_status, boundary 
    FROM public.fields
    WHERE farm_id = get_fields_geojson.farm_id
    -- RLS aplicável: Isolamento Tenant por organização
    AND (
        organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
        OR ((select auth.jwt())->> 'user_role') = 'ADMIN'
    )
  ) f_row;
$$;

-- 4. MAPBOX VECTOR TILE (MVT) GENERATION
-- Geração de Vector Tiles binários de alta performance para MapLibre/Leaflet
CREATE OR REPLACE FUNCTION public.get_mvt_tile(z INTEGER, x INTEGER, y INTEGER)
RETURNS TEXT
SET search_path = ''
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  mvt_output TEXT;
BEGIN
  WITH bounds AS (
    SELECT extensions.ST_TileEnvelope(z, x, y) AS geom
  ),
  mvt_geometries AS (
    SELECT 
      f.id as id,
      f.nome,
      extensions.ST_AsMVTGeom(
        extensions.ST_Transform(f.boundary, 3857), 
        extensions.ST_Transform(b.geom, 3857), 
        4096, 
        64, 
        true
      ) AS geom
    FROM public.fields f
    CROSS JOIN bounds b
    WHERE f.boundary OPERATOR(extensions.&&) extensions.ST_Transform(b.geom, 4326)
    -- Filter security: Isolamento Tenant
    AND (
        f.organization_id = (((select auth.jwt())->> 'organization_id'))::uuid
        OR ((select auth.jwt())->> 'user_role') = 'ADMIN'
    )
  )
  SELECT encode(extensions.ST_AsMVT(mvt_geometries.*, 'fields'), 'base64')
  INTO mvt_output
  FROM mvt_geometries;
  
  RETURN mvt_output;
END;
$$;
