import { memo, useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Landmark, Gavel, Scale, FileText, ShieldAlert, Briefcase, CircleDollarSign, ShoppingCart, Baby, BookMarked, Clock, ArrowUpRight, LucideIcon } from 'lucide-react';
import { LEIS_CATALOG, type LeiCatalogItem } from '@/data/leisCatalog';
import { leiPath } from '@/lib/legislacaoSlugs';
import { cdnImg } from '@/lib/cdnImg';
import { COVERS } from '@/lib/coverLoader';
import { haptic } from '@/lib/nativeHaptics';
import CarouselDots from './CarouselDots';

export interface EmAltaItem {
  id: string;
  tipo: string;
  title: string;
  sublabel: string;
  badge: string;
  cover: string;
  icon: LucideIcon;
}

const EM_ALTA_ITEMS: EmAltaItem[] = [
  {
    id: 'cf88',
    tipo: 'constituicao',
    title: 'Constituição Federal',
    sublabel: 'CF/88 · 1988',
    badge: 'Carta Magna',
    cover: COVERS.cf88 || '/pilulas/cf_portrait.webp',
    icon: Landmark,
  },
  {
    id: 'cp',
    tipo: 'codigo',
    title: 'Código Penal',
    sublabel: 'CP · Dec.-Lei 2.848/1940',
    badge: 'Penal',
    cover: 'https://dnjrgpldcwcpoywamorr.supabase.co/storage/v1/object/public/biblioteca-obras/capas_fixas/cp_artigos_v2.jpg',
    icon: Gavel,
  },
  {
    id: 'cc',
    tipo: 'codigo',
    title: 'Código Civil',
    sublabel: 'CC · Lei 10.406/2002',
    badge: 'Civil',
    cover: COVERS.cc || '/pilulas/cc_portrait.webp',
    icon: Scale,
  },
  {
    id: 'cpc',
    tipo: 'codigo',
    title: 'Código de Processo Civil',
    sublabel: 'CPC · Lei 13.105/2015',
    badge: 'Processo',
    cover: '/pilulas/cpp_portrait.webp',
    icon: FileText,
  },
  {
    id: 'cpp',
    tipo: 'codigo',
    title: 'Código de Processo Penal',
    sublabel: 'CPP · Dec.-Lei 3.689/1941',
    badge: 'Processo',
    cover: '/pilulas/cpp_portrait.webp',
    icon: ShieldAlert,
  },
  {
    id: 'clt',
    tipo: 'codigo',
    title: 'Consolidação das Leis do Trabalho',
    sublabel: 'CLT · Dec.-Lei 5.452/1943',
    badge: 'Trabalho',
    cover: COVERS.clt || '/pilulas/clt_portrait.webp',
    icon: Briefcase,
  },
  {
    id: 'ctn',
    tipo: 'codigo',
    title: 'Código Tributário Nacional',
    sublabel: 'CTN · Lei 5.172/1966',
    badge: 'Tributário',
    cover: COVERS.ctn,
    icon: CircleDollarSign,
  },
  {
    id: 'cdc',
    tipo: 'codigo',
    title: 'Código de Defesa do Consumidor',
    sublabel: 'CDC · Lei 8.078/1990',
    badge: 'Consumidor',
    cover: COVERS.cdc,
    icon: ShoppingCart,
  },
  {
    id: 'eca',
    tipo: 'estatuto',
    title: 'Estatuto da Criança e Adolescente',
    sublabel: 'ECA · Lei 8.069/1990',
    badge: 'Estatuto',
    cover: COVERS.eca,
    icon: Baby,
  },
  {
    id: 'eoab',
    tipo: 'estatuto',
    title: 'Estatuto da Advocacia e OAB',
    sublabel: 'EOAB · Lei 8.906/1994',
    badge: 'OAB',
    cover: COVERS.eoab,
    icon: BookMarked,
  },
];

const AUTOPLAY_MS = 6000;

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
      ? (el.firstElementChild as HTMLElement).offsetWidth + 12
      : 280;
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.max(0, Math.min(EM_ALTA_ITEMS.length - 1, idx)));
  }, []);

  const pauseAutoplay = useCallback(() => {
    isInteractingRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 12000);
  }, []);

  useEffect(() => {
    if (EM_ALTA_ITEMS.length <= 1) return;

    const interval = setInterval(() => {
      if (isInteractingRef.current || document.hidden) return;
      const el = scrollerRef.current;
      if (!el) return;
      const cardWidth = el.firstElementChild
        ? (el.firstElementChild as HTMLElement).offsetWidth + 12
        : 280;
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
      {/* Cabeçalho "EM ALTA" */}
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

      {/* Faixa Carrossel Horizontal Snap com cards vermelhos */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onPointerDown={pauseAutoplay}
        onTouchStart={pauseAutoplay}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 pt-1 px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {EM_ALTA_ITEMS.map((item, i) => {
          const isActive = i === activeIndex;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => handleOpenItem(item)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.2) }}
              className="snap-center shrink-0 w-[82%] sm:w-[50%] md:w-[46%] lg:w-[32%] active:scale-[0.99] text-left cursor-pointer focus-visible:outline-none"
            >
              <div
                className={`relative w-full h-[140px] overflow-hidden rounded-2xl transition-all duration-300 flex transform-gpu will-change-transform bg-brand-gradient ${
                  isActive
                    ? 'opacity-100 scale-100 shadow-xl shadow-red-950/40 ring-1 ring-white/20'
                    : 'opacity-90 scale-[0.98]'
                }`}
              >
                {/* SVGs jurídicos decorativos ao fundo */}
                <svg
                  aria-hidden="true"
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
                  aria-hidden="true"
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

                {/* Capa com destaque */}
                <div className="relative h-full w-[96px] sm:w-[104px] shrink-0 flex items-center justify-center px-2 z-[1]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-white/25" />
                  </div>
                  {item.cover && (
                    <img
                      src={cdnImg(item.cover, 240)}
                      alt={item.title}
                      loading={i === 0 ? 'eager' : 'lazy'}
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

                {/* Texto e detalhes à direita */}
                <div className="relative flex-1 min-w-0 flex flex-col justify-end px-3 pb-3 pt-3 z-[1]">
                  <span className="self-start flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-white mb-1.5 bg-black/40 backdrop-blur-sm">
                    <Icon className="w-2.5 h-2.5" />
                    {item.badge}
                  </span>
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-white/85">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.sublabel}</span>
                  </div>
                  <p className="font-display text-white text-[13.5px] sm:text-[14px] font-semibold leading-snug line-clamp-2 drop-shadow-sm pr-6">
                    {item.title}
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

      {/* Indicador de Paginação */}
      <CarouselDots total={EM_ALTA_ITEMS.length} activeIndex={activeIndex} />
    </section>
  );
};

export default memo(HomeEmAltaCarousel);
