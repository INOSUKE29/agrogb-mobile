-- ==============================================================================
-- [11] IOT TIME SERIES (PG_PARTMAN) - sensor_data
-- ==============================================================================

-- Garante que a extensão está instalada
CREATE EXTENSION IF NOT EXISTS pg_partman;

-- (A) Tabela particionada (native Postgres partitions via PARTITION BY)
-- PK deve incluir a coluna de partição em qualquer índice único/PK.
CREATE TABLE IF NOT EXISTS public.sensor_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.fields(id),

  reading_time timestamptz NOT NULL DEFAULT now(),

  temperature numeric(5,2),
  soil_moisture numeric(5,2),

  -- Mantém sua ideia, e garante inclusão da coluna de partição
  PRIMARY KEY (id, reading_time)
) PARTITION BY RANGE (reading_time);

CREATE TABLE IF NOT EXISTS public.sensor_data_template
(LIKE public.sensor_data INCLUDING ALL);

ALTER TABLE public.sensor_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_data_template ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sensor Data - Somente Leitura via API"
ON public.sensor_data
FOR SELECT
USING (true);

-- (B) Registro no pg_partman (idempotente)
DO $$
BEGIN
  -- Se já existe registro em part_config, não chame create_parent de novo
  IF NOT EXISTS (
    SELECT 1
    FROM public.part_config
    WHERE parent_table = 'public.sensor_data'
  ) THEN
    PERFORM public.create_parent(
      p_parent_table    => 'public.sensor_data',
      p_control         => 'reading_time',
      p_type            => 'range',
      p_interval        => '1 month',
      p_premake         => 1,
      p_template_table  => 'public.sensor_data_template'
    );
  END IF;
END $$;

-- (C) Retenção para economizar espaço (idempotente)
UPDATE public.part_config
SET retention = '5 years',
    retention_keep_table = false
WHERE parent_table = 'public.sensor_data';

-- (D) Índices úteis (simples no pai; podem precisar existir também nas partições)
CREATE INDEX IF NOT EXISTS sensor_data_reading_time_idx
  ON public.sensor_data (reading_time DESC);

CREATE INDEX IF NOT EXISTS sensor_data_field_id_idx
  ON public.sensor_data (field_id);

-- (E) Manutenção do pg_partman (criar futuras partições + aplicar retenção)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'pg_partman_sensor_data_maintenance'
  ) THEN
    PERFORM cron.unschedule('pg_partman_sensor_data_maintenance');
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'pg_partman_sensor_data_maintenance',
  '15 * * * *', -- a cada hora, 15 minutos
  $$CALL public.run_maintenance_proc();$$
);
