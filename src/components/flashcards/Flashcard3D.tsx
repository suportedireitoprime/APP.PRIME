import { memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ChevronRight, Scale, RotateCcw, CheckCircle2, Lightbulb, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlashcardCard } from '@/lib/flashcardsQueries';
import laurel from '@/assets/landing-tribunal/laurel-leaf.png';
import scales from '@/assets/landing-tribunal/scales.png';

type Flashcard3DProps = {
  atual: FlashcardCard;
  idx: number;
  virado: boolean;
  onVirar: () => void;
  onResponder: (status: 'compreendido' | 'revisar', shakeCallback?: () => void) => void;
  exitDirection: 'left' | 'down';
  accent?: string;
};

// Utilities for visual styling
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function toSentence(s: string): string {
  const minors = new Set(['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'ao', 'à', 'às', 'por', 'para', 'com', 'sem', 'sob', 'ou']);
  return s.toLowerCase().split(/\s+/).map((word, i) => {
    if (i === 0 || !minors.has(word)) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
}

function formatTemaBreadcrumb(raw: string): string[] {
  const dashIdx = raw.search(/\s[-–]\s/);
  if (dashIdx === -1) return [toSentence(raw)];
  const leiName = raw.slice(0, dashIdx).trim();
  let remaining = raw.slice(dashIdx).replace(/^\s*[-–]\s*/, '').trim();
  const badges: string[] = [];
  const structRegex = /^(?:PARTE|LIVRO|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O)\s+[\wºª]+(?:-[\wºª]+)?/i;
  
  while (true) {
    const match = remaining.match(structRegex);
    if (!match) break;
    badges.push(toSentence(match[0]));
    remaining = remaining.slice(match[0].length).trim();
    if (remaining.startsWith('-') || remaining.startsWith('–') || remaining.startsWith(':')) {
      remaining = remaining.replace(/^[-–—:]+\s*/, '').trim();
    }
  }
  const result = [leiName, ...badges];
  if (remaining) {
    result.push(toSentence(remaining));
  }
  return result;
}

function Bloco({ icon: Icon, titulo, texto }: { icon: any; titulo: string; texto: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {titulo}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{texto}</p>
    </div>
  );
}

const Flashcard3D = memo(function Flashcard3D({
  atual,
  idx,
  virado,
  onVirar,
  onResponder,
  exitDirection,
  accent = '#10b981'
}: Flashcard3DProps) {
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const temaKey = atual.tema ?? atual.area ?? atual.pergunta.slice(0, 32);
  const h = hashString(temaKey);
  const angle = h % 360;
  const pattern = h % 4;

  const handleResponder = (status: 'compreendido' | 'revisar') => {
    onResponder(status, () => {
      if (cardContainerRef.current) {
        gsap.fromTo(
          cardContainerRef.current,
          { x: -8 },
          { x: 8, clearProps: "x", repeat: 5, yoyo: true, duration: 0.05, ease: 'sine.inOut' }
        );
      }
    });
  };

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={atual.id || idx}
          initial={{ opacity: 0, y: -15, scale: 0.94, rotateX: 12 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={
            exitDirection === 'down'
              ? { opacity: 0, y: 180, rotateX: -55, scale: 0.82, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } }
              : { opacity: 0, x: -160, rotateZ: -14, scale: 0.88, transition: { duration: 0.28, ease: 'easeInOut' } }
          }
          transition={{ duration: 0.35, ease: [0.34, 1.25, 0.64, 1] }}
          className="relative z-10 w-full h-full [perspective:1600px]"
        >
          <div
            role="button"
            tabIndex={0}
            onClick={onVirar}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onVirar(); }}
            aria-label={virado ? 'Ver pergunta' : 'Ver resposta'}
            className="relative w-full h-full text-left focus:outline-none cursor-pointer select-none"
          >
            <div
              ref={cardContainerRef}
              className="relative h-full w-full transition-transform duration-[800ms] [transform-style:preserve-3d]"
              style={{
                transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.25, 0.64, 1)',
              }}
            >
              {/* Frente */}
              <div
                className="absolute inset-0 rounded-[32px] border p-6 md:p-8 flex flex-col overflow-hidden text-white [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                style={{
                  borderColor: `${accent}40`,
                  boxShadow: `0 20px 60px -30px ${accent}80, inset 0 0 0 1px ${accent}25`,
                  background: `
                    radial-gradient(120% 80% at ${20 + (h % 60)}% ${10 + (h % 40)}%, ${accent}55 0%, transparent 55%),
                    radial-gradient(100% 70% at ${80 - (h % 50)}% ${90 - (h % 30)}%, ${accent}30 0%, transparent 60%),
                    linear-gradient(${angle}deg, oklch(0.22 0.04 280) 0%, oklch(0.14 0.03 280) 100%)
                  `,
                }}
              >
                <svg className="absolute inset-0 h-full w-full opacity-[0.07] pointer-events-none" aria-hidden viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice">
                  <defs>
                    <pattern id={`fcp-${h}`} x="0" y="0" width={pattern === 0 ? 40 : pattern === 1 ? 60 : 80} height={pattern === 0 ? 40 : pattern === 1 ? 60 : 80} patternUnits="userSpaceOnUse" patternTransform={`rotate(${angle / 6})`}>
                      {pattern === 0 && <circle cx="20" cy="20" r="1.5" fill="currentColor" />}
                      {pattern === 1 && <path d="M0 30 L60 30" stroke="currentColor" strokeWidth="0.6" />}
                      {pattern === 2 && <path d="M0 0 L80 80 M80 0 L0 80" stroke="currentColor" strokeWidth="0.5" />}
                      {pattern === 3 && <rect x="20" y="20" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" />}
                    </pattern>
                  </defs>
                  <rect width="400" height="400" fill={`url(#fcp-${h})`} />
                </svg>

                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: accent }} aria-hidden />

                {/* Floating Elements from Landing Page */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <img key={i} src={laurel} alt="" aria-hidden="true" className="absolute -top-10 lp-fall" style={{ left: `${(i * 18 + 5) % 100}%`, width: `${14 + (i % 3) * 6}px`, animationDuration: `${12 + (i % 4) * 3}s`, animationDelay: `${i * 1.5}s`, opacity: 0.5, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                  ))}
                  <img src={scales} alt="" aria-hidden="true" className="pointer-events-none absolute right-[8%] top-[25%] w-10 lp-float" style={{ animationDirection: 'reverse', opacity: 0.45, filter: `drop-shadow(0 0 12px ${accent}60)` }} />
                  <img src={laurel} alt="" aria-hidden="true" className="pointer-events-none absolute left-[12%] bottom-[25%] w-8 lp-float" style={{ animationDelay: '2s', opacity: 0.35 }} />
                </div>

                <div className="relative z-10 mb-4 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 min-w-0 flex-1">
                    {formatTemaBreadcrumb(atual.tema ?? atual.area ?? 'Flashcard').map((part, i, arr) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="text-[11px] md:text-xs font-medium leading-snug" style={{ color: `color-mix(in oklab, ${accent} 60%, white)`, textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
                          {part}
                        </span>
                        {i < arr.length - 1 && (
                          <ChevronRight className="h-2.5 w-2.5 shrink-0 opacity-50" style={{ color: `color-mix(in oklab, ${accent} 50%, white)` }} />
                        )}
                      </span>
                    ))}
                  </div>
                  <Scale className="h-4 w-4 shrink-0 mt-0.5" style={{ color: `${accent}`, opacity: 0.6 }} aria-hidden />
                </div>
                
                <div className="relative z-10 flex-1 flex items-center justify-center text-center">
                  <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="text-xl md:text-2xl leading-snug font-medium" style={{ fontFamily: "'Merriweather','Georgia',serif", textShadow: "0 2px 16px rgba(0,0,0,0.6)" }}>
                    {atual.pergunta}
                  </motion.p>
                </div>
                
                <div className="relative z-10 mt-auto shrink-0 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-normal tracking-wide text-white/60 pt-4">
                  <RotateCcw className="h-3 w-3 text-white/60" /> Toque ou aperte espaço para virar
                </div>
              </div>

              {/* Verso */}
              <div
                className="absolute inset-0 rounded-[32px] border bg-card p-5 md:p-7 overflow-y-auto scrollbar-hide flex flex-col [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
                style={{
                  transform: 'rotateY(180deg)',
                  borderColor: `${accent}55`,
                  boxShadow: `0 20px 60px -30px ${accent}60`,
                }}
              >
                {/* Floating Elements (Verso) */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[32px]">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <img key={i} src={laurel} alt="" aria-hidden="true" className="absolute -top-10 lp-fall" style={{ left: `${(i * 18 + 5) % 100}%`, width: `${14 + (i % 3) * 6}px`, animationDuration: `${12 + (i % 4) * 3}s`, animationDelay: `${i * 1.5}s`, opacity: 0.15, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                  ))}
                  <img src={scales} alt="" aria-hidden="true" className="pointer-events-none absolute right-[8%] top-[25%] w-10 lp-float" style={{ animationDirection: 'reverse', opacity: 0.1, filter: `drop-shadow(0 0 12px ${accent}60)` }} />
                  <img src={laurel} alt="" aria-hidden="true" className="pointer-events-none absolute left-[12%] bottom-[25%] w-8 lp-float" style={{ animationDelay: '2s', opacity: 0.1 }} />
                </div>

                <div className="relative z-10 flex-1 flex flex-col">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3 text-center" style={{ color: accent }}>
                    Resposta Explicada
                  </p>
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4 pb-4">
                    <p className={`whitespace-pre-wrap font-medium leading-relaxed text-foreground text-center max-w-prose ${
                      atual.resposta.length < 40 ? 'text-2xl sm:text-3xl' :
                      atual.resposta.length < 80 ? 'text-xl sm:text-2xl' :
                      atual.resposta.length < 150 ? 'text-lg sm:text-xl' :
                      'text-base sm:text-lg'
                    }`}>
                      {atual.resposta}
                    </p>
                  </div>
                  
                  {(atual.exemplo || atual.base_legal || atual.dica) && (
                    <div className="mt-3 border-t border-border pt-3 space-y-3" onClick={(e) => e.stopPropagation()}>
                      {atual.exemplo && <Bloco icon={BookOpen} titulo="Exemplo Prático" texto={atual.exemplo} />}
                      {atual.base_legal && <Bloco icon={Scale} titulo="Base Legal / Artigo" texto={atual.base_legal} />}
                      {atual.dica && <Bloco icon={Lightbulb} titulo="Dica de Ouro" texto={atual.dica} />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Botões de Ação — só aparecem após virar o card */}
      <AnimatePresence>
        {virado && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="pt-2 pb-[calc(6.5rem+var(--safe-bottom))] grid grid-cols-2 gap-3"
          >
            <Button
              variant="outline"
              className="h-14 sm:h-16 rounded-2xl text-base font-bold gap-2 border-border/80 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-95 transition-all shadow-sm"
              onClick={() => handleResponder('revisar')}
            >
              <RotateCcw className="h-5 w-5 text-emerald-500" />
              <span>Revisar</span>
            </Button>
            <Button
              className="h-14 sm:h-16 rounded-2xl text-base font-black gap-2 active:scale-95 transition-all shadow-md hover:opacity-90"
              style={{ backgroundColor: '#10b981', color: '#ffffff' }}
              onClick={() => handleResponder('compreendido')}
            >
              <CheckCircle2 className="h-5 w-5 text-white" />
              <span>Compreendi</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});

export default Flashcard3D;
