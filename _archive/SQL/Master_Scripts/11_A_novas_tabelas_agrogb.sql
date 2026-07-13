-- ==============================================================================
-- 🚀 SCRIPT DE ATUALIZAÇÃO DO BANCO DE DADOS AGROGB (PRODUÇÃO)
-- Este script cria todas as tabelas necessárias para suportar os módulos:
-- Catálogo Global (Insumos), Frota, Controle Financeiro e Custos.
-- ==============================================================================

-- 1. TABELA DE CATEGORIAS FINANCEIRAS
-- Usada para o plano de contas (Tipos de Receitas e Despesas)
CREATE TABLE IF NOT EXISTS public.v2_categorias_despesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('DESPESA', 'RECEITA')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE CUSTOS AGRÍCOLAS
-- Usada para registrar despesas atreladas a ciclos de plantio
CREATE TABLE IF NOT EXISTS public.v2_custos_agricolas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ciclo_id UUID, -- Referência futura à tabela de plantios/ciclos
    data_custo DATE NOT NULL,
    categoria_id UUID REFERENCES public.v2_categorias_despesa(id) ON DELETE SET NULL,
    descricao TEXT,
    valor NUMERIC(10, 2) NOT NULL,
    talhoes TEXT[], -- Array de nomes dos talhões afetados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE PRODUTOS / CATÁLOGO E BIBLIOTECA GLOBAL
-- Usada para Insumos, Fertilizantes, Sementes, etc.
CREATE TABLE IF NOT EXISTS public.v2_produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    unidade_medida TEXT NOT NULL,
    observacao TEXT,
    is_global BOOLEAN DEFAULT FALSE,
    status_aprovacao TEXT DEFAULT 'LOCAL', -- LOCAL, PENDENTE_GLOBAL, APROVADO, REJEITADO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELA DE GESTÃO DE FROTA E MÁQUINAS
-- Usada para gerenciar Tratores, Colheitadeiras e Horímetros
CREATE TABLE IF NOT EXISTS public.v2_maquinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    placa TEXT,
    horimetro_atual NUMERIC(10, 2) DEFAULT 0,
    status TEXT DEFAULT 'ATIVO', -- ATIVO, MANUTENÇÃO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 🔒 POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- Permite que os produtores vejam apenas seus próprios dados (e os dados globais)
-- ==============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.v2_categorias_despesa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_custos_agricolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.v2_maquinas ENABLE ROW LEVEL SECURITY;

-- Políticas para Categorias Financeiras
CREATE POLICY "Usuários podem ver suas próprias categorias" 
ON public.v2_categorias_despesa FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar suas próprias categorias" 
ON public.v2_categorias_despesa FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas próprias categorias" 
ON public.v2_categorias_despesa FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas próprias categorias" 
ON public.v2_categorias_despesa FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Custos Agrícolas
CREATE POLICY "Usuários podem ver seus próprios custos" 
ON public.v2_custos_agricolas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar seus próprios custos" 
ON public.v2_custos_agricolas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seus próprios custos" 
ON public.v2_custos_agricolas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar seus próprios custos" 
ON public.v2_custos_agricolas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Máquinas/Frota
CREATE POLICY "Usuários podem ver suas próprias máquinas" 
ON public.v2_maquinas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar suas próprias máquinas" 
ON public.v2_maquinas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar suas próprias máquinas" 
ON public.v2_maquinas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas próprias máquinas" 
ON public.v2_maquinas FOR DELETE USING (auth.uid() = user_id);

-- Políticas para Produtos (Com lógica para Biblioteca Global)
-- O usuário pode ver os próprios itens OU os itens que são globais
CREATE POLICY "Usuários podem ver seus produtos e os globais" 
ON public.v2_produtos FOR SELECT USING (auth.uid() = user_id OR is_global = true);
CREATE POLICY "Usuários podem criar produtos" 
ON public.v2_produtos FOR INSERT WITH CHECK (auth.uid() = user_id);
-- O usuário só pode atualizar/deletar itens se ele for o dono E o item não for global
CREATE POLICY "Usuários podem atualizar seus próprios produtos locais" 
ON public.v2_produtos FOR UPDATE USING (auth.uid() = user_id AND is_global = false);
CREATE POLICY "Usuários podem deletar seus próprios produtos locais" 
ON public.v2_produtos FOR DELETE USING (auth.uid() = user_id AND is_global = false);

-- NOTA PARA O ADM: Como o painel de ADMIN ignora o RLS pela Service Role (ou com políticas avançadas), 
-- ele conseguirá manipular a propriedade 'is_global' e aprovar os produtos pendentes.
