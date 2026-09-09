import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle2, ChevronRight, Milestone, Sparkles } from 'lucide-react';
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
    <div className="my-8 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#12141f] to-[#0c0e16] p-4 sm:p-7 shadow-2xl relative overflow-hidden">
      {/* Header do Container */}
      <div className="flex items-center justify-between gap-3 mb-8 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
            <Milestone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
              Ordem Cronológica do Processo
            </h4>
            <p className="text-xs text-neutral-400">
              Acompanhe a sequência jurídica passo a passo
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
          {steps.length} etapas
        </span>
      </div>

      {/* Linha do Tempo Vertical */}
      <div className="relative pl-6 sm:pl-8 space-y-6">
        {/* Trilho Vertical Gradiente Iluminado */}
        <div
          className="absolute left-[11px] sm:left-[15px] top-4 bottom-8 w-[3px] rounded-full bg-gradient-to-b from-primary via-amber-400/80 to-emerald-400/80 shadow-[0_0_10px_rgba(244,63,94,0.35)] pointer-events-none"
          aria-hidden="true"
        />

        {steps.map((step, idx) => {
          const isLast = idx === steps.length - 1;
          const isConsumacao = !!step.highlight;

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -18, scale: 0.98 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="relative group"
            >
              {/* Marcador Circular no Trilho */}
              <div
                className={`absolute -left-[30px] sm:-left-[37px] top-3 -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black transition-all duration-300 shadow-md ${
                  isConsumacao
                    ? 'bg-rose-500 text-white border-2 border-rose-300 shadow-rose-500/40 ring-4 ring-rose-500/20 animate-pulse'
                    : isLast
                    ? 'bg-emerald-500 text-white border-2 border-emerald-300 shadow-emerald-500/30'
                    : 'bg-[#151827] text-white border-2 border-primary shadow-primary/30 group-hover:scale-110 group-hover:border-amber-400'
                }`}
              >
                {isConsumacao ? (
                  <AlertTriangle className="w-3.5 h-3.5" />
                ) : isLast ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Card da Etapa */}
              <div
                onClick={() => haptic.selection()}
                className={`rounded-2xl border transition-all duration-200 p-4 sm:p-5 backdrop-blur-sm shadow-lg ${
                  isConsumacao
                    ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/30 via-[#18131d] to-[#12141f] shadow-rose-950/20'
                    : isLast
                    ? 'border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-[#131a1e] to-[#12141f]'
                    : 'border-white/[0.08] bg-[#151724]/85 hover:border-white/20 hover:bg-[#191c2c]'
                }`}
              >
                {/* Tag / Badge */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider border ${
                      isConsumacao
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isLast
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-primary/15 text-primary border-primary/30'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {step.tag}
                  </span>

                  {/* Alerta de Consumação ou Ponto Crítico */}
                  {step.highlight && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-rose-500/25 text-rose-200 border border-rose-400/50 shadow-sm shadow-rose-500/30">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      {step.highlight}
                    </span>
                  )}
                </div>

                {/* Texto Principal do Passo */}
                {step.text && (
                  <p className="font-sans text-[15px] sm:text-[16px] md:text-[17px] font-semibold text-white leading-relaxed">
                    {step.text}
                  </p>
                )}

                {/* Detalhes / Desdobramentos */}
                {step.details.length > 0 && (
                  <div className="mt-3 space-y-2 pt-3 border-t border-white/[0.06]">
                    {step.details.map((d, dIdx) => {
                      const isSituacao = d.startsWith('Situação');
                      return (
                        <div
                          key={dIdx}
                          className={`text-xs sm:text-sm leading-relaxed flex items-start gap-2 ${
                            isSituacao
                              ? 'text-amber-200/90 font-medium bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20'
                              : 'text-neutral-300/90 pl-1'
                          }`}
                        >
                          {!isSituacao && (
                            <ChevronRight className="w-3.5 h-3.5 text-primary/70 shrink-0 mt-0.5" />
                          )}
                          <span>{d}</span>
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
