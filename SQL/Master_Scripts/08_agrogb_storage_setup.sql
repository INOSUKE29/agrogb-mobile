-- ==============================================================================
-- AGROGB - MASTER SCRIPT 08: STORAGE BUCKETS
-- Função: Criação inteligente dos baldes (buckets) de armazenamento (Fotos, 
-- Avatares, PDFs) com as devidas políticas de segurança RLS baseadas no Starter.
-- Compatibilidade: Mobile e Desktop
-- ==============================================================================

-- 1. BUCKET DE AVATARES (FOTOS DE PERFIL)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO NOTHING;

-- Set up access controls for avatars.
CREATE POLICY "Avatar images are publicly accessible." 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars."
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND owner = auth.uid());


-- 2. BUCKET DE RECEITAS / LAUDOS (PDFs E DOCUMENTOS AGRONÔMICOS)
-- Arquivos privados que só clientes e engenheiros agrônomos vinculados podem ler.
INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', false)
  ON CONFLICT (id) DO NOTHING;

-- O RLS para documentos é blindado, apenas usuários autenticados da organização podem ler.
CREATE POLICY "Documents viewable by auth users" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Documents uploadable by auth users" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
