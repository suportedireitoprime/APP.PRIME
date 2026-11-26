import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowUpRight, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/nativeHaptics';
import { directImg } from '@/lib/cdnImg';
import type { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import HomeSectionHeader from '@/components/vademecum/home/sections/HomeSectionHeader';
import { DEMAIS_CATEGORIAS_CARROSSEL } from './bibliotecaCatalogConfig';
import bibliotecaCoverImg from '@/assets/biblioteca-cover.webp';

interface BibliotecaAcervosSectionProps {
  booksByColecao: Record<string, LivroNormalizado[]>;
  counts: Record<string, number>;
  onAbrirLivro: (livro: LivroNormalizado) => void;
}

export const BibliotecaAcervosSection: React.FC<BibliotecaAcervosSectionProps> = memo(({
  booksByColecao,
  counts,
  onAbrirLivro,
}) => {
  const navigate = useNavigate();
  const [activeCarouselIndex, setActiveCarouselIndex] = useState<number>(0);
  const livrosScrollerRef = useRef<HTMLDivElement>(null);
  const menuAlternanciaRef = useRef<HTMLDivElement>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDraggingLivrosRef = useRef(false);
  const startXLivrosRef = useRef(0);
  const startScrollLeftLivrosRef = useRef(0);
  const hasMovedLivrosRef = useRef(false);

  const activeAcervo = useMemo(
    () => DEMAIS_CATEGORIAS_CARROSSEL[activeCarouselIndex] || DEMAIS_CATEGORIAS_CARROSSEL[0],
    [activeCarouselIndex],
  );

  const livrosDoAcervo = useMemo(
    () => booksByColecao[activeAcervo.id] || [],
    [booksByColecao, activeAcervo.id],
  );

  useEffect(() => {
    const menuEl = menuAlternanciaRef.current;
    if (!menuEl) return;
    const activeBtn = menuEl.querySelector(`[data-idx="${activeCarouselIndex}"]`) as HTMLElement | null;
    if (activeBtn) {
      const targetLeft = activeBtn.offsetLeft - (menuEl.clientWidth - activeBtn.clientWidth) / 2;
      menuEl.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
  }, [activeCarouselIndex]);

  const checkLivrosScroll = useCallback(() => {
    const el = livrosScrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 12);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 12);
  }, []);

  useEffect(() => {
    checkLivrosScroll();
  }, [activeCarouselIndex, livrosDoAcervo, checkLivrosScroll]);

  const handleScrollLivrosBy = useCallback((direction: 'left' | 'right') => {
    const el = livrosScrollerRef.current;
    if (!el) return;
    haptic.selection();
    const amount = Math.max(el.clientWidth * 0.72, 280);
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  const handleLivrosMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
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
    <section className="space-y-3.5">
      <div className="flex items-start justify-between gap-2">
        <HomeSectionHeader
          title="ACERVOS ESPECIAIS"
          subtitle={activeAcervo.subtitle}
          actionLabel={`Ver acervo (${livrosDoAcervo.length || activeAcervo.defaultCount})`}
          onAction={() => {
            haptic.selection();
            navigate(`/bibliotecas/${activeAcervo.id}`);
          }}
        />
        <div className="hidden sm:flex items-center gap-1 pt-0.5 shrink-0">
          <button
            type="button"
            onClick={() => handleScrollLivrosBy('left')}
            disabled={!canScrollLeft}
            className={cn(
              'w-7 h-7 rounded-full flex items-center justify-center border transition-all cursor-pointer',
              canScrollLeft
                ? 'bg-zinc-900 border-white/15 text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-95'
                : 'bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed opacity-40',
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
              'w-7 h-7 rounded-full flex items-center justify-center border transition-all cursor-pointer',
              canScrollRight
                ? 'bg-zinc-900 border-white/15 text-zinc-200 hover:text-white hover:bg-zinc-800 active:scale-95'
                : 'bg-white/5 border-white/5 text-zinc-600 cursor-not-allowed opacity-40',
            )}
            aria-label="Avançar capas"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Menu de Alternância de Acervos Especiais */}
      <div
        ref={menuAlternanciaRef}
        className="-mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex items-center gap-2 overflow-x-auto no-scrollbar pt-0.5 pb-1 select-none touch-pan-x touch-pan-y"
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
                'relative shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 select-none cursor-pointer border min-h-[38px] active:scale-95 touch-manipulation',
                isAtivo
                  ? 'bg-white text-zinc-950 border-white font-semibold'
                  : 'bg-zinc-900/75 text-zinc-400 hover:text-white hover:bg-zinc-800/80 border-white/10',
              )}
            >
              <CatIcon
                className={cn('w-3.5 h-3.5 shrink-0 transition-colors', isAtivo ? 'text-zinc-950' : 'text-zinc-400')}
                strokeWidth={2}
              />
              <span className="whitespace-nowrap font-sans">{cat.label}</span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold tracking-tight transition-colors',
                  isAtivo ? 'bg-zinc-950/10 text-zinc-900' : 'bg-white/5 text-zinc-500',
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
        className="-mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 flex gap-3 sm:gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory scroll-smooth touch-pan-x touch-pan-y pt-1 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden items-stretch cursor-grab active:cursor-grabbing select-none"
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
                className="snap-start shrink-0 w-[134px] sm:w-[148px] flex flex-col text-left group cursor-pointer focus-visible:outline-none transform-gpu transition-all duration-200 active:scale-95 touch-pan-x touch-pan-y select-none"
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
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{livro.autor}</p>
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
            className="snap-start shrink-0 w-[134px] sm:w-[148px] aspect-[3/4.2] rounded-2xl border border-dashed border-white/15 bg-zinc-900/50 hover:bg-zinc-900 flex flex-col items-center justify-center text-center p-3 cursor-pointer group active:scale-95 transition-all touch-pan-x touch-pan-y select-none"
          >
            <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white group-hover:scale-110 transition-transform mb-2">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-white">Ver todas ({livrosDoAcervo.length})</span>
            <span className="text-[10px] text-zinc-400 mt-0.5">{activeAcervo.label}</span>
          </div>
        )}
      </div>
    </section>
  );
});

BibliotecaAcervosSection.displayName = 'BibliotecaAcervosSection';
