import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, Search, X, Clock, Star, Bookmark, BookOpen, Layers, ArrowUpRight } from 'lucide-react';
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
import { getDisciplinaVisualTheme } from '@/lib/disciplinasTheme';
import BibliotecaHero from './BibliotecaHero';
import BibliotecaAtalhosBar from './BibliotecaAtalhosBar';
import BibliotecaContinuarLeituraBanner from './BibliotecaContinuarLeituraBanner';
import FerramentasLivrosCarrossel from '@/components/ferramentas/FerramentasLivrosCarrossel';
import BibliotecaCategoriaCarrossel from './BibliotecaCategoriaCarrossel';

import bibliotecaCoverImg from '@/assets/biblioteca-cover.webp';
import salvosImg from '@/assets/covers/resumos-philosophers-hero.webp';

// Categorias complementares do acervo exibidas em carrosséis temáticos individuais (sem OAB conforme solicitado)
const CATEGORY_CAROUSELS = [
  {
    id: 'fora-da-toga',
    title: 'FORA DA TOGA',
    subtitle: 'Filosofia, psicologia, história, literatura e comportamento',
    badgeLabel: 'Fora da Toga',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #0f172a 100%)', // Indigo / Noite
    accentColor: '#818cf8',
    glowColor: 'rgba(129, 140, 248, 0.4)',
    seeAllRoute: '/bibliotecas/fora-da-toga',
  },
  {
    id: 'lideranca',
    title: 'LIDERANÇA & GESTÃO',
    subtitle: 'Estratégia, inteligência emocional e autoridade profissional',
    badgeLabel: 'Liderança',
    gradient: 'linear-gradient(135deg, #14532d 0%, #166534 55%, #052e16 100%)', // Verde Imperial
    accentColor: '#4ade80',
    glowColor: 'rgba(74, 222, 128, 0.4)',
    seeAllRoute: '/bibliotecas/lideranca',
  },
  {
    id: 'portugues',
    title: 'PORTUGUÊS FORENSE',
    subtitle: 'Redação jurídica de alto nível, gramática e clareza',
    badgeLabel: 'Português',
    gradient: 'linear-gradient(135deg, #78350f 0%, #92400e 55%, #451a03 100%)', // Âmbar Dourado
    accentColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.4)',
    seeAllRoute: '/bibliotecas/portugues',
  },
  {
    id: 'oratoria',
    title: 'ORATÓRIA JURÍDICA',
    subtitle: 'Retórica clássica, sustentação oral e persuasão',
    badgeLabel: 'Oratória',
    gradient: 'linear-gradient(135deg, #581c87 0%, #6b21a8 55%, #3b0764 100%)', // Púrpura Nobre
    accentColor: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.4)',
    seeAllRoute: '/bibliotecas/oratoria',
  },
  {
    id: 'pesquisa',
    title: 'PESQUISA ACADÊMICA',
    subtitle: 'Normas ABNT, teses, dissertações e artigos científicos',
    badgeLabel: 'Pesquisa',
    gradient: 'linear-gradient(135deg, #0e7490 0%, #155e75 55%, #083344 100%)', // Ciano / Oceano
    accentColor: '#22d3ee',
    glowColor: 'rgba(34, 211, 238, 0.4)',
    seeAllRoute: '/bibliotecas/pesquisa',
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
  const [favoriteSnapshots, setFavoriteSnapshots] = useState<LivroSnapshot[]>(() => getFavoritos());

  const colecoesVisiveis = useVisibleColecoes();

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
      const discTheme = getDisciplinaVisualTheme(item.name);
      const url = discTheme?.fundoAssetUrl || getAreaCover(item.name)?.cover || bibliotecaCoverImg;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [areasList]);

  // Pré-aquecimento das capas dos livros visíveis
  useEffect(() => {
    if (!allLivros || allLivros.length === 0) return;
    const urls = allLivros
      .slice(0, 20)
      .map((l) => (l.capa ? directImg(l.capa) : null))
      .filter(Boolean) as string[];
    prefetchImages(urls);
  }, [allLivros]);

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
        <div className="mb-6"><BibliotecaContinuarLeituraBanner onAbrirLivro={onAbrirLivro} /></div>

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
        {/* SEÇÃO 2: CARROSSEL VERMELHO ANTIGO DE CLÁSSICOS          */}
        {/* ======================================================== */}
        <section className="pt-1">
          <FerramentasLivrosCarrossel onAbrirLivro={onAbrirLivro} />
        </section>

        {/* ======================================================== */}
        {/* SEÇÃO 3: CARROSSÉIS DE TODAS AS DEMAIS CATEGORIAS         */}
        {/* ======================================================== */}
        <section className="pt-2 space-y-6 pb-12">
          {CATEGORY_CAROUSELS.map((cfg) => {
            const livros = booksByColecao[cfg.id] || [];
            if (!livros.length) return null;
            return (
              <BibliotecaCategoriaCarrossel
                key={cfg.id}
                config={cfg}
                livros={livros}
                onAbrirLivro={onAbrirLivro}
              />
            );
          })}
        </section>
        </main>
    </div>
  );
};
