-- Migration 5: RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plantings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agronomist_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agronomist_client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Usuário vê o próprio perfil" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Usuário edita o próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Farms
CREATE POLICY "Dono acessa sua farm" ON public.farms FOR ALL USING (auth.uid() = owner_id);

-- Fields & Plantings
CREATE POLICY "Dono acessa fields da farm" ON public.fields FOR ALL USING (
    EXISTS (SELECT 1 FROM public.farms WHERE farms.id = fields.farm_id AND farms.owner_id = auth.uid())
);
CREATE POLICY "Dono acessa plantings" ON public.plantings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.fields 
        JOIN public.farms ON farms.id = fields.farm_id 
        WHERE fields.id = plantings.field_id AND farms.owner_id = auth.uid()
    )
);

-- Vínculos
CREATE POLICY "Ver links envolvidos" ON public.agronomist_client_links FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = agronomist_id
);

-- Recomendações
CREATE POLICY "Cliente ou Agrônomo veem recomendação" ON public.recommendations FOR SELECT USING (
    auth.uid() = client_id OR auth.uid() = agronomist_id
);
CREATE POLICY "Agrônomo cria recomendação" ON public.recommendations FOR INSERT WITH CHECK (
    auth.uid() = agronomist_id
);
