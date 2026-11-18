import React, { useState } from 'react';
import { ArrowDown, Copy, Check, Workflow } from 'lucide-react';
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
  hideHeader?: boolean;
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
        if (colonIdx > 0 && colonIdx <= 18) {
          const prefix = s.slice(0, colonIdx).trim();
          const rest = s.slice(colonIdx + 1).trim();
          return {
            id: idx + 1,
            label: rest || prefix,
            badge: rest ? prefix : undefined,
            isDecision: isDecision || /^(sim|não|nao|se|condição)/i.test(prefix),
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
  title = 'Rito Passo a Passo',
  hideHeader = false,
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

  // Se não foi possível converter em etapas visuais, renderiza como bloco formatado limpo
  if (!steps || steps.length < 2) {
    return (
      <div className="my-3 rounded-xl border border-rose-950/60 bg-[#12070a] overflow-hidden shadow-lg">
        {!hideHeader && (
          <div className="flex items-center justify-between px-3.5 py-2 bg-rose-950/30 border-b border-rose-900/30">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-300 font-mono">
              <Workflow className="w-4 h-4 text-rose-400" />
              <span>{title}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-xs text-rose-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-rose-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        )}
        <pre className="p-3.5 text-xs sm:text-sm text-zinc-200 font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div className="my-3 w-full rounded-xl border border-rose-950/70 bg-[#0e0407] overflow-hidden shadow-xl">
      {/* Top Header opcional (oculto quando já existe cabeçalho da seção) */}
      {!hideHeader && (
        <div className="px-4 py-2.5 bg-rose-950/30 border-b border-rose-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#240b12] border border-rose-500/35 flex items-center justify-center">
              <Workflow className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-100 font-mono">
                {title}
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium">
                {steps.length} etapas lógicas
              </p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#240b12] hover:bg-[#320f1a] border border-rose-500/30 text-xs text-rose-300 hover:text-white transition-all active:scale-95"
            title="Copiar etapas"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-rose-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      )}

      {/* Steps Pipeline — 100% no tom vermelho/vinho unificado */}
      <div className="p-3.5 sm:p-4.5 relative">
        {/* Linha vertical conectora no fundo */}
        <div className="absolute left-[30px] sm:left-[34px] top-6 bottom-6 w-0.5 bg-rose-500/30" />

        <div className="space-y-3 relative">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isFirst = idx === 0;

            return (
              <div key={step.id} className="relative flex items-start gap-3 sm:gap-3.5 group">
                {/* Node Number Circle */}
                <div
                  className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs font-mono shadow-md transition-transform duration-200 group-hover:scale-105 ${
                    isFirst
                      ? 'bg-rose-600 text-white ring-2 ring-rose-500/30 border border-rose-400'
                      : step.isDecision
                      ? 'bg-[#2b0c16] text-rose-100 ring-2 ring-rose-500/30 border border-rose-500/50'
                      : isLast
                      ? 'bg-[#200a12] text-rose-200 border border-rose-500/40'
                      : 'bg-[#18070d] text-rose-300 border border-rose-900/50'
                  }`}
                >
                  {String(step.id).padStart(2, '0')}
                </div>

                {/* Step Card Content — Sem fundo chamativo, borda vinho discreta */}
                <div className="flex-1 min-w-0 p-3 sm:p-3.5 rounded-xl border border-rose-950/70 bg-[#13060a] hover:border-rose-500/30 transition-all shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md font-mono bg-[#240b12] text-rose-300 border border-rose-500/30">
                      {step.badge || (isFirst ? 'Início / Fato' : isLast ? 'Resultado / Conclusão' : step.isDecision ? 'Ponto Crítico / Análise' : `Etapa ${step.id}`)}
                    </span>
                  </div>

                  <p className="font-bold text-zinc-100 text-sm sm:text-[14.5px] leading-snug">
                    {step.label}
                  </p>

                  {step.sublabel && (
                    <p className="mt-1 text-xs text-zinc-300/85 leading-relaxed font-sans">
                      {step.sublabel}
                    </p>
                  )}
                </div>

                {/* Setinha indicadora entre nós */}
                {!isLast && (
                  <div className="absolute left-[12px] sm:left-[14px] -bottom-2.5 z-20 w-4 h-4 flex items-center justify-center text-rose-400/70 pointer-events-none">
                    <ArrowDown className="w-3 h-3" />
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
