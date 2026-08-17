import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  BookOpen,
  Scale,
  Lightbulb,
  RotateCw,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  BrainCircuit,
  Loader2,
  Headphones,
  Pause,
  Shuffle,
} from "lucide-react";
import { getTemaCover } from "@/lib/flashcards-tema-cover";
import laurel from '@/assets/landing-tribunal/laurel-leaf.png';
import scales from '@/assets/landing-tribunal/scales.png';
import { haptic } from "@/lib/nativeHaptics";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";

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
  const win = window as Window & { confetti?: (opts: Record<string, unknown>) => void };
  const fire = () => {
    if (win.confetti) {
      win.confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#eab308']
      });
    }
  };
  if (!win.confetti) {
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
  const stampErreiOpacity = useTransform(x, [0, -100], [0, 1]);
  const stampAcerteiOpacity = useTransform(x, [0, 100], [0, 1]);

  const total = cards?.length ?? 0;
  const [progresso, setProgresso] = useState({ novos: total, erros: 0, acertos: 0 });
  
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);

  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  useEffect(() => {
    if (isShuffled && total > 0) {
      const indices = Array.from({length: total}, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      setShuffledIndices(indices);
    } else {
      setShuffledIndices(Array.from({length: total}, (_, i) => i));
    }
  }, [isShuffled, total]);

  useEffect(() => {
    const currentSynth = synthRef.current;
    return () => {
      if (currentSynth) currentSynth.cancel();
    };
  }, []);

  useEffect(() => {
    setProgresso({ novos: total, erros: 0, acertos: 0 });
    setIdx(0); // reset when total changes
  }, [total]);

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

  const actualIdx = (shuffledIndices && shuffledIndices.length > idx) ? shuffledIndices[idx] : idx;
  const card = cards?.[actualIdx];
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



  const currentThemeVariant = useMemo(() => {
    const fallbacks = [
      { start: "#F87171", end: "#DC2626" },
      { start: "#60A5FA", end: "#2563EB" },
      { start: "#34D399", end: "#059669" },
      { start: "#FBBF24", end: "#D97706" },
      { start: "#A78BFA", end: "#7C3AED" },
    ];
    return fallbacks[idx % fallbacks.length];
  }, [idx]);


  const goNext = useCallback(() => {
    if (idx >= total - 1) return;
    haptic.selection(); // Vibração ao passar card
    playSlide();
    dirRef.current = 1;
    setFlipped(false);
    setTimeout(() => setIdx((i) => i + 1), 40);
  }, [idx, total, playSlide]);

  const goPrev = useCallback(() => {
    if (idx <= 0) return;
    haptic.selection(); // Vibração ao voltar card
    playSlide();
    dirRef.current = -1;
    setFlipped(false);
    setTimeout(() => setIdx((i) => i - 1), 40);
  }, [idx, playSlide]);

  const handleFlip = useCallback(() => {
    playFlip();
    setFlipped((v) => !v);
  }, [playFlip]);

  useEffect(() => {
    if (!isAutoPlaying || !card || (isLast && flipped && completedRef.current)) return;
    
    let timeout: ReturnType<typeof setTimeout>;
    let isCancelled = false;
    
    const speak = (text: string, callback: () => void) => {
      if (!synthRef.current || isCancelled) return;
      synthRef.current.cancel(); // Interromper som anterior
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      // Tentativa de achar voz nativa pt-BR se disponível
      const voices = synthRef.current.getVoices();
      const ptBrVoice = voices.find(v => v.lang.includes('pt-BR'));
      if (ptBrVoice) utterance.voice = ptBrVoice;
      
      utterance.onend = () => {
        if (isCancelled) return;
        timeout = setTimeout(() => {
          if (!isCancelled) callback();
        }, 2000);
      };
      
      utterance.onerror = (e) => {
         console.error('SpeechSynthesis Error', e);
         if (!isCancelled) setIsAutoPlaying(false);
      };
      
      synthRef.current.speak(utterance);
    };

    if (!flipped) {
      speak(card.pergunta, () => {
        playFlip();
        setFlipped(true);
      });
    } else {
      speak(card.resposta, () => {
        if (!isLast) {
          // Marca como "Aprender" no automático pra simular revisão? Ou apenas pula.
          // Vamos apenas pular sem contar erro/acerto para o progresso, ou mockar:
          goNext();
        } else {
           completedRef.current = true;
           triggerConfetti();
           if (onComplete) onComplete();
           setIsAutoPlaying(false);
        }
      });
    }

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      const synth = synthRef.current;
      if (synth) synth.cancel();
    };
  }, [isAutoPlaying, idx, flipped, card, isLast, goNext, playFlip, onComplete]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDragEnd = (e: any, { offset }: any) => {
    const swipe = offset.x;
    if (swipe > 100) {
      haptic.success();
      setProgresso(p => ({ ...p, novos: Math.max(0, p.novos - 1), acertos: p.acertos + 1 }));
      goNext();
    } else if (swipe < -100) {
      haptic.heavy();
      setProgresso(p => ({ ...p, novos: Math.max(0, p.novos - 1), erros: p.erros + 1 }));
      goNext();
    }
  };

  const handleManualAction = (type: 'acerto' | 'erro') => {
    if (type === 'acerto') {
      haptic.success();
      setProgresso(p => ({ ...p, novos: Math.max(0, p.novos - 1), acertos: p.acertos + 1 }));
    } else {
      haptic.heavy();
      setProgresso(p => ({ ...p, novos: Math.max(0, p.novos - 1), erros: p.erros + 1 }));
    }
    goNext();
  };

  const slideVariants = {
    enter: (dir: 1 | -1) => ({ x: dir * 100, y: 20, rotate: dir * 8, opacity: 0, scale: 0.95 }),
    center: { x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 },
    exit: (dir: 1 | -1) => ({ x: -dir * 100, y: 20, rotate: -dir * 8, opacity: 0, scale: 0.95 }),
  };

  if (!total || !card) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Nenhum flashcard disponível ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HUD de Progresso Gamificado & Auto-Play Toggle */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex-1 flex items-center justify-center gap-6">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Novos</span>
            <span className="text-sm font-bold text-blue-500 tabular-nums">{progresso.novos}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1">Aprender</span>
            <span className="text-sm font-bold text-red-500 tabular-nums">{progresso.erros}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">Revisar</span>
            <span className="text-sm font-bold text-green-500 tabular-nums">{progresso.acertos}</span>
          </div>
        </div>
        
        {/* Toggles */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              haptic.selection();
              setIsShuffled(!isShuffled);
              setIdx(0);
            }}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
              isShuffled 
                ? 'bg-[#10B981]/20 text-[#10B981] shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
            aria-label={isShuffled ? "Modo Aleatório Ativo" : "Modo Aleatório Inativo"}
          >
            <Shuffle className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => {
              haptic.selection();
              if (isAutoPlaying && synthRef.current) synthRef.current.cancel();
              setIsAutoPlaying(!isAutoPlaying);
            }}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
              isAutoPlaying 
                ? 'bg-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
            aria-label={isAutoPlaying ? "Pausar Modo Passivo" : "Iniciar Modo Passivo"}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Headphones className="w-4 h-4" />}
          </button>
        </div>
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
              style={{ opacity: stampErreiOpacity }}
              className="absolute top-12 right-12 z-50 pointer-events-none"
            >
              <div className="border-[6px] border-red-500 text-red-500 rounded-2xl px-6 py-2 rotate-[15deg] font-black text-4xl tracking-widest opacity-80 uppercase" style={{ boxShadow: "0 0 16px rgba(239,68,68,0.4)" }}>
                Errei
              </div>
            </motion.div>
            
            <motion.div
              style={{ opacity: stampAcerteiOpacity }}
              className="absolute top-12 left-12 z-50 pointer-events-none"
            >
              <div className="border-[6px] border-green-500 text-green-500 rounded-2xl px-6 py-2 -rotate-[15deg] font-black text-4xl tracking-widest opacity-80 uppercase" style={{ boxShadow: "0 0 16px rgba(34,197,94,0.4)" }}>
                Lembrei
              </div>
            </motion.div>

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

      <div className="flex items-center justify-between gap-2 mt-4 px-2">
        <button
          onClick={goPrev}
          disabled={idx === 0}
          className="h-12 w-12 rounded-full flex items-center justify-center disabled:opacity-30 transition-colors hover:bg-white/5 text-foreground shrink-0 bg-secondary/30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {flipped && idx < total - 1 ? (
          <div className="flex gap-4">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleManualAction('erro')}
              className="h-12 px-6 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 text-white shadow-lg bg-red-500 hover:bg-red-600"
            >
              Errei
            </motion.button>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => handleManualAction('acerto')}
              className="h-12 px-6 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-95 text-white shadow-lg bg-green-500 hover:bg-green-600"
            >
              Lembrei
            </motion.button>
          </div>
        ) : flipped && isLast ? (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-12 px-8 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-1 text-white shadow-md cursor-default bg-gradient-to-r from-green-600 to-green-500"
          >
            Sessão Concluída 🎉
          </motion.button>
        ) : (
          <span className="h-12 px-4 inline-flex items-center text-sm font-medium text-muted-foreground select-none shrink-0">
            {idx === total - 1 ? "Vire o último card" : "Toque no card para ver a resposta"}
          </span>
        )}
        
        {/* Placeholder for symmetry */}
        <div className="h-12 w-12 shrink-0" />
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
    <CardContainer 
      containerClassName="absolute inset-0 !p-0 m-0 w-full h-full flex-none" 
      className="w-full h-full"
    >
      <CardBody
        className="w-full h-full rounded-2xl border p-6 md:p-8 flex flex-col cursor-pointer overflow-hidden text-white bg-transparent"
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

      <CardItem translateZ="50" className="relative mb-4 flex items-start justify-between gap-3 w-full">
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
      </CardItem>

      <CardItem translateZ="100" className="relative flex-1 flex items-center justify-center text-center w-full">
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
      </CardItem>

      <CardItem translateZ="60" className="w-full">
        <p className="relative text-[11px] text-white/70 text-center mt-4 flex items-center justify-center gap-1.5 w-full">
          <RotateCw className="h-3 w-3" /> Toque para ver a resposta
        </p>
      </CardItem>
      {/* Invisible overlay button to handle clicks without breaking 3d items */}
      <div className="absolute inset-0 z-50 cursor-pointer" onClick={onClick} role="button" aria-label="Ver resposta" />
      </CardBody>
    </CardContainer>
  );
}

/* ============================ Abas Extra ============================ */

function AbasExtra({
  card,
  accent,
}: {
  card: FlashcardElegante;
  accent: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);

  const abas: { key: "explicacao" | "exemplo" | "dica" | "mnemonico"; label: string; icon: React.ElementType; content?: string | null }[] = [
    { key: "explicacao", label: "Explicação", icon: BookOpen, content: card.explicacao },
    { key: "exemplo", label: "Exemplo", icon: Sparkles, content: card.exemplo },
    { key: "dica", label: "Dica", icon: Lightbulb, content: card.dica },
  ];
  
  if (generatedMnemonic) {
    abas.push({ key: "mnemonico", label: "Mnemônico (IA)", icon: BrainCircuit, content: generatedMnemonic });
  }

  const disponiveis = abas.filter((a) => a.content && a.content.trim().length > 0);
  const [ativa, setAtiva] = useState<"explicacao" | "exemplo" | "dica" | "mnemonico">(disponiveis[0]?.key ?? "explicacao");

  useEffect(() => {
    if (!disponiveis.find((a) => a.key === ativa) && disponiveis[0]) {
      setAtiva(disponiveis[0].key);
    }
  }, [card.pergunta, disponiveis, ativa]);

  // Limpa o mnemônico gerado ao mudar de card
  useEffect(() => {
    setGeneratedMnemonic(null);
  }, [card.pergunta]);

  const handleGenerateMnemonic = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGenerating(true);
    // Mock AI delay
    setTimeout(() => {
      setGeneratedMnemonic(`Mnemônico gerado pela IA:\nPara lembrar de "${card.tema || 'esse conceito'}", pense em...\n(Aqui viria a chamada real para a Edge Function do Supabase)`);
      setAtiva("mnemonico");
      setIsGenerating(false);
      haptic.success();
    }, 1500);
  };

  const atual = disponiveis.find((a) => a.key === ativa) ?? disponiveis[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        {disponiveis.length > 0 ? (
          <div
            role="tablist"
            className="inline-flex p-1 rounded-xl gap-1"
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
                  className="relative h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
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
        ) : (
          <div className="flex-1" />
        )}

        {!generatedMnemonic && (
          <button
            onClick={handleGenerateMnemonic}
            disabled={isGenerating}
            className="h-9 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all text-white shadow-md disabled:opacity-70 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <BrainCircuit className="w-4 h-4" /> 
                <span className="hidden sm:inline">Gerar Mnemônico</span>
                <span className="sm:hidden">IA</span>
              </>
            )}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {atual && (
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
        )}
      </AnimatePresence>
    </div>
  );
}
