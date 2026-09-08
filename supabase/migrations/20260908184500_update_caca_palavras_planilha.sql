-- Atualização dos níveis do Caça-Palavras conforme a nova planilha oficial

DELETE FROM public.gamificacao_caca_palavras WHERE materia = 'Crimes Contra a Família';

INSERT INTO public.gamificacao_caca_palavras (materia, nivel, titulo_nivel, qtd_palavras, dimensoes_grade, foco_tematico, palavras, dicas) VALUES
(
    'Crimes Contra a Família', 
    'Nível 1', 
    'Casamento e Bigamia (Art. 235)', 
    4, 
    '8x8', 
    'Casamento e Bigamia (Art. 235)', 
    '["BIGAMIA", "CONJUGE", "DOLO", "ENGANO"]'::jsonb, 
    '{}'::jsonb
),
(
    'Crimes Contra a Família', 
    'Nível 2', 
    'Estado de Filiação (Arts. 241 e 242)', 
    6, 
    '10x10', 
    'Estado de Filiação (Arts. 241 e 242)', 
    '["FILIACAO", "REGISTRO", "PARTO", "SUPOSTO", "ADOCAO", "NOBREZA"]'::jsonb, 
    '{}'::jsonb
),
(
    'Crimes Contra a Família', 
    'Nível 3', 
    'Assistência Familiar e Abandono (Arts. 244 a 247)', 
    8, 
    '12x12', 
    'Assistência Familiar e Abandono (Arts. 244 a 247)', 
    '["ABANDONO", "MATERIAL", "PENSAO", "ALIMENTOS", "ENFERMO", "ESCOLAR", "HABITUAL", "SOLVENTE"]'::jsonb, 
    '{}'::jsonb
),
(
    'Crimes Contra a Família', 
    'Nível 4', 
    'Pátrio Poder, Tutela e Subtração (Arts. 248 e 249)', 
    11, 
    '14x14', 
    'Pátrio Poder, Tutela e Subtração (Arts. 248 e 249)', 
    '["SUBTRACAO", "INCAPAZ", "INTERDITO", "GUARDA", "RESTITUICAO", "SONEGACAO", "INIDONEA", "EXTERIOR", "LUCRO", "DESTITUIDO", "AUTORIDADE"]'::jsonb, 
    '{}'::jsonb
),
(
    'Crimes Contra a Família', 
    'Nível 5', 
    'Desafio Geral da Matéria (Arts. 235 a 249)', 
    15, 
    '16x16', 
    'Desafio Geral da Matéria (Arts. 235 a 249)', 
    '["MONOGAMIA", "IMPEDIMENTO", "SIMULACAO", "FALSIDADE", "IDEOLOGICA", "RECEMNASCIDO", "ASILO", "PATRIOPODER", "HOMESCHOOLING", "SUBSIDIARIO", "FLAGRANTE", "PRESCRICAO", "ASSISTENCIA", "CURATELA", "POLIAMOR"]'::jsonb, 
    '{}'::jsonb
);
