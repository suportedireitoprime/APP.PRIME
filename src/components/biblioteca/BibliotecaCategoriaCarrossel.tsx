import React, { memo, useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Clock, ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react';
import { LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { cdnImg } from '@/lib/cdnImg';
import { haptic } from '@/lib/nativeHaptics';
import CarouselDots from '@/components/vademecum/home/carousel/CarouselDots';

interface CategoryCarouselConfig {
  id: string;
  title: string;
  subtitle: string;
  badgeLabel: string;
  gradient: string;
  accentColor: string;
  glowColor: string;
  seeAllRoute?: string;
  icon?: any;
}

interface BibliotecaCategoriaCarrosselProps {
  config: CategoryCarouselConfig;
  livros: LivroNormalizado[];
  onAbrirLivro: (livro: LivroNormalizado) => void;
}

export const BibliotecaCategoriaCarrossel: React.FC<BibliotecaCategoriaCarrosselProps> = memo(
  function BibliotecaCategoriaCarrossel({ config, livros, onAbrirLivro }) {
    const navigate = useNavigate();
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isPausedRef = useRef(false);

    const pauseAutoplay = useCallback(() => {
      isPausedRef.current = true;
      if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = setTimeout(() => {
        isPausedRef.current = false;
      }, 7000);
    }, []);

    const scrollTo = useCallback((idx: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const child = el.children[idx] as HTMLElement;
      if (!child) return;
      const left = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
      el.scrollTo({ left, behavior: 'smooth' });
      setActiveIndex(idx);
    }, []);

    // Atualiza índice ativo com base no scroll
    useEffect(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const onScroll = () => {
        const center = el.scrollLeft + el.clientWidth / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        Array.from(el.children).forEach((child, i) => {
          const h = child as HTMLElement;
          const c = h.offsetLeft + h.clientWidth / 2;
          const d = Math.abs(c - center);
          if (d < bestDist) {
            bestDist = d;
            bestIdx = i;
          }
        });
        setActiveIndex(bestIdx);
      };
      el.addEventListener('scroll', onScroll, { passive: true });
      return () => el.removeEventListener('scroll', onScroll);
    }, []);

    // Autoplay suave
    useEffect(() => {
      if (!livros.length) return;
      const interval = setInterval(() => {
        if (isPausedRef.current) return;
        setActiveIndex((prev) => {
          const next = (prev + 1) % livros.length;
          scrollTo(next);
          return next;
        });
      }, 5500);
      return () => clearInterval(interval);
    }, [livros.length, scrollTo]);

    if (!livros || livros.length === 0) return null;

    const Icon = config.icon || BookOpen;

    return (
      <section className="space-y-3 pt-1">
        {/* Cabeçalho da Categoria */}
        <div className="relative z-10 pointer-events-none px-1 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-white text-[15px] sm:text-[16px] font-bold mb-0.5 flex items-center gap-2 pointer-events-auto uppercase tracking-wider">
              <span 
                className="w-1 h-5 rounded-full shrink-0"
                style={{ backgroundColor: config.accentColor }}
              />
              <span className="truncate">{config.title}</span>
            </h3>
            <p className="font-sans text-white/60 text-[11.5px] sm:text-[12px] leading-snug ml-3 pointer-events-auto truncate">
              {config.subtitle}
            </p>
          </div>

          {config.seeAllRoute && (
            <button
              type="button"
              onClick={() => {
                haptic.selection();
                navigate(config.seeAllRoute!);
              }}
              className="group pointer-events-auto shrink-0 mt-0.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md border text-[12px] font-semibold text-white/90 hover:text-white transition-all shadow-sm active:scale-95"
              style={{
                backgroundColor: `${config.accentColor}20`,
                borderColor: `${config.accentColor}40`,
              }}
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {/* Faixa do Carrossel Horizontal */}
        <div
          ref={scrollerRef}
          onPointerDown={pauseAutoplay}
          onTouchStart={pauseAutoplay}
          className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 -mx-4 sm:-mx-6 px-4 sm:px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {livros.map((livro, i) => {
            const isActive = i === activeIndex;
            const meta = livro.autor
              ? `${livro.autor} · ${livro.area ?? config.badgeLabel}`
              : (livro.area ?? config.badgeLabel);

            return (
              <motion.button
                key={`${livro.id}-${i}`}
                type="button"
                onClick={() => {
                  haptic.selection();
                  onAbrirLivro(livro);
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.2) }}
                className="snap-center shrink-0 w-[84%] sm:w-[48%] md:w-[46%] lg:w-[32%] active:scale-[0.99] text-left cursor-pointer focus-visible:outline-none"
              >
                <div
                  style={{
                    background: config.gradient,
                  }}
                  className={`relative w-full h-[140px] overflow-hidden rounded-2xl transition-all duration-300 flex transform-gpu will-change-transform border border-white/15 shadow-md ${
                    isActive ? 'opacity-100 scale-100' : 'opacity-85 scale-[0.98]'
                  }`}
                >
                  {/* SVGs decorativos sutis */}
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

                  {/* Capa do livro */}
                  <div className="relative h-full w-[104px] shrink-0 flex items-center justify-center px-2.5 z-[1]">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white/30" />
                    </div>
                    {livro.capa && (
                      <img
                        src={cdnImg(livro.capa, 240)}
                        alt={livro.titulo}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="relative h-[118px] w-auto max-w-full object-contain rounded-md z-[2]"
                        style={{
                          boxShadow:
                            '0 14px 26px -8px rgba(0,0,0,0.75), 0 6px 12px -4px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.25)',
                        }}
                      />
                    )}
                  </div>

                  {/* Detalhes à direita */}
                  <div className="relative flex-1 min-w-0 flex flex-col justify-end px-3.5 pb-3 pt-3 z-[1]">
                    <span 
                      className="self-start flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white mb-1.5 bg-black/40 backdrop-blur-sm border border-white/10"
                    >
                      <Icon className="w-2.5 h-2.5" />
                      {config.badgeLabel}
                    </span>
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] text-white/85">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">{meta}</span>
                    </div>
                    <p className="font-display text-white text-[14px] font-semibold leading-snug line-clamp-2 drop-shadow-sm">
                      {livro.titulo}
                    </p>
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
                      <ArrowUpRight className="w-3 h-3 text-white" strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Indicadores de Paginação */}
        <CarouselDots total={livros.length} activeIndex={activeIndex} />
      </section>
    );
  }
);

export default BibliotecaCategoriaCarrossel;

