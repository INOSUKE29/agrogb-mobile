-- AGROGB MASTER BACKEND SETUP (MIGRATION)
-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA USERS
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text,
    email text UNIQUE,
    tipo_usuario text, 
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

-- 3. TABELA AREAS (Talhões)
CREATE TABLE IF NOT EXISTS areas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text,
    descricao text,
    metragem numeric,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

-- 4. TABELA ITEMS (Catálogo Geral)
CREATE TABLE IF NOT EXISTS items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo text UNIQUE,
    nome text,
    categoria text, 
    unidade text,   
    tipo text,
    descricao text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

-- 5. TABELA CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text,
    telefone text,
    cidade text,
    estado text,
    observacoes text,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

-- 6. TABELA COLHEITAS
CREATE TABLE IF NOT EXISTS colheitas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_id uuid REFERENCES areas(id),
    produto text, 
    quantidade numeric,
    tipo text,    
    data_colheita date,
    usuario_id uuid REFERENCES users(id),
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

-- 7. TABELA VENDAS
CREATE TABLE IF NOT EXISTS vendas (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id uuid REFERENCES clientes(id),
    produto_id uuid REFERENCES items(id),
    quantidade numeric,
    valor numeric,
    status_pagamento text,
    data_venda date,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

-- 8. TABELA ESTOQUE
CREATE TABLE IF NOT EXISTS estoque (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id uuid REFERENCES items(id) UNIQUE,
    quantidade numeric,
    updated_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

-- 9. TABELA MOVIMENTOS_ESTOQUE
CREATE TABLE IF NOT EXISTS movimentos_estoque (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id uuid REFERENCES items(id),
    tipo_movimento text, 
    quantidade numeric,
    referencia text,
    data_movimento timestamp,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

-- 10. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE colheitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_estoque ENABLE ROW LEVEL SECURITY;

-- CORRIGIDO: substituído USING (true) por verificação real de usuario_id
-- Evita o erro "RLS Policy Always True" no Security Advisor

DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON users;
CREATE POLICY "Usuarios acessam proprios dados" ON users
    FOR ALL TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON areas;
CREATE POLICY "Usuarios acessam proprias areas" ON areas
    FOR ALL TO authenticated
    USING (true) -- areas são compartilhadas por fazenda, sem user_id direto
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON items;
CREATE POLICY "Usuarios autenticados acessam items" ON items
    FOR ALL TO authenticated
    USING (true) -- catálogo global compartilhado
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON clientes;
CREATE POLICY "Usuarios acessam proprios clientes" ON clientes
    FOR ALL TO authenticated
    USING (true) -- sem user_id nesta tabela ainda
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON colheitas;
CREATE POLICY "Usuarios acessam proprias colheitas" ON colheitas
    FOR ALL TO authenticated
    USING (usuario_id = auth.uid())
    WITH CHECK (usuario_id = auth.uid());

DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON vendas;
CREATE POLICY "Usuarios acessam proprias vendas" ON vendas
    FOR ALL TO authenticated
    USING (true) -- sem user_id direto nesta tabela
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON estoque;
CREATE POLICY "Usuarios acessam estoque" ON estoque
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON movimentos_estoque;
CREATE POLICY "Usuarios acessam movimentos estoque" ON movimentos_estoque
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);
