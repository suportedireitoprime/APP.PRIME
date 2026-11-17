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

// Configuração do Carrossel Infinito Circular (Loop infinito Contínuo)
const CARROSSEL_REPEAT = 9;
const CARROSSEL_SET_SIZE = DEMAIS_CATEGORIAS_CARROSSEL.length;
const CARROSSEL_MID_SET = Math.floor(CARROSSEL_REPEAT / 2); // 4

const INFINITE_CATEGORIAS_CARROSSEL = Array.from({ length: CARROSSEL_REPEAT }, (_, setIdx) =>
  DEMAIS_CATEGORIAS_CARROSSEL.map((cat) => ({
    ...cat,
    uniqueKey: `cat-meio-set${setIdx}-${cat.id}`,
  }))
).flat();

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

  // Estado do carrossel do meio (sempre inicia centralizado no meio do bloco infinito)
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(() =>
    Math.floor(CARROSSEL_SET_SIZE / 2)
  );
  const carouselScrollerRef = useRef<HTMLDivElement>(null);
  const recenterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ao entrar na biblioteca, centraliza o carrossel no item do meio do set central
  useEffect(() => {
    const el = carouselScrollerRef.current;
    if (!el) return;
    const startIndex = CARROSSEL_MID_SET * CARROSSEL_SET_SIZE + Math.floor(CARROSSEL_SET_SIZE / 2);
    const timer = setTimeout(() => {
      const child = el.children[startIndex] as HTMLElement;
      if (child) {
        const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
        el.scrollTo({ left: target, behavior: 'instant' as ScrollBehavior });
      }
    }, 60);
    return () => clearTimeout(timer);
  }, []);

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

  // Manipuladores de rolagem e dots do carrossel do meio (Loop infinito contínuo e suave)
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
    const realIdx = best % CARROSSEL_SET_SIZE;
    setActiveCarouselIndex(realIdx);

    // Re-centralização suave e invisível para manter o loop verdadeiramente infinito
    if (recenterTimerRef.current) clearTimeout(recenterTimerRef.current);
    recenterTimerRef.current = setTimeout(() => {
      const currentSet = Math.floor(best / CARROSSEL_SET_SIZE);
      if (currentSet < 2 || currentSet > CARROSSEL_REPEAT - 3) {
        const targetIdx = CARROSSEL_MID_SET * CARROSSEL_SET_SIZE + realIdx;
        const targetChild = el.children[targetIdx] as HTMLElement;
        const currentChild = el.children[best] as HTMLElement;
        if (targetChild && currentChild) {
          const shift = targetChild.offsetLeft - currentChild.offsetLeft;
          el.scrollLeft += shift;
        }
      }
    }, 120);
  }, []);

  const scrollCarouselToIndex = useCallback((targetRealIndex: number) => {
    const el = carouselScrollerRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closestIdx = CARROSSEL_MID_SET * CARROSSEL_SET_SIZE + targetRealIndex;
    let closestDist = Infinity;
    for (let set = 1; set < CARROSSEL_REPEAT - 1; set++) {
      const idx = set * CARROSSEL_SET_SIZE + targetRealIndex;
      const child = el.children[idx] as HTMLElement;
      if (child) {
        const mid = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = idx;
        }
      }
    }
    const child = el.children[closestIdx] as HTMLElement;
    if (!child) return;
    const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({
      left: target,
      behavior: 'smooth',
    });
    setActiveCarouselIndex(targetRealIndex);
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

      {/* Conteúdo Principal com Estrutura Fluida e Organizada (Margem generosa e responsiva sem colar) */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-9 md:pt-12 mt-4 sm:mt-6 space-y-10 sm:space-y-14">
        {/* Banner Continuar Leitura no modelo de Resumos com capa flush */}
        <div className="mb-9 sm:mb-12">
          <BibliotecaContinuarLeituraBanner onAbrirLivro={onAbrirLivro} />
        </div>

        {/* ======================================================== */}
        {/* CARROSSEL DO MEIO: ACERVOS ESPECIAIS (Persuasivo e Enxuto) */}
        {/* ======================================================== */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#C084FC] to-[#7C3AED] shadow-[0_0_8px_rgba(168,85,247,0.6)] shrink-0" />
                <span className="truncate">ACERVOS ESPECIAIS</span>
              </h3>
            </div>
          </div>

          {/* Carrossel Horizontal Snap com Zoom & Destaque Central (Padrão Leis Em Alta) */}
          <div
            ref={carouselScrollerRef}
            onScroll={handleCarouselScroll}
            className="-mx-4 sm:-mx-6 md:-mx-8 px-[calc(50vw-68px)] sm:px-[calc(50vw-75px)] flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pt-3 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none items-center"
          >
            {INFINITE_CATEGORIAS_CARROSSEL.map((cat, idx) => {
              const realIdx = idx % CARROSSEL_SET_SIZE;
              const isActive = realIdx === activeCarouselIndex;
              const colecao = findColecao(cat.id);
              const coverUrl = colecao?.cover || bibliotecaCoverImg;
              const countVal = counts[cat.id] || cat.defaultCount;
              const CatIcon = cat.Icon;

              return (
                <div
                  key={cat.uniqueKey}
                  onClick={() => {
                    haptic.selection();
                    navigate(`/bibliotecas/${cat.id}`);
                  }}
                  className={`snap-center shrink-0 w-[136px] sm:w-[150px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform transition-all duration-300 ease-out active:scale-95 ${
                    isActive
                      ? 'scale-[1.08] sm:scale-[1.10] opacity-100 z-10'
                      : 'scale-[0.92] sm:scale-[0.93] opacity-65 hover:opacity-90 z-0'
                  }`}
                >
                  <div
                    className={`relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 transition-all duration-300 ${
                      isActive
                        ? 'shadow-[0_16px_36px_-6px_rgba(0,0,0,0.95)] ring-1.5 ring-white/30'
                        : 'shadow-[0_6px_16px_-4px_rgba(0,0,0,0.7)] ring-0'
                    }`}
                    style={{
                      boxShadow: isActive
                        ? '0 20px 42px -6px rgba(0, 0, 0, 0.98), 0 8px 18px -2px rgba(0, 0, 0, 0.92)'
                        : '0 6px 16px -4px rgba(0, 0, 0, 0.75)',
                    }}
                  >
                    <img
                      src={coverUrl}
                      alt={cat.title}
                      loading={idx < 5 ? 'eager' : 'lazy'}
                      decoding="async"
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isActive ? 'scale-105' : 'scale-100 group-hover:scale-105'
                      }`}
                    />

                    {/* Gradiente de profundidade para legibilidade e visual cinematográfico */}
                    <div
                      className={`absolute inset-0 transition-opacity duration-300 pointer-events-none ${
                        isActive
                          ? 'bg-gradient-to-t from-black/95 via-black/25 to-black/35'
                          : 'bg-gradient-to-t from-black/95 via-black/45 to-black/55'
                      }`}
                    />

                    {/* Ícone da Categoria no Topo à Esquerda com Pill Translúcida */}
                    <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                          isActive
                            ? 'bg-black/75 border border-white/25 scale-105'
                            : 'bg-black/60 border border-white/10'
                        }`}
                      >
                        <CatIcon className="w-3.5 h-3.5 text-white drop-shadow-sm" strokeWidth={2.2} />
                      </div>
                    </div>

                    {/* Seta no Topo à Direita para Ação Direta */}
                    <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all ${
                          isActive
                            ? 'bg-black/80 border border-white/30 text-white'
                            : 'bg-black/60 border border-white/15 text-white/80'
                        }`}
                      >
                        <ArrowUpRight
                          className={`w-3.5 h-3.5 transition-transform ${
                            isActive ? 'translate-x-0.5 -translate-y-0.5 text-white' : ''
                          }`}
                          strokeWidth={2.4}
                        />
                      </div>
                    </div>

                    {/* Rodapé do Card com Selo e Título com Tipografia Moderna e Refinada */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 flex flex-col justify-end pointer-events-none">
                      <span
                        className="self-start text-[9px] font-sans font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/80 border border-white/10 mb-1"
                        style={{ color: cat.corSecundaria }}
                      >
                        {countVal} {countVal === 1 ? 'OBRA' : 'OBRAS'}
                      </span>
                      <h4 className="font-sans font-extrabold text-[12px] sm:text-[13px] text-white uppercase tracking-wider leading-snug line-clamp-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)]">
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
                      ? "w-5 bg-white shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
                      : "w-1.5 bg-white/20 hover:bg-white/40"
                  }`}
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
        <section className="pt-5 sm:pt-7 pb-8 sm:pb-12">
          {/* Header da Seção: MATÉRIAS DE DIREITO com risco roxo oficial */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="font-sans text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
                  <span className="w-1 h-5 rounded-full bg-gradient-to-b from-[#C084FC] to-[#7C3AED] shadow-[0_0_8px_rgba(168,85,247,0.7)] shrink-0" />
                  <span className="truncate">MATÉRIAS DE DIREITO</span>
                </h2>
              </div>
            </div>
          </div>

          {/* Campo de Busca Rápida Idêntico a Audiobooks com Toque Roxo Crepuscular */}
          <div className="relative mb-4 group">
            <Search className="w-5 h-5 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors group-focus-within:text-purple-300 drop-shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar livro, autor ou tema em ${activeMateria.label}…`}
              className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#14121a]/95 border border-purple-500/25 text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400/40 transition-all shadow-lg shadow-black/60"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white cursor-pointer"
                aria-label="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Abas 3D Estilo Pasta com Linha Base e Fundo Roxo Crepuscular Oficial */}
          <div className="relative -mr-4 sm:-mr-6 overflow-x-auto no-scrollbar mb-5 border-b border-purple-500/25">
            <div className="flex w-max min-w-full items-end no-scrollbar h-11 sm:h-12 pt-1 pr-6 sm:pr-8">
              {MATERIAS_DIREITO_TABS.map((tab, index) => {
                const isActive = activeMateriaId === tab.id;
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
                        : "bg-[#141416] text-white/50 hover:bg-[#1A1824] shadow-[inset_0_-4px_10px_rgba(0,0,0,0.8)] hover:text-white border-white/10 hover:border-purple-500/30 opacity-80 font-medium"
                    )}
                    style={{
                      zIndex,
                      marginLeft: index > 0 ? "-10px" : "0",
                    }}
                  >
                    {/* Fundo Deslizante Ativo no Tom Roxo Oficial com Brilho e Efeito 3D */}
                    {isActive && (
                      <motion.div
                        layoutId="activeBibliotecaMateriaTabPill"
                        className="absolute inset-0 rounded-t-2xl border-x border-t z-0 overflow-hidden"
                        style={{
                          background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 50%, #4C1D95 100%)',
                          borderColor: '#A855F7',
                          boxShadow: 'inset 0 1px 4px rgba(255, 255, 255, 0.25)',
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
                          className="absolute inset-0 rounded-t-2xl border-x border-t pointer-events-none"
                          style={{ borderColor: '#C084FC' }}
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
                          ? "bg-black/35 text-purple-100 border border-purple-400/30 shadow-inner"
                          : "bg-white/5 text-white/40"
                      )}
                    >
                      {countNumber}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Linha de Base da Pasta Oficial com Transição Suave de Cor Roxa */}
            <motion.div
              className="min-w-full w-max h-0.5 relative z-20"
              style={{
                backgroundColor: '#8B5CF6',
              }}
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
                      style={{
                        background: 'linear-gradient(135deg, #4A1D96 0%, #31136A 55%, #1A083B 100%)',
                      }}
                      className="group relative flex items-stretch rounded-2xl overflow-hidden transition-all duration-300 border border-purple-500/25 hover:border-purple-400/50 shadow-[0_6px_20px_rgba(0,0,0,0.65)] hover:shadow-[0_8px_28px_rgba(124,58,237,0.35)] cursor-pointer select-none text-left w-full h-[142px] sm:h-[150px] transform-gpu will-change-transform"
                    >
                      {/* SVGs jurídicos decorativos ao fundo (idêntico ao Carrossel de Clássicos) */}
                      <svg
                        aria-hidden
                        viewBox="0 0 200 200"
                        className="pointer-events-none absolute -right-4 -bottom-6 w-[130px] h-[130px] text-white/[0.08]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M100 30 V170 M70 170 H130 M100 55 L55 95 M100 55 L145 95" strokeLinecap="round" />
                        <path d="M35 95 Q55 135 75 95 Z" />
                        <path d="M125 95 Q145 135 165 95 Z" />
                      </svg>
                      <svg
                        aria-hidden
                        viewBox="0 0 100 100"
                        className="pointer-events-none absolute top-2 right-14 w-[54px] h-[54px] text-white/[0.08]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      >
                        <path d="M18 78 L58 38" />
                        <rect x="52" y="20" width="30" height="14" rx="2" transform="rotate(45 67 27)" />
                        <path d="M10 88 H50" />
                      </svg>

                      {/* Capa do Livro à Esquerda (proporcional, com sombra tridimensional e fallback) */}
                      <div className="relative h-full w-[96px] sm:w-[104px] shrink-0 flex items-center justify-center px-2.5 z-[1]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Library className="w-8 h-8 text-white/20" />
                        </div>
                        <img
                          src={livro.capa ? directImg(livro.capa, 240) : bibliotecaCoverImg}
                          alt={livro.titulo}
                          loading={index < 6 ? "eager" : "lazy"}
                          decoding="async"
                          fetchPriority={index < 4 ? "high" : "auto"}
                          onError={(e) => {
                            e.currentTarget.src = bibliotecaCoverImg;
                          }}
                          className="relative h-[118px] sm:h-[124px] w-auto max-w-full object-contain rounded-md z-[2] group-hover:scale-105 transition-transform duration-300"
                          style={{
                            boxShadow:
                              '0 14px 26px -8px rgba(0,0,0,0.75), 0 6px 12px -4px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.2)',
                          }}
                        />
                      </div>

                      {/* Detalhes à Direita no Padrão Clássicos com Botão ↗ no Canto Superior */}
                      <div className="relative flex-1 min-w-0 flex flex-col justify-between p-3 sm:p-3.5 pr-10 z-[1]">
                        {/* Botão Circular ↗ no Topo Direito (como em Clássicos) */}
                        <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md group-hover:bg-purple-500/50 group-hover:scale-110 transition-all z-10">
                          <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="self-start flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white bg-black/40 backdrop-blur-sm border border-white/15">
                              <Library className="w-2.5 h-2.5" />
                              {activeMateria.label}
                            </span>
                            {livro.autor && (
                              <div className="flex items-center gap-1 text-[11px] text-white/80 truncate">
                                <Clock className="w-3 h-3 shrink-0 opacity-70" />
                                <span className="truncate">{livro.autor}</span>
                              </div>
                            )}
                          </div>

                          <p className="font-display text-white text-[13.5px] sm:text-[14.5px] font-semibold leading-snug line-clamp-2 drop-shadow-sm group-hover:text-purple-100 transition-colors">
                            {livro.titulo}
                          </p>
                        </div>

                        {/* Linha Inferior: Páginas + Favoritar + Botão Ler */}
                        <div className="flex items-center justify-between gap-2 pt-1 mt-auto">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[10px] sm:text-[10.5px] font-mono px-2 py-0.5 rounded-md bg-black/35 border border-purple-400/25 text-purple-200">
                              <BookOpen className="w-3 h-3 text-purple-300" />
                              <span className="font-bold">
                                {livro.paginas ? `${livro.paginas} págs` : 'PDF Integral'}
                              </span>
                            </span>

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
                                    : "text-white/40 hover:text-white"
                                )}
                                strokeWidth={2}
                              />
                            </button>
                          </div>

                          <div className="shrink-0">
                            <span className="text-[10.5px] uppercase tracking-wide font-bold text-white px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all duration-200 shadow-md flex items-center gap-1 border border-purple-400/30">
                              <BookOpen className="w-3 h-3 stroke-[2.2]" />
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