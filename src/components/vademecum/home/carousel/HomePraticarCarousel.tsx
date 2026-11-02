import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, FileQuestion, Timer, LucideIcon } from 'lucide-react';
import { shade } from '@/lib/leiTheme';
import { haptic } from '@/lib/nativeHaptics';

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
    color: '#059669', // emerald (card central)
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
];

const HomePraticarCarousel = () => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  // Questões (índice 1) é o card centralizado por padrão
  const [activeIndex, setActiveIndex] = useState(1);
  const [isReady, setIsReady] = useState(false);

  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({ left: target, behavior });
  }, []);

  // Centraliza em Questões (idx 1) no carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToIndex(1, 'instant' as ScrollBehavior);
      setIsReady(true);
    }, 40);
    return () => clearTimeout(timer);
  }, [scrollToIndex]);

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 1;
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
    setActiveIndex(best);
  }, []);

  const handleCardClick = useCallback(
    (item: PraticarItem, index: number) => {
      haptic.selection();
      setActiveIndex(index);
      scrollToIndex(index);
      navigate(item.path);
    },
    [navigate, scrollToIndex]
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
            Treine com questões, simulados e flashcards
          </p>
        </div>
      </div>

      {/* Faixa Carrossel Horizontal: 3 cards com Questões centralizado com meio zoom */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-[calc(50vw-74px)] sm:px-[calc(50vw-81px)] md:px-0 flex md:justify-center gap-2.5 sm:gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pt-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ visibility: isReady ? 'visible' : 'hidden' }}
      >
        {PRATICAR_ITEMS.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;
          const baseColor = item.color;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleCardClick(item, i)}
              className={`snap-center shrink-0 min-w-[138px] max-w-[148px] sm:min-w-[152px] sm:max-w-[162px] h-[116px] sm:h-[122px] text-left cursor-pointer focus-visible:outline-none relative flex flex-col shadow-md rounded-2xl group transition-all duration-500 ease-out ${
                isActive
                  ? 'scale-100 sm:scale-105 opacity-100 z-10 shadow-xl'
                  : 'scale-[0.92] opacity-75 z-0'
              }`}
            >
              {/* Gradiente de fundo com marca d'água */}
              <div
                className={`absolute inset-0 rounded-2xl overflow-hidden pointer-events-none transition-all duration-300 ${
                  isActive ? 'shadow-xl' : 'shadow-md group-hover:opacity-100 opacity-95'
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

              {/* Personagem 3D com destaque e meio zoom */}
              {item.image && (
                <div
                  className={`absolute right-0 w-auto h-[105px] max-w-none pointer-events-none z-10 transition-all duration-500 ease-out origin-bottom ${
                    isActive
                      ? 'scale-[1.06] -top-5 drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]'
                      : 'scale-100 -top-4 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={`Ilustração ${item.title}`}
                    className="h-full w-auto object-contain"
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

      {/* Indicador de 3 pontos no mobile */}
      <div className="flex md:hidden justify-center items-center gap-1.5 pt-1">
        {PRATICAR_ITEMS.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              haptic.selection();
              setActiveIndex(idx);
              scrollToIndex(idx);
            }}
            aria-label={`Ir para ${item.title}`}
            className={`transition-all duration-300 rounded-full ${
              idx === activeIndex
                ? 'w-6 h-1.5 bg-primary'
                : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default memo(HomePraticarCarousel);

