CREATE TABLE IF NOT EXISTS gamificacao_caca_palavras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    materia TEXT NOT NULL,
    nivel TEXT NOT NULL,
    titulo_nivel TEXT NOT NULL,
    qtd_palavras INTEGER NOT NULL,
    dimensoes_grade TEXT NOT NULL,
    foco_tematico TEXT,
    palavras JSONB NOT NULL,
    dicas JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE gamificacao_caca_palavras ENABLE ROW LEVEL SECURITY;

-- Allow public read access (like the other gamificacao tables)
CREATE POLICY "Permitir leitura pública para caca palavras" 
ON gamificacao_caca_palavras 
FOR SELECT 
USING (true);

-- Allow authenticated users to insert/update (or admins, but for now we just need read access)

-- Inserção dos dados Iniciais (Seed da Planilha)
INSERT INTO gamificacao_caca_palavras (materia, nivel, titulo_nivel, qtd_palavras, dimensoes_grade, foco_tematico, palavras, dicas) VALUES
(
    'Crimes Contra a Família', 
    'Nível 1', 
    'Iniciante - Fundamentos do Casamento', 
    6, 
    '10x10', 
    'Conceitos basilares e crimes contra o casamento (Art. 235)', 
    '["BIGAMIA", "CASAMENTO", "CONJUGE", "DOLO", "ENGANO", "NULIDADE"]'::jsonb, 
    '{"BIGAMIA": "Contrair novo casamento sendo previamente casado (art. 235)", "CASAMENTO": "Vínculo conjugal formal resguardado pela legislação penal", "CONJUGE": "Pessoa unida pelo matrimônio civil", "DOLO": "Consciência e vontade indispensáveis para a configuração do tipo", "ENGANO": "Artifício usado para ludibriar o nubente de boa-fé (art. 239)", "NULIDADE": "Efeito civil decorrente de impedimento matrimonial absoluto"}'::jsonb
),
(
    'Crimes Contra a Família', 
    'Nível 2', 
    'Básico - Crimes Contra o Estado de Filiação', 
    9, 
    '12x12', 
    'Filiação, parto suposto e adoção à brasileira (Arts. 241 e 242)', 
    '["FILIACAO", "REGISTRO", "PARTO", "SUPOSTO", "SUBSTITUIR", "ADOCAO", "NOBREZA", "PERDAO", "ALTRUISMO"]'::jsonb, 
    '{"FILIACAO": "Relação jurídica de parentesco entre pais e filhos protegida no Capítulo II", "REGISTRO": "Inscrição civil do nascimento perante o cartório competente (art. 241)", "PARTO": "Fato natural da gestação cuja simulação configura o art. 242", "SUPOSTO": "Modalidade de parto em que a mulher dá parto alheio como próprio", "SUBSTITUIR": "Conduta de trocar o recém-nascido, alterando direito civil", "ADOCAO": "Prática popularmente conhecida como adoção à brasileira (art. 242)", "NOBREZA": "Motivo privilegiado que autoriza a concessão de perdão judicial", "PERDAO": "Causa de extinção da punibilidade admitida no art. 242, parágrafo único", "ALTRUISMO": "Sentimento nobre e desinteressado que ampara o perdão judicial"}'::jsonb
),
(
    'Crimes Contra a Família', 
    'Nível 3', 
    'Intermediário - Assistência Familiar e Abandono', 
    12, 
    '14x14', 
    'Abandono material, intelectual, moral e pensão (Arts. 244 a 247)', 
    '["ABANDONO", "MATERIAL", "SUBSISTENCIA", "PENSAO", "ALIMENTOS", "SOLVENTE", "ENFERMO", "INTELECTUAL", "INSTRUCAO", "ESCOLAR", "HABITUAL", "MENDICANCIA"]'::jsonb, 
    '{"ABANDONO": "Omissão dolosa de deveres legais de amparo e socorro familiar", "MATERIAL": "Crime de deixar de prover a subsistência do dependente (art. 244)", "SUBSISTENCIA": "Recursos indispensáveis para manutenção com dignidade", "PENSAO": "Verba fixada judicialmente cujo inadimplemento injustificado é crime", "ALIMENTOS": "Obrigação legal de sustento material aos dependentes e idosos", "SOLVENTE": "Aquele que possui condições e frustra o pagamento de pensão alimentícia", "ENFERMO": "Descendente ou ascendente gravemente doente que exige socorro", "INTELECTUAL": "Crime de não prover a instrução primária de filho em idade escolar (art. 246)", "INSTRUCAO": "Ensino fundamental básico obrigatório", "ESCOLAR": "Idade de ensino fundamental obrigatório (7 a 14 anos)", "HABITUAL": "Característica da conduta exigida para a falta de frequência ser crime", "MENDICANCIA": "Conduta vedada de utilizar menor para excitar comiseração pública (art. 247)"}'::jsonb
),
(
    'Crimes Contra a Família', 
    'Nível 4', 
    'Avançado - Pátrio Poder, Tutela e Subtração', 
    15, 
    '16x16', 
    'Poder familiar, induzimento a fuga e subtração de menores (Arts. 248 e 249)', 
    '["SUBTRACAO", "INCAPAZ", "INTERDITO", "AUTORIDADE", "GUARDA", "DESTITUIDO", "RESTITUICAO", "MAUSTRATOS", "ARBITRARIA", "SONEGACAO", "INIDONEA", "EXTERIOR", "LUCRO", "PERSONALISSIMA", "PROCEDIBILIDADE"]'::jsonb, 
    '{"SUBTRACAO": "Conduta de retirar o menor de quem legitimamente tem sua guarda (art. 249)", "INCAPAZ": "Pessoa vulnerável sob autoridade, guarda, tutela ou curatela", "INTERDITO": "Pessoa civilmente incapaz equiparada ao menor para proteção penal", "AUTORIDADE": "Poder conferido por lei ou decisão judicial sobre o menor", "GUARDA": "Relação jurídica de vigilância e custódia do incapaz", "DESTITUIDO": "Genitor ou tutor privado do poder familiar que comete o art. 249", "RESTITUICAO": "Devolução voluntária do menor sem maus-tratos que gera perdão judicial", "MAUSTRATOS": "Lesões ou abusos que impedem a aplicação do perdão no art. 249", "ARBITRARIA": "Entrega indevida de menor a outrem sem ordem legítima (art. 248)", "SONEGACAO": "Omissão de entregar o incapaz a quem legitimamente o reclama", "INIDONEA": "Pessoa que oferece perigo moral ou material para a criança (art. 245)", "EXTERIOR": "Qualificadora do envio de menor para fora do país", "LUCRO": "Finalidade econômica que qualifica a entrega ou envio de menor", "PERSONALISSIMA": "Natureza da ação penal que não se transmite aos herdeiros (art. 236)", "PROCEDIBILIDADE": "Condição da sentença definitiva de anulação no cível para o art. 236"}'::jsonb
),
(
    'Crimes Contra a Família', 
    'Nível 5', 
    'Especialista - Desafio Global da Matéria', 
    20, 
    '20x20', 
    'Domínio integral de todos os crimes e conceitos do PDF (Arts. 235 a 249)', 
    '["MONOGAMIA", "POLIAMOR", "IMPEDIMENTO", "SIMULACAO", "FALSIDADE", "IDEOLOGICA", "RECEMNASCIDO", "EXPOSTOS", "ASILO", "PATERNO", "PATRIOPODER", "HOMESCHOOLING", "INCONDICIONADA", "SUBSIDIARIO", "FLAGRANTE", "PRESCRICAO", "CASAMENTO", "FILIACAO", "ASSISTENCIA", "CURATELA"]'::jsonb, 
    '{"MONOGAMIA": "Princípio que rege o casamento civil na ordem jurídica nacional", "POLIAMOR": "União simultânea analisada doutrinariamente frente ao tipo da bigamia", "IMPEDIMENTO": "Causa de nulidade absoluta que obsta novas núpcias", "SIMULACAO": "Farsa em celebração matrimonial ou atribuição de autoridade fictícia", "FALSIDADE": "Natureza do delito de registro civil de nascimento inexistente", "IDEOLOGICA": "Tipo especial de falsidade configurada no art. 241", "RECEMNASCIDO": "Vítima imediata de parto suposto, ocultação ou substituição", "EXPOSTOS": "Menção histórica a abrigos de crianças constante do art. 243", "ASILO": "Estabelecimento de assistência onde se tipifica a sonegação de filiação", "PATERNO": "Dever assistencial e moral decorrente da filiação legítima", "PATRIOPODER": "Poder familiar expressamente protegido no Capítulo IV do Código Penal", "HOMESCHOOLING": "Ensino domiciliar reconhecido como fato atípico no âmbito penal", "INCONDICIONADA": "Ação penal pública que independe de queixa ou representação", "SUBSIDIARIO": "Crime que somente incide se o fato não configurar delito mais grave", "FLAGRANTE": "Característica da consumação nos crimes omissivos permanentes", "PRESCRICAO": "Prazo extintivo que no art. 236 se inicia após sentença anulatória cível", "CASAMENTO": "Primeiro capítulo dos crimes contra a família (arts. 235 a 240)", "FILIACAO": "Segundo capítulo dos crimes contra a família (arts. 241 a 243)", "ASSISTENCIA": "Terceiro capítulo dos crimes contra a família (arts. 244 a 247)", "CURATELA": "Encargo de proteção a incapazes amparado no quarto capítulo (arts. 248 e 249)"}'::jsonb
);
