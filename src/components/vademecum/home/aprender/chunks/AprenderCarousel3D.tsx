import { useMemo, useRef, useEffect, useState, useCallback, memo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Play } from 'lucide-react';
import { AprenderItem } from './aprenderCarouselTypes';

interface AprenderCarousel3DProps {
  items: AprenderItem[];
  onItemClick: (item: { id: string }) => void;
}

const CARD_W = 114; // px
const GAP = 14; // px
const STEP = CARD_W + GAP; // 128px

export const AprenderCarousel3D = memo(({ items, onItemClick }: AprenderCarousel3DProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const didInitRef = useRef(false);

  // Triplica os itens para criar o loop contínuo e infinito idêntico à biblioteca
  const lista = useMemo(() => (items.length ? [...items, ...items, ...items] : []), [items]);
  const BASE_LEN = items.length;

  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startScroll: number;
    moved: number;
    pointerId: number;
  } | null>(null);

  const lastOpenRef = useRef(0);

  // Detecta o item central via scroll
  const updateActive = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !BASE_LEN) return;
    const idx = Math.round(el.scrollLeft / STEP);
    const clamped = Math.max(0, Math.min(lista.length - 1, idx));
    setActiveIdx(clamped);
  }, [lista.length, BASE_LEN]);

  // Salta invisivelmente para o bloco central quando estiver perto das extremidades
  const normalizeLoop = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !BASE_LEN) return;
    if (activeIdx < BASE_LEN * 0.5) {
      el.scrollTo({ left: (activeIdx + BASE_LEN) * STEP, behavior: 'auto' });
    } else if (activeIdx >= BASE_LEN * 2.5) {
      el.scrollTo({ left: (activeIdx - BASE_LEN) * STEP, behavior: 'auto' });
    }
  }, [activeIdx, BASE_LEN]);

  // Inicializa o scroll centralizado no segundo bloco
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !BASE_LEN || didInitRef.current) return;
    el.scrollTo({ left: BASE_LEN * STEP, behavior: 'auto' });
    didInitRef.current = true;
    updateActive();
  }, [BASE_LEN, updateActive]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateActive();
    const onScroll = () => updateActive();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [updateActive]);

  // Normaliza o loop quando o usuário para de interagir
  useEffect(() => {
    if (paused) return;
    const t = window.setTimeout(normalizeLoop, 200);
    return () => clearTimeout(t);
  }, [paused, activeIdx, normalizeLoop]);

  // Auto-avanço a cada 3.2s (pausa ao interagir)
  useEffect(() => {
    if (paused || lista.length === 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    const id = window.setInterval(() => {
      if (document.querySelector('[role="dialog"],[data-state="open"][data-radix-dialog-content]')) return;
      const next = (activeIdx + 1) % lista.length;
      el.scrollTo({ left: next * STEP, behavior: 'smooth' });
    }, 3200);
    return () => clearInterval(id);
  }, [paused, activeIdx, lista.length]);

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: lista.length,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => STEP,
    overscan: 4,
  });

  const sidePad = 'calc(50% - 57px)'; // Metade da tela menos metade do card (114 / 2 = 57px)

  const onScrollerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setPaused(true);
    const scroller = scrollerRef.current;
    if (scroller) scroller.scrollTo({ left: scroller.scrollLeft, behavior: 'auto' });
    if (e.pointerType !== 'mouse') return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
      pointerId: e.pointerId,
    };
  };

  const onScrollerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d?.active || e.pointerId !== d.pointerId) return;
    const el = scrollerRef.current;
    if (!el) return;
    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));
    if (d.moved > 6) {
      if (!el.hasPointerCapture(e.pointerId)) {
        try { el.setPointerCapture(e.pointerId); } catch {}
        el.style.cursor = 'grabbing';
      }
      el.scrollLeft = d.startScroll - dx;
    }
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const el = scrollerRef.current;
    if (el) el.style.cursor = '';
    if (d?.active && el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    setTimeout(() => setPaused(false), 1500);
    if (d) {
      setTimeout(() => {
        if (dragRef.current === d) dragRef.current = null;
      }, 0);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden">
      <div
        ref={scrollerRef}
        className="overflow-x-auto no-scrollbar snap-x snap-mandatory md:cursor-grab select-none overscroll-x-contain"
        style={{ scrollPaddingInline: sidePad }}
        onPointerDown={onScrollerPointerDown}
        onPointerMove={onScrollerPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => setPaused(false)}
        onTouchStart={() => setPaused(true)}
        onTouchEnd={() => setTimeout(() => setPaused(false), 1500)}
      >
        <div
          className="relative pb-6 pt-8"
          style={{
            height: '280px',
            width: `${columnVirtualizer.getTotalSize()}px`,
            marginLeft: sidePad,
            marginRight: sidePad,
          }}
        >
          {columnVirtualizer.getVirtualItems().map((virtualColumn) => {
            const i = virtualColumn.index;
            const item = lista[i];
            const isActive = i === activeIdx;

            if (!item) return null;

            const openThis = () => {
              const now = Date.now();
              if (now - lastOpenRef.current < 800) return;
              lastOpenRef.current = now;
              onItemClick(item);
            };

            return (
              <button
                key={virtualColumn.key}
                data-cover-item
                type="button"
                onClick={(e) => {
                  if ((dragRef.current?.moved ?? 0) > 6) {
                    e.preventDefault();
                    return;
                  }
                  openThis();
                }}
                draggable={false}
                className="absolute top-0 pt-8 shrink-0 snap-center outline-none group cursor-pointer flex flex-col justify-start"
                style={{
                  width: CARD_W,
                  touchAction: 'pan-x pan-y',
                  transform: `translateX(${virtualColumn.start}px)`,
                }}
                aria-label={item.fullName || item.text}
              >
                <div
                  className="relative rounded-2xl overflow-hidden bg-muted transition-transform duration-500 ease-out will-change-transform w-full"
                  style={{
                    aspectRatio: '2 / 3',
                    transform: isActive ? 'scale(1.14)' : 'scale(0.86)',
                    opacity: isActive ? 1 : 0.55,
                    boxShadow: isActive
                      ? '0 24px 40px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(225,29,72,0.45)'
                      : '0 10px 20px -10px rgba(0,0,0,0.5)',
                    filter: isActive ? 'none' : 'saturate(0.85) brightness(0.85)',
                    transitionProperty: 'transform, opacity, filter, box-shadow',
                    borderRadius: '16px',
                    clipPath: 'inset(0 round 16px)',
                    WebkitClipPath: 'inset(0 round 16px)',
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.text}
                    loading={i < 8 ? 'eager' : 'lazy'}
                    {...(i < 8 ? { fetchPriority: 'high' } : {})}
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{
                      borderRadius: '16px',
                      clipPath: 'inset(0 round 16px)',
                      WebkitClipPath: 'inset(0 round 16px)',
                    }}
                  />

                  {/* Gradiente de contraste inferior */}
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"
                    style={{
                      borderRadius: '16px',
                      clipPath: 'inset(0 round 16px)',
                      WebkitClipPath: 'inset(0 round 16px)',
                    }}
                  />

                  {/* Botão Play central translúcido */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isActive ? 'opacity-90 scale-100' : 'opacity-0 scale-75'
                      }`}
                    >
                      <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Reflexo / brilho passando pela capa ao ficar ativa */}
                  {isActive && (
                    <span
                      key={`shine-${i}-${activeIdx}`}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 overflow-hidden"
                      style={{
                        borderRadius: '16px',
                        clipPath: 'inset(0 round 16px)',
                        WebkitClipPath: 'inset(0 round 16px)',
                      }}
                    >
                      <span
                        className="absolute top-0 left-0 h-full w-1/2"
                        style={{
                          background:
                            'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.6) 50%, transparent 80%)',
                          transform: 'translateX(-120%) skewX(-18deg)',
                          animation: 'aprender-cover-shine 1.4s ease-out 0.15s forwards',
                        }}
                      />
                    </span>
                  )}
                </div>

                {/* Título e legenda apenas na capa central */}
                <div
                  className="mt-3 text-center transition-opacity duration-300 w-full"
                  style={{ opacity: isActive ? 1 : 0 }}
                >
                  <p className="text-[13px] font-bold text-foreground leading-tight line-clamp-1 px-1">
                    {item.fullName || item.text}
                  </p>
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 px-1">
                    Aprender Direito
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes aprender-cover-shine {
          0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translateX(260%) skewX(-18deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
});

AprenderCarousel3D.displayName = 'AprenderCarousel3D';

