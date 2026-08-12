import { useEffect, useRef, useState, useCallback, memo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  BookOpen,
  Scale,
  Lightbulb,
  RotateCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getTemaCover } from "@/lib/flashcards-tema-cover";
import laurel from '@/assets/landing-tribunal/laurel-leaf.png';
import scales from '@/assets/landing-tribunal/scales.png';
import { haptic } from "@/lib/nativeHaptics";

export interface FlashcardElegante {
  pergunta: string;
  resposta: string;
  explicacao?: string | null;
  exemplo?: string | null;
  dica?: string | null;
  tema?: string | null;
  coverUrl?: string | null;
}

interface Props {
  cards: FlashcardElegante[];
  accent?: string;
  /** Título global (matéria/subtema) exibido na capa quando o card não tem `tema`. */
  titulo?: string;
  /** Chamado quando o usuário chega ao último card e o vira. */
  onComplete?: () => void;
  /** Renderizado no rodapé do último card (ex.: "Ir para Questões"). */
  footerLastCard?: React.ReactNode;
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function triggerConfetti() {
  if (typeof window === 'undefined') return;
  const fire = () => {
    const confetti = (window as any).confetti;
    if (confetti) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#eab308']
      });
    }
  };
  if (!(window as any).confetti) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
    script.onload = fire;
    document.head.appendChild(script);
  } else {
    fire();
  }
}

const FlashcardEleganteViewer = memo(function FlashcardEleganteViewer({
  cards,
  accent = "#10B981",
  titulo,
  onComplete,
  footerLastCard,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const dirRef = useRef<1 | -1>(1);
  const completedRef = useRef(false);

  const x = useMotionValue(0);
  const dragRotate = useTransform(x, [-200, 200], [-10, 10]);

  const flipSoundRef = useRef<HTMLAudioElement | null>(null);
  const slideSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const f = new Audio("/sounds/virar_card.mp3");
      f.volume = 0.3;
      f.preload = "auto";
      flipSoundRef.current = f;
      const s = new Audio("/sounds/deslize.mp3");
      s.volume = 0.3;
      s.preload = "auto";
      slideSoundRef.current = s;
    } catch {}
    return () => {
      flipSoundRef.current = null;
      slideSoundRef.current = null;
    };
  }, []);

  const playFlip = useCallback(() => {
    try {
      if (flipSoundRef.current) {
        flipSoundRef.current.currentTime = 0;
        flipSoundRef.current.play().catch(() => {});
      }
    } catch {}
  }, []);
  const playSlide = useCallback(() => {
    try {
      if (slideSoundRef.current) {
        slideSoundRef.current.currentTime = 0;
        slideSoundRef.current.play().catch(() => {});
      }
    } catch {}
  }, []);

  const total = cards?.length ?? 0;
  const card = cards?.[idx];
  const isLast = idx === total - 1;

  useEffect(() => {
    if (isLast && flipped && !completedRef.current) {
      completedRef.current = true;
      triggerConfetti();
      if (onComplete) {
        onComplete();
      }
    }
  }, [isLast, flipped, onComplete]);

  if (!total || !card) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhum flashcard disponível ainda.
      </div>
    );
  }

  const goNext = () => {
    if (idx >= total - 1) return;
    playSlide();
    dirRef.current = 1;
    setFlipped(false);
    setTimeout(() => setIdx((i) => i + 1), 40);
  };
  const goPrev = () => {
    if (idx <= 0) return;
    playSlide();
    dirRef.current = -1;
    setFlipped(false);
    setTimeout(() => setIdx((i) => i - 1), 40);
  };
  const handleFlip = () => {
    playFlip();
    setFlipped((v) => !v);
  };

  const handleDragEnd = (e: any, { offset }: any) => {
    const swipe = offset.x;
    if (swipe > 100) {
      haptic.success();
      goNext();
    } else if (swipe < -100) {
      haptic.heavy();
      goNext();
    }
  };

  const slideVariants = {
    enter: (dir: 1 | -1) => ({ x: dir * 100, y: 20, rotate: dir * 8, opacity: 0, scale: 0.95 }),
    center: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 },
    exit: (dir: 1 | -1) => ({ x: -dir * 100, y: 20, rotate: -dir * 8, opacity: 0, scale: 0.95 }),
  };

  return (
    <div className="space-y-4">
      {/* Progresso */}
      <div className="flex items-center gap-3">
        <div
          className="relative flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ background: `${accent}1f` }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={false}
            animate={{ width: `${((idx + 1) / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 180, damping: 26 }}
            style={{
              background: `linear-gradient(90deg, ${accent}, color-mix(in oklab, ${accent} 60%, white))`,
              boxShadow: `0 0 12px ${accent}80`,
            }}
          />
        </div>
        <span className="text-xs text-muted-foreground tabular-nums shrink-0">
          {idx + 1} / {total}
        </span>
      </div>

      {/* Card */}
      <div className="relative w-full min-h-[440px] md:min-h-[500px] mt-6" style={{ perspective: "1500px" }}>
        
        {/* Stack Effect (Cards behind) */}
        {!isLast && (
          <div className="absolute inset-0 z-0 flex flex-col items-center pointer-events-none">
            {idx < total - 2 && (
              <div 
                className="absolute w-[84%] h-full rounded-2xl bg-card border shadow-sm transition-all duration-300"
                style={{ top: "-22px", borderColor: `${accent}20`, opacity: 0.4 }}
              />
            )}
            {idx < total - 1 && (
              <div 
                className="absolute w-[92%] h-full rounded-2xl bg-card border shadow-sm transition-all duration-300"
                style={{ top: "-11px", borderColor: `${accent}40`, opacity: 0.7 }}
              />
            )}
          </div>
        )}

        <AnimatePresence mode="wait" custom={dirRef.current}>
          <motion.div
            key={idx}
            custom={dirRef.current}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 28 },
              rotate: { type: "spring", stiffness: 300, damping: 28 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            style={{ 
              willChange: "transform, opacity", 
              transformOrigin: "bottom center",
              x,
              rotate: dragRotate 
            }}
            className="absolute inset-0 z-10"
            drag={!isLast ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
          >
            <motion.div
              className="absolute inset-0 w-full h-full"
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
              style={{
                transformStyle: "preserve-3d",
                willChange: "transform",
                transform: "translateZ(0)",
              }}
            >
              <FrenteCard
                card={card}
                accent={accent}
                fallbackTitulo={titulo}
                onClick={handleFlip}
              />

              {/* Verso */}
              <div
                role="button"
                tabIndex={flipped ? 0 : -1}
                onClick={handleFlip}
                className="absolute inset-0 rounded-2xl border bg-card p-5 md:p-7 overflow-y-auto scrollbar-hide cursor-pointer flex flex-col"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderColor: `${accent}55`,
                  boxShadow: `0 20px 60px -30px ${accent}60`,
                }}
              >
                {/* Floating Elements from Landing Page (Verso) */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <img
                      key={i}
                      src={laurel}
                      alt=""
                      aria-hidden="true"
                      className="absolute -top-10 lp-fall"
                      style={{
                        left: `${(i * 18 + 5) % 100}%`,
                        width: `${14 + (i % 3) * 6}px`,
                        animationDuration: `${12 + (i % 4) * 3}s`,
                        animationDelay: `${i * 1.5}s`,
                        opacity: 0.15,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                      }}
                    />
                  ))}
                  <img
                    src={scales}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute right-[8%] top-[25%] w-10 lp-float"
                    style={{ animationDirection: 'reverse', opacity: 0.1, filter: `drop-shadow(0 0 12px ${accent}60)` }}
                  />
                  <img
                    src={laurel}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute left-[12%] bottom-[25%] w-8 lp-float"
                    style={{ animationDelay: '2s', opacity: 0.1 }}
                  />
                </div>

                <div className="relative z-10 flex-1 flex flex-col">
                  <p
                    className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3 text-center"
                    style={{ color: accent }}
                  >
                    Resposta
                  </p>
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-lg md:text-2xl font-medium leading-relaxed text-foreground text-center max-w-prose">
                      {card.resposta}
                    </p>
                  </div>
                </div>
                {(card.explicacao || card.exemplo || card.dica) && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative z-10 mt-3 border-t border-border pt-3"
                  >
                    <AbasExtra card={card} accent={accent} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navegação */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={goPrev}
          disabled={idx === 0}
          className="h-10 px-3 rounded-xl text-sm font-semibold inline-flex items-center gap-1 disabled:opacity-30 transition-colors hover:bg-white/5 text-foreground shrink-0"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>

        <div className="hidden md:flex items-center gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                dirRef.current = i > idx ? 1 : -1;
                setFlipped(false);
                setTimeout(() => setIdx(i), 40);
              }}
              aria-label={`Card ${i + 1}`}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === idx ? 16 : 8,
                background:
                  i === idx ? accent : "color-mix(in oklab, var(--muted-foreground) 35%, transparent)",
              }}
            />
          ))}
        </div>

        {flipped && idx < total - 1 ? (
          <motion.button
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            onClick={goNext}
            className="h-10 px-4 rounded-xl text-sm font-bold inline-flex items-center gap-1 transition-all active:scale-95 text-white shadow-md shrink-0"
            style={{
              background: `linear-gradient(90deg, ${accent}, color-mix(in oklab, ${accent} 70%, white))`,
              boxShadow: `0 4px 16px ${accent}66`,
            }}
          >
            Próximo <ChevronRight className="w-4 h-4" />
          </motion.button>
        ) : flipped && isLast ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-10 px-4 rounded-xl text-sm font-bold inline-flex items-center gap-1 text-white shadow-md shrink-0 cursor-default"
            style={{
              background: `linear-gradient(90deg, #16a34a, #22c55e)`,
              boxShadow: `0 4px 16px rgba(34, 197, 94, 0.4)`,
            }}
          >
            Concluído 🎉
          </motion.button>
        ) : (
          <span className="h-10 px-4 inline-flex items-center text-xs text-muted-foreground/60 select-none shrink-0 whitespace-nowrap">
            {idx === total - 1 ? "Último" : "Vire o card →"}
          </span>
        )}
      </div>

      {isLast && footerLastCard ? <div className="pt-2">{footerLastCard}</div> : null}
    </div>
  );
});

export default FlashcardEleganteViewer;

/* ============================ Frente (capa) ============================ */

function FrenteCard({
  card,
  accent,
  fallbackTitulo,
  onClick,
}: {
  card: FlashcardElegante;
  accent: string;
  fallbackTitulo?: string;
  onClick: () => void;
}) {
  const temaKey = card.tema ?? fallbackTitulo ?? card.pergunta.slice(0, 32);
  const h = hashString(temaKey);
  const angle = h % 360;
  const pattern = h % 4;
  const cover = card.coverUrl ?? getTemaCover(card.tema ?? fallbackTitulo);

  return (
    <div
      role="button"
      onClick={onClick}
      className="absolute inset-0 rounded-2xl border p-6 md:p-8 flex flex-col cursor-pointer overflow-hidden text-white"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        borderColor: `${accent}40`,
        boxShadow: `0 20px 60px -30px ${accent}80, inset 0 0 0 1px ${accent}25`,
        background: cover
          ? "oklch(0.14 0.03 280)"
          : `
            radial-gradient(120% 80% at ${20 + (h % 60)}% ${10 + (h % 40)}%, ${accent}55 0%, transparent 55%),
            radial-gradient(100% 70% at ${80 - (h % 50)}% ${90 - (h % 30)}%, ${accent}30 0%, transparent 60%),
            linear-gradient(${angle}deg, oklch(0.22 0.04 280) 0%, oklch(0.14 0.03 280) 100%)
          `,
      }}
    >
      {cover && (
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.img
              src={cover}
              alt=""
              aria-hidden
              loading="lazy"
              initial={{ scale: 1.35, opacity: 0 }}
              animate={{ scale: 1.18, opacity: 0.55 }}
              transition={{
                scale: { duration: 1.6, ease: [0.22, 0.61, 0.36, 1] },
                opacity: { duration: 0.55, ease: "easeOut" },
              }}
              className="absolute inset-0 h-full w-full object-cover"
              style={{ willChange: "transform, opacity", filter: "blur(3px) saturate(1.1)" }}
            />
          </div>
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              background:
                "linear-gradient(to top, oklch(0.10 0.03 280) 0%, oklch(0.12 0.03 280 / 0.95) 30%, oklch(0.14 0.03 280 / 0.75) 60%, oklch(0.16 0.03 280 / 0.55) 100%)",
            }}
          />
        </>
      )}

      {!cover && (
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.07] pointer-events-none"
          aria-hidden
          viewBox="0 0 400 400"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern
              id={`fcp-${h}`}
              x="0"
              y="0"
              width={pattern === 0 ? 40 : pattern === 1 ? 60 : 80}
              height={pattern === 0 ? 40 : pattern === 1 ? 60 : 80}
              patternUnits="userSpaceOnUse"
              patternTransform={`rotate(${angle / 6})`}
            >
              {pattern === 0 && <circle cx="20" cy="20" r="1.5" fill="currentColor" />}
              {pattern === 1 && <path d="M0 30 L60 30" stroke="currentColor" strokeWidth="0.6" />}
              {pattern === 2 && (
                <path d="M0 0 L80 80 M80 0 L0 80" stroke="currentColor" strokeWidth="0.5" />
              )}
              {pattern === 3 && (
                <rect x="20" y="20" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
              )}
            </pattern>
          </defs>
          <rect width="400" height="400" fill={`url(#fcp-${h})`} />
        </svg>
      )}

      {!cover && (
        <div
          className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-30 blur-3xl pointer-events-none"
          style={{ background: accent }}
          aria-hidden
        />
      )}

      {/* Floating Elements from Landing Page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        {Array.from({ length: 6 }).map((_, i) => (
          <img
            key={i}
            src={laurel}
            alt=""
            aria-hidden="true"
            className="absolute -top-10 lp-fall"
            style={{
              left: `${(i * 18 + 5) % 100}%`,
              width: `${14 + (i % 3) * 6}px`,
              animationDuration: `${12 + (i % 4) * 3}s`,
              animationDelay: `${i * 1.5}s`,
              opacity: 0.5,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
          />
        ))}
        <img
          src={scales}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[8%] top-[25%] w-10 lp-float"
          style={{ animationDirection: 'reverse', opacity: 0.45, filter: `drop-shadow(0 0 12px ${accent}60)` }}
        />
        <img
          src={laurel}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-[12%] bottom-[25%] w-8 lp-float"
          style={{ animationDelay: '2s', opacity: 0.35 }}
        />
      </div>

      <div className="relative mb-4 flex items-start justify-between gap-3">
        <p
          className="text-sm md:text-base font-semibold leading-snug line-clamp-2"
          style={{
            color: `color-mix(in oklab, ${accent} 70%, white)`,
            textShadow: "0 2px 12px rgba(0,0,0,0.55)",
          }}
        >
          {card.tema ?? fallbackTitulo ?? "Flashcard"}
        </p>
        <Scale
          className="h-5 w-5 shrink-0"
          style={{ color: `${accent}`, opacity: 0.7 }}
          aria-hidden
        />
      </div>

      <div className="relative flex-1 flex items-center justify-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="text-xl md:text-2xl leading-snug font-medium"
          style={{
            fontFamily: "'Merriweather','Georgia',serif",
            textShadow: "0 2px 16px rgba(0,0,0,0.6)",
          }}
        >
          {card.pergunta}
        </motion.p>
      </div>

      <p className="relative text-[11px] text-white/70 text-center mt-4 inline-flex items-center justify-center gap-1.5">
        <RotateCw className="h-3 w-3" /> Toque para ver a resposta
      </p>
    </div>
  );
}

/* ============================ Abas Extra ============================ */

type AbaKey = "explicacao" | "exemplo" | "dica";

function AbasExtra({
  card,
  accent,
}: {
  card: FlashcardElegante;
  accent: string;
}) {
  const abas: { key: AbaKey; label: string; icon: typeof BookOpen; content?: string | null }[] = [
    { key: "explicacao", label: "Explicação", icon: BookOpen, content: card.explicacao },
    { key: "exemplo", label: "Exemplo", icon: Sparkles, content: card.exemplo },
    { key: "dica", label: "Dica", icon: Lightbulb, content: card.dica },
  ];
  const disponiveis = abas.filter((a) => a.content && a.content.trim().length > 0);
  const [ativa, setAtiva] = useState<AbaKey>(disponiveis[0]?.key ?? "explicacao");

  useEffect(() => {
    if (!disponiveis.find((a) => a.key === ativa) && disponiveis[0]) {
      setAtiva(disponiveis[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.pergunta]);

  if (disponiveis.length === 0) return null;
  const atual = disponiveis.find((a) => a.key === ativa) ?? disponiveis[0];

  return (
    <div className="space-y-3">
      <div
        role="tablist"
        className="inline-flex p-1 rounded-xl gap-1 w-full"
        style={{
          background: `${accent}10`,
          boxShadow: `inset 0 0 0 1px ${accent}30`,
        }}
      >
        {disponiveis.map((a) => {
          const ativo = a.key === atual.key;
          const Icon = a.icon;
          return (
            <button
              key={a.key}
              role="tab"
              aria-selected={ativo}
              onClick={(e) => {
                e.stopPropagation();
                setAtiva(a.key);
              }}
              className="relative flex-1 h-9 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              style={{ color: ativo ? accent : "hsl(var(--muted-foreground))" }}
            >
              {ativo && (
                <motion.div
                  layoutId="fc-aba-ativa-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: `${accent}22`,
                    boxShadow: `inset 0 0 0 1px ${accent}55`,
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <Icon className="h-3.5 w-3.5 relative" />
              <span className="relative">{a.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={atual.key}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl p-3 border"
          style={{ background: `${accent}0d`, borderColor: `${accent}33` }}
        >
          <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
            {atual.content}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
