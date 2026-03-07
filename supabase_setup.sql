-- AGROGB MASTER BACKEND SETUP
-- Execute este script no SQL Editor do Supabase Dashboard (https://supabase.com/dashboard/project/uklygrvibmiknwarzqap/sql)

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA USERS
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome text,
    email text UNIQUE,
    tipo_usuario text, -- ADMIN / OPERADOR
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
    categoria text, -- area, embalagem, insumo, produto, equipamento
    unidade text,   -- KG, LT, CX, SC, UNI, M
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
    produto text, -- Nome do produto colhido
    quantidade numeric,
    tipo text,    -- colheita, congelado, descarte
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
    tipo_movimento text, -- entrada, saida, ajuste, venda, colheita
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

-- Políticas de acesso total (Idempotentes)
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

DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON movimentos_estoque;
CREATE POLICY "Permitir tudo para usuários autenticados" ON movimentos_estoque FOR ALL TO authenticated USING (true);

-- 11. BUCKET DE BACKUP (Deve ser criado manualmente no Dashboard Storage, mas deixamos política aqui)
-- Nome do bucket: agrogb-backups (Private)
