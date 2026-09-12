import { memo, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Scale, RotateCcw, CheckCircle2, Lightbulb, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlashcardCard } from '@/lib/flashcardsQueries';
import { getAreaThemePalette } from '@/lib/areasDireitoIcons';
import { PremiumMarkdown } from '@/components/ui/PremiumMarkdown';
import remarkGfm from 'remark-gfm';

type Flashcard3DProps = {
  atual: FlashcardCard;
  idx: number;
  virado: boolean;
  onVirar: () => void;
  onResponder: (status: 'compreendido' | 'revisar', shakeCallback?: () => void) => void;
  exitDirection: 'left' | 'down';
  accent?: string;
  areaNome?: string | null;
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
      <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-p:my-1 prose-strong:text-emerald-400 prose-ul:my-1 prose-li:my-0">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{texto}</ReactMarkdown>
      </div>
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
  accent = '#10b981',
  areaNome,
}: Flashcard3DProps) {
  const cardContainerRef = useRef<HTMLDivElement>(null);

  const effectiveArea = atual.area || areaNome;
  const palette = useMemo(() => getAreaThemePalette(effectiveArea || accent), [effectiveArea, accent]);

  const handleResponder = (status: 'compreendido' | 'revisar') => {
    onResponder(status, () => {
      if (cardContainerRef.current) {
        cardContainerRef.current.animate(
          [
            { transform: 'translateX(-8px)' },
            { transform: 'translateX(8px)' }
          ],
          { duration: 50, iterations: 6, direction: 'alternate', easing: 'ease-in-out' }
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
              data-flashcard="true"
              className="relative h-full w-full transition-transform duration-[800ms] [transform-style:preserve-3d] contain-layout"
              style={{
                transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.25, 0.64, 1)',
              }}
            >
              {/* Frente da Carta — Harmonizada com o Tema e Estilo Editorial de Alta Definição */}
              <div
                className="absolute inset-0 rounded-[32px] border p-6 md:p-8 flex flex-col justify-between overflow-hidden text-white [backface-visibility:hidden] [-webkit-backface-visibility:hidden] shadow-2xl"
                style={{
                  borderColor: `${palette.primary}55`,
                  boxShadow: `0 24px 60px -24px ${palette.primary}65, inset 0 0 0 1px rgba(255,255,255,0.15)`,
                  background: palette.cardGradient,
                }}
              >
                {/* Vinheta gradiente interna para contraste perfeito de leitura */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/65 pointer-events-none z-[1]" />

                {/* Moldura Interna Chanfrada de Carta Colecionável */}
                <div className="absolute inset-2 sm:inset-2.5 rounded-[24px] border border-white/20 pointer-events-none z-[2]" />

                {/* Efeito de Brilho e Acabamento Laminado da Carta */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.12] pointer-events-none z-[2]" />

                {/* Marca d'água / Gravura Majestosa da Deusa Têmis Vazada na Carta */}
                <img
                  src="/images/gamificacao/deusa_temis_vazada.webp"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute -right-3 -bottom-3 w-[150px] sm:w-[190px] md:w-[230px] h-auto object-contain opacity-35 select-none filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)] z-0"
                />

                {/* Cabeçalho do Card: Breadcrumb do Tema / Subtema */}
                <div className="relative z-10 mb-4 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0 flex-1">
                    {atual.area === 'Termos Jurídicos' && (
                      <span className="mr-1.5 flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                        <BookOpen className="h-2.5 w-2.5" />
                        Glossário
                      </span>
                    )}
                    {(() => {
                      const baseTema = atual.tema ?? atual.area ?? 'Flashcard';
                      const parts = formatTemaBreadcrumb(baseTema);
                      if (atual.subtema && !parts.some(p => p.toLowerCase() === atual.subtema?.toLowerCase())) {
                        parts.push(toSentence(atual.subtema));
                      }
                      return parts.map((part, i, arr) => (
                        <span key={i} className="flex items-center gap-1">
                          <span className="text-[11px] md:text-xs font-semibold leading-snug text-white/95 drop-shadow-sm">
                            {part}
                          </span>
                          {i < arr.length - 1 && (
                            <ChevronRight className="h-2.5 w-2.5 shrink-0 text-white/50" />
                          )}
                        </span>
                      ));
                    })()}
                  </div>
                  <Scale className="h-4 w-4 shrink-0 mt-0.5 text-white/80 drop-shadow-sm" aria-hidden />
                </div>
                
                {/* Pergunta */}
                <div className="relative z-10 flex-1 flex items-center justify-center text-center px-2 py-3">
                  <motion.div 
                    initial={{ opacity: 0, y: 6 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: 0.1, duration: 0.3 }} 
                    className="prose prose-invert max-w-none text-xl md:text-2xl leading-snug font-normal text-white drop-shadow-md prose-p:my-1 prose-strong:text-white prose-em:text-white/80" 
                    style={{ 
                      fontFamily: "'Merriweather','Georgia',serif", 
                      textShadow: "0 2px 14px rgba(0,0,0,0.85)" 
                    }}
                  >
                    <PremiumMarkdown remarkPlugins={[remarkGfm]}>{atual.pergunta}</PremiumMarkdown>
                  </motion.div>
                </div>
                
                {/* Rodapé da Frente */}
                <div className="relative z-10 mt-auto shrink-0 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-normal tracking-wide text-white/75 pt-3">
                  <RotateCcw className="h-3 w-3 text-white/75" /> Toque ou aperte espaço para virar
                </div>
              </div>

              {/* Verso da Carta — Estilo Obsidian com Tint do Tema e Deusa Têmis */}
              <div
                className="absolute inset-0 rounded-[32px] border p-5 md:p-7 overflow-y-auto scrollbar-hide flex flex-col [backface-visibility:hidden] [-webkit-backface-visibility:hidden] shadow-2xl"
                style={{
                  transform: 'rotateY(180deg)',
                  borderColor: `${palette.primary}45`,
                  boxShadow: `0 24px 60px -24px ${palette.primary}50, inset 0 0 0 1px rgba(255,255,255,0.08)`,
                  background: `linear-gradient(155deg, rgba(26, 25, 30, 0.98) 0%, rgba(13, 13, 16, 0.99) 100%)`,
                }}
              >
                {/* Moldura Interna Chanfrada */}
                <div className="absolute inset-2 sm:inset-2.5 rounded-[24px] border border-white/10 pointer-events-none z-[2]" />

                {/* Marca d'água / Gravura da Deusa Têmis no Verso */}
                <img
                  src="/images/gamificacao/deusa_temis_vazada.webp"
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute -right-3 -bottom-3 w-[150px] sm:w-[190px] md:w-[230px] h-auto object-contain opacity-20 select-none filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.7)] z-0"
                />

                <div className="relative z-10 flex-1 flex flex-col">
                  {atual.area === 'Termos Jurídicos' && (
                    <div className="flex justify-center mb-1">
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/30">
                        <BookOpen className="h-2.5 w-2.5" />
                        Glossário
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold mb-3 text-center" style={{ color: palette.primary }}>
                    Resposta Explicada
                  </p>
                  <div className="flex-1 flex flex-col items-center justify-center space-y-4 pb-4">
                    <div className={`prose prose-invert max-w-prose text-center flex-1 flex flex-col justify-center ${
                      atual.resposta.length < 40 ? 'text-2xl sm:text-3xl prose-p:text-2xl sm:prose-p:text-3xl' :
                      atual.resposta.length < 80 ? 'text-xl sm:text-2xl prose-p:text-xl sm:prose-p:text-2xl' :
                      atual.resposta.length < 150 ? 'text-lg sm:text-xl prose-p:text-lg sm:prose-p:text-xl' :
                      'text-base sm:text-lg prose-p:text-base sm:prose-p:text-lg'
                    } prose-strong:text-emerald-400 prose-ul:text-left prose-ul:mx-auto prose-li:my-1 prose-headings:mb-2`}>
                      <PremiumMarkdown remarkPlugins={[remarkGfm]}>{atual.resposta}</PremiumMarkdown>
                    </div>
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
            className="pt-2 pb-[calc(6.5rem+var(--sai-bottom))] grid grid-cols-2 gap-3"
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
              style={{ backgroundColor: palette.primary, color: '#ffffff' }}
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
