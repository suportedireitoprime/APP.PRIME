import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Landmark, Gavel, Scale, FileText, ShieldAlert, Briefcase, CircleDollarSign, ShoppingCart, Baby, BookMarked, LucideIcon } from 'lucide-react';
import { LEIS_CATALOG } from '@/data/leisCatalog';
import { leiPath } from '@/lib/legislacaoSlugs';
import { haptic } from '@/lib/nativeHaptics';
import CarouselDots from './CarouselDots';

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

const AUTOPLAY_MS = 5000;

interface HomeEmAltaCarouselProps {
  onSelectItem?: (item: EmAltaItem) => void;
}

const HomeEmAltaCarousel = ({ onSelectItem }: HomeEmAltaCarouselProps) => {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isInteractingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const cardWidth = el.firstElementChild
      ? (el.firstElementChild as HTMLElement).offsetWidth + 10
      : 155;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.max(0, Math.min(EM_ALTA_ITEMS.length - 1, idx)));
  }, []);

  const pauseAutoplay = useCallback(() => {
    isInteractingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 10000);
  }, []);

  useEffect(() => {
    if (EM_ALTA_ITEMS.length <= 1) return;

    const interval = setInterval(() => {
      if (isInteractingRef.current || document.hidden) return;
      const el = scrollerRef.current;
      if (!el) return;
      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 10
        : 155;
      const nextIndex = (activeIndex + 1) % EM_ALTA_ITEMS.length;
      el.scrollTo({
        left: nextIndex * cardWidth,
        behavior: 'smooth',
      });
      setActiveIndex(nextIndex);
    }, AUTOPLAY_MS);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [activeIndex]);

  return (
    <section className="space-y-3">
      {/* Cabeçalho "EM ALTA" — sem botão "Mais" à direita */}
      <div className="px-1 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-foreground text-[18px] font-bold flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1 h-5 rounded-full bg-primary" />
            EM ALTA
          </h3>
          <p className="font-body text-muted-foreground text-[12.5px] leading-snug ml-3 truncate">
            As leis e normas mais acessadas no momento
          </p>
        </div>
      </div>

      {/* Faixa Carrossel Horizontal: cards quadrados em vermelho com SVG branco (sem capas) */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={pauseAutoplay}
        onTouchStart={pauseAutoplay}
        className="-mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 px-4 sm:px-6 md:px-8 lg:px-12 flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pt-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {EM_ALTA_ITEMS.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleOpenItem(item)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.2) }}
              className="snap-start shrink-0 w-[145px] sm:w-[155px] h-[130px] sm:h-[138px] active:scale-[0.97] text-left cursor-pointer focus-visible:outline-none"
            >
              <div
                className={`relative w-full h-full overflow-hidden rounded-2xl transition-all duration-300 flex flex-col justify-between p-3.5 transform-gpu will-change-transform bg-brand-gradient ${
                  isActive
                    ? 'opacity-100 shadow-xl shadow-red-950/60'
                    : 'opacity-90 shadow-md hover:opacity-100'
                }`}
              >
                {/* SVG Marca d'água no fundo (igual em legislação, cor branca) */}
                <div className="absolute -right-2.5 -bottom-2.5 w-[76px] h-[76px] pointer-events-none opacity-[0.16] text-white">
                  <Icon className="w-full h-full" strokeWidth={1.3} />
                </div>

                {/* Topo do Card: Ícone SVG Branco e Sigla/Badge */}
                <div className="flex items-center justify-between gap-1 relative z-10">
                  <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
                    <Icon className="w-5 h-5 text-white" strokeWidth={1.6} />
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white bg-black/40 backdrop-blur-sm border border-white/10">
                    {item.sigla}
                  </span>
                </div>

                {/* Base do Card: Título da Lei e Sublabel */}
                <div className="relative z-10 flex flex-col justify-end mt-2">
                  <p className="font-display text-white text-[13.5px] sm:text-[14px] font-bold leading-tight line-clamp-2 drop-shadow-sm uppercase">
                    {item.title}
                  </p>
                  <p className="font-body text-white/80 text-[10.5px] leading-snug mt-1 truncate">
                    {item.sublabel}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Indicador de Paginação */}
      <CarouselDots total={EM_ALTA_ITEMS.length} activeIndex={activeIndex} />
    </section>
  );
};

export default memo(HomeEmAltaCarousel);
