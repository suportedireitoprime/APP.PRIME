import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, Milestone, Bookmark } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';

export type TimelineStep = {
  tag: string;
  text: string;
  details: string[];
  highlight?: string;
};

export function isTimelineBlock(raw: string): boolean {
  if (!raw) return false;
  const t = raw.trim();
  const hasStepWords = /(?:Passo|Etapa|Fase|Momento)\s*\d+/i.test(t);
  const hasBracketSteps = /\[(?:Ano|Dia|Desfecho|Hipótese|Qualificadora|Terceiro)[^\]]*\]/i.test(t);
  const hasArrowsOrPipes = /[│|]|\─\─\>|──>|-->|▼/i.test(t);
  return (hasStepWords || hasBracketSteps) && hasArrowsOrPipes;
}

export function parseTimeline(raw: string): TimelineStep[] {
  const lines = raw.split('\n');
  const steps: TimelineStep[] = [];
  let currentStep: TimelineStep | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '│' || trimmed === '|' || trimmed === '▼') continue;

    // Detecta novo passo: "Passo 1: ...", "Etapa 2: ...", "Fase 3: ...", "[Ano 2015] ──> ...", "[Desfecho] ──> ..."
    const stepMatch = trimmed.match(
      /^(?:(Passo\s*\d+|Etapa\s*\d+|Fase\s*\d+|Momento\s*\d+):?\s*|\[([^\]]+)\]\s*(?:──>|-->)?\s*)(.*)$/i
    );

    if (stepMatch) {
      if (currentStep) steps.push(currentStep);
      const tag = (stepMatch[1] || stepMatch[2] || '').trim();
      let rest = (stepMatch[3] || '').trim();
      let highlight: string | undefined = undefined;

      const hlMatch = rest.match(/===\s*([^=]+)\s*===/);
      if (hlMatch) {
        highlight = hlMatch[1].trim();
        rest = rest.replace(/===\s*[^=]+\s*===/, '').trim();
      }

      currentStep = {
        tag,
        text: rest,
        details: [],
        highlight,
      };
    } else if (currentStep) {
      const hlMatch = trimmed.match(/===\s*([^=]+)\s*===/);
      if (hlMatch) {
        currentStep.highlight = hlMatch[1].trim();
      } else {
        const cleanDetail = trimmed.replace(/^[│|\s\─\>]+/, '').trim();
        if (cleanDetail) {
          currentStep.details.push(cleanDetail);
        }
      }
    }
  }
  if (currentStep) steps.push(currentStep);
  return steps;
}

export function LinhaDoTempoAnimada({ raw }: { raw: string }) {
  const steps = useMemo(() => parseTimeline(raw), [raw]);

  if (!steps.length) return null;

  return (
    <div className="my-5 sm:my-7 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-[#18181b] to-[#121214] p-3 sm:p-5 shadow-xl">
      {/* Header do Container: Totalmente Responsivo no Mobile */}
      <div className="flex items-center justify-between gap-2.5 mb-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-sm">
            <Milestone className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white truncate">
              Ordem Cronológica do Processo
            </h4>
            <p className="text-[11px] text-neutral-400 truncate">
              Sequência jurídica passo a passo
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider text-primary bg-primary/10 border border-primary/20 whitespace-nowrap">
            {steps.length} etapas
          </span>
        </div>
      </div>

      {/* Lista de Etapas em Linha do Tempo com Alinhamento 100% Perfeito */}
      <div className="space-y-3 sm:space-y-3.5">
        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isConsumacao = !!step.highlight;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10px' }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className="relative flex items-start gap-2.5 sm:gap-3.5"
            >
              {/* Coluna do Marcador e da Linha Contínua (Garante Alinhamento Vertical 100% Perfeito) */}
              <div className="relative flex flex-col items-center shrink-0 self-stretch pt-0.5">
                {/* Marcador Circular Numerado */}
                <div
                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black shrink-0 z-10 transition-transform duration-200 shadow-sm ${
                    isConsumacao
                      ? 'bg-rose-500 text-white border-2 border-rose-300 shadow-rose-500/30 animate-pulse'
                      : isLast
                      ? 'bg-emerald-500 text-white border-2 border-emerald-300 shadow-emerald-500/20'
                      : 'bg-[#18181b] text-white border-2 border-primary shadow-primary/20'
                  }`}
                >
                  {isConsumacao ? (
                    <AlertTriangle className="w-3 h-3" />
                  ) : isLast ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Linha que Conecta Este Passo ao Próximo */}
                {!isLast && (
                  <div
                    className="w-[2px] grow my-1 rounded-full bg-gradient-to-b from-primary via-amber-400/80 to-emerald-400/80 shadow-[0_0_6px_rgba(244,63,94,0.3)]"
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Card de Conteúdo da Etapa */}
              <div
                onClick={() => haptic.selection()}
                className={`flex-1 min-w-0 rounded-xl sm:rounded-2xl border transition-all duration-200 p-3 sm:p-4 backdrop-blur-sm shadow-md ${
                  isConsumacao
                    ? 'border-rose-500/35 bg-gradient-to-br from-rose-950/25 via-[#18181b] to-[#121214]'
                    : isLast
                    ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[#18181b] to-[#121214]'
                    : 'border-white/[0.08] bg-[#18181b]/90 hover:border-white/20 hover:bg-[#222226]'
                }`}
              >
                {/* Badges do Passo */}
                <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider border ${
                      isConsumacao
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isLast
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-primary/15 text-primary border-primary/30'
                    }`}
                  >
                    <Clock className="w-3 h-3 shrink-0" />
                    {step.tag}
                  </span>

                  {step.highlight && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm">
                      <Bookmark className="w-3 h-3 text-amber-300 shrink-0" />
                      {step.highlight}
                    </span>
                  )}
                </div>

                {/* Texto Principal */}
                {step.text && (
                  <p className="font-sans text-[13px] sm:text-[14px] md:text-[15px] font-medium text-neutral-100 leading-snug sm:leading-relaxed break-words">
                    {step.text}
                  </p>
                )}

                {/* Detalhes Complementares */}
                {step.details.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] space-y-1.5">
                    {step.details.map((d, dIdx) => {
                      const isSituacao = d.startsWith('Situação');
                      return (
                        <div
                          key={dIdx}
                          className={`text-xs leading-relaxed flex items-start gap-1.5 ${
                            isSituacao
                              ? 'text-amber-200/95 font-semibold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20'
                              : 'text-neutral-300/90'
                          }`}
                        >
                          {!isSituacao && (
                            <ChevronRight className="w-3.5 h-3.5 text-primary/70 shrink-0 mt-0.5" />
                          )}
                          <span className="break-words">{d}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
