import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Clock, ArrowUpRight, Newspaper, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  getNoticiasCache,
  prefetchNoticias,
  subscribeNoticias,
  type Noticia,
} from '@/services/noticiasService';
import { newsImg } from '@/lib/cdnImg';
import NoticiaViewerSheet from '@/components/vademecum/NoticiaViewerSheet';

const AUTOPLAY_MS = 10000;
const MAX_NEWS = 10;

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  if (sameDay) return `Hoje · ${hh}:${mm}`;
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${day} ${months[d.getMonth()]} · ${hh}:${mm}`;
}

interface Props {
  /** Classe aplicada ao container do título/descrição. */
  titleClassName?: string;
}

export default function NoticiasJuridicasCarousel({ titleClassName = 'px-5' }: Props) {
  const navigate = useNavigate();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const userInteractingRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [noticias, setNoticias] = useState<Noticia[]>(() => getNoticiasCache() ?? []);
  const [selected, setSelected] = useState<Noticia | null>(null);

  useEffect(() => {
    const unsub = subscribeNoticias((data) => setNoticias(data));
    prefetchNoticias().catch(() => {});
    return unsub;
  }, []);

  const items = useMemo(
    () =>
      [...noticias]
        .sort((a, b) => new Date(b.data_publicacao).getTime() - new Date(a.data_publicacao).getTime())
        .slice(0, MAX_NEWS),
    [noticias],
  );

  const scrollToIndex = useCallback((idx: number, behavior: ScrollBehavior = 'smooth') => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const child = scroller.children[idx] as HTMLElement | undefined;
    if (!child) return;
    const target = child.offsetLeft - (scroller.clientWidth - child.clientWidth) / 2;
    scroller.scrollTo({ left: target, behavior });
  }, []);

  useEffect(() => {
    if (items.length < 2) return;
    const tick = () => {
      if (userInteractingRef.current) return;
      const next = (activeIndex + 1) % items.length;
      setActiveIndex(next);
      scrollToIndex(next);
    };
    autoplayRef.current = window.setInterval(tick, AUTOPLAY_MS);
    return () => {
      if (autoplayRef.current) window.clearInterval(autoplayRef.current);
    };
  }, [activeIndex, items.length, scrollToIndex]);

  const onScroll = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const center = scroller.scrollLeft + scroller.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < scroller.children.length; i++) {
      const child = scroller.children[i] as HTMLElement;
      const mid = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(mid - center);
      if (dist < bestDist) { bestDist = dist; best = i; }
    }
    setActiveIndex(best);
  }, []);

  const pauseAutoplay = () => {
    userInteractingRef.current = true;
    window.setTimeout(() => { userInteractingRef.current = false; }, 4000);
  };

  if (items.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <div className={titleClassName}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-foreground text-[18px] font-bold mb-1 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full bg-primary" />
              Notícias Jurídicas
            </h3>
            <p className="font-body text-muted-foreground text-[12.5px] leading-snug mb-3 ml-3 truncate">
              notícias do mundo jurídico em tempo real
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/noticias')}
            className="shrink-0 mt-0.5 inline-flex items-center gap-0.5 text-[12.5px] font-semibold text-primary active:opacity-70"
          >
            Ver mais
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        onPointerDown={pauseAutoplay}
        onTouchStart={pauseAutoplay}
        className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-1 px-[7.5%] md:px-[4%] lg:px-[3%] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((n, i) => {
          const isActive = i === activeIndex;
          const img = newsImg(n.imagem_url ?? '', 640);
          return (
            <motion.button
              type="button"
              key={n.id}
              onClick={() => setSelected(n)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.2) }}
              className="snap-center shrink-0 w-[85%] md:w-[46%] lg:w-[31%] active:scale-[0.99] text-left"
            >
              <div
                className={`relative w-full h-[140px] overflow-hidden rounded-2xl transition-all duration-300 bg-card ${
                  isActive ? 'opacity-100 scale-100 shadow-lg' : 'opacity-60 scale-[0.94]'
                }`}
              >
                {img ? (
                  <img
                    src={img}
                    alt=""
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover brightness-110 contrast-105 saturate-110"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Newspaper className="w-8 h-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
                  <ArrowUpRight className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                </div>

                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-primary text-primary-foreground">
                  <Newspaper className="w-2.5 h-2.5" />
                  Notícia
                </span>

                <div className="absolute inset-0 flex flex-col justify-end px-4 pb-3 pt-4">
                  <div className="flex items-center gap-2 mb-1 text-[11.5px] text-white/90">
                    <Clock className="w-3 h-3" />
                    <span className="truncate">{formatTime(n.data_publicacao)} · Migalhas</span>
                  </div>
                  <p className="font-display text-white text-[15px] font-normal leading-snug line-clamp-2 drop-shadow-sm">
                    {n.titulo}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <NoticiaViewerSheet noticia={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
