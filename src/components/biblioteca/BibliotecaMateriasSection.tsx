import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Search, X, Bookmark, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import { directImg, prefetchImages } from '@/lib/cdnImg';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import HomeSectionHeader from '@/components/vademecum/home/sections/HomeSectionHeader';
import { MATERIAS_DIREITO_TABS, normBiblioteca, type MateriaTabConfig } from './bibliotecaCatalogConfig';
import bibliotecaCoverImg from '@/assets/biblioteca-cover.webp';

interface BibliotecaMateriasSectionProps {
  areasLivros: LivroNormalizado[];
  favoriteIds: Set<string>;
  onAbrirLivro: (livro: LivroNormalizado) => void;
  onToggleFavorite: (livro: LivroNormalizado) => void;
}

export const BibliotecaMateriasSection: React.FC<BibliotecaMateriasSectionProps> = memo(({
  areasLivros,
  favoriteIds,
  onAbrirLivro,
  onToggleFavorite,
}) => {
  const [activeMateriaId, setActiveMateriaId] = useState<string>('administrativo');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [visibleLimit, setVisibleLimit] = useState<number>(30);

  useEffect(() => {
    setVisibleLimit(30);
  }, [activeMateriaId, searchQuery]);

  const activeMateria = useMemo(
    () => MATERIAS_DIREITO_TABS.find((t) => t.id === activeMateriaId) || MATERIAS_DIREITO_TABS[0],
    [activeMateriaId],
  );

  const countMap = useMemo(() => {
    const map: Record<string, number> = {};
    areasLivros.forEach((l) => {
      if (l.area) {
        const areaNorm = normBiblioteca(l.area).replace('previndenciario', 'previdenciario');
        map[areaNorm] = (map[areaNorm] || 0) + 1;
        map[l.area] = (map[l.area] || 0) + 1;
      }
    });
    return map;
  }, [areasLivros]);

  const getTabCount = useCallback(
    (tab: MateriaTabConfig) => {
      const targetNorm = normBiblioteca(tab.fullName).replace('previndenciario', 'previdenciario');
      const direct = countMap[targetNorm] || countMap[tab.fullName];
      if (direct !== undefined && direct > 0) return direct;
      return tab.defaultCount;
    },
    [countMap],
  );

  const livrosDaMateria = useMemo(() => {
    const targetNorm = normBiblioteca(activeMateria.fullName).replace('previndenciario', 'previdenciario');
    return areasLivros.filter((l) => {
      if (!l.area) return false;
      const aNorm = normBiblioteca(l.area).replace('previndenciario', 'previdenciario');
      return aNorm === targetNorm || aNorm.includes(targetNorm) || targetNorm.includes(aNorm);
    });
  }, [areasLivros, activeMateria]);

  const livrosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) return livrosDaMateria;
    const tokens = normBiblioteca(searchQuery).split(' ').filter(Boolean);
    return livrosDaMateria.filter((l) => {
      const target = normBiblioteca(`${l.titulo} ${l.autor || ''} ${l.sobre || ''}`);
      return tokens.every((t) => target.includes(t));
    });
  }, [livrosDaMateria, searchQuery]);

  const visibleLivros = useMemo(
    () => livrosFiltrados.slice(0, visibleLimit),
    [livrosFiltrados, visibleLimit],
  );

  useEffect(() => {
    if (visibleLivros.length === 0) return;
    const urls = visibleLivros
      .slice(0, 16)
      .map((l) => (l.capa ? directImg(l.capa, 240) : null))
      .filter(Boolean) as string[];
    prefetchImages(urls);
  }, [visibleLivros]);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <HomeSectionHeader
          title="MATÉRIAS DE DIREITO"
          subtitle={activeMateria.subtitulo}
        />
        <span className="text-xs text-zinc-500 font-mono shrink-0 pt-1">
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
      <div className="-mx-4 sm:-mx-6 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 select-none touch-pan-x touch-pan-y">
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
                'shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border min-h-[38px] transition-all cursor-pointer select-none active:scale-95',
                isActive
                  ? 'bg-white text-zinc-950 border-white font-semibold'
                  : 'bg-zinc-900/75 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border-white/10',
              )}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.2 rounded-full font-mono font-semibold',
                  isActive ? 'bg-zinc-950/10 text-zinc-900' : 'bg-white/5 text-zinc-500',
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
            transition={{ duration: 0.18, ease: 'easeOut' }}
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
                  aria-label={`Abrir livro ${livro.titulo}${livro.autor ? ` de ${livro.autor}` : ''}`}
                  className="group flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/75 hover:bg-zinc-800/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer select-none text-left w-full active:scale-[0.99] touch-pan-y"
                >
                  <div className="relative w-[68px] sm:w-[76px] aspect-[3/4.2] rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shrink-0 flex items-center justify-center">
                    <img
                      src={livro.capa ? directImg(livro.capa, 240) : bibliotecaCoverImg}
                      alt={livro.titulo}
                      loading={index < 6 ? 'eager' : 'lazy'}
                      decoding="async"
                      fetchPriority={index < 4 ? 'high' : 'auto'}
                      onError={(e) => {
                        e.currentTarget.src = bibliotecaCoverImg;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                          {activeMateria.label}
                        </span>
                        {livro.paginas && (
                          <span className="text-[10px] font-mono text-zinc-500">• {livro.paginas} págs</span>
                        )}
                      </div>

                      <p className="font-sans text-white text-sm sm:text-[15px] font-semibold leading-snug line-clamp-2">
                        {livro.titulo}
                      </p>

                      {livro.autor && (
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{livro.autor}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(livro);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white py-1 px-2 -ml-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                        aria-label={isFav ? 'Remover dos salvos' : 'Salvar na estante'}
                      >
                        <Bookmark
                          className={cn('w-3.5 h-3.5 transition-colors', isFav ? 'fill-white text-white' : 'text-zinc-400')}
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
  );
});

BibliotecaMateriasSection.displayName = 'BibliotecaMateriasSection';
