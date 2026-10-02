import { memo, useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Landmark, Gavel, Scale, FileText, ShieldAlert, Briefcase, CircleDollarSign, ShoppingCart, Baby, BookMarked, Settings2, LucideIcon } from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath } from '@/lib/legislacaoSlugs';
import { getLeiColor, shade } from '@/lib/leiTheme';
import { haptic } from '@/lib/nativeHaptics';
import CarouselDots from './CarouselDots';
import { useEmAltaConfig } from '@/hooks/useEmAltaConfig';
import { HomeEmAltaCustomizer } from './HomeEmAltaCustomizer';

export interface EmAltaItem {
  id: string;
  tipo: string;
  title: string;
  sigla: string;
  sublabel: string;
  icon: LucideIcon;
}

const EM_ALTA_ITEMS: EmAltaItem[] = [
  {
    id: 'cf88',
    tipo: 'constituicao',
    title: 'Constituição Federal',
    sigla: 'CF/88',
    sublabel: 'Carta Magna · 1988',
    icon: Landmark,
  },
  {
    id: 'cp',
    tipo: 'codigo',
    title: 'Código Penal',
    sigla: 'CP',
    sublabel: 'Dec.-Lei 2.848/1940',
    icon: Gavel,
  },
  {
    id: 'cc',
    tipo: 'codigo',
    title: 'Código Civil',
    sigla: 'CC',
    sublabel: 'Lei 10.406/2002',
    icon: Scale,
  },
  {
    id: 'cpc',
    tipo: 'codigo',
    title: 'Processo Civil',
    sigla: 'CPC',
    sublabel: 'Lei 13.105/2015',
    icon: FileText,
  },
  {
    id: 'cpp',
    tipo: 'codigo',
    title: 'Processo Penal',
    sigla: 'CPP',
    sublabel: 'Dec.-Lei 3.689/1941',
    icon: ShieldAlert,
  },
  {
    id: 'clt',
    tipo: 'codigo',
    title: 'Leis do Trabalho',
    sigla: 'CLT',
    sublabel: 'Dec.-Lei 5.452/1943',
    icon: Briefcase,
  },
  {
    id: 'ctn',
    tipo: 'codigo',
    title: 'Tributário Nacional',
    sigla: 'CTN',
    sublabel: 'Lei 5.172/1966',
    icon: CircleDollarSign,
  },
  {
    id: 'cdc',
    tipo: 'codigo',
    title: 'Defesa do Consumidor',
    sigla: 'CDC',
    sublabel: 'Lei 8.078/1990',
    icon: ShoppingCart,
  },
  {
    id: 'eca',
    tipo: 'estatuto',
    title: 'Criança e Adolescente',
    sigla: 'ECA',
    sublabel: 'Lei 8.069/1990',
    icon: Baby,
  },
  {
    id: 'eoab',
    tipo: 'estatuto',
    title: 'Estatuto da OAB',
    sigla: 'EOAB',
    sublabel: 'Lei 8.906/1994',
    icon: BookMarked,
  },
];

const getIconForLei = (tipo: string, id: string) => {
  const original = EM_ALTA_ITEMS.find(i => i.id === id);
  if (original) return original.icon;
  if (tipo === 'codigo') return FileText;
  if (tipo === 'estatuto') return BookMarked;
  if (tipo === 'constituicao') return Landmark;
  return FileText;
};

const AUTOPLAY_MS = 5000;

interface HomeEmAltaCarouselProps {
  onSelectItem?: (item: EmAltaItem) => void;
}

const HomeEmAltaCarousel = ({ onSelectItem }: HomeEmAltaCarouselProps) => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const isInteractingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { config } = useEmAltaConfig();
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const displayItems = useMemo(() => {
    if (!config || config.length === 0) return EM_ALTA_ITEMS;

    return config.map(id => {
      const original = EM_ALTA_ITEMS.find(item => item.id === id);
      if (original) return original;
      
      const catalogItem = LEIS_CATALOG.find(l => l.id === id);
      if (catalogItem) {
        return {
          id: catalogItem.id,
          tipo: catalogItem.tipo,
          title: catalogItem.nome,
          sigla: catalogItem.sigla,
          sublabel: catalogItem.descricao || 'Lei',
          icon: getIconForLei(catalogItem.tipo, catalogItem.id)
        };
      }
      return null;
    }).filter(Boolean) as EmAltaItem[];
  }, [config]);

  const loopedItems = useMemo(() => {
    if (displayItems.length === 0) return [];
    // 4 copies to allow smooth scrolling back and forth without hitting the edge quickly
    return [...displayItems, ...displayItems, ...displayItems, ...displayItems];
  }, [displayItems]);

  const handleOpenItem = useCallback(
    (item: EmAltaItem) => {
      haptic.selection();
      if (onSelectItem) {
        onSelectItem(item);
        return;
      }
      const targetLei = LEIS_CATALOG.find((l) => l.id === item.id);
      if (targetLei) {
        navigate(leiPath(targetLei));
      } else {
        navigate(`/legislacao/${item.tipo}`);
      }
    },
    [navigate, onSelectItem]
  );

  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft - (el.clientWidth - child.clientWidth) / 2;
    el.scrollTo({ left: target, behavior });
  }, []);

  useEffect(() => {
    if (displayItems.length > 0 && !isReady) {
      const initialIndex = displayItems.length; // Start at the second block
      setActiveIndex(initialIndex);
      // Timeout is needed so the DOM has rendered the padding and cards
      setTimeout(() => {
        scrollToIndex(initialIndex, 'auto');
        setIsReady(true);
      }, 50);
    }
  }, [displayItems.length, isReady, scrollToIndex]);

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
      if (dist < bestDist) { bestDist = dist; best = i; }
    }

    const N = displayItems.length;
    if (N > 0) {
      if (best <= 1) {
        const jumpTo = best + N * 2;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: 'auto' });
          setActiveIndex(jumpTo);
          return;
        }
      } else if (best >= loopedItems.length - 2) {
        const jumpTo = best - N * 2;
        const child = el.children[jumpTo] as HTMLElement;
        if (child) {
          el.scrollTo({ left: child.offsetLeft - (el.clientWidth - child.clientWidth) / 2, behavior: 'auto' });
          setActiveIndex(jumpTo);
          return;
        }
      }
    }

    setActiveIndex(best);
  }, [displayItems.length, loopedItems.length]);

  const pauseAutoplay = useCallback(() => {
    isInteractingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 10000);
  }, []);

  useEffect(() => {
    if (displayItems.length <= 1 || !isReady) return;

    const interval = setInterval(() => {
      if (isInteractingRef.current || document.hidden) return;
      const nextIndex = activeIndex + 1;
      scrollToIndex(nextIndex);
      setActiveIndex(nextIndex);
    }, AUTOPLAY_MS);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex, displayItems.length, scrollToIndex]);

  return (
    <section className="space-y-3">
      {/* Cabeçalho "EM ALTA" */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-foreground text-[17px] sm:text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1 h-5 rounded-full bg-primary shrink-0" />
            <span className="truncate">LEIS EM ALTA</span>
          </h3>
          <p className="font-body text-muted-foreground text-[12px] sm:text-[12.5px] leading-snug ml-3 truncate">
            As leis e normas mais acessadas no momento
          </p>
        </div>
        <button
          onClick={() => {
            haptic.selection();
            setIsCustomizerOpen(true);
          }}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-red-100 transition-all text-xs font-semibold shadow-sm shadow-red-950/20 active:opacity-70 touch-manipulation cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5 text-red-400" />
          <span>Personalizar</span>
        </button>
      </div>

      {/* Faixa Carrossel Horizontal: cards quadrados em vermelho com SVG branco (sem capas) */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={pauseAutoplay}
        onTouchStart={pauseAutoplay}
        className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-[calc(50vw-74px)] sm:px-[calc(50vw-81px)] flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pt-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ visibility: isReady ? 'visible' : 'hidden' }}
      >
        {loopedItems.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;
          const baseColor = getLeiColor(item.id, item.tipo);

          let coverImage = null;
          if (item.id === 'cdc') coverImage = '/assets/cdc-girl.webp';
          else if (item.id === 'clt') coverImage = '/assets/cdc-worker.webp';
          else if (item.id === 'cpp') coverImage = '/assets/cpp-court.png';
          else if (item.id === 'cpc') coverImage = '/assets/cpc-lawyer.webp';
          else if (item.id === 'cc') coverImage = '/assets/cc-couple.webp';
          else if (item.id === 'cf88') coverImage = '/assets/cf88-cover.webp';
          else if (['cp', 'lep'].includes(item.id)) coverImage = '/assets/homem-preso-novo.webp';
          else if (item.id === 'ctn') coverImage = '/assets/ctn-taxes.png';
          else if (item.id === 'eca') coverImage = '/assets/eca-kids.png';
          else if (item.id === 'eoab') coverImage = '/assets/eoab-woman-fixed.webp';
          else if (item.id === 'epd') coverImage = '/assets/epd-wheelchair.webp';
          else if (item.id === 'ce') coverImage = '/assets/ce-vote.webp';

          return (
            <button
              key={`${item.id}-${i}`}
              type="button"
              onClick={() => {
                if (!isActive) {
                  pauseAutoplay();
                  scrollToIndex(i);
                  setActiveIndex(i);
                } else {
                  handleOpenItem(item);
                }
              }}
              className={`snap-center shrink-0 min-w-[138px] max-w-[148px] sm:min-w-[152px] sm:max-w-[162px] h-[116px] sm:h-[122px] text-left cursor-pointer focus-visible:outline-none relative flex flex-col shadow-md rounded-2xl group transition-all duration-500 ease-out ${
                isActive ? 'scale-100 opacity-100 z-10' : 'scale-[0.92] opacity-60 z-0'
              }`}
            >
              <div 
                className={`absolute inset-0 rounded-2xl overflow-hidden pointer-events-none transition-all duration-300 ${isActive ? 'shadow-xl' : 'shadow-md group-hover:opacity-100 opacity-95'}`}
                style={{ background: `linear-gradient(135deg, ${baseColor} 0%, ${shade(baseColor, -0.3)} 100%)` }}
              >
                <Icon
                  className="absolute -right-2 -bottom-2 w-20 h-20 sm:w-22 sm:h-22 text-white/[0.15] drop-shadow-md group-hover:scale-105 group-hover:text-white/[0.2] transition-all duration-300"
                  strokeWidth={1.3}
                />
                <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:bg-white/20 transition-all" />
              </div>

              {coverImage && (
                <img
                  src={coverImage}
                  alt={`Capa ${item.sigla}`}
                  className={`absolute -top-4 right-0 h-[105px] w-auto max-w-none object-contain pointer-events-none z-10 drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] group-hover:drop-shadow-[0_12px_20px_rgba(0,0,0,0.7)] group-hover:scale-105 transition-all duration-300 ${isActive ? 'animate-image-glow' : ''}`}
                />
              )}

              <div className="relative z-20 flex flex-col justify-between w-full h-full p-3 pointer-events-none">
                <div className="flex justify-between items-start">
                  <Icon
                    className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform duration-200"
                    strokeWidth={1.8}
                  />
                </div>
                
                <div className="flex justify-between items-end mt-auto">
                  <span className="font-display text-white text-[24px] sm:text-[26px] font-black tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                    {item.sigla}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Indicador de Paginação */}
      <CarouselDots total={displayItems.length} activeIndex={displayItems.length > 0 ? activeIndex % displayItems.length : 0} />

      <HomeEmAltaCustomizer 
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        defaultOrder={EM_ALTA_ITEMS.map(i => i.id)}
      />
    </section>
  );
};

export default memo(HomeEmAltaCarousel);
