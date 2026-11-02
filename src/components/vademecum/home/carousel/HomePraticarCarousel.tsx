import { memo, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, FileQuestion, Timer, Pencil, LucideIcon } from 'lucide-react';
import { shade } from '@/lib/leiTheme';
import { haptic } from '@/lib/nativeHaptics';
import praticarLicoesImg from '@/assets/praticar-licoes.png';

export interface PraticarItem {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  image: string;
  path: string;
}

const PRATICAR_ITEMS: PraticarItem[] = [
  {
    id: 'flashcards',
    title: 'FLASHCARDS',
    subtitle: 'Revisão ativa',
    icon: Layers,
    color: '#2563eb', // blue
    image: '/assets/praticar-flashcards.webp',
    path: '/flashcards',
  },
  {
    id: 'questoes',
    title: 'QUESTÕES',
    subtitle: 'Fixação e treino',
    icon: FileQuestion,
    color: '#059669', // emerald
    image: '/assets/praticar-questoes.webp',
    path: '/questoes',
  },
  {
    id: 'simulados',
    title: 'SIMULADOS',
    subtitle: 'Treino real',
    icon: Timer,
    color: '#7c3aed', // violet
    image: '/assets/praticar-simulados.webp',
    path: '/simulados',
  },
  {
    id: 'licoes',
    title: 'LIÇÕES',
    subtitle: 'Artigo por artigo',
    icon: Pencil,
    color: '#ea580c', // orange vibrante
    image: praticarLicoesImg || '/assets/praticar-licoes.png',
    path: '/lei-seca',
  },
];

const AUTOPLAY_MS = 4000;

const HomePraticarCarousel = () => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isInteractingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 6 cópias (24 itens) para permitir loop infinito seguro sem bater nas bordas
  const loopedItems = useMemo(() => {
    return [
      ...PRATICAR_ITEMS,
      ...PRATICAR_ITEMS,
      ...PRATICAR_ITEMS,
      ...PRATICAR_ITEMS,
      ...PRATICAR_ITEMS,
      ...PRATICAR_ITEMS,
    ];
  }, []);

  // Começa no bloco 2 (Questões: índice 4*2 + 1 = 9) centralizado por padrão
  const [activeIndex, setActiveIndex] = useState(PRATICAR_ITEMS.length * 2 + 1);
  const [isReady, setIsReady] = useState(false);

  const pauseAutoplay = useCallback(() => {
    isInteractingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 4000);
  }, []);

  // Scroll preciso baseado em getBoundingClientRect() independente de offsetParent ou zoom
  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;

    const elRect = el.getBoundingClientRect();
    const childRect = child.getBoundingClientRect();
    const delta = childRect.left + childRect.width / 2 - (elRect.left + elRect.width / 2);

    if (Math.abs(delta) > 1) {
      el.scrollBy({ left: delta, behavior });
    }
  }, []);

  // Centralização inicial com 0ms no mount
  useEffect(() => {
    const initialIndex = PRATICAR_ITEMS.length * 2 + 1;
    setActiveIndex(initialIndex);
    const timer = setTimeout(() => {
      scrollToIndex(initialIndex, 'instant' as ScrollBehavior);
      setIsReady(true);
    }, 40);
    return () => clearTimeout(timer);
  }, [scrollToIndex]);

  // Autoplay contínuo a cada 4 segundos com proteção contra estouro de array
  useEffect(() => {
    if (!isReady) return;

    const interval = setInterval(() => {
      if (isInteractingRef.current || document.hidden) return;

      setActiveIndex((prev) => {
        let nextIndex = prev + 1;
        // Se estiver perto do final dos 6 blocos, teletransporta suavemente de volta ao bloco 2
        if (nextIndex >= loopedItems.length - PRATICAR_ITEMS.length) {
          nextIndex = (nextIndex % PRATICAR_ITEMS.length) + PRATICAR_ITEMS.length * 2;
          scrollToIndex(nextIndex, 'instant' as ScrollBehavior);
        } else {
          scrollToIndex(nextIndex, 'smooth');
        }
        return nextIndex;
      });
    }, AUTOPLAY_MS);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isReady, scrollToIndex, loopedItems.length]);

  // Detector de scroll em tempo real com getBoundingClientRect() e wrap-around infinito
  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const elRect = el.getBoundingClientRect();
    const elCenter = elRect.left + elRect.width / 2;
    let best = 0;
    let bestDist = Infinity;

    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const childRect = child.getBoundingClientRect();
      const childCenter = childRect.left + childRect.width / 2;
      const dist = Math.abs(childCenter - elCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }

    const N = PRATICAR_ITEMS.length;
    // Teleporte instantâneo nas extremidades (mantém sempre nos blocos do meio)
    if (best < N) {
      const jumpTo = best + N * 2;
      const child = el.children[jumpTo] as HTMLElement | undefined;
      if (child) {
        const childRect = child.getBoundingClientRect();
        const delta = childRect.left + childRect.width / 2 - elCenter;
        el.scrollBy({ left: delta, behavior: 'instant' as ScrollBehavior });
        setActiveIndex(jumpTo);
        return;
      }
    } else if (best >= loopedItems.length - N) {
      const jumpTo = best - N * 2;
      const child = el.children[jumpTo] as HTMLElement | undefined;
      if (child) {
        const childRect = child.getBoundingClientRect();
        const delta = childRect.left + childRect.width / 2 - elCenter;
        el.scrollBy({ left: delta, behavior: 'instant' as ScrollBehavior });
        setActiveIndex(jumpTo);
        return;
      }
    }

    setActiveIndex(best);
  }, [loopedItems.length]);

  const handleCardClick = useCallback(
    (item: PraticarItem, index: number) => {
      pauseAutoplay();
      haptic.selection();
      setActiveIndex(index);
      scrollToIndex(index);
      navigate(item.path);
    },
    [navigate, pauseAutoplay, scrollToIndex]
  );

  return (
    <section className="space-y-3">
      {/* Cabeçalho "PRATICAR" */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-foreground text-[17px] sm:text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1 h-5 rounded-full bg-[#E11D48] shrink-0" />
            <span className="truncate">PRATICAR</span>
          </h3>
          <p className="font-body text-muted-foreground text-[12px] sm:text-[12.5px] leading-snug ml-3 truncate">
            Treine com questões, simulados, flashcards e lições
          </p>
        </div>
      </div>

      {/* Faixa Carrossel Horizontal Infinito com Autoplay (idêntica a Leis em Alta) */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={pauseAutoplay}
        onTouchStart={pauseAutoplay}
        className="relative -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-[calc(50vw-74px)] sm:px-[calc(50vw-81px)] flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pt-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
        style={{ visibility: isReady ? 'visible' : 'hidden' }}
      >
        {loopedItems.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;
          const baseColor = item.color;

          return (
            <button
              key={`${item.id}-${i}`}
              type="button"
              onClick={() => handleCardClick(item, i)}
              className={`snap-center shrink-0 min-w-[138px] max-w-[148px] sm:min-w-[152px] sm:max-w-[162px] h-[116px] sm:h-[122px] text-left cursor-pointer focus-visible:outline-none relative flex flex-col rounded-2xl group transition-all duration-400 ease-out ${
                isActive
                  ? 'scale-[1.02] opacity-100 z-10 shadow-xl'
                  : 'scale-[0.94] opacity-75 z-0 shadow-sm'
              }`}
            >
              {/* Gradiente de fundo com marca d'água */}
              <div
                className={`absolute inset-0 rounded-2xl overflow-hidden pointer-events-none transition-all duration-300 ${
                  isActive ? 'shadow-lg ring-1 ring-white/15' : 'shadow-sm group-hover:opacity-100 opacity-95'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${baseColor} 0%, ${shade(baseColor, -0.3)} 100%)`,
                }}
              >
                <Icon
                  className="absolute -right-2 -bottom-2 w-20 h-20 sm:w-22 sm:h-22 text-white/[0.15] drop-shadow-md group-hover:scale-105 group-hover:text-white/[0.2] transition-all duration-300"
                  strokeWidth={1.3}
                />
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all" />
              </div>

              {/* Personagem 3D com Zoom Suave e Equilibrado ao centralizar */}
              {item.image && (
                <div
                  className={`absolute right-0 w-auto h-[102px] sm:h-[108px] max-w-none pointer-events-none z-10 transform-gpu origin-bottom transition-all duration-500 ease-out ${
                    isActive
                      ? 'scale-[1.08] sm:scale-[1.10] -top-3.5 sm:-top-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] opacity-100'
                      : 'scale-[0.86] -top-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] opacity-60'
                  }`}
                >
                  <img
                    src={item.image}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (item.id === 'licoes' && !target.src.endsWith('/assets/praticar-licoes.png')) {
                        target.src = '/assets/praticar-licoes.png';
                      }
                    }}
                    alt={`Ilustração ${item.title}`}
                    className="h-full w-auto object-contain select-none pointer-events-none"
                    loading="eager"
                    decoding="async"
                  />
                </div>
              )}

              {/* Conteúdo textual e ícone */}
              <div className="relative z-20 flex flex-col justify-between w-full h-full p-3 pointer-events-none">
                <div className="flex justify-between items-start">
                  <Icon
                    className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
                    strokeWidth={1.8}
                  />
                </div>

                <div className="flex justify-between items-end mt-auto">
                  <div className="flex flex-col">
                    <span className="font-display text-white text-[19px] sm:text-[21px] font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none">
                      {item.title}
                    </span>
                    <span className="text-white/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-1.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Indicador de pontos (respeita o item real no loop) */}
      <div className="flex justify-center items-center gap-1.5 pt-1">
        {PRATICAR_ITEMS.map((item, idx) => {
          const isCurrentActive = idx === activeIndex % PRATICAR_ITEMS.length;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                pauseAutoplay();
                haptic.selection();
                const currentBlock = Math.floor(activeIndex / PRATICAR_ITEMS.length);
                const targetIndex = currentBlock * PRATICAR_ITEMS.length + idx;
                setActiveIndex(targetIndex);
                scrollToIndex(targetIndex);
              }}
              aria-label={`Ir para ${item.title}`}
              className={`transition-all duration-300 rounded-full ${
                isCurrentActive
                  ? 'w-6 h-1.5 bg-[#E11D48]'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
};

export default memo(HomePraticarCarousel);
