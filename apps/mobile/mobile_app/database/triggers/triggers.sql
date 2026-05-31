-- database/triggers/triggers.sql
-- AGROGB DIAMOND PRO - Camada de Automação (Triggers) V10.5.2 🤖
SET search_path TO public;

-- 1. Criação de Perfil Automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Timestamp de Atualização Automático
CREATE OR REPLACE FUNCTION public.update_last_updated_column()
RETURNS trigger AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Aplica o trigger de timestamp em tabelas críticas
DO $$
DECLARE
    t TEXT;
BEGIN
    -- CORREÇÃO SÊNIOR: Iterar corretamente sobre o unnest de um array
    FOR t IN SELECT unnest(ARRAY['vendas', 'custos', 'estoque', 'planos_adubacao']::text[]) LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS tr_update_last_updated_%I ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER tr_update_last_updated_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_last_updated_column()', t, t);
    END LOOP;
END $$;
