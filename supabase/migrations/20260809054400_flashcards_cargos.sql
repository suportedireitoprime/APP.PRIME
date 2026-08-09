-- Create table for flashcards cargos (editais)
CREATE TABLE IF NOT EXISTS public.flashcards_cargos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cargo TEXT NOT NULL,
    orgao TEXT NOT NULL,
    banca TEXT,
    descricao_geral TEXT,
    edital_disciplinas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.flashcards_cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cargos viewable by everyone" ON public.flashcards_cargos
    FOR SELECT USING (true);

-- Inserir dados mock/iniciais para a PRF
INSERT INTO public.flashcards_cargos (cargo, orgao, banca, descricao_geral, edital_disciplinas)
VALUES (
    'Policial Rodoviário Federal (PRF)',
    'PRF',
    'Cebraspe',
    'A prova da PRF (Bloco III - Direito) exige um domínio absoluto da letra da lei e jurisprudência, com grande peso em Trânsito, Constitucional, Administrativo, Penal e Processo Penal. A banca Cebraspe adota o formato CERTO/ERRADO (uma errada anula uma certa).',
    '[
        {"area": "Legislação de Trânsito", "peso": "Muito Alto", "descricao": "Foco absoluto no CTB e Resoluções do CONTRAN. É a matéria que define o concurso."},
        {"area": "Direito Constitucional", "peso": "Alto", "descricao": "Direitos e Garantias Fundamentais (Art. 5º) e Defesa do Estado e Segurança Pública (Art. 144) despencam nas provas."},
        {"area": "Direito Administrativo", "peso": "Alto", "descricao": "Muita cobrança sobre Atos Administrativos, Poderes da Administração, Organização e Agentes Públicos."},
        {"area": "Direito Penal", "peso": "Alto", "descricao": "Foco nos princípios, crimes contra a pessoa, patrimônio e administração pública."},
        {"area": "Direito Processual Penal", "peso": "Médio", "descricao": "Inquérito policial e provas são as partes mais essenciais da disciplina."},
        {"area": "Direitos Humanos", "peso": "Médio", "descricao": "Histórico, Pacto de San José da Costa Rica e DUDH."}
    ]'::jsonb
);
