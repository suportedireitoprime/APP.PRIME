import { memo, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, FileQuestion, Timer, Pencil, LucideIcon } from 'lucide-react';
import { shade } from '@/lib/leiTheme';
import { haptic } from '@/lib/nativeHaptics';
import CarouselDots from './CarouselDots';
import praticarLicoesImg from '@/assets/praticar-licoes.webp';

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
    color: '#e11d48', // vermelho oficial do painel de Questoes
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
    image: praticarLicoesImg || '/assets/praticar-licoes.webp',
    path: '/lei-seca',
  },
];

// Função utilitária para embaralhar array (Fisher-Yates) no acesso
function shuffleArray<T>(items: readonly T[]): T[] {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const HomePraticarCarousel = () => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Sorteia a ordem aleatória ao acessar a tela (sem passar sozinho)
  const randomizedItems = useMemo(() => shuffleArray(PRATICAR_ITEMS), []);

  // 10 cópias (40 itens no total, mesmo volume e estabilidade que Leis em Alta)
  // para permitir scroll infinito manual com amplo runway em ambas as direções
  const loopedItems = useMemo(() => {
    if (randomizedItems.length === 0) return [];
    return [
      ...randomizedItems,
      ...randomizedItems,
      ...randomizedItems,
      ...randomizedItems,
      ...randomizedItems,
      ...randomizedItems,
      ...randomizedItems,
      ...randomizedItems,
      ...randomizedItems,
      ...randomizedItems,
    ];
  }, [randomizedItems]);

  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({ left: target, behavior });
  }, []);

  // Inicialização estável idêntica a HomeEmAltaCarousel
  useEffect(() => {
    if (randomizedItems.length > 0 && !isReady) {
      const initialIndex = randomizedItems.length * 4; // inicia no 5º bloco central
      setActiveIndex(initialIndex);
      setTimeout(() => {
        scrollToIndex(initialIndex, 'instant' as ScrollBehavior);
        setIsReady(true);
      }, 50);
    }
  }, [randomizedItems.length, isReady, scrollToIndex]);

  // Detector de scroll perfeitamente alinhado com HomeEmAltaCarousel
  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
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

    const N = randomizedItems.length;
    if (N > 0) {
      // Loop suave nos extremos sem interrupção de toque
      if (best <= 2) {
        const jumpTo = best + N * 4;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: 'auto' });
          setActiveIndex(jumpTo);
          return;
        }
      } else if (best >= loopedItems.length - 3) {
        const jumpTo = best - N * 4;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: 'auto' });
          setActiveIndex(jumpTo);
          return;
        }
      }
    }

    setActiveIndex(best);
  }, [randomizedItems.length, loopedItems.length]);

  const handleCardClick = useCallback(
    (item: PraticarItem, index: number) => {
      haptic.selection();
      setActiveIndex(index);
      navigate(item.path);
    },
    [navigate]
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

      {/* Faixa Carrossel Horizontal Manual (idêntica a Leis em Alta) */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-[calc(50vw-74px)] sm:px-[calc(50vw-81px)] flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory pb-2 pt-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden select-none"
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
              className={`snap-center shrink-0 min-w-[144px] max-w-[154px] sm:min-w-[154px] sm:max-w-[164px] h-[118px] sm:h-[124px] text-left cursor-pointer focus-visible:outline-none relative flex flex-col rounded-2xl group transition-all duration-400 ease-out ${
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

              {/* Personagem 3D com posicionamento estável idêntico a Leis em Alta */}
              {item.image && (
                <div
                  className={`absolute right-0 w-auto h-[96px] sm:h-[100px] max-w-none pointer-events-none z-10 transform-gpu origin-bottom transition-all duration-500 ease-out ${
                    isActive
                      ? 'scale-[1.08] sm:scale-[1.10] -top-3.5 sm:-top-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.65)] opacity-100'
                      : 'scale-[0.86] -top-0.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)] opacity-60'
                  }`}
                >
                  <img
                    src={item.image}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (item.id === 'licoes' && !target.src.endsWith('/assets/praticar-licoes.webp')) {
                        target.src = '/assets/praticar-licoes.webp';
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
                  <div className="flex flex-col w-full pr-1">
                    <span className="text-white text-[13px] sm:text-[14px] font-black tracking-wider uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] leading-none whitespace-nowrap">
                      {item.title}
                    </span>
                    <span className="text-white/90 text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider mt-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-none whitespace-nowrap">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Indicador de Paginação padronizado com CarouselDots */}
      <CarouselDots
        total={randomizedItems.length}
        activeIndex={randomizedItems.length > 0 ? activeIndex % randomizedItems.length : 0}
      />
    </section>
  );
};

export default memo(HomePraticarCarousel);
