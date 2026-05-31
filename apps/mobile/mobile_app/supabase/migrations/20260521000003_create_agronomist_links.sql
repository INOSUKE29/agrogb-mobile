-- Migration 3: Códigos de Convite e Vínculos
CREATE TABLE IF NOT EXISTS public.agronomist_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agronomist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.agronomist_client_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agronomist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status link_status DEFAULT 'PENDING',
    permissions JSONB DEFAULT '{}'::jsonb,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(agronomist_id, client_id)
);
