import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Play, CheckCircle2, BookOpen, Layers, 
  ArrowLeft, Check, Lock, HelpCircle, Award, 
  RotateCcw, AlertCircle, Unlock, ChevronRight, GraduationCap,
  ShieldCheck, Compass
} from 'lucide-react';
import { CONTEUDO_AULAS } from '@/data/aulasInterativasConteudo';
import { ModalRevisarFlashcards } from '@/components/aulas-interativas/ModalRevisarFlashcards';
import { ModalPraticarQuestoes } from '@/components/aulas-interativas/ModalPraticarQuestoes';
import adminCover from '@/assets/biblioteca/areas/direito-administrativo.webp';
import themisHero from '@/assets/jurisprudencia-hero-themis.webp';
import capaAdminOrigens from '@/assets/aulas-interativas/direito-administrativo/capa-aula-01-origens.webp';
import capaAdminDefinicoes from '@/assets/aulas-interativas/direito-administrativo/capa-aula-02-definicoes.webp';
import aula01HtmlRaw from '@/assets/aulas-interativas/direito-administrativo/aula-01.html?raw';
import aula02HtmlRaw from '@/assets/aulas-interativas/direito-administrativo/aula-02.html?raw';

interface AulaItem {
  id: string;
  numeroAula: string;
  titulo: string;
  descricao: string;
  slug: string;
  etapas: number;
  audioQtd: number;
  imagensQtd: number;
  urlHtmlR2: string;
  capaUrl: string;
  status: 'pronto' | 'pendente';
  disciplinaId: string;
  materiaId: string;
  htmlConteudoRaw?: string;
}

interface MateriaItem {
  id: string;
  disciplinaId: string;
  numeroMateria: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  capaUrl: string;
}

interface DisciplinaItem {
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

const DISCIPLINAS_CATALOGO: DisciplinaItem[] = [
  {
    id: 'penal',
    nome: 'DIREITO PENAL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Imersão com narrativa interativa, casos reais, fixação ativa e áudios gravados por especialistas.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/direito-penal-hero.jpg',
    corDestaque: '#ff8296',
    corGradientRing: ['#ff8296', '#c8102e'],
    corFundoCard: 'linear-gradient(180deg, #2e1219 0%, #200a11 100%)',
    corBorda: 'rgba(226,62,87,0.35)',
    textAccentClass: 'text-[#ff8296]'
  },
  {
    id: 'administrativo',
    nome: 'DIREITO ADMINISTRATIVO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Origens históricas na França revolucionária, consolidação do Estado de Direito, critérios de definição e regime jurídico-administrativo.',
    capaHeroUrl: capaAdminOrigens,
    corDestaque: '#d9a00a',
    corGradientRing: ['#ffe38a', '#d9a00a'],
    corFundoCard: 'linear-gradient(180deg, #2e2410 0%, #1a1205 100%)',
    corBorda: 'rgba(217,160,10,0.35)',
    textAccentClass: 'text-[#d9a00a]'
  },
  {
    id: 'constitucional',
    nome: 'DIREITO CONSTITUCIONAL',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Evolução constitucional do Brasil, da independência de 1822 e Carta de 1824 aos princípios fundamentais, organização dos poderes e garantias fundamentais.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-constitucional/01-historia-constitucional/aula-01-da-independencia/imagens/capa.webp',
    corDestaque: '#22c55e',
    corGradientRing: ['#4ade80', '#16a34a'],
    corFundoCard: 'linear-gradient(180deg, #0e2916 0%, #08170c 100%)',
    corBorda: 'rgba(34,197,94,0.35)',
    textAccentClass: 'text-[#22c55e]'
  },
  {
    id: 'trabalho',
    nome: 'DIREITO DO TRABALHO',
    subtitulo: 'ÁREA DO CONHECIMENTO',
    descricao: 'Princípios fundamentais, fontes materiais e formais do trabalho, negociação coletiva (CCT/ACT) e as reformas e jurisprudência do TST.',
    capaHeroUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-do-trabalho/01-introducao/aula-01-fontes-materiais-formais/imagens/capa.webp',
    corDestaque: '#a855f7',
    corGradientRing: ['#c084fc', '#9333ea'],
    corFundoCard: 'linear-gradient(180deg, #25123d 0%, #150924 100%)',
    corBorda: 'rgba(168,85,247,0.35)',
    textAccentClass: 'text-[#a855f7]'
  }
];

const MATERIAS_CATALOGO: MateriaItem[] = [
  {
    id: 'penal-familia',
    disciplinaId: 'penal',
    numeroMateria: '01. CRIMES CONTRA A FAMÍLIA',
    titulo: 'Crimes Contra a Família',
    subtitulo: 'Título VII do Código Penal',
    descricao: 'Estudo aprofundado dos crimes contra o casamento, bigamia, erro essencial e impedimentos com jurisprudência consolidada.',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/capa-3x4.webp'
  },
  {
    id: 'admin-origens-definicoes',
    disciplinaId: 'administrativo',
    numeroMateria: '01. ORIGENS E DEFINIÇÕES DO DIREITO ADMINISTRATIVO',
    titulo: 'Origens e Definições do Direito Administrativo',
    subtitulo: 'Gênese histórica, Estado de Direito e critérios conceituais',
    descricao: 'Estudo da formação do Direito Administrativo na França pós-revolucionária, superação do patrimonialismo pela burocracia, Lei de 1872, caso Blanco e critérios definidores.',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-01-origens/capa-3x4.webp'
  },
  {
    id: 'const-historia',
    disciplinaId: 'constitucional',
    numeroMateria: '01. HISTÓRIA CONSTITUCIONAL DO BRASIL',
    titulo: 'História Constitucional do Brasil',
    subtitulo: 'Da Independência à Constituição Imperial de 1824',
    descricao: 'Gênese do constitucionalismo brasileiro, Constituinte da Macaxeira de 1823, Noite da Agonia, outorga da Carta de 1824, o Poder Moderador e garantias imperiais.',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-constitucional/01-historia-constitucional/aula-01-da-independencia/capa-3x4.webp'
  },
  {
    id: 'trab-introducao',
    disciplinaId: 'trabalho',
    numeroMateria: '01. INTRODUÇÃO AO DIREITO DO TRABALHO',
    titulo: 'Introdução ao Direito do Trabalho',
    subtitulo: 'Fontes materiais, formais e negociação coletiva',
    descricao: 'Evolução histórica, classificação das fontes do Direito do Trabalho, fontes heterônomas vs autônomas, Convenções e Acordos Coletivos e prevalência do negociado.',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-do-trabalho/01-introducao/aula-01-fontes-materiais-formais/capa-3x4.webp'
  }
];

const AULAS_CATALOGO: AulaItem[] = [
  {
    id: 'penal-01-01',
    disciplinaId: 'penal',
    materiaId: 'penal-familia',
    numeroAula: 'AULA 01',
    titulo: 'Crimes Contra a Família (Bigamia)',
    descricao: 'Estudo aprofundado dos crimes contra o casamento, tipicidade da bigamia, causas de anulação civil retroativa e jurisprudência consolidada dos Tribunais Superiores.',
    slug: 'aula-01-crimes-contra-a-familia',
    etapas: 32,
    audioQtd: 32,
    imagensQtd: 30,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-01-crimes-contra-a-familia/capa-3x4.webp',
    status: 'pronto'
  },
  {
    id: 'penal-01-02',
    disciplinaId: 'penal',
    materiaId: 'penal-familia',
    numeroAula: 'AULA 02',
    titulo: 'Induzimento a Erro Essencial e Ocultação de Impedimento',
    descricao: 'Estudo aprofundado do art. 236 do CP: erro essencial sobre a pessoa, impedimentos dirimentes, condição objetiva de procedibilidade e ação penal privada personalíssima.',
    slug: 'aula-02-induzimento-a-erro-essencial',
    etapas: 32,
    audioQtd: 32,
    imagensQtd: 30,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-02-induzimento-a-erro-essencial/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-penal/01-crimes-contra-a-familia/aula-02-induzimento-a-erro-essencial/capa-3x4.webp',
    status: 'pronto'
  },
  {
    id: 'admin-01-01',
    disciplinaId: 'administrativo',
    materiaId: 'admin-origens-definicoes',
    numeroAula: 'AULA 01',
    titulo: 'Origens do Direito Administrativo',
    descricao: 'Surge na França com o Estado de Direito, superação do patrimonialismo pela burocracia, Lei de 1872 do Conselho de Estado e o nascimento autônomo com o caso Blanco.',
    slug: 'aula-01-origens',
    etapas: 38,
    audioQtd: 38,
    imagensQtd: 38,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-01-origens/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-01-origens/capa-3x4.webp',
    status: 'pronto',
    htmlConteudoRaw: aula01HtmlRaw
  },
  {
    id: 'admin-01-02',
    disciplinaId: 'administrativo',
    materiaId: 'admin-origens-definicoes',
    numeroAula: 'AULA 02',
    titulo: 'Definições do Direito Administrativo',
    descricao: 'Critérios de definição (puissance publique, service public, teleológico, negativo) e o critério da Administração Pública em sentido objetivo e subjetivo adotado no Brasil.',
    slug: 'aula-02-definicoes',
    etapas: 38,
    audioQtd: 38,
    imagensQtd: 38,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-02-definicoes/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-administrativo/01-origens-e-definicoes/aula-02-definicoes/capa-3x4.webp',
    status: 'pronto',
    htmlConteudoRaw: aula02HtmlRaw
  },
  {
    id: 'const-01-01',
    disciplinaId: 'constitucional',
    materiaId: 'const-historia',
    numeroAula: 'AULA 01',
    titulo: 'Da Independência à Constituição de 1824',
    descricao: 'Contexto pós-independência de 1822, convocação da Constituinte da Macaxeira, dissolução por D. Pedro I e outorga da Carta de 1824.',
    slug: 'aula-01-da-independencia',
    etapas: 30,
    audioQtd: 38,
    imagensQtd: 17,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-constitucional/01-historia-constitucional/aula-01-da-independencia/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-constitucional/01-historia-constitucional/aula-01-da-independencia/capa-3x4.webp',
    status: 'pronto'
  },
  {
    id: 'const-01-02',
    disciplinaId: 'constitucional',
    materiaId: 'const-historia',
    numeroAula: 'AULA 02',
    titulo: 'Constituição de 1824',
    descricao: 'Estrutura institucional do Império, o Poder Moderador, o Senado vitalício, a religião oficial católica e os direitos civis e políticos.',
    slug: 'aula-02-constituicao-1824',
    etapas: 30,
    audioQtd: 39,
    imagensQtd: 18,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-constitucional/01-historia-constitucional/aula-02-constituicao-1824/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-constitucional/01-historia-constitucional/aula-02-constituicao-1824/capa-3x4.webp',
    status: 'pronto'
  },
  {
    id: 'trab-01-01',
    disciplinaId: 'trabalho',
    materiaId: 'trab-introducao',
    numeroAula: 'AULA 01',
    titulo: 'Fontes materiais e formais',
    descricao: 'Compreensão das fontes materiais (fatores econômicos e sociais) e fontes formais (heterônomas e autônomas) no ordenamento trabalhista.',
    slug: 'aula-01-fontes-materiais-formais',
    etapas: 30,
    audioQtd: 39,
    imagensQtd: 12,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-do-trabalho/01-introducao/aula-01-fontes-materiais-formais/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-do-trabalho/01-introducao/aula-01-fontes-materiais-formais/capa-3x4.webp',
    status: 'pronto'
  },
  {
    id: 'trab-01-02',
    disciplinaId: 'trabalho',
    materiaId: 'trab-introducao',
    numeroAula: 'AULA 02',
    titulo: 'Fontes autônomas em espécie',
    descricao: 'Convenção Coletiva de Trabalho (CCT), Acordo Coletivo de Trabalho (ACT), contratos individuais e a prevalência do negociado sobre o legislado.',
    slug: 'aula-02-fontes-autonomas',
    etapas: 30,
    audioQtd: 39,
    imagensQtd: 12,
    urlHtmlR2: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-do-trabalho/01-introducao/aula-02-fontes-autonomas/aula.html',
    capaUrl: 'https://pub-571d075cadcb4d2196a6545456271ce4.r2.dev/aulas-interativas/direito-do-trabalho/01-introducao/aula-02-fontes-autonomas/capa-3x4.webp',
    status: 'pronto'
  }
];

const PROGRESSO_STORAGE_KEY = 'aulas_interativas_progresso_v1';
const FLASHCARDS_STORAGE_KEY = 'aulas_interativas_flashcards_v1';
const QUESTOES_STORAGE_KEY = 'aulas_interativas_questoes_v1';

function getStoredProgresso(): Record<string, { etapaAtual: number }> {
  try {
    const raw = localStorage.getItem(PROGRESSO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredProgresso(aulaId: string, etapaAtual: number) {
  try {
    const atual = getStoredProgresso();
    atual[aulaId] = { etapaAtual };
    localStorage.setItem(PROGRESSO_STORAGE_KEY, JSON.stringify(atual));
  } catch {}
}

function getStoredBooleanMap(key: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setStoredBoolean(key: string, id: string, val: boolean) {
  try {
    const obj = getStoredBooleanMap(key);
    obj[id] = val;
    localStorage.setItem(key, JSON.stringify(obj));
  } catch {}
}

export default function AdminAulasInterativas() {
  const navigate = useNavigate();

  // Estados de navegação hierárquica
  const [disciplinaSelecionadaId, setDisciplinaSelecionadaId] = useState<string | null>(null);
  const [materiaSelecionadaId, setMateriaSelecionadaId] = useState<string | null>(null);
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);

  // Estados de progresso
  const [progressoMap, setProgressoMap] = useState<Record<string, { etapaAtual: number }>>(() => getStoredProgresso());
  const [flashcardsConcluidos, setFlashcardsConcluidos] = useState<Record<string, boolean>>(() => getStoredBooleanMap(FLASHCARDS_STORAGE_KEY));
  const [questoesConcluidas, setQuestoesConcluidas] = useState<Record<string, boolean>>(() => getStoredBooleanMap(QUESTOES_STORAGE_KEY));

  // Modais de Revisão e Prática
  const [modalFlashcardsAula, setModalFlashcardsAula] = useState<AulaItem | null>(null);
  const [modalQuestoesAula, setModalQuestoesAula] = useState<AulaItem | null>(null);
  const [toastAviso, setToastAviso] = useState<string | null>(null);
  const [modoLivreTeste, setModoLivreTeste] = useState(false);

  useEffect(() => {
    if (!toastAviso) return;
    const timer = setTimeout(() => setToastAviso(null), 3500);
    return () => clearTimeout(timer);
  }, [toastAviso]);

  // Listener para capturar avanço de etapa dentro do iframe da aula
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && (e.data.type === 'AULA_INTERATIVA_PROGRESSO' || e.data.type === 'etapa_changed')) {
        const aulaId = e.data.aulaId || aulaAtiva?.id;
        const etapa = Number(e.data.etapaAtual || e.data.etapa || 1);
        if (aulaId) {
          saveStoredProgresso(aulaId, etapa);
          setProgressoMap(prev => ({ ...prev, [aulaId]: { etapaAtual: etapa } }));
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [aulaAtiva]);

  // Cálculo de progresso de cada aula individual (Ponderado: 34% + 33% + 33% = 100%)
  const calcularProgressoCiclo = (aula: AulaItem) => {
    const salvo = progressoMap[aula.id];
    const etapaAtual = salvo ? salvo.etapaAtual : 0;
    
    // Pilar 1: Aula (vale até 34%)
    const aulaTerminada = etapaAtual >= aula.etapas;
    const pctAula = aulaTerminada 
      ? 34 
      : aula.etapas > 0 
        ? Math.round((etapaAtual / aula.etapas) * 34) 
        : 0;

    // Pilar 2: Flashcards (vale 33%)
    const fcOk = !!flashcardsConcluidos[aula.id];
    const pctFlashcards = fcOk ? 33 : 0;

    // Pilar 3: Praticar / Questões (vale 33%)
    const questoesOk = !!questoesConcluidas[aula.id];
    const pctQuestoes = questoesOk ? 33 : 0;

    const fasesConcluidasCount = (aulaTerminada ? 1 : 0) + (fcOk ? 1 : 0) + (questoesOk ? 1 : 0);
    const cicloCompleto = fasesConcluidasCount === 3;
    const porcentagemTotal = cicloCompleto ? 100 : Math.min(99, pctAula + pctFlashcards + pctQuestoes);

    return {
      etapaAtual,
      totalEtapas: aula.etapas,
      aulaTerminada,
      fcOk,
      questoesOk,
      fasesConcluidasCount,
      porcentagemTotal,
      cicloCompleto
    };
  };

  // Progresso Geral da Plataforma (todas as aulas)
  const totalAulasGeral = AULAS_CATALOGO.length;
  const somaPorcentagensGeral = AULAS_CATALOGO.reduce((acc, aula) => acc + calcularProgressoCiclo(aula).porcentagemTotal, 0);
  const porcentagemGeral = totalAulasGeral > 0 ? Math.round(somaPorcentagensGeral / totalAulasGeral) : 0;
  const ciclosGeralCompletos = AULAS_CATALOGO.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;

  // Obter disciplina e matéria ativas
  const disciplinaAtual = DISCIPLINAS_CATALOGO.find(d => d.id === disciplinaSelecionadaId) || null;
  const materiaAtual = MATERIAS_CATALOGO.find(m => m.id === materiaSelecionadaId) || null;

  // Aulas filtradas
  const aulasDaMateria = materiaAtual 
    ? AULAS_CATALOGO.filter(a => a.materiaId === materiaAtual.id) 
    : [];

  const iniciarAula = (aula: AulaItem) => {
    if (!progressoMap[aula.id] || progressoMap[aula.id].etapaAtual === 0) {
      saveStoredProgresso(aula.id, 1);
      setProgressoMap(prev => ({ ...prev, [aula.id]: { etapaAtual: 1 } }));
    }
    setAulaAtiva(aula);
  };

  const concluirAulaManual = (aulaId: string, totalEtapas: number) => {
    saveStoredProgresso(aulaId, totalEtapas);
    setProgressoMap(prev => ({ ...prev, [aulaId]: { etapaAtual: totalEtapas } }));
    setToastAviso('Fase 1 (Aula) concluída! Fase 2 (Revisar Flashcards) liberada.');
  };

  const abrirRevisarFlashcards = (aula: AulaItem) => {
    const prog = calcularProgressoCiclo(aula);
    const liberado = prog.aulaTerminada || modoLivreTeste;

    if (!liberado) {
      setToastAviso('Complete a aula interativa primeiro para liberar a revisão com Flashcards!');
      return;
    }

    setModalFlashcardsAula(aula);
  };

  const concluirFlashcards = (aulaId: string) => {
    setStoredBoolean(FLASHCARDS_STORAGE_KEY, aulaId, true);
    setFlashcardsConcluidos(prev => ({ ...prev, [aulaId]: true }));
    setToastAviso('Fase 2 (Flashcards) concluída! Fase 3 (Praticar Questões) liberada.');
  };

  const abrirPraticarQuestoes = (aula: AulaItem) => {
    const prog = calcularProgressoCiclo(aula);
    const liberado = (prog.aulaTerminada && prog.fcOk) || modoLivreTeste;

    if (!liberado) {
      setToastAviso('Conclua os Flashcards de revisão primeiro para liberar as Questões práticas!');
      return;
    }

    setModalQuestoesAula(aula);
  };

  const concluirQuestoes = (aulaId: string) => {
    setStoredBoolean(QUESTOES_STORAGE_KEY, aulaId, true);
    setQuestoesConcluidas(prev => ({ ...prev, [aulaId]: true }));
    setToastAviso('Parabéns! 100% da aula concluída (Aula + Flashcards + Questões)!');
  };

  // Botão voltar hierárquico
  const handleVoltar = () => {
    if (aulaAtiva) {
      setAulaAtiva(null);
    } else if (materiaSelecionadaId) {
      setMateriaSelecionadaId(null);
    } else if (disciplinaSelecionadaId) {
      setDisciplinaSelecionadaId(null);
    } else {
      navigate('/admin-funcoes');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // NÍVEL 4: TELA CHEIA DA AULA INTERATIVA
  // ─────────────────────────────────────────────────────────────────────────────
  if (aulaAtiva) {
    const progAula = calcularProgressoCiclo(aulaAtiva);
    const isAdministrativo = aulaAtiva.disciplinaId === 'administrativo';
    const discNome = isAdministrativo ? 'DIREITO ADMINISTRATIVO' : 'DIREITO PENAL';
    const discCor = isAdministrativo ? '#d9a00a' : '#ff8296';
    const headerBg = isAdministrativo 
      ? 'linear-gradient(180deg, #2e2410 0%, #1a1205 100%)' 
      : 'linear-gradient(180deg, #280611 0%, #16040a 100%)';
    const headerBorder = isAdministrativo
      ? 'border-[rgba(217,160,10,0.35)]'
      : 'border-[rgba(226,62,87,0.35)]';
    const buttonBackClass = isAdministrativo
      ? 'bg-[rgba(46,36,16,0.85)] border-[rgba(217,160,10,0.45)] text-[#ffe38a] hover:bg-[rgba(70,52,20,1)]'
      : 'bg-[rgba(46,15,24,0.85)] border-[rgba(226,62,87,0.45)] text-[#ff8296] hover:bg-[rgba(66,20,34,1)]';
    const iframeBg = isAdministrativo ? '#140e02' : '#120409';

    return (
      <div 
        className="fixed inset-0 z-[100] flex flex-col w-screen h-screen overflow-hidden"
        style={{ backgroundColor: iframeBg }}
      >
        {/* Cabeçalho Superior Temático Adaptado à Paleta Real com Safe Area Inset Top */}
        <header
          className={`flex items-center justify-between px-3 sm:px-6 border-b ${headerBorder} shrink-0 z-30 shadow-lg shadow-black/60`}
          style={{
            background: headerBg,
            paddingTop: 'calc(1.15rem + var(--sai-top, env(safe-area-inset-top, 0px)))',
            paddingBottom: '0.85rem'
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setAulaAtiva(null)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center shrink-0 transition active:scale-95 shadow-md shadow-black/40 ${buttonBackClass}`}
              aria-label="Voltar à matéria"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
            </button>

            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span 
                  className="text-[10px] font-extrabold uppercase tracking-widest truncate"
                  style={{ color: discCor }}
                >
                  {discNome} · {aulaAtiva.numeroAula}
                </span>
                <span className="hidden xs:inline-block text-[10px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30">
                  {aulaAtiva.etapas} Etapas
                </span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white truncate font-serif">
                {aulaAtiva.titulo}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!progAula.aulaTerminada ? (
              <button
                type="button"
                onClick={() => concluirAulaManual(aulaAtiva.id, aulaAtiva.etapas)}
                className="px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 transition flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span className="hidden xs:inline">Concluir Aula</span>
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Aula Concluída
              </span>
            )}
          </div>
        </header>

        {/* Iframe 100% Tela Cheia com suporte a srcDoc para carregamento instantâneo offline */}
        <div 
          className="flex-1 w-full h-full relative overflow-hidden"
          style={{ 
            backgroundColor: iframeBg,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          <iframe
            srcDoc={aulaAtiva.htmlConteudoRaw || undefined}
            src={!aulaAtiva.htmlConteudoRaw ? `${aulaAtiva.urlHtmlR2}?t=${Date.now()}` : undefined}
            title={aulaAtiva.titulo}
            className="w-full h-full border-0 absolute inset-0"
            allow="autoplay; clipboard-write; fullscreen"
          />
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDERIZADOR DO HERO CINEMATOGRÁFICO UNIFICADO
  // ─────────────────────────────────────────────────────────────────────────────
  const renderCapaHero = (
    imagem: string,
    tag: string,
    titulo: string,
    subtitulo: string,
    porcentagem: number,
    totalItensRotulo: string,
    subrotuloProgresso: string,
    gradienteRoda: [string, string],
    corTag: string
  ) => (
    <div className="relative w-full h-[350px] sm:h-[410px] md:h-[450px] rounded-b-[36px] sm:rounded-b-[44px] overflow-hidden border-b border-white/10 shadow-2xl shadow-black/90">
      <img
        src={imagem}
        alt={titulo}
        className="w-full h-full object-cover object-center scale-[1.02] transform-gpu"
        fetchPriority="high"
        loading="eager"
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(13,13,13,0.22) 35%, rgba(13,13,13,0.88) 75%, #0D0D0D 100%)'
        }}
      />

      {/* Topo dentro da capa: Botão Voltar e Gráfico Circular */}
      <div
        className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 sm:px-8 pointer-events-auto"
        style={{
          paddingTop: 'calc(1.25rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
        }}
      >
        <button
          type="button"
          onClick={handleVoltar}
          className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:scale-105 active:scale-95 transition shadow-xl"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
        </button>

        {/* Gráfico Circular de Progresso */}
        <div className="flex items-center gap-2.5 sm:gap-3 bg-black/65 backdrop-blur-md border border-white/15 pl-2.5 pr-3.5 py-1.5 sm:py-2 rounded-2xl sm:rounded-3xl shadow-2xl">
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform-gpu" viewBox="0 0 44 44">
              <circle
                cx="22"
                cy="22"
                r="18"
                className="stroke-[rgba(255,255,255,0.12)] fill-none"
                strokeWidth="3.6"
              />
              <circle
                cx="22"
                cy="22"
                r="18"
                className="fill-none transition-all duration-700 ease-out"
                stroke={`url(#progressRingGrad_${tag.replace(/[^a-zA-Z0-9]/g, '_')})`}
                strokeWidth="3.6"
                strokeDasharray={113.1}
                strokeDashoffset={113.1 - (113.1 * Math.min(100, Math.max(0, porcentagem))) / 100}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id={`progressRingGrad_${tag.replace(/[^a-zA-Z0-9]/g, '_')}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={gradienteRoda[0]} />
                  <stop offset="100%" stopColor={gradienteRoda[1]} />
                </linearGradient>
              </defs>
            </svg>

            <span className="absolute text-[11px] sm:text-xs font-black text-white font-sans tracking-tighter">
              {porcentagem}%
            </span>
          </div>

          <div className="flex flex-col text-left">
            <span 
              className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest leading-none"
              style={{ color: corTag }}
            >
              CICLO COMPLETO
            </span>
            <span className="text-xs sm:text-sm font-black text-white tracking-tight mt-1 leading-none">
              {totalItensRotulo}
            </span>
            <span className="text-[9px] text-zinc-300 font-semibold leading-none mt-1">
              {subrotuloProgresso}
            </span>
          </div>
        </div>
      </div>

      {/* Parte inferior da capa */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-5 sm:px-8 pb-7 sm:pb-9 max-w-4xl mx-auto w-full pointer-events-none">
        <span 
          className="inline-block text-[11px] sm:text-xs font-black uppercase tracking-[3px] mb-1 drop-shadow"
          style={{ color: corTag }}
        >
          {tag}
        </span>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-wider text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] font-sans leading-none">
          {titulo}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-200/90 max-w-lg mt-2 leading-relaxed drop-shadow">
          {subtitulo}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-20 relative">
      {/* Toast Flutuante de Alerta */}
      {toastAviso && (
        <div className="fixed top-5 inset-x-4 max-w-md mx-auto z-[150] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="rounded-2xl bg-black/90 backdrop-blur-md border border-white/20 p-3.5 shadow-2xl flex items-center gap-3 text-white">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs font-medium leading-snug flex-1">{toastAviso}</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          NÍVEL 1: HOME GERAL DE AULAS INTERATIVAS (ESCOLHA DA DISCIPLINA)
         ══════════════════════════════════════════════════════════════════════════ */}
      {!disciplinaSelecionadaId && (
        <>
          {renderCapaHero(
            themisHero,
            'PLATAFORMA DE ENSINO JURÍDICO',
            'AULAS INTERATIVAS',
            'Selecione uma disciplina para acessar matérias temáticas com narrativa imersiva, 18 flashcards de retenção e 12 questões práticas comentadas.',
            porcentagemGeral,
            `${totalAulasGeral} Aulas`,
            ciclosGeralCompletos > 0 ? `${ciclosGeralCompletos}/${totalAulasGeral} concluídas 100%` : 'Aula · Flashcard · Prática',
            ['#f59e0b', '#d97706'],
            '#fbbf24'
          )}

          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Disciplinas e Ramos do Direito ({DISCIPLINAS_CATALOGO.length})</span>
              </h3>

              {/* Destravar para Teste */}
              <button
                type="button"
                onClick={() => {
                  setModoLivreTeste(!modoLivreTeste);
                  setToastAviso(!modoLivreTeste ? 'Modo Livre Ativado: Todas as fases liberadas para teste.' : 'Modo Padrão Ativado: Travas progressivas ativadas.');
                }}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition flex items-center gap-1.5 ${
                  modoLivreTeste 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-white/5 text-zinc-400 border-white/10 hover:text-white'
                }`}
              >
                {modoLivreTeste ? <Unlock className="w-3 h-3 text-amber-300" /> : <Lock className="w-3 h-3" />}
                <span>{modoLivreTeste ? 'Modo Livre Ativo' : 'Destravar para Teste'}</span>
              </button>
            </div>

            {/* Grid de Disciplinas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {DISCIPLINAS_CATALOGO.map((disc) => {
                const aulasDaDisc = AULAS_CATALOGO.filter(a => a.disciplinaId === disc.id);
                const totalAulasDisc = aulasDaDisc.length;
                const somaPct = aulasDaDisc.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
                const pctDisc = totalAulasDisc > 0 ? Math.round(somaPct / totalAulasDisc) : 0;
                const materiasDaDisc = MATERIAS_CATALOGO.filter(m => m.disciplinaId === disc.id);

                return (
                  <div
                    key={disc.id}
                    onClick={() => {
                      setDisciplinaSelecionadaId(disc.id);
                      setMateriaSelecionadaId(null);
                    }}
                    className="group cursor-pointer rounded-3xl border border-white/10 hover:border-white/30 p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between h-full shadow-2xl shadow-black/50 hover:shadow-black/80 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                    style={{ background: disc.corFundoCard }}
                  >
                    {/* Imagem de Fundo Suave no Card */}
                    <div className="absolute top-0 right-0 w-36 h-36 opacity-15 pointer-events-none overflow-hidden rounded-full blur-[1px]">
                      <img src={disc.capaHeroUrl} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-4 relative z-10 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span 
                          className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 border border-white/15"
                          style={{ color: disc.corDestaque }}
                        >
                          {disc.subtitulo}
                        </span>
                        <span className="text-[11px] font-bold text-zinc-400">
                          {materiasDaDisc.length} {materiasDaDisc.length === 1 ? 'Matéria' : 'Matérias'} · {totalAulasDisc} {totalAulasDisc === 1 ? 'Aula' : 'Aulas'}
                        </span>
                      </div>

                      <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-black text-white font-sans tracking-wide group-hover:text-amber-300 transition-colors">
                          {disc.nome}
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-300/85 mt-2 leading-relaxed">
                          {disc.descricao}
                        </p>
                      </div>

                      {/* Barra de Progresso da Disciplina */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-1.5">
                          <span>Progresso da Disciplina</span>
                          <span style={{ color: disc.corDestaque }}>{pctDisc}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{ 
                              width: `${pctDisc}%`,
                              backgroundColor: disc.corDestaque
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                      <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                        Explorar matérias
                      </span>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1"
                        style={{ backgroundColor: `${disc.corDestaque}25`, color: disc.corDestaque }}
                      >
                        <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          NÍVEL 2: MATÉRIAS DA DISCIPLINA SELECIONADA
         ══════════════════════════════════════════════════════════════════════════ */}
      {disciplinaSelecionadaId && !materiaSelecionadaId && disciplinaAtual && (() => {
        const aulasDaDisc = AULAS_CATALOGO.filter(a => a.disciplinaId === disciplinaAtual.id);
        const totalAulasDisc = aulasDaDisc.length;
        const somaPct = aulasDaDisc.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
        const pctDisc = totalAulasDisc > 0 ? Math.round(somaPct / totalAulasDisc) : 0;
        const materiasDaDisc = MATERIAS_CATALOGO.filter(m => m.disciplinaId === disciplinaAtual.id);

        return (
          <>
            {renderCapaHero(
              disciplinaAtual.capaHeroUrl,
              disciplinaAtual.subtitulo,
              disciplinaAtual.nome,
              disciplinaAtual.descricao,
              pctDisc,
              `${totalAulasDisc} ${totalAulasDisc === 1 ? 'Aula' : 'Aulas'}`,
              `${materiasDaDisc.length} ${materiasDaDisc.length === 1 ? 'Matéria' : 'Matérias'} disponíveis`,
              disciplinaAtual.corGradientRing,
              disciplinaAtual.corDestaque
            )}

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" style={{ color: disciplinaAtual.corDestaque }} />
                  <span>Matérias de {disciplinaAtual.nome} ({materiasDaDisc.length})</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setDisciplinaSelecionadaId(null)}
                  className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Todas as Disciplinas</span>
                </button>
              </div>

              {/* Lista de Matérias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {materiasDaDisc.map((mat) => {
                  const aulasDaMat = AULAS_CATALOGO.filter(a => a.materiaId === mat.id);
                  const totalAulasMat = aulasDaMat.length;
                  const somaPctMat = aulasDaMat.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
                  const pctMat = totalAulasMat > 0 ? Math.round(somaPctMat / totalAulasMat) : 0;

                  return (
                    <div
                      key={mat.id}
                      onClick={() => setMateriaSelecionadaId(mat.id)}
                      className="group cursor-pointer rounded-3xl border border-white/10 hover:border-white/30 p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between h-full shadow-2xl shadow-black/50 hover:shadow-black/80 hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                      style={{ background: disciplinaAtual.corFundoCard }}
                    >
                      <div className="space-y-4 relative z-10 flex-1 flex flex-col">
                        <div className="flex items-start gap-4">
                          <img
                            src={mat.capaUrl}
                            alt={mat.titulo}
                            className="w-16 h-20 sm:w-20 sm:h-24 rounded-2xl object-cover shrink-0 border border-white/15 shadow-lg group-hover:scale-105 transition-transform"
                          />
                          <div className="flex-1 min-w-0">
                            <span 
                              className="text-[10px] font-extrabold uppercase tracking-widest leading-none block mb-1"
                              style={{ color: disciplinaAtual.corDestaque }}
                            >
                              {mat.numeroMateria}
                            </span>
                            <h2 className="text-base sm:text-lg font-bold text-white font-serif leading-snug group-hover:text-amber-200 transition-colors">
                              {mat.titulo}
                            </h2>
                            <span className="text-[11px] text-zinc-400 font-semibold mt-1 block">
                              {mat.subtitulo}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-300/80 leading-relaxed flex-1">
                          {mat.descricao}
                        </p>

                        {/* Barra de Progresso da Matéria */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 mb-1.5">
                            <span>Progresso da Matéria</span>
                            <span style={{ color: disciplinaAtual.corDestaque }}>{pctMat}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{ 
                                width: `${pctMat}%`,
                                backgroundColor: disciplinaAtual.corDestaque
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between relative z-10">
                        <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                          Ver {totalAulasMat} {totalAulasMat === 1 ? 'aula disponível' : 'aulas disponíveis'}
                        </span>
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1"
                          style={{ backgroundColor: `${disciplinaAtual.corDestaque}25`, color: disciplinaAtual.corDestaque }}
                        >
                          <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════════
          NÍVEL 3: AULAS DA MATÉRIA SELECIONADA (FORMATO COM OS 3 BOTÕES)
         ══════════════════════════════════════════════════════════════════════════ */}
      {disciplinaSelecionadaId && materiaSelecionadaId && materiaAtual && disciplinaAtual && (() => {
        const totalAulasMat = aulasDaMateria.length;
        const somaPctMat = aulasDaMateria.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
        const pctMat = totalAulasMat > 0 ? Math.round(somaPctMat / totalAulasMat) : 0;
        const ciclosCompletosMat = aulasDaMateria.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;

        return (
          <>
            {renderCapaHero(
              disciplinaAtual.capaHeroUrl,
              materiaAtual.numeroMateria,
              disciplinaAtual.nome,
              materiaAtual.descricao,
              pctMat,
              `${totalAulasMat} ${totalAulasMat === 1 ? 'Aula' : 'Aulas'}`,
              ciclosCompletosMat > 0 ? `${ciclosCompletosMat}/${totalAulasMat} concluídas 100%` : 'Aula · Flashcard · Prática',
              disciplinaAtual.corGradientRing,
              disciplinaAtual.corDestaque
            )}

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: disciplinaAtual.corDestaque }} />
                  <span>Aulas Disponíveis ({aulasDaMateria.length})</span>
                </h3>

                <button
                  type="button"
                  onClick={() => setMateriaSelecionadaId(null)}
                  className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Outras Matérias</span>
                </button>
              </div>

              {/* Grid de Aulas da Matéria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                {aulasDaMateria.map((aula) => {
                  const prog = calcularProgressoCiclo(aula);
                  const flashcardsLiberados = prog.aulaTerminada || modoLivreTeste;
                  const questoesLiberadas = (prog.aulaTerminada && prog.fcOk) || modoLivreTeste;

                  const conteudo = CONTEUDO_AULAS[aula.id];
                  const totalCards = conteudo?.flashcards.length || 18;
                  const totalQuestoes = conteudo?.questoes.length || 12;

                  return (
                    <div
                      key={aula.id}
                      className="group rounded-3xl border border-white/10 hover:border-white/25 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between h-full shadow-xl shadow-black/40 hover:shadow-red-500/10"
                      style={{ background: disciplinaAtual.corFundoCard }}
                    >
                      <div className="space-y-3.5 flex-1 flex flex-col">
                        {/* Cabeçalho do Card: NÚMERO DA AULA | TÍTULO DO TEMA (SEM DIREITO PENAL) E STATUS FINALIZADO */}
                        <div className="flex items-center justify-between pb-2 border-b border-white/10 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span 
                              className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 shrink-0"
                              style={{ color: disciplinaAtual.corDestaque }}
                            >
                              {aula.numeroAula}
                            </span>
                            <span className="text-zinc-500 text-xs font-light select-none">|</span>
                            <span 
                              className="text-[10px] sm:text-[11px] font-black uppercase tracking-widest truncate"
                              style={{ color: disciplinaAtual.corDestaque }}
                            >
                              {materiaAtual.titulo}
                            </span>
                          </div>

                          {/* Se a pessoa completar toda a aula (100%), exibe a badge "Finalizado" */}
                          {prog.cicloCompleto ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-[11px] font-black uppercase tracking-wider border border-emerald-500/40 flex items-center gap-1.5 shadow-sm shadow-emerald-950/30 shrink-0 animate-in fade-in duration-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              <span>Finalizado</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider shrink-0">
                              {prog.porcentagemTotal > 0 ? `${prog.porcentagemTotal}%` : '0%'}
                            </span>
                          )}
                        </div>

                        {/* Bloco Capa + Título + Descrição */}
                        <div className="flex gap-3.5 sm:gap-4 items-start flex-1">
                          <div className="relative shrink-0 w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border border-white/15 shadow-md group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={aula.capaUrl}
                              alt={aula.titulo}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-extrabold text-white border border-white/20">
                              {aula.etapas}p
                            </span>

                            {prog.cicloCompleto && (
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-emerald-500/90 text-[9px] font-black uppercase tracking-wider text-white shadow-md flex items-center gap-1">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                <span>100%</span>
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                            <div>
                              <h4 className="text-sm sm:text-base font-bold text-white font-serif leading-snug">
                                {aula.titulo}
                              </h4>

                              <p className="text-[11px] sm:text-xs text-zinc-300/85 mt-1.5 leading-relaxed">
                                {aula.descricao}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Barra de Progresso Ponderado da Aula */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-zinc-300 mb-1.5">
                            <span className="flex items-center gap-1.5">
                              <span 
                                className="w-2 h-2 rounded-full inline-block" 
                                style={{ backgroundColor: prog.porcentagemTotal > 0 ? (prog.cicloCompleto ? '#10b981' : disciplinaAtual.corDestaque) : '#71717a' }} 
                              />
                              Progresso da Aula
                            </span>
                            <span className={prog.cicloCompleto ? 'text-emerald-400 font-black flex items-center gap-1' : 'text-zinc-300 font-black'}>
                              {prog.cicloCompleto ? (
                                <>
                                  <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                                  <span>100% · Finalizado</span>
                                </>
                              ) : (
                                `${prog.porcentagemTotal}% · ${prog.fasesConcluidasCount} de 3 fases`
                              )}
                            </span>
                          </div>

                          <div className="w-full h-2 rounded-full bg-black/60 border border-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ease-out ${
                                prog.cicloCompleto ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-500 to-amber-500'
                              }`}
                              style={{ width: `${prog.porcentagemTotal}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* OS 3 BOTÕES EM LINHA: INICIAR À ESQUERDA, REVISAR AO MEIO, PRATICAR À DIREITA */}
                      <div className="grid grid-cols-3 gap-2 mt-4 pt-3.5 border-t border-white/10">
                        {/* 1. Iniciar Aula */}
                        <button
                          type="button"
                          onClick={() => iniciarAula(aula)}
                          className={`w-full py-2.5 px-2 rounded-2xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 ${
                            prog.aulaTerminada 
                              ? 'bg-[#1b1c22] hover:bg-[#252830] text-zinc-200 border border-white/15' 
                              : aula.disciplinaId === 'administrativo'
                                ? 'bg-gradient-to-r from-[#d9a00a] to-[#b45309] hover:from-[#f59e0b] hover:to-[#92400e] text-black font-black shadow-amber-950/50'
                                : 'bg-gradient-to-r from-[#e23e57] to-[#c8102e] hover:from-[#ff4d6d] hover:to-[#dc143c] text-white shadow-red-950/50'
                          }`}
                        >
                          {prog.aulaTerminada ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              <span>Ver Aula</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Iniciar</span>
                            </>
                          )}
                        </button>

                        {/* 2. Revisar Flashcards (18) */}
                        <button
                          type="button"
                          onClick={() => abrirRevisarFlashcards(aula)}
                          className={`w-full py-2.5 px-1.5 rounded-2xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 border ${
                            prog.fcOk
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                              : flashcardsLiberados
                                ? 'bg-[#d97706] hover:bg-[#f59e0b] text-white border-amber-400/50 shadow-amber-950/40'
                                : 'bg-white/5 text-zinc-500 border-white/10 cursor-not-allowed opacity-60'
                          }`}
                          title={!flashcardsLiberados ? 'Conclua a aula para destravar' : 'Revisar conteúdo da aula com 18 Flashcards'}
                        >
                          {flashcardsLiberados ? (
                            <Layers className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                          <span>Revisar ({totalCards})</span>
                        </button>

                        {/* 3. Praticar Questões (12) */}
                        <button
                          type="button"
                          onClick={() => abrirPraticarQuestoes(aula)}
                          className={`w-full py-2.5 px-1.5 rounded-2xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-1.5 shadow-md active:scale-95 border ${
                            prog.questoesOk
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                              : questoesLiberadas
                                ? 'bg-[#059669] hover:bg-[#10b981] text-white border-emerald-400/50 shadow-emerald-950/40'
                                : 'bg-white/5 text-zinc-500 border-white/10 cursor-not-allowed opacity-60'
                          }`}
                          title={!questoesLiberadas ? 'Conclua a revisão para destravar' : 'Praticar 12 Questões com casos práticos e pegadinhas'}
                        >
                          {questoesLiberadas ? (
                            <HelpCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                          <span>Praticar ({totalQuestoes})</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        );
      })()}

      {/* Modal 1: Revisar Flashcards (18 itens com flip 3D real) */}
      {modalFlashcardsAula && CONTEUDO_AULAS[modalFlashcardsAula.id] && (
        <ModalRevisarFlashcards
          tituloAula={`${modalFlashcardsAula.numeroAula} · ${modalFlashcardsAula.titulo}`}
          flashcards={CONTEUDO_AULAS[modalFlashcardsAula.id].flashcards}
          onFechar={() => setModalFlashcardsAula(null)}
          onConcluir={() => {
            concluirFlashcards(modalFlashcardsAula.id);
            setModalFlashcardsAula(null);
          }}
        />
      )}

      {/* Modal 2: Praticar Questões (12 itens comentados) */}
      {modalQuestoesAula && CONTEUDO_AULAS[modalQuestoesAula.id] && (
        <ModalPraticarQuestoes
          tituloAula={`${modalQuestoesAula.numeroAula} · ${modalQuestoesAula.titulo}`}
          questoes={CONTEUDO_AULAS[modalQuestoesAula.id].questoes}
          onFechar={() => setModalQuestoesAula(null)}
          onConcluir={() => {
            concluirQuestoes(modalQuestoesAula.id);
            setModalQuestoesAula(null);
          }}
        />
      )}
    </div>
  );
}