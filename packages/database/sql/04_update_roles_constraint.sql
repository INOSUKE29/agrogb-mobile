-- Remove a restrição antiga
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Atualiza qualquer perfil que já esteja como CLIENTE para AGRICULTOR
UPDATE public.profiles SET role = 'AGRICULTOR' WHERE role = 'CLIENTE';

-- Cria a nova restrição com a nomenclatura correta
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('AGRICULTOR', 'AGRONOMO', 'ADMIN', 'PENDENTE'));
