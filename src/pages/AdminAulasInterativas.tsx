import { getAulaFallbackHtml } from '@/utils/getAulaFallbackHtml';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { cn } from '@/lib/utils';
import { 
  Sparkles, Play, CheckCircle2, BookOpen, Layers, 
  ArrowLeft, Check, Lock, HelpCircle, Award, 
  RotateCcw, AlertCircle, Unlock, ChevronRight, GraduationCap,
  ShieldCheck, Compass, Search, X, Star
} from 'lucide-react';
import { AulasMenuAlternancia, AbaAulas } from '@/components/aulas-interativas/AulasMenuAlternancia';
import { AulasHeroPanel } from '@/components/aulas-interativas/AulasHeroPanel';
import { AulasTabProgresso } from '@/components/aulas-interativas/AulasTabProgresso';
import { AulasTabFavoritos } from '@/components/aulas-interativas/AulasTabFavoritos';
import { AulasTabEstatisticas } from '@/components/aulas-interativas/AulasTabEstatisticas';
import { 
  carregarProgressoSupabase, 
  salvarProgressoSupabase, 
  carregarFavoritosSupabase, 
  alternarFavoritoSupabase 
} from '@/services/aulasSyncService';
import { HERO_ILLUSTRATIONS } from '@/components/aprender/chunks/aprenderConstants';
import { CONTEUDO_AULAS } from '@/data/aulasInterativasConteudo';
import { ModalRevisarFlashcards } from '@/components/aulas-interativas/ModalRevisarFlashcards';
import { ModalPraticarQuestoes } from '@/components/aulas-interativas/ModalPraticarQuestoes';
import { PlayerAulaNativo } from '@/components/aulas-interativas/PlayerAulaNativo';
import adminCover from '@/assets/biblioteca/areas/direito-administrativo.webp';
import themisHero from '@/assets/jurisprudencia-hero-themis.webp';
import capaAdminOrigens from '@/assets/aulas-interativas/direito-administrativo/capa-aula-01-origens.webp';
import capaAdminDefinicoes from '@/assets/aulas-interativas/direito-administrativo/capa-aula-02-definicoes.webp';


import { 
  MATERIAS_CATALOGO_COMPLETO, 
  AULAS_CATALOGO_COMPLETO,
  MateriaItem,
  AulaItem
} from '@/data/aulasInterativasCatalogoCompleto';
import { AULAS_CONTEUDO_REAL } from '@/data/aulasConteudoRealData';

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

const MATERIAS_CATALOGO: MateriaItem[] = MATERIAS_CATALOGO_COMPLETO;
const AULAS_CATALOGO: AulaItem[] = AULAS_CATALOGO_COMPLETO;

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


function formatDescricaoExata(desc?: string, titulo?: string): string {
  let text = (desc || '').trim();

  // Remove reticências se houver
  text = text.replace(/\.{2,}$/, '').trim();
  // Remove prefixos redundantes
  text = text.replace(/^\d+\s+tópicos\s+essenciais(?:\s+abordados)?:\s*/i, '');

  const isGeneric = !text || 
    text.includes('em estruturação') || 
    text.startsWith('Conteúdo imersivo') || 
    text.startsWith('Estudo aprofundado com narrativa') ||
    text.startsWith('Estudo didático e aprofundado');

  if (isGeneric) {
    const cleanTit = (titulo || 'o tema').replace(/^Aula\s+\d+\s*[-–:]\s*/i, '').trim();
    const candidate = `Doutrina especializada, requisitos legais, jurisprudência e fixação ativa sobre ${cleanTit}.`;
    if (candidate.length <= 112) {
      text = candidate;
    } else {
      text = `Análise doutrinária, casos práticos e fixação ativa sobre ${cleanTit}.`;
      if (text.length > 112) {
        text = `Doutrina, jurisprudência atualizada e fixação prática sobre ${cleanTit}.`;
        if (text.length > 112) {
          text = `Estudo completo, requisitos e casos práticos de ${cleanTit}.`;
        }
      }
    }
  }

  // Enxugar termos redundantes que excedem 3 linhas mantendo o sentido dogmático
  text = text
    .replace(/\s+aprofundada\b/gi, '')
    .replace(/\s+especializada\b/gi, '')
    .replace(/\s+sociológicas\b/gi, '')
    .replace(/\s+principais\b/gi, '')
    .replace(/\s+relevantes\b/gi, '')
    .replace(/\s+específicos\b/gi, '')
    .replace(/\bdo Código Penal\b/gi, 'do CP')
    .replace(/\bdo Código Civil\b/gi, 'do CC')
    .replace(/\bda Constituição Federal\b/gi, 'da CF/88');

  // Ajustar tamanho para o intervalo ideal de 3 linhas (85 a 110 caracteres)
  if (text.length > 110) {
    let corte = text.substring(0, 108);
    const lastComma = corte.lastIndexOf(',');
    const lastSemi = corte.lastIndexOf(';');
    const bestPunct = Math.max(lastComma, lastSemi);

    if (bestPunct >= 75) {
      corte = corte.substring(0, bestPunct);
    } else {
      const lastSpace = corte.lastIndexOf(' ');
      if (lastSpace >= 75) {
        corte = corte.substring(0, lastSpace);
      }
    }

    corte = corte
      .replace(/[\s,;:(\-]+$/, '')
      .replace(/\s+(e|ou|de|da|do|das|dos|com|para|em|no|na|a|o|que|ao|aos)$/i, '');

    const openParen = (corte.match(/\(/g) || []).length;
    const closeParen = (corte.match(/\)/g) || []).length;
    if (openParen > closeParen) {
      const lastOpen = corte.lastIndexOf('(');
      if (lastOpen > 50) {
        corte = corte.substring(0, lastOpen).trim();
      } else {
        corte = corte + ')';
      }
    }

    text = corte + '.';
  }

  text = text.replace(/[.,;:\s]+$/, '') + '.';
  return text;
}

export default function AdminAulasInterativas() {
  const navigate = useNavigate();

  // Estados de navegação hierárquica
  const [disciplinaSelecionadaId, setDisciplinaSelecionadaId] = useState<string | null>(null);
  const [materiaSelecionadaId, setMateriaSelecionadaId] = useState<string | null>(null);
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);
  const [aulaPendenteModal, setAulaPendenteModal] = useState<AulaItem | null>(null);
  const [buscaTermo, setBuscaTermo] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<AbaAulas>('trilhas');
  const [favoritosIds, setFavoritosIds] = useState<Set<string>>(new Set());
  const [acertosMap, setAcertosMap] = useState<Record<string, { acertos: number; total: number }>>({});

  // Sincronização inicial com o Supabase (Single Source of Truth)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [progData, favData] = await Promise.all([
          carregarProgressoSupabase(),
          carregarFavoritosSupabase()
        ]);
        if (!mounted) return;
        setProgressoMap(progData.progressoMap);
        setFlashcardsConcluidos(progData.flashcardsMap);
        setQuestoesConcluidas(progData.questoesMap);
        setAcertosMap(progData.acertosMap);
        setFavoritosIds(favData);
      } catch (err) {
        console.warn('Erro ao inicializar dados Supabase:', err);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleAlternarFavorito = async (aula: AulaItem) => {
    const isFav = favoritosIds.has(aula.id);
    const novoStatus = await alternarFavoritoSupabase(aula, isFav);
    setFavoritosIds(prev => {
      const next = new Set(prev);
      if (novoStatus) next.add(aula.id);
      else next.delete(aula.id);
      return next;
    });
    setToastAviso(novoStatus ? 'Aula adicionada aos favoritos!' : 'Aula removida dos favoritos.');
  };
  // Função universal de reset de scroll (suporta Window, HTML, Body e #root do Desktop)
  const resetScrollToTop = () => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) {
        root.scrollTop = 0;
      }
    } catch {}
  };

  // Garante início no topo absoluto do cabeçalho em todas as transições (Mobile & Desktop)
  useEffect(() => {
    resetScrollToTop();
    setBuscaTermo('');
  }, [disciplinaSelecionadaId, materiaSelecionadaId, aulaAtiva]);

  // Estados de progresso
  const [progressoMap, setProgressoMap] = useState<Record<string, { etapaAtual: number }>>(() => getStoredProgresso());
  const [flashcardsConcluidos, setFlashcardsConcluidos] = useState<Record<string, boolean>>(() => getStoredBooleanMap(FLASHCARDS_STORAGE_KEY));
  const [questoesConcluidas, setQuestoesConcluidas] = useState<Record<string, boolean>>(() => getStoredBooleanMap(QUESTOES_STORAGE_KEY));

  // Modais de Revisão e Prática
  const [modalFlashcardsAula, setModalFlashcardsAula] = useState<AulaItem | null>(null);
  const [modalQuestoesAula, setModalQuestoesAula] = useState<AulaItem | null>(null);
  const [modalBloqueioAula, setModalBloqueioAula] = useState<{ aula: AulaItem; motivo: 'revisar' | 'praticar' } | null>(null);
  const [toastAviso, setToastAviso] = useState<string | null>(null);

  
  const [modoLivreTeste, setModoLivreTeste] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);

  // Rotação suave da ilustração no banner hero
  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIdx(i => (i + 1) % (HERO_ILLUSTRATIONS.length || 1));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

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

    const getBotaoIniciarClass = (aula: AulaItem, aulaTerminada: boolean) => {
    if (aulaTerminada) {
      return 'bg-[#1b1c22] hover:bg-[#252830] text-zinc-200 border border-white/15';
    }
    switch (aula.disciplinaId) {
      case 'administrativo':
        return 'bg-gradient-to-r from-[#d9a00a] to-[#b45309] hover:from-[#f59e0b] hover:to-[#92400e] text-black font-black shadow-amber-950/50';
      case 'constitucional':
        return 'bg-gradient-to-r from-[#22c55e] to-[#15803d] hover:from-[#4ade80] hover:to-[#166534] text-white font-black shadow-emerald-950/50';
      case 'trabalho':
        return 'bg-gradient-to-r from-[#a855f7] to-[#7e22ce] hover:from-[#c084fc] hover:to-[#6b21a8] text-white font-black shadow-purple-950/50';
      case 'penal':
      default:
        return 'bg-gradient-to-r from-[#e23e57] to-[#c8102e] hover:from-[#ff4d6d] hover:to-[#dc143c] text-white shadow-red-950/50';
    }
  };

  const iniciarAula = (aula: AulaItem) => {
    if (!progressoMap[aula.id] || progressoMap[aula.id].etapaAtual === 0) {
      saveStoredProgresso(aula.id, 1);
      setProgressoMap(prev => ({ ...prev, [aula.id]: { etapaAtual: 1 } }));
      salvarProgressoSupabase({
        aula,
        etapaAtual: 1,
        aulaTerminada: false,
        flashcardsRevisados: !!flashcardsConcluidos[aula.id],
        questoesPraticadas: !!questoesConcluidas[aula.id]
      });
    }
    setAulaAtiva(aula);
    resetScrollToTop();
  };

  const concluirAulaManual = (aulaId: string, totalEtapas: number) => {
    saveStoredProgresso(aulaId, totalEtapas);
    setProgressoMap(prev => ({ ...prev, [aulaId]: { etapaAtual: totalEtapas } }));
    setToastAviso('Fase 1 (Aula) concluída! Fase 2 (Revisar Flashcards) liberada.');
    const aula = AULAS_CATALOGO.find(a => a.id === aulaId);
    if (aula) {
      salvarProgressoSupabase({
        aula,
        etapaAtual: totalEtapas,
        aulaTerminada: true,
        flashcardsRevisados: !!flashcardsConcluidos[aulaId],
        questoesPraticadas: !!questoesConcluidas[aulaId]
      });
    }
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
    const aula = AULAS_CATALOGO.find(a => a.id === aulaId);
    if (aula) {
      salvarProgressoSupabase({
        aula,
        etapaAtual: progressoMap[aulaId]?.etapaAtual || aula.etapas,
        aulaTerminada: true,
        flashcardsRevisados: true,
        questoesPraticadas: !!questoesConcluidas[aulaId]
      });
    }
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
    const aula = AULAS_CATALOGO.find(a => a.id === aulaId);
    if (aula) {
      salvarProgressoSupabase({
        aula,
        etapaAtual: progressoMap[aulaId]?.etapaAtual || aula.etapas,
        aulaTerminada: true,
        flashcardsRevisados: true,
        questoesPraticadas: true,
        acertosQuestoes: 10,
        totalQuestoes: 10
      });
    }
  };

  // Botão voltar hierárquico
  const handleVoltar = () => {
    setBuscaTermo('');
    if (aulaAtiva) {
      setAulaAtiva(null);
    } else if (materiaSelecionadaId) {
      setMateriaSelecionadaId(null);
    } else if (disciplinaSelecionadaId) {
      setDisciplinaSelecionadaId(null);
    } else {
      navigate('/admin-funcoes');
    }
    resetScrollToTop();
  };

  const termoBuscaNorm = buscaTermo.toLowerCase().trim();

  // ─────────────────────────────────────────────────────────────────────────────
  // NÍVEL 4: TELA CHEIA DA AULA INTERATIVA (PLAYER NATIVO EM REACT SEM IFRAMES)
  // ─────────────────────────────────────────────────────────────────────────────
  if (aulaAtiva) {
    const discAtual = DISCIPLINAS_CATALOGO.find(d => d.id === aulaAtiva.disciplinaId) || DISCIPLINAS_CATALOGO[0];
    return (
      <PlayerAulaNativo
        aula={aulaAtiva}
        disciplinaNome={discAtual.nome}
        corDestaque={discAtual.corDestaque}
        onVoltar={() => setAulaAtiva(null)}
        onConcluir={(totalEtapas) => {
          concluirAulaManual(aulaAtiva.id, totalEtapas);
          setAulaAtiva(null);
        }}
        onProgresso={(etapaAtual, totalEtapas) => {
          saveStoredProgresso(aulaAtiva.id, etapaAtual);
          setProgressoMap(prev => ({ ...prev, [aulaAtiva.id]: { etapaAtual } }));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white pb-[calc(7.5rem+env(safe-area-inset-bottom,24px))] relative overflow-x-hidden">
      {/* Fundo ShapeGrid Dinâmico: Adota a cor temática da Disciplina selecionada */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#0D0D0D]">
        <ShapeGrid
          key={disciplinaAtual ? disciplinaAtual.id : 'home'}
          speed={0.6}
          squareSize={40}
          direction="diagonal"
          borderColor={disciplinaAtual ? `${disciplinaAtual.corDestaque}28` : "rgba(255, 255, 255, 0.04)"}
          hoverFillColor={disciplinaAtual ? `${disciplinaAtual.corDestaque}40` : "rgba(255, 255, 255, 0.08)"}
          shape="square"
          hoverTrailAmount={6}
        />
      </div>

      {/* Glow Atmosférico Temático da Disciplina no Fundo */}
      {disciplinaAtual && (
        <div 
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700 opacity-20"
          style={{
            background: `radial-gradient(ellipse 90% 55% at 50% 15%, ${disciplinaAtual.corDestaque}45, transparent 75%)`
          }}
        />
      )}

      {/* ── Imagem Majestosa da Deusa Têmis Vazada no Fundo Central da Trilha ── */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden z-0 select-none">
        <img
          src="/images/gamificacao/deusa_temis_vazada.webp"
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-[320px] sm:w-[440px] md:w-[500px] max-w-[88vw] h-auto object-contain opacity-20 filter drop-shadow-[0_0_55px_rgba(234,179,8,0.25)] pointer-events-none"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          }}
        />
      </div>

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
      {!disciplinaSelecionadaId && (() => {
        const disciplinasFiltradas = DISCIPLINAS_CATALOGO.filter(disc => {
          if (!termoBuscaNorm) return true;
          const matchNome = disc.nome.toLowerCase().includes(termoBuscaNorm);
          const matchMateria = MATERIAS_CATALOGO.some(m => m.disciplinaId === disc.id && m.nome.toLowerCase().includes(termoBuscaNorm));
          const matchAula = AULAS_CATALOGO.some(a => a.disciplinaId === disc.id && a.titulo.toLowerCase().includes(termoBuscaNorm));
          return matchNome || matchMateria || matchAula;
        });

        return (
          <>
          {/* Top Bar Fixa de Navegação (Padrão Oficial Aprender - Screenshot 2) */}
          <div 
            className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#0D0D0D]/95 border-b border-white/10 px-4 sm:px-6 py-3 transition-all shadow-xl"
            style={{
              paddingTop: 'calc(0.75rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
            }}
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={handleVoltar}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-95 transition shadow-lg shrink-0"
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-5.5 sm:h-5.5" strokeWidth={2.4} />
                </button>

                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-black text-white font-sans tracking-wider uppercase truncate">
                    APRENDER
                  </h1>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium truncate">
                    Aulas Dinâmicas em Trilhas
                  </p>
                </div>
              </div>

              {/* Botão de Destravar para Teste */}
              <button
                type="button"
                onClick={() => {
                  setModoLivreTeste(!modoLivreTeste);
                  setToastAviso(!modoLivreTeste ? 'Modo Livre Ativado: Todas as fases liberadas.' : 'Modo Padrão Ativado: Travas progressivas ativadas.');
                }}
                className={cn(
                  "text-[10px] sm:text-[11px] font-bold px-3 py-1.5 rounded-full border transition flex items-center gap-1.5 shadow-sm shrink-0",
                  modoLivreTeste 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                    : "bg-white/5 text-zinc-400 border-white/10 hover:text-white"
                )}
              >
                {modoLivreTeste ? <Unlock className="w-3.5 h-3.5 text-amber-300" /> : <Lock className="w-3.5 h-3.5" />}
                <span className="hidden xs:inline">{modoLivreTeste ? 'Modo Livre Ativo' : 'Destravar Teste'}</span>
              </button>
            </div>
          </div>

          <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 pb-8 space-y-6">
            {/* Painel Hero das Trilhas de Aprendizado */}
            <AulasHeroPanel
              subtitulo="SUA TRILHA DE APRENDIZADO"
              titulo="AULAS"
              tituloDestaque="EM TRILHAS"
              descricao="Slides interativos narrados, flashcards de retenção e questões por matéria."
              porcentagem={porcentagemGeral}
              corDestaque="#fbbf24"
              metricas={[
                { label: 'Disciplinas', valor: DISCIPLINAS_CATALOGO.length },
                { label: 'Aulas', valor: totalAulasGeral },
                { label: 'Concluídas', valor: `${ciclosGeralCompletos}/${totalAulasGeral}` }
              ]}
            />

            {/* Menu de Alternância (Trilhas, Progresso, Favoritos, Estatísticas) */}
            <AulasMenuAlternancia
              abaAtiva={abaAtiva}
              onSelecionarAba={setAbaAtiva}
              corDestaque="#fbbf24"
              totalFavoritos={favoritosIds.size}
              porcentagemGeral={porcentagemGeral}
            />

            {abaAtiva === 'progresso' && (
              <AulasTabProgresso
                materias={MATERIAS_CATALOGO}
                aulas={AULAS_CATALOGO}
                calcularProgressoCiclo={calcularProgressoCiclo}
                onIniciarAula={iniciarAula}
                onSelecionarMateria={(matId) => {
                  const mat = MATERIAS_CATALOGO.find(m => m.id === matId);
                  if (mat) {
                    setDisciplinaSelecionadaId(mat.disciplinaId);
                    setMateriaSelecionadaId(mat.id);
                    setAbaAtiva('trilhas');
                    resetScrollToTop();
                  }
                }}
                corDestaque="#fbbf24"
              />
            )}

            {abaAtiva === 'favoritos' && (
              <AulasTabFavoritos
                aulasFavoritas={AULAS_CATALOGO.filter(a => favoritosIds.has(a.id))}
                onIniciarAula={iniciarAula}
                onAlternarFavorito={handleAlternarFavorito}
                corDestaque="#fbbf24"
                onVoltarParaTrilhas={() => setAbaAtiva('trilhas')}
              />
            )}

            {abaAtiva === 'estatisticas' && (
              <AulasTabEstatisticas
                materias={MATERIAS_CATALOGO}
                aulas={AULAS_CATALOGO}
                calcularProgressoCiclo={calcularProgressoCiclo}
                acertosMap={acertosMap}
                corDestaque="#fbbf24"
                onSelecionarMateria={(matId) => {
                  const mat = MATERIAS_CATALOGO.find(m => m.id === matId);
                  if (mat) {
                    setDisciplinaSelecionadaId(mat.disciplinaId);
                    setMateriaSelecionadaId(mat.id);
                    setAbaAtiva('trilhas');
                    resetScrollToTop();
                  }
                }}
              />
            )}

            {abaAtiva === 'trilhas' && (
              <>
            {/* Barra de Pesquisa Nível 1 */}
            <div className="relative w-full">
              <div className="relative flex items-center w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 focus-within:border-amber-400/60 focus-within:bg-white/[0.07] rounded-xl px-3.5 py-2.5 sm:py-3 transition-all shadow-lg backdrop-blur-md">
                <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-400 shrink-0 mr-2.5" />
                <input
                  type="text"
                  value={buscaTermo}
                  onChange={(e) => setBuscaTermo(e.target.value)}
                  placeholder="Pesquisar disciplinas, matérias ou aulas..."
                  className="bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 outline-none w-full font-medium"
                />
                {buscaTermo && (
                  <button
                    type="button"
                    onClick={() => setBuscaTermo('')}
                    className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition shrink-0"
                    aria-label="Limpar pesquisa"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Cabeçalho da Seção de Disciplinas */}
            <div className="flex items-center justify-between pt-1">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>DISCIPLINAS ({disciplinasFiltradas.length})</span>
              </h3>
            </div>

            {/* Trilha Serpenteante em Linha do Tempo das Disciplinas */}
            <div className="relative py-4 sm:py-8 w-full min-w-0 max-w-full overflow-hidden">
              <div className="w-full min-w-0 relative z-[2] flex flex-col">
                {disciplinasFiltradas.map((disc, i) => {
                  const isLeft = i % 2 === 0;
                  const aulasDaDisc = AULAS_CATALOGO.filter(a => a.disciplinaId === disc.id);
                  const totalAulasDisc = aulasDaDisc.length;
                  const somaPct = aulasDaDisc.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
                  const pctDisc = totalAulasDisc > 0 ? Math.round(somaPct / totalAulasDisc) : 0;
                  const materiasDaDisc = MATERIAS_CATALOGO.filter(m => m.disciplinaId === disc.id);

                  return (
                    <div key={disc.id} className="w-full flex flex-col">
                      <div
                        className={cn(
                          "relative z-10 flex w-full items-center justify-between gap-3 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-10 max-w-3xl lg:max-w-4xl mx-auto group",
                          isLeft ? "flex-row" : "flex-row-reverse"
                        )}
                      >
                        {/* CONJUNTO DE CARTAS EM LEQUE COM CAPA DA DISCIPLINA */}
                        <div
                          onClick={() => {
                            setDisciplinaSelecionadaId(disc.id);
                            setMateriaSelecionadaId(null);
                            resetScrollToTop();
                          }}
                          className="relative shrink-0 w-[152px] xs:w-[168px] sm:w-[200px] md:w-[225px] h-[200px] xs:h-[218px] sm:h-[245px] md:h-[270px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
                        >
                          {/* Carta 1 (Fundo) */}
                          <div
                            className={cn(
                              "absolute inset-0 rounded-2xl border border-white/10 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                              isLeft
                                ? "scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5 group-hover:-translate-y-3"
                                : "scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5 group-hover:-translate-y-3"
                            )}
                            style={{
                              background: disc.corFundoCard,
                              boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                            }}
                          >
                            <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />
                            <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden z-[2]">
                              <Layers className="w-5 h-5 text-white/30" />
                            </div>
                          </div>

                          {/* Carta 2 (Meio) */}
                          <div
                            className={cn(
                              "absolute inset-0 rounded-2xl border border-white/15 opacity-75 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                              isLeft
                                ? "scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-3 group-hover:-translate-y-2"
                                : "scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-3 group-hover:-translate-y-2"
                            )}
                            style={{
                              background: disc.corFundoCard,
                              boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                            }}
                          >
                            <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />
                            <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden z-[2]">
                              <Layers className="w-5 h-5 text-white/40" />
                            </div>
                          </div>

                          {/* Carta 3 (Frontal Principal com Capa) */}
                          <div
                            className={cn(
                              "relative w-full h-full p-2.5 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border border-white/30 transition-all duration-300 origin-bottom",
                              isLeft
                                ? "group-hover:-rotate-[1deg] group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)]"
                                : "group-hover:rotate-[1deg] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)]"
                            )}
                            style={{
                              background: disc.corFundoCard,
                              borderColor: `${disc.corDestaque}50`
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />
                            <div className="absolute inset-1 rounded-[14px] border border-white/15 pointer-events-none z-10" />

                            <img
                              src={disc.capaHeroUrl}
                              alt={disc.nome}
                              loading="lazy"
                              decoding="async"
                              className="pointer-events-none absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 select-none"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/95 via-black/25 to-[#0d0f12]/60 pointer-events-none z-0" />

                            {/* Topo da Carta: Porcentagem Elegante no Canto Superior Esquerdo */}
                            <div className="relative z-10 flex items-center justify-between w-full">
                              <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1">
                                <span className="text-[10px] sm:text-[11px] font-black tracking-tight" style={{ color: disc.corDestaque }}>
                                  {pctDisc}%
                                </span>
                              </div>
                            </div>

                            {/* Centro da Capa Limpo (Sem Botão de Play) */}
                            <div className="my-auto py-2 z-[1] w-full" />

                            {/* Rodapé da Carta: Progresso e Estatísticas */}
                            <div className="z-[1] pt-1.5 sm:pt-2 border-t border-white/20 w-full px-0.5">
                              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-normal text-white/95 mb-1 sm:mb-1.5">
                                <span className="truncate">
                                  {totalAulasDisc} aulas
                                </span>
                                <span className="font-semibold font-sans ml-1" style={{ color: disc.corDestaque }}>
                                  {pctDisc}%
                                </span>
                              </div>
                              <div className="w-full bg-black/50 h-1.5 sm:h-2 rounded-full overflow-hidden border border-white/20">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.max(pctDisc, totalAulasDisc > 0 ? 8 : 0)}%`,
                                    backgroundColor: disc.corDestaque,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* LINHA CONECTORA E TÍTULO NO LADO OPOSTO */}
                        <div
                          onClick={() => {
                            setDisciplinaSelecionadaId(disc.id);
                            setMateriaSelecionadaId(null);
                            resetScrollToTop();
                          }}
                          className={cn(
                            "flex-1 min-w-0 flex items-center cursor-pointer select-none py-2 transition-all",
                            isLeft ? "flex-row pl-1.5 xs:pl-2 sm:pl-3" : "flex-row-reverse pr-1.5 xs:pr-2 sm:pr-3"
                          )}
                        >
                          {/* Linha Fina Conectora com Degradê */}
                          <div
                            className={cn(
                              "flex items-center shrink-0 w-6 xs:w-8 sm:w-12 md:w-16",
                              isLeft ? "flex-row" : "flex-row-reverse"
                            )}
                          >
                            <div
                              className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/70 shrink-0 transition-transform duration-300 group-hover:scale-125"
                              style={{
                                backgroundColor: disc.corDestaque,
                                boxShadow: `0 0 8px ${disc.corDestaque}`,
                              }}
                            />
                            <div
                              className="flex-1 h-[1px] transition-all duration-300 group-hover:h-[1.5px]"
                              style={{
                                background: isLeft
                                  ? `linear-gradient(to right, ${disc.corDestaque}, rgba(255,255,255,0.3), transparent)`
                                  : `linear-gradient(to left, ${disc.corDestaque}, rgba(255,255,255,0.3), transparent)`,
                              }}
                            />
                          </div>

                          {/* Nome e Detalhes da Disciplina */}
                          <div
                            className={cn(
                              "flex-1 min-w-0 flex flex-col justify-center px-1.5 xs:px-2.5 sm:px-4 transition-transform duration-300 group-hover:-translate-y-0.5",
                              "items-start text-left"
                            )}
                          >
                            <div
                              className={cn(
                                "flex items-center mb-1",
                                "justify-start"
                              )}
                            >
                              <span
                                className="text-[12px] sm:text-[14px] font-black uppercase tracking-wider"
                                style={{ color: disc.corDestaque }}
                              >
                                {materiasDaDisc.length} {materiasDaDisc.length === 1 ? 'MATÉRIA' : 'MATÉRIAS'}
                              </span>
                            </div>

                            <h3 className="font-sans font-medium text-[16px] xs:text-[18px] sm:text-[20px] md:text-[22px] lg:text-[23px] leading-[1.3] break-words text-zinc-100 group-hover:text-amber-200 transition-colors drop-shadow-md line-clamp-2">
                              {disc.nome}
                            </h3>

                            {disc.descricao && (
                              <p className="text-xs text-zinc-300/80 mt-1.5 line-clamp-2 max-w-md leading-relaxed hidden xs:block">
                                {disc.descricao}
                              </p>
                            )}

                            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                              <span>Explorar Matérias</span>
                              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: disc.corDestaque }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* SVG S-Curve Connector */}
                      {i < disciplinasFiltradas.length - 1 && (
                        <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-[5] overflow-visible">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <defs>
                              <filter id={`trail-glow-disc-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge>
                                  <feMergeNode in="blur" />
                                  <feMergeNode in="SourceGraphic" />
                                </feMerge>
                              </filter>
                            </defs>
                            <path
                              d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                              fill="none"
                              stroke="rgba(255, 255, 255, 0.08)"
                              strokeWidth="4"
                              strokeLinecap="round"
                              vectorEffect="non-scaling-stroke"
                            />
                            <path
                              d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                              fill="none"
                              stroke={disc.corDestaque}
                              strokeWidth="2.5"
                              strokeDasharray="5 7"
                              strokeLinecap="round"
                              vectorEffect="non-scaling-stroke"
                              filter={`url(#trail-glow-disc-${i})`}
                            />
                          </svg>
                          <div
                            className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
                            style={{
                              left: '50%',
                              top: '50%',
                              boxShadow: `0 0 10px ${disc.corDestaque}`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                {disciplinasFiltradas.length === 0 && (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                    <Search className="w-9 h-9 text-zinc-600 stroke-[1.5]" />
                    <p className="text-zinc-400 text-sm">
                      Nenhum resultado encontrado para "<span className="text-white font-semibold">{buscaTermo}</span>"
                    </p>
                    <button
                      type="button"
                      onClick={() => setBuscaTermo('')}
                      className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                    >
                      Limpar pesquisa
                    </button>
                  </div>
                )}
              </div>
            </div>
              </>
            )}
          </div>
        </>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════════
          NÍVEL 2: MATÉRIAS DA DISCIPLINA SELECIONADA
         ══════════════════════════════════════════════════════════════════════════ */}
      {disciplinaSelecionadaId && !materiaSelecionadaId && disciplinaAtual && (() => {
        const aulasDaDisc = AULAS_CATALOGO.filter(a => a.disciplinaId === disciplinaAtual.id);
        const totalAulasDisc = aulasDaDisc.length;
        const somaPct = aulasDaDisc.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
        const pctDisc = totalAulasDisc > 0 ? Math.round(somaPct / totalAulasDisc) : 0;
        const ciclosDiscCompletos = aulasDaDisc.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;
        const materiasDaDisc = MATERIAS_CATALOGO.filter(m => m.disciplinaId === disciplinaAtual.id);
        const materiasFiltradas = materiasDaDisc.filter(mat => {
          if (!termoBuscaNorm) return true;
          const matchNome = mat.nome.toLowerCase().includes(termoBuscaNorm);
          const matchAula = AULAS_CATALOGO.some(a => a.materiaId === mat.id && a.titulo.toLowerCase().includes(termoBuscaNorm));
          return matchNome || matchAula;
        });

        return (
          <>
            {/* Top Bar Fixa de Navegação da Disciplina (Título agora abaixo do cabeçalho) */}
            <div 
              className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#0D0D0D]/95 border-b border-white/10 px-4 sm:px-6 py-3 transition-all shadow-xl"
              style={{
                paddingTop: 'calc(0.75rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
              }}
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleVoltar}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-95 transition shadow-lg shrink-0"
                  aria-label="Voltar para disciplinas"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
                </button>

                {/* Badge do total de aulas */}
                <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <BookOpen className="w-3.5 h-3.5" style={{ color: disciplinaAtual.corDestaque }} />
                  <span className="text-[11px] font-bold text-zinc-300">
                    {totalAulasDisc} {totalAulasDisc === 1 ? 'Aula' : 'Aulas'}
                  </span>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 pb-8 space-y-6">
              {/* Painel Hero Temático da Área / Disciplina (Pedido pelo Usuário) */}
              <AulasHeroPanel
                subtitulo="TRILHA DE APRENDIZADO DA ÁREA"
                titulo={disciplinaAtual.nome}
                descricao={disciplinaAtual.descricao}
                porcentagem={pctDisc}
                corDestaque={disciplinaAtual.corDestaque}
                corFundo={disciplinaAtual.corFundoCard}
                capaUrl={disciplinaAtual.capaHeroUrl}
                metricas={[
                  { label: 'Matérias', valor: materiasDaDisc.length },
                  { label: 'Aulas', valor: totalAulasDisc },
                  { label: 'Concluídas', valor: `${ciclosDiscCompletos}/${totalAulasDisc}` }
                ]}
              />

              {/* Menu de Alternância Temático da Disciplina */}
              <AulasMenuAlternancia
                abaAtiva={abaAtiva}
                onSelecionarAba={setAbaAtiva}
                corDestaque={disciplinaAtual.corDestaque}
                totalFavoritos={aulasDaDisc.filter(a => favoritosIds.has(a.id)).length}
                porcentagemGeral={pctDisc}
              />

              {abaAtiva === 'progresso' && (
                <AulasTabProgresso
                  disciplinaAtual={disciplinaAtual}
                  materias={materiasDaDisc}
                  aulas={aulasDaDisc}
                  calcularProgressoCiclo={calcularProgressoCiclo}
                  onIniciarAula={iniciarAula}
                  onSelecionarMateria={(matId) => {
                    setMateriaSelecionadaId(matId);
                    setAbaAtiva('trilhas');
                    resetScrollToTop();
                  }}
                  corDestaque={disciplinaAtual.corDestaque}
                />
              )}

              {abaAtiva === 'favoritos' && (
                <AulasTabFavoritos
                  aulasFavoritas={aulasDaDisc.filter(a => favoritosIds.has(a.id))}
                  onIniciarAula={iniciarAula}
                  onAlternarFavorito={handleAlternarFavorito}
                  corDestaque={disciplinaAtual.corDestaque}
                  onVoltarParaTrilhas={() => setAbaAtiva('trilhas')}
                />
              )}

              {abaAtiva === 'estatisticas' && (
                <AulasTabEstatisticas
                  disciplinaAtual={disciplinaAtual}
                  materias={materiasDaDisc}
                  aulas={aulasDaDisc}
                  calcularProgressoCiclo={calcularProgressoCiclo}
                  acertosMap={acertosMap}
                  corDestaque={disciplinaAtual.corDestaque}
                  onSelecionarMateria={(matId) => {
                    setMateriaSelecionadaId(matId);
                    setAbaAtiva('trilhas');
                    resetScrollToTop();
                  }}
                />
              )}

              {abaAtiva === 'trilhas' && (
                <>
              {/* Barra de Pesquisa Nível 2 */}
              <div className="relative w-full">
                <div 
                  className="relative flex items-center w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 focus-within:bg-white/[0.07] rounded-xl px-3.5 py-2.5 sm:py-3 transition-all shadow-lg backdrop-blur-md"
                  style={{ borderColor: buscaTermo ? disciplinaAtual.corDestaque : undefined }}
                >
                  <Search 
                    className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-400 shrink-0 mr-2.5 transition-colors" 
                    style={{ color: buscaTermo ? disciplinaAtual.corDestaque : undefined }}
                  />
                  <input
                    type="text"
                    value={buscaTermo}
                    onChange={(e) => setBuscaTermo(e.target.value)}
                    placeholder={`Pesquisar matéria em ${disciplinaAtual.nome}...`}
                    className="bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 outline-none w-full font-medium"
                  />
                  {buscaTermo && (
                    <button
                      type="button"
                      onClick={() => setBuscaTermo('')}
                      className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition shrink-0"
                      aria-label="Limpar pesquisa"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Header da Seção: Selecione o Módulo */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: disciplinaAtual.corDestaque }} />
                  <span>SELECIONE O MÓDULO ({materiasFiltradas.length})</span>
                </h3>
              </div>

              {/* Trilha Serpenteante em Linha do Tempo das Matérias */}
              <div className="relative py-4 sm:py-8 w-full min-w-0 max-w-full overflow-hidden">
                <div className="w-full min-w-0 relative z-[2] flex flex-col">
                  {materiasFiltradas.map((mat, i) => {
                    const isLeft = i % 2 === 0;
                    const aulasDaMat = AULAS_CATALOGO.filter(a => a.materiaId === mat.id);
                    const totalAulasMat = aulasDaMat.length;
                    const somaPctMat = aulasDaMat.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
                    const pctMat = totalAulasMat > 0 ? Math.round(somaPctMat / totalAulasMat) : 0;

                    return (
                      <div key={mat.id} className="w-full flex flex-col">
                        <div
                          className={cn(
                            "relative z-10 flex w-full items-center justify-between gap-3 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-10 max-w-3xl lg:max-w-4xl mx-auto group",
                            isLeft ? "flex-row" : "flex-row-reverse"
                          )}
                        >
                          {/* CONJUNTO DE CARTAS EM LEQUE COM CAPA DA MATÉRIA */}
                          <div
                            onClick={() => { setMateriaSelecionadaId(mat.id); resetScrollToTop(); }}
                            className="relative shrink-0 w-[152px] xs:w-[168px] sm:w-[200px] md:w-[225px] h-[200px] xs:h-[218px] sm:h-[245px] md:h-[270px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
                          >
                            {/* Carta 1 (Fundo) */}
                            <div
                              className={cn(
                                "absolute inset-0 rounded-2xl border border-white/10 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                                isLeft
                                  ? "scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5 group-hover:-translate-y-3"
                                  : "scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5 group-hover:-translate-y-3"
                              )}
                              style={{
                                background: disciplinaAtual.corFundoCard,
                                boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                              }}
                            >
                              <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />
                              <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden z-[2]">
                                <Layers className="w-5 h-5 text-white/30" />
                              </div>
                            </div>

                            {/* Carta 2 (Meio) */}
                            <div
                              className={cn(
                                "absolute inset-0 rounded-2xl border border-white/15 opacity-75 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                                isLeft
                                  ? "scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-3 group-hover:-translate-y-2"
                                  : "scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-3 group-hover:-translate-y-2"
                              )}
                              style={{
                                background: disciplinaAtual.corFundoCard,
                                boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                              }}
                            >
                              <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />
                              <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden z-[2]">
                                <Layers className="w-5 h-5 text-white/40" />
                              </div>
                            </div>

                            {/* Carta 3 (Frontal Principal com Capa) */}
                            <div
                              className={cn(
                                "relative w-full h-full p-2.5 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border border-white/30 transition-all duration-300 origin-bottom",
                                isLeft
                                  ? "group-hover:-rotate-[1deg] group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)]"
                                  : "group-hover:rotate-[1deg] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)]"
                              )}
                              style={{
                                background: disciplinaAtual.corFundoCard,
                                borderColor: `${disciplinaAtual.corDestaque}50`
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />
                              <div className="absolute inset-1 rounded-[14px] border border-white/15 pointer-events-none z-10" />

                              <img
                                src={mat.capaUrl}
                                alt={mat.titulo}
                                loading="lazy"
                                decoding="async"
                                className="pointer-events-none absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 select-none"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/95 via-black/25 to-[#0d0f12]/60 pointer-events-none z-0" />

                              {/* Topo da Carta: Porcentagem Elegante no Canto Superior Esquerdo */}
                              <div className="relative z-10 flex items-center justify-between w-full">
                                <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1">
                                  <span className="text-[10px] sm:text-[11px] font-black tracking-tight" style={{ color: disciplinaAtual.corDestaque }}>
                                    {pctMat}%
                                  </span>
                                </div>
                              </div>

                              {/* Centro da Capa Limpo (Sem Botão de Play) */}
                              <div className="my-auto py-2 z-[1] w-full" />

                              {/* Rodapé da Carta com Progresso */}
                              <div className="z-[1] pt-1.5 sm:pt-2 border-t border-white/20 w-full px-0.5">
                                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-normal text-white/95 mb-1 sm:mb-1.5">
                                  <span className="truncate">{totalAulasMat} {totalAulasMat === 1 ? 'aula' : 'aulas'}</span>
                                  <span className="font-semibold font-sans">{pctMat}%</span>
                                </div>
                                <div className="w-full bg-black/50 h-1.5 sm:h-2 rounded-full overflow-hidden border border-white/20">
                                  <div
                                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                                    style={{
                                      width: `${Math.max(pctMat, totalAulasMat > 0 ? 8 : 0)}%`,
                                      backgroundColor: disciplinaAtual.corDestaque,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* LINHA FINA CONECTORA E TÍTULO NO LADO OPOSTO */}
                          <div
                            onClick={() => {
                              setMateriaSelecionadaId(mat.id);
                              resetScrollToTop();
                            }}
                            className={cn(
                              "flex-1 min-w-0 flex items-center cursor-pointer select-none py-2 transition-all",
                              isLeft ? "flex-row pl-2 sm:pl-4" : "flex-row-reverse pr-2 sm:pr-4"
                            )}
                          >
                            <div
                              className={cn(
                                "flex items-center shrink-0 w-6 xs:w-8 sm:w-12 md:w-16",
                                isLeft ? "flex-row" : "flex-row-reverse"
                              )}
                            >
                              <div
                                className="w-2 h-2 rounded-full border border-white/70 shrink-0 transition-transform duration-300 group-hover:scale-125"
                                style={{
                                  backgroundColor: disciplinaAtual.corDestaque,
                                  boxShadow: `0 0 10px ${disciplinaAtual.corDestaque}`,
                                }}
                              />
                              <div
                                className="flex-1 h-[1px] transition-all duration-300 group-hover:h-[1.5px]"
                                style={{
                                  background: isLeft
                                    ? `linear-gradient(to right, ${disciplinaAtual.corDestaque}, rgba(255,255,255,0.3), transparent)`
                                    : `linear-gradient(to left, ${disciplinaAtual.corDestaque}, rgba(255,255,255,0.3), transparent)`,
                                }}
                              />
                            </div>

                            <div
                              className={cn(
                                "flex-1 min-w-0 flex flex-col justify-center px-2 sm:px-4 transition-transform duration-300 group-hover:-translate-y-0.5",
                                "items-start text-left"
                              )}
                            >
                              <div className={cn("flex items-center gap-1.5 mb-1 opacity-80", "justify-start")}>
                                <span className="text-[11px] sm:text-[13px] font-bold uppercase tracking-wider" style={{ color: disciplinaAtual.corDestaque }}>
                                  MATÉRIA {i + 1}
                                </span>
                              </div>

                              <h3 className="font-serif font-bold text-[17px] xs:text-[19px] sm:text-[22px] md:text-[24px] leading-tight text-white group-hover:text-amber-200 transition-colors drop-shadow-md line-clamp-3">
                                {mat.titulo}
                              </h3>

                              {mat.descricao && (
                                <p className="text-xs text-zinc-300/80 mt-1.5 line-clamp-2 max-w-md leading-relaxed hidden xs:block">
                                  {mat.descricao}
                                </p>
                              )}

                              <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">
                                <span>Explorar Matéria ({totalAulasMat} {totalAulasMat === 1 ? 'aula' : 'aulas'})</span>
                                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" style={{ color: disciplinaAtual.corDestaque }} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SVG S-Curve Connector */}
                        {i < materiasFiltradas.length - 1 && (
                          <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-[5] overflow-visible">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <defs>
                                <filter id={`trail-glow-mat-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="3" result="blur" />
                                  <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                              </defs>
                              <path
                                d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                              />
                              <path
                                d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                                fill="none"
                                stroke={disciplinaAtual.corDestaque}
                                strokeWidth="2.5"
                                strokeDasharray="5 7"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                filter={`url(#trail-glow-mat-${i})`}
                              />
                            </svg>
                            <div
                              className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
                              style={{
                                left: '50%',
                                top: '50%',
                                boxShadow: `0 0 10px ${disciplinaAtual.corDestaque}`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {materiasFiltradas.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                      <Search className="w-9 h-9 text-zinc-600 stroke-[1.5]" />
                      <p className="text-zinc-400 text-sm">
                        Nenhuma matéria encontrada para "<span className="text-white font-semibold">{buscaTermo}</span>"
                      </p>
                      <button
                        type="button"
                        onClick={() => setBuscaTermo('')}
                        className="text-xs font-medium underline"
                        style={{ color: disciplinaAtual.corDestaque }}
                      >
                        Limpar pesquisa
                      </button>
                    </div>
                  )}
                </div>
              </div>
                </>
              )}
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
        const matsDaDisc = MATERIAS_CATALOGO.filter(m => m.disciplinaId === disciplinaAtual.id);
        const numMateria = matsDaDisc.findIndex(m => m.id === materiaAtual.id) + 1;
        const aulasFiltradas = aulasDaMateria.filter(aula => {
          if (!termoBuscaNorm) return true;
          return aula.titulo.toLowerCase().includes(termoBuscaNorm) || 
            (aula.descricaoBreve && aula.descricaoBreve.toLowerCase().includes(termoBuscaNorm));
        });

        return (
          <>
            {/* Header Limpo de Topo Fixo (Título agora abaixo do cabeçalho) */}
            <div 
              className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#0D0D0D]/95 border-b border-white/10 px-4 sm:px-6 py-3 transition-all shadow-xl"
              style={{
                paddingTop: 'calc(0.75rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
              }}
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleVoltar}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-95 transition shadow-lg shrink-0"
                  aria-label="Voltar para matérias"
                >
                  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
                </button>

                {/* Badge do total de aulas disponíveis */}
                <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                  <BookOpen className="w-3.5 h-3.5" style={{ color: disciplinaAtual.corDestaque }} />
                  <span className="text-[11px] font-bold text-zinc-300">
                    {totalAulasMat} {totalAulasMat === 1 ? 'Aula' : 'Aulas'}
                  </span>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-4 sm:pt-6 pb-8 space-y-6">
              {/* Título Principal Fora do Cabeçalho com Risquinho Temático */}
              <div className="flex items-start gap-3 sm:gap-4">
                <div 
                  className="w-1.5 sm:w-2 h-10 sm:h-12 rounded-full shrink-0 mt-1 shadow-sm"
                  style={{ backgroundColor: disciplinaAtual.corDestaque }}
                />
                <div className="min-w-0 flex-1">
                  <span 
                    className="text-[11px] sm:text-xs font-black uppercase tracking-widest block truncate"
                    style={{ color: disciplinaAtual.corDestaque }}
                  >
                    {disciplinaAtual.nome} · MATÉRIA {numMateria > 0 ? numMateria : 1}
                  </span>
                  <h1 className="text-xl xs:text-2xl sm:text-3xl font-serif font-black text-white tracking-tight leading-tight mt-0.5">
                    {materiaAtual.titulo}
                  </h1>
                </div>
              </div>

              {/* Barra de Pesquisa Nível 3 */}
              <div className="relative w-full">
                <div 
                  className="relative flex items-center w-full bg-white/[0.04] hover:bg-white/[0.06] border border-white/10 focus-within:bg-white/[0.07] rounded-xl px-3.5 py-2.5 sm:py-3 transition-all shadow-lg backdrop-blur-md"
                  style={{ borderColor: buscaTermo ? disciplinaAtual.corDestaque : undefined }}
                >
                  <Search 
                    className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-zinc-400 shrink-0 mr-2.5 transition-colors" 
                    style={{ color: buscaTermo ? disciplinaAtual.corDestaque : undefined }}
                  />
                  <input
                    type="text"
                    value={buscaTermo}
                    onChange={(e) => setBuscaTermo(e.target.value)}
                    placeholder={`Pesquisar aula em ${materiaAtual.titulo}...`}
                    className="bg-transparent text-xs sm:text-sm text-white placeholder-zinc-500 outline-none w-full font-medium"
                  />
                  {buscaTermo && (
                    <button
                      type="button"
                      onClick={() => setBuscaTermo('')}
                      className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition shrink-0"
                      aria-label="Limpar pesquisa"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Header da Seção: Selecione a Aula */}
              <div className="flex items-center justify-between">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" style={{ color: disciplinaAtual.corDestaque }} />
                  <span>SELECIONE A AULA ({aulasFiltradas.length})</span>
                </h3>
                {pctMat > 0 && (
                  <span className="text-xs font-bold text-zinc-400">
                    Progresso da Matéria: <span style={{ color: disciplinaAtual.corDestaque }}>{pctMat}%</span>
                  </span>
                )}
              </div>

              {/* Trilha Serpenteante em Linha do Tempo das Aulas */}
              <div className="relative py-4 sm:py-8 w-full min-w-0 max-w-full overflow-hidden">
                <div className="w-full min-w-0 relative z-[2] flex flex-col">
                  {aulasFiltradas.map((aula, i) => {
                    const isLeft = i % 2 === 0;
                    const prog = calcularProgressoCiclo(aula);
                    const flashcardsLiberados = prog.aulaTerminada || modoLivreTeste;
                    const questoesLiberadas = (prog.aulaTerminada && prog.fcOk) || modoLivreTeste;
                    const conteudo = CONTEUDO_AULAS[aula.id];
                    const totalCards = conteudo?.flashcards.length || 18;
                    const totalQuestoes = conteudo?.questoes.length || 12;

                    const conteudoReal = AULAS_CONTEUDO_REAL[aula.id];
                    const kickersReais = conteudoReal?.slides
                      ? new Set(
                          conteudoReal.slides
                            .map(s => s.kicker)
                            .filter(k => k && !/^questão/i.test(k) && !/^flashcard/i.test(k) && !/^etapa/i.test(k) && !/^memorização/i.test(k) && !/^fixação/i.test(k))
                        )
                      : null;
                    const qtdTopicos = Math.min(6, Math.max(3, 
                      aula.topicosQtd || (kickersReais && kickersReais.size >= 2
                        ? Math.min(6, kickersReais.size)
                        : Math.floor((aula.etapas || 32) / 8) + (i % 3 === 0 ? 1 : 0))
                    ));

                    return (
                      <div key={aula.id} className="w-full flex flex-col">
                        <div
                          className={cn(
                            "relative z-10 flex w-full items-center justify-between gap-3 sm:gap-6 md:gap-8 px-2 sm:px-6 md:px-10 max-w-3xl lg:max-w-4xl mx-auto group",
                            isLeft ? "flex-row" : "flex-row-reverse"
                          )}
                        >
                          {/* CONJUNTO DE CARTAS EM LEQUE COM CAPA DA AULA */}
                          <div
                            onClick={() => iniciarAula(aula)}
                            className="relative shrink-0 w-[152px] xs:w-[168px] sm:w-[200px] md:w-[225px] h-[200px] xs:h-[218px] sm:h-[245px] md:h-[270px] cursor-pointer select-none transition-transform duration-300 active:scale-[0.97] hover:-translate-y-1.5"
                          >
                            {/* Carta 1 (Fundo) */}
                            <div
                              className={cn(
                                "absolute inset-0 rounded-2xl border border-white/10 opacity-40 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                                isLeft
                                  ? "scale-[0.88] rotate-[6deg] translate-x-3 sm:translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:rotate-[8deg] group-hover:translate-x-5 group-hover:-translate-y-3"
                                  : "scale-[0.88] -rotate-[6deg] -translate-x-3 sm:-translate-x-5 -translate-y-2 group-hover:scale-[0.92] group-hover:-rotate-[8deg] group-hover:-translate-x-5 group-hover:-translate-y-3"
                              )}
                              style={{
                                background: disciplinaAtual.corFundoCard,
                                boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                              }}
                            >
                              <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />
                              <div className="absolute inset-1.5 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden z-[2]">
                                <Layers className="w-5 h-5 text-white/30" />
                              </div>
                            </div>

                            {/* Carta 2 (Meio) */}
                            <div
                              className={cn(
                                "absolute inset-0 rounded-2xl border border-white/15 opacity-75 transition-all duration-400 origin-bottom z-0 shadow-lg overflow-hidden",
                                isLeft
                                  ? "scale-[0.94] rotate-[3deg] translate-x-1.5 sm:translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:rotate-[4deg] group-hover:translate-x-3 group-hover:-translate-y-2"
                                  : "scale-[0.94] -rotate-[3deg] -translate-x-1.5 sm:-translate-x-2.5 -translate-y-1 group-hover:scale-[0.96] group-hover:-rotate-[4deg] group-hover:-translate-x-3 group-hover:-translate-y-2"
                              )}
                              style={{
                                background: disciplinaAtual.corFundoCard,
                                boxShadow: `0 10px 24px -5px rgba(0,0,0,0.65), inset 0 0 0 1px rgba(255,255,255,0.1)`,
                              }}
                            >
                              <div className="absolute inset-0 bg-black/25 pointer-events-none z-[1]" />
                              <div className="absolute inset-1.5 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden z-[2]">
                                <Layers className="w-5 h-5 text-white/40" />
                              </div>
                            </div>

                            {/* Carta 3 (Frontal Principal com Capa da Aula) */}
                            <div
                              className={cn(
                                "relative w-full h-full p-2.5 sm:p-3.5 rounded-2xl flex flex-col justify-between overflow-hidden box-border z-20 border border-white/30 transition-all duration-300 origin-bottom",
                                isLeft
                                  ? "group-hover:-rotate-[1deg] group-hover:-translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)]"
                                  : "group-hover:rotate-[1deg] group-hover:translate-x-1 group-hover:-translate-y-1 shadow-[0_16px_36px_rgba(0,0,0,0.75)]"
                              )}
                              style={{
                                background: disciplinaAtual.corFundoCard,
                                borderColor: `${disciplinaAtual.corDestaque}50`
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />
                              <div className="absolute inset-1 rounded-[14px] border border-white/15 pointer-events-none z-10" />

                              <img
                                src={aula.capaUrl}
                                alt={aula.titulo}
                                loading="lazy"
                                decoding="async"
                                className="pointer-events-none absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 z-0 select-none"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12]/95 via-black/25 to-[#0d0f12]/60 pointer-events-none z-0" />

                              {/* Topo da Carta: Porcentagem Elegante no Canto Superior Esquerdo */}
                              <div className="relative z-10 flex items-center justify-between w-full">
                                <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1">
                                  <span className="text-[10px] sm:text-[11px] font-black tracking-tight" style={{ color: disciplinaAtual.corDestaque }}>
                                    {prog.porcentagemTotal}%
                                  </span>
                                </div>
                                {prog.cicloCompleto && (
                                  <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                    <span>100%</span>
                                  </span>
                                )}
                              </div>

                              {/* Centro da Capa Limpo (Sem Botão de Play Conforme Solicitado) */}
                              <div className="my-auto py-2 z-[1] w-full" />

                              {/* Rodapé da Carta: Progresso Ponderado */}
                              <div className="z-[1] pt-1.5 sm:pt-2 border-t border-white/20 w-full px-0.5">
                                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-white/95 mb-1">
                                  <span className="truncate">
                                    {prog.cicloCompleto ? 'Finalizado' : `${prog.fasesConcluidasCount} de 3 fases`}
                                  </span>
                                </div>
                                <div className="w-full bg-black/60 h-1.5 sm:h-2 rounded-full overflow-hidden border border-white/20">
                                  <div
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500",
                                      prog.cicloCompleto ? "bg-emerald-500" : "bg-gradient-to-r from-red-500 to-amber-500"
                                    )}
                                    style={{
                                      width: `${Math.max(prog.porcentagemTotal, 8)}%`,
                                      backgroundColor: prog.cicloCompleto ? '#10b981' : disciplinaAtual.corDestaque,
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* LINHA CONECTORA E INFORMAÇÕES + 3 BOTÕES NO LADO OPOSTO */}
                          <div
                            className={cn(
                              "flex-1 min-w-0 flex items-center select-none py-2 transition-all",
                              isLeft ? "flex-row pl-1.5 xs:pl-2 sm:pl-3" : "flex-row-reverse pr-1.5 xs:pr-2 sm:pr-3"
                            )}
                          >
                            {/* Linha Conectora com Degradê */}
                            <div
                              className={cn(
                                "flex items-center shrink-0 w-5 xs:w-7 sm:w-10 md:w-14",
                                isLeft ? "flex-row" : "flex-row-reverse"
                              )}
                            >
                              <div
                                className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full border border-white/70 shrink-0 transition-transform duration-300 group-hover:scale-125"
                                style={{
                                  backgroundColor: disciplinaAtual.corDestaque,
                                  boxShadow: `0 0 8px ${disciplinaAtual.corDestaque}`,
                                }}
                              />
                              <div
                                className="flex-1 h-[1px] transition-all duration-300 group-hover:h-[1.5px]"
                                style={{
                                  background: isLeft
                                    ? `linear-gradient(to right, ${disciplinaAtual.corDestaque}, rgba(255,255,255,0.3), transparent)`
                                    : `linear-gradient(to left, ${disciplinaAtual.corDestaque}, rgba(255,255,255,0.3), transparent)`,
                                }}
                              />
                            </div>

                            {/* Informações da Aula e 3 Ações Interativas */}
                            <div
                              className={cn(
                                "flex-1 min-w-0 flex flex-col justify-center px-1.5 xs:px-2.5 sm:px-4 transition-transform duration-300 group-hover:-translate-y-0.5",
                                "items-start text-left"
                              )}
                            >
                              <div
                                className={cn(
                                  "flex items-center gap-1.5 mb-1 opacity-90",
                                  "justify-start"
                                )}
                              >
                                <span
                                  className="text-[13px] sm:text-[15px] font-black uppercase tracking-wider"
                                  style={{ color: disciplinaAtual.corDestaque }}
                                >
                                  {aula.numeroAula}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAlternarFavorito(aula);
                                  }}
                                  className={cn(
                                    "p-1 rounded-full transition-all shrink-0 active:scale-90 ml-1.5",
                                    favoritosIds.has(aula.id)
                                      ? "text-amber-400 bg-amber-400/20"
                                      : "text-zinc-500 hover:text-zinc-200 hover:bg-white/10"
                                  )}
                                  title={favoritosIds.has(aula.id) ? "Remover dos favoritos" : "Salvar nos favoritos"}
                                  aria-label="Favoritar aula"
                                >
                                  <Star className={cn("w-3.5 h-3.5", favoritosIds.has(aula.id) ? "fill-current" : "")} />
                                </button>
                                
                              </div>

                              <h3 
                                onClick={() => iniciarAula(aula)}
                                className="font-serif font-bold text-[15px] xs:text-[17px] sm:text-[19px] md:text-[21px] leading-[1.3] break-words text-zinc-100 group-hover:text-amber-200 transition-colors drop-shadow-md cursor-pointer"
                              >
                                {aula.titulo}
                              </h3>

                              <p className="text-[11px] sm:text-xs text-zinc-300/80 mt-1.5 leading-relaxed">
                                {formatDescricaoExata(aula.descricao, aula.titulo)}
                              </p>

                              {/* OS 3 BOTÕES DE AÇÃO: SEM NÚMEROS E SEM ABREVIAÇÕES */}
                              <div 
                                className={cn(
                                  "flex flex-col sm:grid sm:grid-cols-3 gap-1.5 sm:gap-2 mt-3 pt-2.5 border-t border-white/10 w-full",
                                  "justify-start"
                                )}
                              >
                                {/* 1. Iniciar Aula */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    iniciarAula(aula);
                                  }}
                                  className={cn(
                                    "w-full h-9 sm:h-11 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 shadow-md",
                                    prog.aulaTerminada
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                                      : "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border border-red-400/40 shadow-red-950/40"
                                  )}
                                  title={prog.aulaTerminada ? 'Reassistir aula interativa' : 'Iniciar aula interativa'}
                                >
                                  {prog.aulaTerminada ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                                  )}
                                  <span className="whitespace-nowrap">{prog.aulaTerminada ? 'VER AULA' : 'INICIAR'}</span>
                                </button>

                                {/* 2 & 3. Revisar + Praticar */}
                                <div className="grid grid-cols-2 sm:contents gap-1.5">
                                  {/* 2. Revisar (Cor invisível/transparente quando bloqueado) */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!flashcardsLiberados) {
                                        setModalBloqueioAula({ aula, motivo: 'revisar' });
                                        return;
                                      }
                                      abrirRevisarFlashcards(aula);
                                    }}
                                    className={cn(
                                      "w-full h-8.5 sm:h-11 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 border",
                                      prog.fcOk
                                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                                        : flashcardsLiberados
                                          ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-amber-400/50 shadow-md shadow-amber-950/40"
                                          : "bg-transparent text-zinc-400 border-white/10 hover:border-white/25 hover:bg-white/[0.04] cursor-pointer"
                                    )}
                                    title={!flashcardsLiberados ? 'Toque para ver como destravar' : 'Revisar com Flashcards'}
                                  >
                                    {flashcardsLiberados ? (
                                      <Layers className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                                    ) : (
                                      <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    )}
                                    <span className="whitespace-nowrap">REVISAR</span>
                                  </button>

                                  {/* 3. Praticar (Cor invisível/transparente quando bloqueado) */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (!questoesLiberadas) {
                                        setModalBloqueioAula({ aula, motivo: 'praticar' });
                                        return;
                                      }
                                      abrirPraticarQuestoes(aula);
                                    }}
                                    className={cn(
                                      "w-full h-8.5 sm:h-11 px-2 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-95 border",
                                      prog.questoesOk
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                                        : questoesLiberadas
                                          ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400/50 shadow-md shadow-emerald-950/40"
                                          : "bg-transparent text-zinc-400 border-white/10 hover:border-white/25 hover:bg-white/[0.04] cursor-pointer"
                                    )}
                                    title={!questoesLiberadas ? 'Toque para ver como destravar' : 'Praticar Questões'}
                                  >
                                    {questoesLiberadas ? (
                                      <HelpCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                                    ) : (
                                      <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    )}
                                    <span className="whitespace-nowrap">PRATICAR</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* SVG S-Curve Connector */}
                        {i < aulasFiltradas.length - 1 && (
                          <div className="relative w-full max-w-3xl lg:max-w-4xl mx-auto h-16 sm:h-20 -my-1.5 sm:-my-2 pointer-events-none z-[5] overflow-visible">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                              <defs>
                                <filter id={`trail-glow-aula-${i}`} x="-20%" y="-20%" width="140%" height="140%">
                                  <feGaussianBlur stdDeviation="3" result="blur" />
                                  <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                  </feMerge>
                                </filter>
                              </defs>
                              <path
                                d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.08)"
                                strokeWidth="4"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                              />
                              <path
                                d={isLeft ? "M 30 0 C 30 65, 70 35, 70 100" : "M 70 0 C 70 65, 30 35, 30 100"}
                                fill="none"
                                stroke={disciplinaAtual.corDestaque}
                                strokeWidth="2.5"
                                strokeDasharray="5 7"
                                strokeLinecap="round"
                                vectorEffect="non-scaling-stroke"
                                filter={`url(#trail-glow-aula-${i})`}
                              />
                            </svg>
                            <div
                              className="absolute w-2.5 h-2.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none border border-white/70 bg-white shadow-lg"
                              style={{
                                left: '50%',
                                top: '50%',
                                boxShadow: `0 0 10px ${disciplinaAtual.corDestaque}`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {aulasFiltradas.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                      <Search className="w-9 h-9 text-zinc-600 stroke-[1.5]" />
                      <p className="text-zinc-400 text-sm">
                        Nenhuma aula encontrada para "<span className="text-white font-semibold">{buscaTermo}</span>"
                      </p>
                      <button
                        type="button"
                        onClick={() => setBuscaTermo('')}
                        className="text-xs font-medium underline"
                        style={{ color: disciplinaAtual.corDestaque }}
                      >
                        Limpar pesquisa
                      </button>
                    </div>
                  )}
                </div>
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

      {/* Modal Centralizado de Etapa Bloqueada */}
      {modalBloqueioAula && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setModalBloqueioAula(null)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl border border-white/20 bg-zinc-950 p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 shadow-lg shadow-amber-950/50">
              <Lock className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-wider mb-2">
              Etapa Bloqueada
            </h3>

            <p className="text-sm text-zinc-300 leading-relaxed mb-6">
              Você precisa terminar a aula interativa primeiro para poder revisar e praticar!
            </p>

            <div className="flex flex-col w-full gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const aula = modalBloqueioAula.aula;
                  setModalBloqueioAula(null);
                  iniciarAula(aula);
                }}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 active:scale-95 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Aula Agora</span>
              </button>

              <button
                type="button"
                onClick={() => setModalBloqueioAula(null)}
                className="w-full h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs uppercase tracking-wider border border-white/10 active:scale-95 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

          {/* Modal 3: Aula em Produção / Em Breve */}
      {aulaPendenteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md bg-[#131318] border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 bg-black/40 border border-white/10">
              <img 
                src={aulaPendenteModal.capaUrl} 
                alt={aulaPendenteModal.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131318] via-transparent to-transparent" />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md border border-white/20 text-white">
                {aulaPendenteModal.numeroAula}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Em Produção Multimídia
              </span>
            </div>

            <h3 className="text-lg font-black text-white leading-tight mb-2">
              {aulaPendenteModal.titulo}
            </h3>

            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Esta aula está em processo de sincronização e gravação de áudio e interações. As Aulas 01 e 02 das matérias base já estão 100% disponíveis para estudo com narração ativa agora!
            </p>

            <button
              type="button"
              onClick={() => setAulaPendenteModal(null)}
              className="w-full py-3 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-amber-950/50 active:scale-95 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}