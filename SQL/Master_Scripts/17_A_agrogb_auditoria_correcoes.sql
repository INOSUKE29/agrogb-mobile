-- ============================================================================== 
-- 17_A - AGROGB - AUDITORIA CORREÇÕES (ERROS 001 A 005)
-- DATA: Junho 2026
-- ============================================================================== 

-- 1. CORREÇÃO DA TABELA V2_TALHOES
CREATE TABLE IF NOT EXISTS public.v2_talhoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    area DECIMAL(10, 3) NOT NULL,
    tipo_solo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.v2_talhoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura_v2_talhoes" ON public.v2_talhoes;
CREATE POLICY "Leitura_v2_talhoes" ON public.v2_talhoes
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Escrita_v2_talhoes" ON public.v2_talhoes;
CREATE POLICY "Escrita_v2_talhoes" ON public.v2_talhoes
FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Atualizacao_v2_talhoes" ON public.v2_talhoes;
CREATE POLICY "Atualizacao_v2_talhoes" ON public.v2_talhoes
FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Exclusao_v2_talhoes" ON public.v2_talhoes;
CREATE POLICY "Exclusao_v2_talhoes" ON public.v2_talhoes
FOR DELETE
USING (user_id = auth.uid() OR public.is_admin());

-- 2. EXPANSÃO DA TABELA V2_PRODUTOS
CREATE TABLE IF NOT EXISTS public.v2_produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    unidade_medida TEXT,
    fabricante TEXT,
    modo_aplicacao TEXT,
    composicao_npk TEXT,
    principio_ativo TEXT,
    dose_recomendada TEXT,
    ficha_pdf_url TEXT,
    bula_pdf_url TEXT,
    observacao TEXT,
    is_global BOOLEAN DEFAULT FALSE,
    status_aprovacao TEXT DEFAULT 'LOCAL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS fabricante TEXT;
ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS modo_aplicacao TEXT;
ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS composicao_npk TEXT;
ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS principio_ativo TEXT;
ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS dose_recomendada TEXT;
ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS ficha_pdf_url TEXT;
ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS bula_pdf_url TEXT;
ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT FALSE;
ALTER TABLE public.v2_produtos ADD COLUMN IF NOT EXISTS status_aprovacao TEXT DEFAULT 'LOCAL';

ALTER TABLE public.v2_produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura_v2_produtos" ON public.v2_produtos;
CREATE POLICY "Leitura_v2_produtos" ON public.v2_produtos
FOR SELECT
USING (is_global = TRUE OR user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Escrita_v2_produtos" ON public.v2_produtos;
CREATE POLICY "Escrita_v2_produtos" ON public.v2_produtos
FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Atualizacao_v2_produtos" ON public.v2_produtos;
CREATE POLICY "Atualizacao_v2_produtos" ON public.v2_produtos
FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Exclusao_v2_produtos" ON public.v2_produtos;
CREATE POLICY "Exclusao_v2_produtos" ON public.v2_produtos
FOR DELETE
USING (user_id = auth.uid() OR public.is_admin());

-- 3. TABELA DE SUBMISSÕES PARA BIBLIOTECA GLOBAL
CREATE TABLE IF NOT EXISTS public.global_library_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    produto_id UUID REFERENCES public.v2_produtos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    categoria TEXT NOT NULL,
    unidade_medida TEXT,
    fabricante TEXT,
    modo_aplicacao TEXT,
    composicao_npk TEXT,
    principio_ativo TEXT,
    dose_recomendada TEXT,
    observacao TEXT,
    status TEXT DEFAULT 'PENDENTE_GLOBAL',
    review_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    review_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.global_library_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura_Submissions" ON public.global_library_submissions;
CREATE POLICY "Leitura_Submissions" ON public.global_library_submissions
FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Escrita_Submissions" ON public.global_library_submissions;
CREATE POLICY "Escrita_Submissions" ON public.global_library_submissions
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Atualizacao_Submissions" ON public.global_library_submissions;
CREATE POLICY "Atualizacao_Submissions" ON public.global_library_submissions
FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Exclusao_Submissions" ON public.global_library_submissions;
CREATE POLICY "Exclusao_Submissions" ON public.global_library_submissions
FOR DELETE
USING (user_id = auth.uid() OR public.is_admin());

-- 4. TABELA DE AUDITORIA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura_AuditLogs" ON public.audit_logs;
CREATE POLICY "Leitura_AuditLogs" ON public.audit_logs
FOR SELECT
USING (actor_id = auth.uid() OR target_user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Escrita_AuditLogs" ON public.audit_logs;
CREATE POLICY "Escrita_AuditLogs" ON public.audit_logs
FOR INSERT
WITH CHECK (actor_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "Atualizacao_AuditLogs" ON public.audit_logs;
CREATE POLICY "Atualizacao_AuditLogs" ON public.audit_logs
FOR UPDATE
USING (FALSE);

DROP POLICY IF EXISTS "Exclusao_AuditLogs" ON public.audit_logs;
CREATE POLICY "Exclusao_AuditLogs" ON public.audit_logs
FOR DELETE
USING (FALSE);

-- Ajustes em profiles
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_access TIMESTAMPTZ;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ATIVO';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'BASICO';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS empresa TEXT;
  END IF;
END $$;

-- ============================================================================== 
-- FIM
-- ============================================================================== 
