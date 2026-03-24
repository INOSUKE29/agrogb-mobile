-- database/seed/all_seeds.sql
-- AGROGB DIAMOND PRO - Camada de Sementes (Seed) V10.5.1 🌱
SET search_path TO public;

DO $$ 
BEGIN
    -- Inserção de dados básicos sem quebrar caso já existam
    INSERT INTO public.cadastro (nome, unidade, categoria)
    VALUES 
        ('Fertilizante NPK 10-10-10', 'KG', 'INSUMO'),
        ('Ureia Agrícola', 'KG', 'INSUMO'),
        ('Semente de Milho Tradicional', 'KG', 'SEMENTE')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Sistema semeado com insumos básicos. 🌱🚀';
END $$;
