import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, Search, X, Clock, Star, Bookmark, BookOpen, ArrowUpRight, Library } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';
import { directImg, cdnImg, prefetchImages } from '@/lib/cdnImg';
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
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import BibliotecaHero from './BibliotecaHero';
import BibliotecaAtalhosBar from './BibliotecaAtalhosBar';
import BibliotecaContinuarLeituraBanner from './BibliotecaContinuarLeituraBanner';
import FerramentasLivrosCarrossel from '@/components/ferramentas/FerramentasLivrosCarrossel';

import bibliotecaCoverImg from '@/assets/biblioteca-cover.webp';

// Categorias com alternância de menu e design em cards idênticos aos Clássicos
interface CategoriaAcervoConfig {
  id: string;
  tabLabel: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  gradient: string;
  accentColor: string;
  glowColor: string;
  badgeBg: string;
}

const CATEGORIAS_ACERVO: CategoriaAcervoConfig[] = [
  {
    id: 'fora-da-toga',
    tabLabel: 'Fora da Toga',
    title: 'FORA DA TOGA',
    subtitle: 'Filosofia, psicologia, história, literatura e comportamento',
    badgeLabel: 'Fora da Toga',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #0f172a 100%)', // Indigo / Noite
    accentColor: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
  },
  {
    id: 'lideranca',
    tabLabel: 'Liderança',
    title: 'LIDERANÇA & GESTÃO',
    subtitle: 'Estratégia, inteligência emocional e autoridade profissional',
    badgeLabel: 'Liderança',
    gradient: 'linear-gradient(135deg, #14532d 0%, #166534 55%, #052e16 100%)', // Verde Imperial
    accentColor: '#4ade80',
    glowColor: 'rgba(74, 222, 128, 0.4)',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'portugues',
    tabLabel: 'Português Forense',
    title: 'PORTUGUÊS FORENSE',
    subtitle: 'Redação jurídica de alto nível, gramática e clareza',
    badgeLabel: 'Português',
    gradient: 'linear-gradient(135deg, #78350f 0%, #92400e 55%, #451a03 100%)', // Âmbar Dourado
    accentColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'oratoria',
    tabLabel: 'Oratória',
    title: 'ORATÓRIA JURÍDICA',
    subtitle: 'Retórica clássica, sustentação oral e persuasão',
    badgeLabel: 'Oratória',
    gradient: 'linear-gradient(135deg, #581c87 0%, #6b21a8 55%, #3b0764 100%)', // Púrpura Nobre
    accentColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.4)',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    id: 'pesquisa',
    tabLabel: 'Pesquisa Acadêmica',
    title: 'PESQUISA ACADÊMICA',
    subtitle: 'Normas ABNT, teses, dissertações e artigos científicos',
    badgeLabel: 'Pesquisa',
    gradient: 'linear-gradient(135deg, #0e7490 0%, #155e75 55%, #083344 100%)', // Ciano / Oceano
    accentColor: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
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
  const [activeTab, setActiveTab] = useState<string>('fora-da-toga');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(24);
  const [favoriteSnapshots, setFavoriteSnapshots] = useState<LivroSnapshot[]>(() => getFavoritos());

  const colecoesVisiveis = useVisibleColecoes();

  // Reset do limite visível ao alternar menu ou pesquisa
  useEffect(() => {
    setVisibleLimit(24);
  }, [activeTab, searchQuery]);

  // Categoria ativa atual
  const activeCategoria = useMemo(() => {
    return CATEGORIAS_ACERVO.find((c) => c.id === activeTab) || CATEGORIAS_ACERVO[0];
  }, [activeTab]);

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

  // Livros da categoria selecionada com suporte à busca
  const livrosDaCategoria = useMemo(() => {
    const list = booksByColecao[activeCategoria.id] || [];
    if (!searchQuery.trim()) return list;

    const q = norm(searchQuery);
    const tokens = q.split(' ').filter(Boolean);
    return list.filter((l) => {
      const target = norm(`${l.titulo} ${l.autor || ''} ${l.sobre || ''}`);
      return tokens.every((t) => target.includes(t));
    });
  }, [booksByColecao, activeCategoria.id, searchQuery]);

  const visibleLivros = useMemo(() => {
    return livrosDaCategoria.slice(0, visibleLimit);
  }, [livrosDaCategoria, visibleLimit]);

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
      const discTheme = getDisciplinaVisualTheme(item.name);
      const url = discTheme?.fundoAssetUrl || getAreaCover(item.name)?.cover || bibliotecaCoverImg;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [areasList]);

  // Pré-aquecimento das capas dos livros da categoria ativa
  useEffect(() => {
    if (!livrosDaCategoria || livrosDaCategoria.length === 0) return;
    const urls = livrosDaCategoria
      .slice(0, 16)
      .map((l) => (l.capa ? directImg(l.capa) : null))
      .filter(Boolean) as string[];
    prefetchImages(urls);
  }, [livrosDaCategoria]);

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
        {/* Banner Continuar Leitura com margem de respiro ajustada */}
        <div className="mb-6">
          <BibliotecaContinuarLeituraBanner onAbrirLivro={onAbrirLivro} />
        </div>

        {/* ======================================================== */}
        {/* SEÇÃO 1: ÁREAS DO DIREITO (Carrossel Horizontal 3:4)     */}
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

          {/* Carrossel Horizontal Fluido com Capas 3:4 das Aulas Interativas */}
          <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none">
            {areasList.map((item, idx) => {
              const discTheme = getDisciplinaVisualTheme(item.name);
              const coverUrl = discTheme?.fundoAssetUrl || getAreaCover(item.name)?.cover || bibliotecaCoverImg;
              const corTema = discTheme?.primary || '#e11d48';
              const corHighlight = discTheme?.highlight || '#ffe4e6';
              const AreaIcon = styleForArea(item.name).icon || BookOpen;

              // Remove a palavra "Direito" do nome completo sem abreviar nada (ex: "Direito Processual Penal" -> "Processual Penal")
              const nomeLimpo = item.name.replace(/^Direito\s+/i, '').trim();

              return (
                <div
                  key={`area-card-${item.name}`}
                  onClick={() => {
                    haptic.selection();
                    onAbrirMateria(item.name);
                  }}
                  className="snap-start shrink-0 w-[136px] sm:w-[150px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu will-change-transform active:scale-95 transition-transform duration-150"
                >
                  <div 
                    className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-zinc-950 border transition-all duration-300 shadow-md group-hover:shadow-xl"
                    style={{
                      borderColor: `${corTema}55`,
                      boxShadow: `0 10px 24px -4px rgba(0,0,0,0.85), 0 0 16px ${corTema}30, inset 0 1px 1px rgba(255,255,255,0.15)`,
                    }}
                  >
                    <img
                      src={coverUrl}
                      alt={item.name}
                      loading={idx < 5 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradiente de profundidade para legibilidade e visual das Aulas Interativas */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/40" />

                    {/* Ícone SVG de Livro no Topo à Esquerda com Pill Translúcida */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <div 
                        className="w-7 h-7 rounded-xl bg-black/65 backdrop-blur-md border flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                        style={{
                          borderColor: `${corTema}60`,
                        }}
                      >
                        <AreaIcon className="w-3.5 h-3.5 text-white drop-shadow-sm" strokeWidth={2.2} />
                      </div>
                    </div>

                    {/* Seta no Topo à Direita para Ação Direta */}
                    <div className="absolute top-2.5 right-2.5 z-10">
                      <div 
                        className="w-7 h-7 rounded-full bg-black/65 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg group-hover:border-white/40 group-hover:bg-black/80 transition-all"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 text-white/90 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.4} />
                      </div>
                    </div>

                    {/* Título e Badge Estilo Aulas Interativas no Rodapé da Capa (Sem 'Direito' e Sem Abreviar) */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 flex flex-col justify-end">
                      <span 
                        className="self-start text-[9px] font-mono font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-black/75 border border-white/10 mb-1"
                        style={{ color: corHighlight }}
                      >
                        {item.count ? `${item.count} ${item.count === 1 ? 'OBRA' : 'OBRAS'}` : 'ACERVO'}
                      </span>
                      <h4 className="font-serif font-black text-xs sm:text-[13px] text-white uppercase leading-tight line-clamp-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                        {nomeLimpo}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* SEÇÃO 2: CARROSSEL VERMELHO DE CLÁSSICOS                  */}
        {/* ======================================================== */}
        <section className="pt-1">
          <FerramentasLivrosCarrossel onAbrirLivro={onAbrirLivro} />
        </section>

        {/* ======================================================== */}
        {/* SEÇÃO 3: LISTA COM MENU DE ALTERNÂNCIA & CARDS CLÁSSICOS */}
        {/* ======================================================== */}
        <section className="pt-2 space-y-4 pb-12">
          {/* Cabeçalho da Categoria com Indicador e Contador */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold" style={{ color: activeCategoria.accentColor }}>
                OUTRAS CATEGORIAS DO ACERVO
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span 
                  className="w-1 h-6 rounded-full shrink-0" 
                  style={{ backgroundColor: activeCategoria.accentColor }} 
                />
                <h2 className="font-sans text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
                  {activeCategoria.title}
                </h2>
              </div>
              <p className="text-sm text-white/60 mt-1 ml-3 leading-snug">
                {activeCategoria.subtitle}
              </p>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-zinc-400 font-sans self-end pb-1 shrink-0">
              {`${livrosDaCategoria.length} ${livrosDaCategoria.length === 1 ? 'obra' : 'obras'}`}
            </span>
          </div>

          {/* Campo de Busca Rápida na Categoria */}
          <div className="relative">
            <Search className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar em ${activeCategoria.tabLabel}...`}
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

          {/* Menu de Alternância de Categorias (Abas em Pills com Cores Exclusivas) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIAS_ACERVO.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    haptic.selection();
                    setActiveTab(cat.id);
                  }}
                  style={{
                    backgroundColor: isActive ? `${cat.accentColor}26` : undefined,
                    borderColor: isActive ? `${cat.accentColor}80` : undefined,
                    color: isActive ? cat.accentColor : undefined,
                  }}
                  className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 cursor-pointer border ${
                    isActive
                      ? 'shadow-md font-bold'
                      : 'bg-[#18181B] text-zinc-300 hover:text-white border-white/10 hover:bg-zinc-800'
                  }`}
                >
                  {cat.tabLabel}
                </button>
              );
            })}
          </div>

          {/* Grid / Lista com os Cards Idênticos ao Design de Clássicos com a Cor da Categoria */}
          <div className="pt-2">
            {livrosDaCategoria.length === 0 ? (
              <div className="py-14 text-center px-4 rounded-2xl bg-[#141416] border border-white/5">
                <div className="w-12 h-12 rounded-2xl bg-[#18181B] border border-white/10 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-zinc-300">
                  {searchQuery
                    ? `Nenhum livro encontrado para "${searchQuery}".`
                    : `Nenhum livro disponível em ${activeCategoria.tabLabel}.`}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition cursor-pointer"
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {visibleLivros.map((livro, idx) => {
                  const meta = livro.minutosLeitura
                    ? `${livro.minutosLeitura} min de leitura`
                    : livro.paginas
                    ? `${livro.paginas} páginas`
                    : (livro.autor || activeCategoria.badgeLabel);

                  return (
                    <div
                      key={`${livro.colecaoId}:${livro.id}-${idx}`}
                      onClick={() => {
                        haptic.selection();
                        onAbrirLivro(livro);
                      }}
                      className="cursor-pointer active:scale-[0.99] text-left group"
                    >
                      <div
                        style={{
                          background: activeCategoria.gradient,
                          borderColor: `${activeCategoria.accentColor}40`,
                          boxShadow: `0 8px 20px -6px rgba(0,0,0,0.7), 0 0 16px ${activeCategoria.accentColor}18`,
                        }}
                        className="relative w-full h-[140px] overflow-hidden rounded-2xl transition-all duration-300 flex transform-gpu will-change-transform border shadow-md group-hover:scale-[1.01]"
                      >
                        {/* SVGs jurídicos decorativos ao fundo idênticos a Clássicos */}
                        <svg
                          aria-hidden
                          viewBox="0 0 200 200"
                          className="pointer-events-none absolute -right-4 -bottom-6 w-[130px] h-[130px] text-white/10"
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
                          className="pointer-events-none absolute top-2 right-14 w-[54px] h-[54px] text-white/10"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        >
                          <path d="M18 78 L58 38" />
                          <rect x="52" y="20" width="30" height="14" rx="2" transform="rotate(45 67 27)" />
                          <path d="M10 88 H50" />
                        </svg>

                        {/* Capa do livro à esquerda com sombra profunda */}
                        <div className="relative h-full w-[104px] shrink-0 flex items-center justify-center px-2.5 z-[1]">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Library className="w-8 h-8 text-white/30" />
                          </div>
                          {livro.capa && (
                            <img
                              src={cdnImg(livro.capa, 240)}
                              alt={livro.titulo}
                              loading={idx < 6 ? 'eager' : 'lazy'}
                              fetchPriority={idx < 2 ? 'high' : 'auto'}
                              decoding="async"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                              className="relative h-[118px] w-auto max-w-full object-contain rounded-md z-[2] group-hover:scale-105 transition-transform duration-300"
                              style={{
                                boxShadow:
                                  '0 14px 26px -8px rgba(0,0,0,0.75), 0 6px 12px -4px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.25)',
                              }}
                            />
                          )}
                        </div>

                        {/* Detalhes à direita: Selo, Tempo/Autor, Título e Seta */}
                        <div className="relative flex-1 min-w-0 flex flex-col justify-end px-3.5 pb-3 pt-3 z-[1]">
                          <span className="self-start flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white mb-1.5 bg-black/35 backdrop-blur-sm">
                            <Library className="w-2.5 h-2.5" />
                            {activeCategoria.badgeLabel}
                          </span>
                          <div className="flex items-center gap-1.5 mb-1 text-[11px] text-white/85 font-medium">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="truncate">{meta}</span>
                          </div>
                          <p className="font-display text-white text-[14px] font-semibold leading-snug line-clamp-2 drop-shadow-sm group-hover:text-white/95">
                            {livro.titulo}
                          </p>
                          <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md group-hover:bg-white/30 group-hover:scale-105 transition-all">
                            <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginação fluida para carregar mais obras */}
            {livrosDaCategoria.length > visibleLimit && (
              <div className="pt-6 pb-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="px-6 py-2.5 rounded-full bg-[#18181B] hover:bg-zinc-800 text-zinc-200 border border-white/10 text-xs sm:text-sm font-semibold active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  Carregar mais obras ({livrosDaCategoria.length - visibleLimit} restantes)
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
