CREATE TABLE IF NOT EXISTS public.simulado_exams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.simulados (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES public.simulado_exams(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    prova_url TEXT,
    gabarito_url TEXT,
    edital_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.simulado_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    simulado_id UUID REFERENCES public.simulados(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_comment TEXT,
    incorrect_comment TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.simulado_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulado_questions ENABLE ROW LEVEL SECURITY;

-- Select policies for authenticated users
CREATE POLICY "Enable read access for authenticated users on simulado_exams"
    ON public.simulado_exams FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users on simulados"
    ON public.simulados FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable read access for authenticated users on simulado_questions"
    ON public.simulado_questions FOR SELECT
    TO authenticated
    USING (true);

-- Insert into storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('simulados', 'simulados', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Simulados bucket public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'simulados');

CREATE POLICY "Simulados bucket insert for authenticated"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'simulados' AND auth.role() = 'authenticated');
