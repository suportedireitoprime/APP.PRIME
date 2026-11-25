import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
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
  Headphones,
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
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Regime jurídico-administrativo, licitações, contratos e servidores públicos',
    defaultCount: 26,
  },
  {
    id: 'ambiental',
    label: 'Ambiental',
    fullName: 'Direito Ambiental',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Princípios ambientais, SISNAMA, licenciamento e tutela ecológica',
    defaultCount: 7,
  },
  {
    id: 'civil',
    label: 'Civil',
    fullName: 'Direito Civil',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Parte geral, obrigações, contratos, coisas, família e sucessões',
    defaultCount: 56,
  },
  {
    id: 'constitucional',
    label: 'Constitucional',
    fullName: 'Direito Constitucional',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Teoria da Constituição, controle de constitucionalidade e direitos fundamentais',
    defaultCount: 45,
  },
  {
    id: 'humanos',
    label: 'Direitos Humanos',
    fullName: 'Direitos Humanos',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Sistemas internacionais de proteção, tratados e direitos universais',
    defaultCount: 7,
  },
  {
    id: 'empresarial',
    label: 'Empresarial',
    fullName: 'Direito Empresarial',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Teoria da empresa, sociedades, títulos de crédito e falência',
    defaultCount: 12,
  },
  {
    id: 'filosofia',
    label: 'Filosofia',
    fullName: 'Teoria e Filosofia do Direito',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Jusnaturalismo, positivismo, hermenêutica e teoria da justiça',
    defaultCount: 17,
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    fullName: 'Direito Financeiro',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Orçamento público, receita, despesa, dívida pública e LRF',
    defaultCount: 16,
  },
  {
    id: 'internacional',
    label: 'Internacional',
    fullName: 'Direito Internacional Público',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Tratados, soberania, tribunais internacionais e diplomacia',
    defaultCount: 10,
  },
  {
    id: 'penal',
    label: 'Penal',
    fullName: 'Direito Penal',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Teoria do crime, penas, parte geral e crimes em espécie',
    defaultCount: 44,
  },
  {
    id: 'penal-especial',
    label: 'Penal Especial',
    fullName: 'Lei Penal Especial',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Drogas, armas, crimes hediondos, lavagem e legislação penal extravagante',
    defaultCount: 14,
  },
  {
    id: 'politicas-publicas',
    label: 'Políticas Públicas',
    fullName: 'Políticas Públicas',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Governança, regulação, controle social e políticas de Estado',
    defaultCount: 14,
  },
  {
    id: 'previdenciario',
    label: 'Previdenciário',
    fullName: 'Direito Previdenciário',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Seguridade social, RGPS, benefícios, aposentadorias e custeio',
    defaultCount: 15,
  },
  {
    id: 'processual-civil',
    label: 'Proc. Civil',
    fullName: 'Direito Processual Civil',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Procedimento comum, recursos, execução e tutelas provisórias',
    defaultCount: 51,
  },
  {
    id: 'processual-penal',
    label: 'Proc. Penal',
    fullName: 'Direito Processual Penal',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Inquérito policial, provas, prisões, recursos e júri',
    defaultCount: 22,
  },
  {
    id: 'processual-trabalho',
    label: 'Proc. Trabalho',
    fullName: 'Direito Processual do Trabalho',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Competência da JT, petição inicial trabalhista, audiências e recursos',
    defaultCount: 11,
  },
  {
    id: 'trabalho',
    label: 'Trabalho',
    fullName: 'Direito do Trabalho',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
    subtitulo: 'Relações de emprego, contratos individuais, direito coletivo e reforma',
    defaultCount: 29,
  },
  {
    id: 'tributario',
    label: 'Tributário',
    fullName: 'Direito Tributário',
    corPrimaria: '#8B5CF6',
    corSecundaria: '#C4B5FD',
    corBadgeNum: '#EDE9FE',
    corSombra: 'rgba(139, 92, 246, 0.45)',
    corFundoBotao: '#7C3AED',
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
  onBack?: () => void;
}

export const BibliotecaMobileContent: React.FC<BibliotecaMobileContentProps> = ({
  counts,
  onAbrirLivro,
  onAbrirCustomPdf,
  onAbrirMateria,
  onBack,
}) => {
  const navigate = useNavigate();

  // Matéria de Direito ativa para as abas 3D da lista de baixo (ordem alfabética)
  const [activeMateriaId, setActiveMateriaId] = useState<string>('administrativo');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(30);
  const [favoriteSnapshots, setFavoriteSnapshots] = useState<LivroSnapshot[]>(() => getFavoritos());

  // Categoria de Acervos Especiais ativa (inicia sempre por Clássicos)
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(0);
  const livrosScrollerRef = useRef<HTMLDivElement>(null);
  const menuAlternanciaRef = useRef<HTMLDivElement>(null);

  // Mantém a pílula do Menu de Alternância visível ao alternar o item ativo
  useEffect(() => {
    const menuEl = menuAlternanciaRef.current;
    if (!menuEl) return;
    const activeBtn = menuEl.querySelector(`[data-idx="${activeCarouselIndex}"]`) as HTMLElement;
    if (activeBtn) {
      const targetLeft = activeBtn.offsetLeft - (menuEl.clientWidth - activeBtn.clientWidth) / 2;
      menuEl.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [activeCarouselIndex]);

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

  // Categoria de Acervo Especial ativa e seus livros
  const activeAcervo = useMemo(() => {
    return DEMAIS_CATEGORIAS_CARROSSEL[activeCarouselIndex] || DEMAIS_CATEGORIAS_CARROSSEL[0];
  }, [activeCarouselIndex]);

  const livrosDoAcervo = useMemo(() => {
    return booksByColecao[activeAcervo.id] || [];
  }, [booksByColecao, activeAcervo.id]);

  // Controles de rolagem fluida e drag com mouse para as capas de Acervos Especiais
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDraggingLivrosRef = useRef(false);
  const startXLivrosRef = useRef(0);
  const startScrollLeftLivrosRef = useRef(0);
  const hasMovedLivrosRef = useRef(false);

  const checkLivrosScroll = useCallback(() => {
    const el = livrosScrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 12);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 12);
  }, []);

  const handleScrollLivrosBy = useCallback((direction: 'left' | 'right') => {
    const el = livrosScrollerRef.current;
    if (!el) return;
    haptic.selection();
    const amount = Math.max(el.clientWidth * 0.72, 280);
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  // Mouse Drag Handlers para Desktop
  const handleLivrosMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // apenas botão principal
    const el = livrosScrollerRef.current;
    if (!el) return;
    isDraggingLivrosRef.current = true;
    startXLivrosRef.current = e.clientX;
    startScrollLeftLivrosRef.current = el.scrollLeft;
    hasMovedLivrosRef.current = false;
  }, []);

  const handleLivrosMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingLivrosRef.current) return;
    const el = livrosScrollerRef.current;
    if (!el) return;
    const dx = e.clientX - startXLivrosRef.current;
    if (Math.abs(dx) > 5) {
      hasMovedLivrosRef.current = true;
      el.scrollLeft = startScrollLeftLivrosRef.current - dx;
    }
  }, []);

  const handleLivrosMouseEnd = useCallback(() => {
    if (!isDraggingLivrosRef.current) return;
    isDraggingLivrosRef.current = false;
    setTimeout(() => {
      hasMovedLivrosRef.current = false;
    }, 100);
  }, []);

  useEffect(() => {
    checkLivrosScroll();
  }, [activeCarouselIndex, livrosDoAcervo, checkLivrosScroll]);

  const handleSelectAcervo = useCallback((idx: number) => {
    haptic.selection();
    setActiveCarouselIndex(idx);
    if (livrosScrollerRef.current) {
      livrosScrollerRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
    setCanScrollLeft(false);
    setCanScrollRight(true);
  }, []);

  return (
    <div className="relative w-full">
      {/* Hospeda os sheets e modais acionados pelos atalhos do hero */}
      <BibliotecaAtalhosBar
        onAbrirLivro={onAbrirLivro}
        onAbrirCustomPdf={onAbrirCustomPdf}
      />

      {/* Hero Padrão Vade Mecum / Audiobooks com rota de voltar garantida para o início */}
      <BibliotecaHero
        onAbrirCustomPdf={() => onAbrirCustomPdf('Meus PDFs', '')}
        onBack={onBack ?? (() => navigate('/'))}
      />

      {/* Conteúdo Principal Minimalista com respiro para o menu flutuante */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-[calc(7.5rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))] space-y-8 sm:space-y-10">
        {/* Banner Continuar Leitura */}
        <div>
          <BibliotecaContinuarLeituraBanner onAbrirLivro={onAbrirLivro} />
        </div>

        {/* ======================================================== */}
        {/* ACERVOS ESPECIAIS (Minimalista)                          */}
        {/* ======================================================== */}
        <section className="space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-sans text-zinc-400 text-xs font-semibold uppercase tracking-widest truncate">
              Acervos Especiais
            </h3>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleScrollLivrosBy('left')}
                  disabled={!canScrollLeft}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border transition-all cursor-pointer",
                    canScrollLeft
                      ? "bg-zinc-900 border-white/15 text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-95"
                      : "bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed opacity-40"
                  )}
                  aria-label="Voltar capas"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScrollLivrosBy('right')}
                  disabled={!canScrollRight}
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center border transition-all cursor-pointer",
                    canScrollRight
                      ? "bg-zinc-900 border-white/15 text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-95"
                      : "bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed opacity-40"
                  )}
                  aria-label="Avançar capas"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  haptic.selection();
                  navigate(`/bibliotecas/${activeAcervo.id}`);
                }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer touch-manipulation shrink-0"
              >
                <span>Ver acervo ({livrosDoAcervo.length || activeAcervo.defaultCount})</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Menu de Alternância de Acervos Especiais */}
          <div
            ref={menuAlternanciaRef}
            className="-mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5 pb-1 select-none touch-pan-x"
          >
            {DEMAIS_CATEGORIAS_CARROSSEL.map((cat, idx) => {
              const isAtivo = idx === activeCarouselIndex;
              const CatIcon = cat.Icon;
              const countVal = booksByColecao[cat.id]?.length || counts[cat.id] || cat.defaultCount;

              return (
                <button
                  key={`menu-alternancia-${cat.id}`}
                  type="button"
                  data-idx={idx}
                  onClick={() => handleSelectAcervo(idx)}
                  className={cn(
                    "relative shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 select-none cursor-pointer border min-h-[38px] active:scale-95 touch-manipulation",
                    isAtivo
                      ? "bg-white text-zinc-950 border-white font-semibold"
                      : "bg-zinc-900/75 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border-white/10"
                  )}
                >
                  <CatIcon
                    className={cn(
                      "w-3.5 h-3.5 shrink-0 transition-colors",
                      isAtivo ? "text-zinc-950" : "text-zinc-400"
                    )}
                    strokeWidth={2}
                  />
                  <span className="whitespace-nowrap font-sans">{cat.label}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold tracking-tight transition-colors",
                      isAtivo
                        ? "bg-zinc-950/10 text-zinc-900"
                        : "bg-white/5 text-zinc-500"
                    )}
                  >
                    {countVal}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Carrossel de Livros da Categoria Selecionada */}
          <div
            ref={livrosScrollerRef}
            onScroll={checkLivrosScroll}
            onMouseDown={handleLivrosMouseDown}
            onMouseMove={handleLivrosMouseMove}
            onMouseUp={handleLivrosMouseEnd}
            onMouseLeave={handleLivrosMouseEnd}
            className="-mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x touch-manipulation pt-1 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden items-stretch cursor-grab active:cursor-grabbing select-none"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {livrosDoAcervo.length > 0 ? (
              livrosDoAcervo.slice(0, 30).map((livro, bookIdx) => {
                const coverUrl = livro.capa ? directImg(livro.capa, 320) : bibliotecaCoverImg;
                const hasAudio = Boolean(livro.audioResumoUrl);

                return (
                  <div
                    key={`acervo-${activeAcervo.id}-${livro.id}-${bookIdx}`}
                    onClick={() => {
                      if (hasMovedLivrosRef.current) return;
                      haptic.selection();
                      onAbrirLivro(livro);
                    }}
                    className="snap-start shrink-0 w-[134px] sm:w-[148px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform transition-all duration-200 active:scale-95 touch-pan-x touch-manipulation select-none"
                  >
                    <div className="relative aspect-[3/4.2] w-full rounded-2xl overflow-hidden bg-zinc-950 ring-1 ring-white/10 group-hover:ring-white/30 transition-all duration-200 flex flex-col justify-end">
                      <img
                        src={coverUrl}
                        alt={livro.titulo}
                        loading={bookIdx < 6 ? 'eager' : 'lazy'}
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.src = bibliotecaCoverImg;
                        }}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

                      {hasAudio && (
                        <div className="absolute top-2 left-2 z-10 pointer-events-none">
                          <div className="px-1.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[9px] font-medium text-zinc-200 flex items-center gap-1">
                            <Headphones className="w-2.5 h-2.5" />
                            <span>Áudio</span>
                          </div>
                        </div>
                      )}

                      <div className="relative z-10 p-2.5 pt-6 text-left pointer-events-none">
                        <h4 className="font-sans font-semibold text-[12px] sm:text-[13px] text-white leading-tight line-clamp-2">
                          {livro.titulo}
                        </h4>
                        {livro.autor && (
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {livro.autor}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              Array.from({ length: 5 }).map((_, sIdx) => (
                <div
                  key={`skel-book-${sIdx}`}
                  className="snap-start shrink-0 w-[134px] sm:w-[148px] aspect-[3/4.2] rounded-2xl bg-zinc-900/60 border border-white/5 animate-pulse"
                />
              ))
            )}

            {livrosDoAcervo.length > 0 && (
              <div
                onClick={() => {
                  if (hasMovedLivrosRef.current) return;
                  haptic.selection();
                  navigate(`/bibliotecas/${activeAcervo.id}`);
                }}
                className="snap-start shrink-0 w-[134px] sm:w-[148px] aspect-[3/4.2] rounded-2xl border border-dashed border-white/15 bg-zinc-900/50 hover:bg-zinc-900 flex flex-col items-center justify-center text-center p-3 cursor-pointer group active:scale-95 transition-all touch-pan-x touch-manipulation select-none"
              >
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform mb-2">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-white">
                  Ver todas ({livrosDoAcervo.length})
                </span>
                <span className="text-[10px] text-zinc-400 mt-0.5">
                  {activeAcervo.label}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ======================================================== */}
        {/* MATÉRIAS DE DIREITO (Minimalista)                        */}
        {/* ======================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-sans text-zinc-400 text-xs font-semibold uppercase tracking-widest truncate">
              Matérias de Direito
            </h2>
            <span className="text-xs text-zinc-500 font-mono">
              {livrosFiltrados.length} {livrosFiltrados.length === 1 ? 'obra' : 'obras'}
            </span>
          </div>

          {/* Campo de Busca Minimalista */}
          <div className="relative group">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-white" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar em ${activeMateria.label}…`}
              className="w-full pl-10 pr-10 h-12 text-sm rounded-xl bg-zinc-900/80 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-1"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Pills Horizontais Minimalistas das Matérias */}
          <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 select-none touch-pan-x">
            {MATERIAS_DIREITO_TABS.map((tab) => {
              const isActive = activeMateriaId === tab.id;
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
                    "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border min-h-[38px] transition-all cursor-pointer select-none active:scale-95",
                    isActive
                      ? "bg-white text-zinc-950 border-white font-semibold"
                      : "bg-zinc-900/75 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border-white/10"
                  )}
                >
                  <span className="whitespace-nowrap">{tab.label}</span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold",
                      isActive
                        ? "bg-zinc-950/10 text-zinc-900"
                        : "bg-white/5 text-zinc-500"
                    )}
                  >
                    {countNumber}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Listagem Minimalista de Livros */}
          <AnimatePresence mode="wait">
            {livrosFiltrados.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="py-14 text-center text-zinc-400 text-sm bg-zinc-900/50 border border-white/10 rounded-2xl px-4"
              >
                <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <p className="font-medium text-white">
                  {searchQuery
                    ? `Nenhum livro encontrado para "${searchQuery}" em ${activeMateria.label}.`
                    : `Nenhum livro disponível em ${activeMateria.fullName}.`}
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
                  Tente outro termo ou selecione outra matéria.
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-4 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Limpar pesquisa
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={activeMateriaId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex flex-col gap-2.5"
              >
                {visibleLivros.map((livro, index) => {
                  const isFav = favoriteIds.has(`${livro.colecaoId || 'areas'}:${livro.id}`);

                  return (
                    <div
                      key={`${livro.colecaoId || 'areas'}:${livro.id}-${index}`}
                      onClick={() => {
                        haptic.selection();
                        onAbrirLivro(livro);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          haptic.selection();
                          onAbrirLivro(livro);
                        }
                      }}
                      aria-label={`Abrir livro ${livro.titulo}${livro.autor ? ` de ${livro.autor}` : ""}`}
                      className="group flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/75 hover:bg-zinc-800/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer select-none text-left w-full active:scale-[0.99] touch-pan-y"
                    >
                      {/* Capa Compacta à Esquerda */}
                      <div className="relative w-[68px] sm:w-[76px] aspect-[3/4.2] rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shrink-0 flex items-center justify-center">
                        <img
                          src={livro.capa ? directImg(livro.capa, 240) : bibliotecaCoverImg}
                          alt={livro.titulo}
                          loading={index < 6 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={index < 4 ? "high" : "auto"}
                          onError={(e) => {
                            e.currentTarget.src = bibliotecaCoverImg;
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Informações do Livro */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                              {activeMateria.label}
                            </span>
                            {livro.paginas && (
                              <span className="text-[10px] font-mono text-zinc-500">
                                • {livro.paginas} págs
                              </span>
                            )}
                          </div>

                          <p className="font-sans text-white text-sm sm:text-[15px] font-semibold leading-snug line-clamp-2">
                            {livro.titulo}
                          </p>

                          {livro.autor && (
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                              {livro.autor}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(livro);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white py-1 px-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            aria-label={isFav ? "Remover dos salvos" : "Salvar na estante"}
                          >
                            <Bookmark
                              className={cn(
                                "w-3.5 h-3.5 transition-colors",
                                isFav ? "fill-white text-white" : "text-zinc-400"
                              )}
                              strokeWidth={2}
                            />
                            <span>{isFav ? 'Salvo' : 'Salvar'}</span>
                          </button>

                          <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-200 group-hover:text-white px-3 py-1 rounded-full bg-white/10 group-hover:bg-white group-hover:text-zinc-950 transition-colors">
                            <span>Ler</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Paginação fluida para carregar mais obras */}
                {livrosFiltrados.length > visibleLimit && (
                  <div className="pt-3 pb-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((prev) => prev + 30)}
                      className="px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs font-medium active:scale-95 transition-all cursor-pointer"
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