import React, { useState } from 'react';
import { GitBranch, ArrowDown, ArrowRight, Copy, Check, Workflow, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/nativeHaptics';

interface FluxoStep {
  id: number;
  label: string;
  sublabel?: string;
  badge?: string;
  isDecision?: boolean;
}

interface AssistenteFluxogramaCardProps {
  content: string;
  title?: string;
}

/**
 * Analisa o conteúdo de texto/código e extrai etapas para montar um fluxograma visual e didático.
 */
function parseFluxoSteps(rawContent: string): FluxoStep[] | null {
  const clean = rawContent.trim();
  if (!clean) return null;

  // 1. Checa se é um fluxo linear em uma linha ou poucas linhas com setas: [A] -> [B] -> [C]
  const arrowDelimiters = /\s*(?:-->|->|➔|→|=>|⇒)\s*/;
  
  // Linhas limpas sem comentários mermaid
  const lines = clean
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('graph ') && !l.startsWith('flowchart ') && !l.startsWith('%%'));

  // Caso 1: Separado por setas na mesma linha ou entre linhas
  if (clean.includes('->') || clean.includes('-->') || clean.includes('➔') || clean.includes('→')) {
    const rawSteps: string[] = [];
    for (const line of lines) {
      if (line === '↓' || line === '➔' || line === '→') continue;
      const parts = line.split(arrowDelimiters);
      for (const p of parts) {
        const trimmed = p.replace(/^[\[\(\{]+/, '').replace(/[\]\)\}]+$/, '').trim();
        if (trimmed) rawSteps.push(trimmed);
      }
    }

    if (rawSteps.length >= 2) {
      return rawSteps.map((s, idx) => {
        const isDecision = s.toLowerCase().includes('?') || s.toLowerCase().startsWith('se ') || s.includes('decisão');
        const colonIdx = s.indexOf(':');
        if (colonIdx > 0 && colonIdx < 30) {
          return {
            id: idx + 1,
            label: s.slice(0, colonIdx).trim(),
            sublabel: s.slice(colonIdx + 1).trim(),
            isDecision,
          };
        }
        return {
          id: idx + 1,
          label: s,
          isDecision,
        };
      });
    }
  }

  // Caso 2: Linhas numeradas ou com marcadores de etapas (ex: "1. Notícia-crime", "Etapa 2: Inquérito")
  const stepPattern = /^(?:(?:\d+[\.\)]|etapa\s*\d+:?|passo\s*\d+:?|fase\s*\d+:?))\s*(.+)$/i;
  const numberedSteps = lines.filter((l) => stepPattern.test(l));
  if (numberedSteps.length >= 2) {
    return numberedSteps.map((line, idx) => {
      const match = line.match(stepPattern);
      const text = match ? match[1].trim() : line;
      const colonIdx = text.indexOf(':');
      if (colonIdx > 0 && colonIdx < 30) {
        return {
          id: idx + 1,
          label: text.slice(0, colonIdx).trim(),
          sublabel: text.slice(colonIdx + 1).trim(),
        };
      }
      return {
        id: idx + 1,
        label: text,
      };
    });
  }

  return null;
}

export const AssistenteFluxogramaCard: React.FC<AssistenteFluxogramaCardProps> = ({
  content,
  title = 'Fluxograma Passo a Passo',
}) => {
  const [copied, setCopied] = useState(false);
  const steps = parseFluxoSteps(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      toast.success('Fluxograma copiado!');
      haptic.selection();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Se não foi possível converter em etapas visuais, renderiza como bloco de código formatado premium
  if (!steps || steps.length < 2) {
    return (
      <div className="my-4 rounded-2xl border border-white/15 bg-zinc-950/95 overflow-hidden shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04] border-b border-white/10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-300">
            <Workflow className="w-4 h-4 text-rose-400" />
            <span>{title}</span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-zinc-300 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
        <pre className="p-4 text-xs sm:text-sm text-zinc-200 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-5 w-full rounded-2xl border border-rose-500/30 bg-gradient-to-b from-zinc-900/95 via-zinc-950/95 to-black/95 overflow-hidden shadow-2xl backdrop-blur-md">
      {/* Top Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shadow-inner">
            <Workflow className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white font-display flex items-center gap-1.5">
              <span>{title}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </h4>
            <p className="text-[10px] text-zinc-400 font-medium tracking-wide">
              Sequência lógica e rito esquematizado ({steps.length} etapas)
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-zinc-300 hover:text-white transition-all active:scale-95"
          title="Copiar etapas"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
        </button>
      </div>

      {/* Steps Pipeline */}
      <div className="p-4 sm:p-5 relative">
        {/* Linha vertical conectora no fundo */}
        <div className="absolute left-[33px] sm:left-[37px] top-7 bottom-7 w-0.5 bg-gradient-to-b from-rose-500 via-amber-500 to-emerald-500 opacity-40" />

        <div className="space-y-3.5 relative">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isFirst = idx === 0;

            return (
              <div key={step.id} className="relative flex items-start gap-3 sm:gap-4 group">
                {/* Node Number Circle */}
                <div
                  className={`relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs sm:text-sm font-mono shadow-lg transition-transform duration-200 group-hover:scale-105 ${
                    isFirst
                      ? 'bg-rose-500 text-white ring-4 ring-rose-500/20 border border-rose-400'
                      : isLast
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 border border-emerald-400'
                      : step.isDecision
                      ? 'bg-amber-500 text-black ring-4 ring-amber-500/20 border border-amber-400'
                      : 'bg-zinc-900 text-zinc-200 border border-white/15'
                  }`}
                >
                  {String(step.id).padStart(2, '0')}
                </div>

                {/* Step Card Content */}
                <div
                  className={`flex-1 min-w-0 p-3 sm:p-3.5 rounded-xl border transition-all ${
                    step.isDecision
                      ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400/60 shadow-amber-950/20'
                      : isLast
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400/60 shadow-emerald-950/20'
                      : 'bg-zinc-900/80 border-white/10 hover:border-white/20'
                  } shadow-md backdrop-blur-sm`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md font-mono ${
                        isFirst
                          ? 'bg-rose-500/20 text-rose-300'
                          : isLast
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : step.isDecision
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-white/5 text-zinc-400'
                      }`}
                    >
                      {isFirst ? 'Início / Gatilho' : isLast ? 'Resultado / Conclusão' : step.isDecision ? 'Decisão / Ponto Crítico' : `Etapa ${step.id}`}
                    </span>
                  </div>

                  <p className="font-bold text-zinc-100 text-xs sm:text-sm leading-snug">
                    {step.label}
                  </p>

                  {step.sublabel && (
                    <p className="mt-1 text-xs text-zinc-300/85 leading-relaxed font-sans">
                      {step.sublabel}
                    </p>
                  )}
                </div>

                {/* Setinha indicadora entre nós se não for o último */}
                {!isLast && (
                  <div className="absolute left-[14px] sm:left-[16px] -bottom-3 z-20 w-4 h-4 flex items-center justify-center text-amber-400 pointer-events-none">
                    <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

