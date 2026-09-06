import { useMemo, useRef, useEffect, useState, useCallback, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';
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

/** Posição visual em leque (deck de 7 cards) com profundidade e perspectiva */
const getSlot = (diff: number) => {
  switch (diff) {
    case 0:
      return { x: 0, y: 0, rotate: 0, scale: 1.07, opacity: 1, z: 70 };
    case 1:
      return { x: 68, y: 9, rotate: 8.5, scale: 0.9, opacity: 0.92, z: 60 };
    case 2:
      return { x: 118, y: 19, rotate: 15.5, scale: 0.78, opacity: 0.68, z: 50 };
    case 3:
      return { x: 156, y: 29, rotate: 22, scale: 0.67, opacity: 0.42, z: 40 };
    case -1:
      return { x: -68, y: 9, rotate: -8.5, scale: 0.9, opacity: 0.92, z: 60 };
    case -2:
      return { x: -118, y: 19, rotate: -15.5, scale: 0.78, opacity: 0.68, z: 50 };
    case -3:
      return { x: -156, y: 29, rotate: -22, scale: 0.67, opacity: 0.42, z: 40 };
    default:
      if (diff > 0) {
        return { x: 180, y: 36, rotate: 26, scale: 0.58, opacity: 0, z: 10 };
      }
      return { x: -180, y: 36, rotate: -26, scale: 0.58, opacity: 0, z: 10 };
  }
};

/** Gera o path SVG exato do contorno com cantos arredondados iniciando no topo central (12h) no sentido horário */
const getCardPath = (w: number, h: number, r = 16) => {
  const pad = 1;
  const x = pad;
  const y = pad;
  const width = w - pad * 2;
  const height = h - pad * 2;
  const radius = Math.min(r, width / 2, height / 2);

  return `M ${x + width / 2} ${y} H ${x + width - radius} A ${radius} ${radius} 0 0 1 ${x + width} ${y + radius} V ${y + height - radius} A ${radius} ${radius} 0 0 1 ${x + width - radius} ${y + height} H ${x + radius} A ${radius} ${radius} 0 0 1 ${x} ${y + height - radius} V ${y + radius} A ${radius} ${radius} 0 0 1 ${x + radius} ${y} Z`.replace(/\s+/g, ' ').trim();
};

const RecomendacoesCarousel = ({ onAbrirLivro }: Props) => {
  const navigate = useNavigate();
  const { data: classicos = [] } = useColecao('classicos');
  const items = useMemo(() => shuffle(classicos).slice(0, 20), [classicos]);
  const total = items.length;

  const [ativo, setAtivo] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  const lastWheelTime = useRef(0);
  const lastOpenRef = useRef(0);

  // Dimensões responsivas do card ajustadas para proporção de capa de livro
  const [cardDims, setCardDims] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      return { w: 150, h: 212 };
    }
    return { w: 138, h: 196 };
  });

  useEffect(() => {
    const handleResize = () => {
      setCardDims(window.innerWidth >= 640 ? { w: 150, h: 212 } : { w: 138, h: 196 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pathD = useMemo(() => getCardPath(cardDims.w, cardDims.h, 16), [cardDims]);

  // Pré-carrega as 4 primeiras capas na memória
  useEffect(() => {
    items.slice(0, 4).forEach((item) => {
      if (item.capa) prefetchImage(item.capa);
    });
  }, [items]);

  // Avanço automático perfeitamente sincronizado com o término do ciclo da luzinha (5.5s)
  const handleTimerComplete = useCallback(() => {
    if (total <= 1) return;
    if (document.querySelector('[role="dialog"],[data-state="open"][data-radix-dialog-content]')) return;
    setAtivo((i) => (i + 1) % total);
  }, [total]);

  const handlePrev = useCallback(() => {
    setPaused(true);
    setAtivo((i) => (i - 1 + total) % total);
    setTimeout(() => setPaused(false), 400);
  }, [total]);

  const handleNext = useCallback(() => {
    setPaused(true);
    setAtivo((i) => (i + 1) % total);
    setTimeout(() => setPaused(false), 400);
  }, [total]);

  // Touch handlers nativos para celular / tablet
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      };
      isSwipingRef.current = false;
      setPaused(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwipingRef.current = true;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = (e.changedTouches[0]?.clientX || 0) - touchStartRef.current.x;
    const deltaY = (e.changedTouches[0]?.clientY || 0) - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    if (isSwipingRef.current || (Math.abs(deltaX) > 24 && Math.abs(deltaX) > Math.abs(deltaY))) {
      const velocityX = deltaX / Math.max(deltaTime, 1);
      const isFar = Math.abs(deltaX) > 110;
      const isFast = Math.abs(velocityX) > 0.7;
      const step = (isFar && isFast) ? 2 : 1;

      if (deltaX < -22 || velocityX < -0.28) {
        setAtivo((i) => (i + step) % total);
      } else if (deltaX > 22 || velocityX > 0.28) {
        setAtivo((i) => (i - step + total) % total);
      }

      setIsDragging(true);
      setTimeout(() => setIsDragging(false), 120);
    } else {
      setIsDragging(false);
    }
    setTimeout(() => setPaused(false), 400);
  }, [total]);

  // Suporte a scroll com mouse / trackpad no Desktop
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 20) {
      const now = Date.now();
      if (now - lastWheelTime.current > 300) {
        lastWheelTime.current = now;
        if (e.deltaX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  }, [handleNext, handlePrev]);

  const activeItem = useMemo(() => {
    if (!items || total === 0) return null;
    return items[ativo] || items[0];
  }, [items, ativo, total]);

  const openBook = useCallback((livro: LivroNormalizado) => {
    const now = Date.now();
    if (now - lastOpenRef.current < 600) return;
    lastOpenRef.current = now;
    onAbrirLivro(livro);
  }, [onAbrirLivro]);

  // Cor de contorno primária que harmoniza com a marca e a barra vermelha do título
  const activeBorderColor = '#E11D48';

  if (total === 0) {
    return (
      <div className="mt-6 mb-8 select-none overflow-hidden">
        <div className="px-4 mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-1 h-7 rounded-full bg-primary shrink-0" aria-hidden />
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight truncate">
              Selecionados para você
            </h2>
          </div>
        </div>
        <div className="w-full pt-3 pb-2 flex flex-col items-center">
          <div className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-[420px] h-[240px] sm:h-[260px]">
            <div className="absolute w-[138px] h-[196px] rounded-2xl bg-white/[0.02] border border-white/5 -translate-x-[156px] translate-y-[29px] -rotate-[22deg] scale-[0.67] opacity-40" />
            <div className="absolute w-[138px] h-[196px] rounded-2xl bg-white/[0.02] border border-white/5 translate-x-[156px] translate-y-[29px] rotate-[22deg] scale-[0.67] opacity-40" />
            <div className="absolute w-[138px] h-[196px] rounded-2xl bg-white/[0.03] border border-white/10 -translate-x-[118px] translate-y-[19px] -rotate-[15.5deg] scale-[0.78] opacity-65" />
            <div className="absolute w-[138px] h-[196px] rounded-2xl bg-white/[0.03] border border-white/10 translate-x-[118px] translate-y-[19px] rotate-[15.5deg] scale-[0.78] opacity-65" />
            <div className="absolute z-10 w-[138px] h-[196px] rounded-2xl bg-white/[0.05] border border-white/10 -translate-x-[68px] translate-y-[9px] -rotate-[8.5deg] scale-[0.9] opacity-85" />
            <div className="absolute z-10 w-[138px] h-[196px] rounded-2xl bg-white/[0.05] border border-white/10 translate-x-[68px] translate-y-[9px] rotate-[8.5deg] scale-[0.9] opacity-85" />
            <div className="absolute z-20 w-[138px] sm:w-[150px] h-[196px] sm:h-[212px] rounded-2xl bg-white/[0.08] border-[1.5px] border-white/20 shadow-[0_15px_40px_rgba(255,255,255,0.1)] scale-[1.07] flex items-end justify-center p-3">
              <div className="w-24 h-3 bg-white/20 rounded animate-pulse" />
            </div>
          </div>
          <div className="mt-2 w-44 h-3.5 bg-white/10 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="mt-6 mb-8 relative w-full flex flex-col items-center select-none overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Cabeçalho da seção */}
      <div className="w-full px-4 mb-3 flex items-center justify-between gap-3">
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

      {/* Container principal do Deck de Cards em leque (7 cards) */}
      <div className="relative flex items-center justify-center w-full max-w-[360px] sm:max-w-[420px] h-[240px] sm:h-[260px]">
        {/* Botão de navegação anterior */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Livro anterior"
          className="absolute -left-1 sm:left-1 z-[75] w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Botão de navegação próximo */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Próximo livro"
          className="absolute -right-1 sm:right-1 z-[75] w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 border border-white/15 flex items-center justify-center text-white/80 hover:text-white backdrop-blur-md transition-all active:scale-95"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Deck interativo com suporte a swipe horizontal com o dedo e drag */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => {
            setIsDragging(true);
            setPaused(true);
          }}
          onDragEnd={(_, info) => {
            setTimeout(() => setIsDragging(false), 120);
            const isFar = Math.abs(info.offset.x) > 110;
            const isFast = Math.abs(info.velocity.x) > 550;
            const step = (isFar && isFast) ? 2 : 1;

            if (info.offset.x < -24 || info.velocity.x < -180) {
              setAtivo((i) => (i + step) % total);
            } else if (info.offset.x > 24 || info.velocity.x > 180) {
              setAtivo((i) => (i - step + total) % total);
            }
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          className="relative flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing touch-pan-y"
        >
          {items.map((item, i) => {
            let diff = (i - ativo) % total;
            if (diff > total / 2) diff -= total;
            if (diff < -total / 2) diff += total;

            const slot = getSlot(diff);
            const frente = diff === 0;

            if (Math.abs(diff) > 3) return null;

            return (
              <motion.div
                key={`${item.colecaoId}:${item.id}:${i}`}
                animate={{
                  x: slot.x,
                  y: slot.y,
                  rotate: slot.rotate,
                  scale: slot.scale,
                  opacity: slot.opacity,
                }}
                transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  zIndex: slot.z,
                }}
                onClick={(e) => {
                  if (isDragging || isSwipingRef.current) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                  }
                  if (frente) {
                    openBook(item);
                  } else {
                    setPaused(true);
                    setAtivo(i);
                    setTimeout(() => setPaused(false), 400);
                  }
                }}
                className="absolute w-[138px] sm:w-[150px] h-[196px] sm:h-[212px] shrink-0 cursor-pointer will-change-transform"
              >
                {/* Card do livro com contorno refinado e limpo (SEM título dentro da capa) */}
                <div
                  className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 transition-colors duration-300 ${
                    frente
                      ? 'border border-white/10'
                      : 'border border-white/15 shadow-black/60'
                  }`}
                  style={{
                    boxShadow: frente
                      ? '0 18px 42px -6px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)'
                      : undefined,
                    clipPath: 'inset(0 round 16px)',
                    WebkitClipPath: 'inset(0 round 16px)',
                  }}
                >
                  {/* Capa do livro completa com as cores 100% reais sem escurecer e sem texto em cima */}
                  {item.capa ? (
                    <img
                      src={directImg(item.capa, 480)}
                      alt={item.titulo}
                      loading={Math.abs(diff) <= 1 ? 'eager' : 'lazy'}
                      decoding="async"
                      className="w-full h-full object-cover pointer-events-none select-none block"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-center text-xs text-zinc-400 bg-zinc-900">
                      {item.titulo}
                    </div>
                  )}

                  {/* Camada de escurecimento suave apenas nos cards secundários do fundo */}
                  {!frente && (
                    <div className="absolute inset-0 bg-black/35 pointer-events-none" />
                  )}

                  {/* Animação de reflexo de luz (sheen sweep) cruzando a capa quando ela entra em foco */}
                  {frente && (
                    <motion.div
                      key={`reflexo-livro-${item.id}`}
                      initial={{ x: '-150%', opacity: 0 }}
                      animate={{ x: '180%', opacity: [0, 0.65, 0.65, 0] }}
                      transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      className="absolute inset-y-0 w-3/4 -skew-x-12 pointer-events-none z-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    />
                  )}
                </div>

                {/* Linha fina com luzinha animada percorrendo o contorno em sentido único (5.5s) */}
                {frente && (
                  <svg
                    key={`beam-livro-${ativo}`}
                    className="absolute inset-0 w-full h-full pointer-events-none z-30 overflow-visible"
                    style={{ width: cardDims.w, height: cardDims.h }}
                  >
                    <style>{`
                      @keyframes livroBorderProgress {
                        0% { stroke-dashoffset: 1000; }
                        100% { stroke-dashoffset: 0; }
                      }
                      @keyframes livroBorderGlow {
                        0% { stroke-dashoffset: 0; }
                        100% { stroke-dashoffset: -1000; }
                      }
                    `}</style>

                    {/* Linha base fina e sutil contornando a capa */}
                    <path
                      d={pathD}
                      pathLength="1000"
                      fill="none"
                      stroke={activeBorderColor}
                      strokeWidth="1.5"
                      strokeOpacity="0.28"
                    />

                    {/* Linha fina que vai aparecendo progressivamente ao longo do contorno */}
                    <path
                      d={pathD}
                      pathLength="1000"
                      fill="none"
                      stroke={activeBorderColor}
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: '1000 1000',
                        animation: 'livroBorderProgress 5.5s linear forwards',
                        animationPlayState: paused ? 'paused' : 'running',
                        filter: `drop-shadow(0 0 3px ${activeBorderColor})`,
                      }}
                      onAnimationEnd={handleTimerComplete}
                    />

                    {/* Luzinha brilhante que vai percorrendo na ponta da linha em sentido contínuo */}
                    <path
                      d={pathD}
                      pathLength="1000"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      style={{
                        strokeDasharray: '70 930',
                        animation: 'livroBorderGlow 5.5s linear forwards',
                        animationPlayState: paused ? 'paused' : 'running',
                        filter: `drop-shadow(0 0 4px #FFFFFF) drop-shadow(0 0 8px ${activeBorderColor})`,
                      }}
                    />
                  </svg>
                )}

                {/* Animação de reflexo espelhado no chão sob o livro ativo com a cor real da arte */}
                {frente && item.capa && (
                  <motion.div
                    key={`reflexo-chao-livro-${item.id}`}
                    initial={{ opacity: 0, y: -2 }}
                    animate={{ opacity: 0.42, y: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="absolute top-[calc(100%+3px)] left-0 right-0 h-[44px] sm:h-[50px] rounded-b-xl overflow-hidden pointer-events-none select-none"
                    style={{
                      maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 88%)',
                      WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 88%)',
                    }}
                  >
                    <img
                      src={directImg(item.capa, 480)}
                      alt=""
                      aria-hidden="true"
                      className="w-full h-[196px] sm:h-[212px] object-cover block origin-top"
                      style={{
                        transform: 'scaleY(-1)',
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Título e autor FORA da capa com máxima ênfase (exatamente conforme solicitado) */}
      {activeItem && (
        <div className="mt-2 text-center px-4 max-w-sm mx-auto min-h-[46px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22 }}
              className="w-full"
            >
              <p className="text-[13px] sm:text-[14px] font-bold text-white leading-tight line-clamp-1 px-1 drop-shadow-sm">
                {activeItem.titulo}
              </p>
              {activeItem.autor && (
                <p className="text-[11.5px] sm:text-[12px] text-zinc-400 font-medium line-clamp-1 mt-0.5 px-1">
                  {activeItem.autor}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default memo(RecomendacoesCarousel);
