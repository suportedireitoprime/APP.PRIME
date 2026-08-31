import { Suspense, useEffect, useMemo, useState } from 'react';
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronRight, Volume2, VolumeX, X } from 'lucide-react';
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
import WaveReveal from '@/components/animata/text/wave-reveal';
import SplitText from '@/components/animata/text/split-text';
import SoftBlurIn from '@/components/animata/text/soft-blur-in';
import ShortSlideDown from '@/components/animata/text/short-slide-down';

type Props = {
  open: boolean;
  onFinished: (r: TriagemResult) => void;
  previewMode?: boolean;
};

type Step = 'abertura' | 'intro1' | 'intro2' | 'persona' | 'interesses' | 'dores' | 'nome' | 'whatsapp';
const CONTENT_STEPS: Step[] = ['intro1', 'intro2', 'persona', 'interesses', 'dores', 'nome', 'whatsapp'];

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
};

const GOLD = '#C94C4C';

export default function TriagemVersaoC({ open, onFinished, previewMode }: Props) {
  const [step, setStep] = useState<Step>('abertura');
  const [data, setData] = useState<TriagemResult>(emptyResult());
  const { muted, toggleMute, playSfx } = useTriagemAudio(open);

  useEffect(() => {
    if (open) {
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

  const stepIndex =
    step === 'abertura' ? -1 : step === 'features' ? CONTENT_STEPS.length - 1 : CONTENT_STEPS.indexOf(step);
  const bg = step === 'abertura' || step === 'features' ? CARD_BG.persona : CARD_BG[step];

  const advance = (patch: Partial<TriagemResult>) => {
    playSfx('whoosh');
    const next = { ...data, ...patch };
    setData(next);
    if (step === 'abertura') {
      setStep('intro1');
      return;
    }
    const nx = CONTENT_STEPS[stepIndex + 1];
    if (nx) setStep(nx);
    else {
      // Última pergunta respondida – finaliza a coleta de dados
      playSfx('ding');
      onFinished(next);
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
      {/* Top bar — só aparece após abertura */}
      {step !== 'abertura' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex items-center justify-between px-4 pt-4"
          style={{ paddingTop: 'calc(var(--sai-top) + 28px)' }}
        >
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-95"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="flex-1 flex items-center gap-1.5 ml-3">
            {CONTENT_STEPS.map((s, i) => (
              <div key={s} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={false}
                  animate={{ width: i <= stepIndex ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            ))}
          </div>
          {previewMode && (
            <button
              onClick={() => onFinished(data)}
              className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-95 ml-3"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* Stack */}
      <div
        className="relative flex-1 min-h-0 flex items-stretch justify-center px-3 pt-6 sm:pt-8"
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
            <motion.div
              key={step}
              initial={{ x: 120, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -120, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-lg rounded-[36px] overflow-hidden flex flex-col shadow-2xl border border-[#C94C4C]/25"
              style={{ background: bg.grad, color: bg.accent, minHeight: 0, maxHeight: '100%', willChange: 'transform, opacity' }}
            >
              {/* Textura de filósofos suave no card */}
              <FilosofosTextura seed={stepIndex + 1} />

              <div className="relative z-10 px-6 pt-6 flex items-center justify-between">
                <span className="text-[10px] font-black tracking-[0.45em]" style={{ color: GOLD }}>{bg.label}</span>
                <span className="text-[10px] font-bold tracking-[0.2em] opacity-60">
                  {stepIndex + 1}/{CONTENT_STEPS.length}
                </span>
              </div>

              <CardContent step={step as Exclude<Step, 'abertura' | 'features'>} data={data} setData={setData} advance={advance} playSfx={playSfx} bg={bg} />
            </motion.div>
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
              className="text-[11px] font-black tracking-[0.5em] mb-4 flex justify-center"
              style={{ color: GOLD }}
            >
              <ShortSlideDown text="BEM-VINDO(A)" holdMs={999999} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex justify-center"
            >
              <SplitText 
                text="Vamos te conhecer." 
                className="text-5xl sm:text-6xl font-black text-[#F3E7D6] leading-[0.9] normal-case tracking-tight" 
                style={{ fontFamily: SERIF }}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-[#F3E7D6]/70 text-lg leading-relaxed max-w-sm mx-auto text-center"
            >
              <SoftBlurIn text="Cinco toques rápidos pra ajustar o app ao seu jeito de estudar." holdMs={999999} />
            </motion.div>
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
}: {
  step: Exclude<Step, 'abertura' | 'features'>;
  data: TriagemResult;
  setData: React.Dispatch<React.SetStateAction<TriagemResult>>;
  advance: (patch: Partial<TriagemResult>) => void;
  playSfx: (k: 'tap' | 'whoosh' | 'ding') => void;
  bg: { grad: string; accent: string; label: string };
}) {
  const nome1 = data.nome.trim().split(' ')[0];

  return (
    <div
      className="relative z-10 flex-1 min-h-0 flex flex-col px-6 pt-4 overflow-hidden"
      style={{ paddingBottom: 'calc(var(--sai-bottom) + 24px)' }}
    >
      {step === 'intro1' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-6 flex flex-wrap gap-x-2" style={{ fontFamily: SERIF }}
          >
            <WaveReveal text="O Direito" mode="letter" direction="up" />
            <span className="italic"><WaveReveal text="evoluiu." mode="letter" direction="up" delay={400} /></span>
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }} className="text-base opacity-80 mb-6 leading-relaxed">
            <WaveReveal 
              text="A forma como você estuda e consome conteúdo jurídico também precisa evoluir. Chega de materiais espalhados e desatualizados." 
              direction="up" 
              mode="letter" 
            />
          </motion.div>
          <div className="flex-1" />
          <ContinueBtn disabled={false} onClick={() => advance({})} />
        </>
      )}

      {step === 'intro2' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-6 flex flex-col" style={{ fontFamily: SERIF }}
          >
            <WaveReveal text="Seu novo" mode="letter" direction="up" />
            <span className="italic"><WaveReveal text="ecossistema." mode="letter" direction="up" delay={300} /></span>
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.4 }} className="text-base opacity-80 mb-6 leading-relaxed">
            <WaveReveal 
              text="O Direito Prime foi construído para se adaptar à sua rotina. Vamos configurar sua experiência em poucos passos." 
              direction="up" 
              mode="letter" 
            />
          </motion.div>
          <div className="flex-1" />
          <ContinueBtn disabled={false} onClick={() => advance({})} />
        </>
      )}

      {step === 'persona' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-6 flex flex-wrap gap-x-2" style={{ fontFamily: SERIF }}
          >
            <WaveReveal text="Onde você está" mode="letter" direction="up" />
            <span className="italic"><WaveReveal text="na sua jornada?" mode="letter" direction="up" delay={500} /></span>
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
                    playSfx('tap');
                    advance({ persona: p.id as PersonaId, personaLabel: p.label });
                  }}
                  className="relative w-full rounded-2xl px-5 py-4 flex items-center text-left transition-colors border border-white/5 bg-white/[0.04] hover:bg-white/[0.08]"
                >
                  <div className="absolute top-[22px] -left-[18px] w-2.5 h-2.5 rounded-full bg-[#C94C4C] shadow-[0_0_8px_#C94C4C]" />
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="font-bold text-[16px] leading-tight" style={{ fontFamily: SERIF }}>{p.label}</div>
                    <div className="text-[12px] opacity-70 mt-1">{p.desc}</div>
                  </div>
                  <ChevronRight className="w-5 h-5 opacity-40 shrink-0" />
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
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-1 flex flex-wrap gap-x-2" style={{ fontFamily: SERIF }}
          >
            <WaveReveal text="O que é" mode="letter" direction="up" />
            <span className="italic"><WaveReveal text="prioridade" mode="letter" direction="up" delay={300} /></span>
            <WaveReveal text="pra você hoje?" mode="letter" direction="up" delay={600} />
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="text-sm opacity-70 mb-3">
            <WaveReveal text="Marque as funções que mais te interessam" mode="letter" direction="up" delay={1000} />
          </motion.div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] space-y-2 pb-2 -mx-1 px-1">
            {INTERESSES.map((it) => {
              const Icon = it.icon;
              const on = data.interesses.includes(it.id);
              return (
                <motion.button
                  key={it.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    playSfx('tap');
                    setData((d) => ({
                      ...d,
                      interesses: d.interesses.includes(it.id)
                        ? d.interesses.filter((x) => x !== it.id)
                        : [...d.interesses, it.id],
                    }));
                  }}
                  className={`w-full rounded-2xl px-4 py-3 flex items-center gap-3 border transition text-left ${
                    on
                      ? 'bg-[#C94C4C] text-[#150C05] border-[#C94C4C]'
                      : 'bg-white/[0.06] backdrop-blur border-white/15'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] leading-tight" style={{ fontFamily: SERIF }}>{it.label}</div>
                    <div className="text-[11px] opacity-70 leading-snug">{it.desc}</div>
                  </div>
                  {on && <Check className="w-4 h-4 shrink-0" />}
                </motion.button>
              );
            })}
          </div>
          <ContinueBtn disabled={data.interesses.length === 0} onClick={() => advance({})} />
        </>
      )}

      {step === 'dores' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-1 flex flex-wrap gap-x-2" style={{ fontFamily: SERIF }}
          >
            <WaveReveal text="O que mais" mode="letter" direction="up" />
            <span className="italic"><WaveReveal text="trava" mode="letter" direction="up" delay={400} /></span>
            <WaveReveal text="seus estudos hoje?" mode="letter" direction="up" delay={600} />
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="text-sm opacity-70 mb-3">
            <WaveReveal text="Marque o que trava seus estudos na lei" mode="letter" direction="up" delay={1000} />
          </motion.div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch] space-y-2 pb-2 -mx-1 px-1">
            {DORES.map((d) => {
              const Icon = d.icon;
              const on = data.dores.includes(d.id);
              return (
                <motion.button
                  key={d.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    playSfx('tap');
                    setData((prev) => ({
                      ...prev,
                      dores: prev.dores.includes(d.id)
                        ? prev.dores.filter((x) => x !== d.id)
                        : [...prev.dores, d.id],
                    }));
                  }}
                  className={`w-full rounded-2xl px-4 py-3 flex items-center gap-3 border transition text-left ${
                    on
                      ? 'bg-[#C94C4C] text-[#150C05] border-[#C94C4C]'
                      : 'bg-white/[0.06] backdrop-blur border-white/15'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14px] leading-tight" style={{ fontFamily: SERIF }}>{d.label}</div>
                    <div className="text-[11px] opacity-70 leading-snug">{d.desc}</div>
                  </div>
                  {on && <Check className="w-4 h-4 shrink-0" />}
                </motion.button>
              );
            })}
          </div>
          <ContinueBtn disabled={data.dores.length === 0} onClick={() => advance({})} />
        </>
      )}

      {step === 'nome' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-1 flex flex-wrap gap-x-2" style={{ fontFamily: SERIF }}
          >
            <WaveReveal text="Sua jornada" mode="letter" direction="up" />
            <span className="italic"><WaveReveal text="começa aqui" mode="letter" direction="up" delay={400} /></span>
            {nome1 && <WaveReveal text={`, ${nome1}.`} mode="letter" direction="up" delay={700} />}
            {!nome1 && <WaveReveal text="." mode="letter" direction="up" delay={700} />}
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="text-base opacity-80 mb-6 leading-relaxed">
            <WaveReveal text="O seu novo jeito de estudar Direito está quase pronto. Como você quer ser chamado?" mode="letter" direction="up" delay={900} />
          </motion.div>
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
          <ContinueBtn disabled={!data.nome.trim()} onClick={() => advance({})} />
        </>
      )}

      {step === 'whatsapp' && (
        <>
          <motion.h2 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
            className="text-3xl sm:text-4xl font-black leading-[1.05] mt-2 mb-1 flex flex-wrap gap-x-2" style={{ fontFamily: SERIF }}
          >
            <WaveReveal text="Acelere com o" mode="letter" direction="up" />
            <span className="italic"><WaveReveal text="Hórus." mode="letter" direction="up" delay={500} /></span>
          </motion.h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.4 }} className="text-base opacity-80 mb-6 leading-relaxed">
            <WaveReveal text="Coloque seu WhatsApp para liberar a nossa Inteligência Artificial direto no seu bolso, além de alertas rápidos de novas leis (opcional)." mode="letter" direction="up" delay={800} />
          </motion.div>
          <input
            value={data.whatsapp || ''}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                whatsapp: e.target.value.replace(/[^\d+\s()-]/g, '').slice(0, 20),
              }))
            }
            placeholder="(11) 98765-4321"
            className="w-full h-14 px-5 rounded-2xl bg-white/[0.07] backdrop-blur border border-white/20 text-lg font-semibold outline-none focus:border-[#C94C4C] placeholder-white/35"
            style={{ color: bg.accent }}
          />
          <div className="flex-1" />
          <div className="flex gap-2 shrink-0">
            <button
              disabled={!data.whatsapp || data.whatsapp.replace(/\D/g, '').length < 10}
              onClick={() =>
                advance({
                  whatsapp: data.whatsapp!
                })
              }
              className="w-full h-14 rounded-2xl bg-[#C94C4C] text-[#150C05] font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              Finalizar <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ContinueBtn({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="mt-3 shrink-0 h-14 rounded-2xl bg-[#C94C4C] text-[#150C05] font-black flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30"
    >
      Continuar <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
}
