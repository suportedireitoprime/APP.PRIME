import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BellRing, Scale, BookOpen, Layers, Search } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import brasaoImg from '@/assets/brasao-republica.webp';

const HINTS = [
  'Pesquise o artigo...',
  'Pesquise a lei...',
  'Pesquise o número da lei...',
  'Pesquise trechos...',
  'Pesquise normas...',
  'Pesquise jurisprudência...',
  'Pesquise súmulas...',
  'Pesquise por voz...',
];

const TypingHint = () => {
  const [text, setText] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'paused' | 'erasing'>('typing');

  useEffect(() => {
    const current = HINTS[hintIndex];
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (text.length < current.length) {
        timer = setTimeout(() => setText(current.slice(0, text.length + 1)), 90);
      } else {
        timer = setTimeout(() => setPhase('paused'), 1500);
      }
    } else if (phase === 'paused') {
      timer = setTimeout(() => setPhase('erasing'), 100);
    } else if (phase === 'erasing') {
      if (text.length > 0) {
        timer = setTimeout(() => setText(text.slice(0, text.length - 1)), 50);
      } else {
        setHintIndex((i) => (i + 1) % HINTS.length);
        setPhase('typing');
      }
    }

    return () => clearTimeout(timer);
  }, [text, hintIndex, phase]);

  return (
    <span className="inline-flex items-center">
      {text}
      <span className="ml-0.5 inline-block w-[2px] h-[14px] bg-white/80 animate-pulse" />
    </span>
  );
};

interface Props {
  onBuscar: () => void;
}

const VadeMecumHero = ({ onBuscar }: Props) => {
  const navigate = useNavigate();
  const [motifTick, setMotifTick] = useState(0);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id) return;
      id = setInterval(() => setMotifTick((t) => t + 1), 6000);
    };
    const stop = () => { if (id) { clearInterval(id); id = null; } };
    if (!document.hidden) start();
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  return (
    <div className="flex flex-col rounded-b-3xl overflow-hidden shadow-2xl z-20 relative">
      {/* ── Cabeçalho Vade Mecum ───────────────── */}
      <div className="bg-zinc-950 px-4 pb-4 pt-safe-header flex items-center justify-between">
        <button 
          onClick={() => { haptic.selection(); navigate('/'); }} 
          aria-label="Voltar"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <h1 className="font-display text-[18px] font-black uppercase tracking-widest text-white text-center flex-1">
          Vade Mecum
        </h1>

        <button 
          onClick={() => { haptic.selection(); navigate('/meus-lembretes'); }} 
          aria-label="Lembretes"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 active:scale-95"
        >
          <BellRing className="h-5 w-5" />
        </button>
      </div>

      <section
        className="relative isolate overflow-hidden pb-1"
        aria-label="Painel Principal do Vade Mecum"
      >
        <div className="absolute inset-0 bg-hero-panel -z-10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.28),transparent_65%)]" />

        {/* Decorative legal motifs — apenas ao redor das bordas, com float + shimmer */}
        <svg
          className="pointer-events-none absolute inset-0 w-full h-full opacity-[0.32]"
          viewBox="0 0 400 300"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden
        >
          <defs>
            <g id="legal-scales" stroke="rgba(0,0,0,0.95)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="0" cy="-26" r="2.4" fill="rgba(0,0,0,0.95)" stroke="none" />
              <line x1="0" y1="-24" x2="0" y2="18" />
              <line x1="-22" y1="-18" x2="22" y2="-18" />
              <line x1="-22" y1="-18" x2="-22" y2="-10" />
              <line x1="22" y1="-18" x2="22" y2="-10" />
              <path d="M -30 -10 Q -22 -2 -14 -10" />
              <line x1="-30" y1="-10" x2="-14" y2="-10" />
              <path d="M 14 -10 Q 22 -2 30 -10" />
              <line x1="14" y1="-10" x2="30" y2="-10" />
              <path d="M -12 18 L 12 18 L 9 22 L -9 22 Z" />
              <line x1="-14" y1="22" x2="14" y2="22" />
            </g>
            <g id="legal-gavel" stroke="rgba(0,0,0,0.95)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <g transform="rotate(-30)">
                <rect x="-16" y="-9" width="32" height="14" rx="2.5" />
                <line x1="-10" y1="-9" x2="-10" y2="5" />
                <line x1="10" y1="-9" x2="10" y2="5" />
                <line x1="6" y1="5" x2="22" y2="21" strokeWidth="2.6" />
                <circle cx="22" cy="21" r="1.8" fill="rgba(0,0,0,0.95)" stroke="none" />
              </g>
              <rect x="-18" y="16" width="36" height="5" rx="1.2" />
              <line x1="-16" y1="21" x2="16" y2="21" />
            </g>
            <g id="legal-book" stroke="rgba(0,0,0,0.95)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="0" y1="-14" x2="0" y2="16" />
              <path d="M 0 -12 Q -12 -16 -22 -14 L -22 14 Q -12 12 0 16 Z" />
              <path d="M 0 -12 Q 12 -16 22 -14 L 22 14 Q 12 12 0 16 Z" />
              <line x1="-18" y1="-8" x2="-4" y2="-6" />
              <line x1="-18" y1="-2" x2="-4" y2="0" />
              <line x1="-18" y1="4"  x2="-4" y2="6" />
              <line x1="4" y1="-6"  x2="18" y2="-8" />
              <line x1="4" y1="0"   x2="18" y2="-2" />
              <line x1="4" y1="6"   x2="18" y2="4" />
            </g>
            <g id="legal-sword" stroke="rgba(0,0,0,0.95)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <line x1="0" y1="-26" x2="0" y2="14" />
              <path d="M -3 -26 Q 0 -30 3 -26" />
              <line x1="-12" y1="14" x2="12" y2="14" />
              <line x1="0" y1="14" x2="0" y2="24" />
              <path d="M -5 24 Q 0 28 5 24" />
            </g>
          </defs>
          {(() => {
            type Spot = { x: number; y: number; r: number; s: number };
            const LAYOUTS: Spot[][] = [
              [
                { x:  70, y:  46, r: -8, s: 1.0  }, { x: 200, y:  36, r:  0, s: 1.15 }, { x: 330, y:  46, r:  8, s: 1.0  },
                { x:  34, y: 118, r: -14, s: 0.95 }, { x: 366, y: 118, r:  14, s: 0.95 },
                { x:  30, y: 210, r:  10, s: 0.9  }, { x: 370, y: 210, r: -10, s: 0.9  },
                { x: 110, y: 268, r:   6, s: 0.9  }, { x: 200, y: 276, r:   0, s: 1.0  }, { x: 290, y: 268, r:  -6, s: 0.9  },
              ],
              [
                { x: 200, y:  56, r:   0, s: 1.05 }, { x: 110, y:  96, r: -18, s: 0.95 }, { x: 290, y:  96, r:  18, s: 0.95 },
                { x:  56, y: 160, r: -10, s: 0.9  }, { x: 344, y: 160, r:  10, s: 0.9  },
                { x: 110, y: 220, r:  12, s: 0.95 }, { x: 290, y: 220, r: -12, s: 0.95 },
                { x: 200, y: 250, r:   0, s: 1.1  }, { x:  30, y:  90, r: -30, s: 0.85 }, { x: 370, y:  90, r:  30, s: 0.85 },
              ],
              [
                { x:  40, y:  50, r: -12, s: 0.95 }, { x: 108, y:  86, r:  -6, s: 1.0  }, { x: 178, y: 122, r:   0, s: 1.05 },
                { x: 248, y: 158, r:   6, s: 1.0  }, { x: 318, y: 194, r:  12, s: 0.95 },
                { x:  60, y: 232, r:  18, s: 0.9  }, { x: 360, y:  72, r: -18, s: 0.9  },
                { x: 200, y:  36, r:   0, s: 0.95 }, { x: 130, y: 270, r:  10, s: 0.9  }, { x: 290, y: 270, r: -10, s: 0.9  },
              ],
            ];
            const ICONS = ['legal-scales', 'legal-gavel', 'legal-book', 'legal-scales', 'legal-gavel', 'legal-book', 'legal-scales', 'legal-gavel', 'legal-book', 'legal-scales'];
            const preset = LAYOUTS[motifTick % LAYOUTS.length];
            return ICONS.map((id, i) => {
              const slot = preset[i];
              return (
                <g key={i} className="hero-legal-icon" style={{ transform: `translate(${slot.x}px, ${slot.y}px) rotate(${slot.r}deg) scale(${slot.s})`, transition: 'transform 1400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 900ms ease' }}>
                  <use href={`#${id}`} />
                </g>
              );
            });
          })()}
        </svg>

        <div className="relative p-4 sm:p-5">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0 w-[72px] h-[72px] rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.45)] logo-shine">
              <img
                src={brasaoImg}
                alt="Brasão da República"
                loading="eager"
                decoding="sync"
                className="w-[74%] h-[74%] object-contain drop-shadow-md"
              />
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Busca Rápida</p>
              <h2 className="mt-0.5 font-display text-[22px] font-black leading-tight text-white sm:text-[28px]">
                VADE MECUM
              </h2>
              <p className="mt-0.5 text-[12px] font-medium italic leading-snug text-white/80 sm:text-[13px]">
                Legislação Completa
              </p>
            </div>
          </div>

          {/* ── 3 Caixas de Métricas ────────────────── */}
          <div className="relative mt-4 rounded-2xl bg-black/85 text-white shadow-xl ring-1 ring-black/20 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-white/10">
              {/* Box 1: Leis Totais */}
              <div className="flex flex-col items-center justify-center px-1.5 py-3">
                <div className="flex items-center gap-1 opacity-60">
                  <BookOpen className="w-3 h-3" />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">Leis Totais</span>
                </div>
                <span className="mt-1 font-display text-base font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                  25.000+
                </span>
              </div>

              {/* Box 2: Áreas */}
              <div className="flex flex-col items-center justify-center px-1.5 py-3">
                <div className="flex items-center gap-1 opacity-60">
                  <Layers className="w-3 h-3" />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">Áreas</span>
                </div>
                <span className="mt-1 font-display text-base font-black leading-none text-white [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                  40+
                </span>
              </div>

              {/* Box 3: Atualização */}
              <div className="flex flex-col items-center justify-center px-1.5 py-3">
                <div className="flex items-center gap-1 opacity-60">
                  <Scale className="w-3 h-3" />
                  <span className="text-[9px] font-extrabold uppercase tracking-wider">Atualização</span>
                </div>
                <span className="mt-1 font-display text-[15px] font-black leading-none text-emerald-400 [text-shadow:0px_1px_2px_rgba(0,0,0,0.8)]">
                  HOJE
                </span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <button
            type="button"
            onClick={onBuscar}
            aria-label="Pesquisar artigos e leis"
            className="mt-5 relative w-full flex items-center h-16 pl-14 pr-[112px] rounded-2xl bg-black/45 backdrop-blur-md border border-primary/40 shadow-lg shadow-black/30 active:scale-[0.99] transition search-bar-shine"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary shrink-0" strokeWidth={2.2} />
            <span className="relative z-[2] font-body text-white/70 text-[15px] font-medium truncate text-left">
              <TypingHint />
            </span>
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-12 px-5 rounded-xl bg-hero-panel text-white font-display text-[13px] font-bold tracking-wider flex items-center justify-center shadow-md shadow-black/30 active:scale-95 transition">
              PESQUISAR
            </div>
          </button>
        </div>

        <Scale className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 text-white/15" />
      </section>
    </div>
  );
};

export default VadeMecumHero;
