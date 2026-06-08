-- Correção/Restauração de RLS para public.global_library_submissions

ALTER TABLE public.global_library_submissions
  ENABLE ROW LEVEL SECURITY;

-- =========================
-- Admin - SELECT
-- =========================
DROP POLICY IF EXISTS "Admin_Select_Submissions"
ON public.global_library_submissions;

CREATE POLICY "Admin_Select_Submissions"
ON public.global_library_submissions
FOR SELECT
USING (public.is_admin());

-- =========================
-- User - INSERT
-- =========================
DROP POLICY IF EXISTS "User_Insert_Submissions"
ON public.global_library_submissions;

CREATE POLICY "User_Insert_Submissions"
ON public.global_library_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- =========================
-- User - SELECT
-- =========================
DROP POLICY IF EXISTS "User_Select_Submissions"
ON public.global_library_submissions;

CREATE POLICY "User_Select_Submissions"
ON public.global_library_submissions
FOR SELECT
USING (auth.uid() = user_id);

-- =========================
-- Admin - UPDATE
-- =========================
DROP POLICY IF EXISTS "Admin_Update_Submissions"
ON public.global_library_submissions;

CREATE POLICY "Admin_Update_Submissions"
ON public.global_library_submissions
FOR UPDATE
USING (public.is_admin());
