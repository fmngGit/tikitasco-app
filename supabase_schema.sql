-- Supabase Schema for TikiTasco SaaS

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Global Locations
CREATE TABLE global_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    morada TEXT,
    preco_hora NUMERIC,
    preco_bola NUMERIC,
    preco_coletes NUMERIC,
    tipo_piso TEXT,
    indoor NUMERIC DEFAULT 0,
    balnearios NUMERIC DEFAULT 0,
    tipo_futebol TEXT,
    fotos_url TEXT,
    registado_por TEXT,
    telefone TEXT,
    email TEXT,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Groups (Tenants)
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Users (Extending Supabase Auth)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    avatar_url TEXT,
    is_guest BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Group Members
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT REFERENCES public.users(email) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- owner, admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_email, group_id)
);

-- 5. Games
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    res_a NUMERIC DEFAULT 0,
    res_b NUMERIC DEFAULT 0,
    equipa_a JSONB DEFAULT '[]'::jsonb,
    equipa_b JSONB DEFAULT '[]'::jsonb,
    session_id TEXT,
    session_type TEXT DEFAULT 'standard',
    video_file_id TEXT,
    video_download_url TEXT,
    video_expiry_date TIMESTAMP WITH TIME ZONE,
    round_number NUMERIC DEFAULT 1,
    field_cost NUMERIC DEFAULT 0,
    fee NUMERIC DEFAULT 0,
    location_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Votes
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_email TEXT REFERENCES public.users(email) ON DELETE CASCADE,
    target_email TEXT REFERENCES public.users(email) ON DELETE CASCADE,
    ataque NUMERIC DEFAULT 50,
    defesa NUMERIC DEFAULT 50,
    fisico NUMERIC DEFAULT 50,
    passe NUMERIC DEFAULT 50,
    guarda_redes NUMERIC DEFAULT 50,
    fairplay NUMERIC DEFAULT 50,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(voter_email, target_email)
);

-- 7. Expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    descricao TEXT NOT NULL,
    valor NUMERIC NOT NULL,
    foto_url TEXT,
    registado_por TEXT REFERENCES public.users(email) ON DELETE SET NULL,
    valor_caixa NUMERIC,
    contribuicoes_diretas JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Polls
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    target_week TEXT NOT NULL,
    user_email TEXT REFERENCES public.users(email) ON DELETE CASCADE,
    monday JSONB DEFAULT '[]'::jsonb,
    tuesday JSONB DEFAULT '[]'::jsonb,
    wednesday JSONB DEFAULT '[]'::jsonb,
    thursday JSONB DEFAULT '[]'::jsonb,
    locations JSONB DEFAULT '[]'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, target_week, user_email)
);

-- 9. Player Stats View (Calculated on the fly for Leaderboard)
-- This view aggregates games and votes to provide the overall stats
CREATE OR REPLACE VIEW player_stats AS
SELECT 
    u.email AS "Email",
    u.nome AS "Nome",
    u.avatar_url AS "Avatar",
    u.is_guest AS "IsGuest",
    (SELECT count(*) FROM votes v WHERE v.target_email = u.email) AS "TotalVotos",
    COALESCE((SELECT round(avg(ataque)) FROM votes v WHERE v.target_email = u.email), 0) AS "Ataque",
    COALESCE((SELECT round(avg(defesa)) FROM votes v WHERE v.target_email = u.email), 0) AS "Defesa",
    COALESCE((SELECT round(avg(fisico)) FROM votes v WHERE v.target_email = u.email), 0) AS "Fisico",
    COALESCE((SELECT round(avg(passe)) FROM votes v WHERE v.target_email = u.email), 0) AS "Passe",
    COALESCE((SELECT round(avg(guarda_redes)) FROM votes v WHERE v.target_email = u.email), 0) AS "Guarda_Redes",
    COALESCE((SELECT round(avg(fairplay)) FROM votes v WHERE v.target_email = u.email), 0) AS "Fairplay",
    
    -- Win/Loss/Draw calculations
    (SELECT count(*) FROM games g WHERE 
        (u.email IN (SELECT jsonb_array_elements_text(equipa_a)) AND g.res_a > g.res_b) OR
        (u.email IN (SELECT jsonb_array_elements_text(equipa_b)) AND g.res_b > g.res_a)
    ) AS "Vitorias",
    (SELECT count(*) FROM games g WHERE 
        (u.email IN (SELECT jsonb_array_elements_text(equipa_a)) AND g.res_a = g.res_b) OR
        (u.email IN (SELECT jsonb_array_elements_text(equipa_b)) AND g.res_b = g.res_a)
    ) AS "Empates",
    (SELECT count(*) FROM games g WHERE 
        (u.email IN (SELECT jsonb_array_elements_text(equipa_a)) AND g.res_a < g.res_b) OR
        (u.email IN (SELECT jsonb_array_elements_text(equipa_b)) AND g.res_b < g.res_a)
    ) AS "Derrotas",
    (SELECT count(*) FROM games g WHERE 
        u.email IN (SELECT jsonb_array_elements_text(equipa_a)) OR
        u.email IN (SELECT jsonb_array_elements_text(equipa_b))
    ) AS "Jogos_Jogados"
FROM public.users u;

-- RLS Policies (Row Level Security) - Basic Setup for SPA
-- In a real production setup with Supabase Auth, we'd use `auth.uid()` and match with `group_members`.
-- Since we are migrating from a system where any logged-in user can read/write everything (for now),
-- we will enable RLS but allow authenticated users to interact with the data.

ALTER TABLE global_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON global_locations FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON global_locations FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON groups FOR SELECT USING (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON public.users FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON games FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON games FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON votes FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON votes FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON expenses FOR ALL USING (auth.role() = 'authenticated');

ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON polls FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users" ON polls FOR ALL USING (auth.role() = 'authenticated');

-- Storage Bucket Policies (tikitasco-storage)
CREATE POLICY "Allow Public Read on tikitasco-storage" ON storage.objects FOR SELECT USING (bucket_id = 'tikitasco-storage');
CREATE POLICY "Allow Authenticated Upload on tikitasco-storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'tikitasco-storage' AND auth.role() = 'authenticated');
CREATE POLICY "Allow Authenticated Update on tikitasco-storage" ON storage.objects FOR UPDATE USING (bucket_id = 'tikitasco-storage' AND auth.role() = 'authenticated');
CREATE POLICY "Allow Authenticated Delete on tikitasco-storage" ON storage.objects FOR DELETE USING (bucket_id = 'tikitasco-storage' AND auth.role() = 'authenticated');
