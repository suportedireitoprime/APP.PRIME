import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, Search, X, Clock, Star, Bookmark, BookOpen, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { directImg, prefetchImages } from '@/lib/cdnImg';
import { assetUrl } from '@/lib/assetUrl';
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
import { styleForArea } from '@/lib/bibliotecaIcons';
import { getAreaCover } from '@/lib/areasDireitoCovers';
import BibliotecaHero from './BibliotecaHero';
import BibliotecaAtalhosBar from './BibliotecaAtalhosBar';
import BibliotecaContinuarLeituraBanner from './BibliotecaContinuarLeituraBanner';
import RecomendacoesCarousel from './RecomendacoesCarousel';

import bibliotecaCoverImg from '@/assets/biblioteca-cover.webp';
import salvosImg from '@/assets/covers/resumos-philosophers-hero.webp';

interface CategoryItem {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  coverImg: string;
}

const getCategoryCover = (id: string): string => {
  if (id === 'juridico') return bibliotecaCoverImg;
  if (id === 'salvos') return salvosImg;
  const col = findColecao(id);
  return col?.cover || bibliotecaCoverImg;
};

// Categorias complementares do acervo (abaixo de Áreas do Direito e Clássicos)
const CATEGORIES: CategoryItem[] = [
  {
    id: 'oab',
    label: 'OAB & Preparatório',
    title: 'OAB & Preparatório',
    subtitle: 'Doutrina esquematizada, prática forense e os pontos mais exigidos no Exame de Ordem.',
    coverImg: getCategoryCover('oab'),
  },
  {
    id: 'fora-da-toga',
    label: 'Fora da Toga',
    title: 'Fora da Toga',
    subtitle: 'Filosofia, psicologia, história, literatura e comportamento para formar juristas de alta cultura.',
    coverImg: getCategoryCover('fora-da-toga'),
  },
  {
    id: 'lideranca',
    label: 'Liderança',
    title: 'Liderança & Gestão',
    subtitle: 'Estratégia, inteligência emocional e autoridade para advogados, servidores e magistrados.',
    coverImg: getCategoryCover('lideranca'),
  },
  {
    id: 'portugues',
    label: 'Português',
    title: 'Português Forense',
    subtitle: 'Redação jurídica de alto nível, gramática forense, pontuação e clareza para petições e provas.',
    coverImg: getCategoryCover('portugues'),
  },
  {
    id: 'pesquisa',
    label: 'Pesquisa',
    title: 'Pesquisa Acadêmica',
    subtitle: 'Normas ABNT, elaboração de teses, dissertações e artigos científicos de excelência.',
    coverImg: getCategoryCover('pesquisa'),
  },
  {
    id: 'oratoria',
    label: 'Oratória',
    title: 'Oratória Jurídica',
    subtitle: 'Retórica clássica, sustentação oral em tribunais e técnicas avançadas de persuasão.',
    coverImg: getCategoryCover('oratoria'),
  },
  {
    id: 'salvos',
    label: 'Salvos',
    title: 'Sua Estante',
    subtitle: 'Livros e manuais que você favoritou para leitura contínua e consulta diária.',
    coverImg: salvosImg,
  },
  {
    id: 'juridico',
    label: 'Todas as Áreas',
    title: 'Grandes Áreas do Direito',
    subtitle: 'Visão em lista de todas as 27 matérias e doutrinas jurídicas.',
    coverImg: bibliotecaCoverImg,
  },
];

// 27 Áreas canônicas com contagens de base de alta fidelidade
const DEFAULT_AREAS: { name: string; count: number }[] = [
  { name: 'Direito Constitucional', count: 45 },
  { name: 'Direito Penal', count: 44 },
  { name: 'Direito Processual Penal', count: 22 },
  { name: 'Direito Civil', count: 56 },
  { name: 'Direito Processual Civil', count: 51 },
  { name: 'Direito Administrativo', count: 26 },
  { name: 'Direito do Trabalho', count: 29 },
  { name: 'Direito Processual do Trabalho', count: 11 },
  { name: 'Direito Tributário', count: 39 },
  { name: 'Direitos Humanos', count: 7 },
  { name: 'Direito Empresarial', count: 12 },
  { name: 'Direito Previdenciário', count: 15 },
  { name: 'Direito Ambiental', count: 7 },
  { name: 'Direito Financeiro', count: 16 },
  { name: 'Teoria e Filosofia do Direito', count: 17 },
  { name: 'Lei Penal Especial', count: 14 },
  { name: 'Políticas Públicas', count: 14 },
  { name: 'Revisão OAB', count: 12 },
  { name: 'Português', count: 11 },
  { name: 'Direito Internacional Público', count: 10 },
  { name: 'Prática Profissional', count: 8 },
  { name: 'Direito Concorrencial', count: 7 },
  { name: 'Direito Urbanístico', count: 6 },
  { name: 'Formação Complementar', count: 5 },
  { name: 'Direito Internacional Privado', count: 2 },
  { name: 'Direito Desportivo', count: 2 },
  { name: 'Pesquisa Científica', count: 2 },
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

const getColecaoNome = (colecaoId: string): string => {
  const c = findColecao(colecaoId);
  return c?.label || 'Obra';
};

interface BibliotecaMobileContentProps {
  counts: Record<string, number>;
  onAbrirLivro: (livro: LivroNormalizado) => void;
  onAbrirCustomPdf: (titulo: string, url: string) => void;
  onAbrirMateria: (materia: string) => void;
}

export const BibliotecaMobileContent: React.FC<BibliotecaMobileContentProps> = ({
  counts,
  onAbrirLivro,
  onAbrirCustomPdf,
  onAbrirMateria,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('oab');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(30);
  const [favoriteSnapshots, setFavoriteSnapshots] = useState<LivroSnapshot[]>(() => getFavoritos());

  const colecoesVisiveis = useVisibleColecoes();

  // Reset do limite visível ao trocar de categoria ou pesquisa
  useEffect(() => {
    setVisibleLimit(30);
  }, [activeCategory, searchQuery]);

  // Categoria ativa atual
  const currentCategory = useMemo(() => {
    return CATEGORIES.find((c) => c.id === activeCategory) || CATEGORIES[0];
  }, [activeCategory]);

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

  const allLivros = useMemo(() => {
    return Object.values(booksByColecao).flat();
  }, [booksByColecao]);

  // Lista dinâmica e atualizada das Áreas do Direito
  const areasList = useMemo(() => {
    const areasLivros = booksByColecao['areas'] || [];
    if (areasLivros.length === 0) return DEFAULT_AREAS;

    const countMap: Record<string, number> = {};
    areasLivros.forEach((l) => {
      if (l.area) {
        countMap[l.area] = (countMap[l.area] || 0) + 1;
      }
    });

    return DEFAULT_AREAS.map((a) => {
      const direct = countMap[a.name];
      if (direct !== undefined) return { ...a, count: direct };

      const foundKey = Object.keys(countMap).find((k) => norm(k) === norm(a.name));
      if (foundKey) return { ...a, count: countMap[foundKey] };

      return a;
    });
  }, [booksByColecao]);

  // Pré-aquecimento das capas das Áreas do Direito (0ms)
  useEffect(() => {
    areasList.slice(0, 14).forEach((item) => {
      const coverData = getAreaCover(item.name);
      const url = coverData?.cover || bibliotecaCoverImg;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [areasList]);

  // Filtragem das Áreas no modo de lista
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areasList;
    const q = norm(searchQuery);
    const tokens = q.split(' ').filter(Boolean);
    return areasList.filter((a) => {
      const target = norm(a.name);
      return tokens.every((t) => target.includes(t));
    });
  }, [areasList, searchQuery]);

  // Filtragem dos livros nas demais categorias
  const filteredLivros = useMemo(() => {
    if (activeCategory === 'juridico') return [];

    let list: LivroNormalizado[] = [];
    if (activeCategory === 'salvos') {
      list = allLivros.filter((l) => favoriteIds.has(`${l.colecaoId}:${l.id}`));
    } else {
      list = booksByColecao[activeCategory] || [];
    }

    if (searchQuery.trim()) {
      const q = norm(searchQuery);
      const tokens = q.split(' ').filter(Boolean);
      list = list.filter((l) => {
        const haystack = `${norm(l.titulo)} ${norm(l.autor)} ${norm(l.area)} ${norm(l.sobre)}`;
        return tokens.every((t) => haystack.includes(t));
      });
    }

    return list;
  }, [activeCategory, allLivros, booksByColecao, favoriteIds, searchQuery]);

  const visibleLivros = useMemo(() => {
    return filteredLivros.slice(0, visibleLimit);
  }, [filteredLivros, visibleLimit]);

  // Pré-aquecimento das capas dos livros visíveis
  useEffect(() => {
    if (!visibleLivros || visibleLivros.length === 0) return;
    const urls = visibleLivros
      .slice(0, 20)
      .map((l) => (l.capa ? directImg(l.capa) : null))
      .filter(Boolean) as string[];
    prefetchImages(urls);
  }, [visibleLivros]);

  const handleToggleFavorite = useCallback((livro: LivroNormalizado) => {
    haptic.selection();
    const now = toggleFavorito(livro);
    setFavoriteSnapshots(getFavoritos());
    toast.success(now ? 'Livro salvo na sua estante!' : 'Livro removido dos salvos');
  }, []);

  return (
    <div className="relative w-full">
      {/* Hospeda os sheets e modais acionados pelos atalhos do hero */}
      <BibliotecaAtalhosBar
        onAbrirLivro={onAbrirLivro}
        onAbrirCustomPdf={onAbrirCustomPdf}
      />

      {/* Hero Padrão Resumos / Audiobooks com Painel Vermelho e 4 Atalhos */}
      <BibliotecaHero onAbrirCustomPdf={() => onAbrirCustomPdf('Meus PDFs', '')} />

      {/* Conteúdo Principal com Estrutura Fluida e Organizada */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 mt-4 sm:mt-6 space-y-6">
        {/* Banner Continuar Leitura */}
        <BibliotecaContinuarLeituraBanner onAbrirLivro={onAbrirLivro} />

        {/* ======================================================== */}
        {/* SEÇÃO 1: ÁREAS DO DIREITO (Onde no Resumos fica EM ALTA) */}
        {/* ======================================================== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-sans text-white text-[15px] sm:text-[16px] font-bold flex items-center gap-2 uppercase tracking-wider">
                <span className="w-1 h-5 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">ÁREAS DO DIREITO</span>
              </h3>
              <p className="text-white/60 text-[11.5px] sm:text-[12px] leading-snug ml-3">
                Doutrinas, manuais e práticas organizados pelas grandes matérias
              </p>
            </div>
          </div>

          {/* Carrossel Horizontal Fluido com Capas 3:4 */}
          <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
            {areasList.map((item, idx) => {
              const coverData = getAreaCover(item.name);
              const coverUrl = coverData?.cover || bibliotecaCoverImg;

              return (
                <div
                  key={`area-card-${item.name}`}
                  onClick={() => {
                    haptic.selection();
                    onAbrirMateria(item.name);
                  }}
                  className="snap-start shrink-0 w-[128px] sm:w-[142px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform active:scale-95 transition-transform duration-150"
                >
                  <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 group-hover:border-rose-500/50 transition-all shadow-md group-hover:shadow-rose-950/40">
                    <img
                      src={coverUrl}
                      alt={item.name}
                      loading={idx < 5 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                  </div>

                  <p className="font-sans font-bold text-xs sm:text-[13px] text-white group-hover:text-rose-300 transition-colors line-clamp-2 mt-2 leading-snug">
                    {item.name}
                  </p>
                  <p className="text-[10.5px] text-white/50 truncate mt-0.5">
                    {item.count ? `${item.count} ${item.count === 1 ? 'obra' : 'obras'}` : 'Acervo completo'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SEÇÃO 2: CARROSSEL VERMELHO ANTIGO DE CLÁSSICOS          */}
        {/* ======================================================== */}
        <section className="pt-1">
          <RecomendacoesCarousel onAbrirLivro={onAbrirLivro} />
        </section>

        {/* ======================================================== */}
        {/* SEÇÃO 3: OUTRAS CATEGORIAS DO ACERVO                     */}
        {/* ======================================================== */}
        <section className="pt-2 space-y-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.22em] text-rose-400 font-bold">
                OUTRAS CATEGORIAS DO ACERVO
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1 h-6 rounded-full bg-rose-500" />
                <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  {currentCategory.title}
                </h2>
              </div>
              <p className="text-sm text-white/60 mt-1 ml-3 leading-snug">
                {currentCategory.subtitle}
              </p>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-400 font-sans self-end pb-1 shrink-0">
              {activeCategory === 'juridico'
                ? `${filteredAreas.length} áreas`
                : `${filteredLivros.length} obras`}
            </span>
          </div>

          {/* Campo de Busca Rápida Idêntico a Resumos */}
          <div className="relative">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeCategory === 'juridico'
                  ? 'Buscar área jurídica...'
                  : `Buscar em ${currentCategory.label} ou acervo…`
              }
              className="w-full pl-11 pr-10 h-14 text-sm sm:text-base rounded-2xl bg-[#141416] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-rose-500/60 transition-colors shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                aria-label="Limpar pesquisa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Abas e Chips de Filtragem de Categorias */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    haptic.selection();
                    setActiveCategory(cat.id);
                  }}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer ${
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-md font-bold'
                      : 'bg-[#18181B] text-zinc-300 hover:text-white border border-white/10 hover:bg-zinc-800'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Conteúdo da Categoria Selecionada */}
          <div className="pt-1">
            {activeCategory === 'juridico' ? (
              /* LISTAGEM DE TODAS AS ÁREAS DO DIREITO */
              <div className="divide-y divide-white/[0.08]">
                {filteredAreas.length === 0 ? (
                  <div className="py-14 text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">
                      Nenhuma área encontrada para "{searchQuery}"
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition"
                    >
                      Limpar busca
                    </button>
                  </div>
                ) : (
                  filteredAreas.map((area) => {
                    const s = styleForArea(area.name);
                    const Icon = s.icon;
                    return (
                      <div
                        key={area.name}
                        onClick={() => {
                          haptic.selection();
                          onAbrirMateria(area.name);
                        }}
                        className="flex items-center gap-3.5 sm:gap-4 py-3.5 sm:py-4 cursor-pointer group hover:bg-white/[0.04] px-2 rounded-2xl transition-all active:scale-[0.99]"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#27272A] transition-all shadow-sm">
                          <Icon className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.8} />
                        </div>

                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="font-bold text-[15px] sm:text-base text-white leading-snug truncate group-hover:text-rose-200 transition-colors font-sans">
                            {area.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/5">
                              {area.count ? `${area.count} ${area.count === 1 ? 'obra' : 'obras'}` : 'Acervo completo'}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium truncate">
                              Doutrina e prática forense
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              /* LISTAGEM DOS LIVROS (OAB, Fora da Toga, Liderança, Português, Salvos, etc.) */
              <div className="divide-y divide-white/[0.08]">
                {filteredLivros.length === 0 ? (
                  <div className="py-14 text-center px-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-zinc-300">
                      {activeCategory === 'salvos'
                        ? 'Você ainda não possui livros salvos na sua estante.'
                        : `Nenhum livro encontrado para "${searchQuery}".`}
                    </p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition"
                      >
                        Limpar busca
                      </button>
                    )}
                  </div>
                ) : (
                  visibleLivros.map((livro, idx) => {
                    const isSaved = favoriteIds.has(`${livro.colecaoId}:${livro.id}`);
                    const localCover = livro.capa ? assetUrl(livro.capa) : null;
                    const isLocal = Boolean(localCover && !/^https?:\/\//i.test(localCover));
                    const coverSrc = isLocal ? localCover! : (livro.capa ? directImg(livro.capa) : bibliotecaCoverImg);

                    return (
                      <div
                        key={`${livro.colecaoId}:${livro.id}`}
                        onClick={() => {
                          haptic.selection();
                          onAbrirLivro(livro);
                        }}
                        className="flex items-center gap-3.5 sm:gap-4 py-3.5 sm:py-4 cursor-pointer group hover:bg-white/[0.04] px-2 rounded-2xl transition-all active:scale-[0.99]"
                      >
                        {/* Capa em miniatura (proporção 3:4) */}
                        <div className="relative w-[56px] h-[74px] sm:w-[64px] sm:h-[84px] shrink-0 rounded-xl overflow-hidden bg-[#18181B] border border-white/10 shadow-md">
                          <img
                            src={coverSrc}
                            alt={livro.titulo}
                            loading={idx < 8 ? 'eager' : 'lazy'}
                            fetchPriority={idx < 4 ? 'high' : 'auto'}
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = bibliotecaCoverImg;
                            }}
                          />
                        </div>

                        {/* Detalhes do Livro */}
                        <div className="flex-1 min-w-0 pr-1">
                          <h4 className="font-bold text-sm sm:text-base text-white leading-snug line-clamp-2 group-hover:text-rose-200 transition-colors font-sans">
                            {livro.titulo}
                          </h4>
                          <p className="text-xs text-zinc-400 font-medium mt-1 truncate font-sans">
                            {livro.autor || livro.area || getColecaoNome(livro.colecaoId)}
                          </p>
                          <div className="flex items-center gap-2.5 mt-1.5 text-xs text-zinc-400 font-sans">
                            <span className="flex items-center gap-1 text-zinc-400">
                              <Clock className="w-3.5 h-3.5 text-zinc-500" />
                              <span>
                                {livro.minutosLeitura
                                  ? `${livro.minutosLeitura} min`
                                  : livro.paginas
                                  ? `${livro.paginas} págs`
                                  : '15 min'}
                              </span>
                            </span>
                            <span className="text-zinc-600">•</span>
                            <span className="flex items-center gap-1 font-semibold text-zinc-300">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>4.9</span>
                            </span>
                            {livro.area && (
                              <>
                                <span className="text-zinc-600">•</span>
                                <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[10.5px] text-zinc-300 border border-white/5 truncate max-w-[120px]">
                                  {livro.area}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Botão de Salvar na Estante */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(livro);
                          }}
                          aria-label="Salvar livro"
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 hover:bg-white/10 active:scale-90 text-zinc-400 hover:text-white transition-all cursor-pointer"
                        >
                          <Bookmark
                            className={`w-5 h-5 transition-colors ${
                              isSaved ? 'fill-amber-400 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Paginação fluida para carregar mais obras */}
            {activeCategory !== 'juridico' && filteredLivros.length > visibleLimit && (
              <div className="pt-6 pb-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 30)}
                  className="px-6 py-2.5 rounded-full bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs sm:text-sm font-semibold active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Carregar mais obras ({filteredLivros.length - visibleLimit} restantes)
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
