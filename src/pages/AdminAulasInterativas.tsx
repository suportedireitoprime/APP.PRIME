import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ShapeGrid from '@/components/ui/ShapeGrid';
import { cn } from '@/lib/utils';
import { 
  Sparkles, Play, BookOpen, Layers, 
  ArrowLeft, ArrowRight, Check, Lock, HelpCircle, 
  AlertCircle, Unlock, ChevronRight, ChevronLeft,
  Search, X, Star, List, LayoutGrid, Headphones, Home, BarChart3
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
import { CONTEUDO_AULAS } from '@/data/aulasInterativasConteudo';
import { ModalRevisarFlashcards } from '@/components/aulas-interativas/ModalRevisarFlashcards';
import { ModalPraticarQuestoes } from '@/components/aulas-interativas/ModalPraticarQuestoes';
import { PlayerAulaNativo } from '@/components/aulas-interativas/PlayerAulaNativo';
import { FlashcardDeckItem } from '@/components/flashcards/FlashcardDeckItem';
import { FallingLotusPetals } from '@/components/flashcards/FallingLotusPetals';
import { assetUrl } from '@/lib/assetUrl';
import { areaIconFor } from '@/lib/areasDireitoIcons';
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import { haptic } from '@/lib/nativeHaptics';
import greciaFilosofosFundo from '@/assets/grecia-filosofos-fundo.webp';
import themisMarbleCutout from '@/assets/themis-marble-cutout.webp';
import tribunalVermelhoTrilha from '@/assets/tribunal_vermelho_trilha.webp';
import capaAdminOrigens from '@/assets/aulas-interativas/direito-administrativo/capa-aula-01-origens.webp';
import pageTurnSound from '@/assets/page-turn.mp3';
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


function formatarTituloMateriaCurto(titulo: string): string {
  if (!titulo) return '';
  return titulo
    .replace(/^\d+[\.\-\s_:]+/, '')
    .replace(/\s+(do|de|no|da|em)\s+Direito\s+([a-zA-ZÀ-ÿ]+)/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Direito\b/gi, '')
    .replace(/\s+(do|de|no|da|em)\s+Administrativo\b/gi, '')
    .replace(/^Direito\s+[a-zA-ZÀ-ÿ]+\s*[-–:]\s*/i, '')
    .replace(/\s+Direito\s+Administrativo\b/gi, '')
    .trim();
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

// Balança da Justiça com Coroa de Louros Dourada (Padrão Oficial Clássico do Mockup)
const BalancaLourosDourada = () => (
  <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-start select-none pointer-events-none mb-1">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_14px_rgba(245,158,11,0.6)]" fill="none">
      <defs>
        <linearGradient id="goldGradAulas" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      {/* Louros Circulares */}
      <path d="M 50 15 C 32 15 18 30 18 50 C 18 68 30 82 46 85" stroke="url(#goldGradAulas)" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M 50 15 C 68 15 82 30 82 50 C 82 68 70 82 54 85" stroke="url(#goldGradAulas)" strokeWidth="2.8" strokeLinecap="round" />
      {/* Folhas de Louro Esquerda */}
      <path d="M 22 34 Q 15 32 18 26 Q 25 30 22 34 Z" fill="url(#goldGradAulas)" />
      <path d="M 18 45 Q 11 44 14 38 Q 21 42 18 45 Z" fill="url(#goldGradAulas)" />
      <path d="M 18 57 Q 11 58 14 64 Q 21 60 18 57 Z" fill="url(#goldGradAulas)" />
      <path d="M 24 68 Q 18 71 22 76 Q 28 72 24 68 Z" fill="url(#goldGradAulas)" />
      <path d="M 34 78 Q 30 84 36 87 Q 39 80 34 78 Z" fill="url(#goldGradAulas)" />
      {/* Folhas de Louro Direita */}
      <path d="M 78 34 Q 85 32 82 26 Q 75 30 78 34 Z" fill="url(#goldGradAulas)" />
      <path d="M 82 45 Q 89 44 86 38 Q 79 42 82 45 Z" fill="url(#goldGradAulas)" />
      <path d="M 82 57 Q 89 58 86 64 Q 79 60 82 57 Z" fill="url(#goldGradAulas)" />
      <path d="M 76 68 Q 82 71 78 76 Q 72 72 76 68 Z" fill="url(#goldGradAulas)" />
      <path d="M 66 78 Q 70 84 64 87 Q 61 80 66 78 Z" fill="url(#goldGradAulas)" />
      {/* Balança Central */}
      <line x1="50" y1="26" x2="50" y2="72" stroke="url(#goldGradAulas)" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M 40 72 L 60 72" stroke="url(#goldGradAulas)" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="50" cy="25" r="2.8" fill="url(#goldGradAulas)" />
      <line x1="30" y1="35" x2="70" y2="35" stroke="url(#goldGradAulas)" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="32" y1="35" x2="25" y2="52" stroke="url(#goldGradAulas)" strokeWidth="1.4" />
      <line x1="32" y1="35" x2="39" y2="52" stroke="url(#goldGradAulas)" strokeWidth="1.4" />
      <path d="M 23 52 Q 32 58 41 52 Z" fill="url(#goldGradAulas)" />
      <line x1="68" y1="35" x2="61" y2="52" stroke="url(#goldGradAulas)" strokeWidth="1.4" />
      <line x1="68" y1="35" x2="75" y2="52" stroke="url(#goldGradAulas)" strokeWidth="1.4" />
      <path d="M 59 52 Q 68 58 77 52 Z" fill="url(#goldGradAulas)" />
    </svg>
  </div>
);

// Ramo de Louro Dourado nos Cantos Inferiores
const BottomCornerLaurel = ({ flip = false }: { flip?: boolean }) => (
  <svg 
    viewBox="0 0 100 100" 
    className={cn("w-20 h-20 sm:w-28 sm:h-28 text-[#f59e0b]/35 pointer-events-none select-none", flip && "scale-x-[-1]")} 
    fill="currentColor"
  >
    <path d="M 10 90 Q 30 70 50 40 Q 65 15 80 5 Q 65 30 45 60 Q 25 80 10 90 Z" opacity="0.6" />
    <path d="M 30 65 Q 20 55 25 45 Q 38 52 30 65 Z" />
    <path d="M 42 50 Q 32 40 38 30 Q 50 38 42 50 Z" />
    <path d="M 55 35 Q 46 25 52 16 Q 63 24 55 35 Z" />
    <path d="M 68 20 Q 60 10 68 2 Q 77 10 68 20 Z" />
  </svg>
);

// Formatação limpa do título da área para visual clássico
const formatarTituloArea = (nome: string) => {
  if (!nome) return '';
  return nome
    .toLowerCase()
    .split(' ')
    .map((w, idx) => {
      if (idx > 0 && ['de', 'do', 'da', 'dos', 'das', 'e', 'em'].includes(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
};

export default function AdminAulasInterativas() {
  const navigate = useNavigate();

  // Estados de navegação hierárquica
  const [disciplinaSelecionadaId, setDisciplinaSelecionadaId] = useState<string | null>(null);
  const [materiaSelecionadaId, setMateriaSelecionadaId] = useState<string | null>(null);
  const [aulaAtiva, setAulaAtiva] = useState<AulaItem | null>(null);
  const [modoVisualizacaoAulas, setModoVisualizacaoAulas] = useState<'lista' | 'carrossel'>('lista');
  const [aulaPendenteModal, setAulaPendenteModal] = useState<AulaItem | null>(null);
  const [buscaTermo, setBuscaTermo] = useState('');
  const [abaAtiva, setAbaAtiva] = useState<AbaAulas>('trilhas');
  const [favoritosIds, setFavoritosIds] = useState<Set<string>>(new Set());
  const [acertosMap, setAcertosMap] = useState<Record<string, { acertos: number; total: number }>>({});
  const [activeDiscIndex, setActiveDiscIndex] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Carrossel no padrão Audiobooks para seleção de disciplinas
  const carouselScrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(1);
  const isDraggingRef = useRef(false);
  const lastSoundIndexRef = useRef<number>(-1);
  const pageTurnAudioRef = useRef<HTMLAudioElement | null>(null);

  const playPageTurnSound = useCallback(() => {
    try {
      if (!pageTurnAudioRef.current) {
        pageTurnAudioRef.current = new Audio(pageTurnSound);
      }
      pageTurnAudioRef.current.currentTime = 0;
      pageTurnAudioRef.current.volume = 0.4;
      pageTurnAudioRef.current.playbackRate = 1.15;
      const p = pageTurnAudioRef.current.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {});
      }
    } catch {}
  }, []);

  // Rastreador de toque e velocidade 1:1 ultra-fluida com inércia do dedo
  const dragTrackerRef = useRef<{
    startX: number;
    startY: number;
    startScrollLeft: number;
    points: { x: number; time: number }[];
    isPointerDown: boolean;
    isHorizontalDrag: boolean | null;
  }>({
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    points: [],
    isPointerDown: false,
    isHorizontalDrag: null,
  });

  const scrollCarouselToIndex = useCallback(
    (idx: number, behavior: ScrollBehavior = "smooth") => {
      const el = carouselScrollerRef.current;
      if (!el) return;
      const child = el.children[idx] as HTMLElement | undefined;
      if (!child) return;
      const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
      el.scrollTo({ left: target, behavior });
      if (idx !== activeCarouselIndex) {
        playPageTurnSound();
      }
      setActiveCarouselIndex(idx);
    },
    [activeCarouselIndex, playPageTurnSound]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = carouselScrollerRef.current;
    if (!el) return;

    // Desativa temporariamente o scrollSnap e behavior para seguir o dedo instantaneamente
    el.style.scrollBehavior = 'auto';
    el.style.scrollSnapType = 'none';

    dragTrackerRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startScrollLeft: el.scrollLeft,
      points: [{ x: e.clientX, time: performance.now() }],
      isPointerDown: true,
      isHorizontalDrag: null,
    };
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const tracker = dragTrackerRef.current;
    if (!tracker.isPointerDown) return;
    const el = carouselScrollerRef.current;
    if (!el) return;

    const dx = e.clientX - tracker.startX;
    const dy = e.clientY - tracker.startY;

    if (tracker.isHorizontalDrag === null) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        tracker.isHorizontalDrag = Math.abs(dx) >= Math.abs(dy);
      }
    }

    if (!tracker.isHorizontalDrag) return;

    if (Math.abs(dx) > 6) {
      isDraggingRef.current = true;
    }

    // Acompanha o dedo na velocidade exata 1:1
    el.scrollLeft = tracker.startScrollLeft - dx;

    // Registra histórico de velocidade nos últimos 120ms
    const now = performance.now();
    tracker.points.push({ x: e.clientX, time: now });
    if (tracker.points.length > 7) {
      tracker.points.shift();
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const tracker = dragTrackerRef.current;
    if (!tracker.isPointerDown) return;
    tracker.isPointerDown = false;
    const el = carouselScrollerRef.current;
    if (!el) return;

    // Restaura o snap suave do CSS
    el.style.scrollBehavior = 'smooth';
    el.style.scrollSnapType = 'x mandatory';

    const now = performance.now();
    const recent = tracker.points.filter(p => now - p.time < 130);
    let vx = 0; // velocidade horizontal em px/ms
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = (last.time - first.time) || 1;
      vx = (last.x - first.x) / dt;
    }

    const totalDx = e.clientX - tracker.startX;

    if (isDraggingRef.current) {
      const center = el.scrollLeft + el.clientWidth / 2;
      let closestIdx = 0;
      let minDistance = Infinity;
      for (let i = 0; i < el.children.length; i++) {
        const child = el.children[i] as HTMLElement;
        const mid = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      }

      let targetIdx = closestIdx;
      // Impulso dinâmico pela velocidade de arrasto do dedo
      if (vx < -0.35 || totalDx < -45) {
        // Arrasto rápido ou flick para esquerda -> próxima área
        const step = Math.abs(vx) > 1.2 ? 2 : 1;
        targetIdx = Math.min(el.children.length - 1, activeCarouselIndex + step);
      } else if (vx > 0.35 || totalDx > 45) {
        // Arrasto rápido ou flick para direita -> área anterior
        const step = Math.abs(vx) > 1.2 ? 2 : 1;
        targetIdx = Math.max(0, activeCarouselIndex - step);
      }

      scrollCarouselToIndex(targetIdx, "smooth");
    }

    setTimeout(() => {
      isDraggingRef.current = false;
    }, 80);
  };

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
    const doScroll = () => {
      try {
        window.scrollTo(0, 0);
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
        const root = document.getElementById('root');
        if (root) root.scrollTop = 0;
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
        document.querySelectorAll('main, [class*="overflow"]').forEach(el => {
          if (el.scrollTop > 0) el.scrollTop = 0;
        });
      } catch {}
    };
    doScroll();
    requestAnimationFrame(doScroll);
    setTimeout(doScroll, 10);
    setTimeout(doScroll, 50);
    setTimeout(doScroll, 150);
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

  // Estados dos Bottom Sheets Deslizantes (Lista de Aulas da Matéria e Detalhe da Aula)
  const [aulaSheetDetalhe, setAulaSheetDetalhe] = useState<AulaItem | null>(null);
  const [buscaTermoAulas, setBuscaTermoAulas] = useState('');

  
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

  // ⚡ Pré-aquecimento em memória (Prefetch 0ms) das capas das aulas, matérias e disciplinas
  useEffect(() => {
    // 1. Capas das 4 disciplinas principais
    DISCIPLINAS_CATALOGO.forEach((disc) => {
      if (disc.capaHeroUrl) {
        const img = new Image();
        img.src = disc.capaHeroUrl;
      }
    });

    // 2. Capas das primeiras matérias de cada disciplina para carregamento imediato
    const topMaterias = MATERIAS_CATALOGO.slice(0, 24);
    topMaterias.forEach((mat) => {
      if (mat.capaUrl) {
        const img = new Image();
        img.src = mat.capaUrl;
      }
    });
  }, []);

  // Ao selecionar uma disciplina, pré-carrega todas as matérias e as primeiras aulas dela
  useEffect(() => {
    if (!disciplinaSelecionadaId) return;
    const mats = MATERIAS_CATALOGO.filter((m) => m.disciplinaId === disciplinaSelecionadaId);
    mats.forEach((m) => {
      if (m.capaUrl) {
        const img = new Image();
        img.src = m.capaUrl;
      }
    });
    // Pré-aquece as primeiras 30 aulas desta disciplina
    const aulas = AULAS_CATALOGO.filter((a) => a.disciplinaId === disciplinaSelecionadaId).slice(0, 30);
    aulas.forEach((a) => {
      if (a.capaUrl) {
        const img = new Image();
        img.src = a.capaUrl;
      }
    });
  }, [disciplinaSelecionadaId]);

  // Ao selecionar uma matéria, pré-carrega instantaneamente todas as capas de aulas dela
  useEffect(() => {
    if (!materiaSelecionadaId) return;
    const aulas = AULAS_CATALOGO.filter((a) => a.materiaId === materiaSelecionadaId);
    aulas.forEach((a) => {
      if (a.capaUrl) {
        const img = new Image();
        img.src = a.capaUrl;
      }
    });
  }, [materiaSelecionadaId]);

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
    setBuscaTermoAulas('');
    if (aulaAtiva) {
      setAulaAtiva(null);
    } else if (aulaSheetDetalhe) {
      setAulaSheetDetalhe(null);
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

  const disciplinasFiltradas = useMemo(() => {
    return DISCIPLINAS_CATALOGO.filter(disc => {
      if (!termoBuscaNorm) return true;
      const matchNome = disc.nome.toLowerCase().includes(termoBuscaNorm);
      const matchMateria = MATERIAS_CATALOGO.some(m => m.disciplinaId === disc.id && ((m as any).nome || m.titulo || "").toLowerCase().includes(termoBuscaNorm));
      const matchAula = AULAS_CATALOGO.some(a => a.disciplinaId === disc.id && a.titulo.toLowerCase().includes(termoBuscaNorm));
      return matchNome || matchMateria || matchAula;
    });
  }, [termoBuscaNorm]);

  const loopedDisciplinas = useMemo(() => {
    if (disciplinasFiltradas.length <= 1) return disciplinasFiltradas;
    return [
      ...disciplinasFiltradas,
      ...disciplinasFiltradas,
      ...disciplinasFiltradas,
    ];
  }, [disciplinasFiltradas]);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselScrollerRef.current;
    if (!el) return;

    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const mid = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(mid - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }

    if (best !== activeCarouselIndex && best !== lastSoundIndexRef.current) {
      lastSoundIndexRef.current = best;
      playPageTurnSound();
    }

    const N = disciplinasFiltradas.length;
    if (N > 1) {
      if (best <= 1) {
        const jumpTo = best + N;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({
            left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2,
            behavior: "auto",
          });
          setActiveCarouselIndex(jumpTo);
          return;
        }
      } else if (best >= loopedDisciplinas.length - 2) {
        const jumpTo = best - N;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({
            left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2,
            behavior: "auto",
          });
          setActiveCarouselIndex(jumpTo);
          return;
        }
      }
    }

    setActiveCarouselIndex(best);
  }, [disciplinasFiltradas.length, loopedDisciplinas.length]);

  useEffect(() => {
    if (disciplinasFiltradas.length > 0) {
      const initialIndex = disciplinasFiltradas.length > 1 ? disciplinasFiltradas.length : 0;
      setActiveCarouselIndex(initialIndex);
      const timer = setTimeout(() => {
        scrollCarouselToIndex(initialIndex, "instant" as ScrollBehavior);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [disciplinasFiltradas.length, scrollCarouselToIndex]);

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
        const totalDisciplinas = disciplinasFiltradas.length;
        const safeIdx = totalDisciplinas > 0 
          ? ((activeCarouselIndex % totalDisciplinas) + totalDisciplinas) % totalDisciplinas
          : 0;

        const currDisc = totalDisciplinas > 0 ? disciplinasFiltradas[safeIdx] : DISCIPLINAS_CATALOGO[0];
        const currTheme = getDisciplinaVisualTheme(currDisc?.id || 'penal');

        return (
          <>
          {/* ── Fundo Clássico Oficial (Palácio de Justiça / Tribunal Neoclássico com Louros - Desfocado e Escuro) ── */}
          <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#0a0503]">
            <img
              src={tribunalVermelhoTrilha}
              alt="Tribunal de Justiça"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="w-full h-full object-cover object-top select-none pointer-events-none filter brightness-[0.60] contrast-110 blur-[8px] scale-105"
            />
            {/* Camada de desfoque escuro e vinheta atmosférica de alta profundidade */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0406]/98 via-black/65 to-black/75 pointer-events-none" />
          </div>

          {/* ── CONTAINER PRINCIPAL EM TELA CHEIA (SEM SCROLL VERTICAL, 100% RESPONSIVO, SEM MARGENS LATERAIS) ── */}
          <div className="relative z-20 w-full h-dvh max-h-dvh overflow-hidden flex flex-col justify-between pt-[calc(0.6rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-[calc(0.85rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] px-0">
            {/* ── CABEÇALHO RESPONSIVO PADRÃO FLASHCARDS (CENTRALIZADO, COM COR DINÂMICA DA CAPA) ── */}
            <div className="w-full max-w-lg sm:max-w-xl lg:max-w-3xl mx-auto flex flex-col items-center z-20 shrink-0 px-3 xs:px-4 sm:px-6">
              {/* Top Bar com Botão Voltar Circular Padrão Premium (w-12 h-12 / 52px) + Botão de Progresso */}
              <div className="w-full flex items-center justify-between mb-1.5 xs:mb-2">
                <button
                  type="button"
                  onClick={handleVoltar}
                  className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center bg-black/60 border border-white/20 text-white hover:bg-black/80 active:scale-95 transition-all cursor-pointer shadow-lg shrink-0"
                  style={{
                    borderColor: `${currTheme.primary || '#ef4444'}66`,
                    boxShadow: `0 0 14px ${currTheme.glowSoft || 'rgba(0,0,0,0.5)'}`
                  }}
                  aria-label="Voltar"
                >
                  <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[2.4]" />
                </button>

                {/* Botão de Progresso Padrão Premium (w-12 h-12 / 52px) no Canto Superior Direito */}
                <button
                  type="button"
                  onClick={() => {
                    try { haptic.selection(); } catch {}
                    setAbaAtiva(abaAtiva === 'progresso' ? 'trilhas' : 'progresso');
                  }}
                  className={cn(
                    "relative w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center border transition-all active:scale-95 shadow-lg cursor-pointer shrink-0",
                    abaAtiva === 'progresso'
                      ? "bg-black/90 text-white"
                      : "bg-black/60 text-white/90 hover:bg-black/80"
                  )}
                  style={{
                    borderColor: abaAtiva === 'progresso' ? (currTheme.primary || '#ef4444') : `${currTheme.primary || '#ef4444'}50`,
                    boxShadow: abaAtiva === 'progresso' 
                      ? `0 0 18px ${currTheme.glow || 'rgba(239,68,68,0.7)'}` 
                      : `0 0 10px ${currTheme.glowSoft || 'rgba(0,0,0,0.4)'}`
                  }}
                  title="Progresso Geral das Aulas"
                  aria-label="Ver Progresso das Aulas"
                >
                  <BarChart3 
                    className="w-6 h-6 sm:w-6.5 sm:h-6.5 stroke-[2.4]" 
                    style={{ color: currTheme.accent || '#fca5a5' }}
                  />
                  {porcentagemGeral > 0 && (
                    <span 
                      className="absolute -bottom-1 -right-1 text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full text-white border shadow"
                      style={{
                        backgroundColor: currTheme.primary || '#ef4444',
                        borderColor: currTheme.accent || '#fca5a5'
                      }}
                    >
                      {porcentagemGeral}%
                    </span>
                  )}
                </button>
              </div>

              {/* Título Imperial Centralizado com Badge Dinâmica */}
              <div className="text-center mb-1 xs:mb-1.5 px-2">
                <h1 className="inline-flex items-center justify-center gap-2 xs:gap-2.5 flex-wrap">
                  <span 
                    className="px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-xl text-[11px] xs:text-xs sm:text-sm font-mono font-black text-white border shadow-inner tracking-wider"
                    style={{
                      background: 'rgba(25, 10, 15, 0.85)',
                      borderColor: currTheme.primary || '#ef4444',
                      boxShadow: `inset 0 1px 3px rgba(0,0,0,0.8), 0 0 12px ${currTheme.glowSoft || 'rgba(239,68,68,0.3)'}`,
                    }}
                  >
                    {AULAS_CATALOGO.length > 0 ? AULAS_CATALOGO.length.toLocaleString('pt-BR') : '3.003'}
                  </span>
                  <span className="text-xl xs:text-2xl sm:text-3xl font-serif font-black tracking-wide text-[#fff1f2] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                    Aulas em Trilha
                  </span>
                </h1>
                <p className="text-[11px] xs:text-xs sm:text-sm font-serif italic text-zinc-300/85 mt-0.5">
                  Escolha a área do direito para começar sua jornada.
                </p>
              </div>

              {/* ── BARRA DE PESQUISA RÁPIDA DAS ÁREAS (RESPONSIVA, ALTURA CONFORTÁVEL PADRÃO 48-56px) ── */}
              <div className="w-full max-w-[340px] xs:max-w-[420px] sm:max-w-lg md:max-w-xl mx-auto px-2 mt-2 mb-2 z-20">
                <div className="relative w-full">
                  <div 
                    className="absolute left-3.5 xs:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 transition-colors"
                    style={{ color: currTheme.accent || '#fca5a5' }}
                  >
                    <Search className="w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2]" />
                  </div>
                  <input
                    type="text"
                    value={buscaTermo}
                    onChange={(e) => {
                      setBuscaTermo(e.target.value);
                      setActiveDiscIndex(0);
                    }}
                    placeholder="Buscar área ou matéria (ex: Penal)..."
                    className="w-full h-12 xs:h-13 sm:h-14 pl-11 xs:pl-12 sm:pl-13 pr-11 xs:pr-12 sm:pr-13 rounded-full text-xs xs:text-sm sm:text-base text-white placeholder:text-zinc-400/80 focus:outline-none transition-all shadow-inner"
                    style={{
                      background: 'rgba(15, 6, 10, 0.82)',
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${buscaTermo ? (currTheme.primary || '#ef4444') : 'rgba(255,255,255,0.2)'}`,
                      boxShadow: buscaTermo 
                        ? `0 0 16px ${currTheme.glowSoft || 'rgba(239,68,68,0.45)'}, inset 0 2px 4px rgba(0,0,0,0.7)` 
                        : 'inset 0 2px 4px rgba(0,0,0,0.6)',
                    }}
                  />
                  {buscaTermo && (
                    <button
                      type="button"
                      onClick={() => {
                        setBuscaTermo('');
                        setActiveDiscIndex(0);
                      }}
                      className="absolute right-3.5 xs:right-4 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white cursor-pointer z-10 transition-colors"
                      aria-label="Limpar busca"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Visualização de Abas Secundárias (com scroll se necessário) */}
            {abaAtiva === 'progresso' && (
              <div className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto my-2 px-2">
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
                  corDestaque={currTheme.primary || '#ef4444'}
                />
              </div>
            )}

            {abaAtiva === 'favoritos' && (
              <div className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto my-2 px-2">
                <AulasTabFavoritos
                  aulasFavoritas={AULAS_CATALOGO.filter(a => favoritosIds.has(a.id))}
                  onIniciarAula={iniciarAula}
                  onAlternarFavorito={handleAlternarFavorito}
                  corDestaque={currTheme.primary || '#ef4444'}
                  onVoltarParaTrilhas={() => setAbaAtiva('trilhas')}
                />
              </div>
            )}

            {abaAtiva === 'estatisticas' && (
              <div className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto my-2 px-2">
                <AulasTabEstatisticas
                  materias={MATERIAS_CATALOGO}
                  aulas={AULAS_CATALOGO}
                  calcularProgressoCiclo={calcularProgressoCiclo}
                  acertosMap={acertosMap}
                  corDestaque={currTheme.primary || '#ef4444'}
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
              </div>
            )}

            {/* ── ABA TRILHAS: CARROSSEL NO PADRÃO AUDIOBOOKS COM ZOOM NA CAPA CENTRAL ── */}
            {abaAtiva === 'trilhas' && (() => {
              if (totalDisciplinas === 0) {
                return (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                    <p className="text-zinc-400 text-sm">Nenhuma disciplina encontrada para "{buscaTermo}".</p>
                  </div>
                );
              }

              const handlePrev = () => {
                try { haptic.selection(); } catch {}
                playPageTurnSound();
                scrollCarouselToIndex(activeCarouselIndex - 1);
              };

              const handleNext = () => {
                try { haptic.selection(); } catch {}
                playPageTurnSound();
                scrollCarouselToIndex(activeCarouselIndex + 1);
              };

              const handleSelectCurrent = () => {
                try { haptic.impact('medium'); } catch {}
                setDisciplinaSelecionadaId(currDisc.id);
                setMateriaSelecionadaId(null);
                resetScrollToTop();
              };

              const handleCardClick = (disc: DisciplinaItem, idx: number) => {
                if (isDraggingRef.current) return;
                try { haptic.selection(); } catch {}
                if (idx !== activeCarouselIndex) {
                  playPageTurnSound();
                  scrollCarouselToIndex(idx);
                } else {
                  handleSelectCurrent();
                }
              };

              return (
                <div className="w-full flex-1 min-h-0 flex flex-col items-center justify-center select-none px-0">
                  {/* ── CARROSSEL AUDIOBOOKS COVERFLOW COM ZOOM NA CAPA CENTRAL (SEM MARGENS LATERAIS) ── */}
                  <div className="relative w-full mx-auto flex items-center justify-center px-0 my-auto py-1 select-none overflow-hidden">
                    
                    {/* Botão Seta Esquerda (Flutuante com Margem e Sombra) */}
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-1.5 xs:left-2.5 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/80 hover:bg-black text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.95)] z-30 shrink-0 backdrop-blur-md border border-white/20"
                      style={{
                        borderColor: `${currTheme.primary || '#ef4444'}88`,
                        boxShadow: `0 0 16px ${currTheme.glowSoft || 'rgba(0,0,0,0.6)'}`
                      }}
                      aria-label="Área anterior"
                    >
                      <ChevronLeft className="w-5 h-5 xs:w-6 xs:h-6 stroke-[2.4]" />
                    </button>

                    {/* Scroller Horizontal de Capas Snap-x Snap-Mandatory */}
                    <div
                      ref={carouselScrollerRef}
                      onScroll={handleCarouselScroll}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="w-full flex items-center gap-3.5 xs:gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none touch-manipulation px-[calc(50vw-85px)] xs:px-[calc(50vw-100px)] sm:px-[calc(50vw-125px)] md:px-[calc(50vw-145px)]"
                    >
                      {loopedDisciplinas.map((disc, idx) => {
                        const isActive = idx === activeCarouselIndex;
                        const discTheme = getDisciplinaVisualTheme(disc.id);
                        const discAulas = AULAS_CATALOGO.filter(a => a.disciplinaId === disc.id);
                        const capaUrl = discTheme.fundoAssetUrl;

                        return (
                          <div
                            key={`${disc.id}-${idx}`}
                            onClick={() => handleCardClick(disc, idx)}
                            className={cn(
                              "snap-center shrink-0 w-[170px] xs:w-[200px] sm:w-[250px] md:w-[290px] flex flex-col items-center cursor-pointer transition-all duration-400 ease-out",
                              isActive
                                ? "z-20 opacity-100 scale-105 sm:scale-110"
                                : "z-10 opacity-60 hover:opacity-85 scale-[0.84] sm:scale-90"
                            )}
                          >
                            {/* Card em Proporção 3:4 com Zoom na Capa Central */}
                            <div
                              className={cn(
                                "relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border transform-gpu transition-all duration-400 ease-out flex flex-col justify-end p-3 xs:p-3.5 sm:p-4 text-center",
                                isActive
                                  ? "border-2 shadow-2xl ring-2 ring-white/20"
                                  : "border-white/20 shadow-lg hover:border-white/40"
                              )}
                              style={
                                isActive ? {
                                  borderColor: discTheme.primary || '#ef4444',
                                  boxShadow: `0 0 36px ${discTheme.glow || 'rgba(239, 68, 68, 0.85)'}, 0 25px 50px -5px rgba(0,0,0,0.95), inset 0 1.5px 0.5px rgba(255,255,255,0.75)`,
                                } : {
                                  borderColor: 'rgba(255, 255, 255, 0.25)',
                                  boxShadow: '0 15px 35px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.2)',
                                }
                              }
                            >
                              {/* Efeito de Pulso Suave no Card Central Ativo (Padrão Audiobooks) */}
                              {isActive && (
                                <div 
                                  className="absolute -inset-1 rounded-2xl blur-md pointer-events-none animate-pulse"
                                  style={{
                                    background: `linear-gradient(to right, ${discTheme.primary}40, ${discTheme.accent}30, ${discTheme.primary}40)`
                                  }}
                                />
                              )}

                              {/* Imagem da Capa: Com Zoom Extra de 110% quando no Centro */}
                              <img
                                src={capaUrl}
                                alt={disc.nome}
                                loading={idx < 6 ? "eager" : "lazy"}
                                decoding="async"
                                fetchPriority={isActive ? "high" : "auto"}
                                className={cn(
                                  "absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-500 ease-out rounded-2xl",
                                  isActive 
                                    ? "scale-110 filter brightness-125 contrast-110 saturate-115" 
                                    : "scale-100 filter brightness-110 contrast-105 saturate-105"
                                )}
                              />

                              {/* Gradiente Apenas na Base para Proteger o Texto */}
                              <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none rounded-b-2xl z-10" />

                              {/* Título sem abreviações e Badge Pill de Aulas */}
                              <div className="relative z-20 w-full flex flex-col items-center">
                                <h3 
                                  className={cn(
                                    "font-serif font-black text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,1)] text-center break-words text-balance px-1 transition-all",
                                    isActive 
                                      ? "text-xs xs:text-sm sm:text-base md:text-lg" 
                                      : "text-[11px] xs:text-xs sm:text-sm text-zinc-200"
                                  )}
                                >
                                  {disc.nome}
                                </h3>

                                {/* Badge Pill com Contagem de Aulas */}
                                <div 
                                  className={cn(
                                    "mt-1.5 xs:mt-2 inline-flex items-center justify-center font-mono font-black tracking-wider uppercase shadow-lg border rounded-full transition-all",
                                    isActive
                                      ? "px-3.5 py-0.5 xs:px-4 xs:py-1 text-[11px] xs:text-xs sm:text-sm"
                                      : "px-2.5 py-0.5 text-[9.5px] xs:text-[10px] sm:text-[11px] opacity-90"
                                  )}
                                  style={{
                                    backgroundColor: 'rgba(10, 5, 8, 0.85)',
                                    borderColor: isActive ? discTheme.primary : 'rgba(255,255,255,0.25)',
                                    color: isActive ? discTheme.accent : '#f4f4f5',
                                    boxShadow: isActive ? `0 2px 14px ${discTheme.glowSoft}` : undefined
                                  }}
                                >
                                  <span>{discAulas.length} AULAS</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Botão Seta Direita (Flutuante com Margem e Sombra) */}
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-1.5 xs:right-2.5 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center bg-black/80 hover:bg-black text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-[0_4px_24px_rgba(0,0,0,0.95)] z-30 shrink-0 backdrop-blur-md border border-white/20"
                      style={{
                        borderColor: `${currTheme.primary || '#ef4444'}88`,
                        boxShadow: `0 0 16px ${currTheme.glowSoft || 'rgba(0,0,0,0.6)'}`
                      }}
                      aria-label="Próxima área"
                    >
                      <ChevronRight className="w-5 h-5 xs:w-6 xs:h-6 stroke-[2.4]" />
                    </button>
                  </div>

                  {/* ── 4 PONTOS INDICADORES DO CARROSSEL (DINAMIZADOS PELA COR DA CAPA) ── */}
                  <div className="flex items-center justify-center gap-1.5 my-2 xs:my-2.5 z-20 shrink-0">
                    {[0, 1, 2, 3].map((dotIdx) => {
                      const isDotActive = dotIdx === (safeIdx % 4);
                      return (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => {
                            try { haptic.selection(); } catch {}
                            const currentBlock = Math.floor(activeCarouselIndex / (disciplinasFiltradas.length || 1));
                            const targetIdx = currentBlock * (disciplinasFiltradas.length || 1) + dotIdx;
                            scrollCarouselToIndex(targetIdx);
                          }}
                          className={cn(
                            "transition-all duration-300 rounded-full cursor-pointer",
                            isDotActive 
                              ? "w-6 h-2 shadow-[0_0_10px]" 
                              : "w-2 h-2 bg-white/20 hover:bg-white/40"
                          )}
                          style={{
                            backgroundColor: isDotActive ? (currTheme.primary || '#ef4444') : undefined,
                            boxShadow: isDotActive ? `0 0 10px ${currTheme.primary || '#ef4444'}` : undefined,
                          }}
                          aria-label={`Ir para área ${dotIdx + 1}`}
                        />
                      );
                    })}
                  </div>

                  {/* ── BOTÃO PRINCIPAL DE AÇÃO: SELECIONAR ÁREA → (DINAMIZADO COM GRADIENTE DA CAPA) ── */}
                  <div className="w-full max-w-[310px] xs:max-w-[340px] mx-auto px-2 mb-1 xs:mb-1.5 z-20 shrink-0">
                    <button
                      type="button"
                      onClick={handleSelectCurrent}
                      className="w-full h-12 xs:h-13 rounded-full flex items-center justify-center gap-2 font-serif font-black text-sm xs:text-base text-white shadow-2xl active:scale-95 hover:brightness-110 transition-all cursor-pointer border"
                      style={{
                        background: `linear-gradient(135deg, ${currTheme.accent || '#ef4444'} 0%, ${currTheme.primary || '#dc2626'} 50%, #150508 100%)`,
                        borderColor: `${currTheme.primary || '#ef4444'}90`,
                        boxShadow: `0 8px 25px ${currTheme.glow || 'rgba(220,38,38,0.5)'}, inset 0 1px 2px rgba(255,255,255,0.4)`
                      }}
                    >
                      <span className="tracking-wide">Selecionar Área</span>
                      <span className="font-sans text-base">→</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════════
          NÍVEL 2: MATÉRIAS DA DISCIPLINA SELECIONADA
         ══════════════════════════════════════════════════════════════════════════ */}
      {disciplinaSelecionadaId && disciplinaAtual && (() => {
        const aulasDaDisc = AULAS_CATALOGO.filter(a => a.disciplinaId === disciplinaAtual.id);
        const totalAulasDisc = aulasDaDisc.length;
        const somaPct = aulasDaDisc.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
        const pctDisc = totalAulasDisc > 0 ? Math.round(somaPct / totalAulasDisc) : 0;
        const ciclosDiscCompletos = aulasDaDisc.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;
        const materiasDaDisc = MATERIAS_CATALOGO.filter(m => m.disciplinaId === disciplinaAtual.id);
        const materiasFiltradas = materiasDaDisc.filter(mat => {
          if (!termoBuscaNorm) return true;
          const matchNome = (mat.titulo || '').toLowerCase().includes(termoBuscaNorm);
          const matchAula = AULAS_CATALOGO.some(a => a.materiaId === mat.id && a.titulo.toLowerCase().includes(termoBuscaNorm));
          return matchNome || matchAula;
        });

        const theme = getDisciplinaVisualTheme(disciplinaAtual.id);
        const AreaIconComponent = areaIconFor(disciplinaAtual.id).Icon;
        const fundoAreaOficial = theme.isCustomFundo 
          ? theme.fundoAssetUrl 
          : (assetUrl(disciplinaAtual.capaHeroUrl) || greciaFilosofosFundo);

        return (
          <>
            {/* Fundo Oficial Fixo da Área com Nitidez Máxima e Escurecimento Suave */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#0a0705]">
              <img
                src={fundoAreaOficial}
                alt={disciplinaAtual.nome}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="w-full h-full object-cover object-top select-none pointer-events-none filter blur-[0.5px] brightness-[0.98] contrast-[1.02] transition-opacity duration-500"
              />
              {/* Escurecimento suave */}
              <div className="absolute inset-0 bg-black/40 pointer-events-none" />
            </div>

            {/* Pétalas e Flores de Lótus Douradas Caindo Suavemente pela Montanha (120fps GPU) */}
            <FallingLotusPetals />

            {/* Top Bar Fixa de Navegação da Disciplina */}
            <div 
              className="sticky top-0 z-30 w-full backdrop-blur-xl bg-[#0D0D0D]/90 border-b border-white/10 px-3.5 sm:px-6 py-2.5 transition-all shadow-xl"
              style={{
                paddingTop: 'calc(0.75rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
              }}
            >
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleVoltar}
                  className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-95 transition shadow-lg shrink-0 cursor-pointer"
                  aria-label="Voltar para áreas"
                >
                  <ArrowLeft className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.4} />
                </button>

                {/* Título Centralizado com Barra de Progresso */}
                <div className="flex-1 min-w-0 max-w-md mx-auto flex flex-col items-center justify-center text-center px-2">
                  <div className="flex items-center gap-1.5 max-w-full truncate">
                    <span 
                      className="w-1.5 h-1.5 rounded-full shrink-0" 
                      style={{ backgroundColor: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }}
                    />
                    <span 
                      className="text-xs sm:text-sm font-serif font-black uppercase tracking-wider truncate text-white"
                      style={{ color: theme.highlight }}
                    >
                      {disciplinaAtual.nome}
                    </span>
                  </div>
                  <div className="w-full max-w-[200px] sm:max-w-[240px] flex items-center gap-2 mt-1">
                    <div 
                      className="flex-1 h-1.5 rounded-full bg-black/60 overflow-hidden"
                      style={{ border: `1px solid ${theme.borderSubtle}` }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out"
                        style={{
                          width: `${Math.max(pctDisc, totalAulasDisc > 0 ? 4 : 0)}%`,
                          background: theme.progressGradient,
                          boxShadow: theme.progressShadow,
                        }}
                      />
                    </div>
                    <span 
                      className="text-[10px] sm:text-[10.5px] font-mono font-bold tabular-nums shrink-0"
                      style={{ color: theme.accent }}
                    >
                      {pctDisc}%
                    </span>
                  </div>
                </div>

                {/* Botão de Atalho para o Início do Aplicativo (Home) */}
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full bg-white/5 hover:bg-white/10 border border-white/15 flex items-center justify-center text-white active:scale-95 transition shadow-lg shrink-0 cursor-pointer"
                  aria-label="Voltar para o Início do aplicativo"
                  title="Início do aplicativo"
                >
                  <Home className="w-5.5 h-5.5 sm:w-6 sm:h-6" strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* Conteúdo da Trilha Serpenteante (Idêntico ao Flashcards) */}
            <div className="relative z-10 w-full max-w-[700px] mx-auto px-3.5 sm:px-6 pb-[calc(8.5rem+env(safe-area-inset-bottom,0px))] pt-2 min-w-0 overflow-x-hidden box-border">
              {/* Barra de Pesquisa Rápida das Matérias da Área (Responsiva e Altura Confortável) */}
              <div className="w-full max-w-[360px] xs:max-w-[460px] sm:max-w-xl mx-auto px-2 my-2.5 z-20">
                <div className="relative w-full">
                  <div 
                    className="absolute left-3.5 xs:left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10 transition-colors"
                    style={{ color: theme.accent }}
                  >
                    <Search className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
                  </div>
                  <input
                    type="text"
                    value={buscaTermo}
                    onChange={(e) => setBuscaTermo(e.target.value)}
                    placeholder={`Buscar matéria em ${disciplinaAtual.nome}...`}
                    className="w-full h-12 xs:h-12.5 sm:h-13.5 pl-11 xs:pl-12 pr-11 xs:pr-12 rounded-full text-xs xs:text-sm sm:text-base text-white placeholder:text-zinc-400/75 focus:outline-none transition-all shadow-inner"
                    style={{
                      background: 'rgba(15, 6, 10, 0.85)',
                      backdropFilter: 'blur(16px)',
                      border: `1px solid ${buscaTermo ? theme.accent : theme.borderSubtle}`,
                      boxShadow: buscaTermo 
                        ? `0 0 16px ${theme.glowSoft}, inset 0 2px 4px rgba(0,0,0,0.7)` 
                        : 'inset 0 2px 4px rgba(0,0,0,0.6)',
                    }}
                  />
                  {buscaTermo && (
                    <button
                      type="button"
                      onClick={() => setBuscaTermo('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-white cursor-pointer z-10 transition-colors"
                      aria-label="Limpar busca"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Trilha Serpenteante Oficial de Matérias */}
              <div className="relative py-2 sm:py-4 w-full min-w-0 max-w-full overflow-hidden">
                <div className="w-full min-w-0 relative z-[2] flex flex-col items-center">
                  {/* ── CUME DA TRILHA: O TEMPLO DA ACRÓPOLE ── */}
                  <div className="w-full flex flex-col items-center justify-center pt-2 pb-4">
                    <div className="relative flex flex-col items-center">
                      {/* Halo solar suave atrás do Parthenon */}
                      <div 
                        className="absolute -top-4 w-40 h-28 rounded-full pointer-events-none"
                        style={{
                          background: `radial-gradient(ellipse at center, ${theme.glow} 0%, ${theme.glowSoft} 60%, transparent 100%)`,
                          filter: 'blur(16px)',
                        }}
                      />

                      {/* Ícone Monumental Oficial da Disciplina */}
                      <div 
                        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border flex items-center justify-center shadow-2xl mb-2"
                        style={{
                          background: theme.bgCard,
                          borderColor: theme.border,
                          boxShadow: `0 0 24px ${theme.glowSoft}, inset 0 2px 4px rgba(255, 255, 255, 0.15)`,
                        }}
                      >
                        <AreaIconComponent 
                          className="w-9 h-9 sm:w-11 sm:h-11 drop-shadow-md" 
                          style={{ color: theme.accent, filter: `drop-shadow(0 2px 8px ${theme.glow})` }}
                        />
                      </div>

                      {/* Placa com o Nome da Disciplina */}
                      <div 
                        className="px-4 py-1.5 rounded-full border flex items-center gap-2 backdrop-blur-md"
                        style={{
                          background: theme.bgCard,
                          borderColor: theme.border,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.1)',
                        }}
                      >
                        <span 
                          className="w-1.5 h-1.5 rounded-full" 
                          style={{ backgroundColor: theme.accent, boxShadow: `0 0 6px ${theme.accent}` }}
                        />
                        <span 
                          className="text-[11px] sm:text-xs font-serif font-black tracking-widest uppercase"
                          style={{ color: theme.highlight }}
                        >
                          {disciplinaAtual.nome}
                        </span>
                      </div>

                      {/* Descrição Elegante com Setas: Matérias → Aulas → Progresso */}
                      <div 
                        className="flex items-center gap-1.5 text-[10.5px] sm:text-[11.5px] font-serif font-semibold mt-2 px-3 py-1 rounded-full border backdrop-blur-md"
                        style={{
                          background: theme.bgCard,
                          borderColor: theme.borderSubtle,
                          boxShadow: '0 8px 24px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.08)',
                          color: theme.highlight,
                        }}
                      >
                        <span>{materiasDaDisc.length} matérias</span>
                        <span className="font-bold" style={{ color: theme.accent }}>→</span>
                        <span>{totalAulasDisc} aulas</span>
                        <span className="font-bold" style={{ color: theme.accent }}>→</span>
                        <span className="font-mono font-bold" style={{ color: theme.accent }}>{pctDisc}% concluído</span>
                      </div>

                      {/* Início da Estrada saindo do templo */}
                      <div 
                        className="w-1.5 h-6 my-2 rounded-full"
                        style={{
                          background: theme.roadGradient,
                          boxShadow: theme.roadShadow,
                        }}
                      />
                    </div>
                  </div>

                  {/* Nós Serpenteantes: Cada Nó é uma Matéria Oficial com FlashcardDeckItem */}
                  {materiasFiltradas.map((mat, matIdx) => {
                    const isLast = matIdx === materiasFiltradas.length - 1;
                    const aulasDaMat = AULAS_CATALOGO.filter(a => a.materiaId === mat.id);
                    const totalAulasMat = aulasDaMat.length;
                    const somaPctMat = aulasDaMat.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
                    const pctMat = totalAulasMat > 0 ? Math.round(somaPctMat / totalAulasMat) : 0;
                    const concluidasMat = aulasDaMat.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;
                    const isActive = matIdx === 0;
                    const isLocked = false;
                    const tituloCurto = formatarTituloMateriaCurto(mat.titulo);

                    const itemData = {
                      key: mat.id,
                      titulo: tituloCurto,
                      badgeLabel: `Matéria ${String(matIdx + 1).padStart(2, '0')}`,
                      ordemStr: String(matIdx + 1).padStart(2, '0'),
                      displayTotal: totalAulasMat,
                      temasCount: totalAulasMat,
                      displayConcluidas: concluidasMat,
                      displayPct: pctMat,
                      subtituloCustom: `${totalAulasMat} ${totalAulasMat === 1 ? 'aula' : 'aulas'}${pctMat > 0 ? ` • ${pctMat}% concluído` : ''}`,
                      isLocked,
                      onClick: () => {
                        try { haptic.selection(); } catch {}
                        setMateriaSelecionadaId(mat.id);
                        setAulaSheetDetalhe(null);
                        setBuscaTermoAulas('');
                        resetScrollToTop();
                      },
                    };

                    return (
                      <div
                        key={mat.id}
                        id={`materia-section-${mat.id}`}
                        className="w-full flex flex-col items-center"
                      >
                        <FlashcardDeckItem
                          item={itemData}
                          i={matIdx}
                          isLast={isLast}
                          isActive={isActive}
                          theme={theme}
                        />
                      </div>
                    );
                  })}

                  {materiasFiltradas.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                      <Search className="w-9 h-9 text-zinc-500 stroke-[1.5]" />
                      <p className="text-zinc-300 text-sm">
                        Nenhuma matéria encontrada para "<span className="text-white font-semibold">{buscaTermo}</span>"
                      </p>
                      <button
                        type="button"
                        onClick={() => setBuscaTermo('')}
                        className="text-xs font-semibold underline cursor-pointer"
                        style={{ color: theme.accent }}
                      >
                        Limpar pesquisa
                      </button>
                    </div>
                  )}

                  {/* Louros da Vitória Clássicos no Rodapé da Trilha */}
                  <div className="w-full flex items-center justify-between px-6 pt-8 pb-4" style={{ color: theme.borderSubtle }}>
                    <svg className="w-9 h-9 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
                      <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
                      <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
                    </svg>
                    <span 
                      className="text-[10px] font-serif font-semibold tracking-widest uppercase text-center"
                      style={{ color: theme.accent, opacity: 0.85 }}
                    >
                      Trilha do Saber • {disciplinaAtual.nome}
                    </span>
                    <svg className="w-9 h-9 rotate-12 scale-x-[-1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 21c-4.97 0-9-4.03-9-9 0-4.97 4.03-9 9-9" />
                      <path d="M7 6c1 1 2 2 2 4s-1 3-2 4" />
                      <path d="M4 11c1 1 2 2 2 4s-1 3-2 4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════════════
          NÍVEL 3 & 4: SHEETS DESLIZANTES DE BAIXO PARA CIMA
          1. Sheet de Lista de Aulas da Matéria (sem painel em cima, lista 1, 2, 3...)
          2. Sheet de Detalhe da Aula (capa em layout total, Iniciar + Revisar/Praticar)
         ══════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {disciplinaSelecionadaId && materiaSelecionadaId && materiaAtual && disciplinaAtual && (() => {
          const totalAulasMat = aulasDaMateria.length;
          const somaPctMat = aulasDaMateria.reduce((acc, a) => acc + calcularProgressoCiclo(a).porcentagemTotal, 0);
          const pctMat = totalAulasMat > 0 ? Math.round(somaPctMat / totalAulasMat) : 0;
          const ciclosCompletosMat = aulasDaMateria.filter(a => calcularProgressoCiclo(a).cicloCompleto).length;
          const matsDaDisc = MATERIAS_CATALOGO.filter(m => m.disciplinaId === disciplinaAtual.id);
          const numMateria = matsDaDisc.findIndex(m => m.id === materiaAtual.id) + 1;
          const termoFiltroAulas = buscaTermoAulas.toLowerCase().trim();
          const aulasFiltradas = aulasDaMateria.filter(aula => {
            if (!termoFiltroAulas) return true;
            const desc = ((aula as any).descricaoBreve || aula.descricao || '').toLowerCase();
            return aula.titulo.toLowerCase().includes(termoFiltroAulas) || desc.includes(termoFiltroAulas);
          });

          return (
            <React.Fragment key={`sheet-materia-${materiaAtual.id}`}>
              {/* Backdrop Escuro com Blur da Gaveta de Matérias */}
              <motion.div
                key="backdrop-sheet-materia"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => {
                  setAulaSheetDetalhe(null);
                  setMateriaSelecionadaId(null);
                  setBuscaTermoAulas('');
                }}
                className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md"
                style={{ touchAction: 'none' }}
              />

              {/* SHEET 1: LISTA DE AULAS DA MATÉRIA (DESLIZA DE BAIXO PARA CIMA ATÉ O TETO) */}
              <motion.div
                key="sheet-materia-aulas"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-50 h-[95dvh] sm:h-[94dvh] max-h-[calc(100dvh-var(--sai-top,env(safe-area-inset-top,0px))-8px)] max-w-4xl mx-auto rounded-t-[28px] sm:rounded-t-[32px] border-t border-x flex flex-col shadow-[0_-24px_70px_rgba(0,0,0,0.95)] overflow-hidden"
                style={{
                  background: `linear-gradient(180deg, ${disciplinaAtual.corFundoCard || '#181920'} 0%, #0d0e12 100%)`,
                  borderColor: `${disciplinaAtual.corDestaque}35`,
                  paddingBottom: 'calc(2.5rem + var(--sai-bottom, env(safe-area-inset-bottom, 24px)))'
                }}
              >
                {/* Drag Handle Topo */}
                <div 
                  className="pt-2 pb-1 flex justify-center shrink-0"
                  style={{
                    paddingTop: 'calc(0.5rem + var(--sai-top, env(safe-area-inset-top, 0px)))'
                  }}
                >
                  <div className="w-12 h-1.5 rounded-full bg-white/20" />
                </div>

                {/* Cabeçalho Limpo e Elegante com Mesma Tonalidade do Painel */}
                <div className="px-4 sm:px-6 pt-1 pb-3 border-b border-white/10 shrink-0 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Sem fundo atrás: apenas texto limpo na cor da disciplina */}
                      <span 
                        className="text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                        style={{ color: disciplinaAtual.corDestaque }}
                      >
                        {disciplinaAtual.nome} · MATÉRIA {numMateria > 0 ? numMateria : 1}
                      </span>
                      <span className="text-zinc-500 text-xs">·</span>
                      <span className="text-[11px] sm:text-xs text-zinc-400 font-medium">
                        {totalAulasMat} {totalAulasMat === 1 ? 'aula' : 'aulas'}
                      </span>
                      {ciclosCompletosMat > 0 && (
                        <>
                          <span className="text-zinc-500 text-xs">·</span>
                          <span className="text-[11px] sm:text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            {ciclosCompletosMat} concluída{ciclosCompletosMat > 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                    </div>
                    {/* TÍTULO DA MATÉRIA: FONTE SANS MODERNA E CLARA */}
                    <h3 className="font-sans font-extrabold text-xl sm:text-2xl text-white leading-tight break-words">
                      {materiaAtual.titulo}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1">
                      <span className="text-[11px] font-bold" style={{ color: pctMat === 100 ? '#10b981' : disciplinaAtual.corDestaque }}>
                        {pctMat}%
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAulaSheetDetalhe(null);
                        setMateriaSelecionadaId(null);
                        setBuscaTermoAulas('');
                      }}
                      className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 border border-white/20 flex items-center justify-center text-zinc-100 hover:text-white transition shadow-lg shrink-0 touch-manipulation cursor-pointer"
                      aria-label="Fechar lista de aulas"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
                    </button>
                  </div>
                </div>

                {/* Campo de Busca Rápida Opcional */}
                {totalAulasMat > 4 && (
                  <div className="px-4 sm:px-6 pt-3 shrink-0">
                    <div className="relative flex items-center w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 transition-all">
                      <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0 mr-2" />
                      <input
                        type="text"
                        value={buscaTermoAulas}
                        onChange={(e) => setBuscaTermoAulas(e.target.value)}
                        placeholder={`Filtrar nas ${totalAulasMat} aulas...`}
                        className="bg-transparent text-xs text-white placeholder-zinc-500 outline-none w-full font-medium"
                      />
                      {buscaTermoAulas && (
                        <button
                          type="button"
                          onClick={() => setBuscaTermoAulas('')}
                          className="p-0.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* LISTA VERTICAL DE AULAS TIPO 1, 2, 3... COM CAPA DO LADO E STATUS DE CONCLUSÃO */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pt-3 pb-32 sm:pb-28 space-y-2.5 overscroll-contain">
                  {aulasFiltradas.map((aula, idx) => {
                    const prog = calcularProgressoCiclo(aula);
                    const numeroExibicao = idx + 1;

                    return (
                      <div
                        key={aula.id}
                        onClick={() => setAulaSheetDetalhe(aula)}
                        className={cn(
                          "w-full rounded-2xl p-2.5 sm:p-3 border transition-all duration-200 cursor-pointer select-none group",
                          "bg-white/[0.03] hover:bg-white/[0.07] border-white/10 hover:border-white/25 active:scale-[0.99]",
                          "flex items-center gap-3 sm:gap-4 shadow-md"
                        )}
                      >
                        {/* 1. Capa ao lado (proporção 3:4 destacada, limpa e sem textos em cima) */}
                        <div className="relative shrink-0 w-22 sm:w-26 h-26 sm:h-32 rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 bg-black/70 shadow-md group-hover:border-white/35 transition-all">
                          <img
                            src={assetUrl(aula.capaUrl) || assetUrl(disciplinaAtual.capaHeroUrl)}
                            alt={aula.titulo}
                            loading={idx < 8 ? "eager" : "lazy"}
                            decoding="async"
                            onError={(e) => {
                              e.currentTarget.src = assetUrl(disciplinaAtual.capaHeroUrl);
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                        </div>

                        {/* 2. Informações: Aula 1, 2, 3... Título claro + Status sem fundos pesados */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            {/* Linha 1: AULA 01 e Status (AMBOS SEM FUNDOS ATRÁS) */}
                            <div className="flex items-center justify-between gap-2 mb-1">
                              {/* Sem fundo cinza: apenas texto limpo e legível */}
                              <span 
                                className="text-[11px] sm:text-xs font-mono font-black tracking-wider uppercase"
                                style={{ color: disciplinaAtual.corDestaque }}
                              >
                                AULA {numeroExibicao < 10 ? `0${numeroExibicao}` : numeroExibicao}
                              </span>

                              {/* Indicador de Status: Sem fundo amarelo, texto limpo */}
                              {prog.cicloCompleto ? (
                                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>100% Concluída</span>
                                </span>
                              ) : prog.porcentagemTotal > 0 ? (
                                <span className="text-[11px] sm:text-xs font-bold text-amber-400">
                                  {prog.porcentagemTotal}% Em andamento
                                </span>
                              ) : (
                                <span className="text-[11px] sm:text-xs font-medium text-zinc-400">
                                  Não iniciada
                                </span>
                              )}
                            </div>

                            {/* TÍTULO DA AULA: FONTE SANS FÁCIL DE ENTENDER (SEM RETICÊNCIAS) */}
                            <h4 className="font-sans font-bold text-sm sm:text-base text-white group-hover:text-amber-200 transition-colors leading-snug break-words mt-0.5">
                              {aula.titulo}
                            </h4>

                            {/* Barra de progresso sutil */}
                            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/10 mt-2">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  prog.cicloCompleto ? "bg-emerald-500" : "bg-gradient-to-r from-red-500 to-amber-500"
                                )}
                                style={{
                                  width: `${Math.max(prog.porcentagemTotal, prog.cicloCompleto ? 100 : 0)}%`,
                                  backgroundColor: prog.cicloCompleto ? '#10b981' : disciplinaAtual.corDestaque
                                }}
                              />
                            </div>
                          </div>

                          {/* Rodapé do Item: Fases do ciclo e indicador de toque */}
                          <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-white/5 text-[10px] text-zinc-400">
                            <span className="flex items-center gap-1 text-zinc-400">
                              <span>{prog.fasesConcluidasCount} de 3 fases concluídas</span>
                            </span>

                            <span className="flex items-center gap-1 text-xs font-semibold group-hover:translate-x-0.5 transition-transform" style={{ color: disciplinaAtual.corDestaque }}>
                              <span>Ver aula</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {aulasFiltradas.length === 0 && (
                    <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-zinc-600" />
                      <p className="text-zinc-400 text-xs">Nenhuma aula encontrada para "{buscaTermoAulas}"</p>
                      <button
                        type="button"
                        onClick={() => setBuscaTermoAulas('')}
                        className="text-xs font-semibold underline text-amber-400"
                      >
                        Limpar pesquisa
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </React.Fragment>
          );
        })()}

        {/* SHEET 2: DETALHE DA AULA (DESLIZA TAMBÉM DE BAIXO PARA CIMA SOBRE A LISTA) */}
        {aulaSheetDetalhe && disciplinaAtual && (() => {
          const aula = aulaSheetDetalhe;
          const prog = calcularProgressoCiclo(aula);
          const flashcardsLiberados = prog.aulaTerminada || modoLivreTeste;
          const questoesLiberadas = (prog.aulaTerminada && prog.fcOk) || modoLivreTeste;
          const conteudo = CONTEUDO_AULAS[aula.id];
          const totalCards = conteudo?.flashcards.length || 18;
          const totalQuestoes = conteudo?.questoes.length || 12;
          const descFormatada = formatDescricaoExata(aula.descricao, aula.titulo);

          return (
            <React.Fragment key={`sheet-detalhe-aula-${aula.id}`}>
              {/* Backdrop do Detalhe da Aula */}
              <motion.div
                key="backdrop-sheet-aula-detalhe"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={() => setAulaSheetDetalhe(null)}
                className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                style={{ touchAction: 'none' }}
              />

              {/* Gaveta de Detalhe da Aula com Capa Aproveitando Todo o Layout (Até o Teto) */}
              <motion.div
                key="sheet-aula-detalhe"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-x-0 bottom-0 z-[70] h-[95dvh] sm:h-[94dvh] max-h-[calc(100dvh-var(--sai-top,env(safe-area-inset-top,0px))-8px)] max-w-4xl mx-auto rounded-t-[28px] sm:rounded-t-[32px] border-t border-x flex flex-col shadow-[0_-28px_80px_rgba(0,0,0,0.98)] overflow-hidden"
                style={{
                  background: `linear-gradient(180deg, ${disciplinaAtual.corFundoCard || '#181920'} 0%, #0d0e12 100%)`,
                  borderColor: `${disciplinaAtual.corDestaque}35`,
                  paddingBottom: 'calc(2.5rem + var(--sai-bottom, env(safe-area-inset-bottom, 24px)))'
                }}
              >
                {/* Top Bar: Botão de FECHAR responsivo e espaçado da status/navigation bar */}
                <div 
                  className="px-4 sm:px-6 shrink-0 flex items-center justify-between border-b border-white/10 bg-transparent transition-all"
                  style={{
                    paddingTop: 'calc(0.75rem + var(--sai-top, env(safe-area-inset-top, 0px)))',
                    paddingBottom: '0.65rem'
                  }}
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 opacity-0 pointer-events-none shrink-0" />
                  <div className="w-12 h-1.5 rounded-full bg-white/20 -mr-2 shrink-0" />
                  <button
                    type="button"
                    onClick={() => setAulaSheetDetalhe(null)}
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-zinc-100 hover:text-white transition active:scale-90 shadow-md shadow-black/40 touch-manipulation shrink-0 cursor-pointer"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.4} />
                  </button>
                </div>

                {/* Conteúdo com Scroll: Capa à Esquerda com Bola Gigante de Porcentagem + Lado Direito com Título e Descrição */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pt-3 pb-32 sm:pb-28 space-y-4 sm:space-y-5 overscroll-contain">
                  {/* LAYOUT DIVIDIDO: LADO ESQUERDO (CAPA COM BOLA GIGANTE) VS LADO DIREITO (TÍTULO E DESCRIÇÃO) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4 sm:gap-6">
                    {/* LADO ESQUERDO: CAPA COM BOLA GIGANTE NO MEIO MOSTRANDO A PORCENTAGEM */}
                    <div className="relative shrink-0 w-36 xs:w-40 sm:w-48 md:w-52 h-48 xs:h-52 sm:h-64 md:h-68 rounded-2xl overflow-hidden border border-white/15 bg-black shadow-2xl self-center sm:self-auto group">
                      <img
                        src={assetUrl(aula.capaUrl) || assetUrl(disciplinaAtual.capaHeroUrl)}
                        alt={aula.titulo}
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.src = assetUrl(disciplinaAtual.capaHeroUrl);
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/45 pointer-events-none" />

                      {/* BOLA GIGANTE NO MEIO MOSTRANDO A PORCENTAGEM CONCLUÍDA */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div 
                          className={cn(
                            "w-20 h-20 sm:w-24 sm:h-24 rounded-full backdrop-blur-md border-2 shadow-[0_0_28px_rgba(0,0,0,0.85)] flex flex-col items-center justify-center transition-all",
                            prog.cicloCompleto 
                              ? "bg-emerald-950/85 border-emerald-400"
                              : prog.porcentagemTotal > 0
                                ? "bg-black/85 border-amber-400"
                                : "bg-black/80 border-white/30"
                          )}
                          style={{
                            borderColor: prog.cicloCompleto ? '#34d399' : prog.porcentagemTotal > 0 ? disciplinaAtual.corDestaque : 'rgba(255,255,255,0.35)',
                            boxShadow: `0 0 24px ${prog.cicloCompleto ? '#10b98160' : prog.porcentagemTotal > 0 ? disciplinaAtual.corDestaque + '50' : 'rgba(0,0,0,0.6)'}`
                          }}
                        >
                          {prog.cicloCompleto ? (
                            <>
                              <Check className="w-6 h-6 text-emerald-300 stroke-[3] mb-0.5" />
                              <span className="text-xs font-black text-emerald-200 uppercase tracking-tight">100%</span>
                            </>
                          ) : (
                            <>
                              <span 
                                className="text-xl sm:text-2xl font-black font-sans tracking-tight"
                                style={{ color: prog.porcentagemTotal > 0 ? disciplinaAtual.corDestaque : '#e4e4e7' }}
                              >
                                {prog.porcentagemTotal}%
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
                                {prog.porcentagemTotal > 0 ? 'Concluído' : 'Início'}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* LADO DIREITO: TÍTULO EM CIMA E DESCRIÇÃO DIVIDINDO O LAYOUT */}
                    <div className="flex-1 min-w-0 flex flex-col justify-start py-0.5 text-left">
                      <span 
                        className="text-[11px] sm:text-xs font-bold uppercase tracking-wider"
                        style={{ color: disciplinaAtual.corDestaque }}
                      >
                        AULA {aula.numeroAula} · {disciplinaAtual.nome.toUpperCase()}
                      </span>

                      {/* TÍTULO DA AULA: FONTE SANS CLARA E NÍTIDA */}
                      <h2 className="font-sans font-extrabold text-xl sm:text-2xl md:text-3xl text-white leading-tight break-words mt-1">
                        {aula.titulo}
                      </h2>

                      {/* DESCRIÇÃO RICA DIVIDINDO O LADO DIREITO */}
                      {descFormatada && (
                        <p className="text-xs sm:text-sm text-zinc-300/85 leading-relaxed break-words mt-2.5">
                          {descFormatada}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* OS BOTÕES EM ETAPAS (1. INICIAR -> 2. REVISAR -> 3. PRATICAR) PARA GUIAR A PESSOA */}
                  <div className="space-y-2.5 pt-3">
                    {/* ETAPA 1: INICIAR (ou REASSISTIR) */}
                    <button
                      type="button"
                      onClick={() => iniciarAula(aula)}
                      className={cn(
                        "w-full h-13 sm:h-14 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-between px-5 active:scale-[0.98] shadow-xl",
                        prog.aulaTerminada
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 shadow-emerald-950/40"
                          : "bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border border-red-400/50 shadow-red-950/50"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {prog.aulaTerminada ? (
                          <Check className="w-5 h-5 text-white stroke-[3]" />
                        ) : (
                          <Play className="w-5 h-5 fill-white" />
                        )}
                        <span>1. {prog.aulaTerminada ? 'REASSISTIR' : 'INICIAR'}</span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/25 backdrop-blur-sm border border-white/20">
                        {prog.aulaTerminada ? 'Concluído' : 'Etapa 1'}
                      </span>
                    </button>

                    {/* ETAPA 2: REVISAR */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!flashcardsLiberados) {
                          setModalBloqueioAula({ aula, motivo: 'revisar' });
                          return;
                        }
                        abrirRevisarFlashcards(aula);
                      }}
                      className={cn(
                        "w-full h-12 sm:h-13 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-between px-5 active:scale-[0.98] border shadow-md",
                        prog.fcOk
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                          : flashcardsLiberados
                            ? "bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white border-amber-400/50 shadow-amber-950/40"
                            : "bg-white/[0.04] text-zinc-400 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {flashcardsLiberados ? (
                          <Unlock className="w-4.5 h-4.5 text-amber-300 shrink-0" />
                        ) : (
                          <Lock className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                        )}
                        <span>2. REVISAR ({totalCards} Cards)</span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/25 backdrop-blur-sm border border-white/15">
                        {prog.fcOk ? '✓ Revisado' : 'Etapa 2'}
                      </span>
                    </button>

                    {/* ETAPA 3: PRATICAR */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!questoesLiberadas) {
                          setModalBloqueioAula({ aula, motivo: 'praticar' });
                          return;
                        }
                        abrirPraticarQuestoes(aula);
                      }}
                      className={cn(
                        "w-full h-12 sm:h-13 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-between px-5 active:scale-[0.98] border shadow-md",
                        prog.questoesOk
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30"
                          : questoesLiberadas
                            ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border-emerald-400/50 shadow-emerald-950/40"
                            : "bg-white/[0.04] text-zinc-400 border-white/10 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        {questoesLiberadas ? (
                          <Unlock className="w-4.5 h-4.5 text-emerald-300 shrink-0" />
                        ) : (
                          <Lock className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                        )}
                        <span>3. PRATICAR ({totalQuestoes} Questões)</span>
                      </div>
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/25 backdrop-blur-sm border border-white/15">
                        {prog.questoesOk ? '✓ Praticado' : 'Etapa 3'}
                      </span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })()}
      </AnimatePresence>

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
                src={assetUrl(aulaPendenteModal.capaUrl) || assetUrl(disciplinaAtual?.capaHeroUrl)} 
                alt={aulaPendenteModal.titulo}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.src = assetUrl(disciplinaAtual?.capaHeroUrl || 'direito-penal.webp');
                }}
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