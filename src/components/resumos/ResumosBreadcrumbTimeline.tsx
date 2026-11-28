import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';

const HINT_DISMISSED_KEY = 'resumos_breadcrumb_hint_dismissed';

export interface BreadcrumbStep {
  label: string;
  to?: string;
}

interface ResumosBreadcrumbTimelineProps {
  steps: BreadcrumbStep[];
  accentColor?: string;
  className?: string;
}

const METODO_LABEL: Record<string, string> = {
  conceitos: 'Conceitual',
  cornell: 'Cornell',
  feynman: 'Feynman',
};

export function getMetodoLabel(metodo?: string | null): string {
  if (!metodo) return 'Resumos';
  return METODO_LABEL[metodo] || 'Resumos';
}

export default function ResumosBreadcrumbTimeline({
  steps,
  accentColor = '#10b981',
  className,
}: ResumosBreadcrumbTimelineProps) {
  const navigate = useNavigate();
  const hasClickable = steps.some((s, i) => Boolean(s.to) && i < steps.length - 1);
  const [showHint, setShowHint] = useState(() => {
    try {
      return typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(HINT_DISMISSED_KEY);
    } catch {
      return false;
    }
  });

  const dismissHint = () => {
    setShowHint(false);
    try {
      sessionStorage.setItem(HINT_DISMISSED_KEY, '1');
    } catch {}
  };

  return (
    <div className={cn('w-full', className)}>
      <nav
        aria-label="Linha do tempo de navegação"
        className="w-full overflow-x-auto scrollbar-none"
      >
        <ol className="flex items-center gap-1.5 min-w-max py-1">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;
            const isClickable = Boolean(step.to) && !isLast;

            return (
              <li key={`${step.label}-${idx}`} className="flex items-center gap-1.5">
                {isClickable ? (
                  <button
                    type="button"
                    onClick={() => {
                      haptic.selection();
                      dismissHint();
                      if (step.to) navigate(step.to);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    <span className="max-w-[140px] truncate">{step.label}</span>
                  </button>
                ) : (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                    style={{
                      backgroundColor: `${accentColor}1A`,
                      borderColor: `${accentColor}4D`,
                      color: accentColor,
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="max-w-[180px] truncate">{step.label}</span>
                  </span>
                )}

                {!isLast && (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {hasClickable && showHint && (
        <div className="mt-1 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[10.5px] text-zinc-400">
          <span>Toque em qualquer etapa acima para voltar rápido</span>
          <button
            type="button"
            onClick={dismissHint}
            aria-label="Dispensar dica"
            className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
