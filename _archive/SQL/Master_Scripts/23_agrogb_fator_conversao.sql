-- Adiciona a coluna fator_conversao para peso da colheita e caixas
ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS fator_conversao NUMERIC(10,3) DEFAULT 1;
