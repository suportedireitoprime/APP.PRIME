import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, X, Clock, Star, Bookmark, HardDrive, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useGoBack } from '@/hooks/useGoBack';
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
import { styleForArea } from '@/lib/bibliotecaIcons';
import BibliotecaActionShortcuts from './BibliotecaActionShortcuts';
import BibliotecaAtalhosBar from './BibliotecaAtalhosBar';
import BibliotecaContinuarLeituraBanner from './BibliotecaContinuarLeituraBanner';

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

const CATEGORIES: CategoryItem[] = [
  {
    id: 'juridico',
    label: 'Jurídico',
    title: 'Biblioteca Jurídica',
    subtitle: 'Acervo permanente com doutrinas, manuais e práticas organizados pelas grandes áreas.',
    coverImg: bibliotecaCoverImg,
  },
  {
    id: 'classicos',
    label: 'Clássicos',
    title: 'Obras fundamentais do pensamento jurídico.',
    subtitle: 'Os grandes marcos que moldaram a teoria da justiça, o direito e a evolução do Estado.',
    coverImg: getCategoryCover('classicos'),
  },
  {
    id: 'oab',
    label: 'OAB & Preparatório',
    title: 'Foco total na sua aprovação.',
    subtitle: 'Doutrina esquematizada, prática forense e os pontos mais exigidos no Exame de Ordem.',
    coverImg: getCategoryCover('oab'),
  },
  {
    id: 'fora-da-toga',
    label: 'Fora da Toga',
    title: 'Pense além dos autos do processo.',
    subtitle: 'Filosofia, psicologia, história, literatura e comportamento para formar juristas de alta cultura.',
    coverImg: getCategoryCover('fora-da-toga'),
  },
  {
    id: 'lideranca',
    label: 'Liderança',
    title: 'Gestão, autoridade e alta performance.',
    subtitle: 'Estratégia, inteligência emocional e liderança para advogados, servidores e magistrados.',
    coverImg: getCategoryCover('lideranca'),
  },
  {
    id: 'portugues',
    label: 'Português',
    title: 'A força e a precisão da linguagem.',
    subtitle: 'Redação jurídica de alto nível, gramática forense, pontuação e clareza para petições e provas.',
    coverImg: getCategoryCover('portugues'),
  },
  {
    id: 'pesquisa',
    label: 'Pesquisa',
    title: 'Rigor científico e método acadêmico.',
    subtitle: 'Normas ABNT, elaboração de teses, dissertações e artigos científicos de excelência.',
    coverImg: getCategoryCover('pesquisa'),
  },
  {
    id: 'oratoria',
    label: 'Oratória',
    title: 'A arte de convencer e falar com poder.',
    subtitle: 'Retórica clássica, sustentação oral em tribunais e técnicas avançadas de persuasão.',
    coverImg: getCategoryCover('oratoria'),
  },
  {
    id: 'salvos',
    label: 'Salvos',
    title: 'Sua estante de leituras.',
    subtitle: 'Livros e manuais que você favoritou para leitura contínua e consulta diária.',
    coverImg: salvosImg,
  },
];

// 27 Áreas canônicas com contagens de base de alta fidelidade
const DEFAULT_AREAS: { name: string; count: number }[] = [
  { name: 'Direito Civil', count: 56 },
  { name: 'Direito Processual Civil', count: 51 },
  { name: 'Direito Constitucional', count: 45 },
  { name: 'Direito Penal', count: 44 },
  { name: 'Direito Tributário', count: 39 },
  { name: 'Direito do Trabalho', count: 29 },
  { name: 'Direito Administrativo', count: 26 },
  { name: 'Direito Processual Penal', count: 22 },
  { name: 'Teoria e Filosofia do Direito', count: 17 },
  { name: 'Direito Financeiro', count: 16 },
  { name: 'Direito Previdenciário', count: 15 },
  { name: 'Lei Penal Especial', count: 14 },
  { name: 'Políticas Públicas', count: 14 },
  { name: 'Direito Empresarial', count: 12 },
  { name: 'Revisão OAB', count: 12 },
  { name: 'Direito Processual do Trabalho', count: 11 },
  { name: 'Português', count: 11 },
  { name: 'Direito Internacional Público', count: 10 },
  { name: 'Prática Profissional', count: 8 },
  { name: 'Direito Ambiental', count: 7 },
  { name: 'Direito Concorrencial', count: 7 },
  { name: 'Direitos Humanos', count: 7 },
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
  const goBack = useGoBack();
  const [activeCategory, setActiveCategory] = useState<string>('juridico');
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

  // Pré-carregamento imediato das capas dos banners de categorias (0ms)
  useEffect(() => {
    CATEGORIES.forEach((cat) => {
      if (cat.coverImg) {
        const img = new Image();
        img.decoding = 'async';
        img.src = cat.coverImg;
      }
    });
  }, []);

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

  // Filtragem das Áreas no modo Jurídico
  const filteredAreas = useMemo(() => {
    if (!searchQuery.trim()) return areasList;
    const q = norm(searchQuery);
    const tokens = q.split(' ').filter(Boolean);
    return areasList.filter((a) => {
      const target = norm(a.name);
      return tokens.every((t) => target.includes(t));
    });
  }, [areasList, searchQuery]);

  // Livros de Áreas que correspondem à busca de texto (caso a pessoa busque por título de livro em Jurídico)
  const matchingJuridicoBooks = useMemo(() => {
    if (activeCategory !== 'juridico' || !searchQuery.trim()) return [];
    const q = norm(searchQuery);
    const tokens = q.split(' ').filter(Boolean);
    const areasLivros = booksByColecao['areas'] || [];
    return areasLivros.filter((l) => {
      const haystack = `${norm(l.titulo)} ${norm(l.autor)} ${norm(l.area)} ${norm(l.sobre)}`;
      return tokens.every((t) => haystack.includes(t));
    });
  }, [activeCategory, booksByColecao, searchQuery]);

  // Filtragem dos livros normais (quando em outras abas: Clássicos, OAB, Salvos, etc.)
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

  // Livros visíveis com paginação incremental de performance
  const visibleLivros = useMemo(() => {
    return filteredLivros.slice(0, visibleLimit);
  }, [filteredLivros, visibleLimit]);

  // Pré-aquecimento das capas dos livros visíveis
  useEffect(() => {
    if (!visibleLivros || visibleLivros.length === 0) return;
    const urls = visibleLivros
      .slice(0, 30)
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-[calc(0.75rem+var(--sai-top,env(safe-area-inset-top,0px)))] pb-[calc(3rem+var(--sai-bottom,env(safe-area-inset-bottom,0px)))]">
      {/* Hospeda os sheets e modais ativados pelos atalhos do hero */}
      <BibliotecaAtalhosBar
        onAbrirLivro={onAbrirLivro}
        onAbrirCustomPdf={onAbrirCustomPdf}
      />

      {/* Top Header com estilo cinza escuro padrão */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goBack()}
            aria-label="Voltar"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-7 h-7" strokeWidth={2.4} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
            Biblioteca Jurídica
          </h1>
        </div>

        {/* Atalho elegante para Meus PDFs */}
        <button
          onClick={() => {
            haptic.selection();
            onAbrirCustomPdf('Meus PDFs', '');
          }}
          title="Meus PDFs"
          aria-label="Meus PDFs"
          className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer border border-white/10 bg-[#27272A] shadow-sm"
        >
          <HardDrive className="w-4 h-4 text-zinc-300" />
        </button>
      </div>

      {/* Barra de Pesquisa Arredondada (Cinza escuro padrão) */}
      <div className="relative mb-3.5">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeCategory === 'juridico'
              ? 'Buscar área jurídica ou livro...'
              : 'Buscar livros, autores ou temas...'
          }
          className="w-full rounded-2xl bg-[#27272A] border border-white/10 pl-11 pr-10 py-3 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/50 transition-all font-sans shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            aria-label="Limpar pesquisa"
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-zinc-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Menu de Alternância (Pílulas Horizontais no Topo - Cinza Padrão) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
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
                  ? 'bg-zinc-700 text-white border border-zinc-500 shadow-md font-bold'
                  : 'bg-[#27272A] text-zinc-300 hover:text-white border border-white/10 hover:bg-zinc-700/60'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Capa com as funções Leitura, Trilhas, Favoritos, Meus PDFs integradas */}
      <div className="mb-4">
        <div className="w-full aspect-[16/10] sm:aspect-[16/9] min-h-[200px] max-h-[250px] sm:max-h-[300px] rounded-3xl overflow-hidden shadow-2xl relative border border-white/10 bg-[#27272A] group">
          <img
            src={currentCategory.coverImg}
            alt={currentCategory.title}
            className="w-full h-full object-cover transform-gpu"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = bibliotecaCoverImg;
            }}
          />
          {/* Gradiente escuro para contraste das funções */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

          {/* AS FUNÇÕES DE VOLTA DENTRO DA CAPA */}
          <div className="absolute bottom-2.5 sm:bottom-3 left-2 sm:left-3 right-2 sm:right-3 z-10">
            <BibliotecaActionShortcuts />
          </div>
        </div>

        {/* Tipografia sob a Capa */}
        <div className="mt-4 px-0.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans">
            {currentCategory.title}
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 font-normal leading-relaxed mt-1 font-sans">
            {currentCategory.subtitle}
          </p>
        </div>
      </div>

      {/* Botão de Continuar Leitura idêntico ao do Vade Mecum Legislação */}
      <BibliotecaContinuarLeituraBanner onAbrirLivro={onAbrirLivro} />

      {/* Título da Seção & Contador */}
      <div className="flex items-center justify-between mt-6 mb-2.5 px-0.5">
        <h3 className="text-lg sm:text-xl font-bold text-white font-sans tracking-tight">
          {activeCategory === 'juridico'
            ? 'Áreas do Direito'
            : activeCategory === 'salvos'
            ? 'Sua Estante de Livros'
            : `Livros em ${currentCategory.label}`}
        </h3>
        <span className="text-xs sm:text-sm font-semibold text-zinc-400 font-sans">
          {activeCategory === 'juridico'
            ? `${filteredAreas.length} áreas disponíveis`
            : `${filteredLivros.length} obras`}
        </span>
      </div>

      {/* LISTA LA EM BAIXO: NO MODO 'JURÍDICO' SÃO AS ÁREAS DO DIREITO */}
      {activeCategory === 'juridico' ? (
        <div className="divide-y divide-white/[0.08]">
          {filteredAreas.length === 0 && matchingJuridicoBooks.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#27272A] border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-zinc-300">
                Nenhum resultado para "{searchQuery}"
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
                  className="flex items-center gap-3.5 sm:gap-4 py-3.5 sm:py-4 cursor-pointer group hover:bg-[#27272A]/50 px-2 rounded-2xl transition-all active:scale-[0.99]"
                >
                  {/* Ícone com badge estilizado */}
                  <div className="w-12 h-12 rounded-2xl bg-[#27272A] border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#323238] transition-all shadow-sm">
                    <Icon className="w-5 h-5" style={{ color: s.color }} strokeWidth={1.8} />
                  </div>

                  {/* Detalhes da Área */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-bold text-[15px] sm:text-base text-white leading-snug truncate group-hover:text-zinc-200 transition-colors font-sans">
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

                  {/* Seta Chevron para escolher a área */}
                  <div className="shrink-0 flex items-center text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-1 transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              );
            })
          )}

          {/* Se a pessoa digitou um termo e encontrou livros diretamente */}
          {searchQuery.trim() && matchingJuridicoBooks.length > 0 && (
            <div className="pt-6">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 px-2">
                Obras encontradas pelo termo ({matchingJuridicoBooks.length})
              </div>
              <div className="divide-y divide-white/[0.08]">
                {matchingJuridicoBooks.slice(0, 20).map((livro, idx) => {
                  const isSaved = favoriteIds.has(`${livro.colecaoId}:${livro.id}`);
                  const coverSrc = livro.capa ? directImg(livro.capa) : bibliotecaCoverImg;
                  return (
                    <div
                      key={`search-juridico-${livro.id}`}
                      onClick={() => {
                        haptic.selection();
                        onAbrirLivro(livro);
                      }}
                      className="flex items-center gap-3.5 sm:gap-4 py-3.5 sm:py-4 cursor-pointer group hover:bg-[#27272A]/50 px-2 rounded-2xl transition-all active:scale-[0.99]"
                    >
                      <div className="relative w-[56px] h-[74px] shrink-0 rounded-xl overflow-hidden bg-[#27272A] border border-white/10 shadow-md">
                        <img
                          src={coverSrc}
                          alt={livro.titulo}
                          loading={idx < 6 ? 'eager' : 'lazy'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 min-w-0 pr-1">
                        <h4 className="font-bold text-sm sm:text-base text-white leading-snug line-clamp-2 group-hover:text-zinc-200 transition-colors font-sans">
                          {livro.titulo}
                        </h4>
                        <p className="text-xs text-zinc-400 font-medium mt-1 truncate font-sans">
                          {livro.area || livro.autor || 'Doutrina'}
                        </p>
                      </div>
                      <button
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
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LISTA DE LIVROS NAS DEMAIS CATEGORIAS (Clássicos, OAB, Salvos, etc.) */
        <div className="divide-y divide-white/[0.08]">
          {filteredLivros.length === 0 ? (
            <div className="py-14 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-[#27272A] border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
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
              const coverSrc = livro.capa ? directImg(livro.capa) : bibliotecaCoverImg;

              return (
                <div
                  key={`${livro.colecaoId}:${livro.id}`}
                  onClick={() => {
                    haptic.selection();
                    onAbrirLivro(livro);
                  }}
                  className="flex items-center gap-3.5 sm:gap-4 py-3.5 sm:py-4 cursor-pointer group hover:bg-[#27272A]/50 px-2 rounded-2xl transition-all active:scale-[0.99]"
                >
                  {/* Capa em miniatura (proporção 3:4 com cantos arredondados) */}
                  <div className="relative w-[56px] h-[74px] sm:w-[64px] sm:h-[84px] shrink-0 rounded-xl overflow-hidden bg-[#27272A] border border-white/10 shadow-md">
                    <img
                      src={coverSrc}
                      alt={livro.titulo}
                      loading={idx < 10 ? 'eager' : 'lazy'}
                      fetchPriority={idx < 6 ? 'high' : 'auto'}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = bibliotecaCoverImg;
                      }}
                    />
                  </div>

                  {/* Detalhes do Livro */}
                  <div className="flex-1 min-w-0 pr-1">
                    <h4 className="font-bold text-sm sm:text-base text-white leading-snug line-clamp-2 group-hover:text-zinc-200 transition-colors font-sans">
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

      {/* Botão Carregar Mais Obras (Paginação fluida nas demais categorias) */}
      {activeCategory !== 'juridico' && filteredLivros.length > visibleLimit && (
        <div className="pt-6 pb-4 flex justify-center">
          <button
            onClick={() => setVisibleLimit((prev) => prev + 30)}
            className="px-6 py-2.5 rounded-full bg-[#27272A] hover:bg-zinc-700 text-zinc-200 border border-white/10 text-xs sm:text-sm font-semibold active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Carregar mais obras ({filteredLivros.length - visibleLimit} restantes)
          </button>
        </div>
      )}
    </div>
  );
};
