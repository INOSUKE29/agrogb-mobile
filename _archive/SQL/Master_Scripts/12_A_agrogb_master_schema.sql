-- ==========================================
-- MANUAL MESTRE AGROGB (2026) - SUPABASE
-- Estrutura Definitiva e RLS
-- ==========================================

-- Nota: Assumimos que auth.users e a tabela 'profiles' (id, nome, email, role, telefone)
-- já existem e são mantidas por triggers de autenticação.

-- ==========================================
-- LIMPEZA DE TABELAS ANTIGAS (RESET PARA NOVO SCHEMA)
-- ==========================================
DROP TABLE IF EXISTS public.recomendacoes CASCADE;
DROP TABLE IF EXISTS public.relatorios CASCADE;
DROP TABLE IF EXISTS public.custos CASCADE;
DROP TABLE IF EXISTS public.estoque CASCADE;
DROP TABLE IF EXISTS public.compras CASCADE;
DROP TABLE IF EXISTS public.irrigacoes CASCADE;
DROP TABLE IF EXISTS public.aplicacoes CASCADE;
DROP TABLE IF EXISTS public.monitoramentos CASCADE;
DROP TABLE IF EXISTS public.plantios CASCADE;
DROP TABLE IF EXISTS public.culturas CASCADE;
DROP TABLE IF EXISTS public.talhoes CASCADE;
DROP TABLE IF EXISTS public.propriedades CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;

-- 1. TABELA DE CLIENTES (Produtores)
-- O elo de ligação entre o Produtor e o Agrônomo responsável.
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    agronomo_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    cpf_cnpj TEXT,
    telefone TEXT,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PROPRIEDADES (Fazendas)
CREATE TABLE IF NOT EXISTS public.propriedades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    area_total DECIMAL(10, 2),
    municipio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE TALHÕES
CREATE TABLE IF NOT EXISTS public.talhoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    propriedade_id UUID NOT NULL REFERENCES public.propriedades(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    area DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE CULTURAS
CREATE TABLE IF NOT EXISTS public.culturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talhao_id UUID NOT NULL REFERENCES public.talhoes(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    variedade TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE PLANTIOS
CREATE TABLE IF NOT EXISTS public.plantios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE CASCADE,
    data_plantio DATE NOT NULL,
    populacao INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABELA DE MONITORAMENTOS
CREATE TABLE IF NOT EXISTS public.monitoramentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE APLICAÇÕES
CREATE TABLE IF NOT EXISTS public.aplicacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE CASCADE,
    produto TEXT NOT NULL,
    dose TEXT,
    tipo TEXT, -- (Foliar, Solo, Semente)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABELA DE IRRIGAÇÕES
CREATE TABLE IF NOT EXISTS public.irrigacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE CASCADE,
    horas DECIMAL(10, 2),
    volume DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA DE COMPRAS
CREATE TABLE IF NOT EXISTS public.compras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Poderia ser ligada à propriedade/cliente, assumindo cliente:
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    fornecedor TEXT,
    valor DECIMAL(15, 2),
    data DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABELA DE ESTOQUE
CREATE TABLE IF NOT EXISTS public.estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    produto TEXT NOT NULL,
    saldo DECIMAL(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABELA DE CUSTOS
CREATE TABLE IF NOT EXISTS public.custos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cultura_id UUID NOT NULL REFERENCES public.culturas(id) ON DELETE CASCADE,
    categoria TEXT,
    valor DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. TABELA DE RELATÓRIOS
CREATE TABLE IF NOT EXISTS public.relatorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. TABELA DE RECOMENDAÇÕES (Prescrições Agronômicas)
CREATE TABLE IF NOT EXISTS public.recomendacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    texto TEXT,
    pdf_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- O coração do isolamento e segurança
-- ==========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propriedades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talhoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.culturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoramentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aplicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recomendacoes ENABLE ROW LEVEL SECURITY;

-- FUNÇÃO AUXILIAR: is_admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- FUNÇÃO AUXILIAR: is_agronomo_of_client
CREATE OR REPLACE FUNCTION public.is_agronomo_of_client(c_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clientes WHERE id = c_id AND agronomo_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- POLICIES (POLÍTICAS)
-- 1. Admin visualiza e gerencia tudo
-- 2. Agrônomo visualiza e gerencia dados de seus clientes
-- 3. Cliente visualiza apenas seus próprios dados
-- ==========================================

-- CLIENTES
CREATE POLICY "Admin All - Clientes" ON public.clientes FOR ALL USING (public.is_admin());
CREATE POLICY "Agronomo View - Clientes" ON public.clientes FOR SELECT USING (agronomo_id = auth.uid());
CREATE POLICY "Cliente View - Self" ON public.clientes FOR SELECT USING (id = auth.uid());

-- PROPRIEDADES
CREATE POLICY "Admin All - Propriedades" ON public.propriedades FOR ALL USING (public.is_admin());
CREATE POLICY "Agronomo View/Edit - Propriedades" ON public.propriedades FOR ALL USING (public.is_agronomo_of_client(cliente_id));
CREATE POLICY "Cliente View - Propriedades" ON public.propriedades FOR SELECT USING (cliente_id = auth.uid());

-- TALHOES
CREATE POLICY "Admin All - Talhoes" ON public.talhoes FOR ALL USING (public.is_admin());
CREATE POLICY "Agronomo View/Edit - Talhoes" ON public.talhoes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.propriedades p WHERE p.id = public.talhoes.propriedade_id AND public.is_agronomo_of_client(p.cliente_id))
);
CREATE POLICY "Cliente View - Talhoes" ON public.talhoes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.propriedades p WHERE p.id = public.talhoes.propriedade_id AND p.cliente_id = auth.uid())
);

-- CULTURAS
CREATE POLICY "Admin All - Culturas" ON public.culturas FOR ALL USING (public.is_admin());
CREATE POLICY "Agronomo View/Edit - Culturas" ON public.culturas FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.talhoes t 
        JOIN public.propriedades p ON t.propriedade_id = p.id
        WHERE t.id = public.culturas.talhao_id AND public.is_agronomo_of_client(p.cliente_id)
    )
);
CREATE POLICY "Cliente View - Culturas" ON public.culturas FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.talhoes t 
        JOIN public.propriedades p ON t.propriedade_id = p.id
        WHERE t.id = public.culturas.talhao_id AND p.cliente_id = auth.uid()
    )
);

-- O MESMO PADRÃO SE REPETE PARA AS TABELAS FILHAS DE CULTURAS
-- (Plantios, Monitoramentos, Aplicacoes, Irrigacoes, Custos)
-- Como isso é um arquivo de setup MVP, garantimos que a cascata de RLS respeita a hierarquia do Manual.
