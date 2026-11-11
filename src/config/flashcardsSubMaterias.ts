export interface SubMateriaConfig {
  id: string;
  nome: string;
  numeros: number[];
  keywords: string[];
}

export const AREA_SUB_MATERIAS: Record<string, SubMateriaConfig[]> = {
  // ── 1. DIREITO CIVIL ──
  'direito-civil': [
    {
      id: 'sec-parte-geral',
      nome: 'Parte Geral & LINDB',
      numeros: [1, 2, 3, 4, 5, 6, 32, 33],
      keywords: ['parte geral', 'lindb', 'pessoa', 'pessoas', 'bens', 'fato', 'negócio jurídico', 'prescrição', 'decadência', 'personalidade', 'bem de família']
    },
    {
      id: 'sec-obrigacoes',
      nome: 'Obrigações',
      numeros: [7, 8, 9, 10],
      keywords: ['obrigação', 'obrigações', 'inadimplemento', 'pagamento', 'devedor', 'credor', 'transmissão', 'atos unilaterais']
    },
    {
      id: 'sec-contratos',
      nome: 'Contratos',
      numeros: [11, 12, 13, 30, 31, 40, 41],
      keywords: ['contrato', 'contratos', 'compra e venda', 'locação', 'inquilinato', 'vícios contratuais', 'superendividamento']
    },
    {
      id: 'sec-responsabilidade-civil',
      nome: 'Responsabilidade Civil',
      numeros: [14, 28, 43],
      keywords: ['responsabilidade civil', 'dano moral', 'dano material', 'culpa', 'nexo', 'indenização', 'direito médico']
    },
    {
      id: 'sec-direitos-reais',
      nome: 'Direitos Reais',
      numeros: [15, 16, 17, 18, 19, 20, 22],
      keywords: ['reais', 'propriedade', 'posse', 'usucapião', 'imóveis', 'registro de imóveis', 'hipoteca', 'penhor', 'superfície', 'habitação', 'servidões', 'usufruto', 'multipropriedade']
    },
    {
      id: 'sec-familia',
      nome: 'Direito de Família',
      numeros: [21, 23, 24, 25, 34, 37, 38, 39, 42, 44],
      keywords: ['família', 'casamento', 'união estável', 'alimentos', 'filiação', 'guarda', 'divórcio', 'parentesco', 'regime de bens', 'tutela', 'curatela', 'adoção']
    },
    {
      id: 'sec-sucessoes',
      nome: 'Direito das Sucessões',
      numeros: [26, 27, 35, 36],
      keywords: ['sucessão', 'sucessões', 'herança', 'testamento', 'inventário', 'herdeiro', 'planejamento sucessório', 'diretivas antecipadas']
    },
    {
      id: 'sec-consumidor-especial',
      nome: 'Consumidor & Especial',
      numeros: [29],
      keywords: ['consumidor', 'cdc', 'especial', 'notarial', 'registral']
    },
  ],

  // ── 2. DIREITO ADMINISTRATIVO ──
  'direito-administrativo': [
    {
      id: 'sec-admin-principios',
      nome: 'Introdução & Princípios',
      numeros: [1, 2, 3, 4],
      keywords: ['origens', 'conceitos fundamentais', 'fontes', 'regime jurídico']
    },
    {
      id: 'sec-admin-organizacao',
      nome: 'Organização & Terceiro Setor',
      numeros: [5, 8],
      keywords: ['terceiro setor', 'administração pública', 'organização administrativa', 'descentralização', 'autarquias']
    },
    {
      id: 'sec-admin-poderes-atos',
      nome: 'Poderes & Atos',
      numeros: [6, 7],
      keywords: ['poderes', 'atos', 'poder de polícia', 'ato administrativo']
    },
    {
      id: 'sec-admin-agentes',
      nome: 'Agentes Públicos',
      numeros: [11],
      keywords: ['agentes públicos', 'servidor', 'cargo público', 'concurso']
    },
    {
      id: 'sec-admin-licitacoes-contratos',
      nome: 'Licitações & Contratos',
      numeros: [12, 21, 22],
      keywords: ['licitações', 'licitação', 'contratos administrativos', '14.133', 'direito sancionador']
    },
    {
      id: 'sec-admin-servicos-concessoes',
      nome: 'Serviços Públicos & Concessões',
      numeros: [10, 23],
      keywords: ['serviços públicos', 'serviço público', 'concessões', 'concessão', 'permissão', 'ppp']
    },
    {
      id: 'sec-admin-processo-improbidade',
      nome: 'Processo & Improbidade',
      numeros: [9, 13, 14, 17],
      keywords: ['processo administrativo', 'improbidade', 'anticorrupção', 'controle da administração']
    },
    {
      id: 'sec-admin-bens-intervencao',
      nome: 'Bens & Intervenção Estatal',
      numeros: [15, 16, 18, 19, 20, 24],
      keywords: ['responsabilidade civil do estado', 'domínio econômico', 'intervenção', 'desapropriação', 'bens públicos', 'tópicos']
    },
  ],

  // ── 3. DIREITO PENAL ──
  'direito-penal': [
    {
      id: 'sec-penal-teoria-crime',
      nome: 'Teoria Geral do Crime',
      numeros: [],
      keywords: ['teoria geral do delito', 'teoria geral do crime', 'iter criminis', 'concurso de pessoas', 'imputabilidade', 'teoria do erro', 'concurso de crimes', 'escolas penais', 'interpretação e integração', 'princípios penais', 'insignificância', 'lei penal no espaço', 'noções gerais', 'classificação e espécie', 'infrações penais', 'preâmbulo']
    },
    {
      id: 'sec-penal-teoria-pena',
      nome: 'Teoria da Pena',
      numeros: [],
      keywords: ['teoria da pena', 'funções da pena', 'dosimetria', 'penas e medidas', 'suspensão condicional', 'livramento condicional', 'medidas de segurança', 'extinção da punibilidade', 'prescrição', 'efeitos da condenação']
    },
    {
      id: 'sec-penal-pessoa',
      nome: 'Crimes Contra a Pessoa',
      numeros: [],
      keywords: ['crimes contra a pessoa', 'crimes contra a vida', 'crimes contra a honra', 'sentimento religioso']
    },
    {
      id: 'sec-penal-patrimonio',
      nome: 'Crimes Contra o Patrimônio',
      numeros: [],
      keywords: ['crimes contra o patrimônio', 'propriedade imaterial']
    },
    {
      id: 'sec-penal-sexual-familia',
      nome: 'Dignidade Sexual & Família',
      numeros: [],
      keywords: ['dignidade sexual', 'penal sexual', 'crimes contra a família']
    },
    {
      id: 'sec-penal-administracao',
      nome: 'Crimes Contra a Administração',
      numeros: [],
      keywords: ['funcionário público contra a administração', 'particular contra a administração', 'administração da justiça', 'fé pública', 'organização do trabalho', 'crimes praticados em licitações']
    },
    {
      id: 'sec-penal-especial',
      nome: 'Legislação Especial & Penal',
      numeros: [],
      keywords: ['legislação penal extravagante', 'lei de drogas', 'estatuto do desarmamento', 'responsabilidade penal da pessoa jurídica', 'jeccrim', 'criminologia', 'direito penal do inimigo']
    },
  ],

  // ── 4. DIREITO PROCESSUAL CIVIL ──
  'direito-processual-civil': [
    {
      id: 'sec-cpc-teoria-sujeitos',
      nome: 'Teoria Geral & Sujeitos',
      numeros: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 47],
      keywords: ['teoria geral e princípios', 'jurisdição', 'pressupostos', 'competência', 'capacidade e sujeitos', 'partes e procuradores', 'auxiliares', 'juiz', 'litisconsórcio', 'intervenção de terceiros', 'deveres das partes']
    },
    {
      id: 'sec-cpc-atos-procedimento',
      nome: 'Atos & Procedimento Comum',
      numeros: [11, 12, 13, 16, 17, 18, 19],
      keywords: ['atos processuais', 'atos e nulidades', 'formação, suspensão', 'procedimento comum', 'petição inicial', 'respostas e comportamentos', 'comunicação dos atos']
    },
    {
      id: 'sec-cpc-tutelas-provas',
      nome: 'Tutelas Provisórias & Provas',
      numeros: [14, 15, 20, 21, 50],
      keywords: ['tutela provisória', 'tutelas provisórias', 'provas no processo civil', 'sentença e coisa julgada']
    },
    {
      id: 'sec-cpc-recursos',
      nome: 'Recursos & Tribunais',
      numeros: [22, 23, 24],
      keywords: ['teoria geral dos recursos', 'recursos no processo civil', 'competência originária dos tribunais']
    },
    {
      id: 'sec-cpc-execucao',
      nome: 'Processo de Execução',
      numeros: [25, 32, 33, 34],
      keywords: ['cumprimento de sentença', 'processo de execução', 'espécies de execução', 'embargos, suspensão']
    },
    {
      id: 'sec-cpc-especiais',
      nome: 'Procedimentos Especiais',
      numeros: [35, 36, 37, 38, 39, 40, 41, 42, 43, 46, 49],
      keywords: ['ações possessórias', 'ação de exigir contas', 'consignação em pagamento', 'inventário e partilha', 'alienação fiduciária', 'ações de família na prática', 'ação monitória', 'ações de despejo', 'direito de resposta', 'lei do superendividamento', 'processos estruturais']
    },
    {
      id: 'sec-cpc-juizados-coletivo',
      nome: 'Juizados & Meios Adequados',
      numeros: [26, 27, 28, 29, 30, 31, 45, 48],
      keywords: ['mediação', 'arbitragem', 'juizado especial cível', 'juizado especial federal', 'juizado especial da fazenda', 'formas alternativas', 'processual coletivo', 'processual do consumidor']
    },
  ],

  // ── 5. DIREITO CONSTITUCIONAL ──
  'direito-constitucional': [
    {
      id: 'sec-const-teoria',
      nome: 'Teoria & Hermenêutica',
      numeros: [1, 2, 3, 4, 5, 48],
      keywords: ['história constitucional', 'constitucionalismo', 'introdução à constituição', 'poder constituinte', 'hermenêutica constitucional', 'preâmbulo']
    },
    {
      id: 'sec-const-direitos-fundamentais',
      nome: 'Direitos & Garantias',
      numeros: [6, 7, 9, 10, 11, 22],
      keywords: ['direitos fundamentais', 'direitos e garantias individuais', 'direitos sociais', 'nacionalidade', 'direitos políticos', 'remédios constitucionais']
    },
    {
      id: 'sec-const-organizacao-poderes',
      nome: 'Estado & Poderes',
      numeros: [13, 14, 15, 16, 17, 18, 19, 20, 28],
      keywords: ['organização do estado', 'intervenção federal', 'organização dos poderes', 'poder legislativo', 'processo legislativo', 'poder executivo', 'poder judiciário', 'defesa do estado']
    },
    {
      id: 'sec-const-funcoes-justica',
      nome: 'Funções Essenciais à Justiça',
      numeros: [25, 26, 27],
      keywords: ['funções essenciais à justiça', 'ministério público', 'defensoria pública']
    },
    {
      id: 'sec-const-controle',
      nome: 'Controle de Constitucionalidade',
      numeros: [21, 41, 42, 43, 44],
      keywords: ['controle de constitucionalidade', 'adi', 'ado', 'adpf', 'adc', 'inconstitucionalidade']
    },
    {
      id: 'sec-const-ordem-pecas',
      nome: 'Ordem Econômica & Prática',
      numeros: [12, 23, 24, 29, 31, 32, 34, 35, 36, 37, 38, 39, 40, 46, 47],
      keywords: ['ordem econômica', 'direito eleitoral', 'súmulas vinculantes', 'súmulas importantes', 'legislação em prazos', 'peça prática']
    },
  ],

  // ── 6. DIREITO TRIBUTÁRIO ──
  'direito-tributario': [
    {
      id: 'sec-trib-sistema-principios',
      nome: 'Sistema Tributário & Princípios',
      numeros: [3, 4, 5, 6, 7, 8, 10, 11, 17],
      keywords: ['sistema tributário nacional', 'fontes do direito tributário', 'interpretação e integração', 'princípios tributários', 'imunidades', 'espécies tributárias', 'competência tributária', 'repartição de receitas']
    },
    {
      id: 'sec-trib-obrigacao-credito',
      nome: 'Obrigação & Crédito Tributário',
      numeros: [12, 13, 14, 16, 19, 29],
      keywords: ['obrigação tributária', 'responsabilidade tributária', 'crédito tributário', 'lançamento', 'suspensão da exigibilidade', 'extinção do crédito', 'exclusão do crédito']
    },
    {
      id: 'sec-trib-processo-execucao',
      nome: 'Processo & Execução Fiscal',
      numeros: [18, 20, 23, 31, 32],
      keywords: ['execução fiscal', 'processo de execução fiscal', 'respostas à execução fiscal', 'processo tributário']
    },
    {
      id: 'sec-trib-acoes',
      nome: 'Ações Tributárias',
      numeros: [21, 24, 25, 26, 27, 28, 30],
      keywords: ['ação declaratória tributária', 'ação de consignação', 'controle de constitucionalidade', 'restituição', 'mandado de segurança', 'ação anulatória']
    },
    {
      id: 'sec-trib-reforma-especial',
      nome: 'Reforma & Regimes Especiais',
      numeros: [1, 2, 9, 15, 22, 35],
      keywords: ['simples nacional', 'reforma tributária', 'administração tributária', 'direito concorrencial', 'revisão oab']
    },
  ],

  // ── 7. DIREITO DO TRABALHO ──
  'direito-do-trabalho': [
    {
      id: 'sec-trab-introducao-sujeitos',
      nome: 'Introdução & Sujeitos',
      numeros: [1, 2, 3, 4, 5, 12, 16],
      keywords: ['introdução ao direito do trabalho', 'histórico', 'fontes e princípios', 'trabalho lato sensu', 'sujeitos do direito do trabalho', 'terceirização', 'lgpd']
    },
    {
      id: 'sec-trab-contrato-remuneracao',
      nome: 'Contrato & Remuneração',
      numeros: [6, 7, 9, 10, 11, 24, 25],
      keywords: ['contrato de trabalho', 'duração do trabalho', 'remuneração e salário', 'fgts', 'verbas rescisórias', 'suspensão, interrupção', 'efeitos conexos']
    },
    {
      id: 'sec-trab-saude-beneficios',
      nome: 'Saúde, Segurança & Benefícios',
      numeros: [8, 20, 21, 22, 23, 26, 27],
      keywords: ['acidente de trabalho', 'saúde e segurança', 'salário-maternidade', 'salário família', 'seguro-desemprego', 'pis-pasep', 'proteção do trabalho da criança']
    },
    {
      id: 'sec-trab-estabilidades-reforma',
      nome: 'Estabilidades & Reforma',
      numeros: [13, 14, 15],
      keywords: ['estabilidades trabalhistas', 'prescrição e decadência no direito do trabalho', 'reforma trabalhista']
    },
    {
      id: 'sec-trab-coletivo',
      nome: 'Direito Coletivo & Sindical',
      numeros: [17, 18, 19],
      keywords: ['direito coletivo do trabalho', 'negociação coletiva', 'greve']
    },
  ],

  // ── 8. DIREITO PROCESSUAL PENAL ──
  'direito-processual-penal': [
    {
      id: 'sec-cpp-principios-investigacao',
      nome: 'Princípios & Investigação',
      numeros: [1, 2, 3, 4, 6, 11],
      keywords: ['princípios e garantias do processo penal', 'lei processual penal no tempo', 'inquérito policial', 'audiência de custódia', 'interceptação telefônica', 'sistemas processuais']
    },
    {
      id: 'sec-cpp-acao-competencia',
      nome: 'Ação Penal & Competência',
      numeros: [5, 8, 9, 10, 14, 21],
      keywords: ['ação penal', 'ação civil decorrente', 'competência processual penal', 'membros da justiça', 'citações e intimações', 'questões e processos incidentes']
    },
    {
      id: 'sec-cpp-prisoes',
      nome: 'Prisões & Cautelares',
      numeros: [7],
      keywords: ['prisões, medidas cautelares e liberdade provisória']
    },
    {
      id: 'sec-cpp-provas',
      nome: 'Provas no Processo Penal',
      numeros: [12, 13],
      keywords: ['provas no processo penal', 'disposições gerais sobre provas']
    },
    {
      id: 'sec-cpp-procedimentos-sentenca',
      nome: 'Procedimentos & Sentença',
      numeros: [15, 17, 20],
      keywords: ['procedimento comum, júri', 'sentença no processo penal', 'juizado especial criminal']
    },
    {
      id: 'sec-cpp-recursos-execucao',
      nome: 'Recursos & Execução Penal',
      numeros: [16, 18, 19],
      keywords: ['recursos no processo penal', 'nulidades no processo penal', 'lei de execução penal']
    },
  ],

  // ── 9. DIREITO PREVIDENCIÁRIO ──
  'direito-previdenciario': [
    {
      id: 'sec-prev-seguridade',
      nome: 'Seguridade Social & Princípios',
      numeros: [1, 2, 3, 4, 5, 8],
      keywords: ['introdução à seguridade', 'origens históricas', 'princípios da seguridade', 'assistência social', 'saúde', 'bolsa família']
    },
    {
      id: 'sec-prev-rgps',
      nome: 'Previdência & Segurados RGPS',
      numeros: [6, 7],
      keywords: ['previdência social brasileira', 'beneficiários do rgps']
    },
    {
      id: 'sec-prev-aposentadorias',
      nome: 'Aposentadorias',
      numeros: [12, 13, 14, 15],
      keywords: ['aposentadoria especial', 'aposentadoria programada', 'aposentadoria por incapacidade', 'pessoa com deficiência']
    },
    {
      id: 'sec-prev-pensoes-auxilios',
      nome: 'Pensões & Auxílios',
      numeros: [9, 10, 11],
      keywords: ['pensão por morte', 'auxílio reclusão', 'auxílio-acidente']
    },
  ],

  // ── 10. DIREITO EMPRESARIAL ──
  'direito-empresarial': [
    {
      id: 'sec-emp-teoria',
      nome: 'Teoria da Empresa',
      numeros: [1, 7],
      keywords: ['teoria geral do direito empresarial', 'desconsideração da personalidade jurídica']
    },
    {
      id: 'sec-emp-sociedades',
      nome: 'Sociedades Empresárias',
      numeros: [2, 3, 4],
      keywords: ['sociedades do direito empresarial', 'sociedade limitada', 'sociedades anônimas']
    },
    {
      id: 'sec-emp-contratos-titulos',
      nome: 'Contratos & Títulos de Crédito',
      numeros: [8, 9, 10, 11],
      keywords: ['teoria geral dos contratos empresariais', 'contratos empresariais em espécie', 'contrato de distribuição', 'títulos de crédito']
    },
    {
      id: 'sec-emp-falencia-pi',
      nome: 'Falência, Recuperação & PI',
      numeros: [5, 6, 12],
      keywords: ['falência', 'recuperação judicial', 'propriedade intelectual']
    },
  ],

  // ── 11. DIREITO FINANCEIRO ──
  'direito-financeiro': [
    {
      id: 'sec-fin-sistema',
      nome: 'Sistema Financeiro & Fontes',
      numeros: [1, 4, 6, 7, 10],
      keywords: ['sistema financeiro nacional', 'introdução ao direito financeiro', 'direito financeiro', 'federalismo fiscal', 'fontes e normas gerais']
    },
    {
      id: 'sec-fin-orcamento-receitas',
      nome: 'Orçamento, Receitas & Gastos',
      numeros: [5, 8, 9, 14],
      keywords: ['receitas públicas', 'orçamento público', 'despesas e gastos públicos', 'fiscalização financeira']
    },
    {
      id: 'sec-fin-credito-fundos',
      nome: 'Crédito, Fundos & Políticas',
      numeros: [11, 12, 13],
      keywords: ['fundos financeiros', 'políticas públicas', 'crédito e dívida pública']
    },
    {
      id: 'sec-fin-economico',
      nome: 'Direito Econômico',
      numeros: [2, 3, 15, 16],
      keywords: ['ordem econômica', 'econômico internacional', 'direito econômico - parte geral', 'defesa da concorrência']
    },
  ],

  // ── 12. LEI PENAL ESPECIAL ──
  'lei-penal-especial': [
    {
      id: 'sec-lpe-drogas-orgcrim',
      nome: 'Drogas & Crime Organizado',
      numeros: [1, 14],
      keywords: ['organizações criminosas', 'lei de drogas']
    },
    {
      id: 'sec-lpe-graves-abuso',
      nome: 'Crimes Graves & Abuso',
      numeros: [7, 9, 10],
      keywords: ['abuso de autoridade', 'lei de tortura', 'crimes hediondos']
    },
    {
      id: 'sec-lpe-armas-transito',
      nome: 'Armas, Trânsito & Contravenções',
      numeros: [2, 6, 13],
      keywords: ['lei das contravenções penais', 'código de trânsito', 'estatuto do desarmamento']
    },
    {
      id: 'sec-lpe-vulneraveis-estado',
      nome: 'Proteção de Vulneráveis & Estado',
      numeros: [3, 4, 5],
      keywords: ['estado democrático de direito', 'pessoa idosa - crimes', 'lei maria da penha']
    },
    {
      id: 'sec-lpe-execucao-processo',
      nome: 'Procedimentos & Execução',
      numeros: [8, 11, 12],
      keywords: ['juizado especial criminal', 'lei de execução penal', 'interceptação telefônica']
    },
  ],

  // ── 13. FORMAÇÃO COMPLEMENTAR ──
  'formacao-complementar': [
    {
      id: 'sec-fc-digital',
      nome: 'Direito Digital & Inovação',
      numeros: [3, 4],
      keywords: ['lgpd', 'direito digital']
    },
    {
      id: 'sec-fc-pratica',
      nome: 'Prática & Humanidades',
      numeros: [1, 2, 5],
      keywords: ['fashion law', 'inglês jurídico', 'psicologia e neurociência']
    },
  ],

  // ── 14. DIREITOS HUMANOS ──
  'direitos-humanos': [
    {
      id: 'sec-dh-geral-onu',
      nome: 'Teoria Geral & Sistema Global',
      numeros: [4, 5],
      keywords: ['teoria geral dos direitos humanos', 'tratados de direitos humanos - sistema universal']
    },
    {
      id: 'sec-dh-interamericano',
      nome: 'Sistema Interamericano & Brasil',
      numeros: [1, 6],
      keywords: ['sistema interamericano', 'direitos humanos no brasil']
    },
    {
      id: 'sec-dh-minorias',
      nome: 'Minorias & Antidiscriminação',
      numeros: [2, 3, 7],
      keywords: ['direitos lgbtqia+', 'estatuto da pessoa idosa - direitos fundamentais', 'direito antidiscriminatório']
    },
  ],

  // ── 15. POLÍTICAS PÚBLICAS ──
  'politicas-publicas': [
    {
      id: 'sec-pp-estatutos',
      nome: 'Estatutos & Cidadania',
      numeros: [1, 2, 9],
      keywords: ['estatuto da pessoa idosa', 'estatuto da pessoa com deficiência']
    },
    {
      id: 'sec-pp-inclusao-internet',
      nome: 'Inclusão & Direitos Digitais',
      numeros: [4, 5, 10, 11],
      keywords: ['direito antidiscriminatório', 'marco civil da internet', 'resolução cnj 230', 'diretivas antecipadas']
    },
    {
      id: 'sec-pp-cidades-meio-ambiente',
      nome: 'Cidades & Meio Ambiente',
      numeros: [3, 6, 8, 12, 13, 14],
      keywords: ['estatuto da cidade', 'introdução ao direito ambiental', 'licenciamento ambiental', 'responsabilidade ambiental', 'direito dos desastres', 'tópicos em direito ambiental']
    },
  ],

  // ── 16. DIREITO PROCESSUAL DO TRABALHO ──
  'direito-processual-do-trabalho': [
    {
      id: 'sec-dpt-organizacao',
      nome: 'Organização & Procedimentos',
      numeros: [1, 2, 3, 4],
      keywords: ['introdução ao processo do trabalho', 'organização da justiça do trabalho', 'partes e procuradores', 'atos e procedimentos']
    },
    {
      id: 'sec-dpt-reclamacao-recursos',
      nome: 'Reclamação, Execução & Recursos',
      numeros: [5, 6, 9],
      keywords: ['reclamação trabalhista', 'execução e liquidação', 'recursos no processo do trabalho']
    },
    {
      id: 'sec-dpt-coletivo-verbas',
      nome: 'Coletivo, Verbas & Prazos',
      numeros: [7, 8, 10, 11],
      keywords: ['dissídios coletivos', 'honorários advocatícios', 'verbas rescisórias e cálculos', 'prescrição e decadência']
    },
  ],

  // ── 17. PORTUGUÊS ──
  'portugues': [
    {
      id: 'sec-pt-morfologia',
      nome: 'Morfologia & Ortografia',
      numeros: [4, 6, 7],
      keywords: ['classes gramaticais', 'acentuação e crase']
    },
    {
      id: 'sec-pt-sintaxe',
      nome: 'Sintaxe & Pontuação',
      numeros: [1, 2, 3, 8, 10],
      keywords: ['pontuação', 'concordância verbal e nominal', 'regência verbal e nominal', 'colocação pronominal', 'orações coordenadas e subordinadas']
    },
    {
      id: 'sec-pt-interpretacao-redacao',
      nome: 'Interpretação & Redação',
      numeros: [5, 9, 11],
      keywords: ['interpretação de textos', 'semântica', 'redação para concursos']
    },
  ],

  // ── 18. DIREITO URBANÍSTICO ──
  'direito-urbanistico': [
    {
      id: 'sec-urb-parte-geral',
      nome: 'Parte Geral & Princípios',
      numeros: [1, 2, 4],
      keywords: ['direito urbanístico - parte geral', 'legislação básica de direito urbanístico', 'direito à cidade']
    },
    {
      id: 'sec-urb-estatuto-cidade',
      nome: 'Estatuto da Cidade & Instrumentos',
      numeros: [3, 5, 6],
      keywords: ['estatuto da cidade', 'instrumentos de política urbana', 'direito dos desastres']
    },
  ],

  // ── 19. DIREITO AMBIENTAL ──
  'direito-ambiental': [
    {
      id: 'sec-amb-parte-geral',
      nome: 'Parte Geral & Licenciamento',
      numeros: [1, 2, 3],
      keywords: ['introdução ao direito ambiental', 'tópicos em direito ambiental', 'licenciamento ambiental']
    },
    {
      id: 'sec-amb-espacos-dano',
      nome: 'Espaços Protegidos & Dano',
      numeros: [4, 5, 6, 7],
      keywords: ['preservação permanente e reserva legal', 'unidades de conservação', 'responsabilidade ambiental', 'direito dos desastres']
    },
  ],

  // ── 20. DIREITO DESPORTIVO ──
  'direito-desportivo': [
    {
      id: 'sec-desp-geral',
      nome: 'Legislação & Prática Desportiva',
      numeros: [1, 2],
      keywords: ['direito desportivo', 'panorama legislativo do desporto']
    },
  ],

  // ── 21. DIREITO INTERNACIONAL PRIVADO ──
  'direito-internacional-privado': [
    {
      id: 'sec-dip-geral',
      nome: 'Direito Internacional & Econômico',
      numeros: [1, 2],
      keywords: ['direito internacional privado', 'direito econômico internacional']
    },
  ],

  // ── 22. TEORIA E FILOSOFIA DO DIREITO ──
  'teoria-e-filosofia-do-direito': [
    {
      id: 'sec-tfd-teoria-norma',
      nome: 'Teoria da Norma & História',
      numeros: [2, 3, 9, 10, 14],
      keywords: ['teoria da norma jurídica', 'história do direito', 'introdução ao estudo do direito', 'lindb', 'direito romano']
    },
    {
      id: 'sec-tfd-filosofia',
      nome: 'Filosofia do Direito & Escolas',
      numeros: [1, 4, 5, 6, 12, 13],
      keywords: ['filosofia do direito', 'filosofia do direito na antiguidade', 'filosofia do direito na modernidade', 'hans kelsen', 'a formação do capitalismo', 'pragmatismo jurídico']
    },
    {
      id: 'sec-tfd-hermeneutica-sociedade',
      nome: 'Hermenêutica & Ciência Política',
      numeros: [7, 8, 11, 15],
      keywords: ['introdução à hermenêutica jurídica', 'hermenêutica e métodos interpretativos', 'ciência política', 'psicologia e neurociência']
    },
  ],
};

function normalizarChave(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Obtém a lista de sub-matérias/matérias para uma área de flashcards
 */
export function getSubMateriasForArea(areaOrSlug: string, fallbackNome = 'Trilha Principal'): SubMateriaConfig[] {
  const norm = normalizarChave(areaOrSlug);
  
  // Tenta match direto ou parcial nas chaves cadastradas
  for (const [key, configs] of Object.entries(AREA_SUB_MATERIAS)) {
    if (norm === key || norm.includes(key) || key.includes(norm)) {
      return configs;
    }
  }

  // Fallbacks para termos comuns
  if (norm.includes('civil') && !norm.includes('processual')) return AREA_SUB_MATERIAS['direito-civil'];
  if (norm.includes('admin')) return AREA_SUB_MATERIAS['direito-administrativo'];
  if (norm.includes('penal') && !norm.includes('processual') && !norm.includes('especial')) return AREA_SUB_MATERIAS['direito-penal'];
  if (norm.includes('processual-civil') || (norm.includes('process') && norm.includes('civil'))) return AREA_SUB_MATERIAS['direito-processual-civil'];
  if (norm.includes('constituc')) return AREA_SUB_MATERIAS['direito-constitucional'];
  if (norm.includes('tribut')) return AREA_SUB_MATERIAS['direito-tributario'];
  if (norm.includes('trabalho') && !norm.includes('processual')) return AREA_SUB_MATERIAS['direito-do-trabalho'];
  if (norm.includes('processual-penal') || (norm.includes('process') && norm.includes('penal'))) return AREA_SUB_MATERIAS['direito-processual-penal'];
  if (norm.includes('previd')) return AREA_SUB_MATERIAS['direito-previdenciario'];
  if (norm.includes('empres')) return AREA_SUB_MATERIAS['direito-empresarial'];
  if (norm.includes('financ')) return AREA_SUB_MATERIAS['direito-financeiro'];
  if (norm.includes('especial')) return AREA_SUB_MATERIAS['lei-penal-especial'];
  if (norm.includes('human')) return AREA_SUB_MATERIAS['direitos-humanos'];
  if (norm.includes('politic')) return AREA_SUB_MATERIAS['politicas-publicas'];
  if (norm.includes('portug')) return AREA_SUB_MATERIAS['portugues'];
  if (norm.includes('urban')) return AREA_SUB_MATERIAS['direito-urbanistico'];
  if (norm.includes('ambien')) return AREA_SUB_MATERIAS['direito-ambiental'];
  if (norm.includes('desport')) return AREA_SUB_MATERIAS['direito-desportivo'];
  if (norm.includes('internac')) return AREA_SUB_MATERIAS['direito-internacional-privado'];
  if (norm.includes('filosof') || norm.includes('teoria')) return AREA_SUB_MATERIAS['teoria-e-filosofia-do-direito'];

  return [
    {
      id: 'sec-geral',
      nome: fallbackNome || 'Matéria Principal',
      numeros: [],
      keywords: []
    }
  ];
}
