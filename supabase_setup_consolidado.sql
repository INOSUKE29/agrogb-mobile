-- 1. INICIALIZAÇÃO DO ESQUEMA (AGROGB MASTER v8.5)
-- Este código cria toda a estrutura do banco de dados.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TABELAS
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text,
    email text UNIQUE,
    tipo_usuario text, 
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS areas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text,
    metragem numeric,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo text UNIQUE,
    nome text,
    categoria text,
    unidade text,
    last_updated timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clientes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text,
    telefone text,
    cidade text,
    last_updated timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS colheitas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id uuid REFERENCES areas(id),
    produto text,
    quantidade numeric,
    data_colheita date,
    last_updated timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id uuid REFERENCES clientes(id),
    produto_id uuid REFERENCES items(id),
    quantidade numeric,
    valor numeric,
    data_venda date,
    last_updated timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estoque (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id uuid REFERENCES items(id) UNIQUE,
    quantidade numeric,
    last_updated timestamp DEFAULT now()
);

-- RLS E POLÍTICAS (CORREÇÃO DE ERRO 42710)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE colheitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Repita este bloco para cada tabela se quiser ser extra seguro, ou use DROP manual:
    DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON users;
    CREATE POLICY "Permitir tudo para usuários autenticados" ON users FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON areas;
    CREATE POLICY "Permitir tudo para usuários autenticados" ON areas FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON items;
    CREATE POLICY "Permitir tudo para usuários autenticados" ON items FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON clientes;
    CREATE POLICY "Permitir tudo para usuários autenticados" ON clientes FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON colheitas;
    CREATE POLICY "Permitir tudo para usuários autenticados" ON colheitas FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON vendas;
    CREATE POLICY "Permitir tudo para usuários autenticados" ON vendas FOR ALL TO authenticated USING (true);
    
    DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON estoque;
    CREATE POLICY "Permitir tudo para usuários autenticados" ON estoque FOR ALL TO authenticated USING (true);
END $$;
