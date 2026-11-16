import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  Search,
  X,
  Clock,
  Bookmark,
  BookOpen,
  ArrowUpRight,
  Library,
  Check,
  Compass,
  Trophy,
  Mic,
  Languages,
  GraduationCap,
  Award,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import { directImg, prefetchImages } from '@/lib/cdnImg';
import { supabase } from '@/integrations/supabase/client';
import { withBundleFallback, bundle } from '@/services/offlineBundle';
import { setPersistedColecao, getPersistedColecao } from '@/services/offlineDb';
import { useQueries } from '@tanstack/react-query';
import {
  findColecao,
  normalizeLivro,
  type LivroNormalizado,
} from '@/lib/bibliotecaColecoes';
import { useVisibleColecoes } from '@/hooks/useVisibleColecoes';
import {
  getFavoritos,
  toggleFavorito,
  subscribeTracking,
  type LivroSnapshot,
} from '@/lib/bibliotecaTracking';
import BibliotecaHero from './BibliotecaHero';
import BibliotecaAtalhosBar from './BibliotecaAtalhosBar';
import BibliotecaContinuarLeituraBanner from './BibliotecaContinuarLeituraBanner';

import bibliotecaCoverImg from '@/assets/biblioteca-cover.webp';

// Configuração das Demais Categorias para o Carrossel do Meio
interface CategoriaMeioConfig {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  defaultCount: number;
  corTema: string;
  corSecundaria: string;
  corSombra: string;
  Icon: React.ElementType;
}

const DEMAIS_CATEGORIAS_CARROSSEL: CategoriaMeioConfig[] = [
  {
    id: 'classicos',
    label: 'Clássicos',
    title: 'CLÁSSICOS DO DIREITO',
    subtitle: 'Obras fundamentais do pensamento e da teoria jurídica universal',
    badgeLabel: 'Clássicos',
    defaultCount: 21,
    corTema: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    Icon: Scale,
  },
  {
    id: 'fora-da-toga',
    label: 'Fora da Toga',
    title: 'FORA DA TOGA',
    subtitle: 'Leituras além do Direito para enriquecer sua formação humana',
    badgeLabel: 'Fora da Toga',
    defaultCount: 34,
    corTema: '#10B981',
    corSecundaria: '#6EE7B7',
    corSombra: 'rgba(16, 185, 129, 0.45)',
    Icon: Compass,
  },
  {
    id: 'lideranca',
    label: 'Liderança',
    title: 'LIDERANÇA & GESTÃO',
    subtitle: 'Estratégia, inteligência emocional e autoridade profissional',
    badgeLabel: 'Liderança',
    defaultCount: 18,
    corTema: '#F59E0B',
    corSecundaria: '#FDE68A',
    corSombra: 'rgba(245, 158, 11, 0.45)',
    Icon: Trophy,
  },
  {
    id: 'oratoria',
    label: 'Oratória',
    title: 'ORATÓRIA JURÍDICA',
    subtitle: 'Retórica clássica, sustentação oral e persuasão em juízo',
    badgeLabel: 'Oratória',
    defaultCount: 15,
    corTema: '#EC4899',
    corSecundaria: '#FBCFE8',
    corSombra: 'rgba(236, 72, 153, 0.45)',
    Icon: Mic,
  },
  {
    id: 'portugues',
    label: 'Português Forense',
    title: 'PORTUGUÊS FORENSE',
    subtitle: 'Redação jurídica de alto nível, gramática e clareza forense',
    badgeLabel: 'Português',
    defaultCount: 12,
    corTema: '#3B82F6',
    corSecundaria: '#BFDBFE',
    corSombra: 'rgba(59, 130, 246, 0.45)',
    Icon: Languages,
  },
  {
    id: 'pesquisa',
    label: 'Pesquisa Acadêmica',
    title: 'PESQUISA ACADÊMICA',
    subtitle: 'Normas ABNT, teses, dissertações e artigos científicos',
    badgeLabel: 'Pesquisa',
    defaultCount: 10,
    corTema: '#06B6D4',
    corSecundaria: '#A5F3FC',
    corSombra: 'rgba(6, 182, 212, 0.45)',
    Icon: GraduationCap,
  },
  {
    id: 'oab',
    label: 'Exame OAB',
    title: 'REVISÃO & EXAME OAB',
    subtitle: 'Obras de referência e preparação para o Exame de Ordem',
    badgeLabel: 'OAB',
    defaultCount: 24,
    corTema: '#EF4444',
    corSecundaria: '#FECACA',
    corSombra: 'rgba(239, 68, 68, 0.45)',
    Icon: Award,
  },
];

// Configuração das Abas 3D das Grandes Matérias de Direito (Lista de Baixo)
interface MateriaTabConfig {
  id: string;
  label: string;
  fullName: string;
  corPrimaria: string;
  corSecundaria: string;
  corBadgeNum: string;
  corSombra: string;
  corFundoBotao: string;
  subtitulo: string;
  defaultCount: number;
}

const MATERIAS_DIREITO_TABS: MateriaTabConfig[] = [
  {
    id: 'administrativo',
    label: 'Administrativo',
    fullName: 'Direito Administrativo',
    corPrimaria: '#D97706',
    corSecundaria: '#FBBF24',
    corBadgeNum: '#FDE68A',
    corSombra: 'rgba(217, 119, 6, 0.4)',
    corFundoBotao: '#B45309',
    subtitulo: 'Regime jurídico-administrativo, licitações, contratos e servidores públicos',
    defaultCount: 26,
  },
  {
    id: 'ambiental',
    label: 'Ambiental',
    fullName: 'Direito Ambiental',
    corPrimaria: '#16A34A',
    corSecundaria: '#4ADE80',
    corBadgeNum: '#BBF7D0',
    corSombra: 'rgba(22, 163, 74, 0.4)',
    corFundoBotao: '#15803D',
    subtitulo: 'Princípios ambientais, SISNAMA, licenciamento e tutela ecológica',
    defaultCount: 7,
  },
  {
    id: 'civil',
    label: 'Civil',
    fullName: 'Direito Civil',
    corPrimaria: '#2563EB',
    corSecundaria: '#60A5FA',
    corBadgeNum: '#BFDBFE',
    corSombra: 'rgba(37, 99, 235, 0.4)',
    corFundoBotao: '#1D4ED8',
    subtitulo: 'Parte geral, obrigações, contratos, coisas, família e sucessões',
    defaultCount: 56,
  },
  {
    id: 'constitucional',
    label: 'Constitucional',
    fullName: 'Direito Constitucional',
    corPrimaria: '#10B981',
    corSecundaria: '#34D399',
    corBadgeNum: '#A7F3D0',
    corSombra: 'rgba(16, 185, 129, 0.4)',
    corFundoBotao: '#059669',
    subtitulo: 'Teoria da Constituição, controle de constitucionalidade e direitos fundamentais',
    defaultCount: 45,
  },
  {
    id: 'humanos',
    label: 'Direitos Humanos',
    fullName: 'Direitos Humanos',
    corPrimaria: '#6366F1',
    corSecundaria: '#818CF8',
    corBadgeNum: '#C7D2FE',
    corSombra: 'rgba(99, 102, 241, 0.4)',
    corFundoBotao: '#4F46E5',
    subtitulo: 'Sistemas internacionais de proteção, tratados e direitos universais',
    defaultCount: 7,
  },
  {
    id: 'empresarial',
    label: 'Empresarial',
    fullName: 'Direito Empresarial',
    corPrimaria: '#EA580C',
    corSecundaria: '#FB923C',
    corBadgeNum: '#FFEDD5',
    corSombra: 'rgba(234, 88, 12, 0.4)',
    corFundoBotao: '#C2410C',
    subtitulo: 'Teoria da empresa, sociedades, títulos de crédito e falência',
    defaultCount: 12,
  },
  {
    id: 'filosofia',
    label: 'Filosofia',
    fullName: 'Teoria e Filosofia do Direito',
    corPrimaria: '#9333EA',
    corSecundaria: '#C084FC',
    corBadgeNum: '#E9D5FF',
    corSombra: 'rgba(147, 51, 234, 0.4)',
    corFundoBotao: '#7E22CE',
    subtitulo: 'Jusnaturalismo, positivismo, hermenêutica e teoria da justiça',
    defaultCount: 17,
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    fullName: 'Direito Financeiro',
    corPrimaria: '#CA8A04',
    corSecundaria: '#FACC15',
    corBadgeNum: '#FEF08A',
    corSombra: 'rgba(202, 138, 4, 0.4)',
    corFundoBotao: '#A16207',
    subtitulo: 'Orçamento público, receita, despesa, dívida pública e LRF',
    defaultCount: 16,
  },
  {
    id: 'internacional',
    label: 'Internacional',
    fullName: 'Direito Internacional Público',
    corPrimaria: '#2563EB',
    corSecundaria: '#60A5FA',
    corBadgeNum: '#BFDBFE',
    corSombra: 'rgba(37, 99, 235, 0.4)',
    corFundoBotao: '#1D4ED8',
    subtitulo: 'Tratados, soberania, tribunais internacionais e diplomacia',
    defaultCount: 10,
  },
  {
    id: 'penal',
    label: 'Penal',
    fullName: 'Direito Penal',
    corPrimaria: '#E11D48',
    corSecundaria: '#FB7185',
    corBadgeNum: '#FECDD3',
    corSombra: 'rgba(225, 29, 72, 0.4)',
    corFundoBotao: '#BE123C',
    subtitulo: 'Teoria do crime, penas, parte geral e crimes em espécie',
    defaultCount: 44,
  },
  {
    id: 'penal-especial',
    label: 'Penal Especial',
    fullName: 'Lei Penal Especial',
    corPrimaria: '#BE123C',
    corSecundaria: '#FB7185',
    corBadgeNum: '#FECDD3',
    corSombra: 'rgba(190, 18, 60, 0.4)',
    corFundoBotao: '#9F1239',
    subtitulo: 'Drogas, armas, crimes hediondos, lavagem e legislação penal extravagante',
    defaultCount: 14,
  },
  {
    id: 'politicas-publicas',
    label: 'Políticas Públicas',
    fullName: 'Políticas Públicas',
    corPrimaria: '#475569',
    corSecundaria: '#94A3B8',
    corBadgeNum: '#CBD5E1',
    corSombra: 'rgba(71, 85, 105, 0.4)',
    corFundoBotao: '#334155',
    subtitulo: 'Governança, regulação, controle social e políticas de Estado',
    defaultCount: 14,
  },
  {
    id: 'previdenciario',
    label: 'Previdenciário',
    fullName: 'Direito Previdenciário',
    corPrimaria: '#0D9488',
    corSecundaria: '#2DD4BF',
    corBadgeNum: '#CCFBF1',
    corSombra: 'rgba(13, 148, 136, 0.4)',
    corFundoBotao: '#0F766E',
    subtitulo: 'Seguridade social, RGPS, benefícios, aposentadorias e custeio',
    defaultCount: 15,
  },
  {
    id: 'processual-civil',
    label: 'Proc. Civil',
    fullName: 'Direito Processual Civil',
    corPrimaria: '#0891B2',
    corSecundaria: '#22D3EE',
    corBadgeNum: '#CFFAFE',
    corSombra: 'rgba(8, 145, 178, 0.4)',
    corFundoBotao: '#0E7490',
    subtitulo: 'Procedimento comum, recursos, execução e tutelas provisórias',
    defaultCount: 51,
  },
  {
    id: 'processual-penal',
    label: 'Proc. Penal',
    fullName: 'Direito Processual Penal',
    corPrimaria: '#DC2626',
    corSecundaria: '#F87171',
    corBadgeNum: '#FECACA',
    corSombra: 'rgba(220, 38, 38, 0.4)',
    corFundoBotao: '#B91C1C',
    subtitulo: 'Inquérito policial, provas, prisões, recursos e júri',
    defaultCount: 22,
  },
  {
    id: 'processual-trabalho',
    label: 'Proc. Trabalho',
    fullName: 'Direito Processual do Trabalho',
    corPrimaria: '#6D28D9',
    corSecundaria: '#A78BFA',
    corBadgeNum: '#DDD6FE',
    corSombra: 'rgba(109, 40, 217, 0.4)',
    corFundoBotao: '#5B21B6',
    subtitulo: 'Competência da JT, petição inicial trabalhista, audiências e recursos',
    defaultCount: 11,
  },
  {
    id: 'trabalho',
    label: 'Trabalho',
    fullName: 'Direito do Trabalho',
    corPrimaria: '#7C3AED',
    corSecundaria: '#A78BFA',
    corBadgeNum: '#DDD6FE',
    corSombra: 'rgba(124, 58, 237, 0.4)',
    corFundoBotao: '#6D28D9',
    subtitulo: 'Relações de emprego, contratos individuais, direito coletivo e reforma',
    defaultCount: 29,
  },
  {
    id: 'tributario',
    label: 'Tributário',
    fullName: 'Direito Tributário',
    corPrimaria: '#059669',
    corSecundaria: '#34D399',
    corBadgeNum: '#A7F3D0',
    corSombra: 'rgba(5, 150, 105, 0.4)',
    corFundoBotao: '#047857',
    subtitulo: 'Sistema tributário nacional, competências, espécies tributárias e CTN',
    defaultCount: 39,
  },
];

function norm(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

interface BibliotecaMobileContentProps {
  counts: Record<string, number>;
  onAbrirLivro: (livro: LivroNormalizado, modoInicial?: 'nativa' | 'pdf' | 'pdf-clara' | 'pdf-escura') => void;
  onAbrirCustomPdf: (titulo: string, url: string) => void;
  onAbrirMateria: (materia: string) => void;
}

export const BibliotecaMobileContent: React.FC<BibliotecaMobileContentProps> = ({
  counts,
  onAbrirLivro,
  onAbrirCustomPdf,
  onAbrirMateria,
}) => {
  const navigate = useNavigate();

  // Matéria de Direito ativa para as abas 3D da lista de baixo (ordem alfabética)
  const [activeMateriaId, setActiveMateriaId] = useState<string>('administrativo');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(30);
  const [favoriteSnapshots, setFavoriteSnapshots] = useState<LivroSnapshot[]>(() => getFavoritos());

  // Estado do carrossel do meio (Demais Categorias)
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(0);
  const carouselScrollerRef = useRef<HTMLDivElement>(null);

  const colecoesVisiveis = useVisibleColecoes();

  // Reset do limite visível ao alternar matéria ou busca
  useEffect(() => {
    setVisibleLimit(30);
  }, [activeMateriaId, searchQuery]);

  // Matéria ativa atual com tema completo
  const activeMateria = useMemo(() => {
    return MATERIAS_DIREITO_TABS.find((t) => t.id === activeMateriaId) || MATERIAS_DIREITO_TABS[0];
  }, [activeMateriaId]);

  // Sincronização dos favoritos
  useEffect(() => {
    const syncFavs = () => {
      setFavoriteSnapshots(getFavoritos());
    };
    const unsub = subscribeTracking(syncFavs);
    window.addEventListener('storage', syncFavs);
    return () => {
      unsub();
      window.removeEventListener('storage', syncFavs);
    };
  }, []);

  const favoriteIds = useMemo(() => {
    return new Set(favoriteSnapshots.map((f) => `${f.colecaoId}:${f.id}`));
  }, [favoriteSnapshots]);

  // Query das coleções com cache no IndexedDB e staleTime seguro
  const collectionQueries = useQueries({
    queries: colecoesVisiveis.map((colecao) => ({
      queryKey: ['biblioteca-colecao', colecao.id],
      staleTime: 10 * 60 * 1000,
      placeholderData: (prev: any) => prev,
      queryFn: async () => {
        try {
          let q: any = supabase.from(colecao.table as any).select(colecao.select);
          if (colecao.orderBy) {
            q = q.order(colecao.orderBy, { ascending: true, nullsFirst: false });
          }

          const data = await withBundleFallback(
            q.limit(2000).then((res: any) => {
              if (res.error) throw res.error;
              return res.data;
            }),
            async () => {
              const bundleFnName =
                'biblioteca' +
                colecao.id
                  .split('-')
                  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                  .join('');
              if ((bundle as any)[bundleFnName]) {
                return await (bundle as any)[bundleFnName]();
              }
              return [];
            }
          );

          const list = (data as any[]).map((r) => normalizeLivro(r, colecao));
          setPersistedColecao(colecao.id, list).catch(() => {});
          return list;
        } catch (err) {
          const cached = await getPersistedColecao<LivroNormalizado>(colecao.id);
          if (cached && cached.length) return cached;
          return [];
        }
      },
    })),
  });

  const booksByColecao = useMemo(() => {
    const map: Record<string, LivroNormalizado[]> = {};
    colecoesVisiveis.forEach((c, idx) => {
      map[c.id] = (collectionQueries[idx]?.data as LivroNormalizado[]) || [];
    });
    return map;
  }, [colecoesVisiveis, collectionQueries]);

  // Mapa de contagem real por Matéria do Direito
  const countMap = useMemo(() => {
    const areasLivros = booksByColecao['areas'] || [];
    const map: Record<string, number> = {};

    areasLivros.forEach((l) => {
      if (l.area) {
        const areaNorm = norm(l.area).replace('previndenciario', 'previdenciario');
        map[areaNorm] = (map[areaNorm] || 0) + 1;
        map[l.area] = (map[l.area] || 0) + 1;
      }
    });

    return map;
  }, [booksByColecao]);

  // Retorna contagem para a aba da matéria
  const getTabCount = useCallback((tab: MateriaTabConfig) => {
    const targetNorm = norm(tab.fullName).replace('previndenciario', 'previdenciario');
    const direct = countMap[targetNorm] || countMap[tab.fullName];
    if (direct !== undefined && direct > 0) return direct;
    return tab.defaultCount;
  }, [countMap]);

  // Livros da matéria de direito ativa
  const livrosDaMateria = useMemo(() => {
    const areasLivros = booksByColecao['areas'] || [];
    const targetNorm = norm(activeMateria.fullName).replace('previndenciario', 'previdenciario');

    return areasLivros.filter((l) => {
      if (!l.area) return false;
      const aNorm = norm(l.area).replace('previndenciario', 'previdenciario');
      return aNorm === targetNorm || aNorm.includes(targetNorm) || targetNorm.includes(aNorm);
    });
  }, [booksByColecao, activeMateria]);

  // Livros da matéria filtrados por pesquisa
  const livrosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return livrosDaMateria;
    const q = norm(searchQuery);
    const tokens = q.split(' ').filter(Boolean);
    return livrosDaMateria.filter((l) => {
      const target = norm(`${l.titulo} ${l.autor || ''} ${l.sobre || ''}`);
      return tokens.every((t) => target.includes(t));
    });
  }, [livrosDaMateria, searchQuery]);

  const visibleLivros = useMemo(() => {
    return livrosFiltrados.slice(0, visibleLimit);
  }, [livrosFiltrados, visibleLimit]);

  // Pré-aquecimento das capas dos livros visíveis (0ms)
  useEffect(() => {
    if (!visibleLivros || visibleLivros.length === 0) return;
    const urls = visibleLivros
      .slice(0, 16)
      .map((l) => (l.capa ? directImg(l.capa, 240) : null))
      .filter(Boolean) as string[];
    prefetchImages(urls);
  }, [visibleLivros]);

  const handleToggleFavorite = useCallback((livro: LivroNormalizado) => {
    haptic.selection();
    const now = toggleFavorito(livro);
    setFavoriteSnapshots(getFavoritos());
    toast.success(now ? 'Livro salvo na sua estante!' : 'Livro removido dos salvos');
  }, []);

  // Manipuladores de rolagem e dots do carrossel do meio
  const handleCarouselScroll = () => {
    const el = carouselScrollerRef.current;
    if (!el) return;
    const cardWidth = 148;
    const idx = Math.round(el.scrollLeft / cardWidth);
    const clamped = Math.max(0, Math.min(DEMAIS_CATEGORIAS_CARROSSEL.length - 1, idx));
    if (clamped !== activeCarouselIndex) {
      setActiveCarouselIndex(clamped);
    }
  };

  const scrollCarouselToIndex = (index: number) => {
    const el = carouselScrollerRef.current;
    if (!el) return;
    const cardWidth = 148;
    el.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth',
    });
    setActiveCarouselIndex(index);
  };

  return (
    <div className="relative w-full">
      {/* Hospeda os sheets e modais acionados pelos atalhos do hero */}
      <BibliotecaAtalhosBar
        onAbrirLivro={onAbrirLivro}
        onAbrirCustomPdf={onAbrirCustomPdf}
      />

      {/* Hero Padrão Vade Mecum / Audiobooks */}
      <BibliotecaHero onAbrirCustomPdf={() => onAbrirCustomPdf('Meus PDFs', '')} />

      {/* Conteúdo Principal com Estrutura Fluida e Organizada (Margem generosa sem colar) */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-8 sm:space-y-10">
        {/* Banner Continuar Leitura no modelo de Resumos com capa flush */}
        <div className="mb-6 sm:mb-8">
          <BibliotecaContinuarLeituraBanner onAbrirLivro={onAbrirLivro} />
        </div>

        {/* ======================================================== */}
        {/* CARROSSEL DO MEIO: DEMAIS CATEGORIAS DO ACERVO           */}
        {/* ======================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#C084FC] to-[#7C3AED] shadow-[0_0_8px_rgba(168,85,247,0.6)] shrink-0" />
                <span className="truncate">DEMAIS CATEGORIAS & ACERVOS</span>
              </h3>
              <p className="text-white/60 text-[11.5px] sm:text-[12px] leading-snug ml-3">
                Clássicos, Fora da Toga, Liderança, Oratória, Português e Pesquisa
              </p>
            </div>
          </div>

          {/* Carrossel Horizontal Snap Fluido com Capas 3:4 das Demais Categorias */}
          <div
            ref={carouselScrollerRef}
            onScroll={handleCarouselScroll}
            className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3.5 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
          >
            {DEMAIS_CATEGORIAS_CARROSSEL.map((cat, idx) => {
              const colecao = findColecao(cat.id);
              const coverUrl = colecao?.cover || bibliotecaCoverImg;
              const countVal = counts[cat.id] || cat.defaultCount;
              const CatIcon = cat.Icon;

              return (
                <div
                  key={`cat-meio-${cat.id}`}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/bibliotecas/${cat.id}`);
                  }}
                  className="snap-start shrink-0 w-[136px] sm:w-[150px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform active:scale-95 transition-transform duration-150"
                >
                  <div
                    className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 transition-all duration-300 shadow-md group-hover:shadow-xl"
                    style={{
                      boxShadow: '0 10px 24px -4px rgba(0,0,0,0.85)',
                    }}
                  >
                    <img
                      src={coverUrl}
                      alt={cat.title}
                      loading={idx < 5 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradiente de profundidade para legibilidade e visual cinematográfico */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/40 pointer-events-none" />

                    {/* Ícone da Categoria no Topo à Esquerda com Pill Translúcida sem contorno colorido */}
                    <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                      <div
                        className="w-7 h-7 rounded-xl bg-black/65 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                      >
                        <CatIcon className="w-3.5 h-3.5 text-white drop-shadow-sm" strokeWidth={2.2} />
                      </div>
                    </div>

                    {/* Seta no Topo à Direita para Ação Direta */}
                    <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                      <div className="w-7 h-7 rounded-full bg-black/65 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group-hover:border-white/40 group-hover:bg-black/80 transition-all">
                        <ArrowUpRight
                          className="w-3.5 h-3.5 text-white/90 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                          strokeWidth={2.4}
                        />
                      </div>
                    </div>

                    {/* Rodapé do Card com Selo e Título */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 flex flex-col justify-end pointer-events-none">
                      <span
                        className="self-start text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/75 border border-white/10 mb-1"
                        style={{ color: cat.corSecundaria }}
                      >
                        {countVal} {countVal === 1 ? 'OBRA' : 'OBRAS'}
                      </span>
                      <h4 className="font-serif font-black text-xs sm:text-[13px] text-white uppercase leading-tight line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                        {cat.label}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Indicador de Bolinhas Minimalista (Idêntico a Audiobooks) */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {DEMAIS_CATEGORIAS_CARROSSEL.map((cat, i) => {
              const isActive = i === activeCarouselIndex;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    scrollCarouselToIndex(i);
                  }}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-5 shadow-sm"
                      : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
                  style={{
                    backgroundColor: isActive ? cat.corTema : undefined,
                    boxShadow: isActive ? `0 0 10px ${cat.corSombra}` : undefined,
                  }}
                  aria-label={`Ver categoria ${cat.label}`}
                />
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* LISTA DE BAIXO: SÓ DAS MATÉRIAS DE DIREITO               */}
        {/* FORMATO E LAYOUT IDÊNTICO AO DE AUDIOBOOKS               */}
        {/* ======================================================== */}
        <section className="pt-3 sm:pt-5 pb-8 sm:pb-12">
          {/* Header da Seção com Identidade Visual Dinâmica da Matéria Selecionada */}
          <div className="mb-4">
            <p
              className="text-[10px] uppercase tracking-[0.22em] font-bold transition-colors duration-300"
              style={{ color: activeMateria.corSecundaria }}
            >
              ACERVO DE DOUTRINAS • {activeMateria.label.toUpperCase()}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-1 h-6 rounded-full transition-colors duration-300"
                style={{ backgroundColor: activeMateria.corPrimaria }}
              />
              <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                {activeMateria.fullName}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-white/60 mt-1 ml-3">
              {activeMateria.subtitulo}
            </p>
          </div>

          {/* Campo de Busca Rápida Idêntico a Audiobooks */}
          <div className="relative mb-4">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar livro, autor ou tema em ${activeMateria.label}…`}
              className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416]/95 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors shadow-lg shadow-black/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Abas 3D Estilo Pasta (Sem margem na direita para efeito contínuo/infinito e cores dinâmicas) */}
          <div className="relative -mr-4 sm:-mr-6 overflow-x-auto no-scrollbar mb-5">
            <div className="flex w-max min-w-full items-end no-scrollbar h-11 sm:h-12 pt-1 pr-6 sm:pr-8">
              {MATERIAS_DIREITO_TABS.map((tab, index) => {
                const isActive = activeMateriaId === tab.id;
                const tabTema = tab;
                const zIndex = isActive ? 40 : 30 - Math.min(index, 20);
                const countNumber = getTabCount(tab);

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      setActiveMateriaId(tab.id);
                    }}
                    className={cn(
                      "relative shrink-0 h-full flex items-center justify-center gap-1.5 px-4 sm:px-5 rounded-t-2xl border-x border-t text-[10.5px] sm:text-[11.5px] uppercase tracking-wider cursor-pointer select-none transition-colors duration-200",
                      isActive
                        ? "text-white font-bold border-transparent"
                        : "bg-[#141416] text-white/50 hover:bg-[#1A1A1E] shadow-[inset_0_-4px_10px_rgba(0,0,0,0.8)] hover:text-white border-white/10 opacity-80 font-medium"
                    )}
                    style={{
                      zIndex,
                      marginLeft: index > 0 ? "-10px" : "0",
                    }}
                  >
                    {/* Fundo Deslizante Ativo com Física de Mola Fluida (Spring Physics) */}
                    {isActive && (
                      <motion.div
                        layoutId="activeBibliotecaMateriaTabPill"
                        className="absolute inset-0 rounded-t-2xl border-x border-t z-0 overflow-hidden"
                        style={{
                          backgroundColor: tabTema.corPrimaria,
                          borderColor: tabTema.corSecundaria,
                          boxShadow: `0 -6px 20px ${tabTema.corSombra}`,
                        }}
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 450,
                          damping: 35,
                          mass: 0.6,
                        }}
                      >
                        {/* Brilho Superior Suave */}
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/25 opacity-90 pointer-events-none" />
                        <div
                          className="absolute inset-0 rounded-t-2xl border-x border-t pointer-events-none shadow-[inset_0_2px_10px_rgba(255,255,255,0.35)]"
                          style={{ borderColor: tabTema.corBadgeNum }}
                        />
                      </motion.div>
                    )}

                    <span
                      className={cn(
                        "relative z-10 whitespace-nowrap transition-transform duration-200 font-bold",
                        isActive ? "scale-105 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" : "scale-100"
                      )}
                    >
                      {tab.label}
                    </span>

                    <span
                      className={cn(
                        "relative z-10 text-[9.5px] px-1.5 py-0.2 rounded-full font-mono font-bold tracking-tight transition-colors duration-200",
                        isActive
                          ? "bg-zinc-900/85 text-zinc-300 border border-zinc-700/60 shadow-inner"
                          : "bg-white/5 text-white/40"
                      )}
                    >
                      {countNumber}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Linha de Base da Pasta Oficial com Transição Suave de Cor */}
            <motion.div
              className="min-w-full w-max h-0.5 relative z-20"
              animate={{
                backgroundColor: activeMateria.corPrimaria,
                boxShadow: `0 0 14px ${activeMateria.corSombra}`,
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>

          {/* Listagem de Livros — Somente Lista Vertical Idêntica a Audiobooks */}
          <AnimatePresence mode="wait">
            {livrosFiltrados.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="py-16 text-center text-white/60 text-sm bg-zinc-900/40 border border-white/10 rounded-3xl px-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="font-semibold text-white">
                  {searchQuery
                    ? `Nenhum livro encontrado para "${searchQuery}" em ${activeMateria.label}.`
                    : `Nenhum livro disponível em ${activeMateria.fullName}.`}
                </p>
                <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                  Tente buscar outro termo ou selecione outra matéria do Direito.
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-4 py-1.5 rounded-full text-white text-xs font-bold transition-colors cursor-pointer"
                    style={{ backgroundColor: activeMateria.corFundoBotao }}
                  >
                    Limpar pesquisa
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={activeMateriaId}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-2.5"
              >
                {visibleLivros.map((livro, index) => {
                  const isFav = favoriteIds.has(`${livro.colecaoId || 'areas'}:${livro.id}`);

                  return (
                    <motion.div
                      key={`${livro.colecaoId || 'areas'}:${livro.id}-${index}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: Math.min(index * 0.03, 0.3),
                        type: "spring",
                        stiffness: 300,
                        damping: 24,
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => {
                        haptic.selection();
                        onAbrirLivro(livro);
                      }}
                      aria-label={`Abrir livro ${livro.titulo}${livro.autor ? ` de ${livro.autor}` : ""}`}
                      className="group flex items-stretch gap-3.5 p-3 rounded-2xl bg-[#141416]/95 hover:bg-[#1C1C1E] border border-white/10 hover:border-white/20 transition-all text-left w-full relative overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.6)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.8)] cursor-pointer select-none min-h-[116px] sm:min-h-[122px] h-auto"
                    >
                      {/* Capa Retangular à Esquerda (Sem contornos) */}
                      <div className="w-[72px] sm:w-[78px] min-h-[92px] sm:min-h-[98px] shrink-0 rounded-xl overflow-hidden bg-zinc-950 relative self-stretch shadow-md">
                        <img
                          src={livro.capa ? directImg(livro.capa, 200) : bibliotecaCoverImg}
                          alt={`Capa do livro: ${livro.titulo}`}
                          loading={index < 6 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={index < 4 ? "high" : "auto"}
                          onError={(e) => {
                            e.currentTarget.src = bibliotecaCoverImg;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Selo no topo da capinha: Círculo minimalista com Check */}
                        <div className="absolute top-1.5 left-1.5 z-10 pointer-events-none">
                          <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md border border-emerald-300/40">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        </div>
                      </div>

                      {/* Informações da Obra — Título e Autor com Espaço Amplo + Rodapé com Páginas, Salvar e Ler */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 gap-2">
                        <div>
                          {/* Título com espaço livre total, sem abreviações e traços finos */}
                          <p className="font-sans font-normal text-[14.5px] sm:text-[15.5px] text-white/95 leading-snug tracking-wide group-hover:text-white transition-colors">
                            {livro.titulo}
                          </p>

                          <p className="mt-0.5 text-[11px] sm:text-[11.5px] text-white/50 leading-snug">
                            {livro.autor || activeMateria.label} {livro.anoLancamento && `• ${livro.anoLancamento}`}
                          </p>
                        </div>

                        {/* Linha Inferior: Páginas + Ícone de Salvar ao lado + Botão Ler à Direita */}
                        <div className="flex items-center justify-between gap-2 mt-auto pt-1 w-full">
                          <div className="flex items-center gap-2 min-w-0 flex-wrap">
                            {/* Páginas na cor dinâmica da matéria */}
                            <span
                              className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono px-2 py-0.5 rounded-md border shadow-sm shrink-0 transition-colors duration-300"
                              style={{
                                backgroundColor: `${activeMateria.corPrimaria}1A`,
                                borderColor: `${activeMateria.corPrimaria}45`,
                              }}
                            >
                              <BookOpen
                                className="w-3 h-3 stroke-[2.4]"
                                style={{ color: activeMateria.corSecundaria }}
                              />
                              <span className="font-bold" style={{ color: activeMateria.corBadgeNum }}>
                                {livro.paginas ? `${livro.paginas} págs` : 'PDF Integral'}
                              </span>
                            </span>

                            {/* Ícone de Salvar ao lado das páginas */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(livro);
                              }}
                              className="p-1 rounded-md hover:bg-white/10 text-white/50 hover:text-amber-400 active:scale-90 transition-all cursor-pointer flex items-center justify-center shrink-0"
                              aria-label={isFav ? "Remover dos salvos" : "Salvar na estante"}
                            >
                              <Bookmark
                                className={cn(
                                  "w-3.5 h-3.5 transition-colors",
                                  isFav
                                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                                    : "text-zinc-500 hover:text-zinc-300"
                                )}
                                strokeWidth={2}
                              />
                            </button>
                          </div>

                          {/* Botão Ler posicionado embaixo à direita na cor do tema */}
                          <div className="shrink-0">
                            <span
                              className="text-[11px] uppercase tracking-wide font-bold text-white px-3 py-1.5 rounded-full transition-all duration-200 shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-95 active:scale-95"
                              style={{
                                backgroundColor: activeMateria.corFundoBotao,
                                boxShadow: `0 3px 12px ${activeMateria.corSombra}`,
                              }}
                            >
                              <BookOpen className="w-3 h-3 fill-white/20 stroke-[2.2]" />
                              Ler
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                {/* Paginação fluida para carregar mais obras */}
                {livrosFiltrados.length > visibleLimit && (
                  <div className="pt-4 pb-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((prev) => prev + 30)}
                      className="px-6 py-2.5 rounded-full bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs sm:text-sm font-semibold active:scale-95 transition-all shadow-md cursor-pointer"
                    >
                      Carregar mais obras ({livrosFiltrados.length - visibleLimit} restantes)
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
};