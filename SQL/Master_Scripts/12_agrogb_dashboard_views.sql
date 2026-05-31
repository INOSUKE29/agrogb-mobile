-- ==============================================================================
-- AGROGB - MASTER SCRIPT 12: DASHBOARD MATERIALIZED VIEWS
-- Função: Agregação e cálculos de alta performance para o Desktop (ui_adm).
-- Compatibilidade: Desktop App (Python) / Supabase REST
-- ==============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_dashboard_agromarketing AS
SELECT 
    f.organization_id,
    COUNT(DISTINCT fi.id) as total_talhoes,
    -- Função ST_Area para extrair Hectares baseados no globo terrestre WGS84
    COALESCE(SUM(extensions.ST_Area(fi.boundary::extensions.geography, true) / 10000), 0) as area_total_hectares
FROM public.farms f
LEFT JOIN public.fields fi ON f.id = fi.farm_id
GROUP BY f.organization_id;

-- Index único necessário para atualizar a view de forma concorrente sem travar leituras (REFRESH MATERIALIZED VIEW CONCURRENTLY)
CREATE UNIQUE INDEX idx_mv_dashboard_org ON public.mv_dashboard_agromarketing (organization_id);

-- Para manter atualizada, podemos plugar um pg_cron para rodar a cada X horas,
-- ou disparar o REFRESH após as inserções de eventos da fila do Mobile.
