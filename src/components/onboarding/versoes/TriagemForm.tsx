import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { AnimatePresence, motion } from 'framer-motion';
import { App } from '@capacitor/app';
import { ArrowRight, Check, ChevronRight, Volume2, VolumeX, X, Sparkles } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { toast } from 'sonner';
import {
  DORES,
  FILOSOFOS,
  INTERESSES,
  PERSONAS,
  emptyResult,
  type PersonaId,
  type TriagemResult,
} from './triagemShared';
import { useTriagemAudio } from './useTriagemAudio';

type Props = {
  open: boolean;
  onFinished: (r: TriagemResult) => void;
  previewMode?: boolean;
  initialName?: string;
};

type Step = 'abertura' | 'intro1' | 'intro2' | 'persona' | 'foco' | 'interesses' | 'dores' | 'nome' | 'whatsapp' | 'resumo';

// Paleta editorial — mesma linguagem da abertura "O Direito pensado por quem o
// construiu": marrom profundo, tipografia serifada e detalhe dourado.
const SERIF = 'Georgia, "Times New Roman", serif';

const CARD_BG: Record<Exclude<Step, 'abertura' | 'features'>, { grad: string; accent: string; label: string }> = {
  intro1: {
    grad: 'radial-gradient(ellipse at 50% 0%, #301B11 0%, #1A0D08 55%, #0B0503 100%)',
    accent: '#F3E7D6',
    label: 'BEM-VINDO',
  },
  intro2: {
    grad: 'radial-gradient(ellipse at 50% 0%, #351C12 0%, #1D0F09 55%, #0D0604 100%)',
    accent: '#F3E7D6',
    label: 'EVOLUÇÃO',
  },
  persona: {
    grad: 'radial-gradient(ellipse at 50% 0%, #4A2A18 0%, #2A1810 55%, #120906 100%)',
    accent: '#F3E7D6',
    label: 'PERFIL',
  },
  foco: {
    grad: 'radial-gradient(ellipse at 50% 0%, #301F1A 0%, #1A0D08 55%, #0B0503 100%)',
    accent: '#F5E4DA',
    label: 'ESPECIALIDADE',
  },
  interesses: {
    grad: 'radial-gradient(ellipse at 50% 0%, #3F2A1A 0%, #241811 55%, #100907 100%)',
    accent: '#F3E7D6',
    label: 'FOCO',
  },
  dores: {
    grad: 'radial-gradient(ellipse at 50% 0%, #43221A 0%, #26130F 55%, #110706 100%)',
    accent: '#F5E4DA',
    label: 'DORES',
  },
  nome: {
    grad: 'radial-gradient(ellipse at 50% 0%, #3A2A1C 0%, #221810 55%, #110A06 100%)',
    accent: '#F3E7D6',
    label: 'NOME',
  },
  whatsapp: {
    grad: 'radial-gradient(ellipse at 50% 0%, #362718 0%, #201710 55%, #100A06 100%)',
    accent: '#F3E7D6',
    label: 'CONTATO',
  },
  resumo: {
    grad: 'radial-gradient(ellipse at 50% 0%, #4A2A18 0%, #2A1810 55%, #120906 100%)',
    accent: '#F3E7D6',
    label: 'PRONTO',
  },
};

const GOLD = '#C94C4C';

class TriagemErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { console.error('TriagemErrorBoundary:', error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#0A0A0A] text-white">
          <h2 className="text-2xl font-bold text-[#C94C4C] mb-2">Ops, algo deu errado</h2>
          <p className="text-center opacity-70 mb-6">Ocorreu um problema ao carregar a triagem.</p>
          <button onClick={() => { sessionStorage.removeItem('triagem_step'); window.location.reload(); }} className="h-12 px-6 rounded-xl bg-white/10 active:scale-95 transition">Tentar novamente</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function TriagemForm(props: Props) {
  return (
    <TriagemErrorBoundary>
      <TriagemVersaoCInner {...props} />
    </TriagemErrorBoundary>
  );
}

function TriagemVersaoCInner({ open, onFinished, previewMode, initialName }: Props) {
  const [step, setStep] = useState<Step>(() => {
    const saved = sessionStorage.getItem('triagem_step');
    return (saved as Step) || 'abertura';
  });
  const [data, setData] = useState<TriagemResult>(() => {
    const saved = sessionStorage.getItem('triagem_data');
    const base = saved ? JSON.parse(saved) : emptyResult();
    if (initialName && !base.nome) base.nome = initialName;
    return base;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { muted, toggleMute, playSfx } = useTriagemAudio(open);

  const skipTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSkipTimer = () => {
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    skipTimerRef.current = setTimeout(() => {
      haptic.impact();
      toast.success('Atalho secreto! Pulando triagem...', { icon: <Sparkles className="w-4 h-4" /> });
      const patch = { nome: data.nome || initialName || 'Convidado Prime', persona: 'estudante_oab' as PersonaId };
      setData(prev => ({ ...prev, ...patch }));
      setStep('resumo');
    }, 1500);
  };

  const cancelSkipTimer = () => {
    if (skipTimerRef.current) {
      clearTimeout(skipTimerRef.current);
      skipTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (open && !sessionStorage.getItem('triagem_step')) {
      setStep('abertura');
      setData(emptyResult());
      // Pré-carrega as silhuetas usadas na abertura — evita a travada quando
      // a cena muda pra "Vamos te conhecer".
      FILOSOFOS.slice(0, 6).forEach((f) => {
        const img = new Image();
        img.decoding = 'async';
        img.src = f.src;
      });
    }
  }, [open]);

  const contentSteps = useMemo(() => {
    const base: Step[] = ['intro1', 'intro2', 'persona'];
    if (data.persona === 'estudante_oab' || data.persona === 'concurso') base.push('foco');
    base.push('interesses', 'dores');
    if (!initialName) base.push('nome');
    base.push('whatsapp', 'resumo');
    return base;
  }, [data.persona, initialName]);

  useEffect(() => {
    if (!open) return;
    const backListener = App.addListener('backButton', () => {
      setStep((prev) => {
        if (prev === 'abertura') return prev;
        const idx = contentSteps.indexOf(prev);
        if (idx > 0) {
          const prevStep = contentSteps[idx - 1];
          sessionStorage.setItem('triagem_step', prevStep);
          return prevStep;
        } else if (idx === 0) {
          sessionStorage.setItem('triagem_step', 'abertura');
          return 'abertura';
        }
        return prev;
      });
    });
    return () => { backListener.then(l => l.remove()); };
  }, [open, contentSteps]);

  const stepIndex =
    step === 'abertura' ? -1 : contentSteps.indexOf(step);
  const bg = step === 'abertura' ? CARD_BG.persona : CARD_BG[step] || CARD_BG.persona;

  const advance = (patch: Partial<TriagemResult>) => {
    if (isSubmitting) return;
    playSfx('whoosh');
    const next = { ...data, ...patch };
    setData(next);
    sessionStorage.setItem('triagem_data', JSON.stringify(next));

    if (step === 'abertura') {
      setStep('intro1');
      sessionStorage.setItem('triagem_step', 'intro1');
      return;
    }
    const nx = contentSteps[stepIndex + 1];
    if (nx) {
      setStep(nx);
      sessionStorage.setItem('triagem_step', nx);
    } else {
      // Última pergunta respondida – finaliza a coleta de dados
      playSfx('ding');
      setIsSubmitting(true);
      onFinished(next);
      sessionStorage.removeItem('triagem_step');
      sessionStorage.removeItem('triagem_data');
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#0A0A0A]"
    >
      {/* Top bar — Stepper Gamificado */}
      {step !== 'abertura' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex items-center justify-between px-4 pt-4 md:px-12 md:pt-8"
          style={{ paddingTop: 'calc(var(--sai-top) + 28px)' }}
        >
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-95 hover:bg-white/20 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div 
            className="flex-1 flex flex-col items-center justify-center gap-1.5 ml-3 cursor-pointer select-none"
            onPointerDown={startSkipTimer}
            onPointerUp={cancelSkipTimer}
            onPointerLeave={cancelSkipTimer}
          >
            <div className="flex items-center gap-1.5">
              {contentSteps.map((s, i) => (
                <div key={s} className="relative flex items-center justify-center">
                  <motion.div
                    className={`h-2 rounded-full transition-all duration-500 ${i <= stepIndex ? 'bg-[#C94C4C] shadow-[0_0_8px_#C94C4C]' : 'bg-white/20'}`}
                    initial={false}
                    animate={{ width: i === stepIndex ? 24 : 8 }}
                  />
                </div>
              ))}
            </div>
            <motion.div 
              key={stepIndex}
              initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
              className="text-[10px] uppercase tracking-widest text-[#C94C4C] font-bold"
            >
              {stepIndex === contentSteps.length - 1 ? 'Quase lá' : `Passo ${stepIndex + 1}`}
            </motion.div>
          </div>
          {previewMode && (
            <button
              onClick={() => onFinished(data)}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-95 ml-3 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* Stack Master-Detail */}
      <div
        className="relative flex-1 min-h-0 flex md:flex-row flex-col items-center justify-center px-3 pt-6 sm:pt-8 md:p-0"
        style={{
          paddingBottom: 'calc(var(--sai-bottom) + 36px)',
        }}
      >
        <AnimatePresence mode="wait">
          {step === 'abertura' ? (
            <AberturaCinematografica 
              key="abertura" 
              onDone={() => advance({})} 
              muted={muted} 
              toggleMute={toggleMute} 
              previewMode={previewMode}
              onClose={() => onFinished(data)}
            />
          ) : (
            <div key="master-detail" className="w-full h-full md:flex md:flex-row md:items-center md:justify-center md:gap-12 md:max-w-6xl md:mx-auto">
              
              {/* Left Side: Desktop ambient */}
              <div className="hidden md:flex flex-col items-center justify-center flex-1">
                 <img src={FILOSOFOS[1].src} className="w-72 h-72 object-contain opacity-20 drop-shadow-2xl mix-blend-screen animate-pulse" alt="Prime" />
                 <h2 className="text-4xl font-serif text-[#C94C4C] mt-8 tracking-[0.25em] text-center">DIREITO PRIME</h2>
                 <p className="text-white/60 text-center max-w-sm mt-4 text-lg leading-relaxed">Personalize seu ambiente para receber materiais de alta precisão baseados no seu foco atual.</p>
              </div>

              {/* Right Side: Card Morphing */}
              <motion.div
                key="onboarding-card"
                initial={{ x: 120, opacity: 0 }}
                animate={{ x: 0, opacity: 1, background: bg.grad, color: bg.accent }}
                exit={{ x: -120, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-lg md:max-w-[420px] md:shrink-0 rounded-[36px] overflow-hidden flex flex-col shadow-2xl border border-[#C94C4C]/25 md:h-[650px] h-full"
                style={{ minHeight: 0, maxHeight: '100%', willChange: 'transform, opacity, background' }}
              >
                {/* Textura de filósofos suave no card */}
                <FilosofosTextura seed={stepIndex + 1} />

                <div className="relative z-10 px-6 pt-6 flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-[0.45em]" style={{ color: GOLD }}>{bg.label}</span>
                  <span className="text-[10px] font-bold tracking-[0.2em] opacity-60">
                    {stepIndex + 1}/{contentSteps.length}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25 }}
                    className="relative z-10 flex-1 min-h-0 flex flex-col"
                  >
                    <CardContent step={step as Exclude<Step, 'abertura' | 'features'>} data={data} setData={setData} advance={advance} playSfx={playSfx} bg={bg} isSubmitting={isSubmitting} />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* -------------------------- Abertura Cinematográfica -------------------------- */

function AberturaCinematografica({
  onDone,
  muted,
  toggleMute,
  previewMode,
  onClose,
}: {
  onDone: () => void;
  muted: boolean;
  toggleMute: () => void;
  previewMode?: boolean;
  onClose?: () => void;
}) {
  // Roteiro (frames em ms): filósofos aparecem em cascata sobre marrom → flash amarelo → título
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2600); // flash amarelo
    const t2 = setTimeout(() => setPhase(2), 3100); // título amarelo
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const filosofosOrdem = useMemo(() => {
    // 4 posições — menos imagens grandes animadas = abertura sem travar
    const posicoes = [
      { top: '10%', left: '6%', size: 130, rot: -8 },
      { top: '16%', right: '4%', size: 145, rot: 6 },
      { bottom: '12%', left: '8%', size: 140, rot: -6 },
      { bottom: '16%', right: '6%', size: 150, rot: 7 },
    ];
    return posicoes.map((pos, i) => ({ ...pos, ...FILOSOFOS[i % FILOSOFOS.length] }));
  }, []);

  return (
    <motion.div
      key="abertura-root"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 40%, #4A2A18 0%, #2A1810 55%, #150A05 100%)',
      }}
    >
      {/* Controles do topo (mute + fechar no preview) */}
      <div 
        className="absolute top-4 right-4 z-30 flex items-center gap-2"
        style={{ top: 'calc(var(--sai-top) + 12px)' }}
      >
        <button
          onClick={toggleMute}
          className="w-10 h-10 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center active:scale-95 transition-transform"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
        {previewMode && onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center active:scale-95 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Vinheta */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

      {/* Filósofos flutuando — nunca desmontam durante a transição (evita
          reflow/decode no meio da animação); só somem por opacidade. */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: phase === 0 ? 1 : 0 }}
        transition={{ duration: 0.45, ease: 'linear' }}
        style={{ willChange: 'opacity' }}
      >
        {filosofosOrdem.map((f, i) => (
            <motion.img
              key={f.nome}
              src={f.src}
              alt={f.nome}
              loading="eager"
              decoding="async"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.25, 0.25, 0] }}
              transition={{
                duration: 2.4,
                delay: i * 0.18,
                times: [0, 0.35, 0.75, 1],
                ease: 'linear',
              }}
              className="absolute pointer-events-none select-none"
              style={{
                ...f,
                width: f.size,
                height: 'auto',
                transform: `rotate(${f.rot}deg) translateZ(0)`,
                willChange: 'opacity, transform',
              }}
            />
          ))}
      </motion.div>

      {/* Título fase 0 — sussurro */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div
            key="p0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative z-20 text-center px-8"
          >
            <div className="text-[11px] font-black tracking-[0.5em] text-white/60 mb-4">
              DOS CLÁSSICOS AOS CÓDIGOS
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[0.95]" style={{ fontFamily: SERIF }}>
              O Direito<br />
              <span className="italic text-white/80">pensado por quem</span><br />
              o construiu.
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brilho dourado — só opacidade (composição na GPU, sem repintar
          gradiente em escala, que era o que travava a transição). */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={false}
        animate={{ opacity: phase === 1 ? 1 : 0 }}
        transition={{ duration: 0.4, ease: 'linear' }}
        style={{
          background: 'radial-gradient(circle at 50% 45%, rgba(201,76,76,0.5) 0%, transparent 70%)',
          willChange: 'opacity',
        }}
      />

      {/* Título fase 2 — amarelo com CTA */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            key="p2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 text-center px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[11px] font-black tracking-[0.5em] mb-4"
              style={{ color: GOLD }}
            >
              BEM-VINDO(A)
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-5xl sm:text-6xl font-black text-[#F3E7D6] leading-[0.9]"
              style={{ fontFamily: SERIF }}
            >
              Vamos <span className="italic">te conhecer</span>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-[#F3E7D6]/70 text-lg leading-relaxed max-w-sm mx-auto"
            >
              Cinco toques rápidos pra ajustar o app ao seu jeito de estudar.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
              whileTap={{ scale: 0.92 }}
              onClick={onDone}
              className="mt-8 h-14 px-8 rounded-full bg-[#C94C4C] text-[#150C05] font-black text-base inline-flex items-center gap-2 shadow-2xl"
            >
              Começar <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* Textura sutil de filósofos no fundo do card */
function FilosofosTextura({ seed = 0 }: { seed?: number }) {
  const spots = [
    { src: FILOSOFOS[seed % FILOSOFOS.length].src, top: '-30px', right: '-40px', size: 240, op: 0.14, rot: 8 },
    { src: FILOSOFOS[(seed + 4) % FILOSOFOS.length].src, bottom: '-40px', left: '-50px', size: 280, op: 0.1, rot: -6 },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <img
          key={i}
          src={s.src}
          alt=""
          aria-hidden
          decoding="async"
          className="absolute pointer-events-none select-none"
          style={{
            top: s.top,
            bottom: s.bottom,
            left: s.left,
            right: s.right,
            width: s.size,
            opacity: s.op * 1.5, // slightly more visible since it's dark
            transform: `rotate(${s.rot}deg)`,
          }}
        />
      ))}
    </>
  );
}

/* -------------------------- Conteúdo dos passos -------------------------- */

function CardContent({
  step,
  data,
  setData,
  advance,
  playSfx,
  bg,
  isSubmitting,
}: {
  step: Exclude<Step, 'abertura' | 'features'>;
  data: TriagemResult;
  setData: React.Dispatch<React.SetStateAction<TriagemResult>>;
  advance: (patch: Partial<TriagemResult>) => void;
  playSfx: (k: 'tap' | 'whoosh' | 'ding') => void;
  bg: { grad: string; accent: string; label: string };
  isSubmitting?: boolean;
}) {
  const nome1 = data.nome.trim().split(' ')[0];

  return (
    <div
      className="relative z-10 flex-1 min-h-0 flex flex-col px-6 pt-4 overflow-y-auto overscroll-contain touch-pan-y"
      style={{ paddingBottom: 'calc(var(--sai-bottom) + 24px)' }}
    >
      {step === 'intro1' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-6" style={{ fontFamily: SERIF }}
          >
            O Direito <span className="italic">evoluiu</span>.
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }} className="text-base opacity-80 mb-6 leading-relaxed">
            A forma como você estuda e consome conteúdo jurídico também precisa evoluir. Chega de materiais espalhados e desatualizados.
          </motion.p>
          <div className="flex-1" />
          <ContinueBtn disabled={false} isSubmitting={isSubmitting} onClick={() => advance({})} />
        </>
      )}

      {step === 'intro2' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-6" style={{ fontFamily: SERIF }}
          >
            Seu novo <br /><span className="italic">ecossistema</span>.
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }} className="text-base opacity-80 mb-6 leading-relaxed">
            O Direito Prime foi construído para se adaptar à sua rotina. Vamos configurar sua experiência em poucos passos.
          </motion.p>
          <div className="flex-1" />
          <ContinueBtn disabled={false} isSubmitting={isSubmitting} onClick={() => advance({})} />
        </>
      )}

      {step === 'persona' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-6" style={{ fontFamily: SERIF }}
          >
            Onde você está <span className="italic">na sua jornada</span>?
          </motion.h2>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] flex flex-col justify-start pb-4">
            <div className="relative pl-3 border-l-2 border-white/10 space-y-5 ml-2 mt-2">
              {[
                { id: 'estudante_oab', label: 'Estudante de Direito / OAB', desc: 'Foco na faculdade ou Exame de Ordem' },
                { id: 'concurso', label: 'Concurseiro(a)', desc: 'Magistratura, MP, Delegado, Carreiras...' },
                { id: 'advogado', label: 'Advogado(a)', desc: 'Já possuo inscrição na OAB' }
              ].map((p, i) => (
                  <motion.button
                  key={p.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    haptic.selection();
                    playSfx('tap');
                    setData((prev) => ({ ...prev, persona: p.id as PersonaId, personaLabel: p.label }));
                    setTimeout(() => advance({ persona: p.id as PersonaId, personaLabel: p.label }), 400);
                  }}
                  className="relative w-full rounded-2xl px-5 py-4 flex items-center text-left transition-colors border border-white/5 bg-white/[0.04] hover:bg-white/[0.08]"
                >
                  <div className="absolute top-[22px] -left-[18px] w-2.5 h-2.5 rounded-full bg-[#C94C4C] shadow-[0_0_8px_#C94C4C]" />
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="font-bold text-[16px] leading-tight" style={{ fontFamily: SERIF }}>{p.label}</div>
                    <div className="text-[12px] opacity-70 mt-1">{p.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 'foco' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-6" style={{ fontFamily: SERIF }}
          >
            Qual é o seu <span className="italic">objetivo principal</span>?
          </motion.h2>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y flex flex-col pb-4">
            <div className="relative pl-3 border-l-2 border-white/10 space-y-5 ml-2 mt-2">
              {[
                { id: '1fase', label: '1ª Fase da OAB', desc: 'Foco em questões e lei seca' },
                { id: '2fase', label: '2ª Fase da OAB', desc: 'Peças práticas e doutrina' },
                { id: 'magistratura', label: 'Magistratura / MP', desc: 'Carreiras jurídicas de alto desempenho' },
                { id: 'policial', label: 'Carreiras Policiais', desc: 'Delegado, Investigador, etc' },
              ].map((f, i) => (
                <motion.button
                  key={f.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    haptic.selection();
                    playSfx('tap');
                    setData((prev) => ({ ...prev, foco: f.id }));
                    setTimeout(() => advance({ foco: f.id }), 400);
                  }}
                  className="relative w-full rounded-2xl px-5 py-4 flex items-center text-left transition-colors border border-white/5 bg-white/[0.04] hover:bg-white/[0.08]"
                >
                  <div className="absolute top-[22px] -left-[18px] w-2.5 h-2.5 rounded-full bg-[#C94C4C] shadow-[0_0_8px_#C94C4C]" />
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="font-bold text-[16px] leading-tight" style={{ fontFamily: SERIF }}>{f.label}</div>
                    <div className="text-[12px] opacity-70 mt-1">{f.desc}</div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 'interesses' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-1" style={{ fontFamily: SERIF }}
          >
            O que é <span className="italic">prioridade</span> pra você hoje?
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="text-sm opacity-70 mb-3">
            Marque as funções que mais te interessam
          </motion.p>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] pb-2 -mx-1 px-1 grid grid-cols-2 gap-2 place-content-start">
            {INTERESSES.map((it) => {
              const Icon = it.icon;
              const on = data.interesses.includes(it.id);
              return (
                <motion.button
                  key={it.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    haptic.selection();
                    playSfx('tap');
                    setData((d) => ({
                      ...d,
                      interesses: d.interesses.includes(it.id)
                        ? d.interesses.filter((x) => x !== it.id)
                        : [...d.interesses, it.id],
                    }));
                  }}
                  className={`w-full h-full rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border transition text-center ${
                    on
                      ? 'bg-[#C94C4C] text-[#150C05] border-[#C94C4C]'
                      : 'bg-white/[0.06] backdrop-blur border-white/15'
                  }`}
                >
                  <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                    <Icon className={`w-6 h-6 shrink-0 mb-2 ${on ? 'text-[#150C05]' : 'text-[#C94C4C]'}`} />
                    <div className="font-bold text-[13px] leading-tight" style={{ fontFamily: SERIF }}>{it.label}</div>
                  </div>
                  {on && <div className="absolute top-2 right-2"><Check className="w-4 h-4 shrink-0" /></div>}
                </motion.button>
              );
            })}
          </div>
        </>
      )}

      {step === 'dores' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-1" style={{ fontFamily: SERIF }}
          >
            O que mais <span className="italic">trava</span> seus estudos hoje?
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="text-sm opacity-70 mb-3">
            Marque o que trava seus estudos na lei
          </motion.p>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] space-y-2 pb-2 -mx-1 px-1">
            {DORES.map((d) => {
              const Icon = d.icon;
              const on = data.dores.includes(d.id);
              return (
                <motion.button
                  key={d.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    haptic.selection();
                    playSfx('tap');
                    
                    const isAdding = !data.dores.includes(d.id);
                    if (isAdding) {
                      toast.success('Temos materiais sob medida pra isso!', { icon: <Sparkles className="w-4 h-4" /> });
                    }

                    setData((prev) => ({
                      ...prev,
                      dores: prev.dores.includes(d.id)
                        ? prev.dores.filter((x) => x !== d.id)
                        : [...prev.dores, d.id],
                    }));
                  }}
                  className={`relative w-full h-full rounded-2xl p-4 flex flex-col items-center justify-center gap-2 border transition text-center ${
                    on
                      ? 'bg-[#C94C4C] text-[#150C05] border-[#C94C4C]'
                      : 'bg-white/[0.06] backdrop-blur border-white/15'
                  }`}
                >
                  <div className="flex-1 flex flex-col items-center justify-center min-w-0">
                    <Icon className={`w-6 h-6 shrink-0 mb-2 ${on ? 'text-[#150C05]' : 'text-[#C94C4C]'}`} />
                    <div className="font-bold text-[13px] leading-tight" style={{ fontFamily: SERIF }}>{d.label}</div>
                  </div>
                  {on && <div className="absolute top-2 right-2"><Check className="w-4 h-4 shrink-0" /></div>}
                </motion.button>
              );
            })}
          </div>
        </>
      )}

      {step === 'nome' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-1" style={{ fontFamily: SERIF }}
          >
            Sua jornada <span className="italic">começa aqui</span>{nome1 ? <>, {nome1}</> : ''}.
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="text-base opacity-80 mb-6 leading-relaxed">
            O seu novo jeito de estudar Direito está quase pronto. Como você quer ser chamado?
          </motion.p>
          <input
            autoFocus
            value={data.nome}
            onChange={(e) => setData((d) => ({ ...d, nome: e.target.value.slice(0, 40) }))}
            onKeyDown={(e) => e.key === 'Enter' && data.nome.trim() && advance({})}
            placeholder="Digite seu nome"
            className="w-full h-14 px-5 rounded-2xl bg-white/[0.07] backdrop-blur border border-white/20 text-lg font-semibold outline-none focus:border-[#C94C4C] placeholder-white/35"
            style={{ color: bg.accent }}
          />
          <div className="flex-1" />
        </>
      )}

      {step === 'whatsapp' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-1" style={{ fontFamily: SERIF }}
          >
            Acelere com o <span className="italic">Hórus</span>.
          </motion.h2>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="text-base opacity-80 mb-6 leading-relaxed">
            Opcional: Informe seu número para desbloquear testes gratuitos e alertas de legislações importantes.
          </motion.p>
          <input
            type="tel"
            value={data.whatsapp || ''}
            onChange={(e) => setData((d) => ({ ...d, whatsapp: e.target.value.slice(0, 20) }))}
            onKeyDown={(e) => e.key === 'Enter' && advance({})}
            placeholder="(11) 99999-9999"
            className="w-full h-14 px-5 rounded-2xl bg-white/[0.07] backdrop-blur border border-white/20 text-lg font-semibold outline-none focus:border-[#C94C4C] placeholder-white/35"
            style={{ color: bg.accent }}
          />
          <div className="flex-1" />
        </>
      )}

      {step === 'resumo' && (
         <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
            {isSubmitting ? (
              <div className="animate-pulse space-y-4">
                 <Sparkles className="w-12 h-12 text-[#C94C4C] mx-auto" />
                 <h2 className="text-2xl font-serif">Ajustando Inteligência Artificial...</h2>
                 <p className="text-white/60 text-sm">Separando os melhores resumos pro seu perfil.</p>
              </div>
            ) : (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center w-full max-w-sm">
                 <div className="w-20 h-20 rounded-full bg-[#C94C4C]/20 border border-[#C94C4C]/50 flex items-center justify-center mb-6 shadow-[0_0_24px_rgba(201,76,76,0.2)]">
                    <Check className="w-10 h-10 text-[#C94C4C]" />
                 </div>
                 <h2 className="text-3xl font-serif mb-2">Tudo Pronto!</h2>
                 <p className="text-white/70 mb-8 leading-relaxed">Seu ambiente <strong className="text-[#C94C4C]">Direito Prime</strong> foi configurado com sucesso com base nas suas preferências.</p>
                 <ContinueBtn isSubmitting={isSubmitting} onClick={() => { haptic.impact(); advance({}); }} icon={<Check className="w-5 h-5" />} />
              </motion.div>
            )}
         </div>
      )}

      {/* Thumb-Zone Fixed Button */}
      {!['persona', 'foco', 'resumo'].includes(step) && (
        <div className="absolute bottom-0 left-0 w-full p-6 pt-12 pointer-events-none flex justify-end z-20" style={{ background: 'linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.8) 40%, transparent 100%)' }}>
          <div className="pointer-events-auto w-full">
            <ContinueBtn 
              disabled={
                step === 'interesses' ? data.interesses.length === 0 :
                step === 'dores' ? data.dores.length === 0 :
                step === 'nome' ? !data.nome.trim() : false
              } 
              isSubmitting={isSubmitting} 
              onClick={() => {
                haptic.impact();
                advance({});
              }} 
              icon={step === 'whatsapp' ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ContinueBtn({ disabled, onClick, isSubmitting, icon }: { disabled?: boolean; onClick: () => void; isSubmitting?: boolean; icon?: React.ReactNode }) {
  return (
    <button
      disabled={disabled || isSubmitting}
      onClick={onClick}
      className="mt-3 shrink-0 h-14 w-full rounded-2xl bg-[#C94C4C] text-[#150C05] font-black flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30"
    >
      {isSubmitting ? 'Aguarde...' : 'Continuar'} {icon || <ArrowRight className="w-5 h-5" strokeWidth={2.5} />}
    </button>
  );
}
