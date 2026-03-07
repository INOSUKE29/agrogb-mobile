-- AGROGB MASTER BACKEND SETUP (CONSOLIDADO)
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
    id_local integer, -- ID original do banco SQLite (opcional para sync)
    item_id uuid REFERENCES items(id),
    tipo_movimento text, -- entrada, saida, ajuste, venda, colheita
    quantidade numeric,
    referencia text,
    data_movimento timestamp,
    created_at timestamp DEFAULT now(),
    last_updated timestamp DEFAULT now()
);

-- 10. TABELA PLANOS_ADUBACAO (Caderno Agronômico)
CREATE TABLE IF NOT EXISTS planos_adubacao (
    uuid uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_plano text,
    cultura text,
    tipo_aplicacao text, -- GOTEJO, PULVERIZACAO
    area_local text,
    descricao_tecnica text,
    status text, -- PLANEJADO, CONCLUIDO
    data_criacao timestamp DEFAULT now(),
    data_aplicacao timestamp,
    anexos_uri text,
    last_updated timestamp DEFAULT now()
);

-- 11. POLÍTICAS DE SEGURANÇA (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE colheitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentos_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_adubacao ENABLE ROW LEVEL SECURITY;

-- Limpeza e Recriação de Políticas (Refinado para Performance Master)
DO $$ 
DECLARE
    t text;
    -- Lista inclui as tabelas atuais e as LEGADAS (que aparecem nos avisos do seu Supabase)
    tables_list text[] := ARRAY[
        'users', 'areas', 'items', 'clientes', 'colheitas', 'vendas', 'estoque', 
        'movimentos_estoque', 'planos_adubacao', 
        'movimentacoes_financeiras', 'resumo_financeiro_público', 'perfis', 'usuarios'
    ];
BEGIN
    FOREACH t IN ARRAY tables_list LOOP
        -- Verifica se a tabela existe antes de tentar mexer nas políticas
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            
            -- 1. Limpeza Profunda (Remove políticas de TODOS os scripts anteriores)
            EXECUTE format('DROP POLICY IF EXISTS "Permitir tudo para usuários autenticados" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Acesso de leitura para autenticados" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Acesso de escrita para autenticados" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can view own financial data" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can insert own financial data" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Users can update own financial data" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Leitura para autenticados" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Inserção para autenticados" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Atualização para autenticados" ON %I', t);
            EXECUTE format('DROP POLICY IF EXISTS "Exclusão para autenticados" ON %I', t);
            
            -- 2. Recria com Otimização de Performance (SELECT auth.uid())
            -- Leitura
            EXECUTE format('CREATE POLICY "Leitura para autenticados" ON %I FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL)', t);
            -- Inserção
            EXECUTE format('CREATE POLICY "Inserção para autenticados" ON %I FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) IS NOT NULL)', t);
            -- Atualização
            EXECUTE format('CREATE POLICY "Atualização para autenticados" ON %I FOR UPDATE TO authenticated USING ((SELECT auth.uid()) IS NOT NULL) WITH CHECK ((SELECT auth.uid()) IS NOT NULL)', t);
            -- Exclusão
            EXECUTE format('CREATE POLICY "Exclusão para autenticados" ON %I FOR DELETE TO authenticated USING ((SELECT auth.uid()) IS NOT NULL)', t);

        END IF;
    END LOOP;
END $$;

-- 12. CORREÇÕES DE SEGURANÇA (Security Fixes)
-- Garante que views e funções respeitem o RLS e search_path para evitar alertas no Dashboard
DO $$ 
BEGIN
    -- Ajusta segurança da view se ela existir de uma versão anterior
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'financial_summary') THEN
        ALTER VIEW public.financial_summary SET (security_invoker = true);
    END IF;

    -- Ajusta search_path da função principal de resumo financeiro
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_my_financial_summary') THEN
        ALTER FUNCTION public.get_my_financial_summary() SET search_path = public, pg_temp;
    END IF;
END $$;

-- 13. ÍNDICES DE DESEMPENHO (Performance Optimization)
-- Melhora a velocidade de busca e sincronização, eliminando avisos de performance no Dashboard
CREATE INDEX IF NOT EXISTS idx_colheitas_area_id ON colheitas(area_id);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente_id ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_vendas_produto_id ON vendas(produto_id);
CREATE INDEX IF NOT EXISTS idx_movimentestoque_item_id ON movimentos_estoque(item_id);
CREATE INDEX IF NOT EXISTS idx_planos_adubacao_status ON planos_adubacao(status);

-- Índices para Sincronização (Busca rápida por atualizações recentes)
CREATE INDEX IF NOT EXISTS idx_users_updated ON users(last_updated);
CREATE INDEX IF NOT EXISTS idx_areas_updated ON areas(last_updated);
CREATE INDEX IF NOT EXISTS idx_items_updated ON items(last_updated);
CREATE INDEX IF NOT EXISTS idx_vendas_updated ON vendas(last_updated);
CREATE INDEX IF NOT EXISTS idx_estoque_updated ON estoque(last_updated);

-- 14. BUCKET DE BACKUP (Instrução)
-- Nome do bucket: agrogb-backups (Configurar como Private no Dashboard)
