CREATE TABLE IF NOT EXISTS public.mensagens_suporte_respostas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mensagem_id UUID REFERENCES public.mensagens_suporte(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    mensagem TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mensagens_suporte_respostas ENABLE ROW LEVEL SECURITY;

-- Policy 1: Usuários podem ver as respostas dos seus próprios tickets
CREATE POLICY "Users can view replies to their messages" ON public.mensagens_suporte_respostas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.mensagens_suporte ms 
            WHERE ms.id = mensagens_suporte_respostas.mensagem_id AND ms.user_id = auth.uid()
        )
    );

-- Policy 2: Usuários podem inserir respostas nos seus próprios tickets
CREATE POLICY "Users can insert replies to their messages" ON public.mensagens_suporte_respostas
    FOR INSERT WITH CHECK (
        sender_type = 'user' AND 
        EXISTS (
            SELECT 1 FROM public.mensagens_suporte ms 
            WHERE ms.id = mensagens_suporte_respostas.mensagem_id AND ms.user_id = auth.uid()
        )
    );

-- Policy 3: Admins tem acesso total (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "Admins have full access to respostas" ON public.mensagens_suporte_respostas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.perfis WHERE id = auth.uid() AND role = 'admin'
        )
    );
