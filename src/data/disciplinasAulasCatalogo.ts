export interface DisciplinaItem {
  id: string;
  nome: string;
  subtitulo: string;
  descricao: string;
  capaHeroUrl: string;
  corDestaque: string;
  corGradientRing: [string, string];
  corFundoCard: string;
  corBorda: string;
  textAccentClass: string;
}

export const DISCIPLINAS_CATALOGO: DisciplinaItem[] = [
  {
    id: 'penal',
    nome: 'DIREITO PENAL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Imersão com narrativa interativa, casos reais, fixação ativa e áudios gravados por especialistas.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-penal.webp',
    corDestaque: '#ff8296',
    corGradientRing: ['#ff8296', '#c8102e'],
    corFundoCard: 'linear-gradient(180deg, #2e1219 0%, #200a11 100%)',
    corBorda: 'rgba(226,62,87,0.35)',
    textAccentClass: 'text-[#ff8296]'
  },
  {
    id: 'civil',
    nome: 'DIREITO CIVIL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Parte geral, pessoas, bens, fatos jurídicos, obrigações, contratos, direitos reais, família e sucessões.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-civil.webp',
    corDestaque: '#3b82f6',
    corGradientRing: ['#60a5fa', '#2563eb'],
    corFundoCard: 'linear-gradient(180deg, #0e2038 0%, #08111f 100%)',
    corBorda: 'rgba(59,130,246,0.35)',
    textAccentClass: 'text-[#3b82f6]'
  },
  {
    id: 'constitucional',
    nome: 'DIREITO CONSTITUCIONAL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Evolução constitucional do Brasil, princípios fundamentais, organização dos poderes e garantias fundamentais.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-constitucional.webp',
    corDestaque: '#22c55e',
    corGradientRing: ['#4ade80', '#16a34a'],
    corFundoCard: 'linear-gradient(180deg, #0e2916 0%, #08170c 100%)',
    corBorda: 'rgba(34,197,94,0.35)',
    textAccentClass: 'text-[#22c55e]'
  },
  {
    id: 'administrativo',
    nome: 'DIREITO ADMINISTRATIVO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Origens históricas, consolidação do Estado de Direito, poderes administrativos e regime jurídico-administrativo.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-administrativo.webp',
    corDestaque: '#d9a00a',
    corGradientRing: ['#ffe38a', '#d9a00a'],
    corFundoCard: 'linear-gradient(180deg, #2e2410 0%, #1a1205 100%)',
    corBorda: 'rgba(217,160,10,0.35)',
    textAccentClass: 'text-[#d9a00a]'
  },
  {
    id: 'trabalho',
    nome: 'DIREITO DO TRABALHO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Princípios fundamentais, fontes materiais e formais do trabalho, negociação coletiva e jurisprudência do TST.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-do-trabalho.webp',
    corDestaque: '#a855f7',
    corGradientRing: ['#c084fc', '#9333ea'],
    corFundoCard: 'linear-gradient(180deg, #25123d 0%, #150924 100%)',
    corBorda: 'rgba(168,85,247,0.35)',
    textAccentClass: 'text-[#a855f7]'
  },
  {
    id: 'processual-civil',
    nome: 'DIREITO PROCESSUAL CIVIL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Normas fundamentais, jurisdição, competência, tutela provisória, procedimento comum, recursos e execução.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-processual-civil.webp',
    corDestaque: '#06b6d4',
    corGradientRing: ['#22d3ee', '#0891b2'],
    corFundoCard: 'linear-gradient(180deg, #0c2b33 0%, #06171c 100%)',
    corBorda: 'rgba(6,182,212,0.35)',
    textAccentClass: 'text-[#06b6d4]'
  },
  {
    id: 'processual-penal',
    nome: 'DIREITO PROCESSUAL PENAL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Inquérito policial, ação penal, provas, prisões cautelares, procedimentos, tribunal do júri e recursos penais.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-processual-penal.webp',
    corDestaque: '#f43f5e',
    corGradientRing: ['#fb7185', '#e11d48'],
    corFundoCard: 'linear-gradient(180deg, #330f18 0%, #1c080d 100%)',
    corBorda: 'rgba(244,63,94,0.35)',
    textAccentClass: 'text-[#f43f5e]'
  },
  {
    id: 'tributario',
    nome: 'DIREITO TRIBUTÁRIO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Sistema Tributário Nacional, princípios, imunidades, competência, obrigação, crédito e processo tributário.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-tributario.webp',
    corDestaque: '#eab308',
    corGradientRing: ['#fde047', '#ca8a04'],
    corFundoCard: 'linear-gradient(180deg, #332608 0%, #1c1504 100%)',
    corBorda: 'rgba(234,179,8,0.35)',
    textAccentClass: 'text-[#eab308]'
  },
  {
    id: 'empresarial',
    nome: 'DIREITO EMPRESARIAL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Teoria da empresa, empresário individual, sociedades empresárias, títulos de crédito, falência e recuperação.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-empresarial.webp',
    corDestaque: '#6366f1',
    corGradientRing: ['#818cf8', '#4f46e5'],
    corFundoCard: 'linear-gradient(180deg, #18193d 0%, #0d0e24 100%)',
    corBorda: 'rgba(99,102,241,0.35)',
    textAccentClass: 'text-[#6366f1]'
  },
  {
    id: 'ambiental',
    nome: 'DIREITO AMBIENTAL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Princípios constitucionais, Política Nacional do Meio Ambiente, licenciamento, APP, reserva legal e responsabilidade.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-ambiental.webp',
    corDestaque: '#10b981',
    corGradientRing: ['#34d399', '#059669'],
    corFundoCard: 'linear-gradient(180deg, #0d2b1f 0%, #071711 100%)',
    corBorda: 'rgba(16,185,129,0.35)',
    textAccentClass: 'text-[#10b981]'
  },
  {
    id: 'previdenciario',
    nome: 'DIREITO PREVIDENCIÁRIO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Seguridade social, RGPS, benefícios em espécie, custeio, carência e regras de transição previdenciária.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-previdenciario.webp',
    corDestaque: '#f59e0b',
    corGradientRing: ['#fbbf24', '#d97706'],
    corFundoCard: 'linear-gradient(180deg, #33220a 0%, #1c1305 100%)',
    corBorda: 'rgba(245,158,11,0.35)',
    textAccentClass: 'text-[#f59e0b]'
  },
  {
    id: 'processual-trabalho',
    nome: 'DIREITO PROCESSUAL DO TRABALHO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Organização da Justiça do Trabalho, competência, petição inicial, audiência, provas, recursos e execução trabalhista.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-processual-do-trabalho.webp',
    corDestaque: '#8b5cf6',
    corGradientRing: ['#a78bfa', '#7c3aed'],
    corFundoCard: 'linear-gradient(180deg, #21153d 0%, #120b24 100%)',
    corBorda: 'rgba(139,92,246,0.35)',
    textAccentClass: 'text-[#8b5cf6]'
  },
  {
    id: 'financeiro',
    nome: 'DIREITO FINANCEIRO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Orçamento público, PPA, LDO, LOA, receitas e despesas públicas, dívida pública e Lei de Responsabilidade Fiscal.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-financeiro.webp',
    corDestaque: '#14b8a6',
    corGradientRing: ['#2dd4bf', '#0d9488'],
    corFundoCard: 'linear-gradient(180deg, #0b2b27 0%, #061715 100%)',
    corBorda: 'rgba(20,184,166,0.35)',
    textAccentClass: 'text-[#14b8a6]'
  },
  {
    id: 'internacional-privado',
    nome: 'DIREITO INTERNACIONAL PRIVADO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Conflito de leis no espaço, LINDB, nacionalidade, condição jurídica do estrangeiro e homologação de sentença estrangeira.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-internacional-privado.webp',
    corDestaque: '#0ea5e9',
    corGradientRing: ['#38bdf8', '#0284c7'],
    corFundoCard: 'linear-gradient(180deg, #0d2738 0%, #07151f 100%)',
    corBorda: 'rgba(14,165,233,0.35)',
    textAccentClass: 'text-[#0ea5e9]'
  },
  {
    id: 'urbanistico',
    nome: 'DIREITO URBANÍSTICO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Estatuto da Cidade, plano diretor, função social da propriedade urbana, parcelamento do solo e desapropriação.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-urbanistico.webp',
    corDestaque: '#84cc16',
    corGradientRing: ['#a3e635', '#65a30d'],
    corFundoCard: 'linear-gradient(180deg, #22330a 0%, #131c05 100%)',
    corBorda: 'rgba(132,204,22,0.35)',
    textAccentClass: 'text-[#84cc16]'
  },
  {
    id: 'direitos-humanos',
    nome: 'DIREITOS HUMANOS',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Teoria geral, gerações de direitos, Sistema Global (ONU), Sistema Interamericano e jurisprudência da Corte IDH.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direitos-humanos.webp',
    corDestaque: '#f97316',
    corGradientRing: ['#fb923c', '#ea580c'],
    corFundoCard: 'linear-gradient(180deg, #381b0a 0%, #1f0f05 100%)',
    corBorda: 'rgba(249,115,22,0.35)',
    textAccentClass: 'text-[#f97316]'
  },
  {
    id: 'lei-penal-especial',
    nome: 'LEI PENAL ESPECIAL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Drogas, armas, crimes hediondos, abuso de autoridade, Maria da Penha, lavagem de capitais e organizações criminosas.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/lei-penal-especial.webp',
    corDestaque: '#ef4444',
    corGradientRing: ['#f87171', '#dc2626'],
    corFundoCard: 'linear-gradient(180deg, #331111 0%, #1c0909 100%)',
    corBorda: 'rgba(239,68,68,0.35)',
    textAccentClass: 'text-[#ef4444]'
  },
  {
    id: 'filosofia',
    nome: 'TEORIA E FILOSOFIA DO DIREITO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Jusnaturalismo, positivismo jurídico, pós-positivismo, teorias da justiça, hermenêutica e argumentação jurídica.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/teoria-e-filosofia-do-direito.webp',
    corDestaque: '#d4b996',
    corGradientRing: ['#f5e6d3', '#a68a68'],
    corFundoCard: 'linear-gradient(180deg, #2d241c 0%, #17120e 100%)',
    corBorda: 'rgba(212,185,150,0.35)',
    textAccentClass: 'text-[#d4b996]'
  },
  {
    id: 'desportivo',
    nome: 'DIREITO DESPORTIVO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Justiça Desportiva, Código Brasileiro de Justiça Desportiva, Lei Pelé, SAF e contratos desportivos profissionais.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/direito-desportivo.webp',
    corDestaque: '#38bdf8',
    corGradientRing: ['#7dd3fc', '#0284c7'],
    corFundoCard: 'linear-gradient(180deg, #0d2938 0%, #07161f 100%)',
    corBorda: 'rgba(56,189,248,0.35)',
    textAccentClass: 'text-[#38bdf8]'
  },
  {
    id: 'politicas-publicas',
    nome: 'POLÍTICAS PÚBLICAS',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Ciclo de políticas públicas, formulação, implementação, avaliação, controle judicial e direitos sociais prestacionais.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/politicas-publicas.webp',
    corDestaque: '#fb7185',
    corGradientRing: ['#fda4af', '#f43f5e'],
    corFundoCard: 'linear-gradient(180deg, #36111a 0%, #1e090e 100%)',
    corBorda: 'rgba(251,113,133,0.35)',
    textAccentClass: 'text-[#fb7185]'
  },
  {
    id: 'portugues',
    nome: 'PORTUGUÊS JURÍDICO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Redação forense, argumentação discursiva, clareza, concisão, regras gramaticais e elaboração de peças processuais.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/portugues.webp',
    corDestaque: '#ec4899',
    corGradientRing: ['#f472b6', '#db2777'],
    corFundoCard: 'linear-gradient(180deg, #361024 0%, #1e0914 100%)',
    corBorda: 'rgba(236,72,153,0.35)',
    textAccentClass: 'text-[#ec4899]'
  },
  {
    id: 'formacao-complementar',
    nome: 'FORMAÇÃO COMPLEMENTAR',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Oratória jurídica, ética profissional, gestão de escritórios, legal design e inteligência artificial aplicada ao Direito.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/audioaulas/capas/formacao-complementar.webp',
    corDestaque: '#2dd4bf',
    corGradientRing: ['#5eead4', '#14b8a6'],
    corFundoCard: 'linear-gradient(180deg, #0d2e2b 0%, #071918 100%)',
    corBorda: 'rgba(45,212,191,0.35)',
    textAccentClass: 'text-[#2dd4bf]'
  }
];

