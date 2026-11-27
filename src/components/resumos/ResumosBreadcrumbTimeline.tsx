import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { haptic } from '@/lib/nativeHaptics';
import { cn } from '@/lib/utils';

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

  return (
    <nav
      aria-label="Linha do tempo de navegação"
      className={cn(
        'w-full overflow-x-auto scrollbar-none',
        className
      )}
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
  );
}
