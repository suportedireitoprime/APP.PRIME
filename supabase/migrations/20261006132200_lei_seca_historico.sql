CREATE TABLE public.lei_seca_historico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    licao_id UUID REFERENCES public.lei_seca_licoes(id) ON DELETE CASCADE,
    pontuacao INTEGER NOT NULL,
    estrelas INTEGER NOT NULL,
    concluido_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lei_seca_historico_user_licao ON public.lei_seca_historico(user_id, licao_id);

ALTER TABLE public.lei_seca_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own lei_seca_historico" ON public.lei_seca_historico FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own lei_seca_historico" ON public.lei_seca_historico FOR INSERT WITH CHECK (auth.uid() = user_id);
