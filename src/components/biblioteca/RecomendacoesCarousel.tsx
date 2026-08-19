import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { COLECOES, normalizeLivro, type LivroNormalizado } from '@/lib/bibliotecaColecoes';
import { directImg, prefetchImage } from '@/lib/cdnImg';
import { getPersistedColecao, setPersistedColecao } from '@/services/offlineDb';
import { withBundleFallback, bundle } from '@/services/offlineBundle';

interface Props {
  onAbrirLivro: (livro: LivroNormalizado) => void;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const FALLBACK_CLASSICOS: LivroNormalizado[] = [
  {
    id: 144,
    titulo: 'Teoria Pura do Direito',
    autor: 'Hans Kelsen',
    sobre: 'Obra fundamental da Teoria do Direito Positivo e do Normativismo Jurídico.',
    capa: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/71eYvr0bSLSL1500jpg-1766360547800.webp',
    link: null,
    download: 'https://drive.google.com/file/d/1XFuOCvzSjk_XWO4xGaWwNqWG_6MsxYYl/view?usp=drive_link',
    area: 'Teoria do Direito',
    colecaoId: 'classicos',
  },
  {
    id: 138,
    titulo: 'Sobre a Liberdade',
    autor: 'John Stuart Mill',
    sobre: 'Ensaio clássico sobre os limites do poder da sociedade sobre o indivíduo.',
    capa: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/71FHYdhM7aLSL1500jpg-1766360519810.webp',
    link: null,
    download: 'https://drive.google.com/file/d/1WeTT6eY67FoI7Jh9HuSKmrvgSwOF5iyr/view?usp=drivesdk',
    area: 'Filosofia Política',
    colecaoId: 'classicos',
  },
  {
    id: 141,
    titulo: 'Ética a Nicômaco',
    autor: 'Aristóteles',
    sobre: 'Tratado clássico sobre a virtude, a justiça e a busca da felicidade.',
    capa: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/61Sb1jtAmELSL1360jpg-1766360534829.webp',
    link: null,
    download: 'https://drive.google.com/file/d/1fDqngE5NhIvFiVD6GE2t_ebdepqP0uH9/view?usp=drivesdk',
    area: 'Filosofia do Direito',
    colecaoId: 'classicos',
  },
  {
    id: 140,
    titulo: 'O Príncipe',
    autor: 'Nicolau Maquiavel',
    sobre: 'Tratado de ciência política sobre o exercício e a manutenção do poder.',
    capa: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/81h4CdNxdgLSL1500jpg-1766360530643.webp',
    link: null,
    download: 'https://drive.google.com/file/d/1fxskqftGKsAoCYWElzSX9NGZ3dj7E8O7/view?usp=drivesdk',
    area: 'Filosofia Política',
    colecaoId: 'classicos',
  },
  {
    id: 126,
    titulo: 'O Leviatã',
    autor: 'Thomas Hobbes',
    sobre: 'Tratado sobre soberania, contrato social e filosofia política moderna.',
    capa: 'https://izspjvegxdfgkgibpyst.supabase.co/storage/v1/object/public/imagens/noticias/A194TdWrFJLSL1500jpg-1766360475597.webp',
    link: null,
    download: 'https://drive.google.com/file/d/15oWYvvoQT3OLhS32VU2vB2MGz-8KnHTE/view?usp=drivesdk',
    area: 'Filosofia Política',
    colecaoId: 'classicos',
  },
];

const useColecao = (id: string) => {
  const cfg = COLECOES.find((c) => c.id === id);
  const [seed, setSeed] = useState<LivroNormalizado[] | undefined>(undefined);

  // Hidrata do IndexedDB imediatamente (offline-first).
  useEffect(() => {
    let alive = true;
    getPersistedColecao<LivroNormalizado>(id).then((cached) => {
      if (alive && cached && cached.length) setSeed(cached);
    });
    return () => { alive = false; };
  }, [id]);

  return useQuery<LivroNormalizado[]>({
    queryKey: ['biblioteca-colecao', id],
    enabled: !!cfg,
    staleTime: 30 * 60 * 1000,
    initialData: seed,
    placeholderData: id === 'classicos' ? FALLBACK_CLASSICOS : undefined,
    queryFn: async () => {
      if (!cfg) return [];
      try {
        let q: any = supabase.from(cfg.table as any).select(cfg.select);
        if (cfg.orderBy) q = q.order(cfg.orderBy, { ascending: true, nullsFirst: false });
        
        const data = await withBundleFallback(
          q.limit(2000).then((res: any) => {
            if (res.error) throw res.error;
            return res.data;
          }),
          async () => {
             const bundleFnName = 'biblioteca' + id.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
             if ((bundle as any)[bundleFnName]) {
               return await (bundle as any)[bundleFnName]();
             }
             return [];
          }
        );
        
        const list = (data as any[]).map((r) => normalizeLivro(r, cfg));
        setPersistedColecao(id, list).catch(() => {});
        return list;
      } catch (e) {
        // Falha de rede extrema: devolve cache persistido para manter carrossel visível.
        const cached = await getPersistedColecao<LivroNormalizado>(id);
        if (cached && cached.length) return cached;
        return FALLBACK_CLASSICOS;
      }
    },
  });
};

const CARD_W = 110; // px
const GAP = 14; // px
const STEP = CARD_W + GAP;

const RecomendacoesCarousel = ({ onAbrirLivro }: Props) => {
  const navigate = useNavigate();
  const { data: classicos = [] } = useColecao('classicos');
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const didInitRef = useRef(false);

  const base = useMemo(() => shuffle(classicos).slice(0, 20), [classicos]);
  // Triplica para simular loop infinito: [base | base | base]
  const lista = useMemo(() => (base.length ? [...base, ...base, ...base] : []), [base]);
  const BASE_LEN = base.length;

  useEffect(() => {
    // Pré-carrega as 4 primeiras capas na memória para eliminar tempo de pintura ao renderizar
    base.slice(0, 4).forEach(item => prefetchImage(item.capa));
  }, [base]);

  // Drag-to-scroll no desktop (mouse). Precisa ficar antes de qualquer retorno condicional
  // para manter a ordem dos hooks estável enquanto os livros carregam.
  const dragRef = useRef<{
    active: boolean;
    startX: number;
    startScroll: number;
    moved: number;
    pointerId: number;
  } | null>(null);

  // Guarda contra abertura dupla: no PWA/app nativo o mesmo toque dispara
  // `pointerup` **e** o `click` sintetizado (ou `pointercancel` + `click`),
  // o que abria o livro duas vezes e travava a tela com dois overlays.
  const lastOpenRef = useRef(0);

  // Tap tracking por card (fallback confiável para toque, evita que scroll-snap
  // ou pointer-capture engulam o click nativo). No PWA/app nativo o toque
  // costuma interromper o auto-scroll suave, e o navegador dispara
  // `pointercancel` em vez de `pointerup`/`click` — por isso guardamos também
  // o deslocamento e o scroll inicial para reconhecer o tap nesse caso.
  const tapRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    livroKey: string;
    t: number;
    moved: number;
    startScroll: number;
  } | null>(null);

  // Detecta o item central via scroll
  const updateActive = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !BASE_LEN) return;
    const idx = Math.round(el.scrollLeft / STEP);
    const clamped = Math.max(0, Math.min(lista.length - 1, idx));
    setActiveIdx(clamped);
  }, [lista.length, BASE_LEN]);

  // Salta invisivelmente para o bloco central se estiver muito perto das bordas
  const normalizeLoop = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || !BASE_LEN) return;
    if (activeIdx < BASE_LEN * 0.5) {
      el.scrollTo({ left: (activeIdx + BASE_LEN) * STEP, behavior: 'auto' });
    } else if (activeIdx >= BASE_LEN * 2.5) {
      el.scrollTo({ left: (activeIdx - BASE_LEN) * STEP, behavior: 'auto' });
    }
  }, [activeIdx, BASE_LEN]);

  // Inicializa o scroll no meio (bloco central) assim que os itens montarem
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

  // Normaliza loop quando o usuário para de interagir
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
      // Não avança enquanto um livro/modal estiver aberto por cima: o
      // scroll em segundo plano roubava o toque e travava a interação.
      if (document.querySelector('[role="dialog"],[data-state="open"][data-radix-dialog-content]')) return;
      const next = (activeIdx + 1) % lista.length;
      el.scrollTo({ left: next * STEP, behavior: 'smooth' });
    }, 3200);
    return () => clearInterval(id);
  }, [paused, activeIdx, lista.length]);

  const isLoading = lista.length === 0;
  const displayList: (LivroNormalizado | null)[] = isLoading
    ? Array.from({ length: 9 }, () => null)
    : lista;

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: displayList.length,
    getScrollElement: () => scrollerRef.current,
    estimateSize: () => STEP,
    overscan: 4,
  });

  const sidePad = 'calc(50% - 55px)'; // metade da tela menos metade do card

  const onScrollerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setPaused(true);
    // Congela o auto-scroll suave em andamento: se ele continuar durante o
    // toque, o navegador cancela o pointer e o tap no card se perde.
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
    // NÃO capturamos o pointer no pointerdown — só quando o usuário realmente
    // arrastar (threshold > 6px). Capturar imediatamente pode engolir o click
    // do card em alguns navegadores.
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
    // Mantém `moved` por 1 tick para que o onClick do card veja o valor
    if (d) {
      setTimeout(() => {
        if (dragRef.current === d) dragRef.current = null;
      }, 0);
    }
  };

  return (
    <div className="mt-6 mb-8">
      <div className="px-4 mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="w-1 h-7 rounded-full bg-primary shrink-0" aria-hidden />
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight truncate">
            Selecionados para você
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/bibliotecas/classicos')}
          aria-label="Ver todos os clássicos do direito"
          className="shrink-0 inline-flex items-center gap-1 min-h-11 px-2 -mr-2 text-[12px] font-semibold text-primary hover:opacity-80 active:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-md"
        >
          Ver todos
          <ChevronRight className="w-4 h-4" aria-hidden />
        </button>
      </div>

      <div
        ref={scrollerRef}
        className="overflow-x-auto no-scrollbar snap-x snap-mandatory md:cursor-grab select-none"
        style={{ scrollPaddingInline: sidePad }}
        onPointerDown={onScrollerPointerDown}
        onPointerMove={onScrollerPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => setPaused(false)}
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
            const livro = displayList[i];
            const isActive = i === activeIdx;

            if (!livro) {
              return (
                <div
                  key={`skeleton-${virtualColumn.key}`}
                  data-cover-item
                  className="absolute shrink-0 snap-center top-0 pt-8"
                  style={{ width: CARD_W, transform: `translateX(${virtualColumn.start}px)` }}
                  aria-hidden
                >
                  <div
                    className="relative rounded-xl overflow-hidden bg-muted/60 animate-pulse"
                    style={{
                      aspectRatio: '2 / 3',
                      transform: i === 4 ? 'scale(1.14)' : 'scale(0.86)',
                      opacity: i === 4 ? 1 : 0.55,
                    }}
                  />
                </div>
              );
            }
            const cardKey = `${livro.colecaoId}:${livro.id}:${i}`;
            const openThis = () => {
              const now = Date.now();
              if (now - lastOpenRef.current < 800) return;
              lastOpenRef.current = now;
              onAbrirLivro(livro);
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
                aria-label={livro.titulo}
              >

                <div
                  className="relative rounded-xl overflow-hidden bg-muted transition-transform duration-500 ease-out will-change-transform w-full"
                  style={{
                    aspectRatio: '2 / 3',
                    transform: isActive ? 'scale(1.14)' : 'scale(0.86)',
                    opacity: isActive ? 1 : 0.55,
                    boxShadow: isActive
                      ? '0 24px 40px -12px rgba(0,0,0,0.6), 0 0 0 1px hsl(var(--primary) / 0.35)'
                      : '0 10px 20px -10px rgba(0,0,0,0.5)',
                    filter: isActive ? 'none' : 'saturate(0.85) brightness(0.85)',
                    transitionProperty: 'transform, opacity, filter, box-shadow',
                  }}
                >
                  {livro.capa ? (
                    <img
                      src={directImg(livro.capa, 480)}
                      alt={livro.titulo}
                      loading={i < 3 ? 'eager' : 'lazy'}
                      {...(i < 3 ? { fetchPriority: 'high' } : {})}
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                      {livro.titulo}
                    </div>
                  )}

                  {/* Reflexo/brilho que passa quando fica ativa */}
                  {isActive && (
                    <span
                      key={`shine-${i}-${activeIdx}`}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
                    >
                      <span
                        className="absolute top-0 left-0 h-full w-1/2"
                        style={{
                          background:
                            'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.55) 50%, transparent 80%)',
                          transform: 'translateX(-120%) skewX(-18deg)',
                          animation: 'cover-shine 1.4s ease-out 0.15s forwards',
                        }}
                      />
                    </span>
                  )}
                </div>

                {/* Título e autor só na capa central */}
                <div
                  className="mt-3 text-center transition-opacity duration-300 w-full"
                  style={{ opacity: isActive ? 1 : 0 }}
                >
                  <p className="text-[13px] font-semibold text-foreground leading-tight line-clamp-1 px-1">
                    {livro.titulo}
                  </p>
                  {livro.autor && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5 px-1">
                      {livro.autor}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>


      <style>{`
        @keyframes cover-shine {
          0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: translateX(260%) skewX(-18deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default RecomendacoesCarousel;
