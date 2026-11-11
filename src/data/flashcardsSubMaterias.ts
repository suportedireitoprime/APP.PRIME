export interface SubMateriaConfig {
  id: string;
  nome: string;
  numeros?: number[];
  keywords?: string[];
}

export const AREA_SUB_MATERIAS: Record<string, SubMateriaConfig[]> = {
  'direito-civil': [
    { 
      id: 'sec-civ-parte-geral', 
      nome: 'Parte Geral & LINDB', 
      numeros: [1, 2, 3, 4, 5, 6, 32, 33],
      keywords: ['parte geral', 'lindb', 'pessoa', 'pessoas', 'bens', 'fato', 'negócio jurídico', 'prescrição', 'decadência']
    },
    { 
      id: 'sec-civ-obrigacoes', 
      nome: 'Obrigações', 
      numeros: [7, 8, 9, 10],
      keywords: ['obrigação', 'obrigações', 'inadimplemento', 'pagamento', 'devedor', 'credor']
    },
    { 
      id: 'sec-civ-contratos', 
      nome: 'Contratos', 
      numeros: [11, 12, 13, 30, 31, 40, 41],
      keywords: ['contrato', 'contratos', 'compra e venda', 'locação', 'doação', 'mútuo', 'fiança']
    },
    { 
      id: 'sec-civ-responsabilidade-civil', 
      nome: 'Responsabilidade Civil', 
      numeros: [14],
      keywords: ['responsabilidade civil', 'dano moral', 'dano material', 'culpa', 'nexo', 'indenização']
    },
    { 
      id: 'sec-civ-direitos-reais', 
      nome: 'Direitos Reais', 
      numeros: [15, 16, 17, 18, 19, 20, 22],
      keywords: ['reais', 'propriedade', 'posse', 'usucapião', 'imóveis', 'registro de imóveis', 'hipoteca', 'penhor']
    },
    { 
      id: 'sec-civ-familia', 
      nome: 'Direito de Família', 
      numeros: [21, 23, 24, 25, 34, 37, 38, 39, 42, 43, 44],
      keywords: ['família', 'casamento', 'união estável', 'alimentos', 'filiação', 'guarda', 'divórcio', 'parentesco']
    },
    { 
      id: 'sec-civ-sucessoes', 
      nome: 'Direito das Sucessões', 
      numeros: [26, 27, 35, 36],
      keywords: ['sucessão', 'sucessões', 'herança', 'testamento', 'inventário', 'herdeiro']
    },
    { 
      id: 'sec-civ-consumidor-especial', 
      nome: 'Consumidor & Especial', 
      numeros: [28, 29],
      keywords: ['consumidor', 'cdc', 'especial', 'notarial', 'registral']
    },
  ],

  'direito-administrativo': [
    { 
      id: 'sec-adm-regime', 
      nome: 'Regime Jurídico & Princípios', 
      numeros: [1, 2, 3, 4], 
      keywords: ['origens', 'conceitos fundamentais', 'fontes', 'regime jurídico', 'princípios'] 
    },
    { 
      id: 'sec-adm-organizacao', 
      nome: 'Organização & 3º Setor', 
      numeros: [5, 8], 
      keywords: ['terceiro setor', 'administração pública', 'descentralização'] 
    },
    { 
      id: 'sec-adm-poderes-atos', 
      nome: 'Poderes & Atos', 
      numeros: [6, 7], 
      keywords: ['poderes', 'atos', 'ato administrativo'] 
    },
    { 
      id: 'sec-adm-servicos', 
      nome: 'Serviços & Concessões', 
      numeros: [10, 23], 
      keywords: ['serviços públicos', 'concessões', 'permissões'] 
    },
    { 
      id: 'sec-adm-agentes-probidade', 
      nome: 'Agentes & Probidade', 
      numeros: [11, 14, 17], 
      keywords: ['agentes públicos', 'anticorrupção', 'improbidade'] 
    },
    { 
      id: 'sec-adm-licitacoes-contratos', 
      nome: 'Licitações & Contratos', 
      numeros: [12, 21, 22], 
      keywords: ['licitações', 'contratos administrativos', '14.133', 'sancionador'] 
    },
    { 
      id: 'sec-adm-bens-intervencao', 
      nome: 'Bens & Intervenção', 
      numeros: [16, 18, 19, 20], 
      keywords: ['intervenção', 'desapropriação', 'bens públicos', 'propriedade', 'domínio econômico'] 
    },
    { 
      id: 'sec-adm-controle-resp', 
      nome: 'Controle & Responsabilidade', 
      numeros: [9, 13, 15, 24], 
      keywords: ['controle da administração', 'processo administrativo', 'responsabilidade civil', 'tópicos'] 
    },
  ],

  'direito-penal': [
    { 
      id: 'sec-pen-teoria-delito', 
      nome: 'Teoria do Crime & Princípios', 
      keywords: ['delito', 'princípios penais', 'noções gerais', 'iter criminis', 'classificação e espécie', 'espaço e no tempo', 'insignificância', 'interpretação e integração', 'escolas penais', 'preâmbulo constitucional', 'criminologia', 'direito penal do inimigo'] 
    },
    { 
      id: 'sec-pen-concurso-culpabilidade', 
      nome: 'Concurso & Culpabilidade', 
      keywords: ['imputabilidade', 'concurso de pessoas', 'autoria imediata', 'teoria do erro', 'concurso de crimes', 'pessoa jurídica'] 
    },
    { 
      id: 'sec-pen-penas-punibilidade', 
      nome: 'Penas & Prescrição', 
      keywords: ['teoria da pena', 'dosimetria', 'funções da pena', 'medidas de segurança', 'suspensão condicional', 'livramento', 'efeitos da condenação', 'extinção da punibilidade', 'prescrição'] 
    },
    { 
      id: 'sec-pen-crimes-pessoa', 
      nome: 'Crimes Contra a Pessoa', 
      keywords: ['contra a pessoa', 'contra a vida', 'contra a honra'] 
    },
    { 
      id: 'sec-pen-crimes-patrimonio', 
      nome: 'Crimes Contra o Patrimônio', 
      keywords: ['patrimônio', 'propriedade imaterial'] 
    },
    { 
      id: 'sec-pen-sexual-familia', 
      nome: 'Dignidade Sexual & Família', 
      keywords: ['dignidade sexual', 'penal sexual', 'contra a família', 'sentimento religioso'] 
    },
    { 
      id: 'sec-pen-crimes-administracao', 
      nome: 'Crimes Contra a Administração', 
      keywords: ['administração', 'fé pública', 'organização do trabalho', 'licitações'] 
    },
    { 
      id: 'sec-pen-legislacao-especial', 
      nome: 'Legislação Especial', 
      keywords: ['extravagante', 'drogas', 'desarmamento', 'jeccrim'] 
    },
  ],

  'direito-processual-civil': [
    { 
      id: 'sec-cpc-teoria-sujeitos', 
      nome: 'Teoria Geral & Sujeitos', 
      numeros: [1, 2, 3, 4, 5, 6, 7, 8, 47], 
      keywords: ['teoria geral e princípios', 'jurisdição', 'pressupostos', 'competência processual', 'capacidade', 'partes e procuradores', 'juiz e auxiliares', 'auxiliares', 'deveres das partes'] 
    },
    { 
      id: 'sec-cpc-litisconsorcio-atos', 
      nome: 'Atos & Litisconsórcio', 
      numeros: [9, 10, 11, 12, 19], 
      keywords: ['litisconsórcio', 'intervenção de terceiros', 'atos processuais', 'atos e nulidades', 'comunicação dos atos'] 
    },
    { 
      id: 'sec-cpc-fase-postulatoria', 
      nome: 'Petição & Tutela Provisória', 
      numeros: [13, 14, 15, 16, 17, 18, 50], 
      keywords: ['formação, suspensão e extinção', 'tutela provisória', 'tutelas provisórias', 'procedimento comum', 'petição inicial', 'respostas e comportamentos'] 
    },
    { 
      id: 'sec-cpc-provas-sentenca', 
      nome: 'Provas & Sentença', 
      numeros: [20, 21], 
      keywords: ['sentença e coisa julgada', 'provas no processo civil'] 
    },
    { 
      id: 'sec-cpc-recursos-tribunais', 
      nome: 'Recursos & Tribunais', 
      numeros: [22, 23, 24], 
      keywords: ['teoria geral dos recursos', 'recursos no processo civil', 'competência originária'] 
    },
    { 
      id: 'sec-cpc-execucao', 
      nome: 'Execução & Cumprimento', 
      numeros: [25, 32, 33, 34], 
      keywords: ['cumprimento de sentença', 'processo de execução', 'espécies de execução', 'embargos, suspensão'] 
    },
    { 
      id: 'sec-cpc-juizados-mediacao', 
      nome: 'Juizados & Mediação', 
      numeros: [26, 27, 28, 29, 30, 31], 
      keywords: ['resolução de disputas', 'mediação', 'arbitragem', 'juizado especial cível', 'juizado especial federal', 'juizado especial da fazenda'] 
    },
    { 
      id: 'sec-cpc-procedimentos-especiais', 
      nome: 'Procedimentos Especiais & Coletivo', 
      numeros: [35, 36, 37, 38, 39, 40, 41, 42, 43, 45, 46, 48, 49], 
      keywords: ['possessórias', 'exigir contas', 'consignação', 'inventário e partilha', 'alienação fiduciária', 'ações de família', 'superendividamento', 'processos estruturais', 'ação monitória', 'processual coletivo', 'despejo', 'processual do consumidor', 'direito de resposta'] 
    },
  ],

  'direito-constitucional': [
    { 
      id: 'sec-cf-teoria-constituinte', 
      nome: 'Teoria & Poder Constituinte', 
      numeros: [1, 2, 4, 5], 
      keywords: ['história constitucional', 'constitucionalismo', 'poder constituinte', 'hermenêutica constitucional'] 
    },
    { 
      id: 'sec-cf-direitos-fundamentais', 
      nome: 'Direitos Fundamentais', 
      numeros: [6, 7, 8, 9, 10, 11, 28, 32], 
      keywords: ['teoria geral dos direitos fundamentais', 'direitos individuais', 'remédios constitucionais', 'direitos sociais', 'nacionalidade', 'direitos políticos', 'pessoa com deficiência', 'eleitoral'] 
    },
    { 
      id: 'sec-cf-organizacao-poderes', 
      nome: 'Organização do Estado & Poderes', 
      numeros: [13, 14, 15, 16, 17, 18, 19, 20, 25, 26, 27, 33], 
      keywords: ['político-administrativa', 'poder legislativo', 'processo legislativo', 'poder executivo', 'poder judiciário', 'súmulas vinculantes', 'conselho nacional de justiça', 'defesa do estado', 'funções essenciais', 'advocacia pública', 'defensoria pública'] 
    },
    { 
      id: 'sec-cf-ordem-economica-social', 
      nome: 'Ordem Econômica & Social', 
      numeros: [12, 21, 22, 23, 24, 29, 30], 
      keywords: ['ordem econômica', 'ordem social', 'seguridade social na cf', 'educação, cultura', 'meio ambiente na cf', 'intervenção do estado', 'precatórios'] 
    },
    { 
      id: 'sec-cf-controle-constitucionalidade', 
      nome: 'Controle & Ações Constitucionais', 
      numeros: [3, 31, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44], 
      keywords: ['controle de constitucionalidade', 'adi', 'adc', 'ado', 'adpf', 'mandado de segurança', 'habeas corpus', 'habeas data', 'mandado de injunção', 'ação civil pública', 'ação popular', 'recurso extraordinário', 'recurso ordinário'] 
    },
  ],

  'direito-tributario': [
    { 
      id: 'sec-trib-sistema-principios', 
      nome: 'Sistema & Princípios', 
      numeros: [1, 3, 4, 5, 6, 7, 8, 10], 
      keywords: ['reforma tributária', 'fontes', 'interpretação', 'princípios tributários', 'imunidades', 'espécies tributárias', 'sistema tributário nacional'] 
    },
    { 
      id: 'sec-trib-competencia', 
      nome: 'Competência & Regimes', 
      numeros: [2, 9, 11, 17, 35], 
      keywords: ['competência tributária', 'simples nacional', 'repartição de receitas', 'concorrencial'] 
    },
    { 
      id: 'sec-trib-obrigacao-credito', 
      nome: 'Obrigação & Crédito', 
      numeros: [12, 13, 14, 15, 16, 19, 29], 
      keywords: ['obrigação tributária', 'responsabilidade tributária', 'crédito tributário', 'administração tributária', 'suspensão da exigibilidade', 'extinção do crédito', 'exclusão do crédito'] 
    },
    { 
      id: 'sec-trib-processo-execucao', 
      nome: 'Processo & Execução Fiscal', 
      numeros: [18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32], 
      keywords: ['execução fiscal', 'ação declaratória', 'recursos extraordinário', 'respostas à execução', 'consignação em pagamento', 'mandado de segurança', 'restituição', 'anulatória', 'processo tributário'] 
    },
  ],

  'direito-do-trabalho': [
    { 
      id: 'sec-trab-fundamentos', 
      nome: 'Princípios & Sujeitos', 
      numeros: [1, 2, 3, 4, 5, 16], 
      keywords: ['introdução', 'histórico', 'fontes e princípios', 'trabalho lato sensu', 'sujeitos do direito do trabalho', 'lgpd'] 
    },
    { 
      id: 'sec-trab-contrato-salario', 
      nome: 'Contrato & Salário', 
      numeros: [6, 7, 9, 10, 12, 24, 25], 
      keywords: ['remuneração e salário', 'efeitos conexos', 'duração do trabalho', 'fgts', 'terceirização', 'contrato de trabalho', 'suspensão, interrupção'] 
    },
    { 
      id: 'sec-trab-protecao-estabilidade', 
      nome: 'Saúde & Estabilidades', 
      numeros: [8, 13, 21, 22, 23, 26, 27], 
      keywords: ['acidente de trabalho', 'estabilidades', 'seguro-desemprego', 'salário família', 'salário-maternidade', 'saúde e segurança', 'criança e do adolescente'] 
    },
    { 
      id: 'sec-trab-rescisao-reforma', 
      nome: 'Rescisão & Reforma', 
      numeros: [11, 14, 15], 
      keywords: ['verbas rescisórias', 'prescrição e decadência', 'reforma trabalhista'] 
    },
    { 
      id: 'sec-trab-coletivo', 
      nome: 'Direito Coletivo', 
      numeros: [17, 18, 19, 20], 
      keywords: ['greve', 'negociação coletiva', 'direito coletivo do trabalho', 'pis-pasep'] 
    },
  ],

  'direito-processual-penal': [
    { 
      id: 'sec-cpp-inquerito-acao', 
      nome: 'Inquérito & Ação Penal', 
      numeros: [1, 2, 3, 4, 5], 
      keywords: ['princípios e garantias', 'inquérito', 'ação penal', 'persecução penal', 'ex delicto'] 
    },
    { 
      id: 'sec-cpp-jurisdicao-sujeitos', 
      nome: 'Jurisdição & Sujeitos', 
      numeros: [6, 7, 8], 
      keywords: ['jurisdição e competência', 'sujeitos processuais', 'comunicação dos atos'] 
    },
    { 
      id: 'sec-cpp-prisoes-liberdade', 
      nome: 'Prisões & Medidas Cautelares', 
      numeros: [9, 10, 11], 
      keywords: ['prisões cautelares', 'liberdade provisória', 'cautelares diversas'] 
    },
    { 
      id: 'sec-cpp-provas-nulidades', 
      nome: 'Provas & Nulidades', 
      numeros: [12, 13, 14], 
      keywords: ['teoria geral da prova', 'provas no processo penal', 'nulidades no processo penal'] 
    },
    { 
      id: 'sec-cpp-procedimentos-juri', 
      nome: 'Procedimentos, Júri & Sentença', 
      numeros: [15, 16, 17], 
      keywords: ['procedimento comum', 'tribunal do júri', 'sentença no processo penal'] 
    },
    { 
      id: 'sec-cpp-recursos-acoes', 
      nome: 'Recursos & Ações Autônomas', 
      numeros: [18, 19, 20, 21], 
      keywords: ['recursos criminais', 'recursos em espécie', 'habeas corpus', 'juizados especiais criminais'] 
    },
  ],

  'direito-previdenciario': [
    { 
      id: 'sec-prev-seguridade', 
      nome: 'Seguridade & Princípios', 
      numeros: [1, 2, 3, 4, 5], 
      keywords: ['seguridade social', 'assistência social', 'saúde'] 
    },
    { 
      id: 'sec-prev-rgps-dependentes', 
      nome: 'RGPS & Segurados', 
      numeros: [6, 7, 8], 
      keywords: ['previdência social brasileira', 'segurados e dependentes', 'bolsa família'] 
    },
    { 
      id: 'sec-prev-beneficios-auxilios', 
      nome: 'Pensões & Auxílios', 
      numeros: [9, 10, 11], 
      keywords: ['pensão por morte', 'auxílio reclusão', 'auxílio-acidente'] 
    },
    { 
      id: 'sec-prev-aposentadorias', 
      nome: 'Aposentadorias', 
      numeros: [12, 13, 14, 15], 
      keywords: ['aposentadoria'] 
    },
  ],

  'teoria-e-filosofia-do-direito': [
    { 
      id: 'sec-fil-filosofia-historia', 
      nome: 'Filosofia & História do Direito', 
      numeros: [1, 3, 4, 5, 6, 12, 14], 
      keywords: ['filosofia do direito', 'história do direito', 'antiguidade', 'modernidade', 'hans kelsen', 'capitalismo', 'direito romano'] 
    },
    { 
      id: 'sec-fil-teoria-hermeneutica', 
      nome: 'Teoria Geral & Hermenêutica', 
      numeros: [2, 7, 8, 9, 10, 11, 13, 15], 
      keywords: ['teoria da norma', 'hermenêutica', 'estudo do direito', 'lindb', 'ciência política', 'pragmatismo', 'neurociência'] 
    },
  ],

  'direito-empresarial': [
    { 
      id: 'sec-emp-teoria-sociedades', 
      nome: 'Empresa & Sociedades', 
      numeros: [1, 2, 3, 4, 7], 
      keywords: ['teoria geral do direito empresarial', 'sociedades', 'sociedade limitada', 'sociedades anônimas', 'desconsideração'] 
    },
    { 
      id: 'sec-emp-insolvencia', 
      nome: 'Falência & Recuperação', 
      numeros: [5, 6], 
      keywords: ['falência', 'recuperação judicial'] 
    },
    { 
      id: 'sec-emp-contratos-titulos', 
      nome: 'Contratos, Títulos & PI', 
      numeros: [8, 9, 10, 11, 12], 
      keywords: ['contratos empresariais', 'distribuição', 'títulos de crédito', 'propriedade intelectual'] 
    },
  ],

  'direito-financeiro': [
    { 
      id: 'sec-fin-sistema-orcamento', 
      nome: 'Orçamento & Finanças Públicas', 
      numeros: [1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 
      keywords: ['sistema financeiro', 'orçamento', 'receitas', 'despesas', 'federalismo', 'fontes', 'fundos', 'crédito e dívida', 'fiscalização'] 
    },
    { 
      id: 'sec-fin-economico-concorrencia', 
      nome: 'Direito Econômico & Concorrência', 
      numeros: [2, 3, 15, 16], 
      keywords: ['ordem econômica', 'internacional', 'econômico', 'defesa da concorrência'] 
    },
  ],

  'lei-penal-especial': [
    { 
      id: 'sec-lpe-crime-organizado', 
      nome: 'Crime Organizado, Drogas & Armas', 
      numeros: [1, 13, 14], 
      keywords: ['organizações criminosas', 'desarmamento', 'drogas'] 
    },
    { 
      id: 'sec-lpe-protecao-vulneraveis', 
      nome: 'Vulneráveis, Mulher & Idoso', 
      numeros: [4, 5], 
      keywords: ['pessoa idosa', 'maria da penha'] 
    },
    { 
      id: 'sec-lpe-estado-autoridade', 
      nome: 'Estado, Abuso & Hediondos', 
      numeros: [3, 7, 9, 10], 
      keywords: ['estado democrático', 'abuso de autoridade', 'tortura', 'hediondos'] 
    },
    { 
      id: 'sec-lpe-processo-transito', 
      nome: 'Trânsito, Execução Penal & Juizados', 
      numeros: [2, 6, 8, 11, 12], 
      keywords: ['contravenções', 'trânsito', 'juizado especial criminal', 'execução penal', 'interceptação'] 
    },
  ],

  'direito-processual-do-trabalho': [
    { 
      id: 'sec-dpt-organizacao-partes', 
      nome: 'Organização & Partes', 
      numeros: [1, 2, 3], 
      keywords: ['introdução ao processo do trabalho', 'organização da justiça', 'partes e procuradores'] 
    },
    { 
      id: 'sec-dpt-atos-reclamacao', 
      nome: 'Procedimentos & Reclamação', 
      numeros: [4, 9, 10, 11], 
      keywords: ['atos e procedimentos', 'reclamação trabalhista', 'verbas rescisórias', 'prescrição'] 
    },
    { 
      id: 'sec-dpt-recursos-execucao', 
      nome: 'Recursos & Execução Trabalhista', 
      numeros: [5, 6, 7, 8], 
      keywords: ['recursos', 'execução e liquidação', 'dissídios coletivos', 'honorários'] 
    },
  ],

  'portugues': [
    { 
      id: 'sec-por-morfologia-sintaxe', 
      nome: 'Morfologia & Sintaxe', 
      numeros: [2, 3, 4, 7, 8, 10], 
      keywords: ['concordância', 'regência', 'classes gramaticais', 'colocação pronominal', 'orações'] 
    },
    { 
      id: 'sec-por-ortografia-pontuacao', 
      nome: 'Ortografia & Pontuação', 
      numeros: [1, 6], 
      keywords: ['pontuação', 'acentuação e crase'] 
    },
    { 
      id: 'sec-por-compreensao-redacao', 
      nome: 'Interpretação & Redação', 
      numeros: [5, 9, 11], 
      keywords: ['interpretação de textos', 'semântica', 'redação'] 
    },
  ],

  'politicas-publicas': [
    { 
      id: 'sec-pol-estatutos-sociais', 
      nome: 'Estatutos & Cidadania', 
      numeros: [1, 2, 4, 9, 10, 11], 
      keywords: ['pessoa idosa', 'antidiscriminatório', 'pessoa com deficiência', 'cnj', 'diretivas antecipadas'] 
    },
    { 
      id: 'sec-pol-cidade-ambiente', 
      nome: 'Cidade, Internet & Meio Ambiente', 
      numeros: [3, 5, 6, 8, 12, 13, 14], 
      keywords: ['estatuto da cidade', 'marco civil', 'ambiental', 'desastres', 'licenciamento', 'responsabilidade ambiental'] 
    },
  ],

  'direitos-humanos': [
    { 
      id: 'sec-dh-sistemas', 
      nome: 'Sistemas Universal & Interamericano', 
      numeros: [1, 4], 
      keywords: ['interamericano', 'sistema universal', 'tratados'] 
    },
    { 
      id: 'sec-dh-teoria-brasil', 
      nome: 'Teoria Geral, Brasil & Minorias', 
      numeros: [2, 3, 5, 6, 7], 
      keywords: ['teoria geral', 'brasil', 'lgbtqia+', 'pessoa idosa', 'antidiscriminatório'] 
    },
  ],

  'direito-ambiental': [
    { 
      id: 'sec-amb-geral-licenciamento', 
      nome: 'Teoria Geral & Licenciamento', 
      numeros: [1, 2, 3, 4], 
      keywords: ['introdução', 'tópicos', 'licenciamento', 'responsabilidade ambiental'] 
    },
    { 
      id: 'sec-amb-preservacao-unidades', 
      nome: 'Espaços Protegidos & Desastres', 
      numeros: [5, 6, 7], 
      keywords: ['preservação permanente', 'unidades de conservação', 'desastres'] 
    },
  ],

  'direito-urbanistico': [
    { 
      id: 'sec-urb-parte-geral', 
      nome: 'Parte Geral & Estatuto da Cidade', 
      numeros: [1, 2, 3], 
      keywords: ['parte geral', 'legislação básica', 'estatuto da cidade'] 
    },
    { 
      id: 'sec-urb-cidade-instrumentos', 
      nome: 'Função Social & Instrumentos Urbanísticos', 
      numeros: [4, 5, 6], 
      keywords: ['direito à cidade', 'desastres', 'instrumentos de política urbana'] 
    },
  ],

  'formacao-complementar': [
    { 
      id: 'sec-fc-tecnologia-linguas', 
      nome: 'Direito Digital, LGPD & Idiomas', 
      numeros: [1, 2, 3, 4, 5], 
      keywords: ['direito digital', 'lgpd', 'inglês jurídico', 'fashion law', 'psicologia e neurociência'] 
    },
  ],

  'direito-desportivo': [
    { 
      id: 'sec-desp-geral', 
      nome: 'Direito Desportivo & Legislação', 
      numeros: [1, 2], 
      keywords: ['desportivo', 'desporto'] 
    },
  ],

  'direito-internacional-privado': [
    { 
      id: 'sec-dip-geral', 
      nome: 'Direito Internacional & Econômico', 
      numeros: [1, 2], 
      keywords: ['internacional privado', 'econômico internacional'] 
    },
  ],
};

function normalizeSlug(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/^direito-/, '');
}

export function getSubMateriasForArea(slugOrArea: string, fallbackItems?: any[]): SubMateriaConfig[] {
  if (!slugOrArea) return [];
  const normalized = normalizeSlug(slugOrArea);
  
  // 1. Procura chave direta
  if (AREA_SUB_MATERIAS[slugOrArea]) return AREA_SUB_MATERIAS[slugOrArea];
  if (AREA_SUB_MATERIAS[`direito-${normalized}`]) return AREA_SUB_MATERIAS[`direito-${normalized}`];
  if (AREA_SUB_MATERIAS[normalized]) return AREA_SUB_MATERIAS[normalized];

  // 2. Busca aproximada pelas chaves cadastradas
  for (const [key, list] of Object.entries(AREA_SUB_MATERIAS)) {
    const keyNorm = normalizeSlug(key);
    if (keyNorm === normalized || keyNorm.includes(normalized) || normalized.includes(keyNorm)) {
      return list;
    }
  }

  // 3. Fallback inteligente baseado nos itens existentes (se houver)
  if (fallbackItems && fallbackItems.length > 0) {
    if (fallbackItems.length <= 8) {
      return fallbackItems.map((item, idx) => ({
        id: `sec-auto-${idx}`,
        nome: item.titulo || `Módulo ${String(idx + 1).padStart(2, '0')}`,
        numeros: item.temaNum ? [item.temaNum] : [idx + 1],
        keywords: [String(item.titulo || '').toLowerCase()],
      }));
    }

    // Se tiver mais de 8 itens, agrupa em blocos balanceados de 4 a 6 itens
    const chunkSize = 5;
    const chunks: SubMateriaConfig[] = [];
    for (let i = 0; i < fallbackItems.length; i += chunkSize) {
      const slice = fallbackItems.slice(i, i + chunkSize);
      const startNum = String(i + 1).padStart(2, '0');
      const endNum = String(Math.min(i + chunkSize, fallbackItems.length)).padStart(2, '0');
      const firstName = slice[0]?.titulo ? slice[0].titulo.slice(0, 20) : `Parte ${startNum}`;
      chunks.push({
        id: `sec-chunk-${i}`,
        nome: `${firstName} (${startNum}-${endNum})`,
        numeros: slice.map((it: any, sIdx: number) => it.temaNum || i + sIdx + 1),
        keywords: slice.map((it: any) => String(it.titulo || '').toLowerCase()),
      });
    }
    return chunks;
  }

  return [];
}
