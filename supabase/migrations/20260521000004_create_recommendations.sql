-- Migration 4: Recomendações Técnicas
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agronomist_id UUID NOT NULL REFERENCES public.profiles(id),
    client_id UUID NOT NULL REFERENCES public.profiles(id),
    farm_id UUID NOT NULL REFERENCES public.farms(id),
    field_id UUID REFERENCES public.fields(id),
    planting_id UUID REFERENCES public.plantings(id),
    title TEXT NOT NULL,
    description TEXT,
    application_type TEXT,
    scheduled_date DATE,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
