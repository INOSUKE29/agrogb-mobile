-- ==========================================
-- SCRIPT: 13_A_agrogb_rbac_granular.sql
-- FASE: 2 (Platform Engineering)
-- OBJETIVO: Implementar Motor Granular de Permissões (Bloco 51)
-- ==========================================

-- LIMPEZA DE ESTRUTURAS ANTIGAS (Para garantir o novo motor)
DROP TABLE IF EXISTS public.role_permissions CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.roles CASCADE;

-- 1. TABELA DE ROLES (CARGOS / PERFIS)
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,          -- Ex: 'admin', 'agronomo_senior', 'tecnico'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PERMISSIONS (PERMISSÕES GRANULARES)
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,          -- Ex: 'view_all_clients', 'edit_prescriptions'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE LIGAÇÃO ROLE <-> PERMISSIONS (MATRIZ)
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. TABELA DE LIGAÇÃO USER <-> ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ==========================================
-- SEED INICIAL (DADOS BASE PARA O SISTEMA NÃO QUEBRAR)
-- ==========================================

-- A) Criar as Roles Básicas do Legado
INSERT INTO public.roles (name, description)
VALUES 
    ('admin', 'Administrador Global do Sistema'),
    ('agronomo', 'Agrônomo Operacional'),
    ('cliente', 'Produtor Rural')
ON CONFLICT (name) DO NOTHING;

-- B) Criar Permissões Iniciais
INSERT INTO public.permissions (name, description)
VALUES 
    ('view_all_clients', 'Ver todos os clientes do sistema'),
    ('manage_users', 'Criar e deletar usuários'),
    ('manage_own_clients', 'Gerenciar clientes vinculados'),
    ('view_own_data', 'Cliente vê apenas seus próprios dados')
ON CONFLICT (name) DO NOTHING;

-- C) Vincular Permissões aos Cargos Padrões
DO $$ 
DECLARE
    role_admin_id UUID;
    role_agro_id UUID;
    perm_view_all UUID;
    perm_manage_users UUID;
    perm_manage_own UUID;
BEGIN
    SELECT id INTO role_admin_id FROM public.roles WHERE name = 'admin';
    SELECT id INTO role_agro_id FROM public.roles WHERE name = 'agronomo';
    
    SELECT id INTO perm_view_all FROM public.permissions WHERE name = 'view_all_clients';
    SELECT id INTO perm_manage_users FROM public.permissions WHERE name = 'manage_users';
    SELECT id INTO perm_manage_own FROM public.permissions WHERE name = 'manage_own_clients';

    -- Admin
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES (role_admin_id, perm_view_all) ON CONFLICT DO NOTHING;
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES (role_admin_id, perm_manage_users) ON CONFLICT DO NOTHING;
    
    -- Agrônomo
    INSERT INTO public.role_permissions (role_id, permission_id) VALUES (role_agro_id, perm_manage_own) ON CONFLICT DO NOTHING;
END $$;

-- ==========================================
-- REESCRITA DAS FUNÇÕES DE RLS (MIGRAÇÃO TRANSPARENTE)
-- ==========================================

-- Agora o RLS do Supabase pergunta para a nova matriz de permissões!

-- 1. Nova função is_admin() lendo a permissão "view_all_clients" ou "manage_users"
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role ILIKE 'admin'
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid() AND p.name = 'view_all_clients'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Função is_agronomo_of_client adaptada para exigir a permissão 'manage_own_clients'
CREATE OR REPLACE FUNCTION public.is_agronomo_of_client(c_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clientes c
    JOIN public.user_roles ur ON ur.user_id = auth.uid()
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE c.id = c_id 
      AND c.agronomo_id = auth.uid()
      AND p.name = 'manage_own_clients'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- ATIVAR RLS NAS NOVAS TABELAS
-- ==========================================
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Regras globais para tabelas de configuração (apenas Admin mexe, todos leem os próprios dados)
CREATE POLICY "Admin manage roles" ON public.roles FOR ALL USING (public.is_admin());
CREATE POLICY "Users view roles" ON public.roles FOR SELECT USING (true);

CREATE POLICY "Admin manage permissions" ON public.permissions FOR ALL USING (public.is_admin());
CREATE POLICY "Users view permissions" ON public.permissions FOR SELECT USING (true);

CREATE POLICY "Admin manage role_perms" ON public.role_permissions FOR ALL USING (public.is_admin());
CREATE POLICY "Users view role_perms" ON public.role_permissions FOR SELECT USING (true);

CREATE POLICY "Admin manage user_roles" ON public.user_roles FOR ALL USING (public.is_admin());
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());
