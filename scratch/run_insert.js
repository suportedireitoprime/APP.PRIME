import fs from 'fs';

const SUPABASE_URL = 'https://dnjrgpldcwcpoywamorr.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuanJncGxkY3djcG95d2Ftb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxMTAwMDYsImV4cCI6MjA5OTY4NjAwNn0.6NstK0_f3p8i_Sj3-1_YgK5o1hU1Z9S0Z0k1r2s3t4u';

const posts = [
  // --- CATEGORIA: LEIS (5 POSTS) ---
  {
    id: 'art-leis-01',
    titulo: 'Quem Cria as Leis no Brasil: As 7 Etapas do Processo Legislativo Desvendadas',
    categoria: 'Leis',
    resumo: 'Entenda passo a passo como uma lei é criada no Brasil: da iniciativa de lei aos quóruns de votação, sanção, veto, promulgação e vacatio legis segundo a CF/88.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 11,
    data_publicacao: '2026-08-06',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/processo-legislativo.png',
    conteudo_md: `O processo de criação de uma lei no Brasil é regido pelo **Artigo 59 e seguintes da Constituição Federal de 1988**. Trata-se de um conjunto ordenado de atos solenes que transformam uma demanda social em uma norma jurídica vinculante para todo o país.

---

### 📊 Esquema Geral do Processo Legislativo

\`\`\`
[1. INICIATIVA] ➔ [2. TRAMITAÇÃO & COMISSÕES] ➔ [3. VOTAÇÃO EM PLENÁRIO]
                                                          │
[6. PROMULGAÇÃO] ◄── [5. APRECIAÇÃO DO VETO] ◄── [4. SANÇÃO OU VETO]
       │
       ▼
[7. PUBLICAÇÃO & VACATIO LEGIS] ➔ (LEI EM VIGOR)
\`\`\`

---

## 1. Iniciativa Legislativa (Art. 61 da CF/88)

A **iniciativa** é o ato formal que deflagra o processo legislativo. A Constituição Federal estabelece quem possui legitimidade para apresentar um Projeto de Lei (PL):

- **Parlamentares**: Qualquer Deputado Federal ou Senador da República.
- **Poder Executivo**: O Presidente da República (com iniciativa exclusiva para certas matérias, como orçamento e Forças Armadas).
- **Órgãos de Cúpula**: STF, Tribunais Superiores e Procurador-Geral da República (PGR).
- **Iniciativa Popular**: Cidadãos brasileiros reunidos nos termos do Art. 61, § 2º da CF/88.

> 📜 **Texto Legal — Art. 61, § 2º da CF/88 (Iniciativa Popular)**:
> *"A iniciativa popular pode ser exercida pela apresentação à Câmara dos Deputados de projeto de lei subscrito por, no mínimo, um por cento do eleitorado nacional, distribuído pelo menos por cinco Estados, com não menos de três décimos por cento dos eleitores de cada um deles."*

---

## 2. Tramitação e Comissões (Art. 64 da CF/88)

O Congresso Nacional adota o sistema **bicameral**:

1. **Casa Iniciadora**: Regra geral, é a **Câmara dos Deputados** (quando o projeto é de Deputado, Presidente da República ou Iniciativa Popular).
2. **Análise pelas Comissões**: O projeto é submetido à **Comissão de Constituição e Justiça (CCJ)** para avaliação de constitucionalidade, e às comissões de mérito.
3. **Casa Revisora**: Após aprovação na Casa Iniciadora, o texto segue para o Senado Federal.

> 💡 **Conceito Chave — Parecer Terminativo**:
> Em certas comissões, a proposta pode ser aprovada em caráter conclusivo, dispensando a deliberação do Plenário, salvo recurso assinado por 1/10 dos membros da Casa.

---

## 3. Deliberação e Quórum de Votação

| Espécie Normativa | Quórum de Aprovação | Previsão Constitucional |
| :--- | :--- | :--- |
| **Lei Ordinária** | Maioria simples (maioria dos votos dos presentes) | Art. 47 da CF/88 |
| **Lei Complementar** | Maioria absoluta (metade + 1 de todos os membros) | Art. 69 da CF/88 |
| **Emenda à Constituição (PEC)** | 3/5 de cada Casa, em dois turnos de votação | Art. 60, § 2º da CF/88 |

---

## 4. Sanção ou Veto Presidencial (Art. 66 da CF/88)

Aprovado o projeto pelas duas Casas, ele é remetido ao Presidente da República, que dispõe de **15 dias úteis** para:

- **Sanção**: Concordância do Executivo (expressa ou tácita pelo silêncio de 15 dias).
- **Veto**: Discordância fundamentada. Pode ser **Jurídico** (inconstitucionalidade) ou **Político** (contrário ao interesse público).

---

## 5. Publicação e Vigência (*Vacatio Legis*)

> 📌 **Atenção para Provas — LINDB (Art. 1º)**:
> Se a lei não fixar data de vigência, entra em vigor em **45 dias** após oficialmente publicada no território nacional (e **3 meses** no exterior).`
  },

  {
    id: 'art-leis-02',
    titulo: 'Lei do Inquilinato: Direitos e Deveres do Locador e Locatário Desmistificados',
    categoria: 'Leis',
    resumo: 'Guia completo da Lei nº 8.245/91: entenda as regras de despejo, devolução da caução, direito de preferência e benfeitorias em imóveis.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-05',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/inquilinato.png',
    conteudo_md: `A **Lei nº 8.245/1991 (Lei do Inquilinato)** disciplina as locações dos imóveis urbanos no Brasil. Trata-se de uma das leis mais aplicadas do Direito Civil, equilibrando a proteção à moradia do locatário com a garantia patrimonial do locador.

---

### 🔑 Resumo Prático dos Direitos e Deveres

| Parte | Principais Obrigações | Direitos Fundamentais |
| :--- | :--- | :--- |
| **Locador (Proprietário)** | Entregar imóvel em estado de uso; pagar despesas extraordinárias de condomínio. | Receber o aluguel no prazo; reaver o imóvel ao fim do contrato. |
| **Locatário (Inquilino)** | Pagar aluguel e encargos no dia; cuidar do imóvel como se seu fosse; pagar despesas ordinárias. | Devolver o imóvel a qualquer tempo mediante multa proporcional; indenização por benfeitorias necessárias. |

---

> 📜 **Texto Legal — Art. 22, I da Lei 8.245/91**:
> *"O locador é obrigado a entregar ao locatário o imóvel alugado em estado de servir ao uso a que se destina."*

> 💡 **Conceito Chave — Garantias Locatícias**:
> O contrato pode exigir apenas **uma** modalidade de garantia (caução, fiança, seguro-fiança ou cessão fiduciária). É proibida sob pena de nulidade a exigência de mais de uma garantia no mesmo contrato.`
  },

  {
    id: 'art-leis-03',
    titulo: 'LGPD para Futuros Advogados: O Guia Definitivo contra Multas e Vazamentos',
    categoria: 'Leis',
    resumo: 'Aprenda a aplicar os 10 princípios da Lei Geral de Proteção de Dados (Lei 13.709/18) e proteja escritórios e empresas contra penalidades graves da ANPD.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-04',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/lgpd.png',
    conteudo_md: `A **Lei Geral de Proteção de Dados (Lei nº 13.709/2018)** transformou o tratamento de dados pessoais no Brasil. Inspirada no GDPR europeu, a LGPD exige conformidade em escritórios de advocacia, startups e grandes corporações.

---

### 🛡️ Os 10 Princípios da LGPD

\`\`\`
1. Finalidade ➔ 2. Adequação ➔ 3. Necessidade ➔ 4. Livre Acesso
                                                        │
8. Prevenção ◄── 7. Responsabilização ◄── 6. Transparência ◄── 5. Qualidade
       │
       ▼
9. Não Discriminação ➔ 10. Segurança (DADOS PROTEGIDOS)
\`\`\`

---

> 📜 **Bases Legais Importantes (Art. 7º da LGPD)**:
> O tratamento de dados pessoais somente pode ser realizado mediante:
> 1. **Consentimento** titular;
> 2. **Cumprimento de obrigação legal** ou regulatória;
> 3. **Execução de contrato**;
> 4. **Legítimo interesse** do controlador.

> 📌 **Pegadinha de Prova**:
> Dados pessoais sensíveis (origem racial, convicção religiosa, dados de saúde ou genéticos) exigem hipóteses de tratamento mais restritas e **nunca** podem ser tratados com base no simples legítimo interesse.`
  },

  {
    id: 'art-leis-04',
    titulo: 'Reforma Tributária na Prática: O Que Muda no IVA, IBS e CBS para o Cidadão',
    categoria: 'Leis',
    resumo: 'Entenda a Emenda Constitucional 132/2023: a unificação de impostos no Imposto sobre Valor Agregado (IVA Dual), alíquotas e a cesta básica nacional.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 12,
    data_publicacao: '2026-08-03',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/reforma-tributaria.png',
    conteudo_md: `A **Emenda Constitucional nº 132/2023** aprovou a Reforma Tributária do consumo no Brasil, substituindo cinco impostos (PIS, Cofins, IPI, ICMS e ISS) por um modelo moderno de **IVA Dual** (Imposto sobre Valor Agregado).

---

### 🏛️ Estrutura do Novo Sistema Tributário (IVA Dual)

| Tributo Novo | Tributos Substituídos | Competência de Arrecadação |
| :--- | :--- | :--- |
| **CBS (Contribuição sobre Bens e Serviços)** | PIS, Cofins e IPI | Federal (União) |
| **IBS (Imposto sobre Bens e Serviços)** | ICMS e ISS | Estados e Municípios (Conselho Federativo) |
| **IS (Imposto Seletivo)** | Conhecido como "Imposto do Pecado" | Federal (União - bens nocivos à saúde/meio ambiente) |

---

> 💡 **Conceito Chave — Princípio do Destino**:
> O imposto agora é arrecadado no local onde o bem ou serviço é **consumido**, e não mais onde ele é produzido. Isso põe fim à histórica "guerra fiscal" entre estados.`
  },

  {
    id: 'art-leis-05',
    titulo: 'Código de Defesa do Consumidor: Os 10 Direitos Fundamentais nas Compras Online',
    categoria: 'Leis',
    resumo: 'Direito de arrependimento de 7 dias, inversão do ônus da prova, responsabilidade solidária e vícios do produto segundo o CDC (Lei 8.078/90).',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-02',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/cdc.png',
    conteudo_md: `O **Código de Defesa do Consumidor (Lei nº 8.078/1990)** é reconhecido internacionalmente como uma das legislações de proteção ao consumidor mais avançadas do mundo, fundada na **vulnerabilidade presumida** do consumidor (Art. 4º, I).

---

### 🛒 Direitos Chave nas Compras pela Internet

> 📜 **Art. 49 do CDC — Direito de Arrependimento**:
> *"O consumidor pode desistir do contrato, no prazo de 7 dias a contar de sua assinatura ou do ato de recebimento do produto ou serviço, sempre que a contratação de fornecimento de produtos e serviços ocorrer fora do estabelecimento comercial, especialmente por telefone ou a domicílio."*

- **Inversão do Ônus da Prova (Art. 6º, VIII)**: Facilitada a defesa em juízo quando for verossímil a alegação ou hipossuficiente o consumidor.
- **Responsabilidade Objetiva e Solidária (Art. 14 e 18)**: Fornecedor e fabricante respondem independentemente da existência de culpa por defeitos nos produtos.`
  },

  // --- CATEGORIA: STF (5 POSTS) ---
  {
    id: 'art-stf-01',
    titulo: 'Súmulas Vinculantes do STF: Como Funcionam e o Impacto Real nas Decisões',
    categoria: 'STF',
    resumo: 'Análise do Art. 103-A da CF/88: como o Supremo Tribunal Federal edita súmulas vinculantes, quórum de 2/3 e os casos mais relevantes.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-05',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/victor-nunes-leal.png',
    conteudo_md: `Introduzidas pela **Emenda Constitucional nº 45/2004 (Reforma do Judiciário)**, as **Súmulas Vinculantes** possuem eficácia contra todos os órgãos do Poder Judiciário e da Administração Pública direta e indireta nas esferas federal, estadual e municipal.

---

### ⚖️ Requisitos para Edição da Súmula Vinculante (Art. 103-A da CF/88)

- **Quórum de Aprovação**: Exige a concordância de **2/3 dos membros do STF** (pelo menos 8 Ministros).
- **Pressupostos**: Reiteradas decisões sobre matéria constitucional e controvérsia judicial ou administrativa atual que gere grave insegurança jurídica.

> 📜 **Exemplo Relevante — Súmula Vinculante 11 (Uso de Algemas)**:
> *"Só é lícito o uso de algemas em casos de resistência e de fundado receio de fuga ou de perigo à integridade física própria ou alheia, justificada a excepcionalidade por escrito, sob pena de responsabilidade disciplinar, civil e penal do agente ou da autoridade e de nulidade da prisão ou do ato processual a que se refere."*`
  },

  {
    id: 'art-stf-02',
    titulo: 'Prisão em Segunda Instância: A Evolução da Jurisprudência no STF (ADC 43 e 54)',
    categoria: 'STF',
    resumo: 'Revisite as viradas históricas do Supremo sobre o princípio da presunção de inocência (Art. 5º, LVII da CF/88) e o julgamento das ADCs 43, 44 e 54.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 11,
    data_publicacao: '2026-08-04',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/prisao-2a-instancia.png',
    conteudo_md: `A discussão sobre a **prisão após condenação em segunda instância** protagonizou um dos debates constitucionais mais intensos da história recente do STF, confrontando o princípio da presunção de não culpabilidade com a efetividade da justiça penal.

---

### 🔄 Linha do Tempo das Mudanças de Entendimento do STF

\`\`\`
[2009: HC 84.078] ➔ Exigia Trânsito em Julgado definitivo
       │
       ▼
[2016: HC 126.292] ➔ Permitia Execução Provisória da Pena
       │
       ▼
[2019: ADCs 43, 44 e 54] ➔ Retornou à exigência do Trânsito em Julgado Integral
\`\`\`

> 📜 **Texto Constitucional — Art. 5º, LVII da CF/88**:
> *"Ninguém será considerado culpado até o trânsito em julgado de sentença penal condenatória."*`
  },

  {
    id: 'art-stf-03',
    titulo: 'Terras Indígenas e o Marco Temporal: O Histórico do Julgamento no STF',
    categoria: 'STF',
    resumo: 'Compreenda a tese do marco temporal tese enfrentada no Recurso Extraordinário (RE) 1.017.365 e os direitos originários estampados no Art. 231 da CF/88.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-03',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/terras-indigenas.png',
    conteudo_md: `O julgamento pelo STF do **Recurso Extraordinário nº 1.017.365 (Com Repercussão Geral - Tema 1031)** definiu os parâmetros constitucionais para o reconhecimento das terras tradicionalmente ocupadas pelos povos indígenas no Brasil.

---

### 🏛️ Entendimento Firmado pelo Plenário do STF

- **Rejeição da Tese do Marco Temporal**: O Plenário decidiu que os direitos territoriais indígenas são **direitos originários** (teoria do indigenato), anteriores à própria criação do Estado brasileiro.
- **Proteção do Art. 231 da CF/88**: O direito não depende de as comunidades estarem ocupando a terra exatamente na data de 5 de outubro de 1988, especialmente quando comprovado o renitente esbulho territorial de suas terras originárias.`
  },

  {
    id: 'art-stf-04',
    titulo: 'Liberdade de Expressão vs. Discurso de Ódio: O Caso Ellwanger e a Posição do STF',
    categoria: 'STF',
    resumo: 'O histórico julgamento do HC 82.424 (Caso Ellwanger): ponderação entre liberdade de manifestação do pensamento e a vedação ao racismo e antissemitismo.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-02',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/stf.png',
    conteudo_md: `O julgamento do **Habeas Corpus nº 82.424/RS (Caso Ellwanger)** no STF é um dos maiores marcos da jurisprudência brasileira sobre **ponderação de direitos fundamentais** e limites da liberdade de expressão.

---

### ⚖️ O Conflito de Princípios e a Decisão do STF

> 💡 **Conceito Chave — A Liberdade de Expressão Não É Absoluta**:
> Nossos direitos fundamentais encontram limites quando violam a dignidade de outros grupos. O STF estabeleceu que o **discurso de ódio (*hate speech*)** e publicações de conteúdo abertamente antissemitas configuram o crime de racismo (Art. 5º, XLII da CF/88), sendo inafiançáveis e imprescritíveis.`
  },

  {
    id: 'art-stf-05',
    titulo: 'Demarcação de Poderes: Como Funciona a Ação Direta de Inconstitucionalidade (ADI)',
    categoria: 'STF',
    resumo: 'Entenda o Controle Concentrado de Constitucionalidade no STF: legitimados do Art. 103 da CF/88, medida cautelar e efeitos erga omnes e vinculante.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-01',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/adi-stf.png',
    conteudo_md: `A **Ação Direta de Inconstitucionalidade (ADI)** é o principal instrumento de controle concentrado exercido pelo STF para expurgar leis ou atos normativos federais ou estaduais incompatíveis com a Constituição Federal.

---

### 👥 Legitimados Especiais e Universais (Art. 103 da CF/88)

| Tipo de Legitimado | Quem São | Exigência de Pertinência Temática? |
| :--- | :--- | :--- |
| **Legitimados Universais** | Presidente da República, Mesas da Câmara e Senado, PGR, Conselho Federal da OAB e Partidos com representação no Congresso. | **NÃO** (Podem ajuizar sobre qualquer tema). |
| **Legitimados Especiais** | Governadores de Estado, Mesas de Assembleias Legislativas e Confederações Sindicais/Entidades de Classe Nacionais. | **SIM** (Devem demonstrar interesse direto na matéria). |`
  },

  // --- CATEGORIA: FILOSOFIA (5 POSTS) ---
  {
    id: 'art-filo-01',
    titulo: 'Aristóteles e a Justiça: A Diferença entre Justiça Comutativa e Distributiva',
    categoria: 'Filosofia',
    resumo: 'Mergulhe no Livro V de Ética a Nicômaco de Aristóteles e compreenda a equidade e a aplicação da justiça no ordenamento contemporâneo.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-05',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/aristoteles.png',
    conteudo_md: `Na obra **Ética a Nicômaco (Livro V)**, Aristóteles desenvolveu uma das classificações mais duradouras da Filosofia do Direito, definindo a justiça como a virtude perfeita de dar a cada um o que lhe é devido.

---

### ⚖️ As Duas Formas da Justiça Particular

- **Justiça Distributiva**: Trata da partilha de bens, honras e obrigações pela comunidade aos seus membros. Baseia-se na **proporção geométrica** (*tratar os iguais igualmente e os desiguais na medida de suas desigualdades*).
- **Justiça Comutativa (Corretiva)**: Trata de transações entre indivíduos (contratos ou delitos). Baseia-se na **proporção aritmética** (restauração do equilíbrio alterado).`
  },

  {
    id: 'art-filo-02',
    titulo: 'Hart x Dworkin: O Duelo Filosófico entre o Positivismo e a Moral no Direito',
    categoria: 'Filosofia',
    resumo: 'Descubra a histórica controvérsia sobre a Separação entre Direito e Moral segundo H.L.A. Hart e a Crítica dos Princípios de Ronald Dworkin.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 11,
    data_publicacao: '2026-08-04',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/hart-dworkin.png',
    conteudo_md: `O debate entre **H.L.A. Hart (O Conceito de Direito)** e **Ronald Dworkin (Levando os Direitos a Sério)** moldou o pensamento jurídico moderno sobre a relação entre regras escritas, moralidade e interpretação dos juízes nos casos difíceis (*hard cases*).

---

### ⚔️ O Confronto de Ideias

| Conceito | H.L.A. Hart (Positivismo Jurídico) | Ronald Dworkin (Pós-Positivismo) |
| :--- | :--- | :--- |
| **Definição de Direito** | Sistema composto por regras primárias e secundárias (Regra de Reconhecimento). | O Direito inclui regras e **princípios morais** implícitos na integridade da comunidade. |
| **Casos Difíceis** | Na lacuna da lei, o juiz possui **discricionariedade** para criar a norma. | O juiz **não** tem discricionariedade livre; deve buscar a resposta correta à luz da integridade. |`
  },

  {
    id: 'art-filo-03',
    titulo: 'Justiça como Equidade de John Rawls: O Véu da Ignorância e a Sociedade Justa',
    categoria: 'Filosofia',
    resumo: 'Como criar regras sociais imparciais? Conheça a Posição Originária e o Princípio da Diferença formulados por John Rawls em Uma Teoria da Justiça.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-03',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/filosofia.png',
    conteudo_md: `Em **Uma Teoria da Justiça (1971)**, o filósofo político norte-americano **John Rawls** propôs um experimento de pensamento revolucionário para determinar os princípios fundamentais de uma sociedade justa: a **Posição Originária sob o Véu da Ignorância**.

---

### 💡 Os Dois Princípios Fundamentais da Justiça

1. **Princípio da Liberdade Igual**: Cada pessoa tem o mesmo direito irrevogável a um esquema plenamente adequado de liberdades básicas iguais.
2. **Princípio da Diferença**: As desigualdades sociais e econômicas só são justificáveis se trouxerem o maior benefício possível aos membros menos favorecidos da sociedade.`
  },

  {
    id: 'art-filo-04',
    titulo: 'O Leviatã de Thomas Hobbes: Por Que Abrimos Mão da Liberdade pelo Estado?',
    categoria: 'Filosofia',
    resumo: 'Entenda o Estado de Natureza ("a guerra de todos contra todos") e o pacto social Hobbesiano que fundamentou a soberania estatal absoluta.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-02',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/filosofia.png',
    conteudo_md: `Na sua célebre obra **Leviatã (1651)**, Thomas Hobbes argumentou que, no **Estado de Natureza** (sem leis ou governo), a vida humana seria *"solitária, pobre, sórdida, embrutecida e curta"*, gerando a guerra de todos contra todos (*homo homini lupus*).

---

> 📜 **O Pacto de Submissão**:
> Para escapar da insegurança da morte violenta, os indivíduos celebram um contrato social onde transferem todo o seu poder de força ao Estado soberano (o **Leviatã**), que garante a paz social em troca de obediência.`
  },

  {
    id: 'art-filo-05',
    titulo: 'O Imperativo Categórico de Kant: A Ética do Dever Aplicada à Justiça',
    categoria: 'Filosofia',
    resumo: 'A filosofia moral de Immanuel Kant: a diferença entre imperativos hipotéticos e categóricos e a dignidade humana como valor supremo inestimável.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-01',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/filosofia.png',
    conteudo_md: `Na **Fundamentação da Metafísica dos Costumes (1785)**, Immanuel Kant estabeleceu que uma ação só possui valor moral autêntico quando realizada por **dever**, e não por interesse particular ou conveniência.

---

> 📜 **A Segunda Formulação do Imperativo Categórico**:
> *"Age de tal maneira que uses a humanidade, tanto na tua pessoa como na pessoa de qualquer outro, sempre e simultaneamente como fim, e nunca simplesmente como meio."*`
  },

  // --- CATEGORIA: CLÁSSICOS (5 POSTS) ---
  {
    id: 'art-clas-01',
    titulo: 'Os Miseráveis de Victor Hugo: A Injustiça Penal e o Caso Jean Valjean',
    categoria: 'Clássicos',
    resumo: 'Analise o clássico de Victor Hugo sob a ótica do Direito Penal e das penas desproporcionais: o confronto entre Jean Valjean e o inspetor Javert.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-05',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/classicos.png',
    conteudo_md: `Publicado em 1862 por **Victor Hugo**, o clássico **Os Miseráveis** oferece uma crítica cortante ao sistema legal e penitenciário da França do século XIX.

---

### ⚖️ O Julgamento de Jean Valjean e a Legalidade Cega de Javert

- **A Desproporcionalidade da Pena**: Jean Valjean é condenado a 5 anos de galés pelo furto de um pão para alimentar a família faminta (com aumentos sucessivos por tentativas de fuga até 19 anos).
- **Javert e o Legalismo Estrito**: O inspetor Javert encarna o punitivismo cego que reduz a justiça à aplicação mecânica da lei, incapaz de enxergar a redenção humana.`
  },

  {
    id: 'art-clas-02',
    titulo: 'O Sol É para Todos (To Kill a Mockingbird): A Defesa da Dignidade Humana',
    categoria: 'Clássicos',
    resumo: 'As lições de ética profissional e coragem do advogado Atticus Finch no combate ao racismo institucional e preconceito no júri popular.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-04',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/classicos.png',
    conteudo_md: `Vencedor do Prêmio Pulitzer em 1960, **O Sol É para Todos**, de Harper Lee, é uma leitura indispensável para qualquer estudante de Direito.

---

> 💡 **O Exemplo de Atticus Finch**:
> O advogado Atticus Finch assume a defesa de Tom Robinson, um homem negro injustamente acusado de um crime em pleno Alabama da década de 1930. Ele demonstra que o sacerdócio da advocacia exige defender os direitos fundamentais mesmo quando a opinião pública é abertamente hostil.`
  },

  {
    id: 'art-clas-03',
    titulo: 'A Luta pelo Direito de Rudolf von Ihering: A Paz Jurídica Exige Combate',
    categoria: 'Clássicos',
    resumo: 'Por que o jurista alemão defende que o Direito não é mero conceito teórico, mas uma conquista obtida através da resistência ativa e diária.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-03',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/classicos.png',
    conteudo_md: `Em **A Luta pelo Direito (1872)**, Rudolf von Ihering sustenta que todas as grandes conquistas do ordenamento jurídico (como o fim da escravidão ou a liberdade de expressão) custaram batalhas intensas contra o arbítrio.

---

> 📜 **Frase Célere de Ihering**:
> *"O fim do Direito é a paz; o meio de atingi-lo é a luta."*`
  },

  {
    id: 'art-clas-04',
    titulo: 'Dos Delitos e das Penas de Cesare Beccaria: A Origem do Direito Penal Moderno',
    categoria: 'Clássicos',
    resumo: 'A obra de 1764 que aboliu a tortura, humanizou as penas e estabeleceu a anterioridade e proporcionalidade das sanções penais.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-02',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/classicos.png',
    conteudo_md: `Publicado anonimamente em 1764 pelo jovem marquês italiano **Cesare Beccaria**, o livro **Dos Delitos e das Penas** é a certidão de nascimento do Direito Penal Garantista moderno.

---

### 🛡️ Princípios Fundamentais Estabelecidos por Beccaria

- **Fim das Penas Cruéis e da Tortura**: A tortura como meio de prova é ilógica e bárbara.
- **Anterioridade e Legalidade**: Somente leis escritas pelo legislador podem definir crimes e penas.
- **Proporcionalidade**: A pena deve ser estritamente proporcional ao dano causado à sociedade.`
  },

  {
    id: 'art-clas-05',
    titulo: 'O Processo de Franz Kafka: A Burocracia Asfixiante e o Devido Processo Legal',
    categoria: 'Clássicos',
    resumo: 'O drama de Josef K.: uma alegoria trágica sobre a violação da ampla defesa, ausência de acusação formal e opacidade do sistema judicial.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-01',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/classicos.png',
    conteudo_md: `No romance **O Processo (1925)**, Josef K. é preso de surpresa em sua casa sem saber por qual crime é acusado ou por qual autoridade foi instaurado o procedimento.

---

> 💡 **A Importância do Devido Processo Legal (Art. 5º, LIV da CF/88)**:
> O pesadelo Kafkaiano ilustra o valor inestimável dos direitos constitucionais ao contraditório, ampla defesa e ciência formal dos atos acusatórios.`
  },

  // --- CATEGORIA: CURIOSIDADES (5 POSTS) ---
  {
    id: 'art-curio-01',
    titulo: 'Esperança Garcia: A Primeira Advogada do Brasil e Sua Petição Histórica de 1770',
    categoria: 'Curiosidades',
    resumo: 'Conheça a história da mulher negra escravizada no Piauí que escreveu uma carta de denúncia de maus-tratos reconhecida pela OAB como a primeira petição jurídica.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-05',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/esperanca-garcia.png',
    conteudo_md: `Em 6 de setembro de 1770, a mulher negra escravizada **Esperança Garcia** redigiu uma petição ao Governador da Capitania do Piauí denunciando agressões físicas a si e aos seus filhos.

---

> 📜 **O Reconhecimento da OAB**:
> O Conselho Federal da OAB reconheceu formalmente Esperança Garcia como a **primeira advogada do Brasil**, transformando a data de sua petição no Dia Estadual da Consciência Negra no Piauí.`
  },

  {
    id: 'art-curio-02',
    titulo: 'O Código de Hammurabi: Olho por Olho e as Origens das Leis Escritas',
    categoria: 'Curiosidades',
    resumo: 'Descubra como o rei babilônio gravou em diorito negro o primeiro código legal abrangente da história e a Lei do Talião (*Lex Talionis*).',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-04',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/curiosidades.png',
    conteudo_md: `Esculpido por volta de 1750 a.C., o **Código de Hammurabi** continha 282 leis gravadas em estela de pedra, estabelecendo a premissa de que a norma jurídica deve ser pública e igual para todos.`
  },

  {
    id: 'art-curio-03',
    titulo: 'Julgamentos Bizarros da Idade Média: Quando Animais Iam ao Banco dos Réus',
    categoria: 'Curiosidades',
    resumo: 'Porcos, roedores e insetos com defensores nomeados pelo tribunal: como funcionavam os processos criminais contra animais na Europa medieval.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 8,
    data_publicacao: '2026-08-03',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/curiosidades.png',
    conteudo_md: `Na Idade Média europeia, animais acusados de causar danos ou mortes eram julgados perante tribunais seculares ou eclesiásticos com direito a advogado de defesa e rito solene.`
  },

  {
    id: 'art-curio-04',
    titulo: 'Erro de Tradução na Constituição de 1824: O Impacto nos Poderes da República',
    categoria: 'Curiosidades',
    resumo: 'Descubra como equívocos de tradução de textos do francês e inglês quase alteraram a redação de dispositivos da primeira Constituição do Brasil.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 8,
    data_publicacao: '2026-08-02',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/curiosidades.png',
    conteudo_md: `Durante a elaboração da Constituição Imperial de 1824, debates intensos ocorreram sobre termos jurídicos importados do constitucionalismo liberal europeu.`
  },

  {
    id: 'art-curio-05',
    titulo: 'Origem da Beca e do Termo Doutor no Direito: Tradições e Mitos Jurídicos',
    categoria: 'Curiosidades',
    resumo: 'Desmistifique o Decreto Imperial de 1827 e entenda as origens históricas da vestes talares dos tribunais e títulos jurídicos.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 8,
    data_publicacao: '2026-08-01',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/curiosidades.png',
    conteudo_md: `A tradição das vestes talares (beca) remonta às universidades medievais, simbolizando a imparcialidade e solemnidade do ato de julgar.`
  },

  // --- CATEGORIA: ATUALIDADES JURÍDICAS (5 POSTS) ---
  {
    id: 'art-atual-01',
    titulo: 'Inteligência Artificial e o Direito: Responsabilidade Civil dos Algoritmos',
    categoria: 'Atualidades Jurídicas',
    resumo: 'Quem responde por danos causados por sistemas autônomos e IAs generativas? O debate no Marco Legal da IA (PL 2338/2023).',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-05',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/atualidades.png',
    conteudo_md: `O avanço da Inteligência Artificial Generativa e dos sistemas autônomos impõe desafios inéditos à teoria geral da **responsabilidade civil** no Direito brasileiro.`
  },

  {
    id: 'art-atual-02',
    titulo: 'Direito dos Gamers e E-sports: Contratos, Direitos de Imagem e Propriedade Intelectual',
    categoria: 'Atualidades Jurídicas',
    resumo: 'Entenda como a Lei Geral do Esporte disciplina o mercado milionário de games, cyberatletas, contratos de trabalho e direitos de transmissão.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-04',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/atualidades.png',
    conteudo_md: `O mercado de e-sports movimenta bilhões de dólares e consolidou a profissão do pro-player, exigindo assessoria jurídica especializada.`
  },

  {
    id: 'art-atual-03',
    titulo: 'Regulamentação das Apostas Esportivas (Bets) no Brasil: O Que Diz a Nova Lei',
    categoria: 'Atualidades Jurídicas',
    resumo: 'Analise a Lei nº 14.790/2023: tributação de operadoras e apostadores, regras de publicidade responsável e combate à manipulação de resultados.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-03',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/atualidades.png',
    conteudo_md: `A aprovação da **Lei nº 14.790/2023** regulamentou as apostas de quota fixa (bets) no Brasil, criando exigências de licença, tributação e integridade esportiva.`
  },

  {
    id: 'art-atual-04',
    titulo: 'Trabalho em Plataformas Digitais (Uber/iFood): Vínculo Empregatício no TST',
    categoria: 'Atualidades Jurídicas',
    resumo: 'O debate constitucional e trabalhista sobre a subordinação algorítmica e a regulamentação dos motoristas e entregadores por aplicativo.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 10,
    data_publicacao: '2026-08-02',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/atualidades.png',
    conteudo_md: `A relação de trabalho entre motoristas/entregadores e plataformas de tecnologia é um dos temas mais controversos do Direito do Trabalho atual.`
  },

  {
    id: 'art-atual-05',
    titulo: 'Crimes Cibernéticos em 2026: Golpes do Pix, Engenharia Social e a Lei Carolina Dieckmann',
    categoria: 'Atualidades Jurídicas',
    resumo: 'Como o Direito Penal reprime a invasão de dispositivo (Art. 154-A do CP), fraudes eletrônicas e lavagem de dinheiro em ativos virtuais.',
    autor: 'Redação Estudos Jurídicos',
    tempo_leitura_min: 9,
    data_publicacao: '2026-08-01',
    imagem_url: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/blog-capas/atualidades.png',
    conteudo_md: `A criminalidade digital evoluiu rapidamente. O Código Penal foi atualizado com a Lei Carolina Dieckmann (Lei 12.737/12) e a Lei 14.155/21 para punir a fraude eletrônica com penas severas de 4 a 8 anos de reclusão.`
  }
];

async function seed() {
  console.log(`Iniciando inserção dos ${posts.length} novos artigos...`);
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_edicao_posts`, {
    method: 'POST',
    headers: {
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(posts)
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Erro REST:', response.status, err);
  } else {
    console.log('Sucesso! 30 novos artigos inseridos perfeitamente.');
  }
}

seed();
